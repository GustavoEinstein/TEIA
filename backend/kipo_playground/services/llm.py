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
        Você é um Assistente Pedagógico Mestre, especialista em metodologias ativas e na Base Nacional Comum Curricular (BNCC).
        Sua tarefa é analisar o rascunho ou a ideia inicial fornecida pelo professor e CO-CRIAR uma proposta pedagógica rica, detalhada e inspiradora, preenchendo as lacunas com sugestões criativas.

        Ideia inicial do professor:
        "{raw_text}"

        Expanda essa ideia em uma prática educacional robusta. Gere descrições detalhadas para a metodologia, engajamento dos alunos e resultados esperados, mesmo que o texto original seja extremamente breve.

        REGRAS ESTRITAS DE FORMATAÇÃO DO JSON:
        1. Nos campos "bncc" e "bncc_computacao", escreva CADA habilidade no formato exato "CÓDIGO: Descrição completa da habilidade na BNCC". Se houver mais de uma, separe com quebra de linha (\\n\\n). Exemplo: "EF07HI01: Explicar o significado de 'modernidade' e suas lógicas de inclusão e exclusão.\\n\\nEF07HI02: Identificar conexões e interações entre as sociedades do Novo Mundo." (Use códigos alfanuméricos reais da BNCC, nunca use siglas inventadas como CN.1).
        2. No campo "nivel", escolha ESTRITAMENTE uma destas 4 opções exatas: "Fundamental 1", "Fundamental 2", "Ensino Médio" ou "Ensino Superior".
        3. No campo "categoria", escolha ESTRITAMENTE uma destas opções exatas: "Plano de Aula", "Sequência Didática", "Rubrica de Avaliação", "Texto de Apoio", "Slide / Apresentação", "Lista de Exercícios", "Quiz / Questões", "Imagens / Vídeos", "Estudo de Caso", "Simulação / Roleplay" ou "Prompt para Alunos".
        4. No campo "modelo_ia", preencha exatamente com: "IA DA UNB".
        5. No campo "prompts_ia", repita exatamente o texto original enviado pelo professor, sem inventar novos prompts.

        Responda APENAS com um objeto JSON válido (sem texto adicional antes ou depois, sem formatação markdown em volta) no seguinte formato exato:
        {{
            "titulo": "Crie um título engajador e descritivo para a aula",
            "nivel": "Fundamental 1, Fundamental 2, Ensino Médio ou Ensino Superior",
            "categoria": "Plano de Aula",
            "bncc": "CÓDIGO: Texto completo da habilidade da BNCC",
            "bncc_computacao": "CÓDIGO: Texto completo da habilidade de computação (ou deixe vazio '' se não aplicável)",
            "metodologia": "Descreva em detalhes a abordagem (ex: Sala Invertida, Gamificação, Aprendizagem Baseada em Problemas) e o passo a passo da aula",
            "duracao": "Sugira uma estimativa realista de tempo (ex: 2 aulas de 50 min)",
            "modelo_ia": "IA DA UNB",
            "prompts_ia": {json.dumps(raw_text.strip())},
            "experiencia": "Crie uma narrativa detalhada simulando como seria a aplicação dessa aula, focando no engajamento dos estudantes e no papel mediador do professor",
            "resultados": "Descreva os resultados de aprendizagem esperados e como os alunos demonstrarão o conhecimento na prática",
            "recursos": ["Sugira recursos físicos e digitais necessários (mínimo de 3 itens)"]
        }}
        """

    def _normalize_bncc_field(self, val) -> str:
        """Garante que o campo BNCC fique sempre como string formatada (CODIGO: Texto)."""
        if not val:
            return ""
        if isinstance(val, list):
            items = []
            for item in val:
                if isinstance(item, dict):
                    cid = item.get('id') or item.get('codigo') or ''
                    txt = item.get('texto') or item.get('descricao') or ''
                    items.append(f"{cid}: {txt}".strip(": "))
                else:
                    items.append(str(item).strip())
            return "\n\n".join(filter(None, items))
        return str(val).strip()

    def parse_json_response(self, raw_response: str, original_prompt: str = "") -> dict:
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

        # TRAVAS GARANTIDAS EM CÓDIGO (Sobrescreve qualquer loucura da IA):
        # 1. Força sempre "IA DA UNB" no campo de modelo (Mesmo se você estiver usando o Qwen2.5 local)
        data['modelo_ia'] = "IA DA UNB"
        
        # 2. Força o prompt exato que o professor digitou
        if original_prompt:
            data['prompts_ia'] = original_prompt.strip()

        # 3. Normaliza quebras de linha da BNCC caso a IA mande como lista sem querer
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
        raw_model = getattr(settings, 'LOCAL_LLM_MODEL', None) or os.getenv('LOCAL_LLM_MODEL', 'qwen2.5')

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
                            "Você é um consultor pedagógico avançado, criativo e especialista na BNCC. "
                            "Seu objetivo é expandir ideias curtas em planos de aula detalhados e ricos. "
                            "Sempre inclua o código alfanumérico oficial da BNCC seguido de dois-pontos e a descrição completa da habilidade. "
                            "Você DEVE responder estritamente em um formato JSON válido, sem NENHUM texto fora das chaves {}."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.5,
            )
            raw_response = response.choices[0].message.content
            # Passa o texto original para a trava de segurança forçar no campo "prompts_ia"
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
                            "Você é um consultor pedagógico avançado, criativo e especialista na BNCC. "
                            "Seu objetivo é expandir ideias curtas em planos de aula detalhados e ricos. "
                            "Sempre inclua o código alfanumérico oficial da BNCC seguido de dois-pontos e a descrição completa da habilidade. "
                            "Você DEVE responder estritamente em um formato JSON válido, sem NENHUM texto fora das chaves {}."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.5,
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
                    "temperature": 0.5
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