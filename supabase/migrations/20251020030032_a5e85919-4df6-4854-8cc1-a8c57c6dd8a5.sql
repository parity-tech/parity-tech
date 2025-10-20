-- ============================================
-- ADD PRIMARY SECTOR TO COMPANIES
-- ============================================
-- Add primary sector field to companies table for access control

-- Add primary_sector column
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS primary_sector text;

-- Add check constraint for valid sectors
ALTER TABLE public.companies
ADD CONSTRAINT companies_primary_sector_check 
CHECK (primary_sector IN ('juridico', 'financeiro', 'rh'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_companies_primary_sector 
ON public.companies(primary_sector);

-- Add comment
COMMENT ON COLUMN public.companies.primary_sector IS 
'Primary business sector: juridico (full access), financeiro (juridico + financeiro modules), rh (rh modules only)';

-- Create module access mapping table
CREATE TABLE IF NOT EXISTS public.module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  allowed_sectors text[] NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(module_name)
);

-- Enable RLS on module_access
ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view module access rules
CREATE POLICY "Users can view module access rules"
ON public.module_access
FOR SELECT
TO authenticated
USING (true);

-- Insert module access mapping
INSERT INTO public.module_access (module_name, allowed_sectors, display_order) VALUES
  -- Jurídico: Acesso total
  ('compliance', ARRAY['juridico', 'financeiro'], 1),
  ('corrective-actions', ARRAY['juridico', 'financeiro', 'rh'], 2),
  ('alerts', ARRAY['juridico', 'financeiro', 'rh'], 3),
  ('analytics', ARRAY['juridico', 'financeiro'], 4),
  ('commercial', ARRAY['juridico', 'financeiro'], 5),
  ('customer-service', ARRAY['juridico', 'financeiro', 'rh'], 6),
  ('people-management', ARRAY['juridico', 'rh'], 7),
  ('hr-integrations', ARRAY['juridico', 'rh'], 8)
ON CONFLICT (module_name) DO NOTHING;

-- Create helper function to check module access
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_company_id uuid;
  _primary_sector text;
  _allowed_sectors text[];
BEGIN
  -- Get user's company
  SELECT company_id INTO _user_company_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF _user_company_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get company's primary sector
  SELECT primary_sector INTO _primary_sector
  FROM public.companies
  WHERE id = _user_company_id;
  
  IF _primary_sector IS NULL THEN
    -- If no sector defined, allow access (for backward compatibility)
    RETURN true;
  END IF;
  
  -- Get allowed sectors for module
  SELECT allowed_sectors INTO _allowed_sectors
  FROM public.module_access
  WHERE module_name = _module_name;
  
  IF _allowed_sectors IS NULL THEN
    -- If module not found in mapping, allow access (backward compatibility)
    RETURN true;
  END IF;
  
  -- Check if user's sector is in allowed sectors
  RETURN _primary_sector = ANY(_allowed_sectors);
END;
$$;

COMMENT ON FUNCTION public.has_module_access IS 
'Check if user has access to a specific module based on their company primary sector';