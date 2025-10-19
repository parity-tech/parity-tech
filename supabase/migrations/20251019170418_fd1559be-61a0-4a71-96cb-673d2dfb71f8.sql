-- Create enum for time log types
CREATE TYPE time_log_type AS ENUM ('entrada', 'saida_almoco', 'retorno_almoco', 'saida');

-- Create enum for medical certificate status
CREATE TYPE certificate_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- Create enum for reimbursement status
CREATE TYPE reimbursement_status AS ENUM ('pendente', 'em_analise', 'aprovado', 'rejeitado');

-- Create enum for risk level
CREATE TYPE risk_level AS ENUM ('baixo', 'medio', 'alto', 'critico');

-- Table for time logs (ponto eletrônico)
CREATE TABLE public.time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_type time_log_type NOT NULL,
    expected_time TIME,
    actual_time TIME NOT NULL,
    log_date DATE NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    location_address TEXT,
    expected_location_lat NUMERIC(10, 8),
    expected_location_lng NUMERIC(11, 8),
    distance_from_expected_meters NUMERIC(10, 2),
    location_risk_score INTEGER DEFAULT 0,
    is_late BOOLEAN DEFAULT false,
    minutes_difference INTEGER DEFAULT 0,
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    has_irregularity BOOLEAN DEFAULT false,
    irregularity_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for download logs
CREATE TABLE public.download_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    contains_pii BOOLEAN DEFAULT false,
    download_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET,
    device_info JSONB DEFAULT '{}'::jsonb,
    access_location TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    security_risk_score INTEGER DEFAULT 0,
    lgpd_risk_score INTEGER DEFAULT 0,
    litigation_risk_score INTEGER DEFAULT 0,
    overall_risk_level risk_level DEFAULT 'baixo',
    risk_factors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for overtime records
CREATE TABLE public.overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    record_date DATE NOT NULL,
    regular_hours NUMERIC(5, 2) DEFAULT 0,
    overtime_hours NUMERIC(5, 2) DEFAULT 0,
    undertime_hours NUMERIC(5, 2) DEFAULT 0,
    expected_hours NUMERIC(5, 2) NOT NULL DEFAULT 8,
    has_overtime_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMPTZ,
    overtime_reason TEXT,
    risk_score INTEGER DEFAULT 0,
    has_alert BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for medical certificates (atestados)
CREATE TABLE public.medical_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_number TEXT,
    issue_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    doctor_name TEXT,
    doctor_crm TEXT,
    medical_reason TEXT,
    document_path TEXT,
    status certificate_status NOT NULL DEFAULT 'pendente',
    reviewed_by UUID REFERENCES auth.users(id),
    review_date TIMESTAMPTZ,
    review_notes TEXT,
    is_suspicious BOOLEAN DEFAULT false,
    suspicious_reasons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for reimbursements
CREATE TABLE public.reimbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    status reimbursement_status NOT NULL DEFAULT 'pendente',
    reviewed_by UUID REFERENCES auth.users(id),
    review_date TIMESTAMPTZ,
    review_notes TEXT,
    fraud_risk_score INTEGER DEFAULT 0,
    fraud_risk_level risk_level DEFAULT 'baixo',
    fraud_indicators JSONB DEFAULT '[]'::jsonb,
    has_all_documents BOOLEAN DEFAULT false,
    missing_documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for reimbursement documents
CREATE TABLE public.reimbursement_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    reimbursement_id UUID NOT NULL REFERENCES public.reimbursements(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    document_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    is_valid BOOLEAN DEFAULT true,
    validation_notes TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_time_logs_user_date ON public.time_logs(user_id, log_date);
CREATE INDEX idx_time_logs_company ON public.time_logs(company_id);
CREATE INDEX idx_time_logs_irregularity ON public.time_logs(has_irregularity) WHERE has_irregularity = true;

CREATE INDEX idx_download_logs_user ON public.download_logs(user_id);
CREATE INDEX idx_download_logs_company ON public.download_logs(company_id);
CREATE INDEX idx_download_logs_risk ON public.download_logs(overall_risk_level);
CREATE INDEX idx_download_logs_timestamp ON public.download_logs(download_timestamp);

CREATE INDEX idx_overtime_records_user_date ON public.overtime_records(user_id, record_date);
CREATE INDEX idx_overtime_records_company ON public.overtime_records(company_id);
CREATE INDEX idx_overtime_records_alert ON public.overtime_records(has_alert) WHERE has_alert = true;

CREATE INDEX idx_medical_certificates_user ON public.medical_certificates(user_id);
CREATE INDEX idx_medical_certificates_company ON public.medical_certificates(company_id);
CREATE INDEX idx_medical_certificates_status ON public.medical_certificates(status);
CREATE INDEX idx_medical_certificates_dates ON public.medical_certificates(start_date, end_date);

CREATE INDEX idx_reimbursements_user ON public.reimbursements(user_id);
CREATE INDEX idx_reimbursements_company ON public.reimbursements(company_id);
CREATE INDEX idx_reimbursements_status ON public.reimbursements(status);
CREATE INDEX idx_reimbursements_risk ON public.reimbursements(fraud_risk_level);

CREATE INDEX idx_reimbursement_documents_reimbursement ON public.reimbursement_documents(reimbursement_id);

-- Enable RLS on all tables
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_logs
CREATE POLICY "Users can view own time logs"
    ON public.time_logs FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "System can insert time logs"
    ON public.time_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Gestores can update time logs"
    ON public.time_logs FOR UPDATE
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- RLS Policies for download_logs
CREATE POLICY "Users can view own download logs"
    ON public.download_logs FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "System can insert download logs"
    ON public.download_logs FOR INSERT
    WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for overtime_records
CREATE POLICY "Users can view own overtime records"
    ON public.overtime_records FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "System can insert overtime records"
    ON public.overtime_records FOR INSERT
    WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Gestores can update overtime records"
    ON public.overtime_records FOR UPDATE
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- RLS Policies for medical_certificates
CREATE POLICY "Users can view own certificates"
    ON public.medical_certificates FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "Users can insert own certificates"
    ON public.medical_certificates FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Gestores can manage certificates"
    ON public.medical_certificates FOR UPDATE
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- RLS Policies for reimbursements
CREATE POLICY "Users can view own reimbursements"
    ON public.reimbursements FOR SELECT
    USING (user_id = auth.uid() OR 
           (company_id = get_user_company_id(auth.uid()) AND 
            (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
             has_role(auth.uid(), 'admin'::user_role, company_id))));

CREATE POLICY "Users can create reimbursements"
    ON public.reimbursements FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending reimbursements"
    ON public.reimbursements FOR UPDATE
    USING (user_id = auth.uid() AND status = 'pendente'::reimbursement_status);

CREATE POLICY "Gestores can manage all reimbursements"
    ON public.reimbursements FOR UPDATE
    USING (company_id = get_user_company_id(auth.uid()) AND 
           (has_role(auth.uid(), 'gestor'::user_role, company_id) OR 
            has_role(auth.uid(), 'admin'::user_role, company_id)));

-- RLS Policies for reimbursement_documents
CREATE POLICY "Users can view documents of accessible reimbursements"
    ON public.reimbursement_documents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.reimbursements r
        WHERE r.id = reimbursement_id
        AND (r.user_id = auth.uid() OR 
             (r.company_id = get_user_company_id(auth.uid()) AND 
              (has_role(auth.uid(), 'gestor'::user_role, r.company_id) OR 
               has_role(auth.uid(), 'admin'::user_role, r.company_id))))
    ));

CREATE POLICY "Users can upload documents to own reimbursements"
    ON public.reimbursement_documents FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.reimbursements r
        WHERE r.id = reimbursement_id
        AND r.user_id = auth.uid()
    ));

-- Create triggers for updated_at
CREATE TRIGGER update_time_logs_updated_at
    BEFORE UPDATE ON public.time_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_overtime_records_updated_at
    BEFORE UPDATE ON public.overtime_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_certificates_updated_at
    BEFORE UPDATE ON public.medical_certificates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reimbursements_updated_at
    BEFORE UPDATE ON public.reimbursements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();