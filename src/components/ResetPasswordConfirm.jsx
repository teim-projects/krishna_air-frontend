import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaLock, FaExclamationCircle } from "react-icons/fa";

const ResetPasswordConfirm = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const CONFIRM_ENDPOINT = `${BASE_API}/auth/password-reset-confirm/`;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isExpired) {
      Swal.fire({
        icon: "error",
        title: "Link Already Used",
        text: "This reset link has already been used or expired. Please request a new link.",
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill in both password fields.",
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    if (newPassword.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Weak Password",
        text: "Password must be at least 8 characters long.",
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords Do Not Match",
        text: "The new password and confirm password do not match. Please re-enter.",
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(CONFIRM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uidb64: uid,
          token: token,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsExpired(true);
        let errorMsg = "Invalid or expired reset link.";
        if (data.token) {
          errorMsg = Array.isArray(data.token) ? data.token[0] : String(data.token);
        } else if (data.uidb64) {
          errorMsg = Array.isArray(data.uidb64) ? data.uidb64[0] : String(data.uidb64);
        } else if (data.detail) {
          errorMsg = String(data.detail);
        }

        Swal.fire({
          icon: "error",
          title: "Link Invalid or Used",
          text: errorMsg.includes("Invalid or expired token")
            ? "This password reset link has already been used or has expired. Please request a new link."
            : errorMsg,
          confirmButtonColor: "#0284c7",
        });
        return;
      }

      // Invalidate link locally after successful reset
      setIsExpired(true);

      // SweetAlert2 Success Popup
      Swal.fire({
        icon: "success",
        title: "Password Reset Successfully!",
        text: "Your password has been changed. Redirecting to the Sign in page...",
        confirmButtonColor: "#0284c7",
        timer: 2500,
        timerProgressBar: true,
      }).then(() => {
        navigate("/login");
      });
    } catch (error) {
      console.error("Reset password error:", error);
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
      {/* LEFT WELCOME SECTION (Matching Login page) */}
      <div className="hidden md:flex flex-col justify-center px-16 bg-gradient-to-br from-sky-100 to-sky-200 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-300 opacity-20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-52 h-52 bg-sky-400 opacity-20 rounded-full blur-xl"></div>

        <h1 className="text-5xl font-extrabold text-sky-700 leading-tight drop-shadow-sm z-10">
          Reset Your Password <br /> Krishna Air
        </h1>

        <p className="mt-6 text-lg text-sky-700 max-w-md z-10">
          Create a new secure password for your account. Ensure it is at least 8 characters long.
        </p>

        <p className="mt-4 text-sm text-sky-600 opacity-80 z-10">
          Premium Cooling, Trusted Service — keeping your account safe and secure.
        </p>
      </div>

      {/* RIGHT RESET PASSWORD FORM */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-lg border border-slate-100">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">
            Set New Password
          </h2>

          <p className="text-sm text-slate-500 text-center mb-8">
            Please enter your new password below.
          </p>

          {isExpired ? (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-2">
                <FaExclamationCircle className="text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Link Disabled or Used</h3>
              <p className="text-sm text-slate-600">
                This password reset link has already been used or is no longer valid.
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-md shadow transition duration-200 text-center"
              >
                Go to Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="text-sm text-slate-600 font-medium">New Password</label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 
                               focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm text-slate-600 font-medium">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 
                               focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-md shadow transition duration-200 disabled:opacity-50"
              >
                {loading ? "Resetting Password..." : "Set New Password"}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
                  Back to Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordConfirm;
