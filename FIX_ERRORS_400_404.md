# 🔧 Corrigir Erros 400 e 404

## 🎯 Problema

Depois de executar o script RLS, surgiram novos erros:

- **HTTP 400** - Coluna `primary_sector` não existe na tabela `companies`
- **HTTP 404** - Tabela `module_access` não existe

## ✅ Solução (2 minutos)

### Passo 1: Executar Script SQL

1. Abra o Supabase Dashboard
2. SQL Editor → New query
3. Copie todo o conteúdo de `supabase/migrations/04_add_missing_columns.sql`
4. Cole no editor e clique em **Run**

### Passo 2: Recarregar Aplicação

1. No navegador: **Ctrl+Shift+R**
2. Os erros 400 e 404 devem desaparecer
3. O Dashboard deve carregar completamente

---

## 📊 O que o script faz?

### 1. Adiciona coluna `primary_sector` na tabela `companies`
```sql
ALTER TABLE companies ADD COLUMN primary_sector TEXT;
```

Esta coluna armazena o setor da empresa (comércio, serviços, indústria, etc)

### 2. Cria tabela `module_access`
```sql
CREATE TABLE module_access (
  company_id UUID,
  module_name TEXT,  -- Nome do módulo
  is_enabled BOOLEAN,  -- Se está ativo
  display_order INTEGER  -- Ordem no dashboard
);
```

Esta tabela controla quais módulos cada empresa tem acesso.

### 3. Insere módulos padrão
O script cria automaticamente 8 módulos para sua empresa:
- ✅ Compliance (ativo)
- ✅ Geolocalização (ativo)
- ⚪ Área Comercial (desativado)
- ⚪ Atendimento ao Cliente (desativado)
- ⚪ Integrações de RH (desativado)
- ⚪ Analytics & BI (desativado)
- ✅ Alertas (ativo)
- ⚪ Gestão de Pessoas (desativado)

### 4. Cria trigger automático
Sempre que uma nova empresa for criada, os módulos padrão serão criados automaticamente.

---

## ✅ Verificação

Execute no SQL Editor para confirmar:

```sql
-- Ver módulos da sua empresa
SELECT module_name, is_enabled, display_order
FROM module_access
WHERE company_id = (SELECT id FROM companies LIMIT 1)
ORDER BY display_order;
```

Deve retornar 8 módulos.

---

## 🎉 Resultado Esperado

Depois de executar:
- ✅ Erros 400 (primary_sector) resolvidos
- ✅ Erros 404 (module_access) resolvidos
- ✅ Dashboard carrega sem erros
- ✅ Nome "Parity" aparece no header
- ✅ Módulos aparecem corretamente

---

**Execute agora o script `04_add_missing_columns.sql`!**
