# 🌳 Estratégia de Branches - Parity

## 📋 Branches Principais

### `main` - Desenvolvimento
- **Propósito:** Branch de desenvolvimento e integração
- **Uso:** Desenvolvimento diário, features em progresso
- **Deploy:** Não faz deploy automático em produção
- **CI:** Roda build e testes para validar o código
- **Proteção:** Recomendado proteger e exigir PR reviews

### `stable` - Produção
- **Propósito:** Branch de produção estável
- **Uso:** Código pronto e testado para produção
- **Deploy:** Deploy automático para https://parity.com.br
- **CI:** Build + Deploy no GitHub Pages
- **Proteção:** SEMPRE proteger esta branch

---

## 🔄 Fluxo de Trabalho

### Desenvolvimento Normal

```bash
# 1. Trabalhe na branch main
git checkout main
git pull origin main

# 2. Faça suas alterações
# ... edite arquivos ...

# 3. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 4. GitHub Actions vai validar o build (CI)
# ✅ Se passar, está pronto para produção
```

### Deploy para Produção

Quando o código em `main` estiver pronto e testado:

```bash
# 1. Certifique-se que está na main atualizada
git checkout main
git pull origin main

# 2. Mude para stable
git checkout stable
git pull origin stable

# 3. Merge da main para stable
git merge main

# 4. Push para produção
git push origin stable

# 5. GitHub Actions faz deploy automático!
# 🚀 Site atualiza em https://parity.com.br em 2-5 minutos
```

### Alternativa: Merge via GitHub (Recomendado)

1. No GitHub, crie um Pull Request de `main` → `stable`
2. Revise as mudanças
3. Clique em "Merge Pull Request"
4. Deploy automático acontece

---

## 🎯 Quando Usar Cada Branch

### Use `main` para:
- ✅ Desenvolvimento de novas features
- ✅ Correções de bugs
- ✅ Experimentos
- ✅ Código em teste
- ✅ Work in progress

### Use `stable` para:
- ✅ Código pronto para produção
- ✅ Releases
- ✅ Hotfixes urgentes (direto na stable, depois merge em main)
- ✅ Código validado e testado

---

## 🚀 Workflows do GitHub Actions

### 1. CI - Validate Build (main)
**Arquivo:** `.github/workflows/ci.yml`

**Trigger:** Push ou PR em `main`

**O que faz:**
1. Instala dependências
2. Roda lint (validação de código)
3. Faz build do projeto
4. Valida se está tudo OK

**Status:** Badge verde = pronto para produção

### 2. Deploy to GitHub Pages (stable)
**Arquivo:** `.github/workflows/deploy.yml`

**Trigger:** Push em `stable`

**O que faz:**
1. Instala dependências
2. Faz build de produção
3. Deploy no GitHub Pages
4. Site fica disponível em https://parity.com.br

**Status:** Badge verde = site online

---

## 🔒 Proteção de Branches (Recomendado)

Configure no GitHub para evitar acidentes:

### Proteger `stable`:

1. Vá em **Settings** → **Branches**
2. Clique em **Add branch protection rule**
3. Branch name pattern: `stable`
4. Ative:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings

### Proteger `main` (Opcional):

Mesma configuração acima, mas para `main`

---

## 📊 Fluxo Visual

```
Desenvolvimento:
┌─────────┐    git push     ┌──────────────┐
│  Local  │ ────────────→   │     main     │
└─────────┘                 └──────────────┘
                                   │
                                   │ GitHub Actions
                                   ↓
                            ✅ CI: Build + Lint


Produção:
┌──────────────┐    PR/Merge    ┌──────────────┐
│     main     │ ─────────────→  │    stable    │
└──────────────┘                 └──────────────┘
                                        │
                                        │ GitHub Actions
                                        ↓
                                 🚀 Deploy to Production
                                        │
                                        ↓
                                https://parity.com.br
```

---

## 🔥 Hotfixes de Emergência

Se precisar corrigir algo urgente em produção:

```bash
# 1. Corrija direto na stable
git checkout stable
git pull origin stable

# 2. Faça a correção
# ... edite arquivos ...

# 3. Commit e push
git add .
git commit -m "hotfix: correção urgente"
git push origin stable
# Deploy automático acontece

# 4. IMPORTANTE: Merge de volta para main
git checkout main
git merge stable
git push origin main
```

---

## 📝 Convenção de Commits

Use mensagens claras e descritivas:

```bash
# Features
git commit -m "feat: adiciona integração com WhatsApp"

# Bugfixes
git commit -m "fix: corrige erro de autenticação"

# Refatoração
git commit -m "refactor: melhora performance do dashboard"

# Documentação
git commit -m "docs: atualiza README com novos comandos"

# Style
git commit -m "style: ajusta formatação do código"

# Hotfix
git commit -m "hotfix: corrige erro crítico de login"
```

---

## ✅ Checklist de Deploy

Antes de fazer merge de `main` → `stable`:

- [ ] Código testado localmente (`npm run dev`)
- [ ] Build funciona sem erros (`npm run build`)
- [ ] CI passou na branch main (badge verde)
- [ ] Funcionalidades testadas
- [ ] Sem erros no console do navegador
- [ ] Responsivo testado (mobile/desktop)
- [ ] Pronto para usuários verem

---

## 🆘 Rollback (Desfazer Deploy)

Se algo der errado em produção:

```bash
# 1. Veja o último commit bom
git checkout stable
git log

# 2. Volte para o commit anterior
git reset --hard <commit-hash-anterior>

# 3. Force push (CUIDADO!)
git push origin stable --force

# Deploy automático acontece com código anterior
```

**Alternativa mais segura:**
```bash
# Reverta o commit problemático
git revert <commit-hash-problema>
git push origin stable
```

---

## 📞 Dúvidas Frequentes

### "Posso desenvolver direto na stable?"
❌ Não recomendado. Sempre desenvolva em `main` e depois faça merge para `stable`.

### "E se eu esquecer de fazer merge para stable?"
✅ Sem problemas! O código fica em `main` e pode ser mergeado quando estiver pronto.

### "Posso criar outras branches?"
✅ Sim! Para features grandes, crie branches: `feature/nome-da-feature`
- Depois merge em `main`
- E de `main` para `stable`

### "O que acontece se eu fizer push direto em stable?"
🚀 Deploy automático acontece imediatamente em produção!

---

**Resumo:** Desenvolva em `main`, teste, valide, e só então faça merge para `stable` (produção).
