import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Calendar, Gift, Settings } from "lucide-react";
import HRSystemIntegration from "@/components/integrations/HRSystemIntegration";
import WebhookConfiguration from "@/components/integrations/WebhookConfiguration";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";

export default function HRIntegrations() {
  const { loading, company, userRole, handleLogout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <UserPlus className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        companyName={company?.name || "Parity"}
        userRole={userRole || "admin"}
        onLogout={handleLogout}
      />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Integrações de RH</h2>
          <p className="text-muted-foreground">
            Configure integrações com sistemas de gestão de pessoas, admissões, férias e benefícios
          </p>
        </div>

        <Tabs defaultValue="systems" className="w-full">
          <TabsList className="grid w-full grid-cols-4" role="tablist">
            <TabsTrigger value="systems" aria-label="Sistemas de RH">
              <UserPlus className="h-4 w-4 mr-2" />
              Sistemas
            </TabsTrigger>
            <TabsTrigger value="webhooks" aria-label="Webhooks">
              <Settings className="h-4 w-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="admissions" aria-label="Admissões">
              <UserPlus className="h-4 w-4 mr-2" />
              Admissões
            </TabsTrigger>
            <TabsTrigger value="benefits" aria-label="Benefícios">
              <Gift className="h-4 w-4 mr-2" />
              Benefícios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="systems" className="mt-6" role="tabpanel">
            <HRSystemIntegration />
          </TabsContent>

          <TabsContent value="webhooks" className="mt-6" role="tabpanel">
            <WebhookConfiguration integrationType="rh" />
          </TabsContent>

          <TabsContent value="admissions" className="mt-6" role="tabpanel">
            <Card>
              <CardHeader>
                <CardTitle>Painel de Admissões</CardTitle>
                <CardDescription>
                  Visualize e gerencie processos de admissão importados do sistema de RH
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Dashboard de admissões em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="mt-6" role="tabpanel">
            <Card>
              <CardHeader>
                <CardTitle>Painel de Gestão de Benefícios</CardTitle>
                <CardDescription>
                  Configure e monitore benefícios importados automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Painel de benefícios já disponível na área de Gestão de Pessoas
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
