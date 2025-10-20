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
import { useModuleAccess } from "@/hooks/use-module-access";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const navigate = useNavigate();
  const { hasAccess, primarySector, loading: moduleLoading } = useModuleAccess();

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

  // Module configuration with access control
  const modules = [
    {
      id: "compliance",
      title: "Compliance",
      description: "Metas, trilhas de capacitação e feedback por setor",
      icon: MapPin,
      route: "/compliance",
      moduleName: "compliance",
      gradient: "bg-gradient-primary",
      iconColor: "text-primary-foreground",
      requiresAccess: true,
    },
    {
      id: "geolocalization",
      title: "Geolocalização",
      description: "Monitore locais de login da equipe em tempo real",
      icon: MapPin,
      route: "/geolocalization",
      moduleName: null, // No access control
      gradient: "bg-primary/10",
      iconColor: "text-primary",
      requiresAccess: false,
    },
    {
      id: "commercial",
      title: "Área Comercial",
      description: "CRM, VOIP e analytics para vendas",
      icon: Link2,
      route: "/commercial",
      moduleName: "commercial",
      gradient: "bg-accent/10",
      iconColor: "text-accent",
      requiresAccess: true,
    },
    {
      id: "customer-service",
      title: "Atendimento ao Cliente",
      description: "ERP, VOIP e métricas de suporte",
      icon: Link2,
      route: "/customer-service",
      moduleName: "customer-service",
      gradient: "bg-accent/10",
      iconColor: "text-accent",
      requiresAccess: true,
    },
    {
      id: "hr-integrations",
      title: "Integrações de RH",
      description: "Admissões, férias e gestão de benefícios",
      icon: Users,
      route: "/hr-integrations",
      moduleName: "hr-integrations",
      gradient: "bg-accent/10",
      iconColor: "text-accent",
      requiresAccess: true,
    },
    {
      id: "analytics",
      title: "Analytics & BI",
      description: "Power BI, Looker e dashboards avançados",
      icon: TrendingUp,
      route: "/analytics",
      moduleName: "analytics",
      gradient: "bg-accent/10",
      iconColor: "text-accent",
      requiresAccess: true,
    },
    {
      id: "alerts",
      title: "Alertas",
      description: "Score de risco trabalhista, segurança da informação e LGPD",
      icon: AlertTriangle,
      route: "/alerts",
      moduleName: "alerts",
      gradient: "bg-warning/10",
      iconColor: "text-warning",
      requiresAccess: true,
    },
    {
      id: "people-management",
      title: "Gestão de Pessoas",
      description: "Licença médica, bem-estar e benefícios",
      icon: Users,
      route: "/people",
      moduleName: "people-management",
      gradient: "bg-primary/10",
      iconColor: "text-primary",
      requiresAccess: true,
    },
    {
      id: "corrective-actions",
      title: "Ações Corretivas",
      description: "Documentos formais e sugestões de correção",
      icon: FileText,
      route: "/corrective-actions",
      moduleName: "corrective-actions",
      gradient: "bg-destructive/10",
      iconColor: "text-destructive",
      requiresAccess: true,
    },
  ];

  // Filter modules based on access
  const visibleModules = modules.filter((module) => {
    if (!module.requiresAccess) return true; // Always show modules without access control
    if (!module.moduleName) return true; // Always show if no module name
    return hasAccess(module.moduleName);
  });

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
          {visibleModules.map((module) => (
            <Card
              key={module.id}
              className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50"
              onClick={() => navigate(module.route)}
            >
              <CardHeader>
                <div className={`w-14 h-14 rounded-xl ${module.gradient} flex items-center justify-center mb-3 ${module.id === 'compliance' ? 'shadow-md group-hover:shadow-glow' : 'group-hover:bg-opacity-30'} group-hover:scale-110 transition-all duration-300`}>
                  <module.icon className={`w-7 h-7 ${module.iconColor}`} />
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <CardDescription className="text-base">
                  {module.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Sector Info Badge */}
        {primarySector && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    Setor Principal: <span className="capitalize">{primarySector}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Módulos visíveis conforme permissões do setor
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
