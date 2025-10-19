import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  PawPrint, 
  Baby, 
  Plus, 
  Upload, 
  Heart,
  GraduationCap,
  Smile,
  Info,
  TrendingUp,
  Gift
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Dependent {
  id: string;
  dependent_type: 'pet' | 'filho';
  name: string;
  birth_date: string | null;
  species: string | null;
  cpf: string | null;
  photo_url: string | null;
  has_documents: boolean;
  created_at: string;
}

interface DependentStats {
  total: number;
  pets: number;
  filhos: number;
}

export default function BenefitsManagement() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [stats, setStats] = useState<DependentStats>({ total: 0, pets: 0, filhos: 0 });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    dependent_type: 'pet' as 'pet' | 'filho',
    name: '',
    birth_date: '',
    species: '',
    cpf: ''
  });
  const { toast } = useToast();

  const loadDependents = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dependents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDependents(data || []);
      
      // Calcular estatísticas
      const pets = data?.filter(d => d.dependent_type === 'pet').length || 0;
      const filhos = data?.filter(d => d.dependent_type === 'filho').length || 0;
      setStats({
        total: (data?.length || 0),
        pets,
        filhos
      });
    } catch (error) {
      console.error('Error loading dependents:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dependentes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDependents();
  }, [loadDependents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { error } = await supabase
        .from('dependents')
        .insert({
          company_id: profile.company_id,
          user_id: user.id,
          dependent_type: formData.dependent_type,
          name: formData.name,
          birth_date: formData.birth_date || null,
          species: formData.dependent_type === 'pet' ? formData.species : null,
          cpf: formData.dependent_type === 'filho' ? formData.cpf : null,
          has_documents: false
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${formData.dependent_type === 'pet' ? 'Pet' : 'Filho(a)'} cadastrado com sucesso`
      });

      setIsDialogOpen(false);
      setFormData({
        dependent_type: 'pet',
        name: '',
        birth_date: '',
        species: '',
        cpf: ''
      });
      
      await loadDependents();
    } catch (error) {
      console.error('Error adding dependent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o dependente",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Carregando benefícios">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard de Dependentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Dependentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pets Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <PawPrint className="h-8 w-8 text-accent" />
              <p className="text-3xl font-bold">{stats.pets}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filhos Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Baby className="h-8 w-8 text-secondary" />
              <p className="text-3xl font-bold">{stats.filhos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Benefícios */}
      <Tabs defaultValue="dependents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dependents">Meus Dependentes</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* Tab: Dependentes */}
        <TabsContent value="dependents" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Dependentes Cadastrados</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Dependente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Dependente</DialogTitle>
                  <DialogDescription>
                    Cadastre pets ou filhos para ter acesso aos benefícios
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="dependent_type">Tipo</Label>
                    <Select
                      value={formData.dependent_type}
                      onValueChange={(value: 'pet' | 'filho') => 
                        setFormData({ ...formData, dependent_type: value })
                      }
                    >
                      <SelectTrigger id="dependent_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pet">Pet</SelectItem>
                        <SelectItem value="filho">Filho(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  {formData.dependent_type === 'pet' && (
                    <div>
                      <Label htmlFor="species">Espécie</Label>
                      <Input
                        id="species"
                        value={formData.species}
                        onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                        placeholder="Ex: Cachorro, Gato"
                        required
                      />
                    </div>
                  )}

                  {formData.dependent_type === 'filho' && (
                    <>
                      <div>
                        <Label htmlFor="birth_date">Data de Nascimento</Label>
                        <Input
                          id="birth_date"
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF (Opcional)</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </>
                  )}

                  <Alert>
                    <Upload className="h-4 w-4" />
                    <AlertDescription>
                      Após o cadastro, você precisará enviar documentos comprobatórios
                      (certidão de nascimento ou comprovante de vacinação para pets)
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" className="w-full">
                    Cadastrar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {dependents.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Nenhum dependente cadastrado</AlertTitle>
              <AlertDescription>
                Cadastre seus pets ou filhos para ter acesso aos benefícios disponíveis
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dependents.map((dependent) => (
                <Card key={dependent.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {dependent.dependent_type === 'pet' ? (
                            <PawPrint className="h-5 w-5 text-accent" />
                          ) : (
                            <Baby className="h-5 w-5 text-secondary" />
                          )}
                          {dependent.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {dependent.dependent_type === 'pet' && dependent.species && (
                            <span>{dependent.species}</span>
                          )}
                          {dependent.dependent_type === 'filho' && dependent.birth_date && (
                            <span>Nascimento: {new Date(dependent.birth_date).toLocaleDateString('pt-BR')}</span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={dependent.has_documents ? "default" : "secondary"}>
                        {dependent.has_documents ? "Documentado" : "Pendente"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!dependent.has_documents && (
                      <Button size="sm" variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Documentos
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Vouchers (Placeholder) */}
        <TabsContent value="vouchers" className="mt-6">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Gift className="h-8 w-8 text-accent" />
              </div>
              <CardTitle>Vouchers e Descontos</CardTitle>
              <CardDescription>
                Estamos negociando parcerias para oferecer os melhores benefícios para você e sua família!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button disabled className="mb-2">
                Em Breve
              </Button>
              <p className="text-xs text-muted-foreground">
                Logo você poderá resgatar vouchers e descontos exclusivos
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Categorias */}
        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-2">
                  <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Saúde</CardTitle>
                <CardDescription>
                  Planos de saúde, consultas veterinárias, clínicas pediátricas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Em Breve</Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                  <Smile className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Lazer</CardTitle>
                <CardDescription>
                  Pet shops, parques, cinemas, eventos e atividades recreativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Em Breve</Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
                  <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Educação</CardTitle>
                <CardDescription>
                  Escolas, cursos, creches e programas educacionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Em Breve</Badge>
              </CardContent>
            </Card>
          </div>

          <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Parceiros em Negociação</AlertTitle>
            <AlertDescription>
              Estamos fechando parcerias com fornecedores de qualidade para oferecer 
              os melhores benefícios nas categorias de Saúde, Lazer e Educação. 
              Cadastre seus dependentes agora e seja notificado quando os benefícios estiverem disponíveis!
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
