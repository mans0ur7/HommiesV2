import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import PropertyDetail from "./pages/PropertyDetail";
import Auth from "./pages/Auth";
import CompleteProfile from "./pages/CompleteProfile";

import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import MyListings from "./pages/MyListings";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Settings from "./pages/Settings";
import Payment from "./pages/Payment";
import Inbox from "./pages/Inbox";
import Matches from "./pages/Matches";
import Documents from "./pages/Documents";
import ContractWizard from "./pages/ContractWizard";
import ContractDetail from "./pages/ContractDetail";
import SearchAgents from "./pages/SearchAgents";
import SearchTogether from "./pages/SearchTogether";
import MovingService from "./pages/MovingService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/new" element={<ContractWizard />} />
            <Route path="/documents/edit/:id" element={<ContractWizard />} />
            <Route path="/documents/:id" element={<ContractDetail />} />
            <Route path="/search-agents" element={<SearchAgents />} />
            <Route path="/focus" element={<SearchTogether />} />
            <Route path="/search-together" element={<SearchTogether />} />
            <Route path="/flytteservice" element={<MovingService />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
