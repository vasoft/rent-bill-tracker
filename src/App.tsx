import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SpacesClients from "./pages/SpacesClients";
import UtilitiesServices from "./pages/UtilitiesServices";
import Invoices from "./pages/Invoices";
import ConsumptionNotes from "./pages/ConsumptionNotes";
import History from "./pages/History";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/spaces-clients" element={<SpacesClients />} />
          <Route path="/utilities-services" element={<UtilitiesServices />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/consumption-notes" element={<ConsumptionNotes />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
