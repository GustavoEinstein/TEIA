import os
import json
import re
from abc import ABC, abstractmethod
from django.conf import settings
import google.generativeai as genai

class BaseLLMProvider(ABC):
    @abstractmethod
    def catalog_production(self, raw_text: str) -> dict:
        pass

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        # Busca a chave no settings.py ou no .env
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY não foi encontrada nas configurações do Django ou no arquivo .env.")
        
        genai.configure(api_key=api_key)
        
        # Modelo atualizado com base nos modelos ativos da sua chave de API
        self.model = genai.GenerativeModel('gemini-2.5-flash')

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

        # Sanitização de blocos de código Markdown (```json ... ```)
        clean_text = re.sub(r'^```json\s*', '', raw_response, flags=re.MULTILINE)
        clean_text = re.sub(r'^```\s*', '', clean_text, flags=re.MULTILINE)
        clean_text = re.sub(r'\s*```$', '', clean_text, flags=re.MULTILINE).strip()

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            raise ValueError(f"A IA não retornou um JSON válido. Resposta recebida: {raw_response[:100]}...")

class LocalLLMProvider(BaseLLMProvider):
    def __init__(self):
        self.api_url = getattr(settings, 'LOCAL_LLM_URL', 'http://localhost:11434/v1')
        self.model_name = getattr(settings, 'LOCAL_LLM_MODEL', 'llama3')

    def catalog_production(self, raw_text: str) -> dict:
        import requests
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "Você é um catalogador pedagógico que responde estritamente em formato JSON."},
                {"role": "user", "content": f"Catalogue o seguinte plano em JSON: {raw_text}"}
            ],
            "response_format": {"type": "json_object"}
        }
        response = requests.post(f"{self.api_url}/chat/completions", json=payload, timeout=60)
        content = response.json()['choices'][0]['message']['content']
        return json.loads(content)

def get_llm_provider() -> BaseLLMProvider:
    provider = getattr(settings, 'LLM_PROVIDER', 'gemini')
    if provider == 'gemini':
        return GeminiProvider()
    elif provider == 'local':
        return LocalLLMProvider()
    raise ValueError(f"Provedor LLM inválido: {provider}")