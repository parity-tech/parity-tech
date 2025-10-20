-- Drop existing SELECT policies on profiles to recreate them with better security
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Gestores can view department profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all company profiles" ON public.profiles;

-- Create improved SELECT policies with explicit authentication checks
-- Policy 1: Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 2: Gestores can view profiles in their department AND company
CREATE POLICY "Gestores can view department profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'gestor'::user_role, company_id)
  AND department_id = get_user_department_id(auth.uid())
  AND department_id IS NOT NULL
);

-- Policy 3: Admins can view all profiles within their company only
CREATE POLICY "Admins can view company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::user_role, company_id)
);

-- Ensure no public access by creating explicit deny for anon
-- (RLS already denies by default, but this makes it explicit)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Add comment documenting security model
COMMENT ON TABLE public.profiles IS 
'Employee profiles with RLS: users see own profile, managers see department, admins see company. No anonymous access allowed.';