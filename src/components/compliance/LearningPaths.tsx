import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";

interface LearningPathsProps {
  userRole: string;
}

export default function LearningPaths({ userRole }: LearningPathsProps) {
  const [paths, setPaths] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    loadLearningPaths();
    loadProgress();
  }, []);

  const loadLearningPaths = async () => {
    const { data, error } = await supabase
      .from('learning_paths')
      .select(`
        *,
        departments(name),
        learning_content(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPaths(data);
    }
  };

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      const progressMap: Record<string, any> = {};
      data.forEach(p => {
        if (!progressMap[p.learning_path_id]) {
          progressMap[p.learning_path_id] = {
            completed: 0,
            total: 0,
            percentage: 0
          };
        }
        progressMap[p.learning_path_id].total += 1;
        if (p.is_completed) {
          progressMap[p.learning_path_id].completed += 1;
        }
      });

      Object.keys(progressMap).forEach(pathId => {
        const p = progressMap[pathId];
        p.percentage = p.total > 0 ? (p.completed / p.total) * 100 : 0;
      });

      setProgress(progressMap);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Trilhas de Capacitação</h3>
        <p className="text-muted-foreground">Conteúdos de treinamento e desenvolvimento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths.map((path) => {
          const pathProgress = progress[path.id] || { completed: 0, total: 0, percentage: 0 };
          
          return (
            <Card key={path.id} className="hover:shadow-lg transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  {path.is_mandatory && (
                    <Badge variant="destructive">Obrigatório</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{path.title}</CardTitle>
                <CardDescription className="text-xs">
                  {path.departments?.name || "Geral"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {path.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {path.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>~{path.estimated_duration_minutes || 0} minutos</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progresso</span>
                      <span className="font-semibold">{pathProgress.percentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={pathProgress.percentage} className="h-2" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{pathProgress.completed} de {pathProgress.total} concluídos</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {paths.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma trilha disponível</h3>
            <p className="text-muted-foreground">
              As trilhas de capacitação serão disponibilizadas em breve.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}