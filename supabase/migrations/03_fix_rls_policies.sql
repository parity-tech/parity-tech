-- ============================================================================
-- PARITY - Correção de Políticas RLS (Row Level Security)
-- ============================================================================
-- Este script CORRIGE as políticas que estavam causando erro 500
-- Execute este script DEPOIS do 02_setup_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- 1. REMOVER POLÍTICAS ANTIGAS (que causam recursão)
-- ============================================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- User Roles
DROP POLICY IF EXISTS "Users can view company roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can create roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Companies
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Admins can update their companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;

-- Departments
DROP POLICY IF EXISTS "Users can view company departments" ON departments;
DROP POLICY IF EXISTS "Admins and managers can create departments" ON departments;
DROP POLICY IF EXISTS "Admins and managers can update departments" ON departments;

-- Goals
DROP POLICY IF EXISTS "Users can view company goals" ON goals;
DROP POLICY IF EXISTS "Admins and managers can create goals" ON goals;
DROP POLICY IF EXISTS "Admins and managers can update goals" ON goals;

-- Goal Achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON goal_achievements;
DROP POLICY IF EXISTS "Managers can view company achievements" ON goal_achievements;
DROP POLICY IF EXISTS "Managers can create achievements" ON goal_achievements;
DROP POLICY IF EXISTS "Managers can update achievements" ON goal_achievements;

-- Learning Paths
DROP POLICY IF EXISTS "Users can view company learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Admins and managers can create learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Admins and managers can update learning paths" ON learning_paths;

-- Learning Path Enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON learning_path_enrollments;
DROP POLICY IF EXISTS "Managers can view company enrollments" ON learning_path_enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON learning_path_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON learning_path_enrollments;

-- Feedback Threads
DROP POLICY IF EXISTS "Users can view their feedback threads" ON feedback_threads;
DROP POLICY IF EXISTS "Users can create feedback threads" ON feedback_threads;
DROP POLICY IF EXISTS "Users can update their feedback threads" ON feedback_threads;

-- Alerts
DROP POLICY IF EXISTS "Users can view company alerts" ON alerts;
DROP POLICY IF EXISTS "Admins can create alerts" ON alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON alerts;

-- Alert Events
DROP POLICY IF EXISTS "Users can view company alert events" ON alert_events;
DROP POLICY IF EXISTS "System can create alert events" ON alert_events;
DROP POLICY IF EXISTS "Users can update alert event acknowledgment" ON alert_events;

-- ============================================================================
-- 2. CRIAR POLÍTICAS SIMPLIFICADAS (sem recursão)
-- ============================================================================

-- ============================================================================
-- PROFILES
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- USER_ROLES
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- COMPANIES
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update departments"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- GOALS
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- GOAL_ACHIEVEMENTS
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view achievements"
  ON goal_achievements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create achievements"
  ON goal_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update achievements"
  ON goal_achievements
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- LEARNING_PATHS
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view learning paths"
  ON learning_paths
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create learning paths"
  ON learning_paths
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update learning paths"
  ON learning_paths
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- LEARNING_PATH_ENROLLMENTS
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view enrollments"
  ON learning_path_enrollments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create enrollments"
  ON learning_path_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update enrollments"
  ON learning_path_enrollments
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- FEEDBACK_THREADS
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view feedback"
  ON feedback_threads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create feedback"
  ON feedback_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update feedback"
  ON feedback_threads
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- ALERTS
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view alerts"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create alerts"
  ON alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update alerts"
  ON alerts
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- ALERT_EVENTS
-- ============================================================================

CREATE POLICY "Allow all authenticated users to view alert events"
  ON alert_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create alert events"
  ON alert_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update alert events"
  ON alert_events
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- 3. VERIFICAÇÃO
-- ============================================================================

-- Listar todas as políticas ativas
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar RLS habilitado
SELECT
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
-- Próximo passo: Recarregar a aplicação e testar
-- ============================================================================
