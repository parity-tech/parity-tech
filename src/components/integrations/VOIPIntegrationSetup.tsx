import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Save, Phone } from "lucide-react";

const VOIP_PROVIDERS = [
  { value: "zenvia", label: "Zenvia" },
  { value: "twilio", label: "Twilio" },
  { value: "vonage", label: "Vonage" },
  { value: "3cx", label: "3CX" },
  { value: "asterisk", label: "Asterisk" },
];

export default function VOIPIntegrationSetup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(true);

  const handleTestConnection = async () => {
    if (!provider || !apiKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o provedor e informe a API Key",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-api-connection", {
        body: {
          provider,
          api_key: apiKey,
          base_url: baseUrl,
          integration_type: "phone_system",
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: data.message || "Conexão com a API testada com sucesso",
        });
      } else {
        throw new Error(data.error || "Falha ao testar conexão");
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast({
        title: "Erro na conexão",
        description: error instanceof Error ? error.message : "Não foi possível conectar à API",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!provider || !apiKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o provedor VOIP e informe a API Key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Perfil não encontrado");

      const { error } = await supabase.from("api_integrations").insert([{
        company_id: profile.company_id,
        type: "phone_system",
        name: provider,
        base_url: baseUrl || `https://api.${provider}.com`,
        auth_type: "api_key",
        credentials_encrypted: apiKey,
        status: syncEnabled ? "ativo" : "pendente",
        created_by: userData.user.id,
      }]);

      if (error) throw error;

      toast({
        title: "Integração configurada",
        description: `${provider} configurado com sucesso`,
      });

      setApiKey("");
      setBaseUrl("");
    } catch (error) {
      console.error("Erro ao salvar integração:", error);
      toast({
        title: "Erro",
        description: "Falha ao configurar integração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Integração VOIP
        </CardTitle>
        <CardDescription>
          Configure a conexão com seu sistema de telefonia para rastreamento automático de chamadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="voip-provider">Provedor VOIP</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger id="voip-provider">
              <SelectValue placeholder="Selecione o provedor" />
            </SelectTrigger>
            <SelectContent>
              {VOIP_PROVIDERS.map((voip) => (
                <SelectItem key={voip.value} value={voip.value}>
                  {voip.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key / Token</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Cole sua API Key aqui"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base-url">URL Base (opcional)</Label>
          <Input
            id="base-url"
            placeholder="https://api.zenvia.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sync-enabled">Sincronização automática</Label>
            <p className="text-sm text-muted-foreground">
              Ativar sincronização de chamadas em tempo real
            </p>
          </div>
          <Switch
            id="sync-enabled"
            checked={syncEnabled}
            onCheckedChange={setSyncEnabled}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={loading || testingConnection} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={loading || testingConnection}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testingConnection ? "animate-spin" : ""}`} />
            Testar Conexão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}