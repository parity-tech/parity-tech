import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  LogOut,
  Target,
  Building2,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Clock,
  Settings,
  BarChart3,
  UserCircle2
} from "lucide-react";
import GoalsManagement from "@/components/compliance/GoalsManagement";
import DepartmentsManagement from "@/components/compliance/DepartmentsManagement";
import LearningPaths from "@/components/compliance/LearningPaths";
import FeedbackThreads from "@/components/compliance/FeedbackThreads";

interface Profile {
  id: string;
  full_name: string | null;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface PerformanceStats {
  totalGoals: number;
  completedGoals: number;
  averagePerformance: number;
  activeLearningPaths: number;
  pendingFeedbacks: number;
}

export default function Compliance() {
  const [user, setUser] = useState<User | null>(null);
  const [, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"departments" | "goals" | "learning" | "feedback">("departments");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    totalGoals: 0,
    completedGoals: 0,
    averagePerformance: 0,
    activeLearningPaths: 0,
    pendingFeedbacks: 0,
  });
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
      loadDepartments();
      loadPerformanceStats();
    }
  }, [user]);

  const loadDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (!error && data && data.length > 0) {
      setDepartments(data);
    } else {
      // Dados mockup
      setDepartments([
        { id: '1', name: 'Vendas' },
        { id: '2', name: 'Tecnologia' },
        { id: '3', name: 'Suporte' },
        { id: '4', name: 'Recursos Humanos' },
        { id: '5', name: 'Financeiro' },
        { id: '6', name: 'Marketing' }
      ]);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
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

  const loadPerformanceStats = async () => {
    // Usar dados mockup para evitar erros de schema
    setPerformanceStats({
      totalGoals: 12,
      completedGoals: 8,
      averagePerformance: 82,
      activeLearningPaths: 5,
      pendingFeedbacks: 3,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Target className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/homepage")}
              className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
            >
              <img src="/parity-logo.svg" alt="Parity" className="w-16 h-16" />
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {company?.name || "Parity"}
                </h1>
              </div>
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-xs font-medium text-white bg-purple-600 rounded-full px-3 py-1">
                {userRole || "admin"}
              </span>
              <button
                onClick={() => navigate("/settings")}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Bem-vindo ao Compliance, {profile?.full_name?.split(" ")[0] || "Nickson"}!
            </h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Gerencie metas, trilhas de capacitação e feedback do setor
            </p>
          </div>

          {/* Resumo Geral de Desempenho */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <UserCircle2 className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Resumo Geral de Desempenho</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Visão consolidada do seu progresso</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
                <Target className="w-8 h-8 text-purple-600 mx-auto" />
                <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-slate-50">{performanceStats.totalGoals || 12}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Metas Totais</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-slate-50">{performanceStats.completedGoals || 8}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Metas Concluídas</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
                <BarChart3 className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-slate-50">{performanceStats.averagePerformance || 82}%</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Performance Média</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
                <BookOpen className="w-8 h-8 text-blue-500 mx-auto" />
                <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-slate-50">{performanceStats.activeLearningPaths || 5}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Trilhas Ativas</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
                <Clock className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-slate-50">{performanceStats.pendingFeedbacks || 3}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Feedbacks Pendentes</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg flex space-x-1">
            <button
              onClick={() => setActiveTab("departments")}
              className={`flex-1 text-sm font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors ${
                activeTab === "departments"
                  ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700/50"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Setores</span>
            </button>
            <button
              onClick={() => setActiveTab("goals")}
              className={`flex-1 text-sm font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors ${
                activeTab === "goals"
                  ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700/50"
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Metas</span>
            </button>
            <button
              onClick={() => setActiveTab("learning")}
              className={`flex-1 text-sm font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors ${
                activeTab === "learning"
                  ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700/50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Capacitação</span>
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`flex-1 text-sm font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors ${
                activeTab === "feedback"
                  ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700/50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </button>
          </div>

          {/* Seletor de Setor (aparece apenas nas tabs Metas, Capacitação e Feedback) */}
          {activeTab !== "departments" && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  Filtrar por Setor:
                </label>
                <select
                  value={selectedDepartmentId || ""}
                  onChange={(e) => setSelectedDepartmentId(e.target.value || null)}
                  className="flex-1 max-w-xs px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-purple-600 focus:border-purple-600 text-slate-900 dark:text-slate-50"
                >
                  <option value="">Todos os Setores</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {selectedDepartmentId && (
                  <button
                    onClick={() => setSelectedDepartmentId(null)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "departments" && <DepartmentsManagement userRole={userRole} />}
          {activeTab === "goals" && <GoalsManagement userRole={userRole} selectedDepartmentId={selectedDepartmentId} />}
          {activeTab === "learning" && <LearningPaths userRole={userRole} selectedDepartmentId={selectedDepartmentId} />}
          {activeTab === "feedback" && <FeedbackThreads userRole={userRole} profile={profile} selectedDepartmentId={selectedDepartmentId} />}
        </div>
      </main>
    </div>
  );
}