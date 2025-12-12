import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";

/**
 * AddCustomerForm
 *
 * Props:
 * - open: boolean
 * - onClose: fn()
 * - onSuccess: fn()  // called after successful create/update
 * - baseApi: optional base url string
 * - customer: optional object (when provided → edit mode)
 */
export default function AddCustomerForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  customer = null
}) {
  const DEFAULT_API = "http://127.0.0.1:8000";
  const BASE_API = baseApi ?? DEFAULT_API;

  const [name, setName] = useState(customer?.name ?? "");
  const [contactNumber, setContactNumber] = useState(customer?.contact_number ?? "");
  const [landLineNumber, setLandLineNumber] = useState(customer?.land_line_no ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [pocName, setPocName] = useState(customer?.poc_name ?? "");
  const [pocContactNumber, setPocContactNumber] = useState(customer?.poc_contact_number ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [stateVal, setStateVal] = useState(customer?.state ?? "");
  const [pinCode, setPinCode] = useState(customer?.pin_code ?? "");
  const [bothAddressSame, setBothAddressSame] = useState(Boolean(customer?.both_address_is_same));
  const [siteAddress, setSiteAddress] = useState(customer?.site_address ?? "");
  const [siteCity, setSiteCity] = useState(customer?.site_city ?? "");
  const [siteState, setSiteState] = useState(customer?.site_state ?? "");
  const [sitePinCode, setSitePinCode] = useState(customer?.site_pin_code ?? "");

  const [loading, setLoading] = useState(false);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  // sync when customer or modal open changes
  useEffect(() => {
    setName(customer?.name ?? "");
    setContactNumber(customer?.contact_number ?? "");
    setLandLineNumber(customer?.land_line_no ?? "");
    setEmail(customer?.email ?? "");
    setPocName(customer?.poc_name ?? "");
    setPocContactNumber(customer?.poc_contact_number ?? "");
    setAddress(customer?.address ?? "");
    setCity(customer?.city ?? "");
    setStateVal(customer?.state ?? "");
    setPinCode(customer?.pin_code ?? "");
    setBothAddressSame(Boolean(customer?.both_address_is_same));
    setSiteAddress(customer?.site_address ?? "");
    setSiteCity(customer?.site_city ?? "");
    setSiteState(customer?.site_state ?? "");
    setSitePinCode(customer?.site_pin_code ?? "");
    setLoading(false);
  }, [customer, open]);

  if (!open) return null;

  const validate = () => {
    if (!name.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Name is required" });
      return false;
    }
    if (!contactNumber.toString().trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Contact number is required" });
      return false;
    }
    // basic email check (optional)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({ icon: "error", title: "Validation", text: "Email is invalid" });
      return false;
    }
    if (!address.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Address is required" });
      return false;
    }
    if (!city.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "City is required" });
      return false;
    }
    if (!stateVal.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "State is required" });
      return false;
    }
    if (!pinCode.toString().trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Pin code is required" });
      return false;
    }
    // if both_address_is_same false then site fields required
    if (!bothAddressSame) {
      if (!siteAddress.trim()) {
        Swal.fire({ icon: "error", title: "Validation", text: "Site address is required" });
        return false;
      }
      if (!siteCity.trim()) {
        Swal.fire({ icon: "error", title: "Validation", text: "Site city is required" });
        return false;
      }
      if (!siteState.trim()) {
        Swal.fire({ icon: "error", title: "Validation", text: "Site state is required" });
        return false;
      }
      if (!sitePinCode.toString().trim()) {
        Swal.fire({ icon: "error", title: "Validation", text: "Site pin code is required" });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        contact_number: contactNumber.toString(),
        land_line_no: landLineNumber.toString(),
        email: email ? String(email).trim() : "",
        poc_name: pocName.trim(),
        poc_contact_number: pocContactNumber.toString(),
        address: address.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        pin_code: pinCode.toString().trim(),
        both_address_is_same: Boolean(bothAddressSame),
      };

      // include site fields only when not same OR when provided (for edit)
      if (!bothAddressSame) {
        payload.site_address = siteAddress.trim();
        payload.site_city = siteCity.trim();
        payload.site_state = siteState.trim();
        payload.site_pin_code = sitePinCode.toString().trim();
      } else {
        payload.site_address = address.trim();
        payload.site_city = city.trim();
        payload.site_state = stateVal.trim();
        payload.site_pin_code = pinCode.toString().trim();
      }

      // choose endpoint & method
      const url = customer ? `${BASE_API}/api/lead/customer/${customer.id}/` : `${BASE_API}/api/lead/customer/`;
      const method = customer ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      let data;
      try { data = await res.json(); } catch (e) { data = {}; }

      if (!res.ok) {
        const msg = data?.detail || JSON.stringify(data) || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      Swal.fire({
        icon: "success",
        text: customer ? "Customer updated successfully" : "Customer added successfully",
        timer: 1200,
        showConfirmButton: false
      });

      onSuccess && onSuccess(data);
      onClose && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save customer" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 mt-8  bg-black/40 flex items-start sm:items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-lg relative max-h-[85vh] flex flex-col">
  
        {/* ---- FIXED HEADER ---- */}
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {customer ? "Edit Customer" : "Add Customer"}
          </h2>
          <button 
            onClick={onClose} 
            className="text-xl font-bold hover:text-red-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
  
        {/* ---- SCROLLABLE FORM BODY ---- */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <form className="space-y-4" onSubmit={handleSubmit}>
  
            {/* Name */}
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Name</label>
              <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
  
            {/* Contact Number */}
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Contact Number</label>
              <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
            </div>

            {/* company landLine no */}
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Landline Number <small>(optional)</small></label>
              <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={landLineNumber} onChange={e => setLandLineNumber(e.target.value)} />
            </div>
  
            {/* Email */}
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Email</label>
              <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            {/* POC name */}
            <div>
              <label className="text-sm text-slate-700 mb-1 block">POC Name</label>
              <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={pocName} onChange={e => setPocName(e.target.value)} />
            </div>

            {/* POC contact number */}
            <div>
              <label className="text-sm text-slate-700 mb-1 block">POC Contact</label>
              <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={pocContactNumber} onChange={e => setPocContactNumber(e.target.value)} />
            </div>
  
            {/* Billing Address */}
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Address</label>
              <textarea className="w-full px-3 py-2 rounded-md border border-slate-200"
                value={address} onChange={e => setAddress(e.target.value)} />
            </div>
  
            {/* City / State / Pin */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-slate-700 mb-1 block">City</label>
                <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                  value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1 block">State</label>
                <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                  value={stateVal} onChange={e => setStateVal(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1 block">Pin Code</label>
                <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                  value={pinCode} onChange={e => setPinCode(e.target.value)} />
              </div>
            </div>
  
            {/* Checkbox */}
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox"
                checked={bothAddressSame}
                onChange={(e) => setBothAddressSame(e.target.checked)} />
              Both address is same
            </label>
  
            {/* Site Address (Conditional Fields) */}
            {!bothAddressSame && (
              <>
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">Site Address</label>
                  <textarea className="w-full px-3 py-2 rounded-md border border-slate-200"
                    value={siteAddress} onChange={e => setSiteAddress(e.target.value)} />
                </div>
  
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">Site City</label>
                    <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                      value={siteCity} onChange={e => setSiteCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">Site State</label>
                    <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                      value={siteState} onChange={e => setSiteState(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">Site Pin</label>
                    <input className="w-full px-3 py-2 rounded-md border border-slate-200"
                      value={sitePinCode} onChange={e => setSitePinCode(e.target.value)} />
                  </div>
                </div>
              </>
            )}
  
            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
                Cancel
              </button>
              <button type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded"
                disabled={loading}>
                {loading ? (customer ? "Updating..." : "Saving...") : (customer ? "Update" : "Save")}
              </button>
            </div>
  
          </form>
        </div>
      </div>
    </div>
  );
  
}
