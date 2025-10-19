import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  Download, 
  DollarSign, 
  FileText,
  CheckCircle2,
  XCircle
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
  alert_events: Array<{
    id: string;
    acknowledged: boolean;
    acknowledged_at: string | null;
    acknowledged_by: string | null;
  }>;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          alert_events(
            id,
            acknowledged,
            acknowledged_at,
            acknowledged_by
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
  };

  const acknowledgeAlert = async (alertId: string, eventId: string) => {
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
        description: "Alerta reconhecido"
      });

      loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reconhecer o alerta",
        variant: "destructive"
      });
    }
  };

  const deactivateAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Alerta desativado"
      });

      loadAlerts();
    } catch (error) {
      console.error('Error deactivating alert:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o alerta",
        variant: "destructive"
      });
    }
  };

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

  const filterAlertsByType = (type: string) => {
    return alerts.filter(alert => alert.type === type);
  };

  const renderAlertCard = (alert: AlertData) => {
    const latestEvent = alert.alert_events?.[0];
    const isAcknowledged = latestEvent?.acknowledged;

    return (
      <Card key={alert.id} className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getAlertIcon(alert.type)}</div>
              <div>
                <CardTitle className="text-lg">{alert.title}</CardTitle>
                <CardDescription className="mt-1">
                  {alert.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={getPriorityColor(alert.priority)}>
                {getPriorityLabel(alert.priority)}
              </Badge>
              {alert.is_active ? (
                <Badge variant="outline">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Criado em: {new Date(alert.created_at).toLocaleDateString('pt-BR')}
            </p>
            <div className="flex gap-2">
              {alert.is_active && latestEvent && !isAcknowledged && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledgeAlert(alert.id, latestEvent.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Reconhecer
                </Button>
              )}
              {alert.is_active && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deactivateAlert(alert.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Desativar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Alertas de Risco</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Alertas de Risco</h1>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="time_log">Ponto</TabsTrigger>
          <TabsTrigger value="download">Downloads</TabsTrigger>
          <TabsTrigger value="overtime">Horas Extras</TabsTrigger>
          <TabsTrigger value="reimbursement">Reembolsos</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
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

        <TabsContent value="time_log" className="mt-6">
          {filterAlertsByType('time_log_recurrence').length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum alerta de ponto</AlertTitle>
              <AlertDescription>
                Não há alertas de ponto eletrônico no momento.
              </AlertDescription>
            </Alert>
          ) : (
            filterAlertsByType('time_log_recurrence').map(renderAlertCard)
          )}
        </TabsContent>

        <TabsContent value="download" className="mt-6">
          {filterAlertsByType('download_risk').length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum alerta de download</AlertTitle>
              <AlertDescription>
                Não há alertas de downloads com risco no momento.
              </AlertDescription>
            </Alert>
          ) : (
            filterAlertsByType('download_risk').map(renderAlertCard)
          )}
        </TabsContent>

        <TabsContent value="overtime" className="mt-6">
          {filterAlertsByType('overtime_alert').length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum alerta de horas extras</AlertTitle>
              <AlertDescription>
                Não há alertas de horas extras no momento.
              </AlertDescription>
            </Alert>
          ) : (
            filterAlertsByType('overtime_alert').map(renderAlertCard)
          )}
        </TabsContent>

        <TabsContent value="reimbursement" className="mt-6">
          {filterAlertsByType('reimbursement_fraud').length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum alerta de reembolso</AlertTitle>
              <AlertDescription>
                Não há alertas de possíveis fraudes em reembolsos no momento.
              </AlertDescription>
            </Alert>
          ) : (
            filterAlertsByType('reimbursement_fraud').map(renderAlertCard)
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          {filterAlertsByType('goal_underperformance').length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum alerta de metas</AlertTitle>
              <AlertDescription>
                Não há alertas de metas abaixo do esperado no momento.
              </AlertDescription>
            </Alert>
          ) : (
            filterAlertsByType('goal_underperformance').map(renderAlertCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
