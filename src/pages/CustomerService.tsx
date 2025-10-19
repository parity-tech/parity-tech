import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, Activity, BarChart3 } from "lucide-react";
import ERPIntegrationSetup from "@/components/integrations/ERPIntegrationSetup";
import VOIPDashboard from "@/components/integrations/VOIPDashboard";

export default function CustomerService() {
  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Atendimento ao Cliente</h1>
        <p className="text-muted-foreground">
          Integrações e dashboards para suporte e atendimento
        </p>
      </header>

      <Tabs defaultValue="erp" className="w-full">
        <TabsList className="grid w-full grid-cols-3" role="tablist">
          <TabsTrigger value="erp" aria-label="Integração ERP">
            <Headphones className="h-4 w-4 mr-2" />
            ERP
          </TabsTrigger>
          <TabsTrigger value="voip" aria-label="Dashboard VOIP">
            <Activity className="h-4 w-4 mr-2" />
            VOIP
          </TabsTrigger>
          <TabsTrigger value="metrics" aria-label="Métricas de atendimento">
            <BarChart3 className="h-4 w-4 mr-2" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="erp" className="mt-6" role="tabpanel">
          <ERPIntegrationSetup />
        </TabsContent>

        <TabsContent value="voip" className="mt-6" role="tabpanel">
          <VOIPDashboard department="atendimento" />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6" role="tabpanel">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Atendimento</CardTitle>
              <CardDescription>
                Indicadores de performance e qualidade do atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Dashboards de métricas em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
