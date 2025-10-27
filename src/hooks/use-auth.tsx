import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_, session) => {
          setUser(session?.user ?? null);
          if (!session) {
            navigate("/auth");
          }
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
      } else {
        await loadUserData(session.user.id);
      }

      setLoading(false);
      return () => subscription.unsubscribe();
    };

    initAuth();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData);

        if (profileData.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("*")
            .eq("id", profileData.company_id)
            .single();

          if (companyData) {
            setCompany(companyData);
          }
        }
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  return {
    user,
    loading,
    profile,
    company,
    userRole,
    handleLogout,
  };
}
