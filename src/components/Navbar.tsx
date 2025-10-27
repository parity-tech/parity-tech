import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";

interface NavbarProps {
  companyName?: string;
  userRole?: string;
  onLogout: () => void;
}

export default function Navbar({ companyName = "Parity", userRole = "admin", onLogout }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/homepage")}
            className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
          >
            <img src="/parity-inverse.svg" alt="Parity" className="w-12 h-12" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {companyName}
              </h1>
            </div>
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-medium text-white bg-purple-600 rounded-full px-3 py-1">
              {userRole}
            </span>
            <button
              onClick={() => navigate("/settings")}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
