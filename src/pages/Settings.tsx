import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  Users,
  UserPlus,
  Trash2,
  Mail,
  Building2,
  ArrowLeft,
  Loader2,
  Shield,
  Edit,
  Save,
  Phone,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const ROLES = [
  { value: "admin", label: "Proprietário", color: "bg-gradient-primary text-white" },
  { value: "gestor", label: "Gerente", color: "bg-blue-500 text-white" },
  { value: "usuario", label: "RH", color: "bg-green-500 text-white" },
];

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);
    await loadUserData(user.id);
    await loadTeamMembers();
    setLoading(false);
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
        setProfileForm({
          full_name: profileData.full_name || "",
          phone: profileData.phone || user?.user_metadata?.phone || "",
        });

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

  const loadTeamMembers = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profileData?.company_id) {
        console.log("Sem company_id");
        return;
      }

      // Buscar profiles com user_roles
      const { data: members, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          created_at,
          user_roles(role)
        `)
        .eq("company_id", profileData.company_id);

      if (error) {
        console.error("Erro na query:", error);
        throw error;
      }

      console.log("Membros encontrados:", members);

      // Formatar dados dos membros
      // Por enquanto, vamos usar o user atual como exemplo de email
      const formattedMembers = (members || []).map((member: any) => ({
        id: member.id,
        full_name: member.full_name || "Sem nome",
        email: member.id === user.id ? user.email : "email@exemplo.com", // Temporário
        role: member.user_roles?.[0]?.role || "usuario",
        created_at: member.created_at,
      }));

      console.log("Membros formatados:", formattedMembers);
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
      toast.error("Erro ao carregar membros da equipe");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: profileForm.full_name })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Atualizar metadados do usuário
      const { error: authError } = await supabase.auth.updateUser({
        data: { phone: profileForm.phone },
      });

      if (authError) throw authError;

      toast.success("Perfil atualizado com sucesso!");
      setEditingProfile(false);
      await loadUserData(user.id);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Por enquanto, apenas adiciona à lista
    // Em produção, você enviaria um convite por email
    toast.info("Funcionalidade de convite em desenvolvimento");
    setNewMember({ name: "", email: "", role: "" });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === user?.id) {
      toast.error("Você não pode remover a si mesmo");
      return;
    }

    // Confirmar antes de remover
    if (!confirm("Deseja realmente remover este membro?")) return;

    try {
      // Remover role
      await supabase.from("user_roles").delete().eq("user_id", memberId);

      // Remover perfil
      await supabase.from("profiles").delete().eq("id", memberId);

      toast.success("Membro removido com sucesso");
      await loadTeamMembers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover membro");
    }
  };

  const getRoleLabel = (role: string) => {
    const roleInfo = ROLES.find((r) => r.value === role);
    return roleInfo?.label || role;
  };

  const getRoleColor = (role: string) => {
    const roleInfo = ROLES.find((r) => r.value === role);
    return roleInfo?.color || "bg-muted";
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/homepage")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <button
              onClick={() => navigate("/homepage")}
              className="flex items-center gap-4 hover:opacity-80 transition-opacity"
            >
              <img src="/parity-inverse.svg" alt="Parity" className="w-12 h-12" />
              <div>
                <h1 className="text-xl font-bold">{company?.name || "Parity"}</h1>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white">
              {userRole || "admin"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Minha Conta
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Empresa
            </TabsTrigger>
          </TabsList>

          {/* Aba de Membros */}
          <TabsContent value="members" className="mt-6 space-y-6">
            {/* Debug Info */}
            <div className="text-xs text-muted-foreground mb-2">
              Debug: Role = {userRole || "não definido"} | Company = {company?.id || "não definido"}
            </div>

            {/* Adicionar Membro - Card Destacado */}
            {(userRole === "admin" || !company?.id) && (
              <Card className="border-primary/30 bg-gradient-subtle">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Convidar Novo Membro
                  </CardTitle>
                  <CardDescription>
                    Adicione novos membros à sua equipe e defina suas permissões
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="memberName">Nome Completo</Label>
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
                      <Select
                        value={newMember.role}
                        onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o papel" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddMember}
                    className="w-full bg-gradient-primary hover:opacity-90"
                    size="lg"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Adicionar Membro à Equipe
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Lista de Membros */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Membros da Equipe ({teamMembers.length})</CardTitle>
                    <CardDescription>
                      Gerencie os membros e suas permissões
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum membro encontrado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {!company?.id
                        ? "Configure sua empresa primeiro na aba 'Empresa'"
                        : "Adicione membros à sua equipe usando o formulário acima"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Header da tabela */}
                    <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                      <div className="col-span-4">Nome</div>
                      <div className="col-span-3">Cargo</div>
                      <div className="col-span-3">Nível</div>
                      <div className="col-span-2 text-right">Ações</div>
                    </div>

                    {/* Linhas da tabela */}
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="grid grid-cols-12 gap-4 items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="col-span-4 flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{member.full_name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm text-muted-foreground">
                            {member.id === user?.id ? profile?.position || "Não definido" : "Colaborador"}
                          </p>
                        </div>
                        <div className="col-span-3">
                          <Badge className={getRoleColor(member.role)}>
                            {getRoleLabel(member.role)}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          {userRole === "admin" && member.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Conta */}
          <TabsContent value="account" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Informações da Conta</CardTitle>
                    <CardDescription>Gerencie suas informações pessoais</CardDescription>
                  </div>
                  {!editingProfile ? (
                    <Button variant="outline" onClick={() => setEditingProfile(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditingProfile(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleUpdateProfile}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={profileForm.full_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, full_name: e.target.value })
                      }
                      disabled={!editingProfile}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ""} disabled />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="(11) 91234-5678"
                        value={profileForm.phone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setProfileForm({ ...profileForm, phone: formatted });
                        }}
                        disabled={!editingProfile}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Papel na Empresa</Label>
                    <Badge className={getRoleColor(userRole)} >
                      {getRoleLabel(userRole)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Empresa */}
          <TabsContent value="company" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>Dados cadastrais da empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input value={company?.name || ""} disabled />
                </div>

                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={company?.document || "Não informado"} disabled />
                </div>

                {userRole === "admin" && (
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      Para alterar informações da empresa, entre em contato com o suporte.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
