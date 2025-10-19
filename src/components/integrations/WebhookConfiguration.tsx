import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Plus, Trash2, RefreshCw } from "lucide-react";

interface WebhookConfigurationProps {
  integrationType: "crm" | "erp" | "rh" | "outro";
}

export default function WebhookConfiguration({ integrationType }: WebhookConfigurationProps) {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, [integrationType]);

  const loadWebhooks = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from("api_integrations")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("type", integrationType);

      setWebhooks(data || []);
    } catch (error) {
      console.error("Erro ao carregar webhooks:", error);
    }
  };

  const generateWebhookUrl = () => {
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = integrationType === "crm" ? "sync-crm-data" :
                     integrationType === "erp" ? "sync-erp-data" :
                     integrationType === "rh" ? "sync-hr-data" :
                     "sync-bi-data";
    
    return `${projectUrl}/functions/v1/${endpoint}`;
  };

  const handleCopyWebhook = async () => {
    const url = generateWebhookUrl();
    await navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada",
      description: "URL do webhook copiada para a área de transferência",
    });
  };

  const handleAddWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "URL obrigatória",
        description: "Informe a URL de callback do webhook",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const { error } = await supabase.from("api_integrations").insert({
        company_id: profile.company_id,
        type: integrationType,
        name: `webhook_${integrationType}`,
        base_url: webhookUrl,
        auth_type: "webhook",
        status: "ativo",
        created_by: userData.user.id,
        metadata: {
          auto_sync: true,
          sync_interval: "realtime",
        },
      });

      if (error) throw error;

      toast({
        title: "Webhook configurado",
        description: "Webhook adicionado com sucesso",
      });

      setWebhookUrl("");
      loadWebhooks();
    } catch (error) {
      console.error("Erro ao adicionar webhook:", error);
      toast({
        title: "Erro",
        description: "Falha ao configurar webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from("api_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Webhook removido",
        description: "Webhook excluído com sucesso",
      });

      loadWebhooks();
    } catch (error) {
      console.error("Erro ao remover webhook:", error);
      toast({
        title: "Erro",
        description: "Falha ao remover webhook",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Webhooks</CardTitle>
          <CardDescription>
            Configure webhooks para sincronização automática em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do Webhook (Entrada)</Label>
            <div className="flex gap-2">
              <Input value={generateWebhookUrl()} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use esta URL no sistema externo para enviar dados automaticamente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="callback-url">URL de Callback (Saída)</Label>
            <div className="flex gap-2">
              <Input
                id="callback-url"
                placeholder="https://seu-sistema.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <Button onClick={handleAddWebhook} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              URL para enviar dados sincronizados para seu sistema
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
          <CardDescription>
            Gerencie webhooks ativos para sincronização bidirecional
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum webhook configurado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{webhook.name}</p>
                      <Badge variant={webhook.status === "ativo" ? "default" : "secondary"}>
                        {webhook.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {webhook.base_url}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
