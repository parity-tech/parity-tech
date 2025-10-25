-- ============================================================================
-- PARITY - Configuração de RLS (Row Level Security)
-- ============================================================================
-- Este script configura TODAS as políticas de segurança do banco de dados
-- Execute este script DEPOIS do 01_create_tables.sql
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLÍTICAS PARA COMPANIES
-- ============================================================================

-- Usuários autenticados podem criar empresas
CREATE POLICY "Users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários podem ver empresas das quais fazem parte
CREATE POLICY "Users can view their companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins podem atualizar suas empresas
CREATE POLICY "Admins can update their companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ============================================================================
-- 3. POLÍTICAS PARA DEPARTMENTS
-- ============================================================================

-- Usuários podem ver departamentos da sua empresa
CREATE POLICY "Users can view company departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins e gestores podem criar departamentos
CREATE POLICY "Admins and managers can create departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- Admins e gestores podem atualizar departamentos
CREATE POLICY "Admins and managers can update departments"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- ============================================================================
-- 4. POLÍTICAS PARA PROFILES
-- ============================================================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Usuários podem ver perfis da mesma empresa
CREATE POLICY "Users can view company profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- 5. POLÍTICAS PARA USER_ROLES
-- ============================================================================

-- Usuários podem ver roles da sua empresa
CREATE POLICY "Users can view company roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins podem criar roles na sua empresa
CREATE POLICY "Admins can create roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Admins podem atualizar roles na sua empresa
CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Admins podem deletar roles na sua empresa
CREATE POLICY "Admins can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ============================================================================
-- 6. POLÍTICAS PARA GOALS
-- ============================================================================

-- Usuários podem ver metas da sua empresa
CREATE POLICY "Users can view company goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins e gestores podem criar metas
CREATE POLICY "Admins and managers can create goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- Admins e gestores podem atualizar metas
CREATE POLICY "Admins and managers can update goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- ============================================================================
-- 7. POLÍTICAS PARA GOAL_ACHIEVEMENTS
-- ============================================================================

-- Usuários podem ver suas próprias conquistas
CREATE POLICY "Users can view own achievements"
  ON goal_achievements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Gestores podem ver conquistas da sua empresa
CREATE POLICY "Managers can view company achievements"
  ON goal_achievements
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- Gestores podem criar conquistas
CREATE POLICY "Managers can create achievements"
  ON goal_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- Gestores podem atualizar conquistas
CREATE POLICY "Managers can update achievements"
  ON goal_achievements
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- ============================================================================
-- 8. POLÍTICAS PARA LEARNING_PATHS
-- ============================================================================

-- Usuários podem ver trilhas da sua empresa
CREATE POLICY "Users can view company learning paths"
  ON learning_paths
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins e gestores podem criar trilhas
CREATE POLICY "Admins and managers can create learning paths"
  ON learning_paths
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- Admins e gestores podem atualizar trilhas
CREATE POLICY "Admins and managers can update learning paths"
  ON learning_paths
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- ============================================================================
-- 9. POLÍTICAS PARA LEARNING_PATH_ENROLLMENTS
-- ============================================================================

-- Usuários podem ver suas próprias inscrições
CREATE POLICY "Users can view own enrollments"
  ON learning_path_enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Gestores podem ver inscrições da empresa
CREATE POLICY "Managers can view company enrollments"
  ON learning_path_enrollments
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'gestor')
    )
  );

-- Usuários podem se inscrever em trilhas
CREATE POLICY "Users can create own enrollments"
  ON learning_path_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar suas inscrições
CREATE POLICY "Users can update own enrollments"
  ON learning_path_enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 10. POLÍTICAS PARA FEEDBACK_THREADS
-- ============================================================================

-- Usuários podem ver feedback que enviaram ou receberam
CREATE POLICY "Users can view their feedback threads"
  ON feedback_threads
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Usuários podem criar feedback
CREATE POLICY "Users can create feedback threads"
  ON feedback_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Usuários podem atualizar feedback que enviaram ou receberam
CREATE POLICY "Users can update their feedback threads"
  ON feedback_threads
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================================================
-- 11. POLÍTICAS PARA ALERTS
-- ============================================================================

-- Usuários podem ver alertas da sua empresa
CREATE POLICY "Users can view company alerts"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins podem criar alertas
CREATE POLICY "Admins can create alerts"
  ON alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Admins podem atualizar alertas
CREATE POLICY "Admins can update alerts"
  ON alerts
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT ur.company_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ============================================================================
-- 12. POLÍTICAS PARA ALERT_EVENTS
-- ============================================================================

-- Usuários podem ver eventos de alerta da sua empresa
CREATE POLICY "Users can view company alert events"
  ON alert_events
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Sistema pode criar eventos de alerta
CREATE POLICY "System can create alert events"
  ON alert_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Usuários podem atualizar reconhecimento de alertas
CREATE POLICY "Users can update alert event acknowledgment"
  ON alert_events
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 13. FUNÇÃO: Criar empresa com proprietário
-- ============================================================================
-- Esta função permite criar uma empresa e automaticamente associar o usuário
-- como proprietário (admin) sem violar as políticas RLS

CREATE OR REPLACE FUNCTION create_company_with_owner(
  p_company_name TEXT,
  p_company_document TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_result JSON;
BEGIN
  -- Verificar se o usuário já tem uma empresa
  IF EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND company_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Usuário já possui uma empresa associada';
  END IF;

  -- Criar a empresa
  INSERT INTO companies (name, document)
  VALUES (p_company_name, p_company_document)
  RETURNING id INTO v_company_id;

  -- Atualizar o perfil do usuário com a empresa
  UPDATE profiles
  SET company_id = v_company_id,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Criar role de admin para o usuário
  INSERT INTO user_roles (user_id, company_id, role)
  VALUES (p_user_id, v_company_id, 'admin');

  -- Retornar dados da empresa criada
  SELECT json_build_object(
    'company_id', v_company_id,
    'company_name', p_company_name,
    'user_id', p_user_id,
    'role', 'admin'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- 14. FUNÇÃO: Auto-criar perfil quando usuário se registra
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 15. VERIFICAÇÃO
-- ============================================================================

-- Listar todas as políticas criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'departments', 'profiles', 'user_roles',
    'goals', 'goal_achievements', 'learning_paths',
    'learning_path_enrollments', 'feedback_threads',
    'alerts', 'alert_events'
  )
ORDER BY tablename;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Próximo passo: Testar o fluxo de registro e criação de empresa
-- ============================================================================
