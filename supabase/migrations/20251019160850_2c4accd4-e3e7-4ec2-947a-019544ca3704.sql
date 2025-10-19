-- ============================================
-- MULTI-TENANT SAAS - DATABASE STRUCTURE
-- Geolocalização de Logins + Integração APIs
-- ============================================

-- 1. ENUM TYPES
CREATE TYPE public.user_role AS ENUM ('admin', 'gestor', 'usuario');
CREATE TYPE public.integration_type AS ENUM ('erp', 'crm', 'financeiro', 'rh', 'outro');
CREATE TYPE public.integration_status AS ENUM ('ativo', 'inativo', 'erro', 'pendente');
CREATE TYPE public.alert_type AS ENUM ('login_suspeito', 'api_erro', 'api_lento', 'uso_anormal', 'personalizado');
CREATE TYPE public.alert_priority AS ENUM ('baixa', 'media', 'alta', 'critica');

-- 2. COMPANIES TABLE (Multi-tenant base)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. USER ROLES TABLE (Security definer pattern)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'usuario',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- 4. PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    department TEXT,
    position TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. API INTEGRATIONS TABLE
CREATE TABLE public.api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.integration_type NOT NULL,
    status public.integration_status NOT NULL DEFAULT 'pendente',
    base_url TEXT NOT NULL,
    auth_type TEXT NOT NULL, -- 'bearer', 'basic', 'oauth2', 'api_key'
    credentials_encrypted TEXT, -- Store encrypted in production
    headers JSONB DEFAULT '{}'::jsonb,
    timeout_seconds INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_success_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. API INTEGRATION LOGS TABLE
CREATE TABLE public.api_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES public.api_integrations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    request_payload JSONB,
    response_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. LOGIN LOCATIONS TABLE (Geolocalização)
CREATE TABLE public.login_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city TEXT,
    region TEXT,
    country TEXT,
    country_code TEXT,
    timezone TEXT,
    isp TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    is_suspicious BOOLEAN DEFAULT false,
    suspicious_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. ALERTS TABLE
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type public.alert_type NOT NULL,
    priority public.alert_priority NOT NULL DEFAULT 'media',
    title TEXT NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL, -- Condições para trigger do alerta
    is_active BOOLEAN DEFAULT true,
    triggered_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    notify_users UUID[], -- Array de user IDs para notificar
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ALERT EVENTS TABLE (Histórico de triggers)
CREATE TABLE public.alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    triggered_by_data JSONB NOT NULL,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. REPORTS TABLE
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL, -- 'login_activity', 'api_performance', 'team_usage', etc
    filters JSONB DEFAULT '{}'::jsonb,
    generated_by UUID REFERENCES auth.users(id),
    file_url TEXT,
    data_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_api_integrations_company_id ON public.api_integrations(company_id);
CREATE INDEX idx_api_logs_integration_id ON public.api_integration_logs(integration_id);
CREATE INDEX idx_api_logs_company_created ON public.api_integration_logs(company_id, created_at DESC);
CREATE INDEX idx_login_locations_user_company ON public.login_locations(user_id, company_id, created_at DESC);
CREATE INDEX idx_login_locations_suspicious ON public.login_locations(is_suspicious, created_at DESC) WHERE is_suspicious = true;
CREATE INDEX idx_alerts_company_active ON public.alerts(company_id, is_active) WHERE is_active = true;
CREATE INDEX idx_alert_events_alert_created ON public.alert_events(alert_id, created_at DESC);
CREATE INDEX idx_reports_company_created ON public.reports(company_id, created_at DESC);

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(
    _user_id UUID,
    _role public.user_role,
    _company_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
        AND (_company_id IS NULL OR company_id = _company_id)
    )
$$;

-- Function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at
    BEFORE UPDATE ON public.api_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_company_id UUID;
BEGIN
    -- Get or create a default company (simplified - adjust as needed)
    SELECT id INTO default_company_id FROM public.companies LIMIT 1;
    
    IF default_company_id IS NULL THEN
        INSERT INTO public.companies (name, slug) 
        VALUES ('Default Company', 'default-company')
        RETURNING id INTO default_company_id;
    END IF;
    
    -- Create profile
    INSERT INTO public.profiles (id, company_id, full_name)
    VALUES (
        NEW.id,
        default_company_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Assign default role
    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (NEW.id, default_company_id, 'usuario');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- COMPANIES POLICIES
CREATE POLICY "Users can view their company"
    ON public.companies FOR SELECT
    USING (id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update their company"
    ON public.companies FOR UPDATE
    USING (
        id = public.get_user_company_id(auth.uid()) 
        AND public.has_role(auth.uid(), 'admin', id)
    );

-- USER_ROLES POLICIES
CREATE POLICY "Users can view roles in their company"
    ON public.user_roles FOR SELECT
    USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage roles in their company"
    ON public.user_roles FOR ALL
    USING (
        company_id = public.get_user_company_id(auth.uid())
        AND public.has_role(auth.uid(), 'admin', company_id)
    );

-- PROFILES POLICIES
CREATE POLICY "Users can view profiles in their company"
    ON public.profiles FOR SELECT
    USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles in company"
    ON public.profiles FOR UPDATE
    USING (
        company_id = public.get_user_company_id(auth.uid())
        AND public.has_role(auth.uid(), 'admin', company_id)
    );

-- API_INTEGRATIONS POLICIES
CREATE POLICY "Users can view integrations in their company"
    ON public.api_integrations FOR SELECT
    USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage integrations"
    ON public.api_integrations FOR ALL
    USING (
        company_id = public.get_user_company_id(auth.uid())
        AND public.has_role(auth.uid(), 'admin', company_id)
    );

-- API_INTEGRATION_LOGS POLICIES
CREATE POLICY "Users can view logs in their company"
    ON public.api_integration_logs FOR SELECT
    USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "System can insert logs"
    ON public.api_integration_logs FOR INSERT
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- LOGIN_LOCATIONS POLICIES
CREATE POLICY "Users can view own login locations"
    ON public.login_locations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Gestores and admins can view all login locations in company"
    ON public.login_locations FOR SELECT
    USING (
        company_id = public.get_user_company_id(auth.uid())
        AND (
            public.has_role(auth.uid(), 'gestor', company_id)
            OR public.has_role(auth.uid(), 'admin', company_id)
        )
    );

CREATE POLICY "System can insert login locations"
    ON public.login_locations FOR INSERT
    WITH CHECK (true);

-- ALERTS POLICIES
CREATE POLICY "Users can view alerts in their company"
    ON public.alerts FOR SELECT
    USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Gestores and admins can manage alerts"
    ON public.alerts FOR ALL
    USING (
        company_id = public.get_user_company_id(auth.uid())
        AND (
            public.has_role(auth.uid(), 'gestor', company_id)
            OR public.has_role(auth.uid(), 'admin', company_id)
        )
    );

-- ALERT_EVENTS POLICIES
CREATE POLICY "Users can view alert events in their company"
    ON public.alert_events FOR SELECT
    USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "System can insert alert events"
    ON public.alert_events FOR INSERT
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Gestores can acknowledge alerts"
    ON public.alert_events FOR UPDATE
    USING (
        company_id = public.get_user_company_id(auth.uid())
        AND (
            public.has_role(auth.uid(), 'gestor', company_id)
            OR public.has_role(auth.uid(), 'admin', company_id)
        )
    );

-- REPORTS POLICIES
CREATE POLICY "Users can view reports in their company"
    ON public.reports FOR SELECT
    USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Gestores and admins can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (
        company_id = public.get_user_company_id(auth.uid())
        AND (
            public.has_role(auth.uid(), 'gestor', company_id)
            OR public.has_role(auth.uid(), 'admin', company_id)
        )
    );