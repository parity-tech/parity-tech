import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Activity } from "lucide-react";
import CRMIntegrationSetup from "@/components/integrations/CRMIntegrationSetup";
import VOIPDashboard from "@/components/integrations/VOIPDashboard";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";

export default function Commercial() {
  const { loading, company, userRole, handleLogout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Users className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
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
          <h2 className="text-3xl font-bold mb-2">Área Comercial</h2>
          <p className="text-muted-foreground">
            Integrações e dashboards para vendas e relacionamento com clientes
          </p>
        </div>

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="grid w-full grid-cols-3" role="tablist">
          <TabsTrigger value="crm" aria-label="Integração CRM">
            <Users className="h-4 w-4 mr-2" />
            CRM
          </TabsTrigger>
          <TabsTrigger value="voip" aria-label="Dashboard VOIP">
            <Activity className="h-4 w-4 mr-2" />
            VOIP
          </TabsTrigger>
          <TabsTrigger value="analytics" aria-label="Analytics comercial">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-6" role="tabpanel">
          <CRMIntegrationSetup />
        </TabsContent>

        <TabsContent value="voip" className="mt-6" role="tabpanel">
          <VOIPDashboard department="comercial" />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6" role="tabpanel">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Comercial</CardTitle>
              <CardDescription>
                Métricas e indicadores de performance da área comercial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Dashboards de analytics em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
