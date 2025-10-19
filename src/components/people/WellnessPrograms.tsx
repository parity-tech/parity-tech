import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, Gift, Sparkles, Info, Target, Calendar } from "lucide-react";

interface PointsBalance {
  total_points: number;
  available_points: number;
  lifetime_points: number;
  last_activity_at: string | null;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  points_reward: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function WellnessPrograms() {
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar saldo de pontos
      const { data: balanceData, error: balanceError } = await supabase
        .from('wellness_points_balance')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError) throw balanceError;
      setBalance(balanceData);

      // Carregar desafios ativos
      const { data: challengesData, error: challengesError } = await supabase
        .from('wellness_challenges')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);
    } catch (error) {
      console.error('Error loading wellness data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de bem-estar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      fitness: 'Fitness',
      saude_mental: 'Saúde Mental',
      nutricao: 'Nutrição',
      habitos_saudaveis: 'Hábitos Saudáveis'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string): "default" | "secondary" | "outline" => {
    const colors: Record<string, "default" | "secondary" | "outline"> = {
      fitness: 'default',
      saude_mental: 'secondary',
      nutricao: 'outline',
      habitos_saudaveis: 'outline'
    };
    return colors[category] || 'default';
  };

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Carregando programas de bem-estar">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card de Pontos */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Seus Pontos de Bem-estar
          </CardTitle>
          <CardDescription>
            Acumule pontos participando de desafios e atividades saudáveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {balance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Pontos Disponíveis</p>
                <p className="text-3xl font-bold text-primary">{balance.available_points}</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Pontos Totais</p>
                <p className="text-3xl font-bold">{balance.total_points}</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Pontos Históricos</p>
                <p className="text-3xl font-bold text-accent">{balance.lifetime_points}</p>
              </div>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Bem-vindo ao Programa de Bem-estar!</AlertTitle>
              <AlertDescription>
                Participe de desafios e atividades para começar a acumular pontos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges">Desafios</TabsTrigger>
          <TabsTrigger value="rewards">Prêmios</TabsTrigger>
          <TabsTrigger value="gymrats">Gymrats</TabsTrigger>
        </TabsList>

        {/* Tab: Desafios */}
        <TabsContent value="challenges" className="mt-6">
          {challenges.length === 0 ? (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertTitle>Nenhum desafio ativo</AlertTitle>
              <AlertDescription>
                Novos desafios serão adicionados em breve. Fique atento!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <Badge variant={getCategoryColor(challenge.category)} className="mt-2">
                          {getCategoryLabel(challenge.category)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-bold">{challenge.points_reward}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">pontos</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {challenge.description || 'Complete este desafio para ganhar pontos!'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {new Date(challenge.start_date).toLocaleDateString('pt-BR')} - 
                          {new Date(challenge.end_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <Button size="sm">
                        Participar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Prêmios */}
        <TabsContent value="rewards" className="mt-6">
          <Alert>
            <Gift className="h-4 w-4" />
            <AlertTitle>Loja de Prêmios</AlertTitle>
            <AlertDescription>
              Resgate seus pontos por prêmios incríveis! Sistema de recompensas em breve.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Tab: Gymrats (Placeholder) */}
        <TabsContent value="gymrats" className="mt-6">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Integração Gymrats</CardTitle>
              <CardDescription>
                Conecte sua conta Gymrats e acumule pontos automaticamente pelos seus treinos!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button disabled className="mb-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Em Breve
              </Button>
              <p className="text-xs text-muted-foreground">
                Estamos trabalhando na integração com o Gymrats para sincronizar suas atividades
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
