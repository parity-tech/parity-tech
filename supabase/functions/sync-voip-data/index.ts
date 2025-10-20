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

// Transform calls data from different providers to standard format
function transformCallsData(provider: string, data: any): VOIPCallData[] {
  switch (provider) {
    case 'zenvia':
      return (data.calls || []).map((call: any) => ({
        user_id: call.user_id,
        call_duration_seconds: call.duration,
        call_timestamp: call.timestamp,
        call_direction: call.direction,
        phone_number: call.phone_number,
        metadata: { call_id: call.id, status: call.status },
      }));

    case 'twilio':
      return (data.calls || []).map((call: any) => ({
        user_id: call.from_user_id,
        call_duration_seconds: parseInt(call.duration),
        call_timestamp: call.start_time,
        call_direction: call.direction,
        phone_number: call.to,
        metadata: { call_id: call.sid, status: call.status },
      }));

    case 'vonage':
      return (data.records || []).map((call: any) => ({
        user_id: call.user_id,
        call_duration_seconds: call.duration,
        call_timestamp: call.start_time,
        call_direction: call.direction,
        phone_number: call.to.number,
        metadata: { call_id: call.uuid, status: call.status },
      }));

    default:
      return [];
  }
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
      let apiUrl = '';
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Configure API calls based on provider
      switch (integration.name) {
        case 'zenvia':
          apiUrl = integration.base_url + '/v2/reports/calls';
          headers['X-API-TOKEN'] = integration.credentials_encrypted || '';
          break;

        case 'twilio':
          apiUrl = `${integration.base_url}/2010-04-01/Accounts/ACCOUNT_SID/Calls.json`;
          const twilioAuth = btoa(integration.credentials_encrypted || '');
          headers['Authorization'] = `Basic ${twilioAuth}`;
          break;

        case 'vonage':
          apiUrl = `${integration.base_url}/v1/calls`;
          headers['Authorization'] = `Bearer ${integration.credentials_encrypted}`;
          break;

        default:
          throw new Error(`Provedor ${integration.name} não implementado`);
      }

      // Add date range to query if provided
      if (payload.date_range) {
        const params = new URLSearchParams({
          start_date: payload.date_range.start,
          end_date: payload.date_range.end,
        });
        apiUrl += `?${params.toString()}`;
      }

      console.log('Fetching VOIP data from:', integration.name);

      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const callsData = await response.json();
      const voipCalls: VOIPCallData[] = transformCallsData(integration.name, callsData);

      // Insert activity events for each call
      for (const call of voipCalls) {
        await supabase.from('activity_events').insert({
          company_id: integration.company_id,
          user_id: call.user_id,
          activity_type: 'call',
          external_system: 'phone_system',
          external_id: call.metadata?.call_id,
          timestamp: call.call_timestamp,
          duration_seconds: call.call_duration_seconds,
          metadata: {
            direction: call.call_direction,
            phone_number: call.phone_number,
            provider: integration.name,
            ...call.metadata,
          },
        });
        syncedCalls++;
      }
      
      console.log(`Sincronizadas ${syncedCalls} chamadas de ${integration.name}`);

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
