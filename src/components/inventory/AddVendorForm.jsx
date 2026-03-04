import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import ReusableForm from "../Form";
import { StateSelect } from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import { GetState } from "react-country-state-city";

// ========== GST State Code Mapping ==========
const INDIAN_STATES_GST = {
  "Jammu and Kashmir": { code: "JK", gst: "01" },
  "Himachal Pradesh": { code: "HP", gst: "02" },
  "Punjab": { code: "PB", gst: "03" },
  "Chandigarh": { code: "CH", gst: "04" },
  "Uttarakhand": { code: "UK", gst: "05" },
  "Haryana": { code: "HR", gst: "06" },
  "Delhi": { code: "DL", gst: "07" },
  "Rajasthan": { code: "RJ", gst: "08" },
  "Uttar Pradesh": { code: "UP", gst: "09" },
  "Bihar": { code: "BR", gst: "10" },
  "Sikkim": { code: "SK", gst: "11" },
  "Arunachal Pradesh": { code: "AR", gst: "12" },
  "Nagaland": { code: "NL", gst: "13" },
  "Manipur": { code: "MN", gst: "14" },
  "Mizoram": { code: "MZ", gst: "15" },
  "Tripura": { code: "TR", gst: "16" },
  "Meghalaya": { code: "ML", gst: "17" },
  "Assam": { code: "AS", gst: "18" },
  "West Bengal": { code: "WB", gst: "19" },
  "Jharkhand": { code: "JH", gst: "20" },
  "Odisha": { code: "OR", gst: "21" },
  "Chhattisgarh": { code: "CG", gst: "22" },
  "Madhya Pradesh": { code: "MP", gst: "23" },
  "Gujarat": { code: "GJ", gst: "24" },
  "Daman and Diu": { code: "DD", gst: "25" },
  "Dadra and Nagar Haveli": { code: "DN", gst: "26" },
  "Maharashtra": { code: "MH", gst: "27" },
  "Andhra Pradesh": { code: "AP", gst: "28" },
  "Karnataka": { code: "KA", gst: "29" },
  "Goa": { code: "GA", gst: "30" },
  "Lakshadweep": { code: "LD", gst: "31" },
  "Kerala": { code: "KL", gst: "32" },
  "Tamil Nadu": { code: "TN", gst: "33" },
  "Puducherry": { code: "PY", gst: "34" },
  "Andaman and Nicobar Islands": { code: "AN", gst: "35" },
  "Telangana": { code: "TG", gst: "36" },
  "Andhra Pradesh (New)": { code: "AD", gst: "37" },
  "Ladakh": { code: "LA", gst: "38" }
};

// Helper function to get state code with GST
const getStateCode = (stateName) => {
  const state = INDIAN_STATES_GST[stateName];
  if (!state) return "";
  return `${state.code}/${state.gst}`;
};

export default function AddVendorForm({
  open,
  onClose,
  onSuccess,
  base_api,
  vendor = null
}) {
  const BASE_API = base_api;
  const INDIA_ID = 101;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    company_type: "",
    office_address: "",
    store_address: "",
    supplier_category: "",
    gst_details: "",
    pan_details: "",
    state: "",
    state_code: "",
    office_poc_name: "",
    office_poc_phone: "",
    store_poc_name: "",
    store_poc_phone: "",
    website: "",
    bank_details: "",
  });

  const [loading, setLoading] = useState(false);
  const [stateid, setStateid] = useState(0);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  useEffect(() => {
    if (!vendor || !open) {
      setFormData({
        name: "",
        email: "",
        mobile: "",
        company_type: "",
        office_address: "",
        store_address: "",
        supplier_category: "",
        gst_details: "",
        pan_details: "",
        state: "",
        state_code: "",
        office_poc_name: "",
        office_poc_phone: "",
        store_poc_name: "",
        store_poc_phone: "",
        website: "",
        bank_details: "",
      });
      setStateid(0);
      return;
    }

    setFormData({
      name: vendor.name || "",
      email: vendor.email || "",
      mobile: vendor.mobile || "",
      company_type: vendor.company_type || "",
      office_address: vendor.office_address || "",
      store_address: vendor.store_address || "",
      supplier_category: vendor.supplier_category || "",
      gst_details: vendor.gst_details || "",
      pan_details: vendor.pan_details || "",
      state: vendor.state || "",
      state_code: vendor.state_code || "",
      office_poc_name: vendor.office_poc_name || "",
      office_poc_phone: vendor.office_poc_phone || "",
      store_poc_name: vendor.store_poc_name || "",
      store_poc_phone: vendor.store_poc_phone || "",
      website: vendor.website || "",
      bank_details: vendor.bank_details || "",
    });

    if (vendor.state) {
      GetState(INDIA_ID).then((states) => {
        const matchedState = states.find(
          s => s.name.toLowerCase() === vendor.state?.toLowerCase()
        );
        if (matchedState) {
          setStateid(matchedState.id);
        }
      });
    }
  }, [vendor, open]);

  if (!open) return null;

  const validate = () => {
    if (!formData.name.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Name is required" });
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Swal.fire({ icon: "error", title: "Validation", text: "Valid email is required" });
      return false;
    }
    if (!formData.mobile.trim() || formData.mobile.length !== 10) {
      Swal.fire({ icon: "error", title: "Validation", text: "Mobile must be 10 digits" });
      return false;
    }
    if (!formData.office_address.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Office address is required" });
      return false;
    }
    if (!formData.gst_details.trim() || formData.gst_details.length !== 15) {
      Swal.fire({ icon: "error", title: "Validation", text: "GST must be 15 characters" });
      return false;
    }
    if (!formData.office_poc_name.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Office POC name is required" });
      return false;
    }
    if (!formData.office_poc_phone.trim() || formData.office_poc_phone.length !== 10) {
      Swal.fire({ icon: "error", title: "Validation", text: "Office POC phone must be 10 digits" });
      return false;
    }
    if (formData.pan_details && formData.pan_details.length !== 10) {
      Swal.fire({ icon: "error", title: "Validation", text: "PAN must be 10 characters" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (data) => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...data,
        gst_details: data.gst_details.toUpperCase(),
        pan_details: data.pan_details ? data.pan_details.toUpperCase() : null,
        company_type: data.company_type || null,
        bank_details: data.bank_details || null,
        store_address: data.store_address || null,
        supplier_category: data.supplier_category || null,
        store_poc_name: data.store_poc_name || null,
        store_poc_phone: data.store_poc_phone || null,
        website: data.website || null,
      };


      const url = vendor ? `${BASE_API}/inventory/vendors/${vendor.id}/` : `${BASE_API}/inventory/vendors/`;
      const method = vendor ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      let responseData;
      try { responseData = await res.json(); } catch (e) { responseData = {}; }

      if (!res.ok) {
        const msg = responseData?.detail || JSON.stringify(responseData) || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      Swal.fire({
        icon: "success",
        text: vendor ? "Vendor updated successfully" : "Vendor added successfully",
        timer: 1200,
        showConfirmButton: false
      });

      onSuccess && onSuccess(responseData);
      onClose && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save vendor" });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name", label: "Name", type: "text", required: true, gridCols: 1, placeholder: "Enter vendor name" },
    { name: "email", label: "Email", type: "email", required: true, gridCols: 1, placeholder: "vendor@example.com" },
    { name: "mobile", label: "Mobile", type: "phone", required: true, maxLength: 10, gridCols: 1, placeholder: "9876543210" },
    { name: "company_type", label: "Company type", type: "text", gridCols: 1, placeholder: "e.g., Pvt Ltd, LLP" },
    { name: "office_address", label: "Office address", type: "textarea", required: true, rows: 2, gridCols: 2, placeholder: "Enter office address" },
    { name: "store_address", label: "Store address", type: "textarea", rows: 2, gridCols: 2, placeholder: "Enter store address" },
    { name: "supplier_category", label: "Supplier category", type: "text", gridCols: 1, placeholder: "e.g., Electronics, Hardware" },
    { name: "gst_details", label: "Gst details", type: "text", required: true, maxLength: 15, gridCols: 1, placeholder: "22AAAAA0000A1Z5" },
    { name: "pan_details", label: "Pan details", type: "text", maxLength: 10, gridCols: 1, placeholder: "ABCDE1234F" },
    {
      name: "state",
      label: "State",
      type: "component",
      gridCols: 1,
      required: true,
      component: ({ value, onChange }) => (
        <div className="input-like-select">
          <StateSelect
            countryid={INDIA_ID}
            defaultValue={vendor && stateid ? { id: stateid, name: value } : null}
            onChange={(e) => {
              setStateid(e.id);
              onChange(e.name);
              // Use our GST code mapping
              const stateCode = getStateCode(e.name);
              setFormData(prev => ({ ...prev, state_code: stateCode }));
            }}
            placeHolder="Select State"
          />
        </div>
      )
    },
    { name: "state_code", label: "State Code", type: "text", disabled: true, gridCols: 1, placeholder: "Auto-filled" },
    { name: "office_poc_name", label: "Office poc name", type: "text", required: true, gridCols: 1, placeholder: "Contact person name" },
    { name: "office_poc_phone", label: "Office poc phone", type: "phone", required: true, maxLength: 10, gridCols: 1, placeholder: "9876543210" },
    { name: "store_poc_name", label: "Store poc name", type: "text", gridCols: 1, placeholder: "Store contact name" },
    { name: "store_poc_phone", label: "Store poc phone", type: "phone", maxLength: 10, gridCols: 1, placeholder: "9876543210" },
    { name: "website", label: "Website", type: "url", gridCols: 2, placeholder: "https://example.com" },
    { name: "bank_details", label: "Bank details", type: "textarea", rows: 2, gridCols: 2, placeholder: "Bank name, Account number, IFSC code" },
  ];

  return (
    <>
      <div className="fixed inset-0 mt-8 bg-black/40 flex items-start sm:items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-lg w-full max-w-2xl relative max-h-[85vh] flex flex-col">

          {/* FIXED HEADER */}
          <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {vendor ? "Edit Vendor" : "Add Vendor"}
            </h2>
            <button
              onClick={onClose}
              className="text-xl font-bold hover:text-red-500"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* SCROLLABLE FORM BODY */}
          <div className="px-6 py-4 overflow-y-auto flex-1">
            <ReusableForm
              fields={fields}
              formData={formData}
              onChange={setFormData}
              onSubmit={handleSubmit}
              loading={loading}
              submitText={vendor ? "Update" : "Save"}
              onCancel={onClose}
              showCancel={true}
            />
          </div>
        </div>
      </div>

      <style>
        {`
          .input-like-select .rsc-select-container {
            width: 100%;
          }
          
          .input-like-select input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 0px solid #e2e8f0;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            background-color: #fff;
          }
          
          .input-like-select input:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 1px #6366f1;
          }
          
          .input-like-select svg {
            display: none !important;
          }
          
          .input-like-select .rsc-select-input {
            padding-right: 0.75rem !important;
          }
        `}
      </style>
    </>
  );
}
