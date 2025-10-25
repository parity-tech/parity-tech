import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  LogOut,
  Heart,
  MapPin,
  Link,
  AlertTriangle,
  FileText,
  TrendingUp,
  Users,
  Settings,
  Globe
} from "lucide-react";
import { useModuleAccess } from "@/hooks/use-module-access";

export default function Homepage() {
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
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Buscar empresa separadamente
        if (profileData.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("*")
            .eq("id", profileData.company_id)
            .single();

          if (companyData) {
            setCompany(companyData);
          }
        }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Heart className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: MapPin, label: "Logins Hoje", value: "0", bgColor: "bg-purple-600/10", iconColor: "text-purple-600" },
    { icon: Link, label: "Integrações Ativas", value: "0", bgColor: "bg-purple-600/10", iconColor: "text-purple-600" },
    { icon: AlertTriangle, label: "Alertas Pendentes", value: "0", bgColor: "bg-orange-400/10", iconColor: "text-orange-400" },
    { icon: FileText, label: "Relatórios", value: "0", bgColor: "bg-green-500/10", iconColor: "text-green-500" },
  ];

  // Module configuration with access control
  const modules = [
    {
      id: "compliance",
      title: "Compliance",
      description: "Metas, trilhas de capacitação e feedback por setor.",
      icon: MapPin,
      route: "/compliance",
      moduleName: "compliance",
      bgColor: "bg-purple-600/10",
      iconColor: "text-purple-600",
      requiresAccess: true,
    },
    {
      id: "geolocalization",
      title: "Geolocalização",
      description: "Monitore locais de login da equipe em tempo real.",
      icon: Globe,
      route: "/geolocalization",
      moduleName: null,
      bgColor: "bg-purple-600/10",
      iconColor: "text-purple-600",
      requiresAccess: false,
    },
    {
      id: "commercial",
      title: "Área Comercial",
      description: "CRM, VOIP e analytics para vendas.",
      icon: Link,
      route: "/commercial",
      moduleName: "commercial",
      bgColor: "bg-purple-600/10",
      iconColor: "text-purple-600",
      requiresAccess: true,
    },
    {
      id: "customer-service",
      title: "Atendimento ao Cliente",
      description: "ERP, VOIP e métricas de suporte.",
      icon: Link,
      route: "/customer-service",
      moduleName: "customer-service",
      bgColor: "bg-purple-600/10",
      iconColor: "text-purple-600",
      requiresAccess: true,
    },
    {
      id: "hr-integrations",
      title: "Integrações de RH",
      description: "Admissões, férias e gestão de benefícios.",
      icon: Users,
      route: "/hr-integrations",
      moduleName: "hr-integrations",
      bgColor: "bg-purple-600/10",
      iconColor: "text-purple-600",
      requiresAccess: true,
    },
    {
      id: "analytics",
      title: "Analytics & BI",
      description: "Power BI, Looker e dashboards avançados.",
      icon: TrendingUp,
      route: "/analytics",
      moduleName: "analytics",
      bgColor: "bg-purple-600/10",
      iconColor: "text-purple-600",
      requiresAccess: true,
    },
    {
      id: "alerts",
      title: "Alertas",
      description: "Score de risco trabalhista, segurança da informação e LGPD.",
      icon: AlertTriangle,
      route: "/alerts",
      moduleName: "alerts",
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      requiresAccess: true,
    },
    {
      id: "people-management",
      title: "Gestão de Pessoas",
      description: "Licença médica, bem-estar e benefícios.",
      icon: Users,
      route: "/people",
      moduleName: "people-management",
      bgColor: "bg-purple-600/10",
      iconColor: "text-purple-600",
      requiresAccess: true,
    },
    {
      id: "corrective-actions",
      title: "Ações Corretivas",
      description: "Documentos formais e sugestões de correção.",
      icon: FileText,
      route: "/corrective-actions",
      moduleName: "corrective-actions",
      bgColor: "bg-red-500/10",
      iconColor: "text-red-500",
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-[1400px] px-10 sm:px-12 lg:px-16">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/parity-inverse.svg" alt="Parity" className="w-12 h-12" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{company?.name || "Parity"}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-5">
              <span className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white">
                {userRole || "admin"}
              </span>
              <button
                onClick={() => navigate("/settings")}
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-600"
                title="Configurações"
              >
                <Settings className="w-6 h-6" />
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-600"
                title="Sair"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1400px] px-10 sm:px-12 lg:px-16 py-8 md:py-10">
        {/* Welcome Section */}
        <section className="mb-8 md:mb-10">
          <h1 className="text-4xl font-bold text-purple-600">
            Bem-vindo, {profile?.full_name?.split(" ")[0] || "Nickson"}!
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Monitore integrações, localizações de login e atividade da equipe.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="mb-8 md:mb-10">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow dark:border dark:border-gray-700"
              >
                <div className={`absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="mt-4 text-5xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Cards */}
        <section>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleModules.map((module) => (
              <div
                key={module.id}
                onClick={() => navigate(module.route)}
                className="flex flex-col rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md dark:border dark:border-gray-700 transition-all duration-200 hover:-translate-y-1 cursor-pointer"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${module.bgColor}`}>
                  <module.icon className={`w-6 h-6 ${module.iconColor}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{module.title}</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{module.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
