-- ==========================================
-- CORREÇÃO JURÍDICA: login_locations
-- Base Legal: LGPD Art. 6º, 7º, 46 | CLT Art. 6º
-- ==========================================

-- Remove política insegura que permite inserção indiscriminada
DROP POLICY IF EXISTS "System can insert login locations" ON public.login_locations;

-- Política 1: Apenas o próprio usuário pode inserir seus registros de localização
-- Fundamentação: LGPD Art. 7º, I (consentimento) + autodeterminação informacional
CREATE POLICY "Users can insert own login locations only"
ON public.login_locations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política 2: Usuários visualizam APENAS suas próprias localizações
-- Fundamentação: Direito à privacidade (CF/88 Art. 5º, X)
DROP POLICY IF EXISTS "Users can view own login locations" ON public.login_locations;

CREATE POLICY "Users view only own login locations"
ON public.login_locations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política 3: RESTRINGE acesso gerencial - apenas segurança/compliance
-- Fundamentação: LGPD Art. 37 (responsabilidade do controlador)
-- Nota: Gestores comuns NÃO devem ter acesso a dados de localização
DROP POLICY IF EXISTS "Gestores and admins can view all login locations in company" ON public.login_locations;

CREATE POLICY "Security and compliance only can audit locations"
ON public.login_locations
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::user_role, company_id)
    -- Futuro: adicionar role 'seguranca' quando implementado
  )
);

-- ==========================================
-- POLÍTICA DE RETENÇÃO (Compliance LGPD Art. 15-16)
-- ==========================================
-- Nota: Implementar expurgo automático após 90 dias
-- (a ser feito via cron job ou edge function)

COMMENT ON TABLE public.login_locations IS 
'AVISO LEGAL (LGPD): Dados de geolocalização. 
Finalidade: Segurança e prevenção de fraudes.
Base Legal: Art. 7º, V (execução de contrato) e IX (legítimo interesse).
Retenção: 90 dias. Acesso restrito a DPO/Segurança.
Última atualização: 2025-01';

-- ==========================================
-- MINIMIZAÇÃO DE DADOS (LGPD Art. 6º, III)
-- ==========================================
-- Sugestão: Avaliar necessidade de coletar:
-- - GPS exato (latitude/longitude) vs. apenas cidade/região
-- - Device info completo vs. apenas tipo de dispositivo
-- - ISP vs. apenas indicador de rede corporativa/externa