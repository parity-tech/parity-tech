import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detecta padrões suspeitos em atestados
function detectSuspiciousPatterns(certificates: any[]): string[] {
  const patterns = [];
  
  // Padrão 1: Atestados sempre às sextas/segundas
  const fridayMondayCount = certificates.filter(cert => {
    const startDay = new Date(cert.start_date).getDay();
    return startDay === 1 || startDay === 5; // 1 = segunda, 5 = sexta
  }).length;
  
  if (fridayMondayCount >= 2) {
    patterns.push(`${fridayMondayCount} atestados em sextas/segundas (possível emendação)`);
  }
  
  // Padrão 2: Mesmo CRM médico múltiplas vezes
  const crmCounts = new Map<string, number>();
  certificates.forEach(cert => {
    if (cert.doctor_crm) {
      crmCounts.set(cert.doctor_crm, (crmCounts.get(cert.doctor_crm) || 0) + 1);
    }
  });
  
  for (const [crm, count] of crmCounts.entries()) {
    if (count >= 3) {
      patterns.push(`${count} atestados do mesmo médico CRM ${crm}`);
    }
  }
  
  // Padrão 3: Atestados próximos a feriados (simplificado - apenas detecta fins de semana)
  const weekendCount = certificates.filter(cert => {
    const startDay = new Date(cert.start_date).getDay();
    const endDay = new Date(cert.end_date).getDay();
    return startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6;
  }).length;
  
  if (weekendCount >= 2) {
    patterns.push(`${weekendCount} atestados próximos a fins de semana`);
  }
  
  return patterns;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for medical leave alerts...');

    // Buscar extensões aprovadas dos últimos 12 meses
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: extensions, error } = await supabase
      .from('medical_leave_extensions')
      .select(`
        *,
        profiles!medical_leave_extensions_user_id_fkey(
          full_name,
          id,
          company_id
        ),
        medical_certificates!medical_leave_extensions_certificate_id_fkey(
          start_date,
          end_date,
          doctor_crm,
          days_count
        )
      `)
      .eq('status', 'aprovado')
      .gte('created_at', oneYearAgo.toISOString());

    if (error) {
      console.error('Error fetching extensions:', error);
      throw error;
    }

    console.log(`Found ${extensions?.length || 0} approved extensions`);

    // Agrupar por usuário
    const userExtensions = new Map<string, any[]>();
    extensions?.forEach(ext => {
      const userId = ext.user_id;
      if (!userExtensions.has(userId)) {
        userExtensions.set(userId, []);
      }
      userExtensions.get(userId)!.push(ext);
    });

    const alertsCreated = [];

    // Verificar cada usuário
    for (const [userId, userExts] of userExtensions.entries()) {
      const user = userExts[0].profiles;
      const companyId = user.company_id;
      
      // Critério 1: Frequência (> 3 extensões aprovadas/ano)
      const extensionCount = userExts.length;
      
      // Critério 2: Padrões suspeitos
      const certificates = userExts.map(ext => ext.medical_certificates);
      const suspiciousPatterns = detectSuspiciousPatterns(certificates);
      
      const shouldCreateAlert = extensionCount > 3 || suspiciousPatterns.length > 0;
      
      if (shouldCreateAlert) {
        // Verificar se já existe alerta ativo
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('company_id', companyId)
          .eq('type', 'medical_leave_extension_risk')
          .eq('is_active', true)
          .contains('conditions', { user_id: userId })
          .single();

        if (!existingAlert) {
          const reasons = [];
          let priority = 'media';
          
          if (extensionCount > 3) {
            reasons.push(`${extensionCount} extensões aprovadas no último ano`);
            if (extensionCount > 5) priority = 'alta';
          }
          
          if (suspiciousPatterns.length > 0) {
            reasons.push(...suspiciousPatterns);
            priority = 'alta'; // Padrões suspeitos sempre são alta prioridade
          }
          
          const alertTitle = `⚠️ Risco trabalhista - ${user.full_name}`;
          const alertDescription = `Padrão irregular de licenças médicas. ${reasons.join('. ')}`;

          const { data: alert, error: alertError } = await supabase
            .from('alerts')
            .insert({
              company_id: companyId,
              type: 'medical_leave_extension_risk',
              title: alertTitle,
              description: alertDescription,
              priority,
              conditions: {
                user_id: userId,
                extension_count: extensionCount,
                suspicious_patterns: suspiciousPatterns,
                period_months: 12
              },
              is_active: true
            })
            .select()
            .single();

          if (alertError) {
            console.error('Error creating alert:', alertError);
          } else {
            console.log(`Created CRITICAL alert for legal: ${alert.id}`);
            alertsCreated.push(alert.id);

            // Criar evento de alerta
            await supabase
              .from('alert_events')
              .insert({
                company_id: companyId,
                alert_id: alert.id,
                triggered_by_data: {
                  user_id: userId,
                  extension_count: extensionCount,
                  suspicious_patterns: suspiciousPatterns,
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
        extensions_checked: extensions?.length || 0,
        users_checked: userExtensions.size,
        alerts_created: alertsCreated.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-medical-leave-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
