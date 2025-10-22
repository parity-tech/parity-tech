# 🔒 Resolver Problema de SSL - parity.com.br

## ✅ Status Atual

- ✅ DNS configurado corretamente (Hostinger)
- ✅ Site deployado no GitHub Pages
- ✅ HTTP funcionando: http://parity.com.br
- ❌ HTTPS não funciona: certificado inválido
- ❌ Erro: `SSL_ERROR_BAD_CERT_DOMAIN`

## 🎯 Solução Passo a Passo

### Passo 1: Remover Domínio Customizado (Temporariamente)

1. **Acesse:** https://github.com/parity-tech/parity-tech/settings/pages

2. **Na seção "Custom domain":**
   - Se tiver algo escrito, clique no **X** para remover
   - Ou delete o texto e clique em **Save**
   - Deve ficar vazio

3. **Aguarde 1 minuto**

### Passo 2: Fazer um Novo Deploy Limpo

1. **Acesse:** https://github.com/parity-tech/parity-tech/actions

2. **Clique em:** "Deploy to GitHub Pages (Production)" (menu lateral esquerdo)

3. **Clique em:** "Run workflow" (botão no canto direito)

4. **Selecione:** Branch `stable`

5. **Clique em:** "Run workflow" (botão verde)

6. **Aguarde até ficar verde ✅** (2-5 minutos)

### Passo 3: Adicionar Domínio Customizado Novamente

**Após o deploy completar (verde ✅):**

1. **Volte em:** https://github.com/parity-tech/parity-tech/settings/pages

2. **Na seção "Custom domain":**
   - Digite: `parity.com.br`
   - Clique em **Save**

3. **Aguarde a verificação do DNS:**
   - Pode aparecer: "DNS check in progress..."
   - Ou: "DNS check successful ✓"
   - Aguarde até aparecer a mensagem de sucesso

### Passo 4: Habilitar HTTPS

**Após a verificação DNS passar:**

1. **Na mesma página (GitHub Pages settings):**
   - Procure a opção: **☐ Enforce HTTPS**
   - Marque a caixa: **☑ Enforce HTTPS**

2. **Se aparecer uma mensagem:**
   - "Certificate not yet created" ou similar
   - É normal! O GitHub vai provisionar o certificado automaticamente

3. **Aguarde:** 15 minutos a 24 horas
   - Geralmente leva **1 hora**
   - O GitHub emite o certificado SSL automaticamente via Let's Encrypt

### Passo 5: Verificar se Funcionou

**Após 1 hora, teste:**

1. **Acesse:** https://parity.com.br
2. **Deve carregar com cadeado verde** 🔒✅

**Se ainda não funcionar:**
- Aguarde mais tempo (até 24h)
- Limpe cache do navegador (Ctrl + Shift + Del)
- Tente em modo anônimo

---

## 🆘 Se Continuar com Erro Após 24h

### Opção A: Verificar Status no GitHub

1. Vá em: https://github.com/parity-tech/parity-tech/settings/pages
2. Veja se aparece alguma mensagem de erro
3. Se aparecer "Certificate not yet created", aguarde mais

### Opção B: Remover e Adicionar Novamente

1. Remova o domínio customizado
2. Aguarde 5 minutos
3. Adicione novamente
4. Aguarde a verificação DNS
5. Habilite HTTPS
6. Aguarde 1 hora

### Opção C: Verificar CNAME no Deploy

1. Acesse: https://parity-tech.github.io/parity-tech/CNAME
2. Deve mostrar apenas: `parity.com.br`
3. Se não aparecer ou estiver errado, faça novo deploy

---

## 📋 Checklist Completo

- [ ] **Passo 1:** Removi domínio customizado do GitHub Pages
- [ ] **Passo 2:** Fiz novo deploy manual
- [ ] **Passo 3:** Deploy completou com sucesso (verde ✅)
- [ ] **Passo 4:** Adicionei `parity.com.br` no Custom domain
- [ ] **Passo 5:** Cliquei em Save
- [ ] **Passo 6:** DNS verification passou ✓
- [ ] **Passo 7:** Marquei "Enforce HTTPS"
- [ ] **Passo 8:** Aguardei 1 hora
- [ ] **Passo 9:** Testei https://parity.com.br
- [ ] **Passo 10:** Funciona! 🎉

---

## ⏰ Linha do Tempo Esperada

| Tempo | O Que Acontece |
|-------|----------------|
| Agora | Remover domínio + novo deploy |
| +5 min | Deploy completo ✅ |
| +6 min | Adicionar domínio customizado |
| +7 min | DNS verification em progresso |
| +10 min | DNS verification passa ✓ |
| +11 min | Habilitar "Enforce HTTPS" |
| +15 min | GitHub inicia provisão do certificado |
| **+1 hora** | **Certificado SSL ativo ✅** |
| +1h 1min | https://parity.com.br funciona! 🎉 |

---

## 🔍 Como Verificar o Progresso

### Ver se certificado foi emitido:

```bash
# No terminal
openssl s_client -connect parity.com.br:443 -servername parity.com.br 2>/dev/null | grep "subject="
```

**Deve mostrar:**
```
subject=CN=parity.com.br
```

**Se mostrar:**
```
subject=CN=*.github.io
```
→ Ainda não foi emitido, aguarde mais

---

## 💡 Dicas Importantes

1. **Não fique atualizando a página o tempo todo**
   - Isso não acelera o processo
   - O certificado é emitido automaticamente em background

2. **Use http:// enquanto aguarda**
   - http://parity.com.br funciona perfeitamente
   - Use temporariamente até o SSL ficar pronto

3. **Seja paciente**
   - Certificados SSL podem levar até 24h
   - Normalmente leva 1 hora
   - É automático, você não precisa fazer nada

4. **Cache do navegador**
   - Às vezes o navegador guarda o erro em cache
   - Use modo anônimo para testar
   - Ou limpe o cache (Ctrl + Shift + Del)

---

## ✅ Resultado Final

Após seguir todos os passos e aguardar:

- ✅ https://parity.com.br carrega com cadeado verde
- ✅ Certificado SSL válido
- ✅ Nenhum erro de segurança
- ✅ Site 100% funcional

---

**Comece pelo Passo 1 agora e siga em ordem!**
