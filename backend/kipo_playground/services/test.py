import google.generativeai as genai

# Cole sua chave real diretamente aqui para o teste
API_KEY = "AIzaSyDA-L50OFRA8BF7eveO_JXdHwvRzQ-KmR4"

genai.configure(api_key=API_KEY)

print("\n--- MODELOS DISPONÍVEIS ---")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
print("---------------------------\n")