import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskCalculationParams {
  userId: string;
  companyId: string;
  alertType: string;
  departmentId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, companyId, alertType, departmentId }: RiskCalculationParams = await req.json();

    let riskScore = 0;
    let riskLevel = 'baixo';
    const riskFactors: string[] = [];

    // 1. Avaliar batidas de ponto (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: timeLogs, error: timeLogsError } = await supabaseClient
      .from('time_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (!timeLogsError && timeLogs) {
      const totalDays = 30;
      const workedDays = new Set(timeLogs.map(log => log.log_date)).size;
      const expectedDays = 22; // ~22 dias úteis por mês

      if (workedDays === 0) {
        riskScore += 40;
        riskFactors.push('Nunca bateu ponto nos últimos 30 dias');
      } else if (workedDays < expectedDays * 0.7) {
        riskScore += 25;
        riskFactors.push('Frequência de batida de ponto irregular (semanal ou menos)');
      }

      // Verificar irregularidades
      const irregularLogs = timeLogs.filter(log => log.has_irregularity);
      if (irregularLogs.length > 5) {
        riskScore += 15;
        riskFactors.push(`${irregularLogs.length} batidas de ponto com irregularidades`);
      }
    }

    // 2. Avaliar atestados médicos (último mês)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { data: medicalCerts, error: medicalError } = await supabaseClient
      .from('medical_certificates')
      .select('days_count')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .gte('issue_date', lastMonth.toISOString().split('T')[0]);

    if (!medicalError && medicalCerts) {
      const totalMedicalDays = medicalCerts.reduce((sum, cert) => sum + cert.days_count, 0);
      
      if (totalMedicalDays > 10) {
        riskScore += 35;
        riskFactors.push(`${totalMedicalDays} dias de atestado médico no último mês (>10 dias)`);
      } else if (totalMedicalDays > 6) {
        riskScore += 20;
        riskFactors.push(`${totalMedicalDays} dias de atestado médico no último mês (>6 dias)`);
      }
    }

    // 3. Avaliar acessos fora da área de atuação
    if (departmentId) {
      const { data: unauthorizedAccess, error: accessError } = await supabaseClient
        .from('activity_events')
        .select('*, department_permissions!inner(*)')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .neq('department_id', departmentId)
        .gte('timestamp', thirtyDaysAgo.toISOString());

      if (!accessError && unauthorizedAccess && unauthorizedAccess.length > 0) {
        riskScore += 40;
        riskFactors.push(`${unauthorizedAccess.length} acessos a áreas fora da zona de atuação`);
      }
    }

    // 4. Avaliar downloads fora da área de atuação
    const { data: downloads, error: downloadError } = await supabaseClient
      .from('download_logs')
      .select('*, profiles!inner(department_id)')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .gte('download_timestamp', thirtyDaysAgo.toISOString());

    if (!downloadError && downloads) {
      const sensitiveDownloads = downloads.filter(d => 
        d.is_sensitive || d.contains_pii || d.overall_risk_level === 'alto' || d.overall_risk_level === 'critico'
      );

      if (sensitiveDownloads.length > 0) {
        riskScore += 40;
        riskFactors.push(`${sensitiveDownloads.length} downloads de documentos sensíveis fora da área de atuação`);
      }
    }

    // 5. Avaliar horas extras sem justificativa
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const { data: overtime, error: overtimeError } = await supabaseClient
      .from('overtime_records')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('has_overtime_approval', false)
      .gt('overtime_hours', 0)
      .gte('record_date', twoMonthsAgo.toISOString().split('T')[0]);

    if (!overtimeError && overtime) {
      const monthsWithUnauthorizedOvertime = new Set(
        overtime.map(record => record.record_date.substring(0, 7))
      ).size;

      if (monthsWithUnauthorizedOvertime > 1) {
        riskScore += 35;
        riskFactors.push(`Horas extras sem justificativa prévia em ${monthsWithUnauthorizedOvertime} meses`);
      } else if (monthsWithUnauthorizedOvertime === 1) {
        riskScore += 20;
        riskFactors.push('Horas extras sem justificativa prévia em 1 mês');
      }
    }

    // Determinar nível de risco baseado no score
    // Escala: 0-30 = baixo, 31-60 = médio, 61-80 = alto, 81-100 = grave
    if (riskScore <= 30) {
      riskLevel = 'baixo';
    } else if (riskScore <= 60) {
      riskLevel = 'medio';
    } else if (riskScore <= 80) {
      riskLevel = 'alto';
    } else {
      riskLevel = 'grave';
    }

    // Limitar score a 100
    riskScore = Math.min(riskScore, 100);

    return new Response(
      JSON.stringify({
        success: true,
        riskScore,
        riskLevel,
        riskFactors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error calculating risk score:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
