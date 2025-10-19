import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LEGAL_EXPERT_PROMPT = `Especialista em Direito - Pós-Graduação UFRJ

Você é um profissional pós-graduado pela UFRJ com formação completa em Direito. Responda exclusivamente como especialista com as seguintes competências:

Fundamentos Teóricos
Economia Política, Teoria do Direito, Sociologia Geral, Filosofia Geral, História do Direito e Pensamento Jurídico, Teoria do Estado

Domínios Jurídicos
Direito Privado: Civil (Obrigações, Reais, Sucessões), Comercial, Trabalho Direito Público: Constitucional, Administrativo, Tributário, Internacional Público, Penal Direito Processual: Civil (I-IV), Penal (I-II), Teoria Geral do Processo Estudos Críticos: Criminologia, Filosofia do Direito, Prática Jurídica

Diretrizes de Resposta
Fundamentação: Cite base legal (CF, CC, CPC, CPP, legislação pertinente) e jurisprudência pacífica quando relevante
Análise crítica: Incorpore perspectiva histórica e sociológica do fenômeno jurídico
Contexto: Considere múltiplas dimensões (normativa, dogmática, sociológica, criminológica)
Precisão técnica: Use terminologia jurídica correta. Distinga opinião doutrinária de posicionamento consolidado
Limitações: Sinalize quando há divergência doutrinária, julgados conflitantes ou lacunas legais
Aplicação prática: Adapte ao contexto SaaS/no-code quando solicitado

Contexto de Negócio
Você está ajudando a construir um SaaS com ferramentas no-code. Qualifique soluções considerando compliance jurídico, escalabilidade regulatória e conformidade legal.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      alertId, 
      alertEventId, 
      userId, 
      companyId, 
      riskLevel, 
      riskFactors,
      userName,
      userDepartment,
      occurrenceType
    } = await req.json();

    // Gerar documento de ação corretiva usando IA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `${LEGAL_EXPERT_PROMPT}

TAREFA: Gerar um documento oficial de aviso/ação corretiva para o seguinte caso:

Colaborador: ${userName}
Setor: ${userDepartment}
Nível de Risco: ${riskLevel}
Tipo de Ocorrência: ${occurrenceType}

Fatores de Risco Identificados:
${riskFactors.join('\n')}

Por favor, elabore um documento formal contendo:
1. Identificação da ocorrência
2. Base legal aplicável (CLT e legislação trabalhista brasileira)
3. Orientações claras de ação corretiva
4. Consequências de não conformidade
5. Prazo para regularização (sugerir apropriado)
6. Assinatura e data

O documento deve ser profissional, claro e juridicamente embasado, adequado para ser entregue ao colaborador e arquivado no RH.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: LEGAL_EXPERT_PROMPT },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limites de taxa excedidos, tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Pagamento necessário, adicione créditos ao seu workspace Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI Gateway error');
    }

    const aiData = await aiResponse.json();
    const documentContent = aiData.choices[0].message.content;

    // Gerar sugestões adicionais de ações
    const suggestionsPrompt = `Com base na ocorrência descrita, liste 3-5 ações corretivas práticas e específicas que o RH e gestor devem tomar, além da entrega do documento. Liste em formato de bullet points conciso.`;

    const suggestionsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: LEGAL_EXPERT_PROMPT },
          { role: 'user', content: prompt },
          { role: 'assistant', content: documentContent },
          { role: 'user', content: suggestionsPrompt }
        ],
      }),
    });

    const suggestionsData = await suggestionsResponse.json();
    const aiSuggestions = suggestionsData.choices[0].message.content;

    // Obter departmentId do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('department_id')
      .eq('id', userId)
      .single();

    // Salvar documento de ação corretiva
    const { data: correctiveAction, error: insertError } = await supabaseClient
      .from('corrective_actions')
      .insert({
        company_id: companyId,
        user_id: userId,
        alert_id: alertId,
        alert_event_id: alertEventId,
        department_id: profile?.department_id,
        document_content: documentContent,
        occurrence_date: new Date().toISOString(),
        occurrence_type: occurrenceType,
        status: 'pendente'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting corrective action:', insertError);
      throw insertError;
    }

    // Atualizar alert_event com as sugestões da IA
    await supabaseClient
      .from('alert_events')
      .update({
        corrective_action_document: documentContent,
        ai_suggested_actions: aiSuggestions
      })
      .eq('id', alertEventId);

    return new Response(
      JSON.stringify({
        success: true,
        documentContent,
        aiSuggestions,
        correctiveActionId: correctiveAction.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating corrective action:', error);
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
