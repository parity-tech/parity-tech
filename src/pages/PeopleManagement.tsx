import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartPulse, Users, Gift } from "lucide-react";
import MedicalLeaveExtensions from "@/components/people/MedicalLeaveExtensions";
import WellnessPrograms from "@/components/people/WellnessPrograms";
import BenefitsManagement from "@/components/people/BenefitsManagement";

export default function PeopleManagement() {
  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestão de Pessoas</h1>
        <p className="text-muted-foreground">
          Engajamento, bem-estar e benefícios para colaboradores
        </p>
      </header>

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
  );
}
