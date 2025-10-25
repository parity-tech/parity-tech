import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, MessageSquare, Search, MoreVertical, Calendar } from "lucide-react";

interface FeedbackThreadsProps {
  userRole: string;
  profile: any;
  selectedDepartmentId: string | null;
}

export default function FeedbackThreads({ userRole, profile, selectedDepartmentId }: FeedbackThreadsProps) {
  const [threads, setThreads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Dados mockup
  const mockThreads = [
    {
      id: '1',
      title: 'Sugestão: Implementar sistema de feedback 360º',
      description: 'Seria interessante ter um sistema onde os colaboradores possam avaliar seus pares e superiores de forma estruturada, promovendo desenvolvimento contínuo.',
      status: 'em_analise',
      created_at: '2024-07-10T10:30:00',
      department_id: '4',
      departments: { name: 'RH' }
    },
    {
      id: '2',
      title: 'Melhoria: Adicionar filtros avançados no dashboard',
      description: 'Os dashboards atuais poderiam ter filtros por período, setor e tipo de métrica para facilitar a análise de dados.',
      status: 'implementado',
      created_at: '2024-07-05T14:20:00',
      department_id: '2',
      departments: { name: 'Tecnologia' }
    },
    {
      id: '3',
      title: 'Problema: Processo de onboarding muito longo',
      description: 'O processo de integração de novos colaboradores está demorando mais de 2 semanas. Precisamos otimizar as etapas e criar materiais mais objetivos.',
      status: 'aberto',
      created_at: '2024-07-15T09:15:00',
      department_id: '4',
      departments: { name: 'RH' }
    },
    {
      id: '4',
      title: 'Sugestão: Integração com ferramentas de CRM',
      description: 'Integrar o sistema com HubSpot e Salesforce para automatizar o fluxo de leads e melhorar o acompanhamento de vendas.',
      status: 'em_analise',
      created_at: '2024-07-12T16:45:00',
      department_id: '1',
      departments: { name: 'Vendas' }
    },
    {
      id: '5',
      title: 'Melhoria: Padronizar templates de resposta no suporte',
      description: 'Criar templates padronizados para respostas frequentes no atendimento ao cliente, reduzindo o tempo de resposta.',
      status: 'implementado',
      created_at: '2024-06-28T11:00:00',
      department_id: '3',
      departments: { name: 'Suporte' }
    },
    {
      id: '6',
      title: 'Ideia: Programa de mentoria interno',
      description: 'Implementar um programa de mentoria onde colaboradores seniores possam orientar os mais juniores em suas carreiras.',
      status: 'rejeitado',
      created_at: '2024-06-20T13:30:00',
      department_id: '4',
      departments: { name: 'RH' }
    }
  ];

  useEffect(() => {
    loadThreads();

    const channel = supabase
      .channel('feedback-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback_threads'
        },
        () => loadThreads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadThreads = async () => {
    const { data, error } = await supabase
      .from('feedback_threads')
      .select(`
        *,
        departments(name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setThreads(data);
    } else {
      // Usar dados mockup se não houver dados no banco
      setThreads(mockThreads);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      aberto: { color: "bg-slate-500/10 text-slate-600 border-slate-500/20", label: "Aberto" },
      em_analise: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Em Análise" },
      implementado: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Implementado" },
      rejeitado: { color: "bg-red-500/10 text-red-500 border-red-500/20", label: "Rejeitado" }
    };
    return statusMap[status] || statusMap.aberto;
  };

  const filteredThreads = threads
    .filter(thread =>
      thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(thread =>
      !selectedDepartmentId || thread.department_id === selectedDepartmentId
    );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Feedback e Sugestões</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Compartilhe ideias e melhorias com a equipe</p>
        </div>
        <button className="flex items-center space-x-2 bg-purple-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-purple-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Feedback</span>
        </button>
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
        {filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => {
            const statusBadge = getStatusBadge(thread.status);

            return (
              <div
                key={thread.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-50">{thread.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{thread.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <button className="p-1 text-slate-500 dark:text-slate-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>Setor: {thread.departments?.name || "Geral"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Data: {new Date(thread.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">
              {selectedDepartmentId
                ? "Nenhum feedback encontrado para este setor"
                : searchTerm
                ? "Nenhum feedback encontrado"
                : "Nenhum feedback ainda"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {selectedDepartmentId
                ? "Tente selecionar outro setor ou limpar o filtro."
                : searchTerm
                ? "Tente ajustar sua pesquisa"
                : "Seja o primeiro a compartilhar uma sugestão!"}
            </p>
          </div>
        )}
      </div>

      {filteredThreads.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
            Mostrando {filteredThreads.length} de {threads.length} resultados
          </p>
        </div>
      )}
    </div>
  );
}