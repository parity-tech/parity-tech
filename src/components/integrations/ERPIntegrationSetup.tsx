import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Save } from "lucide-react";

const ERP_PROVIDERS = [
  { value: "sap", label: "SAP" },
  { value: "oracle", label: "Oracle ERP" },
  { value: "totvs", label: "TOTVS" },
  { value: "senior", label: "Senior" },
  { value: "omie", label: "Omie" },
];

export default function ERPIntegrationSetup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(true);

  const handleSave = async () => {
    if (!provider || !apiKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o ERP e informe a API Key",
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
        type: "erp",
        name: provider,
        base_url: baseUrl,
        auth_type: "api_key",
        credentials_encrypted: apiKey,
        status: syncEnabled ? "ativo" : "pendente",
        created_by: userData.user.id,
      });

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
        <CardTitle>Integração com ERP</CardTitle>
        <CardDescription>
          Configure a conexão bidirecional com seu sistema ERP para sincronizar logins, horários de entrada e downloads por usuário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="erp-provider">Provedor de ERP</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger id="erp-provider">
              <SelectValue placeholder="Selecione o ERP" />
            </SelectTrigger>
            <SelectContent>
              {ERP_PROVIDERS.map((erp) => (
                <SelectItem key={erp.value} value={erp.value}>
                  {erp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
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
            placeholder="https://api.exemplo.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sync-enabled">Sincronização automática</Label>
            <p className="text-sm text-muted-foreground">
              Ativar sincronização bidirecional de dados
            </p>
          </div>
          <Switch
            id="sync-enabled"
            checked={syncEnabled}
            onCheckedChange={setSyncEnabled}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>
          <Button variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Testar Conexão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
