-- Extend companies table with new fields
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS employee_count_range TEXT,
ADD COLUMN IF NOT EXISTS selected_departments TEXT[];

-- Create company_contacts table
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('financeiro', 'juridico', 'rh')),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, contact_type)
);

-- Enable RLS on company_contacts
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_contacts
CREATE POLICY "Admins can manage company contacts"
ON public.company_contacts
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::user_role, company_id)
);

CREATE POLICY "Users can view their company contacts"
ON public.company_contacts
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_company_contacts_updated_at
BEFORE UPDATE ON public.company_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON public.company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj) WHERE cnpj IS NOT NULL;