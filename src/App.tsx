import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BugReportButton from "@/components/BugReportButton";

// Lazy-loaded routes — each page is fetched on demand instead of shipping the
// whole app in the initial bundle.
const Index = lazy(() => import("./pages/Index"));
const Explore = lazy(() => import("./pages/Explore"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const MyListings = lazy(() => import("./pages/MyListings"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const Settings = lazy(() => import("./pages/Settings"));
const Payment = lazy(() => import("./pages/Payment"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Matches = lazy(() => import("./pages/Matches"));
const Documents = lazy(() => import("./pages/Documents"));
const ContractWizard = lazy(() => import("./pages/ContractWizard"));
const ContractDetail = lazy(() => import("./pages/ContractDetail"));
const SearchAgents = lazy(() => import("./pages/SearchAgents"));
const SearchTogether = lazy(() => import("./pages/SearchTogether"));
const MovingService = lazy(() => import("./pages/MovingService"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

// Forces a logged-in user without a profile to finish profile creation before
// they can use the rest of the app — prevents orphaned, profile-less accounts.
const ProfileGuard = () => {
  const { user, profile, loading, profileLoaded } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !profileLoaded) return;
    const exempt =
      location.pathname === "/complete-profile" ||
      location.pathname === "/auth" ||
      location.pathname === "/reset-password";
    if (user && !profile && !exempt) {
      navigate("/complete-profile", { replace: true });
    }
  }, [user, profile, loading, profileLoaded, location.pathname, navigate]);

  return null;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProfileGuard />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
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
          </Suspense>
          <BugReportButton />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
