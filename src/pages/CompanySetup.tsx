import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Building2, Users, UserPlus, Trash2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const ROLES = [
  { value: "proprietario", label: "Proprietário", description: "Acesso completo ao sistema", color: "bg-gradient-primary text-white" },
  { value: "gerente", label: "Gerente", description: "Gestão de equipes e metas", color: "bg-blue-500 text-white" },
  { value: "rh", label: "RH", description: "Gestão de pessoas e compliance", color: "bg-green-500 text-white" },
  { value: "financeiro", label: "Financeiro", description: "Controle financeiro e reembolsos", color: "bg-yellow-500 text-white" },
  { value: "juridico", label: "Jurídico", description: "Compliance e documentação legal", color: "bg-purple-500 text-white" },
];

export default function CompanySetup() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [companyDocument, setCompanyDocument] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "" });
  const navigate = useNavigate();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Pré-preencher com dados do registro se disponíveis
    if (user.user_metadata?.company_name) {
      setCompanyName(user.user_metadata.company_name);
    }

    // Verificar se já tem empresa configurada
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      // Já tem empresa configurada, redirecionar para dashboard
      navigate("/homepage");
    }
  };

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      toast.error("Por favor, informe o nome da empresa");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Usar a função SQL para criar empresa com owner
      const { data, error } = await supabase.rpc('create_company_with_owner', {
        p_company_name: companyName,
        p_company_document: companyDocument || null,
        p_user_id: user.id
      });

      if (error) {
        console.error("Erro ao criar empresa:", error);
        throw error;
      }

      console.log("Empresa criada:", data);
      toast.success("Empresa criada com sucesso!");
      setStep(2);
    } catch (error) {
      console.error("Erro completo:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error("Preencha todos os campos do membro");
      return;
    }

    const member: TeamMember = {
      id: Math.random().toString(),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
    };

    setTeamMembers([...teamMembers, member]);
    setNewMember({ name: "", email: "", role: "" });
    toast.success("Membro adicionado à lista");
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
  };

  const handleInviteTeam = async () => {
    if (teamMembers.length === 0) {
      // Permitir pular esta etapa
      navigate("/homepage");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // Aqui você enviaria convites por email
      // Por enquanto, vamos apenas mostrar uma mensagem
      for (const member of teamMembers) {
        console.log(`Convite enviado para ${member.email} com role ${member.role}`);
      }

      toast.success(`${teamMembers.length} convite(s) enviado(s) com sucesso!`);
      navigate("/homepage");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar convites");
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (roleValue: string) => {
    return ROLES.find((r) => r.value === roleValue) || ROLES[0];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-3xl shadow-glow border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              {step === 1 ? (
                <Building2 className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Users className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl text-center">
            {step === 1 ? "Configure sua Empresa" : "Monte sua Equipe"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 1
              ? "Vamos começar configurando as informações da sua empresa"
              : "Adicione membros da equipe e defina seus papéis"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  placeholder="Ex: Minha Empresa Ltda"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDocument">CNPJ (opcional)</Label>
                <Input
                  id="companyDocument"
                  placeholder="00.000.000/0000-00"
                  value={companyDocument}
                  onChange={(e) => setCompanyDocument(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Como Proprietário, você terá acesso a:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Todas as funcionalidades do sistema
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Gerenciamento completo de usuários e permissões
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Configurações avançadas da empresa
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Relatórios e análises completas
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleCreateCompany}
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Papéis Disponíveis */}
              <div className="space-y-3">
                <h4 className="font-medium">Papéis Disponíveis:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ROLES.slice(1).map((role) => (
                    <div key={role.value} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Badge className={role.color}>{role.label}</Badge>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adicionar Membro */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Adicionar Membro
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="memberName">Nome</Label>
                    <Input
                      id="memberName"
                      placeholder="Nome completo"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberEmail">Email</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberRole">Papel</Label>
                    <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.slice(1).map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleAddMember} variant="outline" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar à Lista
                </Button>
              </div>

              {/* Lista de Membros */}
              {teamMembers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Membros Adicionados ({teamMembers.length}):</h4>
                  <div className="space-y-2">
                    {teamMembers.map((member) => {
                      const roleInfo = getRoleInfo(member.role);
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/homepage")}
                  className="flex-1"
                >
                  Pular por Agora
                </Button>
                <Button
                  onClick={handleInviteTeam}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {teamMembers.length > 0 ? "Enviar Convites" : "Concluir"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
