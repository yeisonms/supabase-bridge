import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PartnerInfo from "./pages/PartnerInfo";
import Plans from "./pages/Plans";
import AppLayout from "./pages/app/AppLayout";
import AppHome from "./pages/app/AppHome";
import Explore from "./pages/app/Explore";
import GymDetail from "./pages/app/GymDetail";
import Pass from "./pages/app/Pass";
import Profile from "./pages/app/Profile";
import PartnerLayout from "./pages/partner/PartnerLayout";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerScanner from "./pages/partner/PartnerScanner";
import PartnerRegister from "./pages/partner/PartnerRegister";
import PartnerSettings from "./pages/partner/PartnerSettings";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartners from "./pages/admin/AdminPartners";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminReports from "./pages/admin/AdminReports";
import Checkout from "./pages/Checkout";
import Welcome from "./pages/app/Welcome";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/partner-info" element={<PartnerInfo />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* User portal */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<AppHome />} />
              <Route path="explore" element={<Explore />} />
              <Route path="gym/:id" element={<GymDetail />} />
              <Route path="pass" element={<Pass />} />
              <Route path="profile" element={<Profile />} />
              <Route path="welcome" element={<Welcome />} />
            </Route>

            {/* Partner portal */}
            <Route path="/partner/register" element={<PartnerRegister />} />
            <Route path="/partner" element={<PartnerLayout />}>
              <Route index element={<PartnerDashboard />} />
              <Route path="scanner" element={<PartnerScanner />} />
              <Route path="settings" element={<PartnerSettings />} />
            </Route>

            {/* Super Admin portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
