// App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./components/Register";
import ProfileSection from "./components/ProfileSection";
import ForgotPassword from "./components/ForgotPassword";
import ResetPasswordConfirm from "./components/ResetPasswordConfirm";
import Sidebar from "./components/Sidebar";
import Accounts from "./pages/Accounts";
import Customer from "./pages/Customer";
import Lead from "./pages/Lead";

import Quotation from "./pages/Quotation";
import Invoice from "./pages/Invoice";
// import AcTypeList from "./components/products/AcTypeList";
import ItemMaster from "./pages/ItemMaster";




function AppRoutes() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const noNavPaths = ["/login", "/register", "/forgot-password"];
  const isLoggedIn = !!localStorage.getItem("access");

  const hideNavbar =
    !isLoggedIn ||
    noNavPaths.includes(location.pathname) ||
    location.pathname.startsWith("/password-reset-confirm/");

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);



  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Navbar */}
      {!hideNavbar && (
        <header className="w-full flex-shrink-0">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!hideNavbar && (
          <aside className="hidden md:block w-55 flex-shrink-0 pt-15">
            <Sidebar />
          </aside>
        )}

        {/* Main */}
        <main
          className={
            hideNavbar
              ? "flex-1 flex items-center justify-center"
              : "flex-1 p-6 pt-15 overflow-hidden"
          }
        >
          <div className="w-full h-full overflow-auto">
            <Routes>
              <Route
                path="/"
                element={
                  isLoggedIn ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/login"
                element={
                  isLoggedIn ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login />
                  )
                }
              />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfileSection />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/password-reset-confirm/:uid/:token"
                element={<ResetPasswordConfirm />}
              />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/customer" element={<Customer />} />
              <Route path="/leads" element={<Lead />} />

                {/* ✅ Product Module Routes (Inside Routes Now) */}
            
              
              
              <Route path="/quotation" element={<Quotation/>}/>
              <Route path="/invoice" element={<Invoice/>}/>



              <Route path="/item_master" element={<ItemMaster />} />

            </Routes>
            
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && !hideNavbar && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full shadow-lg pt-15">
            <Sidebar />
          </aside>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
