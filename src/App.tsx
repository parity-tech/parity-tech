import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Compliance from "./pages/Compliance";
import Alerts from "./pages/Alerts";
import PeopleManagement from "./pages/PeopleManagement";
import Commercial from "./pages/Commercial";
import CustomerService from "./pages/CustomerService";
import HRIntegrations from "./pages/HRIntegrations";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/people" element={<PeopleManagement />} />
          <Route path="/commercial" element={<Commercial />} />
          <Route path="/customer-service" element={<CustomerService />} />
          <Route path="/hr-integrations" element={<HRIntegrations />} />
          <Route path="/analytics" element={<Analytics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
