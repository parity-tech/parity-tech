import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Homepage from "./pages/Homepage";
import Compliance from "./pages/Compliance";
import Alerts from "./pages/Alerts";
import PeopleManagement from "./pages/PeopleManagement";
import Commercial from "./pages/Commercial";
import CustomerService from "./pages/CustomerService";
import HRIntegrations from "./pages/HRIntegrations";
import Analytics from "./pages/Analytics";
import CorrectiveActions from "./pages/CorrectiveActions";
import CompanyRegistration from "./pages/CompanyRegistration";
import CompanySetup from "./pages/CompanySetup";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/setup" element={<CompanySetup />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/dashboard" element={<Homepage />} /> {/* Redirect antigo */}
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/people" element={<PeopleManagement />} />
          <Route path="/commercial" element={<Commercial />} />
          <Route path="/customer-service" element={<CustomerService />} />
          <Route path="/hr-integrations" element={<HRIntegrations />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/corrective-actions" element={<CorrectiveActions />} />
          <Route path="/company-registration" element={<CompanyRegistration />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
