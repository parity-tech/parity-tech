import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VOIPCallData {
  user_id: string;
  call_duration_seconds: number;
  call_timestamp: string;
  call_direction: 'inbound' | 'outbound';
  phone_number?: string;
  metadata?: Record<string, any>;
}

interface SyncRequest {
  integration_id: string;
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
    console.log('VOIP sync request:', payload);

    // Buscar configuração da integração
    const { data: integration, error: integrationError } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('id', payload.integration_id)
      .eq('type', 'phone_system')
      .single();

    if (integrationError || !integration) {
      throw new Error('Integração VOIP não encontrada');
    }

    let syncedCalls = 0;
    const errors: string[] = [];

    try {
      // Aqui você implementaria a lógica para buscar dados do sistema VOIP
      // Exemplos: Twilio, Vonage, 3CX, Asterisk, etc.
      
      // const voipCalls: VOIPCallData[] = await fetchVOIPCalls(integration, payload.date_range);
      
      // Para cada chamada, criar um registro de atividade
      // for (const call of voipCalls) {
      //   await supabase.from('activity_events').insert({
      //     company_id: integration.company_id,
      //     user_id: call.user_id,
      //     activity_type: 'call',
      //     external_system: 'phone_system',
      //     timestamp: call.call_timestamp,
      //     duration_seconds: call.call_duration_seconds,
      //     metadata: {
      //       direction: call.call_direction,
      //       phone_number: call.phone_number,
      //       ...call.metadata,
      //     },
      //   });
      //   syncedCalls++;
      // }
      
      console.log('Sincronização VOIP iniciada');

      // Log de sucesso
      await supabase.from('api_integration_logs').insert({
        integration_id: integration.id,
        company_id: integration.company_id,
        method: 'GET',
        endpoint: '/sync/calls',
        success: true,
        status_code: 200,
        response_time_ms: 0,
        request_payload: payload,
        response_payload: { synced_calls: syncedCalls },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      await supabase.from('api_integration_logs').insert({
        integration_id: integration.id,
        company_id: integration.company_id,
        method: 'GET',
        endpoint: '/sync/calls',
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
        synced_calls: syncedCalls,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-voip-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
