import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { alertEventId } = await req.json();

    // Buscar dados do alert event
    const { data: alertEvent, error: eventError } = await supabaseClient
      .from('alert_events')
      .select(`
        *,
        alerts!inner(
          *,
          company_id
        )
      `)
      .eq('id', alertEventId)
      .single();

    if (eventError || !alertEvent) {
      throw new Error('Alert event not found');
    }

    const alert = alertEvent.alerts;
    const userId = alertEvent.triggered_by_data?.user_id || alertEvent.triggered_by_data?.userId;
    
    if (!userId) {
      throw new Error('User ID not found in alert event data');
    }

    // Buscar informações do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, department_id')
      .eq('id', userId)
      .single();

    // Buscar nome do departamento separadamente
    let departmentName = 'Não especificado';
    if (profile?.department_id) {
      const { data: dept } = await supabaseClient
        .from('departments')
        .select('name')
        .eq('id', profile.department_id)
        .single();
      departmentName = dept?.name || departmentName;
    }

    // Calcular risk score
    const riskCalcResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-risk-score`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          companyId: alert.company_id,
          alertType: alert.type,
          departmentId: profile?.department_id
        })
      }
    );

    const riskData = await riskCalcResponse.json();
    const { riskScore, riskLevel, riskFactors } = riskData;

    // Atualizar alert e alert_event com risk score
    await supabaseClient
      .from('alerts')
      .update({
        risk_score: riskScore,
        risk_level: riskLevel
      })
      .eq('id', alert.id);

    await supabaseClient
      .from('alert_events')
      .update({
        risk_score: riskScore,
        risk_level: riskLevel
      })
      .eq('id', alertEventId);

    // Se for nível médio, alto ou grave, gerar documento de ação corretiva
    if (['medio', 'alto', 'grave'].includes(riskLevel)) {
      const correctiveResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-corrective-action`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            alertId: alert.id,
            alertEventId,
            userId,
            companyId: alert.company_id,
            riskLevel,
            riskFactors,
            userName: profile?.full_name || 'Colaborador',
            userDepartment: departmentName,
            occurrenceType: alert.title
          })
        }
      );

      if (!correctiveResponse.ok) {
        console.error('Error generating corrective action');
      }
    }

    // Buscar usuários do RH e gestores para notificação
    const { data: hrUsers } = await supabaseClient
      .from('user_roles')
      .select('user_id, profiles(full_name)')
      .eq('company_id', alert.company_id)
      .in('role', ['gestor', 'admin']);

    // Se for nível grave, incluir também usuários com role específico de jurídico (se existir)
    // Por enquanto, usamos os mesmos gestores/admins

    return new Response(
      JSON.stringify({
        success: true,
        riskScore,
        riskLevel,
        riskFactors,
        notifyUsers: hrUsers?.map(u => u.user_id) || [],
        message: `Alerta processado com nível de risco: ${riskLevel} (score: ${riskScore})`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error processing risk alert:', error);
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
