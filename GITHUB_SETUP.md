# 🚀 Configuração do GitHub - Guia Passo a Passo

## ✅ Status Atual

- ✅ Código enviado para o GitHub (commit da0d638)
- ✅ Workflow do GitHub Actions criado
- ✅ Arquivo CNAME com parity.com.br configurado
- ⏳ Aguardando configuração no painel do GitHub

---

## 📋 Próximos Passos no GitHub

### Passo 1: Habilitar GitHub Pages

1. **Acesse seu repositório:**
   ```
   https://github.com/parity-tech/parity-tech
   ```

2. **Vá em Settings (Configurações):**
   - Clique na aba **Settings** no menu superior do repositório

3. **Acesse Pages:**
   - No menu lateral esquerdo, role até encontrar **Pages**
   - Clique em **Pages**

4. **Configure o Source (Fonte):**
   - Em **Build and deployment** → **Source**
   - Selecione: **GitHub Actions** (não selecione "Deploy from a branch")
   - A página deve mostrar: "GitHub Actions - Beta"

5. **Pronto!** Não precisa configurar mais nada nesta seção.

---

### Passo 2: Adicionar Secrets (Variáveis de Ambiente)

1. **Ainda em Settings, vá em Secrets:**
   - No menu lateral esquerdo, clique em **Secrets and variables**
   - Depois clique em **Actions**

2. **Adicione o primeiro Secret:**
   - Clique no botão verde **New repository secret**

   **Secret 1:**
   ```
   Name: VITE_SUPABASE_PROJECT_ID
   Secret: zfcbgkbehtyqbqxzafjd
   ```
   - Clique em **Add secret**

3. **Adicione o segundo Secret:**
   - Clique em **New repository secret** novamente

   **Secret 2:**
   ```
   Name: VITE_SUPABASE_URL
   Secret: https://zfcbgkbehtyqbqxzafjd.supabase.co
   ```
   - Clique em **Add secret**

4. **Adicione o terceiro Secret:**
   - Clique em **New repository secret** novamente

   **Secret 3:**
   ```
   Name: VITE_SUPABASE_PUBLISHABLE_KEY
   Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmY2Jna2JlaHR5cWJxeHphZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTI4NTcsImV4cCI6MjA3NjQyODg1N30.DosTfIOKhaFTrYt9oysmattbvQapZrL2cDuVrDpARf0
   ```
   - Clique em **Add secret**

5. **Verifique:**
   - Você deve ter 3 secrets na lista:
     - ✅ VITE_SUPABASE_PROJECT_ID
     - ✅ VITE_SUPABASE_URL
     - ✅ VITE_SUPABASE_PUBLISHABLE_KEY

---

### Passo 3: Verificar o Deploy (Acontece Automaticamente)

1. **Vá na aba Actions:**
   - Clique em **Actions** no menu superior do repositório

2. **Você verá o workflow rodando:**
   - Nome: "Deploy to GitHub Pages"
   - Status: 🟡 Amarelo (rodando) ou 🟢 Verde (completo) ou 🔴 Vermelho (erro)

3. **Clique no workflow para ver detalhes:**
   - Você verá dois jobs: **build** e **deploy**
   - Aguarde ambos ficarem verdes ✅

4. **Tempo estimado:** 2-5 minutos

---

### Passo 4: Verificar o Site

Após o workflow ficar verde:

1. **Acesse:** https://parity.com.br
   - Pode levar alguns minutos para o DNS propagar
   - Se não funcionar imediatamente, aguarde 5-30 minutos

2. **Verifique o HTTPS:**
   - O GitHub Pages fornece SSL automático
   - Pode levar até 24h para o certificado ser emitido

---

## 🔍 Checklist Completo

### GitHub Pages
- [ ] Acessei Settings → Pages
- [ ] Configurei Source como "GitHub Actions"
- [ ] A página mostra "GitHub Actions - Beta"

### Secrets
- [ ] Adicionei VITE_SUPABASE_PROJECT_ID
- [ ] Adicionei VITE_SUPABASE_URL
- [ ] Adicionei VITE_SUPABASE_PUBLISHABLE_KEY
- [ ] Vejo os 3 secrets na lista

### Deploy
- [ ] Workflow "Deploy to GitHub Pages" está na aba Actions
- [ ] Workflow completou com sucesso (verde)
- [ ] Build job ✅
- [ ] Deploy job ✅

### Teste
- [ ] Site carrega em https://parity.com.br
- [ ] HTTPS está funcionando (cadeado verde)
- [ ] Login funciona
- [ ] Navegação funciona

---

## 🆘 Problemas Comuns

### Workflow com erro vermelho

**Erro: "Resource not accessible by integration"**
- Solução: Vá em Settings → Actions → General
- Em "Workflow permissions", selecione "Read and write permissions"
- Clique em Save

**Erro: "Secret not found"**
- Solução: Verifique se os 3 secrets foram adicionados corretamente
- Os nomes devem estar EXATAMENTE como especificado (com underscores)

### Site não carrega

**ERR_NAME_NOT_RESOLVED**
- DNS ainda não propagou
- Aguarde até 48h
- Verifique com: `nslookup parity.com.br`

**404 Not Found**
- Aguarde o workflow completar
- Verifique se está verde na aba Actions
- Pode levar alguns minutos após o deploy

**Certificado SSL inválido**
- GitHub Pages pode levar até 24h para emitir o certificado
- Use http://parity.com.br temporariamente
- Depois volta a usar https://parity.com.br

---

## 📊 Como Verificar se Está Tudo Certo

### No Terminal (seu computador):

```bash
# Verificar se DNS aponta para GitHub
nslookup parity.com.br

# Deve mostrar:
# Non-authoritative answer:
# Name:   parity.com.br
# Address: 185.199.108.153
# Address: 185.199.109.153
# Address: 185.199.110.153
# Address: 185.199.111.153
```

### No Navegador:

```bash
# Testar site
curl -I https://parity.com.br

# Deve retornar:
# HTTP/2 200
# server: GitHub.com
```

---

## 🎯 Resultado Final Esperado

Após concluir todos os passos:

✅ **Repositório GitHub:**
- Settings → Pages configurado com GitHub Actions
- 3 Secrets configurados
- Workflow rodando automaticamente

✅ **DNS Hostinger:**
- 4 registros A apontando para GitHub Pages
- CNAME www → parity-tech.github.io

✅ **Site:**
- https://parity.com.br carregando
- HTTPS funcionando (pode demorar até 24h)
- Aplicação rodando normalmente

✅ **Deploy Automático:**
- Cada push na branch main → Deploy automático
- Acompanhar em Actions

---

## 🔄 Próximos Deployments

### Estratégia de Branches:

- **`main`** = Desenvolvimento (não faz deploy)
- **`stable`** = Produção (deploy manual em parity.com.br)

### Fluxo de Trabalho:

**Desenvolvimento:**
1. Faça alterações no código
2. `git checkout main`
3. `git add .`
4. `git commit -m "feat: sua mensagem"`
5. `git push origin main`
6. GitHub Actions valida o build (CI)

**Deploy para Produção:**
1. `git checkout stable`
2. `git merge main` (ou crie PR no GitHub)
3. `git push origin stable`
4. **No GitHub:** Actions → "Deploy to GitHub Pages" → "Run workflow"
5. Selecione branch `stable` → Clique em "Run workflow"
6. Site atualiza em 2-5 minutos

📖 **Guia completo:** [MANUAL_DEPLOY.md](MANUAL_DEPLOY.md)

---

**Tem alguma dúvida ou encontrou algum erro? Me avise!**
