-- Add risk scoring fields to alerts and alert_events
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'baixo' CHECK (risk_level IN ('baixo', 'medio', 'alto', 'grave'));

ALTER TABLE public.alert_events
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'baixo',
ADD COLUMN IF NOT EXISTS corrective_action_document TEXT,
ADD COLUMN IF NOT EXISTS ai_suggested_actions TEXT;

-- Create table for storing corrective action documents
CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  alert_event_id UUID NOT NULL REFERENCES public.alert_events(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  document_content TEXT NOT NULL,
  document_path TEXT,
  occurrence_date TIMESTAMP WITH TIME ZONE NOT NULL,
  occurrence_type TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'entregue', 'assinado')),
  delivered_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for corrective_actions
CREATE POLICY "RH and admins can view corrective actions"
ON public.corrective_actions FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'gestor', company_id))
);

CREATE POLICY "System can insert corrective actions"
ON public.corrective_actions FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "RH and admins can update corrective actions"
ON public.corrective_actions FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin', company_id) OR has_role(auth.uid(), 'gestor', company_id))
);

-- Create trigger for updated_at
CREATE TRIGGER update_corrective_actions_updated_at
BEFORE UPDATE ON public.corrective_actions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_corrective_actions_user_id ON public.corrective_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_alert_id ON public.corrective_actions(alert_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_company_id ON public.corrective_actions(company_id);