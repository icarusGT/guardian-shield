// Last updated: 20th January 2025
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import ChatAssistance from "@/components/ChatAssistance";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CreateCase from "./pages/CreateCase";
import CaseDetail from "./pages/CaseDetail";
import Transactions from "./pages/Transactions";
import Users from "./pages/Users";
import Investigations from "./pages/Investigations";
import Team from "./pages/Team";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Documentation from "./pages/Documentation";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import QueryDebugger from "./pages/QueryDebugger";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/new" element={<CreateCase />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/users" element={<Users />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/team" element={<Team />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/query-debugger" element={<QueryDebugger />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatAssistance />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
