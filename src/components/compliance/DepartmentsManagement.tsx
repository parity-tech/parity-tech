import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

interface DepartmentsManagementProps {
  userRole: string;
}

export default function DepartmentsManagement({ userRole }: DepartmentsManagementProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const canManage = userRole === 'admin';

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (!error && data) {
      setDepartments(data);
    } else if (error) {
      console.error('Error loading departments:', error);
    }
  };

  const buildHierarchy = (departments: any[]) => {
    const map = new Map();
    const roots: any[] = [];

    departments.forEach(dept => map.set(dept.id, { ...dept, children: [] }));
    
    departments.forEach(dept => {
      const node = map.get(dept.id);
      if (dept.parent_id) {
        const parent = map.get(dept.parent_id);
        if (parent) parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const renderDepartment = (dept: any, level: number = 0) => (
    <div key={dept.id} style={{ marginLeft: `${level * 2}rem` }} className="mb-2">
      <Card className="hover:shadow-md transition-smooth">
        <CardHeader className="py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">{dept.name}</CardTitle>
              {dept.description && (
                <CardDescription className="text-xs">{dept.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      {dept.children && dept.children.length > 0 && (
        <div className="mt-2">
          {dept.children.map((child: any) => renderDepartment(child, level + 1))}
        </div>
      )}
    </div>
  );

  const hierarchy = buildHierarchy(departments);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Setores e Departamentos</h3>
          <p className="text-muted-foreground">Estrutura organizacional da empresa</p>
        </div>
      </div>

      {hierarchy.length > 0 ? (
        <div className="space-y-4">
          {hierarchy.map(dept => renderDepartment(dept))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum setor cadastrado</h3>
            <p className="text-muted-foreground">
              A estrutura de setores será configurada pelo administrador.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}