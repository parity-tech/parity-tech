-- ============================================
-- COMPLIANCE MODULE - DATABASE SCHEMA
-- ============================================

-- 1. ENUMS
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

CREATE TYPE activity_type AS ENUM (
  'call',
  'email',
  'ticket',
  'system_access',
  'meeting',
  'task'
);

CREATE TYPE external_system AS ENUM (
  'erp',
  'crm',
  'helpdesk',
  'phone_system',
  'email_system',
  'project_management'
);

CREATE TYPE goal_period AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);

CREATE TYPE goal_metric_type AS ENUM (
  'tickets_resolved',
  'calls_made',
  'emails_sent',
  'meetings_attended',
  'tasks_completed',
  'custom'
);

CREATE TYPE feedback_status AS ENUM (
  'aberto',
  'em_analise',
  'implementado',
  'rejeitado'
);

CREATE TYPE content_type AS ENUM (
  'video',
  'pdf',
  'quiz',
  'external_link'
);

-- 2. DEPARTMENTS (Setores hierárquicos)
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type department_type NOT NULL,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view departments in their company"
  ON public.departments FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::user_role, company_id)
  );

CREATE INDEX idx_departments_company ON public.departments(company_id);
CREATE INDEX idx_departments_parent ON public.departments(parent_id);

-- Trigger para updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Atualizar PROFILES para incluir department_id
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_department ON public.profiles(department_id);

-- 4. DEPARTMENT PERMISSIONS (Controle de acesso a sistemas externos)
CREATE TABLE public.department_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL,
  system_url TEXT,
  has_access BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(department_id, system_name)
);

ALTER TABLE public.department_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions for their department"
  ON public.department_permissions FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
    AND department_id IN (
      SELECT department_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and gestores can manage permissions"
  ON public.department_permissions FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::user_role, company_id)
      OR has_role(auth.uid(), 'gestor'::user_role, company_id)
    )
  );

CREATE INDEX idx_dept_permissions_company ON public.department_permissions(company_id);
CREATE INDEX idx_dept_permissions_dept ON public.department_permissions(department_id);

CREATE TRIGGER update_dept_permissions_updated_at
  BEFORE UPDATE ON public.department_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. ACTIVITY EVENTS (Eventos de atividade em tempo real)
CREATE TABLE public.activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  activity_type activity_type NOT NULL,
  external_system external_system,
  external_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity events"
  ON public.activity_events FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      company_id = get_user_company_id(auth.uid())
      AND (
        has_role(auth.uid(), 'gestor'::user_role, company_id)
        OR has_role(auth.uid(), 'admin'::user_role, company_id)
      )
    )
  );

CREATE POLICY "System can insert activity events"
  ON public.activity_events FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE INDEX idx_activity_company ON public.activity_events(company_id);
CREATE INDEX idx_activity_user ON public.activity_events(user_id);
CREATE INDEX idx_activity_dept ON public.activity_events(department_id);
CREATE INDEX idx_activity_timestamp ON public.activity_events(timestamp DESC);
CREATE INDEX idx_activity_type ON public.activity_events(activity_type);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;

-- 6. GOALS (Metas configuráveis)
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  metric_type goal_metric_type NOT NULL,
  target_value NUMERIC NOT NULL,
  period goal_period NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goals for their department"
  ON public.goals FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      department_id IS NULL
      OR department_id IN (
        SELECT department_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Gestores and admins can manage goals"
  ON public.goals FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::user_role, company_id)
      OR has_role(auth.uid(), 'gestor'::user_role, company_id)
    )
  );

CREATE INDEX idx_goals_company ON public.goals(company_id);
CREATE INDEX idx_goals_dept ON public.goals(department_id);
CREATE INDEX idx_goals_period ON public.goals(period);

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. GOAL ACHIEVEMENTS (Atingimentos calculados)
CREATE TABLE public.goal_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  target_value NUMERIC NOT NULL,
  achievement_percentage NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN target_value > 0 THEN (current_value / target_value * 100)
      ELSE 0
    END
  ) STORED,
  is_achieved BOOLEAN GENERATED ALWAYS AS (current_value >= target_value) STORED,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(goal_id, user_id, department_id, period_start)
);

ALTER TABLE public.goal_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.goal_achievements FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      company_id = get_user_company_id(auth.uid())
      AND (
        has_role(auth.uid(), 'gestor'::user_role, company_id)
        OR has_role(auth.uid(), 'admin'::user_role, company_id)
      )
    )
  );

CREATE POLICY "System can manage achievements"
  ON public.goal_achievements FOR ALL
  USING (company_id = get_user_company_id(auth.uid()));

CREATE INDEX idx_achievements_company ON public.goal_achievements(company_id);
CREATE INDEX idx_achievements_goal ON public.goal_achievements(goal_id);
CREATE INDEX idx_achievements_user ON public.goal_achievements(user_id);
CREATE INDEX idx_achievements_dept ON public.goal_achievements(department_id);
CREATE INDEX idx_achievements_period ON public.goal_achievements(period_start, period_end);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_achievements;

-- 8. LEARNING PATHS (Trilhas de capacitação)
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view learning paths"
  ON public.learning_paths FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      department_id IS NULL
      OR department_id IN (
        SELECT department_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and gestores can manage learning paths"
  ON public.learning_paths FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::user_role, company_id)
      OR has_role(auth.uid(), 'gestor'::user_role, company_id)
    )
  );

CREATE INDEX idx_learning_paths_company ON public.learning_paths(company_id);
CREATE INDEX idx_learning_paths_dept ON public.learning_paths(department_id);

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. LEARNING CONTENT (Conteúdos das trilhas)
CREATE TABLE public.learning_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type content_type NOT NULL,
  storage_path TEXT,
  external_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view learning content"
  ON public.learning_content FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins and gestores can manage learning content"
  ON public.learning_content FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::user_role, company_id)
      OR has_role(auth.uid(), 'gestor'::user_role, company_id)
    )
  );

CREATE INDEX idx_learning_content_company ON public.learning_content(company_id);
CREATE INDEX idx_learning_content_path ON public.learning_content(learning_path_id);

CREATE TRIGGER update_learning_content_updated_at
  BEFORE UPDATE ON public.learning_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. LEARNING PROGRESS (Progresso automático)
CREATE TABLE public.learning_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  learning_content_id UUID NOT NULL REFERENCES public.learning_content(id) ON DELETE CASCADE,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, learning_content_id)
);

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.learning_progress FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      company_id = get_user_company_id(auth.uid())
      AND (
        has_role(auth.uid(), 'gestor'::user_role, company_id)
        OR has_role(auth.uid(), 'admin'::user_role, company_id)
      )
    )
  );

CREATE POLICY "Users can update own progress"
  ON public.learning_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress records"
  ON public.learning_progress FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX idx_learning_progress_user ON public.learning_progress(user_id);
CREATE INDEX idx_learning_progress_path ON public.learning_progress(learning_path_id);
CREATE INDEX idx_learning_progress_content ON public.learning_progress(learning_content_id);

CREATE TRIGGER update_learning_progress_updated_at
  BEFORE UPDATE ON public.learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. FEEDBACK THREADS (Comentários hierárquicos)
CREATE TABLE public.feedback_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status feedback_status NOT NULL DEFAULT 'aberto',
  priority INTEGER DEFAULT 0,
  assigned_to UUID,
  parent_thread_id UUID REFERENCES public.feedback_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view threads in their department"
  ON public.feedback_threads FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      created_by = auth.uid()
      OR department_id IN (
        SELECT department_id FROM public.profiles WHERE id = auth.uid()
      )
      OR has_role(auth.uid(), 'gestor'::user_role, company_id)
      OR has_role(auth.uid(), 'admin'::user_role, company_id)
    )
  );

CREATE POLICY "Users can create feedback threads"
  ON public.feedback_threads FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Gestores and admins can manage feedback"
  ON public.feedback_threads FOR UPDATE
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'gestor'::user_role, company_id)
      OR has_role(auth.uid(), 'admin'::user_role, company_id)
    )
  );

CREATE INDEX idx_feedback_company ON public.feedback_threads(company_id);
CREATE INDEX idx_feedback_dept ON public.feedback_threads(department_id);
CREATE INDEX idx_feedback_status ON public.feedback_threads(status);
CREATE INDEX idx_feedback_parent ON public.feedback_threads(parent_thread_id);

CREATE TRIGGER update_feedback_threads_updated_at
  BEFORE UPDATE ON public.feedback_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_threads;

-- 12. Criar setores padrão (função auxiliar)
CREATE OR REPLACE FUNCTION public.create_default_departments(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dept_admin UUID;
  dept_comercial UUID;
  dept_operacoes UUID;
  dept_ti UUID;
BEGIN
  -- Administrativo
  INSERT INTO public.departments (company_id, name, type, description)
  VALUES (p_company_id, 'Administrativo', 'administrativo', 'Setor administrativo geral')
  RETURNING id INTO dept_admin;
  
  INSERT INTO public.departments (company_id, name, type, parent_id)
  VALUES 
    (p_company_id, 'Financeiro', 'financeiro', dept_admin),
    (p_company_id, 'Recursos Humanos', 'rh', dept_admin),
    (p_company_id, 'Jurídico', 'juridico', dept_admin);
  
  -- Comercial
  INSERT INTO public.departments (company_id, name, type, description)
  VALUES (p_company_id, 'Comercial', 'comercial', 'Setor comercial')
  RETURNING id INTO dept_comercial;
  
  INSERT INTO public.departments (company_id, name, type, parent_id)
  VALUES 
    (p_company_id, 'Vendas', 'vendas', dept_comercial),
    (p_company_id, 'Marketing', 'marketing', dept_comercial);
  
  -- Operações
  INSERT INTO public.departments (company_id, name, type, description)
  VALUES (p_company_id, 'Operações', 'operacoes', 'Setor de operações')
  RETURNING id INTO dept_operacoes;
  
  INSERT INTO public.departments (company_id, name, type, parent_id)
  VALUES 
    (p_company_id, 'Produção', 'producao', dept_operacoes),
    (p_company_id, 'Logística', 'logistica', dept_operacoes),
    (p_company_id, 'Qualidade', 'qualidade', dept_operacoes);
  
  -- TI
  INSERT INTO public.departments (company_id, name, type, description)
  VALUES (p_company_id, 'TI', 'ti', 'Tecnologia da Informação')
  RETURNING id INTO dept_ti;
  
  INSERT INTO public.departments (company_id, name, type, parent_id)
  VALUES 
    (p_company_id, 'Infraestrutura', 'infraestrutura', dept_ti),
    (p_company_id, 'Desenvolvimento', 'desenvolvimento', dept_ti);
END;
$$;