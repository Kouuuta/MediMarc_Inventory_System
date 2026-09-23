import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import HomePage from "@/pages/dashboard/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import UserManagement from "@/pages/admin/UserManagement";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Categories from "@/pages/inventory/Categories";
import CustomerManagement from "@/pages/inventory/CustomerManagement";
import ProductManagement from "@/pages/inventory/ProductManagement";
import Sales from "@/pages/inventory/Sales";
import SalesReport from "@/pages/inventory/SalesReport";
import ActivityLog from "@/pages/admin/ActivityLog";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Router>
        <Routes>
          {/* Route without Layout */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/reset-password/:uidb64/:token"
            element={<ResetPassword />}
          />

          {/* Routes with Layout */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/reports" element={<SalesReport />} />
            <Route path="/activity-logs" element={<ActivityLog />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;