-- ==========================================
-- CORREÇÃO FINAL: update_updated_at_column
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public  -- CORREÇÃO: search_path fixo
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;