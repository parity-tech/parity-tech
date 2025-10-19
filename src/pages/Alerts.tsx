import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  Clock, 
  Download, 
  DollarSign, 
  FileText,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlertData {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  is_active: boolean;
  created_at: string;
  conditions: any;
  risk_score?: number;
  risk_level?: string;
  alert_events: Array<{
    id: string;
    acknowledged: boolean;
    acknowledged_at: string | null;
    acknowledged_by: string | null;
    risk_score?: number;
    risk_level?: string;
    ai_suggested_actions?: string;
  }>;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Memoized para evitar re-renders desnecessários
  const loadAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          alert_events(
            id,
            acknowledged,
            acknowledged_at,
            acknowledged_by,
            risk_score,
            risk_level,
            ai_suggested_actions
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alertas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAlerts();

    // Realtime subscription para updates automáticos
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAlerts]);

  const acknowledgeAlert = useCallback(async (alertId: string, eventId: string) => {
    setActionLoading(eventId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('alert_events')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id
        })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Alerta reconhecido com sucesso"
      });

      await loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reconhecer o alerta",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  }, [loadAlerts, toast]);

  const processRiskAlert = useCallback(async (alertEventId: string) => {
    setActionLoading(alertEventId);
    try {
      const { data, error } = await supabase.functions.invoke('process-risk-alert', {
        body: { alertEventId }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data.message || "Alerta processado com cálculo de risco",
      });

      await loadAlerts();
    } catch (error) {
      console.error('Error processing risk alert:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o alerta",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  }, [loadAlerts, toast]);

  const deactivateAlert = useCallback(async (alertId: string) => {
    setActionLoading(alertId);
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Alerta desativado com sucesso"
      });

      await loadAlerts();
    } catch (error) {
      console.error('Error deactivating alert:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o alerta",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  }, [loadAlerts, toast]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'time_log_recurrence':
        return <Clock className="h-5 w-5" />;
      case 'download_risk':
        return <Download className="h-5 w-5" />;
      case 'overtime_alert':
        return <Clock className="h-5 w-5" />;
      case 'reimbursement_fraud':
        return <DollarSign className="h-5 w-5" />;
      case 'goal_underperformance':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const getRiskLevelColor = (riskLevel: string | undefined) => {
    if (!riskLevel) return 'secondary';
    switch (riskLevel) {
      case 'grave':
        return 'destructive';
      case 'alto':
        return 'destructive';
      case 'medio':
        return 'default';
      case 'baixo':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRiskLevelLabel = (riskLevel: string | undefined) => {
    if (!riskLevel) return 'N/A';
    switch (riskLevel) {
      case 'grave':
        return 'Grave';
      case 'alto':
        return 'Alto';
      case 'medio':
        return 'Médio';
      case 'baixo':
        return 'Baixo';
      default:
        return riskLevel;
    }
  };

  const getRiskScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-muted-foreground';
    if (score >= 81) return 'text-destructive';
    if (score >= 61) return 'text-orange-600';
    if (score >= 31) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Memoização para evitar re-cálculos
  const alertsByType = useMemo(() => ({
    time_log: alerts.filter(a => a.type === 'time_log_recurrence'),
    download: alerts.filter(a => a.type === 'download_risk'),
    overtime: alerts.filter(a => a.type === 'overtime_alert'),
    reimbursement: alerts.filter(a => a.type === 'reimbursement_fraud'),
    goals: alerts.filter(a => a.type === 'goal_underperformance')
  }), [alerts]);

  const alertsCount = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter(a => a.is_active).length,
    time_log: alertsByType.time_log.length,
    download: alertsByType.download.length,
    overtime: alertsByType.overtime.length,
    reimbursement: alertsByType.reimbursement.length,
    goals: alertsByType.goals.length
  }), [alerts, alertsByType]);

  const renderAlertCard = useCallback((alert: AlertData) => {
    const latestEvent = alert.alert_events?.[0];
    const isAcknowledged = latestEvent?.acknowledged;
    const isProcessing = actionLoading === alert.id || actionLoading === latestEvent?.id;

    return (
      <Card key={alert.id} className="mb-4" role="article" aria-labelledby={`alert-title-${alert.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1" aria-hidden="true">{getAlertIcon(alert.type)}</div>
              <div>
                <CardTitle id={`alert-title-${alert.id}`} className="text-lg">
                  {alert.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {alert.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={getPriorityColor(alert.priority)} aria-label={`Prioridade: ${getPriorityLabel(alert.priority)}`}>
                {getPriorityLabel(alert.priority)}
              </Badge>
              {latestEvent?.risk_level && (
                <Badge variant={getRiskLevelColor(latestEvent.risk_level)} aria-label={`Risco: ${getRiskLevelLabel(latestEvent.risk_level)}`}>
                  Risco: {getRiskLevelLabel(latestEvent.risk_level)}
                </Badge>
              )}
              {latestEvent?.risk_score !== undefined && (
                <Badge variant="outline" className={getRiskScoreColor(latestEvent.risk_score)} aria-label={`Score: ${latestEvent.risk_score}/100`}>
                  Score: {latestEvent.risk_score}/100
                </Badge>
              )}
              {alert.is_active ? (
                <Badge variant="outline" aria-label="Status: Ativo">Ativo</Badge>
              ) : (
                <Badge variant="secondary" aria-label="Status: Inativo">Inativo</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {latestEvent?.ai_suggested_actions && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sugestões de Ações (IA Jurídica)</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">
                {latestEvent.ai_suggested_actions}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-muted-foreground">
              <time dateTime={alert.created_at}>
                Criado em: {new Date(alert.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </time>
            </p>
            <div className="flex gap-2">
              {alert.is_active && latestEvent && !latestEvent.risk_score && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => processRiskAlert(latestEvent.id)}
                  disabled={isProcessing}
                  aria-label="Processar e calcular risco"
                >
                  {isProcessing && actionLoading === latestEvent.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  Processar Risco
                </Button>
              )}
              {alert.is_active && latestEvent && !isAcknowledged && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledgeAlert(alert.id, latestEvent.id)}
                  disabled={isProcessing}
                  aria-label="Reconhecer alerta"
                >
                  {isProcessing && actionLoading === latestEvent.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Reconhecer
                </Button>
              )}
              {alert.is_active && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deactivateAlert(alert.id)}
                  disabled={isProcessing}
                  aria-label="Desativar alerta"
                >
                  {isProcessing && actionLoading === alert.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Desativar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [acknowledgeAlert, deactivateAlert, processRiskAlert, actionLoading, getAlertIcon, getPriorityColor, getPriorityLabel, getRiskLevelColor, getRiskLevelLabel, getRiskScoreColor]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Alertas de Risco</h1>
        <div className="space-y-4" role="status" aria-label="Carregando alertas">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-4">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <span className="sr-only">Carregando alertas...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Alertas de Risco</h1>
        <p className="text-muted-foreground">
          {alertsCount.active} alertas ativos de {alertsCount.total} totais
        </p>
      </header>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6" role="tablist" aria-label="Categorias de alertas">
          <TabsTrigger value="all" aria-label={`Todos os alertas (${alertsCount.total})`}>
            Todos ({alertsCount.total})
          </TabsTrigger>
          <TabsTrigger value="time_log" aria-label={`Alertas de ponto (${alertsCount.time_log})`}>
            Ponto ({alertsCount.time_log})
          </TabsTrigger>
          <TabsTrigger value="download" aria-label={`Alertas de downloads (${alertsCount.download})`}>
            Downloads ({alertsCount.download})
          </TabsTrigger>
          <TabsTrigger value="overtime" aria-label={`Alertas de horas extras (${alertsCount.overtime})`}>
            Horas ({alertsCount.overtime})
          </TabsTrigger>
          <TabsTrigger value="reimbursement" aria-label={`Alertas de reembolsos (${alertsCount.reimbursement})`}>
            Reembolsos ({alertsCount.reimbursement})
          </TabsTrigger>
          <TabsTrigger value="goals" aria-label={`Alertas de metas (${alertsCount.goals})`}>
            Metas ({alertsCount.goals})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {alerts.length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum alerta</AlertTitle>
              <AlertDescription>
                Não há alertas registrados no momento.
              </AlertDescription>
            </Alert>
          ) : (
            alerts.map(renderAlertCard)
          )}
        </TabsContent>

        <TabsContent value="time_log" className="mt-6" role="tabpanel">
          {alertsByType.time_log.length === 0 ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Nenhum alerta de ponto</AlertTitle>
              <AlertDescription>
                Não há alertas de ponto eletrônico no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div role="list" aria-label="Alertas de ponto eletrônico">
              {alertsByType.time_log.map(renderAlertCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="download" className="mt-6" role="tabpanel">
          {alertsByType.download.length === 0 ? (
            <Alert>
              <Download className="h-4 w-4" />
              <AlertTitle>Nenhum alerta de download</AlertTitle>
              <AlertDescription>
                Não há alertas de downloads com risco no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div role="list" aria-label="Alertas de downloads">
              {alertsByType.download.map(renderAlertCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overtime" className="mt-6" role="tabpanel">
          {alertsByType.overtime.length === 0 ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Nenhum alerta de horas extras</AlertTitle>
              <AlertDescription>
                Não há alertas de horas extras no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div role="list" aria-label="Alertas de horas extras">
              {alertsByType.overtime.map(renderAlertCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reimbursement" className="mt-6" role="tabpanel">
          {alertsByType.reimbursement.length === 0 ? (
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertTitle>Nenhum alerta de reembolso</AlertTitle>
              <AlertDescription>
                Não há alertas de possíveis fraudes em reembolsos no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div role="list" aria-label="Alertas de reembolsos">
              {alertsByType.reimbursement.map(renderAlertCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-6" role="tabpanel">
          {alertsByType.goals.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Nenhum alerta de metas</AlertTitle>
              <AlertDescription>
                Não há alertas de metas abaixo do esperado no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div role="list" aria-label="Alertas de metas">
              {alertsByType.goals.map(renderAlertCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
