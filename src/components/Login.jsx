import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";
import loginBg from "../assets/login_bg.jpg";
import { Snowflake, Wrench, Star, Lock, ShieldCheck, Sparkles, Gauge } from "lucide-react";

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
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-3 bg-[#f8fafc] relative font-sans overflow-hidden">
  
      {/* 1/3 PORTION (LEFT): AC IMAGE SHOWCASE BANNER */}
      <div className="hidden md:flex flex-col justify-between p-6 sm:p-8 bg-[#e1f2fc] border-r border-sky-200/60 relative overflow-hidden select-none md:col-span-1 h-full">
        
        {/* 3D AC Equipment Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-45 pointer-events-none mix-blend-multiply"
          style={{ backgroundImage: `url(${loginBg})` }}
        ></div>

        {/* Ambient Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#d5edfd]/90 via-[#e5f4fe]/85 to-[#f2f9ff]/95 pointer-events-none"></div>

        {/* TOP ROW: TEXT IN TOP-LEFT CORNER, SPINNING AC FAN IN TOP-RIGHT CORNER */}
        <div className="flex items-start justify-between gap-3 w-full relative z-10">
          
          {/* Top-Left Corner: Brand & Title Information */}
          <div className="flex-1 pr-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/85 backdrop-blur-md text-[#0284c7] text-[10px] font-bold tracking-wider uppercase mb-2 border border-sky-200/70 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] animate-ping"></span>
              Krisna AC
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a3861] leading-tight drop-shadow-xs">
              Welcome to <br />
              <span className="text-[#0284c7]">Krisna Air Conditioning</span>
            </h1>
            <p className="mt-2 text-xs text-slate-700 leading-relaxed font-normal">
              Premium Cooling, Trusted Service — providing modern AC solutions for your comfort.
            </p>
            <p className="mt-1 text-[11px] text-[#0369a1] font-medium">
              Creating healthier, cooler environments since 2005.
            </p>
          </div>

          {/* Top-Right Corner: Spinning AC Fan Unit */}
          <div className="flex-shrink-0 pt-0.5">
            <div className="relative group">
              {/* Cold breeze aura glow */}
              <div className="absolute -inset-1.5 bg-cyan-400/25 rounded-full blur-md animate-pulse"></div>

              {/* Fan housing unit */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/90 backdrop-blur-md border border-white shadow-[0_8px_20px_rgba(56,189,248,0.25)] flex items-center justify-center p-2">
                {/* Circular Fan Guard */}
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-sky-50 to-sky-100/90 border border-sky-200 flex items-center justify-center overflow-hidden shadow-inner">
                  
                  {/* Concentric rings */}
                  <div className="absolute inset-1 rounded-full border border-sky-200/60 pointer-events-none"></div>
                  <div className="absolute inset-2.5 rounded-full border border-sky-200/40 pointer-events-none"></div>

                  {/* Rotating AC Fan Blades */}
                  <div className="w-full h-full flex items-center justify-center animate-[spin_2s_linear_infinite]">
                    <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-15 sm:h-15 text-[#0284c7] drop-shadow-xs" fill="currentColor">
                      {/* Center Hub */}
                      <circle cx="50" cy="50" r="11" fill="#0369a1" />
                      <circle cx="50" cy="50" r="4.5" fill="#bae6fd" />
                      {/* 4 Aerodynamic Blades */}
                      <path d="M50,39 C46,24 35,9 50,4 C59,9 56,24 50,39 Z" opacity="0.95" />
                      <path d="M61,50 C76,46 91,35 96,50 C91,59 76,56 61,50 Z" opacity="0.95" />
                      <path d="M50,61 C54,76 65,91 50,96 C41,91 44,76 50,61 Z" opacity="0.95" />
                      <path d="M39,50 C24,54 9,65 4,50 C9,41 24,44 39,50 Z" opacity="0.95" />
                    </svg>
                  </div>

                  {/* LED Indicator */}
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-ping"></div>
                </div>

                {/* Active cooling badge */}
                <span className="absolute -bottom-2 px-2 py-0.5 bg-[#0284c7] text-white text-[8px] font-bold rounded-full tracking-wider uppercase shadow-xs">
                  Active Fan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: 3 TRUST PILLS */}
        <div className="mt-5 flex flex-wrap gap-2 relative z-10">
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/90 shadow-xs">
            <Snowflake className="w-3.5 h-3.5 text-[#0284c7]" />
            <span className="font-bold text-[#0a3861] text-[11px] tracking-wide">Premium Cooling</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/90 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
            <span className="font-bold text-[#0a3861] text-[11px] tracking-wide">Trusted Service</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/90 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
            <span className="font-bold text-[#0a3861] text-[11px] tracking-wide">Modern Solutions</span>
          </div>
        </div>

        {/* BOTTOM SECTION: 3D AC EQUIPMENT MONITORING CARDS */}
        <div className="mt-6 relative z-10">
          <div className="rounded-2xl bg-white/75 backdrop-blur-md border border-white/90 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">AC Equipment Active</span>
              </div>
              <span className="text-[10px] font-bold text-sky-600 bg-sky-100/90 px-2 py-0.5 rounded-md">Cooling 22°C</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-sky-50/90 rounded-xl p-2 flex flex-col items-center text-center border border-sky-100">
                <Gauge className="w-4 h-4 text-sky-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">95 PSI</span>
                <span className="text-[8px] text-slate-500">Pressure</span>
              </div>

              <div className="bg-sky-50/90 rounded-xl p-2 flex flex-col items-center text-center border border-sky-100">
                <Wrench className="w-4 h-4 text-sky-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">Certified</span>
                <span className="text-[8px] text-slate-500">Technician</span>
              </div>

              <div className="bg-sky-50/90 rounded-xl p-2 flex flex-col items-center text-center border border-sky-100">
                <Snowflake className="w-4 h-4 text-sky-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">Turbo</span>
                <span className="text-[8px] text-slate-500">Inverter</span>
              </div>
            </div>
          </div>
        </div>

      </div>
  
      {/* 2/3 PORTION (RIGHT): LOGIN FORM */}
      <div className="flex items-center justify-center p-6 lg:p-12 md:col-span-2 bg-[#f8fafc] h-full">
        <div className="w-full max-w-[430px] bg-white p-8 sm:p-10 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.06)] border border-slate-100">
  
          <h2 className="text-3xl font-extrabold text-[#111827] text-center mb-7 tracking-tight">
            Sign in
          </h2>
  
          <form onSubmit={handleSubmit} className="space-y-5">
  
            {/* Email/Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email or Mobile
              </label>
              <input
                type="text"
                name="email_or_mobile"
                value={form.email_or_mobile}
                onChange={handleChange}
                placeholder="you@example.com or 9876543210"
                className="w-full px-4 py-2.5 rounded-xl border border-sky-400 bg-white text-slate-800 placeholder-slate-400 text-sm outline-none transition-all shadow-[0_0_12px_rgba(56,189,248,0.32)] focus:border-sky-500 focus:shadow-[0_0_18px_rgba(56,189,248,0.48)]"
              />
            </div>
  
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-xl border border-sky-400 bg-white text-slate-800 placeholder-slate-400 text-sm outline-none transition-all shadow-[0_0_12px_rgba(56,189,248,0.32)] focus:border-sky-500 focus:shadow-[0_0_18px_rgba(56,189,248,0.48)]"
              />
            </div>
  
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 focus:ring-offset-0 focus:ring-2 cursor-pointer" 
                />
                <span className="text-slate-600 text-xs sm:text-sm font-medium">Remember me</span>
              </label>
  
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[#0284c7] hover:text-[#0369a1] font-semibold text-xs sm:text-sm hover:underline focus:outline-none transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
  
            {/* Submit Button & SSL Badge Row */}
            <div className="flex gap-2.5 items-center pt-1.5">
              {/* Login Button */}
              <button
                type="submit"
                className="flex-1 h-11 px-5 rounded-xl text-white font-bold text-base bg-gradient-to-r from-[#60a5fa] via-[#38bdf8] to-[#22d3ee] hover:from-[#3b82f6] hover:to-[#0284c7] transition-all shadow-[0_4px_16px_rgba(56,189,248,0.4)] hover:shadow-[0_6px_22px_rgba(56,189,248,0.55)] active:scale-[0.98] cursor-pointer flex items-center justify-center relative overflow-hidden group"
              >
                <span className="relative z-10 font-bold tracking-wide">Login</span>
                {/* Wind/Breeze Splash Vector effect on the right */}
                <svg className="absolute right-[-4px] top-1/2 -translate-y-1/2 h-10 w-16 pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 70 40" fill="none">
                  <path d="M5,22 C18,10 38,34 58,16 C64,11 69,20 62,26 C52,34 32,15 12,24" fill="rgba(255,255,255,0.7)" />
                  <path d="M16,24 C28,15 44,31 59,20 C65,16 69,23 64,28 C55,34 39,17 22,25" fill="rgba(224,242,254,0.9)" />
                </svg>
              </button>

              {/* SSL badge */}
              <div className="h-11 px-2.5 bg-[#f1f5f9] border border-slate-200/90 rounded-xl flex items-center gap-2 flex-shrink-0 shadow-sm">
                <div className="w-6 h-6 rounded-md bg-[#0f2942] flex items-center justify-center text-white">
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
              className={`mt-5 p-3 rounded-xl text-sm text-center font-medium transition-all ${
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
          <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between gap-1 select-none">
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
                  className="w-full px-3 py-2 rounded-lg border border-sky-300 outline-none text-sm focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)]"
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
