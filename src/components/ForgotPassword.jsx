import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const RESET_ENDPOINT = `${BASE_API}/auth/password-reset/`;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter your registered email address.",
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(RESET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errorMsg = "Could not process password reset request.";
        if (data.email) {
          errorMsg = Array.isArray(data.email) ? data.email.join(" ") : String(data.email);
        } else if (data.detail) {
          errorMsg = String(data.detail);
        }

        Swal.fire({
          icon: "error",
          title: "Request Failed",
          text: errorMsg,
          confirmButtonColor: "#0284c7",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Reset Link Sent!",
        text: `Password reset instructions have been sent to ${cleanEmail}. Please check your email inbox.`,
        confirmButtonColor: "#0284c7",
      }).then(() => {
        navigate("/login");
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Unable to connect to server. Please try again later.",
        confirmButtonColor: "#0284c7",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-50 relative">
      {/* LEFT WELCOME SECTION */}
      <div className="hidden md:flex flex-col justify-center px-16 bg-gradient-to-br from-sky-100 to-sky-200 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-300 opacity-20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-52 h-52 bg-sky-400 opacity-20 rounded-full blur-xl"></div>

        <h1 className="text-5xl font-extrabold text-sky-700 leading-tight drop-shadow-sm z-10">
          Forgot Password? <br /> Krishna Air
        </h1>

        <p className="mt-6 text-lg text-sky-700 max-w-md z-10">
          No worries! Enter your registered email address and we'll send you a password reset link.
        </p>

        <p className="mt-4 text-sm text-sky-600 opacity-80 z-10">
          Premium Cooling, Trusted Service — keeping your account safe.
        </p>
      </div>

      {/* RIGHT FORGOT PASSWORD FORM */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-lg border border-slate-100">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">
            Forgot Password
          </h2>

          <p className="text-sm text-slate-500 text-center mb-8">
            Enter your registered email address to receive a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-slate-600 font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 
                           focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-md shadow transition duration-200 disabled:opacity-50"
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
                Back to Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
