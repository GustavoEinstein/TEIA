# Sistema T.E.I.A - Tecendo a Educação com Inteligência Artificial

A plataforma T.E.I.A (Tecendo a Educação com Inteligência Artificial) é um sistema web desenvolvido como Projeto de Extensão no escopo da Licenciatura em Computação (Universidade de Brasília - UnB).

Seu objetivo é ser um repositório colaborativo onde docentes e educadores podem catalogar, buscar e validar práticas pedagógicas focadas na integração da Inteligência Artificial (IA) no cotidiano escolar, desde os anos iniciais até o ensino médio.

A plataforma implementa um ambiente de gamificação, sistema de revisão por pares (duplo-cego) e gerador automatizado de Planos de Aula (IFB/MEC) a partir de inputs avaliados por uma IA especialista.

**Características Principais:**

* **Central da Comunidade:** Feed dinâmico para descoberta de práticas e planos de aula, filtrável por disciplinas, nível escolar e modelo de IA utilizado.

* **Auto-Catalogação com IA (Gemini):** O docente descreve sua aula informalmente, e a IA preenche o formulário oficial, gerando uma sugestão estruturada alinhada à BNCC.

* **Revisão por Pares (Duplo-Cego):** Gamificação para incentivar a validação de práticas pela comunidade. Para ser publicada, uma prática precisa de duas aprovações de outros professores.

* **Gamificação e Níveis:** Sistema de acúmulo de XP (Pontos de Experiência) que destrava títulos, como "Prof. Conectado(a)", estimulando a colaboração contínua.

* **Exportação de Plano de Aula:** Funcionalidade que transforma uma prática em um documento PDF formatado seguindo o padrão institucional IFB/MEC.

## 🚀 Quickstart - Como rodar localmente (Computador Pessoal)

O T.E.I.A utiliza **Django** (Python) no backend e **React** (Vite + Tailwind CSS) no frontend. Siga os passos abaixo para configurar o ambiente no seu computador.

### 1. Clonar o Repositório e Navegar até a Pasta

```
git clone https://github.com/GustavoEinstein/TEIA.git
cd TEIA

```

### 2. Configurar o Backend (Django / Python)

O backend do T.E.I.A é responsável pela API RESTful, conexão com banco de dados (SQLite por padrão em ambiente local), integração com a IA Gemini e geração dos PDFs com WeasyPrint.

**Abra um terminal (Terminal 1) e siga os passos:**

```
# 2.1. Navegue até a pasta do backend
cd backend

# 2.2. Crie o ambiente virtual (venv)
python -m venv venv

# 2.3. Ative o ambiente virtual
# -> Se estiver no Windows (PowerShell):
venv\Scripts\Activate
# -> Se estiver no Linux/Mac/WSL:
source venv/bin/activate

# 2.4. Atualize o pip (Opcional, mas recomendado)
pip install --upgrade pip

# 2.5. Instale as dependências do Python
pip install -r requirements.txt

```

> **Aviso sobre WeasyPrint (Geração de PDFs):**
>
> * **No Linux/WSL**, se o pip relatar falta de bibliotecas gráficas, você precisará instalar as dependências do Pango e Cairo via sistema: `sudo apt-get install libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0 libffi-dev libjpeg-dev libopenjp2-7-dev`
>
> * **No Windows**, você precisará baixar e instalar o GTK3 Runtime na sua máquina para o WeasyPrint funcionar corretamente (https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer).

```
# 2.6. Configure as Variáveis de Ambiente (Chave da IA)
# Dentro da pasta 'backend', crie um arquivo chamado '.env'
# Cole sua chave do Google Gemini no arquivo:
GEMINI_API_KEY="SUA_CHAVE_AQUI"

# 2.7. Aplique as migrações do banco de dados e crie as tabelas
python manage.py migrate

# 2.8. Inicie o Servidor Django
python manage.py runserver

```

O Backend estará rodando na URL: **http://127.0.0.1:8000**

### 3. Configurar o Frontend (React / Vite)

O frontend consome a API do Django para apresentar a interface interativa aos usuários.

**Abra um SEGUNDO terminal (Terminal 2), mantendo o Terminal 1 rodando, e siga:**

```
# 3.1. Navegue até a pasta do frontend (estando na raiz do projeto TEIA)
cd frontend

# 3.2. Instale as dependências do Node.js (necessita do Node instalado na máquina)
npm install

# 3.3. Inicie o servidor de desenvolvimento do Vite
npm run dev

```

O Frontend estará rodando na URL: **http://localhost:5173**
Acesse este link no seu navegador para utilizar o sistema!

## 🛠️ Resolução de Problemas Comuns (Troubleshooting)

### WSL (Windows Subsystem for Linux)

Se ao tentar criar o `venv` o WSL relatar que pacotes estão faltando, instale-os antes:

```
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm -y

```

### Problemas com Conflito de Dependências no Python (`ResolutionImpossible`)

Se o comando `pip install -r requirements.txt` retornar erro sobre versões conflitantes entre `Django`, `asgiref` e `django-renderpdf`, abra o arquivo `requirements.txt` e garanta que as versões estão declaradas assim:

```
Django>=4.2
asgiref>=3.6.0

```

### Resetar Ambiente Virtual Corrompido

Se o seu `venv` do Python parar de funcionar:

```
# Apagar a pasta
rm -rf venv # (Linux) ou del /s /q venv (Windows)

# Recriar e ativar
python -m venv venv
# ... ative o venv novamente ...
pip install -r requirements.txt

```

### Erro de CORS ou IA não carregando na página

Se no frontend a página de "Nova Prática" ficar carregando infinitamente, verifique:

1. Se o arquivo `.env` foi criado corretamente na pasta do backend com a sua `GEMINI_API_KEY`.

2. Se você estourou a cota gratuita diária de acesso à API do Gemini. Caso positivo, gere uma nova chave de API com outra conta Google e substitua no `.env`.

3. Garanta que o terminal do Backend (Terminal 1) está ativo e não travou em nenhuma exceção.

## 👨‍💻 Comandos Úteis para Desenvolvimento

### Backend (Django)

Sempre rode estes comandos **dentro da pasta `backend`** com o `venv` ativado:

```
# Detectar novas alterações no Banco de Dados (após alterar models.py)
python manage.py makemigrations

# Aplicar as alterações detectadas no Banco de Dados
python manage.py migrate

# Criar um superusuário para acessar o painel Admin do Django (/admin)
python manage.py createsuperuser

```

### Frontend (Vite/React)

Sempre rode estes comandos **dentro da pasta `frontend`**:

```
# Instalar um pacote novo (ex: pacote de ícones lucide-react)
npm install lucide-react

# Gerar build final minificado para produção
npm run build

```

## 📚 Sobre o Projeto T.E.I.A

Este projeto foi pensado e desenvolvido no âmbito do grupo de pesquisa da Universidade de Brasília, com a coordenação do Prof. Edison Ishikawa (Departamento de Ciência da Computação - UnB), visando integrar a IA na Educação Básica.

**Autores e Desenvolvedores:**

* Gusthavo de Oliveira Silva

* Gustavo Einstein Soares Oliveira

* Matheus Barbosa