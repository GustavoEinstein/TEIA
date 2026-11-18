import os
import json
import re
from abc import ABC, abstractmethod
from dotenv import load_dotenv
from django.conf import settings
from openai import OpenAI

load_dotenv()

def _clean_env(value: str, default: str = "") -> str:
    """Remove espaços e aspas acidentais vindas do arquivo .env."""
    if not value:
        return default
    return str(value).strip().strip('"').strip("'")


class BaseLLMProvider(ABC):
    """
    Classe base com prompt estruturado para planejamento pedagógico.
    Força saída JSON estrita com validação de BNCC.
    """

    EXPECTED_KEYS = {
        "titulo": str,
        "nivel": str,
        "categoria": str,
        "bncc": list,
        "bncc_computacao": list,
        "metodologia": str,
        "duracao": str,
        "recursos": list,
        "passo_a_passo": list,
        "avaliacao": str,
        "prompts_ia": str,
    }

    NIVEIS_VALIDOS = [
        "Fundamental 1", "Fundamental 2", "Ensino Médio", "Ensino Superior"
    ]
    CATEGORIAS_VALIDAS = [
        "Plano de Aula", "Sequência Didática", "Rubrica de Avaliação",
        "Texto de Apoio", "Slide / Apresentação", "Lista de Exercícios",
        "Quiz / Questões", "Imagens / Vídeos", "Estudo de Caso",
        "Simulação / Roleplay", "Prompt para Alunos"
    ]

    # JSON Schema estrito para travar a geração no Ollama / OpenAI compatible
    RESPONSE_JSON_SCHEMA = {
        "name": "plano_aula_schema",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "titulo": {"type": "string"},
                "nivel": {"type": "string", "enum": NIVEIS_VALIDOS},
                "categoria": {"type": "string", "enum": CATEGORIAS_VALIDAS},
                "bncc": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "codigo": {"type": "string"},
                            "descricao": {"type": "string"}
                        },
                        "required": ["codigo", "descricao"],
                        "additionalProperties": False
                    }
                },
                "bncc_computacao": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "codigo": {"type": "string"},
                            "descricao": {"type": "string"}
                        },
                        "required": ["codigo", "descricao"],
                        "additionalProperties": False
                    }
                },
                "metodologia": {"type": "string"},
                "duracao": {"type": "string"},
                "recursos": {"type": "array", "items": {"type": "string"}},
                "passo_a_passo": {"type": "array", "items": {"type": "string"}},
                "avaliacao": {"type": "string"}
            },
            "required": [
                "titulo", "nivel", "categoria", "bncc", "bncc_computacao",
                "metodologia", "duracao", "recursos", "passo_a_passo", "avaliacao"
            ],
            "additionalProperties": False
        }
    }

    def build_prompt(self, raw_text: str, contexto_bncc: str = "") -> str:
        """
        Prompt enxuto para acelerar o prefill na CPU.
        Não pede 'prompts_ia' para economizar tokens de saída.
        """
        bncc_section = (
            f"\nCONTEXTO BNCC (use APENAS códigos presentes abaixo):\n{contexto_bncc}\n"
            if contexto_bncc else ""
        )

        return f"""Expanda a ideia do professor em um planejamento pedagógico estruturado em JSON.

Ideia do professor:
"{raw_text.strip()}"
{bncc_section}
REGRAS:
1. Responda APENAS com JSON válido, sem markdown.
2. BNCC: use APENAS códigos oficiais completos (ex: EF06HI07, EM13CHS101, EF06CO01). Nunca abrevie nem invente códigos.
3. "nivel" permitido: {", ".join(self.NIVEIS_VALIDOS)}.
4. "categoria" permitida: {", ".join(self.CATEGORIAS_VALIDAS)}.
5. "passo_a_passo": lista de strings numeradas com tempo estimado por etapa."""

    def _validate_bncc_code(self, codigo: str) -> bool:
        """
        Valida formato oficial BNCC:
        - EF (ex: EF06HI07, EF15AR01, EF69LP01, EF06CO01)
        - EM (ex: EM13CHS101, EM13LGG101, EM13LP01, EM13CO01)
        """
        if not codigo or not isinstance(codigo, str):
            return False
        pattern = r'^(EF|EM)\d{2}[A-Z]{2,3}\d{2,3}\$'
        return bool(re.match(pattern, codigo.strip().upper()))

    def _sanitize_bncc_array(self, bncc_raw) -> list:
        """Normaliza e valida array de BNCC. Remove itens inválidos."""
        if not bncc_raw or not isinstance(bncc_raw, list):
            return []

        sanitized = []
        seen_codes = set()
        for item in bncc_raw:
            if not isinstance(item, dict):
                continue
            codigo = str(item.get("codigo", "")).strip().upper()
            descricao = str(item.get("descricao", "")).strip()

            if not codigo or not descricao or codigo in seen_codes:
                continue

            if not self._validate_bncc_code(codigo):
                print(f"⚠️ BNCC inválido removido: {codigo}")
                continue

            seen_codes.add(codigo)
            sanitized.append({"codigo": codigo, "descricao": descricao})

        return sanitized

    def _validate_and_sanitize(self, data: dict, original_prompt: str) -> dict:
        """Validação rigorosa + sanitização da resposta da IA."""
        for key, expected_type in self.EXPECTED_KEYS.items():
            if key not in data:
                data[key] = [] if expected_type == list else ""

        if data.get("nivel") not in self.NIVEIS_VALIDOS:
            data["nivel"] = "Fundamental 2"

        if data.get("categoria") not in self.CATEGORIAS_VALIDAS:
            data["categoria"] = "Plano de Aula"

        data["bncc"] = self._sanitize_bncc_array(data.get("bncc"))
        data["bncc_computacao"] = self._sanitize_bncc_array(data.get("bncc_computacao"))

        data["recursos"] = [str(r).strip() for r in data.get("recursos", []) if str(r).strip()]
        data["passo_a_passo"] = [str(p).strip() for p in data.get("passo_a_passo", []) if str(p).strip()]

        data["titulo"] = str(data.get("titulo", "Plano de Aula")).strip()[:200]
        data["metodologia"] = str(data.get("metodologia", "")).strip()[:500]
        data["duracao"] = str(data.get("duracao", "1 aula de 50 min")).strip()[:100]
        data["avaliacao"] = str(data.get("avaliacao", "")).strip()[:500]

        data["modelo_ia"] = "IA DA UNB"
        data["prompts_ia"] = original_prompt.strip() if original_prompt else ""

        return data

    def parse_json_response(self, raw_response: str, original_prompt: str = "") -> dict:
        """Extrai JSON da resposta e aplica validação completa."""
        clean_text = re.sub(r'^```json\s*|^```\s*|\s*```$', '', raw_response.strip(), flags=re.MULTILINE).strip()

        json_match = re.search(r'\{.*\}', clean_text, flags=re.DOTALL)
        if json_match:
            clean_text = json_match.group(0)

        try:
            data = json.loads(clean_text)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"IA não retornou JSON válido: {e}. Resposta: {raw_response[:200]}..."
            )

        return self._validate_and_sanitize(data, original_prompt)

    @abstractmethod
    def catalog_production(self, raw_text: str, contexto_bncc: str = "") -> dict:
        pass


class LocalOllamaProvider(BaseLLMProvider):
    """Provedor Ollama local otimizado para inferência em CPU."""

    def __init__(self):
        raw_url = getattr(settings, 'LOCAL_LLM_URL', None) or os.getenv('LOCAL_LLM_URL', 'http://localhost:11434/v1')
        raw_model = getattr(settings, 'LOCAL_LLM_MODEL', None) or os.getenv('LOCAL_LLM_MODEL', 'qwen2.5:7b')

        self.base_url = _clean_env(raw_url)
        self.model_name = _clean_env(raw_model)

        self.client = OpenAI(
            api_key="ollama",
            base_url=self.base_url,
            timeout=180.0,  # Margem segura para picos de CPU em modelos 7B
        )

    def catalog_production(self, raw_text: str, contexto_bncc: str = "") -> dict:
        prompt = self.build_prompt(raw_text, contexto_bncc)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Você é um assistente pedagógico especialista em BNCC. "
                            "Responda estritamente no schema JSON solicitado."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                response_format={
                    "type": "json_schema",
                    "json_schema": self.RESPONSE_JSON_SCHEMA,
                },
                extra_body={
                    "keep_alive": -1,  # Mantém o modelo carregado na RAM do servidor permanentemente
                    "options": {
                        "num_ctx": 4096,     # Reduz uso de RAM e acelera alocação de KV cache
                        "num_predict": 1024, # Limita saída máxima para evitar travamentos na CPU
                    }
                }
            )
            raw_response = response.choices[0].message.content
            return self.parse_json_response(raw_response, original_prompt=raw_text)

        except Exception as err:
            causa = repr(err.__cause__) if getattr(err, '__cause__', None) else repr(err)
            print(f"\n❌ Falha Ollama Local ({self.model_name}): {causa}")
            raise RuntimeError(f"Erro no provedor Local ({self.model_name}): {causa}")


class UnbAIProvider(BaseLLMProvider):
    """Provedor LiteLLM UnB."""

    def __init__(self):
        raw_url = getattr(settings, 'UNB_LLM_URL', None) or os.getenv('UNB_LLM_URL', '[https://ia-router.unb.br/v1/](https://ia-router.unb.br/v1/)')
        raw_model = getattr(settings, 'UNB_LLM_MODEL', None) or os.getenv('UNB_LLM_MODEL', 'UnB-Llama-3.3-70B-Instruct')
        raw_key = getattr(settings, 'UNB_API_KEY', None) or os.getenv('UNB_API_KEY', '')

        self.base_url = _clean_env(raw_url)
        if self.base_url and not self.base_url.startswith('http'):
            self.base_url = f"https://{self.base_url}"
        if not self.base_url.endswith('/v1') and not self.base_url.endswith('/v1/'):
            self.base_url = self.base_url.rstrip('/') + '/v1/'

        self.model_name = _clean_env(raw_model)
        self.api_key = _clean_env(raw_key)

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=120.0,
        )

    def catalog_production(self, raw_text: str, contexto_bncc: str = "") -> dict:
        prompt = self.build_prompt(raw_text, contexto_bncc)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Consultor pedagógico rigoroso. "
                            "Saída: JSON estrito com chaves titulo, nivel, categoria, "
                            "bncc, bncc_computacao, metodologia, duracao, recursos, passo_a_passo, avaliacao."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            raw_response = response.choices[0].message.content
            return self.parse_json_response(raw_response, original_prompt=raw_text)

        except Exception as err:
            causa = repr(err.__cause__) if getattr(err, '__cause__', None) else repr(err)
            print(f"\n❌ Falha UnB LiteLLM ({self.model_name}): {causa}")
            raise RuntimeError(f"Erro no provedor UnB ({self.model_name}): {causa}")


class GeminiProvider(BaseLLMProvider):
    """Provedor Google Gemini."""

    def __init__(self):
        import google.generativeai as genai

        raw_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        api_key = _clean_env(raw_key)

        if not api_key:
            raise ValueError("GEMINI_API_KEY não encontrada no .env.")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')

    def catalog_production(self, raw_text: str, contexto_bncc: str = "") -> dict:
        prompt = self.build_prompt(raw_text, contexto_bncc)

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            )
            return self.parse_json_response(response.text.strip(), original_prompt=raw_text)
        except Exception as err:
            raise RuntimeError(f"Erro na API Gemini: {str(err)}")


_PROVIDER_INSTANCE = None

def get_llm_provider() -> BaseLLMProvider:
    """Retorna instância reutilizável do provedor para manter pool HTTP."""
    global _PROVIDER_INSTANCE
    if _PROVIDER_INSTANCE is not None:
        return _PROVIDER_INSTANCE

    raw_provider = getattr(settings, 'LLM_PROVIDER', None) or os.getenv('LLM_PROVIDER', 'local')
    provider = _clean_env(raw_provider).lower()

    if provider == 'local':
        _PROVIDER_INSTANCE = LocalOllamaProvider()
    elif provider == 'unb':
        _PROVIDER_INSTANCE = UnbAIProvider()
    elif provider == 'gemini':
        _PROVIDER_INSTANCE = GeminiProvider()
    else:
        raise ValueError(f"Provedor LLM inválido: {provider}")

    return _PROVIDER_INSTANCE