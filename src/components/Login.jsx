import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";
import loginBg from "../assets/login_bg.jpg";
import { 
  Snowflake, 
  ShieldCheck, 
  Sparkles, 
  Wrench, 
  Smartphone, 
  Gauge, 
  Lock, 
  Star,
  Wind
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

  const LOGIN_ENDPOINT = `${BASE_API}/auth/dj-rest-auth/login/`;

  const [form, setForm] = useState({ email_or_mobile: "", password: "" });
  const [message, setMessage] = useState("");

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailMobileVal = form.email_or_mobile ? form.email_or_mobile.trim() : "";
    const passwordVal = form.password ? form.password.trim() : "";

    if (!emailMobileVal && !passwordVal) {
      setMessage("❌ Please enter your email/mobile number and password.");
      return;
    }
    if (!emailMobileVal) {
      setMessage("❌ Please enter your registered email or mobile number.");
      return;
    }
    if (!passwordVal) {
      setMessage("❌ Please enter your password.");
      return;
    }

    setMessage("Logging in...");

    try {
      const res = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let cleanMsg = "Invalid email/mobile number or password.";

        if (data.email_or_mobile && data.password) {
          cleanMsg = "Please enter your email/mobile number and password.";
        } else if (data.email_or_mobile) {
          cleanMsg = "Please enter your registered email or mobile number.";
        } else if (data.password) {
          cleanMsg = "Please enter your password.";
        } else if (data.non_field_errors) {
          const rawErr = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : String(data.non_field_errors);
          if (rawErr.toLowerCase().includes("unable to log in") || rawErr.toLowerCase().includes("invalid")) {
            cleanMsg = "Invalid email/mobile number or password. Please check your credentials.";
          } else {
            cleanMsg = rawErr;
          }
        } else if (data.detail) {
          cleanMsg = String(data.detail).includes("Invalid credentials")
            ? "Invalid email/mobile number or password."
            : String(data.detail);
        }

        setMessage(`❌ ${cleanMsg}`);
        return;
      }

      if (data.access) localStorage.setItem("access", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);

      // Pre-load role/permissions so sidebar is ready before dashboard mounts.
      try {
        const meRes = await fetch(`${BASE_API}/auth/me/`, {
          headers: { Authorization: `Bearer ${data.access}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          const roleName = (typeof meData.role === "object"
            ? meData.role?.name
            : String(meData.role || "")
          ).toLowerCase();
          const adminFlag =
            !!meData.is_admin ||
            ["admin", "administrator", "sub-admin", "super admin", "superadmin"].includes(roleName);
          localStorage.setItem("cached_user_role", JSON.stringify(meData.role));
          localStorage.setItem("cached_permissions", JSON.stringify(meData.permissions || []));
          localStorage.setItem("cached_is_admin", String(adminFlag));
          if (meData.permissions_version != null) {
            localStorage.setItem("permissions_version", String(meData.permissions_version));
          }
        }
      } catch {
        // Non-blocking; useAuth will retry on dashboard.
      }

      window.dispatchEvent(new Event("authChange"));
      
      setMessage("✅ Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setMessage("⚠️ Unable to connect to server. Please try again later.");
    }
  };

  const handleSendForgotEmail = async (e) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter your registered email address.",
      });
      return;
    }

    setForgotLoading(true);
    try {
      // Primary endpoint used in ForgotPassword.jsx
      let res = await fetch(`${BASE_API}/auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      // Fallback endpoint if /auth/password-reset/ returns 404
      if (res.status === 404) {
        res = await fetch(`${BASE_API}/auth/dj-rest-auth/password/reset/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errorTitle = "Request Failed";
        let errorMsg = "Could not process password reset request.";

        if (data.email) {
          errorTitle = "Email Not Registered";
          errorMsg = Array.isArray(data.email) ? data.email.join(" ") : String(data.email);
        } else if (data.detail) {
          const detailStr = String(data.detail);
          if (detailStr.toLowerCase().includes("not found") || detailStr.toLowerCase().includes("not registered")) {
            errorTitle = "Email Not Registered";
          }
          errorMsg = detailStr;
        } else if (data.non_field_errors) {
          errorMsg = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(" ") : String(data.non_field_errors);
        } else if (data.error) {
          errorMsg = String(data.error);
        }

        Swal.fire({
          icon: "error",
          title: errorTitle,
          text: errorMsg,
        });
        return;
      }

      // Email successfully verified & reset link sent
      setShowForgotModal(false);
      setForgotEmail("");

      Swal.fire({
        icon: "success",
        title: "Reset Link Sent!",
        text: `Password reset instructions have been sent to ${cleanEmail}. Please check your email inbox.`,
      });

    } catch (err) {
      console.error("Forgot Password Error:", err);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Could not connect to server. Please try again later.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-[64%_36%] bg-[#f8fafc] relative font-sans">
  
      {/* LEFT WELCOME SECTION WITH AC BACKGROUND */}
      <div 
        className="hidden md:flex flex-col justify-center px-12 lg:px-20 xl:px-28 relative overflow-hidden select-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        {/* Overlay to ensure maximum text readability */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1.5px]"></div>
        
        {/* Welcome Text Content */}
        <h1 className="text-4xl lg:text-5xl font-extrabold text-[#0a4375] leading-tight z-10 drop-shadow-[0_2px_4px_rgba(255,255,255,0.45)]">
          Welcome to <br /> Krisna Air Conditioning
        </h1>
  
        <p className="mt-6 text-base lg:text-lg text-sky-900 max-w-md z-10 leading-relaxed font-normal drop-shadow-sm">
          Premium Cooling, Trusted Service — providing modern AC solutions for your comfort. 
        </p>
  
        <p className="mt-4 text-sm text-sky-700/90 z-10 font-bold drop-shadow-sm">
          Creating healthier, cooler environments since 2005.
        </p>

        {/* Left Side Features */}
        <div className="mt-12 flex flex-wrap gap-4 items-center z-10">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/80 shadow-[0_2px_10px_rgba(56,189,248,0.06)]">
            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 border border-sky-100">
              <Snowflake className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-[#0a4375] text-[11px] uppercase tracking-wider">Premium Cooling</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/80 shadow-[0_2px_10px_rgba(56,189,248,0.06)]">
            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 border border-sky-100">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-[#0a4375] text-[11px] uppercase tracking-wider">Trusted Service</span>
          </div>

          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/80 shadow-[0_2px_10px_rgba(56,189,248,0.06)]">
            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 border border-sky-100">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-[#0a4375] text-[11px] uppercase tracking-wider">Modern Solutions</span>
          </div>
        </div>
      </div>
  
      {/* RIGHT LOGIN FORM */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[460px] bg-white p-8 lg:p-12 rounded-[2rem] shadow-xl shadow-sky-100/50 border border-slate-100/80">
  
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">
            Sign in
          </h2>
  
          <form onSubmit={handleSubmit} className="space-y-6">
  
            {/* Email/Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 pl-0.5">
                Email or Mobile
              </label>
              <input
                type="text"
                name="email_or_mobile"
                value={form.email_or_mobile}
                onChange={handleChange}
                placeholder="you@example.com or 9876543210"
                className="w-full px-4 py-3 rounded-xl border border-sky-300/80 bg-white text-slate-800 placeholder-slate-400/80 outline-none transition-all shadow-[0_2px_8px_rgba(56,189,248,0.04)] focus:border-sky-400 focus:ring-4 focus:ring-sky-100 focus:shadow-[0_0_15px_rgba(56,189,248,0.25)]"
              />
            </div>
  
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 pl-0.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border border-sky-300/80 bg-white text-slate-800 placeholder-slate-400/80 outline-none transition-all shadow-[0_2px_8px_rgba(56,189,248,0.04)] focus:border-sky-400 focus:ring-4 focus:ring-sky-100 focus:shadow-[0_0_15px_rgba(56,189,248,0.25)]"
              />
            </div>
  
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 focus:ring-offset-0 focus:ring-2" 
                />
                <span className="text-slate-600 font-medium">Remember me</span>
              </label>
  
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sky-600 hover:text-sky-700 font-semibold hover:underline focus:outline-none transition-colors"
              >
                Forgot Password?
              </button>
            </div>
  
            {/* Submit Button & SSL Badge Row */}
            <div className="flex gap-3 items-center pt-2">
              {/* Login Button */}
              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-xl text-white font-bold text-base bg-gradient-to-r from-sky-500 to-[#38bdf8] hover:from-sky-600 hover:to-[#0284c7] transition-all shadow-md shadow-sky-200/50 hover:shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center relative overflow-hidden group"
              >
                <span className="relative z-10">Login</span>
                {/* Wind/Breeze Vector effect inside button */}
                <svg className="absolute right-0 top-0 h-full w-24 opacity-60 text-white/20 select-none pointer-events-none transform translate-x-4 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,50 Q25,20 50,50 T100,50 L100,100 L0,100 Z" fill="currentColor"></path>
                  <path d="M0,70 Q25,50 50,70 T100,70 L100,100 L0,100 Z" fill="currentColor" opacity="0.5"></path>
                </svg>
              </button>

              {/* SSL badge */}
              <div className="w-[125px] h-[46px] flex-shrink-0 bg-slate-50 border border-slate-200 rounded-xl flex items-center overflow-hidden">
                <div className="w-10 h-full bg-[#0b2540] flex items-center justify-center text-white">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col justify-center px-2 select-none leading-none">
                  <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">Secured</span>
                  <span className="text-[9px] font-medium text-slate-500 mt-0.5">256-bit SSL</span>
                </div>
              </div>
            </div>
          </form>
  
          {/* Message banner */}
          {message && (
            <div
              className={`mt-6 p-3 rounded-xl text-sm text-center font-medium transition-all ${
                message.startsWith("Logging in") || message.includes("Logging in")
                  ? "bg-sky-50 text-sky-700"
                  : message.startsWith("✅")
                  ? "bg-emerald-50 text-emerald-700"
                  : message.startsWith("⚠️")
                  ? "bg-amber-50 text-amber-700"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {message}
            </div>
          )}

          {/* Bottom Trust Badges */}
          <div className="mt-8 pt-6 border-t border-slate-100/80 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 mb-1">
                <Snowflake className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 leading-tight">24/7 Emergency Support</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 mb-1">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 leading-tight">Certified Technicians</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 mb-1">
                <Star className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 leading-tight">A+ Rated Service</span>
            </div>
          </div>

        </div>
      </div>
  
      {/* FORGOT PASSWORD MODAL BOX */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a2540]/30 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100/80 p-6 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <MdClose className="text-xl" />
            </button>
  
            <h3 className="text-xl font-bold text-slate-800 mb-1">Forgot Password?</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Enter your registered email address below and we'll send you a password reset link.
            </p>
  
            <form onSubmit={handleSendForgotEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-sky-200 outline-none text-sm focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all"
                  required
                />
              </div>
  
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
