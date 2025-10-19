import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para calcular distância entre dois pontos (fórmula de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distância em metros
}

// Calcula score de risco de localização (0-100)
function calculateLocationRiskScore(distanceMeters: number): number {
  if (distanceMeters <= 50) return 0;
  if (distanceMeters <= 100) return 10;
  if (distanceMeters <= 500) return 30;
  if (distanceMeters <= 1000) return 50;
  if (distanceMeters <= 5000) return 70;
  return 100;
}

// Calcula diferença de tempo em minutos
function calculateTimeDifference(expected: string, actual: string): number {
  const [expH, expM] = expected.split(':').map(Number);
  const [actH, actM] = actual.split(':').map(Number);
  
  const expMinutes = expH * 60 + expM;
  const actMinutes = actH * 60 + actM;
  
  return actMinutes - expMinutes;
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
      log_type, 
      actual_time, 
      log_date,
      latitude, 
      longitude,
      expected_time,
      expected_location_lat,
      expected_location_lng,
      device_info,
      ip_address
    } = await req.json();

    console.log('Processing time log for user:', user_id);

    // Buscar company_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user_id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Calcular distância e score de risco de localização
    let distanceMeters = 0;
    let locationRiskScore = 0;
    
    if (latitude && longitude && expected_location_lat && expected_location_lng) {
      distanceMeters = calculateDistance(
        expected_location_lat, 
        expected_location_lng, 
        latitude, 
        longitude
      );
      locationRiskScore = calculateLocationRiskScore(distanceMeters);
    }

    // Calcular diferença de tempo
    let minutesDifference = 0;
    let isLate = false;
    
    if (expected_time) {
      minutesDifference = calculateTimeDifference(expected_time, actual_time);
      isLate = minutesDifference > 0;
    }

    // Verificar irregularidades
    const hasIrregularity = locationRiskScore >= 50 || Math.abs(minutesDifference) >= 15;
    const irregularityReasons = [];
    
    if (locationRiskScore >= 50) {
      irregularityReasons.push(`Distância do local esperado: ${Math.round(distanceMeters)}m`);
    }
    if (Math.abs(minutesDifference) >= 15) {
      irregularityReasons.push(`Diferença de tempo: ${Math.abs(minutesDifference)} minutos ${isLate ? 'atrasado' : 'adiantado'}`);
    }

    // Inserir log de ponto
    const { data: timeLog, error: logError } = await supabase
      .from('time_logs')
      .insert({
        company_id: profile.company_id,
        user_id,
        log_type,
        expected_time,
        actual_time,
        log_date,
        latitude,
        longitude,
        expected_location_lat,
        expected_location_lng,
        distance_from_expected_meters: distanceMeters,
        location_risk_score: locationRiskScore,
        is_late: isLate,
        minutes_difference: minutesDifference,
        device_info,
        ip_address,
        has_irregularity: hasIrregularity,
        irregularity_reason: irregularityReasons.join('; ')
      })
      .select()
      .single();

    if (logError) throw logError;

      // Verificar reincidência de irregularidades (últimos 7 dias)
      if (hasIrregularity) {
        const { data: recentLogs, error: recentError } = await supabase
          .from('time_logs')
          .select('id')
          .eq('user_id', user_id)
          .eq('has_irregularity', true)
          .gte('log_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .neq('id', timeLog.id);

        if (recentError) throw recentError;

        const reincidenceCount = recentLogs?.length || 0;
        
        // Criar alerta se houver reincidência (3 ou mais irregularidades em 7 dias)
        if (reincidenceCount >= 2) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name, company_id')
            .eq('id', user_id)
            .single();

          const alertTitle = `Reincidência de irregularidades no ponto - ${userProfile?.full_name || 'Usuário'}`;
          const alertDescription = `${reincidenceCount + 1} irregularidades nos últimos 7 dias. Última: ${irregularityReasons.join('; ')}`;

          // Verificar se já existe alerta ativo para este usuário
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('company_id', userProfile?.company_id || profile.company_id)
            .eq('type', 'time_log_recurrence')
            .eq('is_active', true)
            .contains('conditions', { user_id })
            .single();

          if (!existingAlert && userProfile) {
            const { data: alert } = await supabase
              .from('alerts')
              .insert({
                company_id: userProfile.company_id,
                type: 'time_log_recurrence',
                title: alertTitle,
                description: alertDescription,
                priority: reincidenceCount >= 4 ? 'alta' : 'media',
                conditions: {
                  user_id,
                  recurrence_count: reincidenceCount + 1,
                  period_days: 7
                },
                is_active: true
              })
              .select()
              .single();

            if (alert) {
              await supabase
                .from('alert_events')
                .insert({
                  company_id: userProfile.company_id,
                  alert_id: alert.id,
                  triggered_by_data: {
                    time_log_id: timeLog.id,
                    user_id,
                    irregularity_reason: irregularityReasons.join('; '),
                    location_risk_score: locationRiskScore,
                    minutes_difference: minutesDifference
                  }
                });
            }
          }
        }
      }

    return new Response(
      JSON.stringify({ 
        success: true, 
        time_log: timeLog,
        risk_score: locationRiskScore,
        has_irregularity: hasIrregularity
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in process-time-log:', error);
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
