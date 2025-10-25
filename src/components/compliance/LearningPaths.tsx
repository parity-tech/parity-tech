import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Clock, CheckCircle2, Search, Plus, MoreVertical } from "lucide-react";

interface LearningPathsProps {
  userRole: string;
  selectedDepartmentId: string | null;
}

export default function LearningPaths({ userRole, selectedDepartmentId }: LearningPathsProps) {
  const [paths, setPaths] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const canManage = userRole === 'admin' || userRole === 'gestor';

  // Dados mockup
  const mockPaths = [
    {
      id: '1',
      title: 'Introdução à LGPD e Proteção de Dados',
      description: 'Curso completo sobre a Lei Geral de Proteção de Dados e suas aplicações práticas no ambiente corporativo',
      estimated_duration_minutes: 120,
      is_mandatory: true,
      is_active: true,
      department_id: null, // Todos os setores
      departments: { name: 'Todos' }
    },
    {
      id: '2',
      title: 'Técnicas Avançadas de Vendas B2B',
      description: 'Estratégias de negociação, prospecção e fechamento para vendas corporativas',
      estimated_duration_minutes: 180,
      is_mandatory: false,
      is_active: true,
      department_id: '1',
      departments: { name: 'Vendas' }
    },
    {
      id: '3',
      title: 'Desenvolvimento com React e TypeScript',
      description: 'Construção de aplicações modernas utilizando React 18, TypeScript e melhores práticas',
      estimated_duration_minutes: 240,
      is_mandatory: true,
      is_active: true,
      department_id: '2',
      departments: { name: 'Tecnologia' }
    },
    {
      id: '4',
      title: 'Atendimento ao Cliente e Gestão de Conflitos',
      description: 'Técnicas de comunicação efetiva e resolução de problemas no atendimento',
      estimated_duration_minutes: 90,
      is_mandatory: true,
      is_active: true,
      department_id: '3',
      departments: { name: 'Suporte' }
    },
    {
      id: '5',
      title: 'Liderança e Gestão de Equipes',
      description: 'Desenvolvimento de habilidades de liderança e gestão de pessoas',
      estimated_duration_minutes: 150,
      is_mandatory: false,
      is_active: true,
      department_id: '4',
      departments: { name: 'RH' }
    }
  ];

  const mockProgress = {
    '1': { completed: 8, total: 10, percentage: 80 },
    '2': { completed: 3, total: 12, percentage: 25 },
    '3': { completed: 15, total: 15, percentage: 100 },
    '4': { completed: 5, total: 8, percentage: 62.5 },
    '5': { completed: 2, total: 10, percentage: 20 }
  };

  useEffect(() => {
    loadLearningPaths();
    loadProgress();
  }, []);

  const loadLearningPaths = async () => {
    const { data, error } = await supabase
      .from('learning_paths')
      .select(`
        *,
        departments(name),
        learning_content(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setPaths(data);
    } else {
      // Usar dados mockup se não houver dados no banco
      setPaths(mockPaths);
    }
  };

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Usar dados mockup se não houver usuário
      setProgress(mockProgress);
      return;
    }

    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data && data.length > 0) {
      const progressMap: Record<string, any> = {};
      data.forEach(p => {
        if (!progressMap[p.learning_path_id]) {
          progressMap[p.learning_path_id] = {
            completed: 0,
            total: 0,
            percentage: 0
          };
        }
        progressMap[p.learning_path_id].total += 1;
        if (p.is_completed) {
          progressMap[p.learning_path_id].completed += 1;
        }
      });

      Object.keys(progressMap).forEach(pathId => {
        const p = progressMap[pathId];
        p.percentage = p.total > 0 ? (p.completed / p.total) * 100 : 0;
      });

      setProgress(progressMap);
    } else {
      // Usar dados mockup se não houver dados no banco
      setProgress(mockProgress);
    }
  };

  const filteredPaths = paths
    .filter(path =>
      path.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(path =>
      !selectedDepartmentId || path.department_id === selectedDepartmentId || path.department_id === null
    );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Trilhas de Capacitação</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Conteúdos de treinamento e desenvolvimento</p>
        </div>
        {canManage && (
          <button className="flex items-center space-x-2 bg-purple-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Nova Trilha</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 w-5 h-5" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-purple-600 focus:border-purple-600 text-slate-900 dark:text-slate-50"
            placeholder="Pesquisar por título ou descrição..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredPaths.length > 0 ? (
          filteredPaths.map((path) => {
            const pathProgress = progress[path.id] || { completed: 0, total: 0, percentage: 0 };

            return (
              <div
                key={path.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-50">{path.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{path.description || "Sem descrição"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {path.is_mandatory && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                        Obrigatório
                      </span>
                    )}
                    <button className="p-1 text-slate-500 dark:text-slate-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${pathProgress.percentage}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Duração: ~{path.estimated_duration_minutes || 0} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Progresso: {pathProgress.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <BookOpen className="w-4 h-4" />
                    <span>Setor: {path.departments?.name || "Geral"}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">
              {selectedDepartmentId
                ? "Nenhuma trilha encontrada para este setor"
                : searchTerm
                ? "Nenhuma trilha encontrada"
                : "Nenhuma trilha disponível"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {selectedDepartmentId
                ? "Tente selecionar outro setor ou limpar o filtro."
                : searchTerm
                ? "Tente ajustar sua pesquisa"
                : "As trilhas de capacitação serão disponibilizadas em breve."}
            </p>
          </div>
        )}
      </div>

      {filteredPaths.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
            Mostrando {filteredPaths.length} de {paths.length} resultados
          </p>
        </div>
      )}
    </div>
  );
}