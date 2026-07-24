import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";

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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-50 relative">
  
      {/* LEFT WELCOME SECTION */}
      <div className="hidden md:flex flex-col justify-center px-16 bg-gradient-to-br from-sky-100 to-sky-200 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-300 opacity-20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-52 h-52 bg-sky-400 opacity-20 rounded-full blur-xl"></div>
  
        <h1 className="text-5xl font-extrabold text-sky-700 leading-tight drop-shadow-sm z-10">
          Welcome to <br /> Krisna Air Conditioning
        </h1>
  
        <p className="mt-6 text-lg text-sky-700 max-w-md z-10">
          Premium Cooling, Trusted Service — providing modern AC solutions for your comfort. 
        </p>
  
        <p className="mt-4 text-sm text-sky-600 opacity-80 z-10">
          Creating healthier, cooler environments since 2005.
        </p>
      </div>
  
      {/* RIGHT LOGIN FORM */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-lg border border-slate-100">
  
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">
            Sign in
          </h2>
  
          <p className="text-sm text-slate-500 text-center mb-8">
            Login using your registered mobile number or email.
          </p>
  
          <form onSubmit={handleSubmit} className="space-y-5">
  
            {/* Email/Mobile */}
            <div>
              <label className="text-sm text-slate-600 font-medium">
                Email or Mobile
              </label>
              <input
                type="text"
                name="email_or_mobile"
                value={form.email_or_mobile}
                onChange={handleChange}
                placeholder="you@example.com or 9876543210"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 
                           focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              />
            </div>
  
            {/* Password */}
            <div>
              <label className="text-sm text-slate-600 font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 
                           focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              />
            </div>
  
            <div className="flex items-center justify-between text-sm">
              {/* Remember */}
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="rounded text-sky-500 focus:ring-sky-300" />
                <span className="text-slate-600">Remember me</span>
              </label>
  
              {/* Forgot Password Link */}
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sky-600 hover:text-sky-700 font-medium hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
  
            {/* Submit */}
            <button
              className="w-full py-3 rounded-md text-white font-semibold 
                         bg-sky-500 hover:bg-sky-600 transition-all duration-200 shadow-sm"
            >
              Login
            </button>
          </form>
  
          {/* Message */}
          {message && (
            <div
              className={`mt-6 p-3 rounded-md text-sm text-center font-medium transition-all ${
                message.startsWith("✅")
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : message.startsWith("⚠️")
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL BOX */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-100 p-6 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <MdClose className="text-xl" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 mb-1">Forgot Password?</h3>
            <p className="text-sm text-slate-500 mb-5">
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
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm transition-all disabled:opacity-50"
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
