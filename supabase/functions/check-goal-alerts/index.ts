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

    console.log('Checking for goal alerts...');

    // Buscar achievements abaixo da meta (< 100%)
    const { data: underperforming, error } = await supabase
      .from('goal_achievements')
      .select(`
        *,
        goals!inner(
          name,
          description,
          department_id,
          company_id
        ),
        profiles!goal_achievements_user_id_fkey(
          full_name,
          id
        )
      `)
      .lt('achievement_percentage', 100)
      .gte('period_start', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Últimos 7 dias

    if (error) {
      console.error('Error fetching underperforming achievements:', error);
      throw error;
    }

    console.log(`Found ${underperforming?.length || 0} underperforming achievements`);

    const alertsCreated = [];

    for (const achievement of underperforming || []) {
      const goal = achievement.goals;
      
      // Criar alerta se achievement_percentage < 80%
      if (achievement.achievement_percentage < 80) {
        const alertTitle = `Meta abaixo do esperado: ${goal.name}`;
        const alertDescription = achievement.user_id
          ? `Usuário ${achievement.profiles?.full_name || 'Desconhecido'} está com ${achievement.achievement_percentage.toFixed(1)}% da meta atingida`
          : `Departamento está com ${achievement.achievement_percentage.toFixed(1)}% da meta atingida`;

        // Verificar se já existe alerta para este achievement
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('company_id', goal.company_id)
          .eq('type', 'goal_underperformance')
          .contains('conditions', { goal_id: achievement.goal_id, period_start: achievement.period_start })
          .single();

        if (!existingAlert) {
          const { data: alert, error: alertError } = await supabase
            .from('alerts')
            .insert({
              company_id: goal.company_id,
              type: 'goal_underperformance',
              title: alertTitle,
              description: alertDescription,
              priority: achievement.achievement_percentage < 50 ? 'alta' : 'media',
              conditions: {
                goal_id: achievement.goal_id,
                achievement_id: achievement.id,
                period_start: achievement.period_start,
                period_end: achievement.period_end,
                achievement_percentage: achievement.achievement_percentage
              },
              is_active: true
            })
            .select()
            .single();

          if (alertError) {
            console.error('Error creating alert:', alertError);
          } else {
            console.log(`Created alert: ${alert.id}`);
            alertsCreated.push(alert.id);

            // Criar evento de alerta
            await supabase
              .from('alert_events')
              .insert({
                company_id: goal.company_id,
                alert_id: alert.id,
                triggered_by_data: {
                  achievement_id: achievement.id,
                  user_id: achievement.user_id,
                  department_id: achievement.department_id,
                  achievement_percentage: achievement.achievement_percentage
                }
              });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        underperforming_count: underperforming?.length || 0,
        alerts_created: alertsCreated.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-goal-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});