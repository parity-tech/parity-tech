import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Clock, Download, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VOIPDashboardProps {
  department: string;
}

export default function VOIPDashboard({ department }: VOIPDashboardProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["voip-stats", department],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, department_id")
        .eq("id", userData.user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      // Buscar atividades de telefonia dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activities } = await supabase
        .from("activity_events")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("activity_type", "call")
        .gte("timestamp", thirtyDaysAgo.toISOString());

      // Calcular estatísticas
      const totalCalls = activities?.length || 0;
      const totalDuration = activities?.reduce((sum, act) => sum + (act.duration_seconds || 0), 0) || 0;
      const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
      const callsPerDay = totalCalls / 30;

      return {
        totalCalls,
        avgDuration,
        callsPerDay,
        totalDuration,
      };
    },
  });

  if (isLoading) {
    return (
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
    );
  }

  const statCards = [
    {
      title: "Total de Chamadas",
      value: stats?.totalCalls.toLocaleString() || "0",
      description: "Últimos 30 dias",
      icon: Phone,
      color: "text-primary",
    },
    {
      title: "Chamadas/Dia",
      value: stats?.callsPerDay.toFixed(1) || "0",
      description: "Média diária",
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Duração Média",
      value: `${Math.floor((stats?.avgDuration || 0) / 60)}m`,
      description: "Por chamada",
      icon: Clock,
      color: "text-success",
    },
    {
      title: "Tempo Total",
      value: `${Math.floor((stats?.totalDuration || 0) / 3600)}h`,
      description: "Em chamadas",
      icon: Download,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Configuração VOIP</CardTitle>
          <CardDescription>
            Configure a integração com seu sistema de telefonia para rastreamento automático de chamadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configuração de integração VOIP em desenvolvimento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
