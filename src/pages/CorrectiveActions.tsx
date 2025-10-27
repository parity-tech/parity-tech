import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";

interface CorrectiveAction {
  id: string;
  user_id: string;
  alert_id: string;
  document_content: string;
  occurrence_date: string;
  occurrence_type: string;
  status: string;
  created_at: string;
  delivered_at?: string;
  signed_at?: string;
  profiles?: any;
  departments?: any;
}

export default function CorrectiveActions() {
  const { loading: authLoading, company, userRole, handleLogout } = useAuth();
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadActions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('corrective_actions')
        .select(`
          *,
          profiles(full_name),
          departments(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error('Error loading corrective actions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as ações corretivas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadActions();

    const channel = supabase
      .channel('corrective-actions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'corrective_actions'
        },
        () => {
          loadActions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadActions]);

  const updateStatus = useCallback(async (actionId: string, newStatus: 'entregue' | 'assinado') => {
    setActionLoading(actionId);
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'entregue') {
        updateData.delivered_at = new Date().toISOString();
      } else if (newStatus === 'assinado') {
        updateData.signed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('corrective_actions')
        .update(updateData)
        .eq('id', actionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Ação corretiva marcada como ${newStatus}`
      });

      await loadActions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  }, [loadActions, toast]);

  const downloadDocument = useCallback((action: CorrectiveAction) => {
    const element = document.createElement('a');
    const file = new Blob([action.document_content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `acao_corretiva_${action.profiles?.full_name || 'colaborador'}_${new Date(action.occurrence_date).toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assinado':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Assinado</Badge>;
      case 'entregue':
        return <Badge variant="default" className="bg-blue-600"><FileText className="h-3 w-3 mr-1" />Entregue</Badge>;
      case 'pendente':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <FileText className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
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
          <h2 className="text-3xl font-bold mb-2">Ações Corretivas</h2>
          <p className="text-muted-foreground">
            Documentos gerados automaticamente para gestão de riscos trabalhistas
          </p>
        </div>

      {actions.length === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nenhuma ação corretiva encontrada</AlertTitle>
          <AlertDescription>
            Ações corretivas serão geradas automaticamente quando alertas de médio a alto risco forem processados.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {actions.map((action) => (
            <Card key={action.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {action.profiles?.full_name || 'Colaborador não identificado'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {action.departments?.name || 'Departamento não especificado'} • {action.occurrence_type}
                    </CardDescription>
                  </div>
                  {getStatusBadge(action.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm whitespace-pre-wrap line-clamp-4">
                      {action.document_content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Data da Ocorrência:</strong> {new Date(action.occurrence_date).toLocaleDateString('pt-BR')}
                      </p>
                      <p>
                        <strong>Criado em:</strong> {new Date(action.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {action.delivered_at && (
                        <p>
                          <strong>Entregue em:</strong> {new Date(action.delivered_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {action.signed_at && (
                        <p>
                          <strong>Assinado em:</strong> {new Date(action.signed_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(action)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      
                      {action.status === 'pendente' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateStatus(action.id, 'entregue')}
                          disabled={actionLoading === action.id}
                        >
                          {actionLoading === action.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          Marcar como Entregue
                        </Button>
                      )}
                      
                      {action.status === 'entregue' && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(action.id, 'assinado')}
                          disabled={actionLoading === action.id}
                        >
                          {actionLoading === action.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          Marcar como Assinado
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
