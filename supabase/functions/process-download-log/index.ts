import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Palavras-chave para identificar arquivos sensíveis
const SENSITIVE_KEYWORDS = ['confidencial', 'secreto', 'privado', 'senha', 'password', 'credential'];
const PII_KEYWORDS = ['cpf', 'rg', 'cnpj', 'telefone', 'email', 'endereco', 'address', 'phone'];

// Calcula score de risco de segurança (0-100)
function calculateSecurityRiskScore(fileName: string, fileType: string, isSensitive: boolean): number {
  let score = 0;
  
  if (isSensitive) score += 30;
  
  // Tipos de arquivo sensíveis
  const sensitiveTypes = ['.xlsx', '.xls', '.csv', '.pdf', '.doc', '.docx', '.zip', '.rar'];
  if (sensitiveTypes.some(type => fileName.toLowerCase().endsWith(type))) {
    score += 20;
  }
  
  // Palavras-chave no nome
  const lowerFileName = fileName.toLowerCase();
  if (SENSITIVE_KEYWORDS.some(keyword => lowerFileName.includes(keyword))) {
    score += 30;
  }
  
  return Math.min(score, 100);
}

// Calcula score de risco LGPD (0-100)
function calculateLGPDRiskScore(fileName: string, containsPII: boolean): number {
  let score = 0;
  
  if (containsPII) score += 40;
  
  const lowerFileName = fileName.toLowerCase();
  if (PII_KEYWORDS.some(keyword => lowerFileName.includes(keyword))) {
    score += 30;
  }
  
  // Tipos de arquivo que normalmente contêm dados pessoais
  if (fileName.toLowerCase().match(/\.(xlsx|xls|csv|pdf)$/)) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

// Calcula score de risco de contencioso (0-100)
function calculateLitigationRiskScore(fileName: string, isSensitive: boolean, containsPII: boolean): number {
  let score = 0;
  
  const lowerFileName = fileName.toLowerCase();
  
  // Palavras relacionadas a contencioso
  const litigationKeywords = ['processo', 'juridico', 'contrato', 'acordo', 'lawsuit', 'legal'];
  if (litigationKeywords.some(keyword => lowerFileName.includes(keyword))) {
    score += 40;
  }
  
  if (isSensitive) score += 20;
  if (containsPII) score += 20;
  
  return Math.min(score, 100);
}

// Determina nível de risco geral
function determineOverallRiskLevel(securityScore: number, lgpdScore: number, litigationScore: number): string {
  const maxScore = Math.max(securityScore, lgpdScore, litigationScore);
  
  if (maxScore >= 70) return 'critico';
  if (maxScore >= 50) return 'alto';
  if (maxScore >= 30) return 'medio';
  return 'baixo';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      user_id, 
      file_name, 
      file_path,
      file_size_bytes,
      file_type,
      is_sensitive = false,
      contains_pii = false,
      latitude,
      longitude,
      device_info,
      ip_address
    } = await req.json();

    console.log('Processing download log for file:', file_name);

    // Buscar company_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user_id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Calcular scores de risco
    const securityRiskScore = calculateSecurityRiskScore(file_name, file_type, is_sensitive);
    const lgpdRiskScore = calculateLGPDRiskScore(file_name, contains_pii);
    const litigationRiskScore = calculateLitigationRiskScore(file_name, is_sensitive, contains_pii);
    const overallRiskLevel = determineOverallRiskLevel(securityRiskScore, lgpdRiskScore, litigationRiskScore);

    // Identificar fatores de risco
    const riskFactors = [];
    if (securityRiskScore >= 50) riskFactors.push('Alto risco de segurança');
    if (lgpdRiskScore >= 50) riskFactors.push('Alto risco LGPD');
    if (litigationRiskScore >= 50) riskFactors.push('Alto risco de contencioso');
    if (is_sensitive) riskFactors.push('Arquivo marcado como sensível');
    if (contains_pii) riskFactors.push('Contém dados pessoais (PII)');

    // Inserir log de download
    const { data: downloadLog, error: logError } = await supabase
      .from('download_logs')
      .insert({
        company_id: profile.company_id,
        user_id,
        file_name,
        file_path,
        file_size_bytes,
        file_type,
        is_sensitive,
        contains_pii,
        latitude,
        longitude,
        device_info,
        ip_address,
        security_risk_score: securityRiskScore,
        lgpd_risk_score: lgpdRiskScore,
        litigation_risk_score: litigationRiskScore,
        overall_risk_level: overallRiskLevel,
        risk_factors: riskFactors
      })
      .select()
      .single();

    if (logError) throw logError;

    // Criar alerta se risco for alto ou crítico
    if (overallRiskLevel === 'alto' || overallRiskLevel === 'critico') {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user_id)
        .single();

      const alertTitle = `Download de arquivo de ${overallRiskLevel === 'critico' ? 'risco crítico' : 'alto risco'}`;
      const alertDescription = `${userProfile?.full_name || 'Usuário'} baixou "${file_name}". Fatores: ${riskFactors.join(', ')}`;

      const { data: alert } = await supabase
        .from('alerts')
        .insert({
          company_id: profile.company_id,
          type: 'download_risk',
          title: alertTitle,
          description: alertDescription,
          priority: overallRiskLevel === 'critico' ? 'alta' : 'media',
          conditions: {
            user_id,
            file_name,
            security_risk_score: securityRiskScore,
            lgpd_risk_score: lgpdRiskScore,
            litigation_risk_score: litigationRiskScore,
            overall_risk_level: overallRiskLevel
          },
          is_active: true
        })
        .select()
        .single();

      if (alert) {
        await supabase
          .from('alert_events')
          .insert({
            company_id: profile.company_id,
            alert_id: alert.id,
            triggered_by_data: {
              download_log_id: downloadLog.id,
              user_id,
              file_name,
              risk_factors: riskFactors
            }
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        download_log: downloadLog,
        security_risk_score: securityRiskScore,
        lgpd_risk_score: lgpdRiskScore,
        litigation_risk_score: litigationRiskScore,
        overall_risk_level: overallRiskLevel
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in process-download-log:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
