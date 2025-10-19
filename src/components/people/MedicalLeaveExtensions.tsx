import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Calendar, FileText, Info } from "lucide-react";

interface Extension {
  id: string;
  extension_days: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  medical_certificates: {
    issue_date: string;
    start_date: string;
    end_date: string;
    days_count: number;
    doctor_name: string;
  };
  profiles: {
    full_name: string;
  };
}

export default function MedicalLeaveExtensions() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  const loadExtensions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('medical_leave_extensions')
        .select(`
          *,
          medical_certificates!medical_leave_extensions_certificate_id_fkey(
            issue_date,
            start_date,
            end_date,
            days_count,
            doctor_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar perfis dos usuários separadamente
      const extensionsWithProfiles = await Promise.all(
        (data || []).map(async (ext) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ext.user_id)
            .single();
          
          return {
            ...ext,
            profiles: profile || { full_name: 'Usuário' }
          };
        })
      );
      
      setExtensions(extensionsWithProfiles as Extension[]);
    } catch (error) {
      console.error('Error loading extensions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as extensões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      await loadExtensions();
      
      // Carregar role do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (roleData) {
          setUserRole(roleData.role);
        }
      }
    };

    loadData();

    // Realtime subscription
    const channel = supabase
      .channel('extensions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_leave_extensions'
        },
        () => {
          loadExtensions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadExtensions]);

  const handleApprove = useCallback(async (extensionId: string) => {
    setActionLoading(extensionId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('medical_leave_extensions')
        .update({
          status: 'aprovado',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', extensionId);

      if (error) throw error;

      toast({
        title: "Aprovado",
        description: "Extensão de licença médica aprovada com sucesso"
      });

      await loadExtensions();
    } catch (error) {
      console.error('Error approving extension:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a extensão",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  }, [loadExtensions, toast]);

  const handleReject = useCallback(async (extensionId: string) => {
    setActionLoading(extensionId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // TODO: Implementar modal para inserir motivo da rejeição
      const reason = "Não atende aos critérios estabelecidos";

      const { error } = await supabase
        .from('medical_leave_extensions')
        .update({
          status: 'rejeitado',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', extensionId);

      if (error) throw error;

      toast({
        title: "Rejeitado",
        description: "Extensão de licença médica rejeitada"
      });

      await loadExtensions();
    } catch (error) {
      console.error('Error rejecting extension:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a extensão",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  }, [loadExtensions, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="default" className="bg-green-600">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canManageExtensions = userRole === 'gestor' || userRole === 'admin';

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Carregando extensões">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Programa de Licença Médica Estendida</AlertTitle>
        <AlertDescription>
          Atestados médicos com 3 ou mais dias de afastamento são elegíveis para +1 dia de licença, 
          sujeito à aprovação do RH.
        </AlertDescription>
      </Alert>

      {extensions.length === 0 ? (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Nenhuma solicitação</AlertTitle>
          <AlertDescription>
            Não há solicitações de extensão de licença médica no momento.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4" role="list" aria-label="Lista de extensões de licença médica">
          {extensions.map((extension) => (
            <Card key={extension.id} role="article">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {extension.profiles.full_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Atestado de {extension.medical_certificates.days_count} dias 
                      ({new Date(extension.medical_certificates.start_date).toLocaleDateString('pt-BR')} 
                      - {new Date(extension.medical_certificates.end_date).toLocaleDateString('pt-BR')})
                    </CardDescription>
                    {extension.medical_certificates.doctor_name && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Dr(a). {extension.medical_certificates.doctor_name}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(extension.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={extension.created_at}>
                      Solicitado em {new Date(extension.created_at).toLocaleDateString('pt-BR')}
                    </time>
                  </div>

                  {extension.status === 'pendente' && canManageExtensions && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(extension.id)}
                        disabled={actionLoading === extension.id}
                        aria-label="Aprovar extensão"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(extension.id)}
                        disabled={actionLoading === extension.id}
                        aria-label="Rejeitar extensão"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  )}

                  {extension.status === 'aprovado' && extension.approved_at && (
                    <p className="text-sm text-green-600">
                      Aprovado em {new Date(extension.approved_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}

                  {extension.status === 'rejeitado' && (
                    <div className="text-sm text-destructive">
                      <p>Rejeitado em {extension.approved_at ? new Date(extension.approved_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
                      {extension.rejection_reason && (
                        <p className="text-xs mt-1">Motivo: {extension.rejection_reason}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
