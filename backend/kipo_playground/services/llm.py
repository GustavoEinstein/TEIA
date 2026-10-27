import os
import json
import re
import requests
from abc import ABC, abstractmethod
from django.conf import settings
import google.generativeai as genai

# 1. Classe Base vem primeiro
class BaseLLMProvider(ABC):
    @abstractmethod
    def catalog_production(self, raw_text: str) -> dict:
        pass

# 2. Provedor Gemini
class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY não foi encontrada nas configurações do Django ou no arquivo .env.")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-flash-latest')

    def catalog_production(self, raw_text: str) -> dict:
        prompt = f"""
        Você é um assistente pedagógico especialista na BNCC e educação básica.
        Analise o texto bruto fornecido pelo professor e extraia/catalogue as informações no formato JSON estrito:

        Texto do Professor:
        "{raw_text}"

        Responda APENAS com um objeto JSON válido no seguinte formato:
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
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            raw_response = response.text.strip()
        except Exception as err:
            raise RuntimeError(f"Erro na resposta da API Gemini: {str(err)}")

        clean_text = re.sub(r'^```(?:json)?\s*', '', raw_response, flags=re.MULTILINE)
        clean_text = re.sub(r'\s*```$', '', clean_text, flags=re.MULTILINE).strip()

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            raise ValueError(f"A IA não retornou um JSON válido. Resposta recebida: {raw_response[:100]}...")

# 3. Provedor Local (Ollama)
class LocalLLMProvider(BaseLLMProvider):
    def __init__(self):
        self.api_url = getattr(settings, 'LOCAL_LLM_URL', 'http://172.30.160.1:11434').rstrip('/')
        self.model_name = getattr(settings, 'LOCAL_LLM_MODEL', 'qwen2.5:7b-instruct')
        self.timeout = getattr(settings, 'LOCAL_LLM_TIMEOUT', 120)
        self.session = requests.Session()

    def _clean_json_output(self, raw_output: str) -> str:
        text = raw_output.strip()
        text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE).strip()
        
        first_brace = text.find('{')
        last_brace = text.rfind('}')
        if first_brace != -1 and last_brace != -1:
            text = text[first_brace:last_brace + 1]
        return text

    def catalog_production(self, raw_text: str) -> dict:
        system_prompt = (
            "Você é um assistente pedagógico especialista na BNCC e nas Normas sobre Computação na Educação Básica. "
            "Analise relatos e preencha a ficha de catalogação.\n"
            "Responda EXCLUSIVAMENTE com um objeto JSON válido, sem texto adicional:\n"
            '{\n'
            '  "titulo": "Título formal do plano",\n'
            '  "nivel": "Educação Infantil, Fundamental 1, Fundamental 2, Ensino Médio ou Ensino Superior",\n'
            '  "categoria": "Plano de Aula, Sequência Didática, Projeto, Atividade Desplugada, etc.",\n'
            '  "bncc": "Habilidades gerais da BNCC",\n'
            '  "bncc_computacao": "Eixo/Habilidade da Computação na Educação Básica",\n'
            '  "metodologia": "Metodologia ativa utilizada",\n'
            '  "duracao": "Tempo estimado",\n'
            '  "modelo_ia": "IA citada ou \'Não se aplica\'",\n'
            '  "prompts_ia": "Prompts sugeridos",\n'
            '  "experiencia": "Síntese das anotações práticas",\n'
            '  "resultados": "Resultados observados",\n'
            '  "recursos": ["Item 1", "Item 2"]\n'
            '}'
        )

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Anotações brutas do professor:\n\"\"\"\n{raw_text}\n\"\"\""}
            ],
            "stream": False,  # Ollama faz streaming (NDJSON) por padrão; precisamos de um único JSON
            "format": "json",
            "options": {
                "temperature": 0.2
            }
        }

        # Erro de rede/HTTP
        try:
            response = self.session.post(
                f"{self.api_url}/api/chat",
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            raise RuntimeError(f"Falha de comunicação com o servidor LLM local: {exc}") from exc

        # Erro de formato da resposta do Ollama
        try:
            content = response.json()['message']['content']
        except (ValueError, KeyError) as exc:
            raise RuntimeError(f"Resposta inesperada do Ollama: {response.text[:250]}") from exc

        # Erro de JSON gerado pelo modelo
        sanitized_json = self._clean_json_output(content)

        try:
            return json.loads(sanitized_json)
        except json.JSONDecodeError as err:
            raise ValueError(f"O LLM local retornou JSON inválido. Resposta crua:\n{content[:250]}...") from err

# 4. Função Fábrica por último
def get_llm_provider() -> BaseLLMProvider:
    provider = getattr(settings, 'LLM_PROVIDER', 'gemini')
    if provider == 'gemini':
        return GeminiProvider()
    elif provider == 'local':
        return LocalLLMProvider()
    raise ValueError(f"Provedor LLM inválido: {provider}")