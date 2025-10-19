-- ==========================================
-- CORREÇÃO: Function Search Path Mutable
-- ==========================================

-- Recria handle_new_user com search_path fixo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- CORREÇÃO: search_path fixo
AS $function$
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
$function$;

-- Recria create_default_departments com search_path fixo
CREATE OR REPLACE FUNCTION public.create_default_departments(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- CORREÇÃO: search_path fixo
AS $function$
DECLARE
  dept_admin UUID;
  dept_comercial UUID;
  dept_operacoes UUID;
  dept_ti UUID;
BEGIN
  -- Administrativo
  INSERT INTO public.departments (company_id, name, type, description)
  VALUES (p_company_id, 'Administrativo', 'administrativo', 'Setor administrativo geral')
  RETURNING id INTO dept_admin;
  
  INSERT INTO public.departments (company_id, name, type, parent_id)
  VALUES 
    (p_company_id, 'Financeiro', 'financeiro', dept_admin),
    (p_company_id, 'Recursos Humanos', 'rh', dept_admin),
    (p_company_id, 'Jurídico', 'juridico', dept_admin);
  
  -- Comercial
  INSERT INTO public.departments (company_id, name, type, description)
  VALUES (p_company_id, 'Comercial', 'comercial', 'Setor comercial')
  RETURNING id INTO dept_comercial;
  
  INSERT INTO public.departments (company_id, name, type, parent_id)
  VALUES 
    (p_company_id, 'Vendas', 'vendas', dept_comercial),
    (p_company_id, 'Marketing', 'marketing', dept_comercial);
  
  -- Operações
  INSERT INTO public.departments (company_id, name, type, description)
  VALUES (p_company_id, 'Operações', 'operacoes', 'Setor de operações')
  RETURNING id INTO dept_operacoes;
  
  INSERT INTO public.departments (company_id, name, type, parent_id)
  VALUES 
    (p_company_id, 'Produção', 'producao', dept_operacoes),
    (p_company_id, 'Logística', 'logistica', dept_operacoes),
    (p_company_id, 'Qualidade', 'qualidade', dept_operacoes);
  
  -- TI
  INSERT INTO public.departments (company_id, name, type, description)
  VALUES (p_company_id, 'TI', 'ti', 'Tecnologia da Informação')
  RETURNING id INTO dept_ti;
  
  INSERT INTO public.departments (company_id, name, type, parent_id)
  VALUES 
    (p_company_id, 'Infraestrutura', 'infraestrutura', dept_ti),
    (p_company_id, 'Desenvolvimento', 'desenvolvimento', dept_ti);
END;
$function$;