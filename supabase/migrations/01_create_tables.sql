-- ============================================================================
-- PARITY - Criação de Tabelas do Banco de Dados
-- ============================================================================
-- Este script cria TODAS as tabelas necessárias para o projeto Parity
-- Execute este script PRIMEIRO, antes do setup_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUMS (Tipos Personalizados)
-- ============================================================================

-- Roles de usuário
CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'usuario');

-- Tipos de departamento
CREATE TYPE department_type AS ENUM (
  'administrativo',
  'comercial',
  'operacoes',
  'ti',
  'financeiro',
  'rh',
  'juridico',
  'vendas',
  'marketing',
  'producao',
  'logistica',
  'qualidade',
  'infraestrutura',
  'desenvolvimento'
);

-- Status de feedback
CREATE TYPE feedback_status AS ENUM ('aberto', 'em_analise', 'implementado', 'rejeitado');

-- Período de metas
CREATE TYPE goal_period AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- Tipo de métrica de meta
CREATE TYPE goal_metric_type AS ENUM (
  'tickets_resolved',
  'calls_made',
  'emails_sent',
  'meetings_attended',
  'tasks_completed',
  'custom'
);

-- Status de integração
CREATE TYPE integration_status AS ENUM ('ativo', 'inativo', 'erro', 'pendente');

-- Prioridade de alerta
CREATE TYPE alert_priority AS ENUM ('baixa', 'media', 'alta', 'critica');

-- Nível de risco
CREATE TYPE risk_level AS ENUM ('baixo', 'medio', 'alto', 'critico');

-- ============================================================================
-- 3. TABELA: COMPANIES (Empresas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document TEXT, -- CNPJ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- ============================================================================
-- 4. TABELA: DEPARTMENTS (Departamentos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type department_type,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);

-- ============================================================================
-- 5. TABELA: PROFILES (Perfis de Usuários)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  full_name TEXT,
  phone TEXT, -- Telefone formatado (11) 91234-5678
  position TEXT, -- Cargo
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);

-- ============================================================================
-- 6. TABELA: USER_ROLES (Roles/Permissões dos Usuários)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role user_role DEFAULT 'usuario',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que cada usuário tenha apenas um role por empresa
  UNIQUE(user_id, company_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company ON user_roles(company_id);

-- ============================================================================
-- 7. TABELA: GOALS (Metas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  metric_type goal_metric_type NOT NULL,
  target_value DECIMAL NOT NULL,
  period goal_period NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_goals_company ON goals(company_id);
CREATE INDEX IF NOT EXISTS idx_goals_department ON goals(department_id);

-- ============================================================================
-- 8. TABELA: GOAL_ACHIEVEMENTS (Conquistas de Metas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS goal_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL DEFAULT 0,
  achievement_percentage DECIMAL DEFAULT 0,
  is_achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_goal_achievements_user ON goal_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_achievements_goal ON goal_achievements(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_achievements_period ON goal_achievements(period_start, period_end);

-- ============================================================================
-- 9. TABELA: LEARNING_PATHS (Trilhas de Aprendizado)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_learning_paths_company ON learning_paths(company_id);

-- ============================================================================
-- 10. TABELA: LEARNING_PATH_ENROLLMENTS (Inscrições em Trilhas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_path_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  completion_status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  progress_percentage DECIMAL DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(learning_path_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON learning_path_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_path ON learning_path_enrollments(learning_path_id);

-- ============================================================================
-- 11. TABELA: FEEDBACK_THREADS (Threads de Feedback)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status feedback_status DEFAULT 'aberto',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_feedback_sender ON feedback_threads(sender_id);
CREATE INDEX IF NOT EXISTS idx_feedback_receiver ON feedback_threads(receiver_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_threads(status);

-- ============================================================================
-- 12. TABELA: ALERTS (Alertas do Sistema)
-- ============================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority alert_priority DEFAULT 'media',
  risk_level risk_level,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alerts_company ON alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);

-- ============================================================================
-- 13. TABELA: ALERT_EVENTS (Eventos de Alerta)
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  triggered_by_data JSONB NOT NULL,
  risk_level TEXT,
  risk_score DECIMAL,
  ai_suggested_actions TEXT,
  corrective_action_document TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alert_events_alert ON alert_events(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_company ON alert_events(company_id);

-- ============================================================================
-- 14. FUNÇÃO: Atualizar timestamp automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. TRIGGERS: Atualizar updated_at automaticamente
-- ============================================================================

-- Companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Goal Achievements
CREATE TRIGGER update_goal_achievements_updated_at
  BEFORE UPDATE ON goal_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Feedback Threads
CREATE TRIGGER update_feedback_threads_updated_at
  BEFORE UPDATE ON feedback_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 16. VERIFICAÇÃO
-- ============================================================================

-- Listar todas as tabelas criadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Próximo passo: Execute o arquivo setup_rls_policies.sql
-- ============================================================================
