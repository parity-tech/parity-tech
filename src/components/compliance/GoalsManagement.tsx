import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Target } from "lucide-react";

interface GoalsManagementProps {
  userRole: string;
  selectedDepartmentId: string | null;
}

interface Goal {
  id: string;
  name: string;
  description: string;
  metric_type: string;
  target_value: number;
  period: string;
  department_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  departments?: { name: string };
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

export default function GoalsManagement({ userRole, selectedDepartmentId }: GoalsManagementProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    metric_type: "tickets_resolved",
    target_value: "",
    period: "monthly",
    department_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: ""
  });

  const canManage = userRole === 'admin' || userRole === 'gestor';

  // Dados mockup
  const mockGoals = [
    {
      id: '1',
      name: 'Implementar Novo Sistema de CRM',
      description: 'Adoção e configuração do novo sistema para o time de vendas',
      metric_type: 'tasks_completed',
      target_value: 100,
      period: 'monthly',
      department_id: '1',
      start_date: '2024-07-01',
      end_date: '2024-07-15',
      is_active: true,
      departments: { name: 'Vendas' }
    },
    {
      id: '2',
      name: 'Treinamento de Segurança de Dados',
      description: 'Capacitar 90% da equipe nas novas políticas de segurança da informação',
      metric_type: 'meetings_attended',
      target_value: 50,
      period: 'quarterly',
      department_id: '2',
      start_date: '2024-06-01',
      end_date: '2024-08-30',
      is_active: true,
      departments: { name: 'Tecnologia' }
    },
    {
      id: '3',
      name: 'Reduzir Tempo de Resposta ao Cliente',
      description: 'Diminuir o tempo médio de primeira resposta para menos de 1 hora',
      metric_type: 'tickets_resolved',
      target_value: 200,
      period: 'monthly',
      department_id: '3',
      start_date: '2024-07-01',
      end_date: '2024-08-01',
      is_active: true,
      departments: { name: 'Suporte' }
    }
  ];

  const mockDepartments = [
    { id: '1', name: 'Vendas', is_active: true },
    { id: '2', name: 'Tecnologia', is_active: true },
    { id: '3', name: 'Suporte', is_active: true },
    { id: '4', name: 'RH', is_active: true },
    { id: '5', name: 'Financeiro', is_active: true }
  ];

  useEffect(() => {
    loadGoals();
    loadDepartments();
  }, []);

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        departments(name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setGoals(data);
    } else {
      // Usar dados mockup se não houver dados no banco
      setGoals(mockGoals);
    }
  };

  const loadDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data && data.length > 0) {
      setDepartments(data);
    } else {
      // Usar dados mockup se não houver dados no banco
      setDepartments(mockDepartments);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.target_value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const goalData: any = {
      ...formData,
      target_value: parseFloat(formData.target_value),
      department_id: formData.department_id || null,
      end_date: formData.end_date || null
    };

    if (editingGoal) {
      const { error } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', editingGoal.id);

      if (error) {
        toast.error("Erro ao atualizar meta");
        console.error(error);
      } else {
        toast.success("Meta atualizada com sucesso!");
        setIsDialogOpen(false);
        loadGoals();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('goals')
        .insert(goalData);

      if (error) {
        toast.error("Erro ao criar meta");
        console.error(error);
      } else {
        toast.success("Meta criada com sucesso!");
        setIsDialogOpen(false);
        loadGoals();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir meta");
      console.error(error);
    } else {
      toast.success("Meta excluída com sucesso!");
      loadGoals();
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || "",
      metric_type: goal.metric_type,
      target_value: goal.target_value.toString(),
      period: goal.period,
      department_id: goal.department_id || "",
      start_date: goal.start_date,
      end_date: goal.end_date || ""
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingGoal(null);
    setFormData({
      name: "",
      description: "",
      metric_type: "tickets_resolved",
      target_value: "",
      period: "monthly",
      department_id: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: ""
    });
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
      quarterly: "Trimestral",
      yearly: "Anual"
    };
    return labels[period] || period;
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      tickets_resolved: "Tickets Resolvidos",
      calls_made: "Ligações Realizadas",
      emails_sent: "E-mails Enviados",
      meetings_attended: "Reuniões Participadas",
      tasks_completed: "Tarefas Concluídas",
      custom: "Personalizado"
    };
    return labels[metric] || metric;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gerenciamento de Metas</h3>
          <p className="text-muted-foreground">Configure metas por setor e monitore atingimentos</p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
                <DialogDescription>
                  Configure metas configuráveis por setor e período
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Meta *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Tickets Resolvidos - Vendas"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva a meta..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="metric_type">Tipo de Métrica *</Label>
                    <Select
                      value={formData.metric_type}
                      onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tickets_resolved">Tickets Resolvidos</SelectItem>
                        <SelectItem value="calls_made">Ligações Realizadas</SelectItem>
                        <SelectItem value="emails_sent">E-mails Enviados</SelectItem>
                        <SelectItem value="meetings_attended">Reuniões</SelectItem>
                        <SelectItem value="tasks_completed">Tarefas Concluídas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="target_value">Meta (Valor) *</Label>
                    <Input
                      id="target_value"
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder="Ex: 100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="period">Período *</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) => setFormData({ ...formData, period: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Setor (Opcional)</Label>
                    <Select
                      value={formData.department_id}
                      onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os setores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os setores</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Data Início *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">Data Fim (Opcional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingGoal ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals
          .filter((goal) => !selectedDepartmentId || goal.department_id === selectedDepartmentId)
          .map((goal) => (
          <Card key={goal.id} className="hover:shadow-lg transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {goal.departments?.name || "Geral"}
                    </CardDescription>
                  </div>
                </div>
                {goal.is_active ? (
                  <Badge variant="default" className="bg-success">Ativa</Badge>
                ) : (
                  <Badge variant="secondary">Inativa</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Métrica:</span>
                  <Badge variant="outline">{getMetricLabel(goal.metric_type)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meta:</span>
                  <span className="font-semibold">{goal.target_value}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Período:</span>
                  <Badge>{getPeriodLabel(goal.period)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Início:</span>
                  <span>{new Date(goal.start_date).toLocaleDateString('pt-BR')}</span>
                </div>
                {canManage && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(goal)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {goals.filter((goal) => !selectedDepartmentId || goal.department_id === selectedDepartmentId).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedDepartmentId ? "Nenhuma meta encontrada para este setor" : "Nenhuma meta cadastrada"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedDepartmentId
                ? "Tente selecionar outro setor ou limpar o filtro."
                : canManage
                ? "Crie sua primeira meta para começar a monitorar o desempenho."
                : "Aguarde que os gestores configurem as metas."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}