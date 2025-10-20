import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ModuleAccess {
  moduleName: string;
  hasAccess: boolean;
  allowedSectors: string[];
}

export function useModuleAccess() {
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [primarySector, setPrimarySector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModuleAccess();
  }, []);

  const loadModuleAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's company
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Get company's primary sector
      const { data: company } = await supabase
        .from("companies")
        .select("primary_sector")
        .eq("id", profile.company_id)
        .single();

      if (company?.primary_sector) {
        setPrimarySector(company.primary_sector);
      }

      // Get all module access rules
      const { data: modules } = await supabase
        .from("module_access")
        .select("*")
        .order("display_order");

      if (modules && company?.primary_sector) {
        const accessMap: Record<string, boolean> = {};
        modules.forEach((module) => {
          accessMap[module.module_name] = module.allowed_sectors.includes(
            company.primary_sector
          );
        });
        setModuleAccess(accessMap);
      }
    } catch (error) {
      console.error("Error loading module access:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (moduleName: string): boolean => {
    // If no sector defined, allow access (backward compatibility)
    if (!primarySector) return true;
    // Return access status, default to true if module not in mapping
    return moduleAccess[moduleName] ?? true;
  };

  return {
    hasAccess,
    primarySector,
    moduleAccess,
    loading,
  };
}
