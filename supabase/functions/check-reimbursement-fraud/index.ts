import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calcula score de fraude (0-100)
function calculateFraudScore(
  amount: number, 
  hasAllDocuments: boolean, 
  recentCount: number,
  category: string
): { score: number; level: string; indicators: string[] } {
  let score = 0;
  const indicators = [];

  // Valor suspeito (muito alto ou valores redondos)
  if (amount > 1000) {
    score += 20;
    indicators.push('Valor alto');
  }
  if (amount % 100 === 0 && amount > 500) {
    score += 15;
    indicators.push('Valor redondo suspeito');
  }

  // Falta de documentação
  if (!hasAllDocuments) {
    score += 30;
    indicators.push('Documentação incompleta');
  }

  // Frequência alta de reembolsos (> 3 no mês)
  if (recentCount > 3) {
    score += 25;
    indicators.push(`Alta frequência de reembolsos: ${recentCount} no mês`);
  }

  // Categorias de maior risco
  const highRiskCategories = ['combustivel', 'alimentacao', 'outros'];
  if (highRiskCategories.includes(category.toLowerCase())) {
    score += 10;
  }

  // Determinar nível
  let level = 'baixo';
  if (score >= 70) level = 'critico';
  else if (score >= 50) level = 'alto';
  else if (score >= 30) level = 'medio';

  return { score, level, indicators };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for reimbursement fraud alerts...');

    // Buscar reembolsos pendentes ou em análise
    const { data: reimbursements, error } = await supabase
      .from('reimbursements')
      .select(`
        *,
        profiles!reimbursements_user_id_fkey(
          full_name,
          id
        ),
        reimbursement_documents(
          id,
          document_type
        )
      `)
      .in('status', ['pendente', 'em_analise']);

    if (error) {
      console.error('Error fetching reimbursements:', error);
      throw error;
    }

    console.log(`Found ${reimbursements?.length || 0} reimbursements to check`);

    const alertsCreated = [];

    for (const reimbursement of reimbursements || []) {
      // Contar reembolsos recentes do mesmo usuário (últimos 30 dias)
      const { data: recentReimbursements } = await supabase
        .from('reimbursements')
        .select('id')
        .eq('user_id', reimbursement.user_id)
        .gte('expense_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .neq('id', reimbursement.id);

      const recentCount = recentReimbursements?.length || 0;

      // Verificar documentação
      const documents = reimbursement.reimbursement_documents || [];
      const hasAllDocuments = documents.length >= 2; // Mínimo: nota fiscal + comprovante

      // Calcular score de fraude
      const fraudAnalysis = calculateFraudScore(
        Number(reimbursement.amount),
        hasAllDocuments,
        recentCount,
        reimbursement.category
      );

      // Atualizar reembolso com score
      const { error: updateError } = await supabase
        .from('reimbursements')
        .update({
          fraud_risk_score: fraudAnalysis.score,
          fraud_risk_level: fraudAnalysis.level,
          fraud_indicators: fraudAnalysis.indicators,
          has_all_documents: hasAllDocuments,
          missing_documents: hasAllDocuments ? [] : ['Documentação adicional necessária']
        })
        .eq('id', reimbursement.id);

      if (updateError) {
        console.error('Error updating reimbursement:', updateError);
      }

      // Criar alerta se risco for alto ou crítico
      if (fraudAnalysis.level === 'alto' || fraudAnalysis.level === 'critico') {
        // Verificar se já existe alerta para este reembolso
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('company_id', reimbursement.company_id)
          .eq('type', 'reimbursement_fraud')
          .contains('conditions', { reimbursement_id: reimbursement.id })
          .single();

        if (!existingAlert) {
          const alertTitle = `Possível fraude em reembolso - ${reimbursement.profiles?.full_name || 'Usuário'}`;
          const alertDescription = `Reembolso de R$ ${Number(reimbursement.amount).toFixed(2)} com ${fraudAnalysis.level} risco de fraude. Indicadores: ${fraudAnalysis.indicators.join(', ')}`;

          const { data: alert, error: alertError } = await supabase
            .from('alerts')
            .insert({
              company_id: reimbursement.company_id,
              type: 'reimbursement_fraud',
              title: alertTitle,
              description: alertDescription,
              priority: fraudAnalysis.level === 'critico' ? 'alta' : 'media',
              conditions: {
                reimbursement_id: reimbursement.id,
                user_id: reimbursement.user_id,
                fraud_score: fraudAnalysis.score,
                fraud_level: fraudAnalysis.level,
                amount: reimbursement.amount
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
                company_id: reimbursement.company_id,
                alert_id: alert.id,
                triggered_by_data: {
                  reimbursement_id: reimbursement.id,
                  user_id: reimbursement.user_id,
                  amount: reimbursement.amount,
                  fraud_indicators: fraudAnalysis.indicators,
                  fraud_score: fraudAnalysis.score
                }
              });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reimbursements_checked: reimbursements?.length || 0,
        alerts_created: alertsCreated.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-reimbursement-fraud:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
