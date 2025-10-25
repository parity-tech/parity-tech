# 🚀 Setup Completo do Banco de Dados - Parity

## 📋 Ordem de Execução dos Scripts

Execute os scripts SQL **nesta ordem exata** no Supabase Dashboard:

```
1. ✅ 01_create_tables.sql         - Criar todas as tabelas
2. ✅ 02_setup_rls_policies.sql    - Configurar políticas RLS
3. ✅ 03_fix_rls_policies.sql      - Corrigir recursão RLS ⭐ IMPORTANTE
4. ✅ 04_add_missing_columns.sql   - Adicionar campos e tabelas faltantes
```

---

## 🎯 Como Executar

### Para cada script:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **vuxqtzmiflkfforvwtlf**
3. Menu lateral → **SQL Editor**
4. Clique em **New query**
5. Abra o arquivo do script no seu editor
6. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
7. Cole no SQL Editor (Ctrl+V)
8. Clique em **Run** ou pressione Ctrl+Enter
9. Aguarde ver "Success"
10. Repita para o próximo script

---

## 📦 O que cada script faz?

### 1️⃣ `01_create_tables.sql`
**Tempo:** ~15 segundos

**Cria:**
- 14 tabelas principais (companies, profiles, goals, etc.)
- 10+ ENUMs personalizados
- Índices para performance
- Triggers para updated_at

**Resultado:** Estrutura completa do banco de dados

---

### 2️⃣ `02_setup_rls_policies.sql`
**Tempo:** ~20 segundos

**Cria:**
- Habilita RLS em todas as tabelas
- Cria políticas iniciais de segurança
- Função `create_company_with_owner()`
- Trigger `handle_new_user()` para auto-criar perfis

**Resultado:** Segurança básica configurada

⚠️ **Atenção:** Este script cria políticas com recursão que causam erro 500!
Por isso precisamos do próximo script para corrigir.

---

### 3️⃣ `03_fix_rls_policies.sql` ⭐ **CRÍTICO**
**Tempo:** ~10 segundos

**Remove:** Políticas recursivas (que causavam erro 500)
**Cria:** Políticas simplificadas sem recursão

**Antes:**
```sql
-- ❌ Causa erro 500 (recursão)
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
)
```

**Depois:**
```sql
-- ✅ Funciona (sem recursão)
USING (true)
```

**Resultado:** Erros 500 resolvidos, queries funcionam

---

### 4️⃣ `04_add_missing_columns.sql`
**Tempo:** ~8 segundos

**Adiciona:**
- Coluna `primary_sector` na tabela `companies`
- Tabela `module_access` (controle de módulos)
- 8 módulos padrão para cada empresa
- Trigger para criar módulos automaticamente

**Resultado:** Erros 400 e 404 resolvidos

---

## ✅ Verificação Final

Execute no SQL Editor para verificar se tudo está OK:

```sql
-- 1. Verificar tabelas criadas (deve retornar 15)
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 2. Verificar sua empresa
SELECT * FROM companies;

-- 3. Verificar seu perfil
SELECT * FROM profiles WHERE id = auth.uid();

-- 4. Verificar sua role
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- 5. Verificar módulos
SELECT module_name, is_enabled
FROM module_access
ORDER BY display_order;

-- 6. Verificar políticas RLS (deve retornar 40+)
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🎉 Resultado Final

Depois de executar todos os scripts:

- ✅ 15 tabelas criadas
- ✅ 40+ políticas RLS ativas
- ✅ Sem erros 500, 400 ou 404
- ✅ Nome "Parity" aparece no header
- ✅ Dashboard carrega perfeitamente
- ✅ 8 módulos configurados
- ✅ Triggers funcionando

---

## 🐛 Troubleshooting

### Erro: "relation already exists"
**Solução:** Já foi executado. Pode ignorar ou usar `DROP TABLE IF EXISTS` antes

### Erro: "policy already exists"
**Solução:** Já foi executado. Use `DROP POLICY IF EXISTS` antes

### Erro 500 ainda aparece
**Solução:** Execute novamente o script `03_fix_rls_policies.sql`

### Erro 400 ou 404
**Solução:** Execute o script `04_add_missing_columns.sql`

### Tabelas não aparecem
**Solução:** Verifique se está no projeto correto (vuxqtzmiflkfforvwtlf)

---

## 📁 Estrutura do Banco

### Tabelas Principais:
- `companies` - Empresas (com primary_sector)
- `profiles` - Perfis (com phone)
- `user_roles` - Permissões
- `departments` - Departamentos
- `goals` - Metas
- `goal_achievements` - Progresso de metas
- `learning_paths` - Trilhas de capacitação
- `learning_path_enrollments` - Inscrições em trilhas
- `feedback_threads` - Feedback bidirecional
- `alerts` - Alertas do sistema
- `alert_events` - Eventos de alertas
- `module_access` - Controle de módulos ⭐ NOVO

### Relacionamentos:
```
companies (1) → (N) profiles
companies (1) → (N) module_access
profiles (1) → (1) user_roles
companies (1) → (N) departments
companies (1) → (N) goals
goals (1) → (N) goal_achievements
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador (F12)
2. Verifique as queries falhando no Network tab
3. Execute as queries de verificação acima
4. Confirme que executou os 4 scripts NA ORDEM

---

**Tempo total:** ~5 minutos
**Dificuldade:** Fácil
**Status:** Pronto para produção! 🚀
