import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CreateCase from "./pages/CreateCase";
import CaseDetail from "./pages/CaseDetail";
import Transactions from "./pages/Transactions";
import CreateTransaction from "./pages/CreateTransaction";
import Users from "./pages/Users";
import Investigations from "./pages/Investigations";
import Team from "./pages/Team";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Documentation from "./pages/Documentation";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import QueryDebugger from "./pages/QueryDebugger";
import DatabaseSchema from "./pages/DatabaseSchema";
import AdminDecisions from "./pages/AdminDecisions";
import MyDecisions from "./pages/MyDecisions";
import AdminFeedback from "./pages/AdminFeedback";
import ProjectReport from "./pages/ProjectReport";
import InvestigatorPerformance from "./pages/InvestigatorPerformance";
import Blacklist from "./pages/Blacklist";
import MyProfile from "./pages/MyProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

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
            <Route path="/dashboard" element={<P><Dashboard /></P>} />
            <Route path="/cases" element={<P><Cases /></P>} />
            <Route path="/cases/new" element={<P><CreateCase /></P>} />
            <Route path="/cases/:caseId" element={<P><CaseDetail /></P>} />
            <Route path="/transactions" element={<P><Transactions /></P>} />
            <Route path="/transactions/new" element={<P><CreateTransaction /></P>} />
            <Route path="/users" element={<P><Users /></P>} />
            <Route path="/investigations" element={<P><Investigations /></P>} />
            <Route path="/team" element={<Team />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/query-debugger" element={<P><QueryDebugger /></P>} />
            <Route path="/database-schema" element={<P><DatabaseSchema /></P>} />
            <Route path="/admin-decisions" element={<P><AdminDecisions /></P>} />
            <Route path="/my-decisions" element={<P><MyDecisions /></P>} />
            <Route path="/admin-feedback" element={<P><AdminFeedback /></P>} />
            <Route path="/project-report" element={<ProjectReport />} />
            <Route path="/investigator-performance" element={<P><InvestigatorPerformance /></P>} />
            <Route path="/blacklist" element={<P><Blacklist /></P>} />
            <Route path="/my-profile" element={<P><MyProfile /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
