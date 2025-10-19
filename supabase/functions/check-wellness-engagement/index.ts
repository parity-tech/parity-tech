import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking wellness engagement...');

    // Buscar saldos de pontos de todos os usuários
    const { data: balances, error } = await supabase
      .from('wellness_points_balance')
      .select(`
        *,
        profiles!wellness_points_balance_user_id_fkey(
          full_name,
          id
        )
      `);

    if (error) {
      console.error('Error fetching balances:', error);
      throw error;
    }

    console.log(`Found ${balances?.length || 0} user balances`);

    const lowEngagementAlerts = [];
    const highEngagementAlerts = [];
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    for (const balance of balances || []) {
      const user = balance.profiles;
      const companyId = balance.company_id;
      const lastActivity = balance.last_activity_at ? new Date(balance.last_activity_at) : null;
      
      // ALERTA: Baixo engajamento (0 pontos em 3 meses)
      if (balance.lifetime_points === 0 || (lastActivity && lastActivity < threeMonthsAgo)) {
        // Verificar se já existe alerta ativo
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('company_id', companyId)
          .eq('type', 'wellness_low_engagement')
          .eq('is_active', true)
          .contains('conditions', { user_id: balance.user_id })
          .single();

        if (!existingAlert) {
          const monthsInactive = lastActivity 
            ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24 * 30))
            : 'nunca participou';

          const alertTitle = `📉 Baixo engajamento - ${user.full_name}`;
          const alertDescription = `Colaborador sem atividade em programas de bem-estar ${
            typeof monthsInactive === 'number' 
              ? `há ${monthsInactive} meses` 
              : '(nunca participou)'
          }`;

          const { data: alert, error: alertError } = await supabase
            .from('alerts')
            .insert({
              company_id: companyId,
              type: 'wellness_low_engagement',
              title: alertTitle,
              description: alertDescription,
              priority: 'media',
              conditions: {
                user_id: balance.user_id,
                months_inactive: monthsInactive,
                lifetime_points: balance.lifetime_points
              },
              is_active: true
            })
            .select()
            .single();

          if (alertError) {
            console.error('Error creating low engagement alert:', alertError);
          } else {
            console.log(`Created low engagement alert: ${alert.id}`);
            lowEngagementAlerts.push(alert.id);

            await supabase
              .from('alert_events')
              .insert({
                company_id: companyId,
                alert_id: alert.id,
                triggered_by_data: {
                  user_id: balance.user_id,
                  months_inactive: monthsInactive,
                  lifetime_points: balance.lifetime_points
                }
              });
          }
        }
      }
      
      // ALERTA: Alto engajamento (reconhecimento) - > 500 pontos lifetime
      if (balance.lifetime_points > 500) {
        // Verificar se já foi reconhecido recentemente (últimos 3 meses)
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('company_id', companyId)
          .eq('type', 'wellness_high_engagement')
          .contains('conditions', { user_id: balance.user_id })
          .gte('created_at', threeMonthsAgo.toISOString())
          .single();

        if (!existingAlert) {
          const alertTitle = `🏆 Alto engajamento - ${user.full_name}`;
          const alertDescription = `Colaborador atingiu ${balance.lifetime_points} pontos! Considere reconhecimento.`;

          const { data: alert, error: alertError } = await supabase
            .from('alerts')
            .insert({
              company_id: companyId,
              type: 'wellness_high_engagement',
              title: alertTitle,
              description: alertDescription,
              priority: 'baixa',
              conditions: {
                user_id: balance.user_id,
                lifetime_points: balance.lifetime_points,
                available_points: balance.available_points
              },
              is_active: true
            })
            .select()
            .single();

          if (alertError) {
            console.error('Error creating high engagement alert:', alertError);
          } else {
            console.log(`Created high engagement alert: ${alert.id}`);
            highEngagementAlerts.push(alert.id);

            await supabase
              .from('alert_events')
              .insert({
                company_id: companyId,
                alert_id: alert.id,
                triggered_by_data: {
                  user_id: balance.user_id,
                  lifetime_points: balance.lifetime_points
                }
              });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        users_checked: balances?.length || 0,
        low_engagement_alerts: lowEngagementAlerts.length,
        high_engagement_alerts: highEngagementAlerts.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-wellness-engagement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
