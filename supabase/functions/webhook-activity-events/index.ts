import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const ActivityEventSchema = z.object({
  company_id: z.string().uuid('Invalid company_id format'),
  user_id: z.string().uuid('Invalid user_id format'),
  department_id: z.string().uuid('Invalid department_id format').optional(),
  activity_type: z.enum(['call', 'email', 'ticket', 'system_access', 'meeting', 'task']),
  external_system: z.enum(['erp', 'crm', 'helpdesk', 'phone_system', 'email_system', 'project_management']).optional(),
  external_id: z.string().max(255).optional(),
  timestamp: z.string().datetime().optional(),
  duration_seconds: z.number().int().min(0).max(86400).optional(),
  metadata: z.record(z.any()).optional()
});

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

    // Get authorization header for JWT verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawPayload = await req.json();
    
    // Validate with Zod
    const validationResult = ActivityEventSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid payload', 
          details: validationResult.error.format() 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: ActivityEventPayload = validationResult.data;
    console.log('Validated activity event:', payload);

    // Verify user has access to the company
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .eq('company_id', payload.company_id)
      .single();

    if (roleError || !userRole) {
      console.error('Authorization failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: User not authorized for this company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user_id in payload matches authenticated user or user is admin
    if (payload.user_id !== user.id && userRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Cannot create events for other users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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