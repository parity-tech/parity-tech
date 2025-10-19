import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, MapPin, Link2, AlertTriangle, BarChart3, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MapPin,
      title: "Geolocalização de Logins",
      description: "Rastreie e monitore a localização de todos os acessos à plataforma"
    },
    {
      icon: Link2,
      title: "Integrações API",
      description: "Conecte ERPs, CRMs, sistemas financeiros e de RH"
    },
    {
      icon: AlertTriangle,
      title: "Sistema de Alertas",
      description: "Receba notificações sobre eventos importantes em tempo real"
    },
    {
      icon: BarChart3,
      title: "Dashboards & Relatórios",
      description: "Visualize métricas e gere relatórios automáticos"
    },
    {
      icon: Shield,
      title: "Multi-Tenant Seguro",
      description: "Isolamento completo de dados entre empresas"
    },
    {
      icon: Activity,
      title: "Monitoramento em Tempo Real",
      description: "Acompanhe atividades da equipe instantaneamente"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">SaaS Multi-Tenant Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            Monitore e Integre
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Tudo em um Lugar
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plataforma completa para monitorar geolocalização de logins, 
            integrar APIs corporativas e gerenciar equipes com dashboards em tempo real.
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
              Pronto para Começar?
            </h2>
            <p className="text-muted-foreground mb-6">
              Estrutura de banco de dados multi-tenant completa, com RLS, 
              autenticação e pronta para integração com seu backend Python.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-primary hover:opacity-90 px-8 shadow-md transition-smooth"
              onClick={() => navigate("/auth")}
            >
              Acessar Plataforma
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
