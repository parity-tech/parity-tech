-- ============================================
-- SECURITY FIX: Add RLS Policy for Company Creation
-- ============================================
-- Only authenticated users with 'admin' role can create companies
-- This prevents unauthorized company registration spam

-- First, ensure RLS is enabled on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "Only admins can create companies" ON public.companies;

-- Create INSERT policy requiring admin role
CREATE POLICY "Only admins can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if the user has 'admin' role in ANY company
  -- This allows existing admins to create new companies for expansion
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::user_role
  )
);

-- For new user onboarding, we need to allow first company creation
-- Create a special policy for users with no companies yet
CREATE POLICY "First time users can create their first company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user has no existing companies
  NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);

-- Add comment documenting the security model
COMMENT ON TABLE public.companies IS 
'Companies table with RLS: Only admins can create companies, except first-time users creating their initial company for onboarding.';