import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, Activity, TrendingUp, Clock, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Buscar estatísticas gerais
      const { data: activities } = await supabase
        .from("activity_events")
        .select("*")
        .eq("company_id", profile.company_id)
        .gte("timestamp", thirtyDaysAgo.toISOString());

      const { data: integrations } = await supabase
        .from("api_integrations")
        .select("*")
        .eq("company_id", profile.company_id);

      const { data: downloads } = await supabase
        .from("download_logs")
        .select("*")
        .eq("company_id", profile.company_id)
        .gte("download_timestamp", thirtyDaysAgo.toISOString());

      const activeIntegrations = integrations?.filter(i => i.status === "ativo").length || 0;
      const totalActivities = activities?.length || 0;
      const totalDownloads = downloads?.length || 0;
      
      // Atividades por tipo
      const activitiesByType = activities?.reduce((acc, act) => {
        acc[act.activity_type] = (acc[act.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        activeIntegrations,
        totalActivities,
        totalDownloads,
        activitiesByType,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: "Integrações Ativas",
      value: stats?.activeIntegrations || 0,
      description: "Sistemas conectados",
      icon: Activity,
      color: "text-primary",
    },
    {
      title: "Atividades Registradas",
      value: stats?.totalActivities || 0,
      description: "Últimos 30 dias",
      icon: BarChart3,
      color: "text-accent",
    },
    {
      title: "Downloads Monitorados",
      value: stats?.totalDownloads || 0,
      description: "Últimos 30 dias",
      icon: Download,
      color: "text-success",
    },
    {
      title: "Taxa de Crescimento",
      value: "+12%",
      description: "vs. mês anterior",
      icon: TrendingUp,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividades por Tipo</CardTitle>
            <CardDescription>Distribuição de eventos nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.activitiesByType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{type}</span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrações Recentes</CardTitle>
            <CardDescription>Últimas sincronizações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Sincronização CRM</p>
                  <p className="text-xs text-muted-foreground">Há 5 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Importação ERP</p>
                  <p className="text-xs text-muted-foreground">Há 23 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Webhook VOIP</p>
                  <p className="text-xs text-muted-foreground">Há 1 hora</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Tendências de Uso</CardTitle>
          <CardDescription>Visualização de dados ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Gráficos interativos em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
