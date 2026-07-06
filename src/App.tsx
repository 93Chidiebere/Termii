import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SplashScreen } from "./components/SplashScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import AgeGate from "./components/AgeGate";
import { useEffect } from "react";
import { useFollowStore } from "@/stores/followStore";
import { useAuthStore } from "@/stores/authStore";
import { useGlobalSocket } from "@/hooks/useGlobalSocket";
import { getMe } from "@/lib/api";
import { useRoleStore } from "@/stores/roleStore";
import { usePushNotifications } from "@/hooks/usePushNotifications";


const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Index = lazy(() => import("./pages/Index"));
const Explore = lazy(() => import("./pages/Explore"));
const Profile = lazy(() => import("./pages/Profile"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Activity = lazy(() => import("./pages/Activity"));
const Create = lazy(() => import("./pages/Create"));
const Messages = lazy(() => import("./pages/Messages"));
const Admin = lazy(() => import("./pages/Admin"));
const HairTwins = lazy(() => import("./pages/HairTwins"));
const HairTwinDetail = lazy(() => import("./pages/HairTwinDetail"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OrderCallback = lazy(() => import("./pages/OrderCallback"));
const Orders = lazy(() => import("./pages/Orders"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const SellerApplicationCallback = lazy(() => import("./pages/SellerApplicationCallback"));

const queryClient = new QueryClient();

// Smart home route — authenticated users go straight to feed,
// new/unauthenticated users see the landing page
const SmartHomeRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />;
};

const App = () => {
  const { isAuthenticated } = useAuthStore();
  const { loadMyFollowing } = useFollowStore();
  useGlobalSocket();
  usePushNotifications();

  useEffect(() => {
    if (isAuthenticated) {
      loadMyFollowing();
      getMe().then((profile) => {
        useRoleStore.getState().setIsAdmin(profile.is_admin ?? false);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SplashScreen />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<SmartHomeRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/feed" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><AgeGate featureName="Messages"><Messages /></AgeGate></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/hair-twins" element={<ProtectedRoute><HairTwins /></ProtectedRoute>} />
              <Route path="/hair-twins/:id" element={<ProtectedRoute><HairTwinDetail /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><AgeGate featureName="Marketplace"><Marketplace /></AgeGate></ProtectedRoute>} />
              <Route path="/product/:id" element={<ProtectedRoute><AgeGate featureName="Marketplace"><ProductDetail /></AgeGate></ProtectedRoute>} />
              <Route path="/seller-application/callback" element={<ProtectedRoute><SellerApplicationCallback /></ProtectedRoute>} />
              <Route path="/orders/callback" element={<ProtectedRoute><OrderCallback /></ProtectedRoute>} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostDetail />} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;