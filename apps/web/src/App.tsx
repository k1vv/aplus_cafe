import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import BookTable from "./pages/BookTable.tsx";
import Delivery from "./pages/Delivery.tsx";
import Order from "./pages/Order.tsx";
import Checkout from "./pages/Checkout.tsx";
import CheckoutReturn from "./pages/CheckoutReturn.tsx";
import Auth from "./pages/Auth.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import Orders from "./pages/Orders.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import SecuritySettings from "./pages/SecuritySettings.tsx";
import CafeLayout from "./pages/CafeLayout.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes - require authentication */}
              <Route path="/cafe" element={
                <ProtectedRoute>
                  <CafeLayout />
                </ProtectedRoute>
              } />
              <Route path="/book" element={
                <ProtectedRoute>
                  <BookTable />
                </ProtectedRoute>
              } />
              <Route path="/delivery" element={
                <ProtectedRoute>
                  <Delivery />
                </ProtectedRoute>
              } />
              <Route path="/order" element={
                <ProtectedRoute>
                  <Order />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/security" element={
                <ProtectedRoute>
                  <SecuritySettings />
                </ProtectedRoute>
              } />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/*" element={
                <AdminProtectedRoute>
                  <Admin />
                </AdminProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/checkout/return" element={
                <ProtectedRoute>
                  <CheckoutReturn />
                </ProtectedRoute>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
