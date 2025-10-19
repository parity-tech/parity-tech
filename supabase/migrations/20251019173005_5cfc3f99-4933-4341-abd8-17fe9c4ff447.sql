-- ============================================
-- MÓDULO: GESTÃO DE PESSOAS
-- ============================================

-- ============================================
-- 1. LICENÇA MÉDICA ESTENDIDA
-- ============================================

-- Tabela para extensões de licença médica
CREATE TABLE public.medical_leave_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_id UUID NOT NULL REFERENCES public.medical_certificates(id) ON DELETE CASCADE,
    
    -- Dados da extensão
    extension_days INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    
    -- Aprovação
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_medical_leave_extensions_user ON public.medical_leave_extensions(user_id);
CREATE INDEX idx_medical_leave_extensions_company ON public.medical_leave_extensions(company_id);
CREATE INDEX idx_medical_leave_extensions_status ON public.medical_leave_extensions(status);
CREATE INDEX idx_medical_leave_extensions_certificate ON public.medical_leave_extensions(certificate_id);

-- RLS
ALTER TABLE public.medical_leave_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extensions"
    ON public.medical_leave_extensions FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "System can create extensions"
    ON public.medical_leave_extensions FOR INSERT
    WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Gestores can manage extensions"
    ON public.medical_leave_extensions FOR UPDATE
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- Trigger para updated_at
CREATE TRIGGER update_medical_leave_extensions_updated_at
    BEFORE UPDATE ON public.medical_leave_extensions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. PROGRAMAS DE BEM-ESTAR
-- ============================================

-- Tabela de configurações de bem-estar por empresa
CREATE TABLE public.wellness_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    
    -- Sistema de pontos
    point_value_cents INTEGER NOT NULL DEFAULT 10,  -- 10 centavos por ponto
    points_expire BOOLEAN NOT NULL DEFAULT false,
    expiration_months INTEGER DEFAULT 12,
    min_points_for_redemption INTEGER NOT NULL DEFAULT 100,
    
    -- Regras de acúmulo
    points_per_workout INTEGER NOT NULL DEFAULT 10,
    points_per_challenge INTEGER NOT NULL DEFAULT 50,
    points_per_meditation INTEGER NOT NULL DEFAULT 5,
    points_per_nutrition_log INTEGER NOT NULL DEFAULT 3,
    points_per_health_activity INTEGER NOT NULL DEFAULT 15,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de desafios de bem-estar
CREATE TABLE public.wellness_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('fitness', 'saude_mental', 'nutricao', 'habitos_saudaveis')),
    
    -- Pontuação e duração
    points_reward INTEGER NOT NULL DEFAULT 50,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Configuração
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_participants INTEGER,
    
    -- Integração externa
    external_source TEXT,  -- 'gymrats', 'partner_app', etc.
    external_id TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de participações em desafios
CREATE TABLE public.wellness_challenge_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.wellness_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'abandonado')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Pontuação
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(challenge_id, user_id)
);

-- Tabela de transações de pontos
CREATE TABLE public.wellness_points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transação
    points_amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('ganho', 'resgate', 'expiracao', 'ajuste')),
    
    -- Origem
    source_type TEXT CHECK (source_type IN ('challenge', 'workout', 'meditation', 'nutrition', 'manual', 'redemption')),
    source_id UUID,  -- ID do desafio, atividade, etc.
    
    description TEXT,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de saldo de pontos (materializada para performance)
CREATE TABLE public.wellness_points_balance (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    total_points INTEGER NOT NULL DEFAULT 0,
    available_points INTEGER NOT NULL DEFAULT 0,  -- Descontando resgates
    lifetime_points INTEGER NOT NULL DEFAULT 0,   -- Total histórico
    
    last_activity_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de prêmios/recompensas
CREATE TABLE public.wellness_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('voucher', 'dias_folga', 'beneficio_interno', 'desconto_parceiro')),
    
    -- Custo em pontos
    points_cost INTEGER NOT NULL,
    
    -- Disponibilidade
    is_active BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INTEGER,  -- NULL = ilimitado
    max_per_user INTEGER,
    
    -- Dados do prêmio
    reward_details JSONB DEFAULT '{}'::jsonb,  -- Código voucher, dias folga, etc.
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de resgates
CREATE TABLE public.wellness_reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.wellness_rewards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    points_spent INTEGER NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'entregue', 'cancelado')),
    
    -- Aprovação/entrega
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Dados da entrega
    delivery_details JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes bem-estar
CREATE INDEX idx_wellness_challenges_company ON public.wellness_challenges(company_id);
CREATE INDEX idx_wellness_challenges_dates ON public.wellness_challenges(start_date, end_date);
CREATE INDEX idx_wellness_challenge_participations_user ON public.wellness_challenge_participations(user_id);
CREATE INDEX idx_wellness_challenge_participations_challenge ON public.wellness_challenge_participations(challenge_id);
CREATE INDEX idx_wellness_points_transactions_user ON public.wellness_points_transactions(user_id);
CREATE INDEX idx_wellness_points_transactions_company ON public.wellness_points_transactions(company_id);
CREATE INDEX idx_wellness_points_balance_company ON public.wellness_points_balance(company_id);
CREATE INDEX idx_wellness_rewards_company ON public.wellness_rewards(company_id);
CREATE INDEX idx_wellness_reward_redemptions_user ON public.wellness_reward_redemptions(user_id);

-- RLS bem-estar
ALTER TABLE public.wellness_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_points_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies wellness_settings
CREATE POLICY "Admins can manage wellness settings"
    ON public.wellness_settings FOR ALL
    USING (company_id = get_user_company_id(auth.uid()) AND 
           has_role(auth.uid(), 'admin'::user_role, company_id));

CREATE POLICY "Users can view wellness settings"
    ON public.wellness_settings FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()));

-- Policies wellness_challenges
CREATE POLICY "Users can view challenges"
    ON public.wellness_challenges FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) AND is_active = true);

CREATE POLICY "Gestores can manage challenges"
    ON public.wellness_challenges FOR ALL
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- Policies participations
CREATE POLICY "Users can view own participations"
    ON public.wellness_challenge_participations FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "Users can join challenges"
    ON public.wellness_challenge_participations FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participations"
    ON public.wellness_challenge_participations FOR UPDATE
    USING (user_id = auth.uid());

-- Policies points
CREATE POLICY "Users can view own points"
    ON public.wellness_points_transactions FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "System can create points transactions"
    ON public.wellness_points_transactions FOR INSERT
    WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view own balance"
    ON public.wellness_points_balance FOR SELECT
    USING (user_id = auth.uid() OR 
           EXISTS (
               SELECT 1 FROM public.user_roles
               WHERE user_roles.user_id = auth.uid()
               AND user_roles.company_id = company_id
               AND (user_roles.role = 'gestor'::user_role OR user_roles.role = 'admin'::user_role)
           ));

CREATE POLICY "System can manage balance"
    ON public.wellness_points_balance FOR ALL
    USING (company_id = get_user_company_id(auth.uid()));

-- Policies rewards
CREATE POLICY "Users can view rewards"
    ON public.wellness_rewards FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) AND is_active = true);

CREATE POLICY "Gestores can manage rewards"
    ON public.wellness_rewards FOR ALL
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- Policies redemptions
CREATE POLICY "Users can view own redemptions"
    ON public.wellness_reward_redemptions FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "Users can create redemptions"
    ON public.wellness_reward_redemptions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Gestores can manage redemptions"
    ON public.wellness_reward_redemptions FOR UPDATE
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- Triggers bem-estar
CREATE TRIGGER update_wellness_settings_updated_at
    BEFORE UPDATE ON public.wellness_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wellness_challenges_updated_at
    BEFORE UPDATE ON public.wellness_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wellness_challenge_participations_updated_at
    BEFORE UPDATE ON public.wellness_challenge_participations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wellness_rewards_updated_at
    BEFORE UPDATE ON public.wellness_rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wellness_reward_redemptions_updated_at
    BEFORE UPDATE ON public.wellness_reward_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. BENEFÍCIOS PET + FILHOS
-- ============================================

-- Enum para tipo de dependente
CREATE TYPE dependent_type AS ENUM ('pet', 'filho');

-- Enum para categoria de benefício
CREATE TYPE benefit_category AS ENUM ('saude', 'lazer', 'educacao');

-- Tabela de dependentes
CREATE TABLE public.dependents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo
    dependent_type dependent_type NOT NULL,
    
    -- Dados básicos
    name TEXT NOT NULL,
    birth_date DATE,
    
    -- Dados específicos por tipo
    -- Pet: espécie
    species TEXT,  -- 'cachorro', 'gato', etc.
    
    -- Filho: CPF
    cpf TEXT,
    
    -- Foto
    photo_url TEXT,
    
    -- Documentos
    has_documents BOOLEAN DEFAULT false,
    documents_path TEXT[],
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de parceiros/fornecedores
CREATE TABLE public.benefit_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    category benefit_category NOT NULL,
    
    -- Tipo de benefício que oferece
    benefit_types TEXT[] NOT NULL,  -- ['plano_saude_pet', 'desconto_pet_shop', etc.]
    
    -- Contato
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    logo_url TEXT,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de vouchers/benefícios
CREATE TABLE public.benefit_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.benefit_partners(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    category benefit_category NOT NULL,
    
    -- Tipo de benefício
    benefit_type TEXT NOT NULL,
    applicable_to dependent_type[],  -- ['pet', 'filho'] ou NULL para ambos
    
    -- Valor/desconto
    discount_percentage INTEGER,
    discount_value_cents INTEGER,
    
    -- Disponibilidade
    is_active BOOLEAN NOT NULL DEFAULT true,
    valid_until DATE,
    max_uses_per_user INTEGER,
    
    -- Código/instruções
    voucher_code TEXT,
    redemption_instructions TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de uso de vouchers
CREATE TABLE public.benefit_voucher_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    voucher_id UUID NOT NULL REFERENCES public.benefit_vouchers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dependent_id UUID REFERENCES public.dependents(id) ON DELETE SET NULL,
    
    used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

-- Indexes benefícios
CREATE INDEX idx_dependents_user ON public.dependents(user_id);
CREATE INDEX idx_dependents_company ON public.dependents(company_id);
CREATE INDEX idx_dependents_type ON public.dependents(dependent_type);
CREATE INDEX idx_benefit_partners_company ON public.benefit_partners(company_id);
CREATE INDEX idx_benefit_vouchers_company ON public.benefit_vouchers(company_id);
CREATE INDEX idx_benefit_voucher_usage_user ON public.benefit_voucher_usage(user_id);
CREATE INDEX idx_benefit_voucher_usage_voucher ON public.benefit_voucher_usage(voucher_id);

-- RLS benefícios
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_voucher_usage ENABLE ROW LEVEL SECURITY;

-- Policies dependents
CREATE POLICY "Users can manage own dependents"
    ON public.dependents FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Gestores can view all dependents"
    ON public.dependents FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- Policies partners
CREATE POLICY "Users can view partners"
    ON public.benefit_partners FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) AND is_active = true);

CREATE POLICY "Admins can manage partners"
    ON public.benefit_partners FOR ALL
    USING (company_id = get_user_company_id(auth.uid()) AND 
           has_role(auth.uid(), 'admin'::user_role, company_id));

-- Policies vouchers
CREATE POLICY "Users can view vouchers"
    ON public.benefit_vouchers FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) AND is_active = true);

CREATE POLICY "Gestores can manage vouchers"
    ON public.benefit_vouchers FOR ALL
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- Policies usage
CREATE POLICY "Users can view own usage"
    ON public.benefit_voucher_usage FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "Users can create usage records"
    ON public.benefit_voucher_usage FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Triggers benefícios
CREATE TRIGGER update_dependents_updated_at
    BEFORE UPDATE ON public.dependents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_benefit_partners_updated_at
    BEFORE UPDATE ON public.benefit_partners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_benefit_vouchers_updated_at
    BEFORE UPDATE ON public.benefit_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();