import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import DashboardLinks from "./pages/DashboardLinks";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardAppearance from "./pages/DashboardAppearance";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Streaming from "./pages/Streaming";
import AIBuilder from "./pages/AIBuilder";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import CareersPage from "./pages/CareersPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SecurityPage from "./pages/SecurityPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import ChangelogPage from "./pages/ChangelogPage";
import ConnectDashboard from "./pages/ConnectDashboard";
import StorefrontPage from "./pages/StorefrontPage";
import LiveStreamPage from "./pages/LiveStreamPage";
import MediaPage from "./pages/MediaPage";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import HelpPage from "./pages/HelpPage";
import DashboardMedia from "./pages/DashboardMedia";
import DocsPage from "./pages/DocsPage";
import TemplatesPage from "./pages/TemplatesPage";
import DashboardIntegrations from "./pages/DashboardIntegrations";
import DashboardQRCode from "./pages/DashboardQRCode";
import DashboardBookings from "./pages/DashboardBookings";
import DashboardReviews from "./pages/DashboardReviews";
// TeamPage removed from navigation
import AdminPage from "./pages/AdminPage";
import { LiveMiniPlayer } from "./components/dashboard/LiveMiniPlayer";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LiveMiniPlayer />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          {/* Team page removed */}
          
          {/* Public storefront - anyone can view */}
          <Route path="/store/:accountId" element={<StorefrontPage />} />
          
          {/* Public live stream viewer page */}
          <Route path="/live/:username" element={<LiveStreamPage />} />
          
          {/* Public media/explore page */}
          <Route path="/media" element={<MediaPage />} />
          
          {/* Subscription success page */}
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          
          {/* Protected routes - require authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/links" element={<ProtectedRoute><DashboardLinks /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
          <Route path="/dashboard/appearance" element={<ProtectedRoute><DashboardAppearance /></ProtectedRoute>} />
          <Route path="/dashboard/media" element={<ProtectedRoute><DashboardMedia /></ProtectedRoute>} />
          <Route path="/dashboard/qr-code" element={<ProtectedRoute><DashboardQRCode /></ProtectedRoute>} />
          <Route path="/dashboard/bookings" element={<ProtectedRoute><DashboardBookings /></ProtectedRoute>} />
          <Route path="/dashboard/reviews" element={<ProtectedRoute><DashboardReviews /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/streaming" element={<ProtectedRoute><Streaming /></ProtectedRoute>} />
          <Route path="/ai-builder" element={<ProtectedRoute><AIBuilder /></ProtectedRoute>} />
          <Route path="/connect" element={<ProtectedRoute><ConnectDashboard /></ProtectedRoute>} />
          <Route path="/connect/onboarding" element={<ProtectedRoute><ConnectDashboard /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
          <Route path="/dashboard/integrations" element={<ProtectedRoute><DashboardIntegrations /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          
          {/* Public profile page - must be last due to dynamic route */}
          <Route path="/:username" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
