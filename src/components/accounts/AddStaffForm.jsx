import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { State, City } from "country-state-city";

export default function AddStaffForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  roles = [],
  staff = null
}) {
  const [email, setEmail] = useState(staff?.email || "");
  const [mobile, setMobile] = useState(staff?.mobile_no || "");
  const [firstName, setFirstName] = useState(staff?.first_name || "");
  const [lastName, setLastName] = useState(staff?.last_name || "");
  const [role, setRole] = useState(staff?.role?.id || "");
  const [address, setAddress] = useState(staff?.address || "");
  const [state, setState] = useState(staff?.state || "");
  const [city, setCity] = useState(staff?.city || "");
  const [pincode, setPincode] = useState(staff?.pincode || "");
  const [dateOfJoining, setDateOfJoining] = useState(staff?.date_of_joining || "");
  const [password, setPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const BASE_API = baseApi;

  const token = useMemo(() => localStorage.getItem("access") || "", []);
  const states = useMemo(() => State.getStatesOfCountry("IN"), []);

  const cities = useMemo(() => {
    if (!state) return [];
    const selectedState = states.find((item) => item.name === state);
    return selectedState ? City.getCitiesOfState("IN", selectedState.isoCode) : [];
  }, [state, states]);

  useEffect(() => {
    setEmail(staff?.email || "");
    setMobile(staff?.mobile_no || "");
    setFirstName(staff?.first_name || "");
    setLastName(staff?.last_name || "");
    setRole(staff?.role?.id || "");
    setAddress(staff?.address || "");
    setState(staff?.state || "");
    setCity(staff?.city || "");
    setPincode(staff?.pincode || "");
    setDateOfJoining(staff?.date_of_joining || "");
    setPassword("");
    setChangePassword(false);
  }, [staff, open]);

  if (!open) return null;

  const validate = () => {
    if (!email.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Email is required" });
      return false;
    }
    if (!mobile.toString().trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Mobile is required" });
      return false;
    }
    if (!firstName.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "First name is required" });
      return false;
    }
    if (!role) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please select a role" });
      return false;
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
      Swal.fire({ icon: "error", title: "Validation", text: "Pincode must be 6 digits" });
      return false;
    }
    if (!staff || changePassword) {
      if (!password || password.length < 6) {
        Swal.fire({ icon: "error", title: "Validation", text: "Password must be at least 6 characters" });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const payload = {
      email,
      mobile_no: mobile,
      first_name: firstName,
      last_name: lastName,
      role,
      address,
      city,
      state,
      pincode,
      date_of_joining: dateOfJoining || null,
    };

    if (!staff || changePassword) payload.password = password;

    const url = staff
      ? `${BASE_API}/auth/staff/${staff.id}/`
      : `${BASE_API}/auth/staff/`;

    const method = staff ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      let data;
      try { data = await res.json(); } catch (e) { data = {}; }

      if (!res.ok) {
        throw new Error(data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data) || `${res.status} ${res.statusText}`);
      }

      Swal.fire({
        icon: "success",
        text: staff ? "Staff updated successfully" : "Staff added successfully",
        timer: 1200,
        showConfirmButton: false
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to save staff"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">

        <button onClick={onClose} className="absolute right-3 top-3 text-xl" aria-label="Close">✕</button>

        <h2 className="text-lg font-semibold mb-4">
          {staff ? "Edit Staff" : "Add Staff"}
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Row 1: Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700 mb-1 block">First name</label>
              <input
                className="w-full px-3 py-2 rounded-md border border-slate-200"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-slate-700 mb-1 block">Last name</label>
              <input
                className="w-full px-3 py-2 rounded-md border border-slate-200"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Email</label>
              <input
                className="w-full px-3 py-2 rounded-md border border-slate-200"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-slate-700 mb-1 block">Mobile</label>
              <input
                className="w-full px-3 py-2 rounded-md border border-slate-200"
                placeholder="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-700 mb-1 block">Role</label>
            <select
              className="w-full px-3 py-2 rounded-md border border-slate-200"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select Role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-700 mb-1 block">Address</label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-slate-200"
              placeholder="Address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700 mb-1 block">State</label>
              <select
                className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setCity("");
                }}
              >
                <option value="">Select State</option>
                {states.map((item) => (
                  <option key={item.isoCode} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-700 mb-1 block">City</label>
              <select
                className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!state}
              >
                <option value="">
                  {!state ? "Select State First" : "Select City"}
                </option>
                {cities.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Pincode</label>
              <input
                className="w-full px-3 py-2 rounded-md border border-slate-200"
                placeholder="Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>

            <div>
              <label className="text-sm text-slate-700 mb-1 block">Date of Joining</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
              />
            </div>
          </div>

          {!staff ? (
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Password</label>
              <input className="w-full px-3 py-2 rounded-md border border-slate-200" placeholder="Password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} />
                <span>Change password</span>
              </label>

              {changePassword && (
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">New password</label>
                  <input className="w-full px-3 py-2 rounded-md border border-slate-200" placeholder="New password (min 6 chars)" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded">Cancel</button>

            <button type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded"
              disabled={loading}>
              {loading ? (staff ? "Updating..." : "Saving...") : (staff ? "Update" : "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
