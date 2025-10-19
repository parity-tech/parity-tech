import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Save, Link2 } from "lucide-react";

const BI_PLATFORMS = [
  { value: "powerbi", label: "Microsoft Power BI" },
  { value: "looker", label: "Google Looker" },
  { value: "tableau", label: "Tableau" },
  { value: "metabase", label: "Metabase" },
  { value: "datastudio", label: "Google Data Studio" },
];

export default function BIIntegration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");

  const handleSave = async () => {
    if (!platform || !apiKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a plataforma BI e informe as credenciais",
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
        type: "outro",
        name: platform,
        base_url: embedUrl,
        auth_type: "api_key",
        credentials_encrypted: apiKey,
        status: "ativo",
        created_by: userData.user.id,
        metadata: {
          platform_category: "bi",
          workspace_id: workspaceId,
        },
      });

      if (error) throw error;

      toast({
        title: "Integração configurada",
        description: `${platform} configurado com sucesso`,
      });

      setApiKey("");
      setWorkspaceId("");
      setEmbedUrl("");
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integração com Plataforma BI</CardTitle>
          <CardDescription>
            Configure a conexão com Power BI, Looker ou outras plataformas de Business Intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bi-platform">Plataforma BI</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="bi-platform">
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent>
                {BI_PLATFORMS.map((bi) => (
                  <SelectItem key={bi.value} value={bi.value}>
                    {bi.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-id">Workspace ID / Tenant ID</Label>
            <Input
              id="workspace-id"
              placeholder="ID do workspace"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key / Service Principal</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Cole sua API Key aqui"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="embed-url">URL de Embed (opcional)</Label>
            <Textarea
              id="embed-url"
              placeholder="https://app.powerbi.com/reportEmbed?..."
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              URL para incorporar dashboards diretamente na plataforma
            </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Conexão com Cloud Storage</CardTitle>
          <CardDescription>
            Configure acesso a datasets armazenados em Google Cloud Platform ou SharePoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Link2 className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Importar datasets de GCP ou SharePoint</p>
              <p className="text-sm text-muted-foreground">
                Configure credenciais de acesso vinculadas ao email corporativo
              </p>
            </div>
            <Button variant="outline">
              Configurar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
