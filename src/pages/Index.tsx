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
    <div className="min-h-screen bg-gradient-hero relative">
      {/* Overlay for softer background */}
      <div className="absolute inset-0 bg-gradient-hero-overlay pointer-events-none" />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24 relative z-10">
        <div 
          id="hero"
          data-animate
          className={`text-center max-w-5xl mx-auto mb-16 sm:mb-20 md:mb-24 transition-all duration-1000 ${
            visibleSections.has("hero") || true ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mb-6 sm:mb-8 shadow-lg animate-fade-in border border-white/20">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-xs sm:text-sm font-light text-white tracking-wide">Soluções Jurídicas e de Gestão</span>
          </div>
          
          <h1 className="font-display font-extralight text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-4 sm:mb-6 text-white tracking-tight leading-tight animate-fade-in-up [animation-delay:200ms]">
            PARITY
            <br />
            <span className="font-light text-white/95">
              O futuro do trabalho começa por aqui
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl font-light text-white/90 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in [animation-delay:400ms] px-4">
            Entregamos soluções integradas para RH, financeiro e jurídico. 
            Previna passivos trabalhistas, estruture documentação robusta e fortaleça sua gestão de pessoas.
          </p>
          
          <div className="flex justify-center items-center animate-scale-in [animation-delay:600ms] px-4">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-xl transition-all duration-300 hover:scale-105 font-medium"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div 
          id="features"
          data-animate
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto transition-all duration-1000 px-4 ${
            visibleSections.has("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-7 hover:shadow-glow transition-all duration-300 border border-primary/10 hover:-translate-y-1 hover:border-primary/30 hover:bg-white group"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-medium mb-2 text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-muted-foreground text-sm font-light leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div 
          id="cta"
          data-animate
          className={`mt-16 sm:mt-20 md:mt-24 text-center transition-all duration-1000 px-4 ${
            visibleSections.has("cta") ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 max-w-3xl mx-auto shadow-glow border border-primary/20 hover:shadow-glow-strong transition-all duration-500">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light mb-4 sm:mb-5 text-foreground">
              Proteja sua empresa. Fortaleça sua gestão.
            </h2>
            <p className="text-muted-foreground font-light text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
              Ideal para empresas com mais de 50 colaboradores em regime híbrido ou remoto.
              Gestão baseada em dados, compliance automatizado e desenvolvimento estruturado.
            </p>
            <Button 
              size="lg"
              className="w-full sm:w-auto bg-gradient-primary text-white hover:opacity-90 px-6 sm:px-8 md:px-10 py-5 sm:py-6 shadow-lg transition-all duration-300 hover:scale-105 font-medium text-base sm:text-lg"
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
