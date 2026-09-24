import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";
import loginBg from "../assets/login image.png";
import { Snowflake, Wrench, Star, Lock } from "lucide-react";

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
      let res = await fetch(`${BASE_API}/auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

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
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-3 bg-white relative font-sans overflow-hidden">
  
      {/* LEFT 2/3 PORTION: NEW AC WORKFLOW & BUILDING IMAGE */}
      <div className="hidden md:flex md:col-span-2 relative h-full w-full overflow-hidden select-none bg-[#d9effc]">
        <img 
          src={loginBg} 
          alt="Krisna Air Conditioning" 
          className="w-full h-full object-cover object-center pointer-events-none select-none"
        />
      </div>
  
      {/* RIGHT 1/3 PORTION: SOLID WHITE & ICE BLUE SIGN IN SECTION */}
      <div className="flex items-center justify-center p-6 lg:p-8 md:col-span-1 bg-gradient-to-b from-[#edf7fe] via-[#f5faff] to-[#e2f2fc] min-h-screen border-l border-sky-100/90 h-full">
        <div className="w-full max-w-[390px] bg-white rounded-3xl p-7 sm:p-8 shadow-[0_15px_40px_rgba(2,132,199,0.08)] border border-sky-100">
  
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-[#0a3861] tracking-tight">
              Sign in
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Krisna Air Conditioning Portal
            </p>
          </div>
  
          {/* Form (100% pure code, no images) */}
          <form onSubmit={handleSubmit} className="space-y-4">
  
            {/* Email/Mobile Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 pl-0.5">
                Email or Mobile
              </label>
              <input
                type="text"
                name="email_or_mobile"
                value={form.email_or_mobile}
                onChange={handleChange}
                placeholder="you@example.com or 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-300 bg-white text-slate-800 placeholder-slate-400 text-sm outline-none transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)] focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:shadow-[0_0_15px_rgba(56,189,248,0.4)]"
              />
            </div>
  
            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 pl-0.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-300 bg-white text-slate-800 placeholder-slate-400 text-sm outline-none transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)] focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:shadow-[0_0_15px_rgba(56,189,248,0.4)]"
              />
            </div>
  
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 focus:ring-offset-0 focus:ring-2 cursor-pointer" 
                />
                <span className="text-slate-600 text-xs font-medium">Remember me</span>
              </label>
  
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[#0284c7] hover:text-[#0369a1] font-semibold text-xs hover:underline focus:outline-none transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
  
            {/* Submit Button & SSL Badge Row */}
            <div className="flex gap-2.5 items-center pt-1.5">
              {/* Login Button with pure SVG wave */}
              <button
                type="submit"
                className="flex-1 h-11 px-5 rounded-xl text-white font-bold text-base bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0284c7] transition-all shadow-[0_4px_14px_rgba(56,189,248,0.35)] hover:shadow-[0_6px_20px_rgba(56,189,248,0.5)] active:scale-[0.98] cursor-pointer flex items-center justify-center relative overflow-hidden group"
              >
                <span className="relative z-10 font-bold tracking-wide">Login</span>
                {/* Wind/Breeze Splash Vector effect on the right */}
                <svg className="absolute right-[-4px] top-1/2 -translate-y-1/2 h-10 w-16 pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 70 40" fill="none">
                  <path d="M5,22 C18,10 38,34 58,16 C64,11 69,20 62,26 C52,34 32,15 12,24" fill="rgba(255,255,255,0.7)" />
                  <path d="M16,24 C28,15 44,31 59,20 C65,16 69,23 64,28 C55,34 39,17 22,25" fill="rgba(224,242,254,0.9)" />
                </svg>
              </button>
  
              {/* SSL badge */}
              <div className="h-11 px-2.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center gap-2 flex-shrink-0 shadow-xs">
                <div className="w-6 h-6 rounded-md bg-[#0a3861] flex items-center justify-center text-white">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col leading-tight select-none">
                  <span className="text-[10px] font-bold text-slate-800 tracking-tight">Secured</span>
                  <span className="text-[9px] text-slate-500 font-medium">256-bit SSL</span>
                </div>
              </div>
            </div>
          </form>
  
          {/* Message banner */}
          {message && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm text-center font-medium transition-all ${
                message.startsWith("Logging in") || message.includes("Logging in")
                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                  : message.startsWith("✅")
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : message.startsWith("⚠️")
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              {message}
            </div>
          )}
  
          {/* Bottom Trust Badges */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-1 select-none">
            <div className="flex items-center gap-1.5">
              <Snowflake className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
              <div className="text-[10px] font-semibold text-slate-600 leading-tight">
                <div>24/7 Emergency</div>
                <div>Support</div>
              </div>
            </div>
  
            <div className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
              <div className="text-[10px] font-semibold text-slate-600 leading-tight">
                <div>Certified</div>
                <div>Technicians</div>
              </div>
            </div>
  
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
              <div className="text-[10px] font-semibold text-slate-600 leading-tight">
                <div>A+ Rated</div>
                <div>Service</div>
              </div>
            </div>
          </div>
  
        </div>
      </div>
  
      {/* FORGOT PASSWORD MODAL BOX */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-sky-100 p-6 relative text-slate-800">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <MdClose className="text-xl" />
            </button>
  
            <h3 className="text-xl font-bold text-[#0a3861] mb-1">Forgot Password?</h3>
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
                  className="w-full px-3 py-2 rounded-lg border border-sky-300 outline-none text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
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
