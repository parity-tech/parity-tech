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

    console.log('Checking for overtime alerts...');

    // Buscar registros de horas extras dos últimos 7 dias
    const { data: overtimeRecords, error } = await supabase
      .from('overtime_records')
      .select(`
        *,
        profiles!overtime_records_user_id_fkey(
          full_name,
          id
        )
      `)
      .gte('record_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching overtime records:', error);
      throw error;
    }

    console.log(`Found ${overtimeRecords?.length || 0} overtime records`);

    const alertsCreated = [];

    for (const record of overtimeRecords || []) {
      const shouldAlert = 
        (record.overtime_hours > 2 && !record.has_overtime_approval) || // HE não aprovada > 2h
        record.undertime_hours > 1 || // Horas a menor > 1h
        record.overtime_hours > 4; // HE > 4h (independente de aprovação)

      if (shouldAlert && !record.has_alert) {
        const reasons = [];
        let priority = 'media';

        if (record.overtime_hours > 4) {
          reasons.push(`Horas extras excessivas: ${record.overtime_hours.toFixed(2)}h`);
          priority = 'alta';
        }
        if (record.overtime_hours > 2 && !record.has_overtime_approval) {
          reasons.push(`Horas extras não aprovadas: ${record.overtime_hours.toFixed(2)}h`);
        }
        if (record.undertime_hours > 1) {
          reasons.push(`Horas a menor: ${record.undertime_hours.toFixed(2)}h`);
        }

        const alertTitle = `Alerta de horas trabalhadas - ${record.profiles?.full_name || 'Usuário'}`;
        const alertDescription = reasons.join('; ');

        // Verificar se já existe alerta para este registro
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('company_id', record.company_id)
          .eq('type', 'overtime_alert')
          .contains('conditions', { overtime_record_id: record.id })
          .single();

        if (!existingAlert) {
          const { data: alert, error: alertError } = await supabase
            .from('alerts')
            .insert({
              company_id: record.company_id,
              type: 'overtime_alert',
              title: alertTitle,
              description: alertDescription,
              priority,
              conditions: {
                overtime_record_id: record.id,
                user_id: record.user_id,
                overtime_hours: record.overtime_hours,
                undertime_hours: record.undertime_hours,
                has_approval: record.has_overtime_approval
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

            // Marcar registro como tendo alerta
            await supabase
              .from('overtime_records')
              .update({ has_alert: true })
              .eq('id', record.id);

            // Criar evento de alerta
            await supabase
              .from('alert_events')
              .insert({
                company_id: record.company_id,
                alert_id: alert.id,
                triggered_by_data: {
                  overtime_record_id: record.id,
                  user_id: record.user_id,
                  overtime_hours: record.overtime_hours,
                  undertime_hours: record.undertime_hours,
                  reasons
                }
              });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        records_checked: overtimeRecords?.length || 0,
        alerts_created: alertsCreated.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-overtime-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
