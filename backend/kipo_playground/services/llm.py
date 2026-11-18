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
    Classe base com prompt estruturado para planejamento pedagógico em texto corrido.
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

    RECURSOS_SUGERIDOS = [
        "Projetor", "Internet / Wi-Fi", "Celulares (BYOD)",
        "Laboratório de Informática", "Tablets", "Quadro Branco",
        "IA Generativa", "Jogos", "Livro Didático"
    ]

    def build_prompt(self, raw_text: str, contexto_bncc: str = "") -> str:
        """
        Constrói prompt focado em texto corrido detalhado e objetivo (estilo ChatGPT/Gemini)
        e resultados baseados diretamente no relato da experiência.
        """
        bncc_section = (
            f"\nCONTEXTO BNCC DISPONÍVEL (priorize estes códigos):\n{contexto_bncc}\n"
            if contexto_bncc else ""
        )

        return f"""Você é um especialista em educação e BNCC. Desenvolva uma proposta pedagógica completa, detalhada e objetiva a partir do pedido do professor.

Pedido do professor:
"{raw_text.strip()}"
{bncc_section}
DIRETRIZES DE ESCRITA (ESTILO TEXTO CORRIDO):
1. "bncc": Obrigatório incluir de 2 a 3 habilidades reais da BNCC compatíveis com o tema (código oficial como EF06HI07, EM13CHS101 + descrição completa da habilidade). Nunca deixe vazio.
2. "passo_a_passo" (Relato da Experiência): Escreva em TEXTO CORRIDO (3 a 4 parágrafos bem desenvolvidos, detalhados e objetivos, sem listas numeradas de minutos como "1. (5 min)"). Explique o conteúdo específico do tema pedido, como o professor introduz e desenvolve o assunto com a turma, a atividade central realizada pelos alunos e a síntese final.
3. "avaliacao" (Resultados): Escreva um parágrafo em TEXTO CORRIDO descrevendo os resultados alcançados/esperados com base no que foi feito no Relato da Experiência (o que os alunos passam a compreender na prática, como reagem à atividade e como o aprendizado é evidenciado). PROIBIDO colocar apenas palavras soltas como "Quiz" ou "Prova".
4. "metodologia": Descreva a abordagem pedagógica em uma frase clara (ex: "Aula expositiva dialogada combinada com análise de fontes históricas e debate colaborativo").
5. "recursos": Escolha de 2 a 4 recursos reais (preferencialmente entre: {", ".join(self.RECURSOS_SUGERIDOS)}).
6. "nivel": Escolha exatamente um entre: {", ".join(self.NIVEIS_VALIDOS)}.
7. "categoria": Escolha exatamente uma entre: {", ".join(self.CATEGORIAS_VALIDAS)}.

FORMATO JSON OBRIGATÓRIO (responda APENAS o JSON, sem markdown):
{{
  "titulo": "Título claro e engajador sobre o tema",
  "nivel": "Fundamental 2",
  "categoria": "Plano de Aula",
  "bncc": [
    {{
      "codigo": "EF06HI07",
      "descricao": "Identificar aspectos e formas de registro das sociedades antigas na África, no Oriente Médio e nas Américas, distinguindo alguns significados presentes na cultura material e na tradição oral dessas sociedades."
    }}
  ],
  "bncc_computacao": [],
  "metodologia": "Aula expositiva dialogada com análise visual e estudo dirigido",
  "duracao": "2 aulas de 50 minutos",
  "recursos": ["Projetor", "Quadro Branco", "Livro Didático"],
  "passo_a_passo": [
    "Parágrafo 1 em texto corrido contextualizando a introdução do tema e o engajamento inicial dos estudantes com os conceitos centrais...",
    "Parágrafo 2 em texto corrido detalhando a explicação dos conteúdos específicos do tema e a mediação do professor durante a exploração do material...",
    "Parágrafo 3 em texto corrido descrevendo a atividade prática ou reflexão aplicada pelos alunos e o fechamento coletivo da experiência..."
  ],
  "avaliacao": "Com base na experiência desenvolvida, espera-se como resultado que os estudantes compreendam de forma crítica os conceitos trabalhados, participem ativamente das discussões relacionando o tema com evidências históricas ou práticas, e consolidem o aprendizado por meio dos registros produzidos ao final da atividade."
}}"""

    def _extract_bncc_code(self, text: str) -> str:
        """Extrai o código BNCC oficial mesmo se vier misturado com texto."""
        if not text or not isinstance(text, str):
            return ""
        match = re.search(r'\b(EF|EM)\d{2}[A-Z]{2,3}\d{2,3}\b', text.strip().upper())
        return match.group(0) if match else ""

    def _sanitize_bncc_array(self, bncc_raw) -> list:
        """
        Normaliza e recupera habilidades da BNCC mesmo que o LLM retorne
        strings ("EF06HI07 - Descrição") ou dicts com formatação imperfeita.
        """
        if not bncc_raw:
            return []

        if isinstance(bncc_raw, str):
            bncc_raw = [line.strip() for line in bncc_raw.split("\n") if line.strip()]

        if not isinstance(bncc_raw, list):
            return []

        sanitized = []
        seen_codes = set()

        for item in bncc_raw:
            codigo = ""
            descricao = ""

            if isinstance(item, dict):
                raw_cod = str(item.get("codigo") or item.get("code") or "")
                raw_desc = str(item.get("descricao") or item.get("description") or "")
                codigo = self._extract_bncc_code(raw_cod) or self._extract_bncc_code(raw_desc)
                descricao = raw_desc.strip()
                # Se a descrição veio vazia mas tinha texto junto do código
                if not descricao and raw_cod:
                    descricao = re.sub(r'^\s*(EF|EM)\d{2}[A-Z]{2,3}\d{2,3}\s*[-:–]?\s*', '', raw_cod, flags=re.IGNORECASE).strip()

            elif isinstance(item, str):
                codigo = self._extract_bncc_code(item)
                descricao = re.sub(r'^.*?(EF|EM)\d{2}[A-Z]{2,3}\d{2,3}\s*[-:–]?\s*', '', item, flags=re.IGNORECASE).strip()

            if not codigo or codigo in seen_codes:
                continue

            if not descricao:
                descricao = "Habilidade da Base Nacional Comum Curricular aplicada à prática."

            seen_codes.add(codigo)
            sanitized.append({"codigo": codigo, "descricao": descricao})

        return sanitized

    def _normalize_relato_paragraphs(self, raw_relato) -> list:
        """
        Garante que o Relato da Experiência fique em parágrafos de texto corrido,
        removendo prefixos robóticos como '1. Conclusão (10 min):'.
        """
        if isinstance(raw_relato, str):
            paragraphs = [p.strip() for p in re.split(r'\n\s*\n|\n', raw_relato) if p.strip()]
        elif isinstance(raw_relato, list):
            paragraphs = [str(p).strip() for p in raw_relato if str(p).strip()]
        else:
            paragraphs = []

        cleaned_paragraphs = []
        for p in paragraphs:
            # Remove cabeçalhos robóticos no início como "1. Introdução (10 minutos): "
            p_clean = re.sub(
                r'^\d+[\.\)]\s*[^:]{2,35}\(\d+\s*min(?:utos)?\)\s*:\s*',
                '',
                p,
                flags=re.IGNORECASE
            ).strip()
            cleaned_paragraphs.append(p_clean or p)

        return cleaned_paragraphs

    def _validate_and_sanitize(self, data: dict, original_prompt: str) -> dict:
        """Validação e sanitização mantendo texto corrido rico."""
        for key, expected_type in self.EXPECTED_KEYS.items():
            if key not in data:
                data[key] = [] if expected_type == list else ""

        if data.get("nivel") not in self.NIVEIS_VALIDOS:
            data["nivel"] = "Fundamental 2"

        if data.get("categoria") not in self.CATEGORIAS_VALIDAS:
            data["categoria"] = "Plano de Aula"

        # Sanitização flexível de BNCC
        data["bncc"] = self._sanitize_bncc_array(data.get("bncc"))
        data["bncc_computacao"] = self._sanitize_bncc_array(data.get("bncc_computacao"))

        # Evita que categorias vazem para dentro de recursos
        recursos_brutos = data.get("recursos", [])
        if isinstance(recursos_brutos, str):
            recursos_brutos = [r.strip() for r in recursos_brutos.split(",") if r.strip()]
        data["recursos"] = [
            str(r).strip() for r in recursos_brutos
            if str(r).strip() and str(r).strip() not in self.CATEGORIAS_VALIDAS
        ] or ["Quadro Branco", "Projetor"]

        # Relato da Experiência em texto corrido
        relato_raw = data.get("passo_a_passo") or data.get("relato_experiencia") or data.get("experiencia")
        data["passo_a_passo"] = self._normalize_relato_paragraphs(relato_raw)

        # Textos completos sem truncamento curto
        data["titulo"] = str(data.get("titulo", "Plano de Aula")).strip()[:200]
        data["metodologia"] = str(data.get("metodologia", "")).strip()[:1000]
        data["duracao"] = str(data.get("duracao", "2 aulas de 50 min")).strip()[:100]

        # Resultados (avaliacao): se o modelo colocou apenas o nome de uma categoria, gera fallback coerente
        avaliacao_raw = str(data.get("avaliacao") or data.get("resultados") or "").strip()
        if not avaliacao_raw or avaliacao_raw in self.CATEGORIAS_VALIDAS or len(avaliacao_raw) < 25:
            avaliacao_raw = (
                "A partir das atividades desenvolvidas no relato de experiência, espera-se que os estudantes "
                "compreendam os conceitos centrais trabalhados em aula, participem ativamente das discussões "
                "propostas e demonstrem a consolidação da aprendizagem por meio das produções e reflexões realizadas."
            )
        data["avaliacao"] = avaliacao_raw[:2000]

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
    """Provedor Ollama local otimizado para CPU."""

    def __init__(self):
        raw_url = getattr(settings, 'LOCAL_LLM_URL', None) or os.getenv('LOCAL_LLM_URL', 'http://localhost:11434/v1')
        raw_model = getattr(settings, 'LOCAL_LLM_MODEL', None) or os.getenv('LOCAL_LLM_MODEL', 'qwen2.5:7b')

        self.base_url = _clean_env(raw_url)
        self.model_name = _clean_env(raw_model)

        self.client = OpenAI(
            api_key="ollama",
            base_url=self.base_url,
            timeout=180.0,
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
                            "Você é um assistente pedagógico especialista na BNCC. "
                            "Escreva de forma detalhada, fluida e objetiva em texto corrido (estilo ChatGPT/Gemini). "
                            "Nunca use listas cronometradas ('1. (5 min)') no relato. "
                            "Nos resultados (campo 'avaliacao'), descreva os resultados alcançados/esperados com base no relato. "
                            "Responda estritamente em JSON válido."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
                extra_body={
                    "keep_alive": -1,
                    "options": {
                        "num_ctx": 4096,
                        "num_predict": 1400,
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
                            "Você é um assistente pedagógico especialista na BNCC. "
                            "Escreva o relato da experiência ('passo_a_passo') em parágrafos de texto corrido detalhados e objetivos. "
                            "No campo 'avaliacao' (Resultados), descreva um resultado de aprendizagem coerente baseado no relato. "
                            "Inclua habilidades reais da BNCC com código e descrição. Saída apenas em JSON válido."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
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
                    "temperature": 0.2
                }
            )
            return self.parse_json_response(response.text.strip(), original_prompt=raw_text)
        except Exception as err:
            raise RuntimeError(f"Erro na API Gemini: {str(err)}")


_PROVIDER_INSTANCE = None

def get_llm_provider() -> BaseLLMProvider:
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