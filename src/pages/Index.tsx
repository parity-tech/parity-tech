import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, MapPin, Link2, AlertTriangle, BarChart3, Shield, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Intersection Observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    // Observe all sections
    const sections = document.querySelectorAll("[data-animate]");
    sections.forEach((section) => {
      if (observerRef.current) {
        observerRef.current.observe(section);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

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
        <div 
          id="hero"
          data-animate
          className={`text-center max-w-4xl mx-auto mb-20 transition-all duration-1000 ${
            visibleSections.has("hero") || true ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg animate-fade-in">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Soluções Jurídicas e de Gestão</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground animate-fade-in-up [animation-delay:200ms]">
            PARITY
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              O futuro do trabalho começa por aqui
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in [animation-delay:400ms]">
            Entregamos soluções integradas para RH, financeiro e jurídico. 
            Previna passivos trabalhistas, estruture documentação robusta e fortaleça sua gestão de pessoas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in [animation-delay:600ms]">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 shadow-glow transition-smooth hover:scale-105"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 backdrop-blur-sm hover:bg-primary/5 hover:scale-105"
              onClick={() => navigate("/auth")}
            >
              Ver Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div 
          id="features"
          data-animate
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto transition-all duration-1000 ${
            visibleSections.has("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card/80 backdrop-blur-sm rounded-xl p-6 hover:shadow-glow transition-all duration-300 border border-primary/10 hover:-translate-y-1 hover:border-primary/30 group"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div 
          id="cta"
          data-animate
          className={`mt-20 text-center transition-all duration-1000 ${
            visibleSections.has("cta") ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 max-w-3xl mx-auto shadow-glow border border-primary/20 hover:shadow-glow-strong transition-all duration-500">
            <h2 className="text-3xl font-bold mb-4">
              Proteja sua empresa. Fortaleça sua gestão.
            </h2>
            <p className="text-muted-foreground mb-6">
              Ideal para empresas com mais de 50 colaboradores em regime híbrido ou remoto.
              Gestão baseada em dados, compliance automatizado e desenvolvimento estruturado.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-primary hover:opacity-90 px-8 shadow-md transition-smooth hover:scale-105"
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
