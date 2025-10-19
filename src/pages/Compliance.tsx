import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  LogOut, 
  Activity, 
  Target,
  Building2,
  BookOpen,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import GoalsManagement from "@/components/compliance/GoalsManagement";
import DepartmentsManagement from "@/components/compliance/DepartmentsManagement";
import LearningPaths from "@/components/compliance/LearningPaths";
import FeedbackThreads from "@/components/compliance/FeedbackThreads";

export default function Compliance() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [achievements, setAchievements] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          if (!session) {
            navigate("/auth");
          }
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
      } else {
        await loadUserData(session.user.id);
      }

      setLoading(false);
      return () => subscription.unsubscribe();
    };

    initAuth();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadAchievements();
      
      // Realtime para achievements
      const channel = supabase
        .channel('goal-achievements-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'goal_achievements'
          },
          () => loadAchievements()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, companies(*), departments(*)")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData);
        setCompany(profileData.companies);
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const loadAchievements = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('goal_achievements')
      .select(`
        *,
        goals!inner(name, description, metric_type, period)
      `)
      .eq('user_id', user.id)
      .order('period_start', { ascending: false })
      .limit(5);

    if (!error && data) {
      setAchievements(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      admin: { variant: "default", className: "bg-gradient-primary" },
      gestor: { variant: "secondary" },
      usuario: { variant: "outline" },
    };
    return variants[role] || variants.usuario;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Compliance & Monitoramento</h1>
              <p className="text-sm text-muted-foreground">{company?.name || "Carregando..."}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <Badge {...getRoleBadge(userRole)}>
                  {userRole || "usuário"}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <Activity className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome & Quick Stats */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bem-vindo ao Compliance, {profile?.full_name?.split(" ")[0] || "Usuário"}!
          </h2>
          <p className="text-muted-foreground mb-6">
            Gerencie metas, trilhas de capacitação e feedback do setor {profile?.departments?.name || ""}
          </p>

          {/* Achievements Summary */}
          {achievements.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {achievements.slice(0, 3).map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-md transition-smooth">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{achievement.goals.name}</CardTitle>
                      {achievement.achievement_percentage >= 100 ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : achievement.achievement_percentage >= 80 ? (
                        <TrendingUp className="w-5 h-5 text-warning" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {achievement.goals.period} | {achievement.period_start}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">
                        {achievement.achievement_percentage.toFixed(1)}%
                      </span>
                      <Badge 
                        variant={achievement.is_achieved ? "default" : "destructive"}
                        className={achievement.is_achieved ? "bg-success" : ""}
                      >
                        {achievement.is_achieved ? "Atingida" : "Pendente"}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          achievement.achievement_percentage >= 100 
                            ? "bg-success" 
                            : achievement.achievement_percentage >= 80 
                            ? "bg-warning" 
                            : "bg-destructive"
                        }`}
                        style={{ width: `${Math.min(achievement.achievement_percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {achievement.current_value} / {achievement.target_value} {achievement.goals.metric_type}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Setores
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Capacitação
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="mt-6">
            <GoalsManagement userRole={userRole} />
          </TabsContent>

          <TabsContent value="departments" className="mt-6">
            <DepartmentsManagement userRole={userRole} />
          </TabsContent>

          <TabsContent value="learning" className="mt-6">
            <LearningPaths userRole={userRole} />
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <FeedbackThreads userRole={userRole} profile={profile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}