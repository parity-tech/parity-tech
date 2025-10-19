import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Database, TrendingUp, Settings } from "lucide-react";
import BIIntegration from "@/components/integrations/BIIntegration";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import WebhookConfiguration from "@/components/integrations/WebhookConfiguration";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Analytics & Business Intelligence</h1>
          <p className="text-muted-foreground">
            Integre com Power BI, Looker e visualize datasets importados
          </p>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4" role="tablist">
            <TabsTrigger value="dashboard" aria-label="Dashboard">
              <TrendingUp className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="bi-integration" aria-label="Integração BI">
              <Database className="h-4 w-4 mr-2" />
              Integração BI
            </TabsTrigger>
            <TabsTrigger value="datasets" aria-label="Datasets">
              <BarChart3 className="h-4 w-4 mr-2" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="webhooks" aria-label="Webhooks">
              <Settings className="h-4 w-4 mr-2" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6" role="tabpanel">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="bi-integration" className="mt-6" role="tabpanel">
            <BIIntegration />
          </TabsContent>

          <TabsContent value="datasets" className="mt-6" role="tabpanel">
            <Card>
              <CardHeader>
                <CardTitle>Datasets Importados</CardTitle>
                <CardDescription>
                  Visualize e gerencie datasets importados de Power BI e Looker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gerenciador de datasets em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-6" role="tabpanel">
            <WebhookConfiguration integrationType="outro" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
