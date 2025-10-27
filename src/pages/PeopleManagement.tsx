import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartPulse, Users, Gift } from "lucide-react";
import MedicalLeaveExtensions from "@/components/people/MedicalLeaveExtensions";
import WellnessPrograms from "@/components/people/WellnessPrograms";
import BenefitsManagement from "@/components/people/BenefitsManagement";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";

export default function PeopleManagement() {
  const { loading, company, userRole, handleLogout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Users className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        companyName={company?.name || "Parity"}
        userRole={userRole || "admin"}
        onLogout={handleLogout}
      />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Gestão de Pessoas</h2>
          <p className="text-muted-foreground">
            Engajamento, bem-estar e benefícios para colaboradores
          </p>
        </div>

      <Tabs defaultValue="medical" className="w-full">
        <TabsList className="grid w-full grid-cols-3" role="tablist" aria-label="Módulos de gestão de pessoas">
          <TabsTrigger value="medical" aria-label="Licença médica estendida">
            <HeartPulse className="h-4 w-4 mr-2" />
            Licença Médica
          </TabsTrigger>
          <TabsTrigger value="wellness" aria-label="Programas de bem-estar">
            <Users className="h-4 w-4 mr-2" />
            Bem-estar
          </TabsTrigger>
          <TabsTrigger value="benefits" aria-label="Benefícios pet e filhos">
            <Gift className="h-4 w-4 mr-2" />
            Benefícios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical" className="mt-6" role="tabpanel">
          <MedicalLeaveExtensions />
        </TabsContent>

        <TabsContent value="wellness" className="mt-6" role="tabpanel">
          <WellnessPrograms />
        </TabsContent>

        <TabsContent value="benefits" className="mt-6" role="tabpanel">
          <BenefitsManagement />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
