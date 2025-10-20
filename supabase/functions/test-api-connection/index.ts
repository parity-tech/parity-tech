import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  provider: string;
  api_key: string;
  base_url?: string;
  integration_type: 'crm' | 'phone_system' | 'erp' | 'hr_system';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: TestRequest = await req.json();
    console.log('Testing API connection for:', payload.provider);

    let testUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Configure test endpoints for different providers
    switch (payload.provider) {
      // VOIP Providers
      case 'zenvia':
        testUrl = payload.base_url || 'https://api.zenvia.com';
        testUrl += '/v2/channels';
        headers['X-API-TOKEN'] = payload.api_key;
        break;

      case 'twilio':
        testUrl = 'https://api.twilio.com/2010-04-01/Accounts.json';
        const twilioAuth = btoa(payload.api_key); // assuming api_key contains AccountSID:AuthToken
        headers['Authorization'] = `Basic ${twilioAuth}`;
        break;

      case 'vonage':
        testUrl = 'https://api.nexmo.com/v1/applications';
        headers['Authorization'] = `Bearer ${payload.api_key}`;
        break;

      // CRM Providers
      case 'pipedrive':
        testUrl = payload.base_url || 'https://api.pipedrive.com/v1';
        testUrl += `/users/me?api_token=${payload.api_key}`;
        break;

      case 'salesforce':
        testUrl = payload.base_url || 'https://login.salesforce.com';
        testUrl += '/services/oauth2/userinfo';
        headers['Authorization'] = `Bearer ${payload.api_key}`;
        break;

      case 'hubspot':
        testUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
        headers['Authorization'] = `Bearer ${payload.api_key}`;
        break;

      case 'rdstation':
        testUrl = 'https://api.rd.services/platform/contacts';
        headers['Authorization'] = `Bearer ${payload.api_key}`;
        break;

      // ERP Providers
      case 'sap':
      case 'totvs':
      case 'senior':
      case 'omie':
        testUrl = payload.base_url || '';
        if (!testUrl) {
          throw new Error('URL Base é obrigatória para este provedor');
        }
        headers['Authorization'] = `Bearer ${payload.api_key}`;
        break;

      // HR Systems
      case 'gupy':
        testUrl = 'https://api.gupy.io/api/v1/jobs';
        headers['Authorization'] = `Bearer ${payload.api_key}`;
        break;

      case 'kenoby':
        testUrl = 'https://api.kenoby.com/v1/jobs';
        headers['x-api-key'] = payload.api_key;
        break;

      default:
        throw new Error(`Provedor ${payload.provider} não suportado para teste de conexão`);
    }

    if (!testUrl) {
      throw new Error('URL de teste não configurada');
    }

    console.log('Testing connection to:', testUrl);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers,
    });

    console.log('Response status:', response.status);

    if (response.ok || response.status === 401) {
      // 401 means API is reachable but credentials might be wrong
      const isSuccess = response.ok;
      
      return new Response(
        JSON.stringify({
          success: isSuccess,
          message: isSuccess 
            ? `Conexão com ${payload.provider} estabelecida com sucesso` 
            : `API ${payload.provider} alcançada, mas credenciais parecem inválidas`,
          status: response.status,
          provider: payload.provider,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errorText = await response.text();
    throw new Error(`Erro HTTP ${response.status}: ${errorText}`);

  } catch (error) {
    console.error('Error testing API connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});