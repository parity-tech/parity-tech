# Parity - O futuro do trabalho começa por aqui

Soluções jurídicas e de gestão para RH, financeiro e jurídico. Previna passivos trabalhistas, estruture documentação e fortaleça sua gestão de pessoas.

## Requisitos

- Node.js 18+ ([instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm ou yarn

## Desenvolvimento Local

1. Clone o repositório:
```sh
git clone <YOUR_GIT_URL>
cd parity-tech
```

2. Instale as dependências:
```sh
npm install
```

3. Configure as variáveis de ambiente:
```sh
cp .env.example .env
```
Edite o arquivo `.env` com suas credenciais do Supabase.

4. Inicie o servidor de desenvolvimento:
```sh
npm run dev
```

O aplicativo estará disponível em `http://localhost:8080`

## Tecnologias

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (Auth, Database, Functions)
- **Form Management:** React Hook Form + Zod
- **State Management:** TanStack Query

## Deploy e Domínio Customizado

### Deploy no GitHub Pages (parity.com.br) ⭐

Este projeto usa deploy automático no GitHub Pages com o domínio customizado **parity.com.br**.

**Estratégia de Branches:**
- `main` - Branch de desenvolvimento (CI/validação)
- `stable` - Branch de produção (deploy manual)

📖 **Leia:** [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md) para entender o fluxo de trabalho

#### Configuração Inicial (Uma vez apenas)

**1. Habilite o GitHub Pages no repositório:**
   - Acesse **Settings** → **Pages**
   - Em **Source**, selecione **GitHub Actions**

**2. Configure as variáveis de ambiente (Secrets):**
   - Acesse **Settings** → **Secrets and variables** → **Actions**
   - Clique em **New repository secret** e adicione:
     - Nome: `VITE_SUPABASE_PROJECT_ID` | Valor: seu project id
     - Nome: `VITE_SUPABASE_URL` | Valor: sua URL do Supabase
     - Nome: `VITE_SUPABASE_PUBLISHABLE_KEY` | Valor: sua chave pública

**3. Configure o DNS do domínio parity.com.br:**

   No seu provedor de DNS (Registro.br ou outro), adicione os seguintes registros:

   **Opção A - Usando registros A (Recomendado):**
   ```
   Tipo: A
   Nome: @
   Valor: 185.199.108.153

   Tipo: A
   Nome: @
   Valor: 185.199.109.153

   Tipo: A
   Nome: @
   Valor: 185.199.110.153

   Tipo: A
   Nome: @
   Valor: 185.199.111.153
   ```

   **Opção B - Usando CNAME (alternativa):**
   ```
   Tipo: CNAME
   Nome: www
   Valor: <seu-usuario-github>.github.io
   ```

**4. Deploy manual:**
   - Deploy é feito manualmente via GitHub Actions
   - Vá em **Actions** → **"Deploy to GitHub Pages"** → **"Run workflow"**
   - Selecione a branch `stable` e clique em **"Run workflow"**
   - O site será atualizado em https://parity.com.br em 2-5 minutos
   - 📖 Guia completo: [MANUAL_DEPLOY.md](MANUAL_DEPLOY.md)

#### Teste Local Antes do Deploy

```sh
npm run build
npm run preview
```

### Outras Opções de Deploy

<details>
<summary>Opção Alternativa: Deploy na Vercel</summary>

1. Instale a CLI da Vercel:
```sh
npm i -g vercel
```

2. Faça login e deploy:
```sh
vercel login
vercel
```

3. Configure as variáveis de ambiente na dashboard da Vercel
4. Configure seu domínio customizado em **Settings** → **Domains**
</details>

<details>
<summary>Opção Alternativa: Deploy na Netlify</summary>

1. Instale a CLI da Netlify:
```sh
npm i -g netlify-cli
```

2. Faça login e deploy:
```sh
netlify login
netlify deploy --prod
```

3. Configure as variáveis de ambiente em **Site settings** → **Environment variables**
4. Configure domínio customizado em **Domain settings**
</details>

## Variáveis de Ambiente

Variáveis necessárias para produção:

```env
VITE_SUPABASE_PROJECT_ID=seu_project_id
VITE_SUPABASE_URL=https://seu-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
```

**Importante:** Nunca commite o arquivo `.env` com credenciais reais. Use `.env.example` como template.

## Configuração do Supabase Edge Functions

Para a função de geração de ações corretivas, configure no Supabase:

1. Vá em **Project Settings** → **Edge Functions**
2. Adicione a variável de ambiente:
   - `OPENAI_API_KEY`: Sua chave da API OpenAI
