import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/lib/protected-route";

import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Marketplace from "@/pages/marketplace";
import ServiceDetail from "@/pages/service-detail";
import NotFound from "@/pages/not-found";

import DashboardLayout from "@/pages/dashboard/layout";
import DashboardOverview from "@/pages/dashboard/overview";
import OrdersPage from "@/pages/dashboard/orders";
import WalletPage from "@/pages/dashboard/wallet";
import MessagesPage from "@/pages/dashboard/messages";
import ProfilePage from "@/pages/dashboard/profile";
import ServicesPage from "@/pages/dashboard/services";

import AdminOverview from "@/pages/admin/overview";
import AdminUsers from "@/pages/admin/users";
import AdminTopups from "@/pages/admin/topups";
import AdminAnalytics from "@/pages/admin/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/login">
        <AuthPage mode="login" />
      </Route>
      <Route path="/register">
        <AuthPage mode="register" />
      </Route>
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/services/:id" component={ServiceDetail} />

      {/* Dashboard */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <DashboardOverview />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/orders">
        <ProtectedRoute>
          <DashboardLayout>
            <OrdersPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/wallet">
        <ProtectedRoute>
          <DashboardLayout>
            <WalletPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/messages">
        <ProtectedRoute>
          <DashboardLayout>
            <MessagesPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/profile">
        <ProtectedRoute>
          <DashboardLayout>
            <ProfilePage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/services">
        <ProtectedRoute>
          <DashboardLayout>
            <ServicesPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/notifications">
        <ProtectedRoute>
          <DashboardLayout>
            <DashboardOverview />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin */}
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <DashboardLayout>
            <AdminOverview />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requireAdmin>
          <DashboardLayout>
            <AdminUsers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/topups">
        <ProtectedRoute requireAdmin>
          <DashboardLayout>
            <AdminTopups />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute requireAdmin>
          <DashboardLayout>
            <AdminAnalytics />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
