import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, MessageSquare } from "lucide-react";

interface FeedbackThreadsProps {
  userRole: string;
  profile: any;
}

export default function FeedbackThreads({ userRole, profile }: FeedbackThreadsProps) {
  const [threads, setThreads] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });

  useEffect(() => {
    loadThreads();

    const channel = supabase
      .channel('feedback-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback_threads'
        },
        () => loadThreads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadThreads = async () => {
    const { data, error } = await supabase
      .from('feedback_threads')
      .select(`
        *,
        departments(name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setThreads(data);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Preencha todos os campos");
      return;
    }

    const feedbackData: any = {
      title: formData.title,
      description: formData.description,
      department_id: profile?.department_id
    };

    const { error } = await supabase
      .from('feedback_threads')
      .insert(feedbackData);

    if (error) {
      toast.error("Erro ao criar feedback");
      console.error(error);
    } else {
      toast.success("Feedback criado com sucesso!");
      setIsDialogOpen(false);
      setFormData({ title: "", description: "" });
      loadThreads();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      aberto: { variant: "secondary", label: "Aberto" },
      em_analise: { variant: "default", label: "Em Análise" },
      implementado: { variant: "default", label: "Implementado", className: "bg-success" },
      rejeitado: { variant: "destructive", label: "Rejeitado" }
    };
    return variants[status] || variants.aberto;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Feedback e Sugestões</h3>
          <p className="text-muted-foreground">Compartilhe ideias e melhorias com a equipe</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Feedback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Feedback</DialogTitle>
              <DialogDescription>
                Compartilhe sua sugestão ou comentário
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do feedback..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva sua sugestão..."
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Enviar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {threads.map((thread) => {
          const statusBadge = getStatusBadge(thread.status);
          
          return (
            <Card key={thread.id} className="hover:shadow-md transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{thread.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {thread.departments?.name || "Geral"} • {new Date(thread.created_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge {...statusBadge}>
                    {statusBadge.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{thread.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {threads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum feedback ainda</h3>
            <p className="text-muted-foreground">
              Seja o primeiro a compartilhar uma sugestão!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}