import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  integration_id: string;
  sync_type: 'logins' | 'activity_times' | 'downloads';
  date_range?: {
    start: string;
    end: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: SyncRequest = await req.json();
    console.log('CRM sync request:', payload);

    // Buscar configuração da integração
    const { data: integration, error: integrationError } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('id', payload.integration_id)
      .eq('type', 'crm')
      .single();

    if (integrationError || !integration) {
      throw new Error('Integração CRM não encontrada');
    }

    // Aqui você implementaria a lógica específica para cada CRM
    // Por exemplo, fazer chamadas à API do Salesforce, HubSpot, etc.
    
    let syncedRecords = 0;
    const errors: string[] = [];

    try {
      // Exemplo de sincronização de logins
      if (payload.sync_type === 'logins') {
        // Fazer chamada à API do CRM para buscar dados de login
        // const crmData = await fetchCRMLogins(integration);
        
        // Registrar atividades no sistema
        // syncedRecords = await importLoginActivities(supabase, crmData);
        
        console.log('Sincronização de logins iniciada');
      }

      // Log de sucesso
      await supabase.from('api_integration_logs').insert({
        integration_id: integration.id,
        company_id: integration.company_id,
        method: 'GET',
        endpoint: '/sync/logins',
        success: true,
        status_code: 200,
        response_time_ms: 0,
        request_payload: payload,
        response_payload: { synced_records: syncedRecords },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      await supabase.from('api_integration_logs').insert({
        integration_id: integration.id,
        company_id: integration.company_id,
        method: 'GET',
        endpoint: '/sync/logins',
        success: false,
        status_code: 500,
        error_message: errorMessage,
        request_payload: payload,
      });

      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced_records: syncedRecords,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-crm-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
