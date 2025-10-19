import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  LogOut, 
  Activity, 
  MapPin, 
  Link2, 
  AlertTriangle,
  FileText,
  TrendingUp,
  Users,
  Settings
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
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

  const loadUserData = async (userId: string) => {
    try {
      // Carregar perfil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, companies(*)")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData);
        setCompany(profileData.companies);
      }

      // Carregar role
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

  const stats = [
    { icon: MapPin, label: "Logins Hoje", value: "0", color: "text-primary" },
    { icon: Link2, label: "Integrações Ativas", value: "0", color: "text-accent" },
    { icon: AlertTriangle, label: "Alertas Pendentes", value: "0", color: "text-warning" },
    { icon: FileText, label: "Relatórios", value: "0", color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SaaS Monitor</h1>
              <p className="text-sm text-muted-foreground">{company?.name || "Carregando..."}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <Badge {...getRoleBadge(userRole)} className="font-medium">
                  {userRole || "usuário"}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-muted">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            Bem-vindo, {profile?.full_name?.split(" ")[0] || "Usuário"}!
          </h2>
          <p className="text-lg text-muted-foreground">
            Monitore integrações, localizações de login e atividade da equipe.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-subtle flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50" onClick={() => navigate("/compliance")}>
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-3 shadow-md group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                <MapPin className="w-7 h-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Compliance</CardTitle>
              <CardDescription className="text-base">
                Metas, trilhas de capacitação e feedback por setor
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Geolocalização</CardTitle>
              <CardDescription className="text-base">
                Monitore locais de login da equipe em tempo real
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50" onClick={() => navigate("/commercial")}>
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                <Link2 className="w-7 h-7 text-accent" />
              </div>
              <CardTitle className="text-xl">Área Comercial</CardTitle>
              <CardDescription className="text-base">
                CRM, VOIP e analytics para vendas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50" onClick={() => navigate("/customer-service")}>
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                <Link2 className="w-7 h-7 text-accent" />
              </div>
              <CardTitle className="text-xl">Atendimento ao Cliente</CardTitle>
              <CardDescription className="text-base">
                ERP, VOIP e métricas de suporte
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50" onClick={() => navigate("/hr-integrations")}>
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <CardTitle className="text-xl">Integrações de RH</CardTitle>
              <CardDescription className="text-base">
                Admissões, férias e gestão de benefícios
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50" onClick={() => navigate("/analytics")}>
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <CardTitle className="text-xl">Analytics & BI</CardTitle>
              <CardDescription className="text-base">
                Power BI, Looker e dashboards avançados
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50" onClick={() => navigate("/alerts")}>
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center mb-3 group-hover:bg-warning/20 group-hover:scale-110 transition-all duration-300">
                <AlertTriangle className="w-7 h-7 text-warning" />
              </div>
              <CardTitle className="text-xl">Alertas</CardTitle>
              <CardDescription className="text-base">
                Score de risco trabalhista, segurança da informação e LGPD
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50" onClick={() => navigate("/people")}>
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Gestão de Pessoas</CardTitle>
              <CardDescription className="text-base">
                Licença médica, bem-estar e benefícios
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50" onClick={() => navigate("/corrective-actions")}>
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 group-hover:bg-destructive/20 group-hover:scale-110 transition-all duration-300">
                <FileText className="w-7 h-7 text-destructive" />
              </div>
              <CardTitle className="text-xl">Ações Corretivas</CardTitle>
              <CardDescription className="text-base">
                Documentos formais e sugestões de correção
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-12 bg-gradient-primary text-primary-foreground shadow-glow border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              Sistema Multi-Tenant Configurado
            </CardTitle>
            <CardDescription className="text-primary-foreground/90 text-base mt-2">
              Seu banco de dados está pronto para integração com backend Python via Google Cloud. 
              Todas as tabelas incluem RLS para isolamento entre empresas e rastreamento completo de atividades.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
