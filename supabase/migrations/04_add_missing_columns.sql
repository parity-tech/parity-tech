-- ============================================================================
-- PARITY - Adicionar Colunas e Tabelas Faltantes
-- ============================================================================
-- Este script adiciona campos que estão sendo usados no código mas não existem no banco
-- Execute este script DEPOIS do 03_fix_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNA primary_sector NA TABELA COMPANIES
-- ============================================================================

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS primary_sector TEXT;

COMMENT ON COLUMN companies.primary_sector IS 'Setor primário da empresa (comercio, servicos, industria, etc)';

-- ============================================================================
-- 2. CRIAR TABELA module_access (Controle de Acesso a Módulos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que cada módulo seja único por empresa
  UNIQUE(company_id, module_name)
);

COMMENT ON TABLE module_access IS 'Controla quais módulos cada empresa tem acesso';
COMMENT ON COLUMN module_access.module_name IS 'Nome do módulo (compliance, commercial, analytics, etc)';
COMMENT ON COLUMN module_access.is_enabled IS 'Se o módulo está ativo para a empresa';
COMMENT ON COLUMN module_access.display_order IS 'Ordem de exibição no dashboard';

-- Índices
CREATE INDEX IF NOT EXISTS idx_module_access_company ON module_access(company_id);
CREATE INDEX IF NOT EXISTS idx_module_access_module ON module_access(module_name);
CREATE INDEX IF NOT EXISTS idx_module_access_enabled ON module_access(is_enabled);

-- ============================================================================
-- 3. HABILITAR RLS NA TABELA module_access
-- ============================================================================

ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas
CREATE POLICY "Allow all authenticated users to view module access"
  ON module_access
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create module access"
  ON module_access
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update module access"
  ON module_access
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete module access"
  ON module_access
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 4. TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================================================

CREATE TRIGGER update_module_access_updated_at
  BEFORE UPDATE ON module_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. INSERIR MÓDULOS PADRÃO PARA EMPRESAS EXISTENTES
-- ============================================================================

-- Inserir módulos padrão para todas as empresas que ainda não têm
INSERT INTO module_access (company_id, module_name, is_enabled, display_order)
SELECT
  c.id,
  module.name,
  module.enabled,
  module.ord
FROM companies c
CROSS JOIN (
  VALUES
    ('compliance', true, 1),
    ('geolocalization', true, 2),
    ('commercial', false, 3),
    ('customer-service', false, 4),
    ('hr-integrations', false, 5),
    ('analytics', false, 6),
    ('alerts', true, 7),
    ('people-management', false, 8)
) AS module(name, enabled, ord)
ON CONFLICT (company_id, module_name) DO NOTHING;

-- ============================================================================
-- 6. FUNÇÃO: Criar módulos padrão ao criar empresa
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_modules_for_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar módulos padrão para a nova empresa
  INSERT INTO module_access (company_id, module_name, is_enabled, display_order)
  VALUES
    (NEW.id, 'compliance', true, 1),
    (NEW.id, 'geolocalization', true, 2),
    (NEW.id, 'commercial', false, 3),
    (NEW.id, 'customer-service', false, 4),
    (NEW.id, 'hr-integrations', false, 5),
    (NEW.id, 'analytics', false, 6),
    (NEW.id, 'alerts', true, 7),
    (NEW.id, 'people-management', false, 8);

  RETURN NEW;
END;
$$;

-- Trigger para criar módulos automaticamente ao criar empresa
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_modules_for_company();

-- ============================================================================
-- 7. VERIFICAÇÃO
-- ============================================================================

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND column_name = 'primary_sector';

-- Verificar se a tabela foi criada
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = 'module_access') as total_columns
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'module_access';

-- Listar módulos criados
SELECT
  c.name as company_name,
  ma.module_name,
  ma.is_enabled,
  ma.display_order
FROM module_access ma
JOIN companies c ON c.id = ma.company_id
ORDER BY c.name, ma.display_order;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Próximo passo: Recarregar a aplicação
-- ============================================================================
