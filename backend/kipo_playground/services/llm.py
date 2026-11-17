import os
import json
import re
from abc import ABC, abstractmethod
from dotenv import load_dotenv
from django.conf import settings
from openai import OpenAI

# Garante que o arquivo .env seja lido
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

    # Schema esperado da resposta da IA (backend-driven UI)
    EXPECTED_KEYS = {
        "titulo": str,
        "nivel": str,
        "categoria": str,
        "bncc": list,           # Array de objetos: {"codigo": "", "descricao": ""}
        "bncc_computacao": list,
        "metodologia": str,
        "duracao": str,
        "recursos": list,       # Array de strings
        "passo_a_passo": list,  # Array de strings (substitui experiencia)
        "avaliacao": str,
        "prompts_ia": str,
    }

    # Valores permitidos para campos controlados
    NIVEIS_VALIDOS = [
        "Fundamental 1", "Fundamental 2", "Ensino Médio", "Ensino Superior"
    ]
    CATEGORIAS_VALIDAS = [
        "Plano de Aula", "Sequência Didática", "Rubrica de Avaliação",
        "Texto de Apoio", "Slide / Apresentação", "Lista de Exercícios",
        "Quiz / Questões", "Imagens / Vídeos", "Estudo de Caso",
        "Simulação / Roleplay", "Prompt para Alunos"
    ]

    def build_prompt(self, raw_text: str, contexto_bncc: str = "") -> str:
        """
        Constrói prompt que força JSON estruturado.
        Backend define o contrato, frontend apenas renderiza.
        """
        bncc_section = f"\nCONTEXTO BNCC (use APENAS códigos deste texto):\n{contexto_bncc}\n" if contexto_bncc else ""

        return f"""Você é um Assistente Pedagógico especialista em BNCC.
Sua tarefa: expandir a ideia do professor em um plano de aula ESTRUTURADO EM JSON.

Ideia do professor:
"{raw_text}"
{bncc_section}

REGRAS OBRIGATÓRIAS (VIOLAÇÃO = RESPOSTA INVÁLIDA):
1. RESPONDA APENAS com um objeto JSON válido. NENHUM texto fora das chaves {{}}.
2. NÃO use markdown (```json```), NÃO use **bold**, NÃO use *itálico*.
3. BNCC: Use APENAS códigos oficiais completos (ex: EF06HI07, EM13CHS101).
   PROIBIDO abreviar (H11, G12) ou inventar.
4. Campo "bncc" e "bncc_computacao" devem ser ARRAYS de objetos:
   {{"codigo": "EF06HI07", "descricao": "Descrição completa da habilidade"}}
5. Campo "passo_a_passo" deve ser ARRAY de strings (cada passo = uma etapa).
6. "nivel" EXATAMENTE: {", ".join(self.NIVEIS_VALIDOS)}
7. "categoria" EXATAMENTE: {", ".join(self.CATEGORIAS_VALIDAS)}

ESTRUTURA JSON OBRIGATÓRIA:
{{
  "titulo": "Título engajador da aula",
  "nivel": "Fundamental 2",
  "categoria": "Plano de Aula",
  "bncc": [
    {{"codigo": "EF06HI07", "descricao": "Analisar transformações..."}},
    {{"codigo": "EF06HI08", "descricao": "Identificar relações..."}}
  ],
  "bncc_computacao": [
    {{"codigo": "EF06CP01", "descricao": "Resolver problemas..."}}
  ],
  "metodologia": "Aula Expositiva Dialogada com Estudo de Caso",
  "duracao": "2 aulas de 50 min",
  "recursos": ["Quadro branco", "Projetor", "Textos impressos"],
  "passo_a_passo": [
    "1. Acolhida e contextualização do tema (10 min)",
    "2. Apresentação do estudo de caso (15 min)",
    "3. Debate em grupos sobre impactos sociais (20 min)",
    "4. Sistematização no quadro e fechamento (5 min)"
  ],
  "avaliacao": "Rubrica com critérios: participação, argumentação, registro escrito",
  "prompts_ia": "{raw_text.strip()}"
}}"""

    def _validate_bncc_code(self, codigo: str) -> bool:
        """Valida formato básico de código BNCC (EFXXYYZZ ou EMXXYYZZ)."""
        if not codigo or not isinstance(codigo, str):
            return False
        pattern = r'^(EF|EM)\d{2}[A-Z]{2}\d{2,3}$'
        return bool(re.match(pattern, codigo.strip().upper()))

    def _sanitize_bncc_array(self, bncc_raw) -> list:
        """Normaliza e valida array de BNCC. Remove itens inválidos."""
        if not bncc_raw or not isinstance(bncc_raw, list):
            return []

        sanitized = []
        for item in bncc_raw:
            if not isinstance(item, dict):
                continue
            codigo = str(item.get("codigo", "")).strip().upper()
            descricao = str(item.get("descricao", "")).strip()

            if not codigo or not descricao:
                continue

            # Valida formato do código
            if not self._validate_bncc_code(codigo):
                print(f"⚠️ BNCC inválido removido: {codigo}")
                continue

            sanitized.append({"codigo": codigo, "descricao": descricao})

        return sanitized

    def _validate_and_sanitize(self, data: dict, original_prompt: str) -> dict:
        """
        Validação rigorosa + sanitização da resposta da IA.
        Garante contrato backend-driven UI.
        """
        # Força campos obrigatórios
        for key, expected_type in self.EXPECTED_KEYS.items():
            if key not in data:
                if expected_type == list:
                    data[key] = []
                elif expected_type == str:
                    data[key] = ""

        # Validações de enum
        if data.get("nivel") not in self.NIVEIS_VALIDOS:
            data["nivel"] = "Fundamental 2"  # fallback seguro

        if data.get("categoria") not in self.CATEGORIAS_VALIDAS:
            data["categoria"] = "Plano de Aula"

        # Sanitização BNCC (crítico para anti-alucinação)
        data["bncc"] = self._sanitize_bncc_array(data.get("bncc"))
        data["bncc_computacao"] = self._sanitize_bncc_array(data.get("bncc_computacao"))

        # Garante arrays limpos
        data["recursos"] = [str(r).strip() for r in data.get("recursos", []) if str(r).strip()]
        data["passo_a_passo"] = [str(p).strip() for p in data.get("passo_a_passo", []) if str(p).strip()]

        # Campos de texto
        data["titulo"] = str(data.get("titulo", "Plano de Aula")).strip()[:200]
        data["metodologia"] = str(data.get("metodologia", "")).strip()[:500]
        data["duracao"] = str(data.get("duracao", "1 aula de 50 min")).strip()[:100]
        data["avaliacao"] = str(data.get("avaliacao", "")).strip()[:500]

        # Metadados
        data["modelo_ia"] = "IA DA UNB"
        data["prompts_ia"] = original_prompt.strip() if original_prompt else ""

        return data

    def parse_json_response(self, raw_response: str, original_prompt: str = "") -> dict:
        """Extrai JSON da resposta e aplica validação completa."""
        # Remove markdown fences
        clean_text = re.sub(r'^```json\s*', '', raw_response.strip(), flags=re.MULTILINE)
        clean_text = re.sub(r'^```\s*', '', clean_text, flags=re.MULTILINE)
        clean_text = re.sub(r'\s*```$', '', clean_text, flags=re.MULTILINE).strip()

        # Extrai primeiro objeto JSON completo
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
    """Provedor Ollama local - lê modelo de settings."""

    def __init__(self):
        raw_url = getattr(settings, 'LOCAL_LLM_URL', None) or os.getenv('LOCAL_LLM_URL', 'http://localhost:11434/v1')
        # Lê modelo do settings/.env - SEM HARDCODE
        raw_model = getattr(settings, 'LOCAL_LLM_MODEL', None) or os.getenv('LOCAL_LLM_MODEL', 'qwen3:8b')

        self.base_url = _clean_env(raw_url)
        self.model_name = _clean_env(raw_model)
        self.api_key = "ollama"

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
                            "Você é um consultor pedagógico rigoroso. "
                            "REGRAS: 1) JSON apenas. 2) BNCC só códigos oficiais completos. "
                            "3) bncc e bncc_computacao = array de objetos {{codigo, descricao}}. "
                            "4) passo_a_passo = array de strings. 5) Sem markdown."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,  # Mais determinístico
                response_format={"type": "json_object"},  # Força JSON no Ollama compatível
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
        raw_url = getattr(settings, 'UNB_LLM_URL', None) or os.getenv('UNB_LLM_URL', 'https://ia-router.unb.br/v1/')
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
                            "Saída: JSON estrito. BNCC: apenas códigos oficiais completos. "
                            "Campos array: bncc, bncc_computacao, recursos, passo_a_passo."
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
        import google.generativeai as genai
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


def get_llm_provider() -> BaseLLMProvider:
    raw_provider = getattr(settings, 'LLM_PROVIDER', None) or os.getenv('LLM_PROVIDER', 'local')
    provider = _clean_env(raw_provider).lower()

    if provider == 'local':
        return LocalOllamaProvider()
    elif provider == 'unb':
        return UnbAIProvider()
    elif provider == 'gemini':
        return GeminiProvider()

    raise ValueError(f"Provedor LLM inválido: {provider}")