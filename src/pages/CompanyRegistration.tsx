import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EMPLOYEE_COUNT_RANGES = [
  "50-100",
  "101-250",
  "251-500",
  "501-1000",
  "1001-5000",
  "5000+"
];

const DEFAULT_DEPARTMENTS = [
  "Administrativo",
  "Financeiro",
  "Recursos Humanos (RH)",
  "Jurídico",
  "Comercial",
  "Vendas",
  "Marketing",
  "Operações",
  "Produção",
  "Logística",
  "Qualidade",
  "TI",
  "Infraestrutura",
  "Desenvolvimento"
];

const companySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  primarySector: z.enum(["juridico", "financeiro", "rh"], { 
    errorMap: () => ({ message: "Selecione o setor principal da empresa" })
  }),
  cnpj: z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido (formato: 00.000.000/0000-00)")
    .or(z.string().regex(/^\d{14}$/, "CNPJ inválido")),
  employeeCountRange: z.string().min(1, "Selecione uma faixa"),
  selectedDepartments: z.array(z.string()).min(1, "Selecione pelo menos um setor"),
  emailFinanceiro: z.string().email("Email inválido").max(255),
  emailJuridico: z.string().email("Email inválido").max(255),
  emailRH: z.string().email("Email inválido").max(255),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      primarySector: undefined,
      cnpj: "",
      employeeCountRange: "",
      selectedDepartments: [],
      emailFinanceiro: "",
      emailJuridico: "",
      emailRH: "",
    },
  });

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value;
  };

  const handleDepartmentToggle = (department: string) => {
    setSelectedDepartments((prev) => {
      const updated = prev.includes(department)
        ? prev.filter((d) => d !== department)
        : [...prev, department];
      form.setValue("selectedDepartments", updated);
      return updated;
    });
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: data.name,
          primary_sector: data.primarySector,
          slug: data.name.toLowerCase().replace(/\s+/g, "-"),
          cnpj: data.cnpj.replace(/\D/g, ""),
          employee_count_range: data.employeeCountRange,
          selected_departments: data.selectedDepartments,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create contacts
      const contacts = [
        { company_id: company.id, contact_type: "financeiro", email: data.emailFinanceiro },
        { company_id: company.id, contact_type: "juridico", email: data.emailJuridico },
        { company_id: company.id, contact_type: "rh", email: data.emailRH },
      ];

      const { error: contactsError } = await supabase
        .from("company_contacts")
        .insert(contacts);

      if (contactsError) throw contactsError;

      toast({
        title: "Empresa cadastrada com sucesso!",
        description: `${data.name} foi registrada no sistema.`,
      });

      navigate("/homepage");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar empresa",
        description: error.message || "Ocorreu um erro inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-display">Cadastro de Empresa</CardTitle>
                <CardDescription className="text-base mt-1">
                  Preencha os dados da empresa para iniciar o cadastro no sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados da Empresa */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Dados da Empresa</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Razão social da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primarySector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor Principal da Empresa *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o setor principal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="juridico">
                              <div className="flex flex-col items-start">
                                <span className="font-semibold">Jurídico</span>
                                <span className="text-xs text-muted-foreground">Acesso total a todos os módulos</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="financeiro">
                              <div className="flex flex-col items-start">
                                <span className="font-semibold">Financeiro</span>
                                <span className="text-xs text-muted-foreground">Acesso aos módulos jurídico e financeiro</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rh">
                              <div className="flex flex-col items-start">
                                <span className="font-semibold">RH</span>
                                <span className="text-xs text-muted-foreground">Acesso aos módulos de gestão de pessoas</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00.000.000/0000-00"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatCNPJ(e.target.value);
                              field.onChange(formatted);
                            }}
                            maxLength={18}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeCountRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Colaboradores *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a faixa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EMPLOYEE_COUNT_RANGES.map((range) => (
                              <SelectItem key={range} value={range}>
                                {range} colaboradores
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Setores */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Setores da Empresa *</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione os setores que existem na empresa
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="selectedDepartments"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {DEFAULT_DEPARTMENTS.map((department) => (
                            <div
                              key={department}
                              className="flex items-center space-x-2 p-3 rounded-lg border border-input hover:border-primary/50 transition-colors"
                            >
                              <Checkbox
                                id={department}
                                checked={selectedDepartments.includes(department)}
                                onCheckedChange={() => handleDepartmentToggle(department)}
                              />
                              <Label
                                htmlFor={department}
                                className="cursor-pointer flex-1 font-normal"
                              >
                                {department}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contatos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Contatos dos Setores</h3>
                  
                  <FormField
                    control={form.control}
                    name="emailFinanceiro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do Financeiro *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="financeiro@empresa.com.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailJuridico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do Jurídico *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="juridico@empresa.com.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailRH"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do RH *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="rh@empresa.com.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      "Cadastrar Empresa"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
