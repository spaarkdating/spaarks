import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Admin from "./pages/Admin";
import AdminRegister from "./pages/AdminRegister";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SafetyTips from "./pages/SafetyTips";
import ProfileViews from "./pages/ProfileViews";
import SubmitTestimonial from "./pages/SubmitTestimonial";
import Testimonials from "./pages/Testimonials";
import Unsubscribe from "./pages/Unsubscribe";
import ViewProfile from "./pages/ViewProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<ViewProfile />} />
          <Route path="/profile-views" element={<ProfileViews />} />
          <Route path="/submit-testimonial" element={<SubmitTestimonial />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/safety" element={<SafetyTips />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
