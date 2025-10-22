# 🚀 Deploy Manual - Parity

## 📋 Como Funciona

O deploy para produção é **100% manual**. Você decide quando fazer o deploy.

**Não há deploy automático!** Mesmo fazendo push em qualquer branch, o site só será atualizado quando você disparar o workflow manualmente.

---

## 🎯 Como Fazer Deploy Manualmente

### Opção 1: Via GitHub Interface (Mais Fácil)

1. **Acesse o repositório:**
   ```
   https://github.com/parity-tech/parity-tech
   ```

2. **Vá na aba Actions:**
   - Clique em **Actions** no menu superior

3. **Selecione o workflow de deploy:**
   - No menu lateral esquerdo, clique em **"Deploy to GitHub Pages (Production)"**

4. **Dispare o workflow:**
   - Clique no botão **"Run workflow"** (botão azul/cinza no lado direito)
   - Selecione a branch que quer fazer deploy (geralmente `stable`)
   - Clique em **"Run workflow"** (botão verde)

5. **Acompanhe o progresso:**
   - O workflow aparecerá na lista
   - Aguarde até ficar verde ✅
   - Tempo: 2-5 minutos

6. **Pronto!**
   - Site atualizado em https://parity.com.br

### Opção 2: Via GitHub CLI (Terminal)

Se você tem o GitHub CLI instalado:

```bash
# Disparar deploy da branch stable
gh workflow run "Deploy to GitHub Pages (Production)" --ref stable

# Ver status
gh run list --workflow="Deploy to GitHub Pages (Production)"
```

---

## 🔄 Fluxo de Trabalho Completo

### 1. Desenvolvimento

Trabalhe normalmente em qualquer branch:

```bash
git checkout main
# ... faça suas alterações ...
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

**Resultado:** Código no GitHub, mas **SEM deploy automático**.

### 2. Preparar para Produção

Quando estiver pronto para deploy:

```bash
# Mude para stable e atualize com main
git checkout stable
git merge main
git push origin stable
```

**Resultado:** Código atualizado em `stable`, mas **ainda SEM deploy**.

### 3. Fazer Deploy Manual

Agora sim, faça o deploy:

1. Vá em **Actions** no GitHub
2. Clique em **"Deploy to GitHub Pages (Production)"**
3. Clique em **"Run workflow"**
4. Selecione branch: **stable**
5. Clique em **"Run workflow"** (verde)
6. Aguarde completar (2-5 min)

**Resultado:** 🚀 Site atualizado em produção!

---

## 📊 Vantagens do Deploy Manual

✅ **Controle Total:** Você decide exatamente quando fazer deploy
✅ **Sem Surpresas:** Código não vai para produção acidentalmente
✅ **Teste Antes:** Pode testar localmente antes de fazer deploy
✅ **Horário Flexível:** Faça deploy no horário que quiser
✅ **Rollback Fácil:** Se der problema, pode fazer deploy de um commit anterior

---

## 🔍 Verificar Deploy

### Durante o Deploy:

1. **Actions → Deploy to GitHub Pages (Production)**
2. Veja os logs em tempo real
3. Aguarde os dois jobs:
   - ✅ build
   - ✅ deploy

### Após o Deploy:

```bash
# Terminal - verificar se atualizou
curl -I https://parity.com.br

# Ou abra no navegador (força refresh)
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## 📝 Histórico de Deploys

Para ver todos os deploys já feitos:

1. **Actions** → **Deploy to GitHub Pages (Production)**
2. Veja a lista completa de execuções
3. Cada linha mostra:
   - Data/hora do deploy
   - Quem disparou
   - Commit que foi deployado
   - Status (sucesso/erro)

---

## 🆘 Fazer Deploy de um Commit Específico

Se quiser fazer deploy de um commit específico (não necessariamente o último):

### Via GitHub:

1. **Actions** → **Deploy to GitHub Pages (Production)**
2. **Run workflow**
3. Em "Use workflow from", selecione:
   - Branch: `stable`
   - Ou cole o SHA do commit desejado
4. **Run workflow**

### Via Terminal:

```bash
# Fazer checkout do commit específico
git checkout <commit-hash>

# Criar uma tag ou branch temporária
git tag deploy-temp
git push origin deploy-temp

# No GitHub, rodar workflow usando essa tag
```

---

## 🔄 Rollback (Desfazer Deploy)

Se algo der errado em produção:

### Método 1: Deploy do Commit Anterior

1. Veja o histórico: `git log`
2. Copie o hash do commit que funcionava
3. Faça deploy manual desse commit (instruções acima)

### Método 2: Reverter no Git

```bash
# Na branch stable
git checkout stable
git revert <commit-problema>
git push origin stable

# Depois faça deploy manual no GitHub Actions
```

---

## ⚙️ Configurações do Workflow

O workflow está configurado em:
```
.github/workflows/deploy.yml
```

**Trigger atual:**
```yaml
on:
  workflow_dispatch:  # Apenas manual
```

**Não há trigger automático!** O deploy só acontece quando você clicar em "Run workflow".

---

## 🎓 Dicas e Boas Práticas

### Antes de Fazer Deploy:

- [ ] Teste localmente: `npm run dev`
- [ ] Faça o build: `npm run build`
- [ ] Teste o build: `npm run preview`
- [ ] Commit e push para GitHub
- [ ] Verifique se CI passou (se tiver)
- [ ] Só então faça o deploy manual

### Documentação do Deploy:

Considere criar um changelog ou nota de release:

```bash
# Exemplo de mensagem de commit antes do deploy
git commit -m "release: v1.2.0 - adiciona dashboard de métricas

Features:
- Dashboard de métricas em tempo real
- Exportação de relatórios PDF
- Integração com WhatsApp

Fixes:
- Corrige erro de autenticação
- Melhora performance do carregamento
"
```

### Comunicação:

Se trabalha em equipe:
1. Avise no Slack/Discord antes de fazer deploy
2. Faça deploy em horários de baixo tráfego
3. Monitore por alguns minutos após o deploy

---

## 📞 Problemas Comuns

### "Não vejo o botão Run workflow"

**Solução:** Certifique-se que:
1. Está na aba **Actions**
2. Clicou no workflow **"Deploy to GitHub Pages (Production)"** no menu lateral
3. O botão aparece no lado direito, acima da lista de execuções

### "Deploy falhou com erro"

**Solução:**
1. Clique no workflow que falhou
2. Veja os logs para identificar o erro
3. Erros comuns:
   - Secrets não configurados
   - Erro no build (npm run build)
   - Permissões do GitHub Pages

### "Site não atualiza após deploy"

**Solução:**
1. Aguarde 2-5 minutos
2. Limpe cache do navegador (Ctrl + Shift + R)
3. Verifique em modo anônimo
4. Confirme que workflow completou com sucesso (verde)

---

## ✅ Checklist de Deploy

Antes de cada deploy:

- [ ] Código testado localmente
- [ ] Build funciona sem erros
- [ ] Commit com mensagem descritiva
- [ ] Push para GitHub
- [ ] Branch correta selecionada (stable)
- [ ] Abrir GitHub Actions
- [ ] Clicar em "Run workflow"
- [ ] Acompanhar execução
- [ ] Verificar site após deploy
- [ ] Testar funcionalidades críticas

---

**Resumo:** Deploy é 100% manual. Você tem controle total sobre quando e o que fazer deploy!
