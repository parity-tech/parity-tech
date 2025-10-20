-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Gestores can view department profiles" ON public.profiles;

-- Recreate it using a safer approach with a helper function
CREATE OR REPLACE FUNCTION public.get_user_department_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT department_id
    FROM public.profiles
    WHERE id = _user_id
    LIMIT 1
$$;

-- Recreate the policy using the helper function to avoid recursion
CREATE POLICY "Gestores can view department profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'gestor'::user_role, company_id)
  AND department_id = get_user_department_id(auth.uid())
);