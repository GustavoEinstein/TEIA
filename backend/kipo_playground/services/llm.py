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
    """Classe base com o prompt padrão do T.E.I.A e sanitização de JSON."""

    def build_prompt(self, raw_text: str) -> str:
        return f"""
        Você é um assistente pedagógico especialista na BNCC e educação básica.
        Analise o texto bruto fornecido pelo professor e extraia/catalogue as informações no formato JSON estrito:

        Texto do Professor:
        "{raw_text}"

        Responda APENAS com um objeto JSON válido (sem texto adicional antes ou depois) no seguinte formato:
        {{
            "titulo": "Título sugerido ou extraído",
            "nivel": "Fundamental 1, Fundamental 2, Ensino Médio ou Ensino Superior",
            "categoria": "Plano de Aula, Sequência Didática, Lista de Exercícios, etc.",
            "bncc": "Competências e códigos gerais da BNCC",
            "bncc_computacao": "Habilidades de computação envolvidas",
            "metodologia": "Resumo da abordagem ou metodologia aplicada",
            "duracao": "Estimativa de tempo (ex: 2 aulas de 50 min)",
            "modelo_ia": "Nome da IA mencionada ou utilizada",
            "prompts_ia": "Prompts extraídos ou sugeridos",
            "experiencia": "Relato da experiência didática",
            "resultados": "Resultados observados",
            "recursos": ["Recurso 1", "Recurso 2"]
        }}
        """

    def parse_json_response(self, raw_response: str) -> dict:
        clean_text = re.sub(r'^```json\s*', '', raw_response.strip(), flags=re.MULTILINE)
        clean_text = re.sub(r'^```\s*', '', clean_text, flags=re.MULTILINE)
        clean_text = re.sub(r'\s*```$', '', clean_text, flags=re.MULTILINE).strip()

        json_match = re.search(r'\{.*\}', clean_text, flags=re.DOTALL)
        if json_match:
            clean_text = json_match.group(0)

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            raise ValueError(
                f"A IA não retornou um JSON válido. Resposta recebida: {raw_response[:150]}..."
            )

    @abstractmethod
    def catalog_production(self, raw_text: str) -> dict:
        pass


class LocalOllamaProvider(BaseLLMProvider):
    """Provedor conectado ao Ollama local na sua máquina."""

    def __init__(self):
        raw_url = getattr(settings, 'LOCAL_LLM_URL', None) or os.getenv('LOCAL_LLM_URL', 'http://localhost:11434/v1')
        raw_model = getattr(settings, 'LOCAL_LLM_MODEL', None) or os.getenv('LOCAL_LLM_MODEL', 'qwen2.5')

        self.base_url = _clean_env(raw_url)
        self.model_name = _clean_env(raw_model)
        self.api_key = "ollama" # O cliente OpenAI exige uma string, mas o Ollama ignora

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
                            "Você é um assistente pedagógico especialista na BNCC que responde "
                            "estritamente em formato JSON válido, sem nenhum comentário adicional."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.2, # Mantém a criatividade baixa para focar na estrutura JSON
            )
            raw_response = response.choices[0].message.content
            return self.parse_json_response(raw_response)

        except Exception as err:
            causa_real = repr(err.__cause__) if getattr(err, '__cause__', None) else repr(err)
            print(f"\n⚠️ Falha na API Local Ollama ({self.base_url}): {causa_real}")
            raise RuntimeError(f"Erro no provedor Local ({self.model_name}): {causa_real}")


class GeminiProvider(BaseLLMProvider):
    """Provedor Google Gemini (mantido como segurança)."""

    def __init__(self):
        # O import fica escopado aqui para evitar checagem de sockets na inicialização do servidor offline
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
                generation_config={"response_mime_type": "application/json"}
            )
            return self.parse_json_response(response.text.strip())
        except Exception as err:
            raise RuntimeError(f"Erro na resposta da API Gemini: {str(err)}")


def get_llm_provider() -> BaseLLMProvider:
    raw_provider = getattr(settings, 'LLM_PROVIDER', None) or os.getenv('LLM_PROVIDER', 'local')
    provider = _clean_env(raw_provider).lower()

    if provider == 'local':
        return LocalOllamaProvider()
    elif provider == 'gemini':
        return GeminiProvider()

    raise ValueError(f"Provedor LLM inválido: {provider}")
