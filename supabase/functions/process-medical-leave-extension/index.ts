import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { certificate_id } = await req.json();

    console.log('Processing medical leave extension for certificate:', certificate_id);

    // Buscar atestado médico
    const { data: certificate, error: certError } = await supabase
      .from('medical_certificates')
      .select('*, profiles!medical_certificates_user_id_fkey(full_name, company_id)')
      .eq('id', certificate_id)
      .single();

    if (certError || !certificate) {
      throw new Error('Certificate not found');
    }

    // Verificar se atestado tem >= 3 dias
    const daysCount = certificate.days_count;
    
    if (daysCount < 3) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Atestado não elegível para extensão (mínimo 3 dias)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe extensão para este atestado
    const { data: existingExtension } = await supabase
      .from('medical_leave_extensions')
      .select('id')
      .eq('certificate_id', certificate_id)
      .single();

    if (existingExtension) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Extensão já solicitada para este atestado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar solicitação de extensão
    const { data: extension, error: extensionError } = await supabase
      .from('medical_leave_extensions')
      .insert({
        company_id: certificate.profiles.company_id,
        user_id: certificate.user_id,
        certificate_id: certificate_id,
        extension_days: 1,
        status: 'pendente'
      })
      .select()
      .single();

    if (extensionError) throw extensionError;

    console.log('Extension created:', extension.id);

    // Criar notificação para Gestor RH (implementar depois com sistema de notificações)
    // TODO: Implementar notificação in-app e email

    return new Response(
      JSON.stringify({ 
        success: true, 
        extension,
        message: 'Extensão de licença solicitada. Aguardando aprovação do RH.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-medical-leave-extension:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
