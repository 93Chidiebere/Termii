import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import Activity from "./pages/Activity";
import Create from "./pages/Create";
import Messages from "./pages/Messages";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import HairTwins from "./pages/HairTwins";
import HairTwinDetail from "./pages/HairTwinDetail";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import { SplashScreen } from "./components/SplashScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { useFollowStore } from "@/stores/followStore";
import { useAuthStore } from "@/stores/authStore";
import { useGlobalSocket } from "@/hooks/useGlobalSocket";

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated } = useAuthStore();
  const { loadMyFollowing } = useFollowStore();
  useGlobalSocket();

  useEffect(() => {
    if (isAuthenticated) {
      loadMyFollowing();
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SplashScreen />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route path="/feed" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/hair-twins" element={<ProtectedRoute><HairTwins /></ProtectedRoute>} />
            <Route path="/hair-twins/:id" element={<ProtectedRoute><HairTwinDetail /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;