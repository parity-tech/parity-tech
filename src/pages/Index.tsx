import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, MapPin, Link2, AlertTriangle, BarChart3, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Prevenção de Passivos Trabalhistas",
      description: "Identifique e contenha riscos antes que se tornem contenciosos jurídicos"
    },
    {
      icon: AlertTriangle,
      title: "Alertas Inteligentes",
      description: "Monitore automaticamente indicadores críticos de compliance e gestão"
    },
    {
      icon: BarChart3,
      title: "Documentação Estruturada",
      description: "Apresente defesas robustas com documentação automatizada e auditável"
    },
    {
      icon: Activity,
      title: "Gestão de Pessoas Baseada em Dados",
      description: "Programas de qualidade fundamentados em métricas e entregas concretas"
    },
    {
      icon: MapPin,
      title: "Monitoramento de Equipes Remotas",
      description: "Acompanhe produtividade e engajamento em ambientes híbridos"
    },
    {
      icon: Link2,
      title: "Integração Total",
      description: "Conecte RH, financeiro e jurídico em uma única plataforma"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Soluções Jurídicas e de Gestão</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            PARITY
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              O futuro do trabalho começa por aqui
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Entregamos soluções integradas para RH, financeiro e jurídico. 
            Previna passivos trabalhistas, estruture documentação robusta e fortaleça sua gestão de pessoas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 shadow-glow transition-smooth"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 backdrop-blur-sm"
              onClick={() => navigate("/auth")}
            >
              Ver Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card/80 backdrop-blur-sm rounded-xl p-6 hover:shadow-glow transition-smooth border border-primary/10"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-md">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 max-w-3xl mx-auto shadow-glow border border-primary/20">
            <h2 className="text-3xl font-bold mb-4">
              Proteja sua empresa. Fortaleça sua gestão.
            </h2>
            <p className="text-muted-foreground mb-6">
              Ideal para empresas com mais de 50 colaboradores em regime híbrido ou remoto.
              Gestão baseada em dados, compliance automatizado e desenvolvimento estruturado.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-primary hover:opacity-90 px-8 shadow-md transition-smooth"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
