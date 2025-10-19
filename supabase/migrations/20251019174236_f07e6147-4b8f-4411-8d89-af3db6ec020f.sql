-- Remove a política atual muito permissiva
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Política 1: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: Admins podem ver todos os perfis da empresa
CREATE POLICY "Admins can view all company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::user_role, company_id)
);

-- Política 3: Gestores podem ver apenas perfis do mesmo departamento
CREATE POLICY "Gestores can view department profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'gestor'::user_role, company_id)
  AND department_id IN (
    SELECT department_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);