import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityEventPayload {
  company_id: string;
  user_id: string;
  department_id?: string;
  activity_type: 'call' | 'email' | 'ticket' | 'system_access' | 'meeting' | 'task';
  external_system?: 'erp' | 'crm' | 'helpdesk' | 'phone_system' | 'email_system' | 'project_management';
  external_id?: string;
  timestamp?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: ActivityEventPayload = await req.json();
    
    console.log('Received activity event:', payload);

    // Validação básica
    if (!payload.company_id || !payload.user_id || !payload.activity_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: company_id, user_id, activity_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inserir evento
    const { data, error } = await supabase
      .from('activity_events')
      .insert({
        company_id: payload.company_id,
        user_id: payload.user_id,
        department_id: payload.department_id,
        activity_type: payload.activity_type,
        external_system: payload.external_system,
        external_id: payload.external_id,
        timestamp: payload.timestamp || new Date().toISOString(),
        duration_seconds: payload.duration_seconds,
        metadata: payload.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting activity event:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Activity event created:', data.id);

    return new Response(
      JSON.stringify({ success: true, event_id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in webhook-activity-events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});