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
    """Classe base com o prompt padrão do T.E.I.A e sanitização rigorosa de JSON."""

    def build_prompt(self, raw_text: str) -> str:
        # PROMPT OTIMIZADO PARA O MODELO QWEN3:14B E IAs AVANÇADAS
        return f"""
        Você é um Assistente Pedagógico rigoroso e criativo, especialista na Base Nacional Comum Curricular (BNCC) do Brasil.
        Sua tarefa é expandir o rascunho do professor e CO-CRIAR uma proposta pedagógica rica em formato JSON.

        Ideia inicial do professor:
        "{raw_text}"

        DIRETRIZES ANTI-ALUCINAÇÃO (MÁXIMA PRIORIDADE):
        1. É ESTRITAMENTE PROIBIDO inventar códigos BNCC (nunca crie formatos como CN.1 ou EF99). 
        2. Use APENAS códigos reais do documento oficial (ex: EF07HI01, EF01MA01, EM13CHS101).
        3. O formato dos campos de BNCC deve ser ESTRITAMENTE: "CÓDIGO - Descrição completa".
        4. Se houver mais de uma habilidade, separe-as com duas quebras de linha (\\n\\n).

        REGRAS DE ESTRUTURA E VALORES EXATOS:
        - "nivel": ESTRITAMENTE uma destas opções -> "Fundamental 1", "Fundamental 2", "Ensino Médio" ou "Ensino Superior".
        - "categoria": ESTRITAMENTE uma destas opções -> "Plano de Aula", "Sequência Didática", "Rubrica de Avaliação", "Texto de Apoio", "Slide / Apresentação", "Lista de Exercícios", "Quiz / Questões", "Imagens / Vídeos", "Estudo de Caso", "Simulação / Roleplay" ou "Prompt para Alunos".

        Responda APENAS com um objeto JSON válido, sem NENHUM texto adicional:
        {{
            "titulo": "Crie um título engajador para a aula",
            "nivel": "Escolha exata de uma das 4 opções",
            "categoria": "Escolha exata de uma das opções",
            "bncc": "CÓDIGO REAL - Descrição completa",
            "bncc_computacao": "CÓDIGO REAL - Descrição completa (ou deixe vazio se não houver tecnologia envolvida)",
            "metodologia": "Passo a passo detalhado da abordagem e dinâmicas da aula",
            "duracao": "Estimativa realista (ex: 2 aulas de 50 min)",
            "modelo_ia": "IA DA UNB",
            "prompts_ia": {json.dumps(raw_text.strip())},
            "experiencia": "Narrativa detalhada de como seria a aplicação em sala, o engajamento dos estudantes e o papel mediador do professor",
            "resultados": "Quais serão as evidências de aprendizagem geradas pelos alunos",
            "recursos": ["Recurso 1", "Recurso 2", "Recurso 3"]
        }}
        """

    def _normalize_bncc_field(self, val) -> str:
        """Limpa o campo BNCC caso a IA devolva uma lista ou formatação inesperada."""
        if not val:
            return ""
        if isinstance(val, list):
            items = []
            for item in val:
                if isinstance(item, dict):
                    cid = item.get('id') or item.get('codigo') or ''
                    txt = item.get('texto') or item.get('descricao') or ''
                    items.append(f"{cid} - {txt}".strip(" -"))
                else:
                    items.append(str(item).strip())
            return "\n\n".join(filter(None, items))
        return str(val).strip()

    def parse_json_response(self, raw_response: str, original_prompt: str = "") -> dict:
        """Sanitiza e força os campos vitais da estrutura do T.E.I.A."""
        clean_text = re.sub(r'^```json\s*', '', raw_response.strip(), flags=re.MULTILINE)
        clean_text = re.sub(r'^```\s*', '', clean_text, flags=re.MULTILINE)
        clean_text = re.sub(r'\s*```$', '', clean_text, flags=re.MULTILINE).strip()

        json_match = re.search(r'\{.*\}', clean_text, flags=re.DOTALL)
        if json_match:
            clean_text = json_match.group(0)

        try:
            data = json.loads(clean_text)
        except json.JSONDecodeError:
            raise ValueError(
                f"A IA não retornou um JSON válido. Resposta recebida: {raw_response[:150]}..."
            )

        # TRAVAS DE SEGURANÇA GERAIS
        data['modelo_ia'] = "IA DA UNB"
        
        if original_prompt:
            data['prompts_ia'] = original_prompt.strip()

        data['bncc'] = self._normalize_bncc_field(data.get('bncc', ''))
        data['bncc_computacao'] = self._normalize_bncc_field(data.get('bncc_computacao', ''))

        return data

    @abstractmethod
    def catalog_production(self, raw_text: str) -> dict:
        pass


class LocalOllamaProvider(BaseLLMProvider):
    """Provedor conectado ao Ollama local na sua máquina."""

    def __init__(self):
        raw_url = getattr(settings, 'LOCAL_LLM_URL', None) or os.getenv('LOCAL_LLM_URL', 'http://localhost:11434/v1')
        # APONTANDO EXATAMENTE PARA O QWEN3:14B
        raw_model = getattr(settings, 'LOCAL_LLM_MODEL', None) or os.getenv('LOCAL_LLM_MODEL', 'qwen3:8b')

        self.base_url = _clean_env(raw_url)
        self.model_name = _clean_env(raw_model)
        self.api_key = "ollama"

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=120.0,
        )

    def catalog_production(self, raw_text: str) -> dict:
        prompt = self.build_prompt(raw_text)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Você é um consultor pedagógico altamente rigoroso e criativo. "
                            "Seu objetivo é expandir ideias em planos de aula ricos. "
                            "REGRA DE OURO: NUNCA invente códigos BNCC. Use apenas códigos reais no formato 'CÓDIGO - Descrição'. "
                            "Você DEVE responder estritamente em um formato JSON válido, sem NENHUM texto fora das chaves {}."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                # Temperatura 0.3 restringe alucinações e garante um formato JSON sólido
                temperature=0.3,
            )
            raw_response = response.choices[0].message.content
            return self.parse_json_response(raw_response, original_prompt=raw_text)

        except Exception as err:
            causa_real = repr(err.__cause__) if getattr(err, '__cause__', None) else repr(err)
            print(f"\n⚠️ Falha na API Local Ollama ({self.base_url}): {causa_real}")
            raise RuntimeError(f"Erro no provedor Local ({self.model_name}): {causa_real}")


class UnbAIProvider(BaseLLMProvider):
    """Provedor conectado ao roteador LiteLLM da Universidade de Brasília."""

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

    def catalog_production(self, raw_text: str) -> dict:
        prompt = self.build_prompt(raw_text)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Você é um consultor pedagógico altamente rigoroso e criativo. "
                            "Seu objetivo é expandir ideias em planos de aula ricos. "
                            "REGRA DE OURO: NUNCA invente códigos BNCC. Use apenas códigos reais no formato 'CÓDIGO - Descrição'. "
                            "Você DEVE responder estritamente em um formato JSON válido, sem NENHUM texto fora das chaves {}."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.3,
            )
            raw_response = response.choices[0].message.content
            return self.parse_json_response(raw_response, original_prompt=raw_text)

        except Exception as err:
            causa_real = repr(err.__cause__) if getattr(err, '__cause__', None) else repr(err)
            print(f"\n⚠️ Falha na API UnB LiteLLM ({self.base_url}): {causa_real}")
            raise RuntimeError(f"Erro no provedor UnB ({self.model_name}): {causa_real}")


class GeminiProvider(BaseLLMProvider):
    """Provedor Google Gemini (mantido como segurança)."""

    def __init__(self):
        import google.generativeai as genai

        raw_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        api_key = _clean_env(raw_key)

        if not api_key:
            raise ValueError("GEMINI_API_KEY não encontrada no .env.")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-flash-latest')

    def catalog_production(self, raw_text: str) -> dict:
        import google.generativeai as genai
        prompt = self.build_prompt(raw_text)

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
            raise RuntimeError(f"Erro na resposta da API Gemini: {str(err)}")


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