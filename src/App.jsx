// App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
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

function AppRoutes() {
  const location = useLocation();

  const noNavPaths = ["/login", "/register", "/forgot-password"];

  
  const isLoggedIn = !!localStorage.getItem("access"); 

  const hideNavbar =
    !isLoggedIn ||
    noNavPaths.includes(location.pathname) ||
    location.pathname.startsWith("/password-reset-confirm/");

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden ">
      {!hideNavbar && (
        <header className="w-full flex-shrink-0">
          <Navbar />
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {!hideNavbar && (
          <aside className="w-55 flex-shrink-0 overflow-hidden pt-15">
            <Sidebar />
          </aside>
        )}

        <main
          className={
            hideNavbar
              ? "flex-1 flex items-center justify-center overflow-hidden "
              : "flex-1 p-6 overflow-hidden pt-15"
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
