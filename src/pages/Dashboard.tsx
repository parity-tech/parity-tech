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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SaaS Monitor</h1>
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
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bem-vindo, {profile?.full_name?.split(" ")[0] || "Usuário"}!
          </h2>
          <p className="text-muted-foreground">
            Monitore integrações, localizações de login e atividade da equipe.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-smooth cursor-pointer" onClick={() => navigate("/compliance")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Compliance</CardTitle>
              <CardDescription>
                Metas, trilhas de capacitação e feedback por setor
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-smooth cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Geolocalização</CardTitle>
              <CardDescription>
                Monitore locais de login da equipe em tempo real
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-smooth cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                <Link2 className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Integrações API</CardTitle>
              <CardDescription>
                Gerencie conexões com ERPs, CRMs e sistemas internos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-smooth cursor-pointer" onClick={() => navigate("/alerts")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>
                Score de risco trabalhista, segurança da informação e LGPD
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-smooth cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-success" />
              </div>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>
                Gere relatórios automáticos e dashboards
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-smooth cursor-pointer" onClick={() => navigate("/people")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Gestão de Pessoas</CardTitle>
              <CardDescription>
                Licença médica, bem-estar e benefícios para colaboradores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-smooth cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2">
                <Settings className="w-6 h-6 text-foreground" />
              </div>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Ajuste preferências e integrações
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-8 bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sistema Multi-Tenant Configurado
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Seu banco de dados está pronto para integração com backend Python via Google Cloud. 
              Todas as tabelas incluem RLS para isolamento entre empresas e rastreamento completo de atividades.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
