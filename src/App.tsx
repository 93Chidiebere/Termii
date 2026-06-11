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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SplashScreen />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes — anyone can visit these */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes — must be logged in */}
          <Route path="/feed" element={
            <ProtectedRoute><Index /></ProtectedRoute>
          } />
          <Route path="/explore" element={
            <ProtectedRoute><Explore /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/post/:id" element={
            <ProtectedRoute><PostDetail /></ProtectedRoute>
          } />
          <Route path="/activity" element={
            <ProtectedRoute><Activity /></ProtectedRoute>
          } />
          <Route path="/create" element={
            <ProtectedRoute><Create /></ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute><Messages /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute><Admin /></ProtectedRoute>
          } />
          <Route path="/hair-twins" element={
            <ProtectedRoute><HairTwins /></ProtectedRoute>
          } />
          <Route path="/hair-twins/:id" element={
            <ProtectedRoute><HairTwinDetail /></ProtectedRoute>
          } />
          <Route path="/marketplace" element={
            <ProtectedRoute><Marketplace /></ProtectedRoute>
          } />
          <Route path="/product/:id" element={
            <ProtectedRoute><ProductDetail /></ProtectedRoute>
          } />

          {/* 404 — catch everything else */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;