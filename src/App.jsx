// App.jsx (replace AppRoutes with this version)
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./components/Register";
import ProfileSection from "./components/ProfileSection";
import ForgotPassword from "./components/ForgotPassword";
import ResetPasswordConfirm from "./components/ResetPasswordConfirm";
import Sidebar from "./components/Sidebar";
import Accounts from "./pages/Accounts";

function AppRoutes() {
  const location = useLocation();

  const noNavPaths = ["/login", "/register", "/forgot-password"];

  const hideNavbar =
    noNavPaths.includes(location.pathname) ||
    location.pathname.startsWith("/password-reset-confirm/");

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden ">

      {/* TOP NAVBAR */}
      {!hideNavbar && (
        <header className="w-full flex-shrink-0">
          <Navbar />
        </header>
      )}

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {!hideNavbar && (
          <aside className="w-55 flex-shrink-0 overflow-hidden pt-15">
            <Sidebar />
          </aside>
        )}

        {/* Page Content */}
        <main
          className={
            hideNavbar
              ? "flex-1 flex items-center justify-center overflow-hidden "
              : "flex-1 p-6 overflow-hidden pt-15"
          }
        >
          {/* Content Wrapper Scroll ONLY inside this area if needed */}
          <div className="w-full h-full overflow-auto">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfileSection />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/password-reset-confirm/:uid/:token" element={<ResetPasswordConfirm />} />
              <Route path="/accounts" element={ <Accounts /> } />
              {/* Add more routes here */}
            </Routes>
          </div>
        </main>

      </div>
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
