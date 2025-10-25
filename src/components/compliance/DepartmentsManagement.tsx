import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Plus, MoreVertical } from "lucide-react";

interface DepartmentsManagementProps {
  userRole: string;
}

export default function DepartmentsManagement({ userRole }: DepartmentsManagementProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const canManage = userRole === 'admin';

  // Dados mockup
  const mockDepartments = [
    {
      id: '1',
      name: 'Vendas',
      description: 'Equipe responsável por prospecção, negociação e fechamento de vendas',
      is_active: true
    },
    {
      id: '2',
      name: 'Tecnologia',
      description: 'Desenvolvimento de software, infraestrutura e suporte técnico',
      is_active: true
    },
    {
      id: '3',
      name: 'Suporte',
      description: 'Atendimento ao cliente e resolução de tickets',
      is_active: true
    },
    {
      id: '4',
      name: 'Recursos Humanos',
      description: 'Gestão de pessoas, recrutamento e desenvolvimento de talentos',
      is_active: true
    },
    {
      id: '5',
      name: 'Financeiro',
      description: 'Controladoria, contas a pagar/receber e planejamento financeiro',
      is_active: true
    },
    {
      id: '6',
      name: 'Marketing',
      description: 'Estratégias de marketing digital, branding e comunicação',
      is_active: true
    },
    {
      id: '7',
      name: 'Jurídico',
      description: 'Compliance, contratos e assessoria jurídica',
      is_active: false
    }
  ];

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (!error && data && data.length > 0) {
      setDepartments(data);
    } else {
      // Usar dados mockup se não houver dados no banco
      setDepartments(mockDepartments);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Gerenciamento de Setores</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Estrutura organizacional e departamentos</p>
        </div>
        {canManage && (
          <button className="flex items-center space-x-2 bg-purple-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Novo Setor</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 w-5 h-5" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-purple-600 focus:border-purple-600 text-slate-900 dark:text-slate-50"
            placeholder="Pesquisar por nome ou descrição..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-50">{dept.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{dept.description || "Sem descrição"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    dept.is_active
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                  }`}>
                    {dept.is_active ? "Ativo" : "Inativo"}
                  </span>
                  {canManage && (
                    <button className="p-1 text-slate-500 dark:text-slate-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">
              {searchTerm ? "Nenhum setor encontrado" : "Nenhum setor cadastrado"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm
                ? "Tente ajustar sua pesquisa"
                : "A estrutura de setores será configurada pelo administrador."}
            </p>
          </div>
        )}
      </div>

      {filteredDepartments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
            Mostrando {filteredDepartments.length} de {departments.length} resultados
          </p>
        </div>
      )}
    </div>
  );
}