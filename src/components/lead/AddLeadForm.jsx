import React, { useEffect, useMemo, useState } from "react";
import { FaUser } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import Swal from "sweetalert2";

/**
 * AddLeadForm
 *
 * Props:
 * - open: boolean
 * - onClose: fn()
 * - onSuccess: fn(data)
 * - baseApi: string (e.g. http://127.0.0.1:8000)
 * - token: string (JWT)
 * - lead: existing lead object (null = add, object = edit)
 */
export default function AddLeadForm({
  open,
  onClose,
  onSuccess,
  baseApi = "http://127.0.0.1:8000",
  token = "",
  lead = null,
}) {
  const API_URL = `${baseApi}/api/lead/lead/`;

  const [formData, setFormData] = useState({
    date: "",
    clientName: "",
    contactNumber: "",
    email: "",
    requirementDetails: "",
    hvacApplication: "",
    tonCapacity: "",
    leadSource: "",
    status: "",
    assignTo: "",
    creditedBy: "",
    followupDate: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);

  const authToken = useMemo(
    () =>
      token ||
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      "",
    [token]
  );

  // Populate on open / when editing
  useEffect(() => {
    if (!open) return;

    if (lead) {
      setFormData({
        date: lead.date || "",
        clientName: lead.customer_name || "",
        contactNumber: lead.customer_contact || "",
        email: lead.customer_email || "",
        requirementDetails: lead.requirements_details || "",
        hvacApplication: lead.hvac_application || "",
        tonCapacity: lead.capacity_required || "",
        leadSource: lead.lead_source || "",
        status: lead.status || "",
        assignTo: lead.assign_to || "",
        creditedBy: lead.creatd_by_details?.full_name || "",
        followupDate: lead.followup_date || "",
        remarks: lead.remarks || "",
      });
    } else {
      // reset for new lead
      setFormData({
        date: "",
        clientName: "",
        contactNumber: "",
        email: "",
        requirementDetails: "",
        hvacApplication: "",
        tonCapacity: "",
        leadSource: "",
        status: "",
        assignTo: "",
        creditedBy: "",
        followupDate: "",
        remarks: "",
      });
    }
    setLoading(false);
  }, [open, lead]);

  if (!open) return null;

  const assignOptions = [
    { id: 1, name: "name1" },
    { id: 2, name: "name2" },
    { id: 3, name: "name3" },
  ];

  // These should match your Django TextChoices values
  const leadSourceOptions = [
    { id: "google_ads", name: "Google Ads" },
    { id: "indiamart", name: "IndiaMART" },
    { id: "bni", name: "BNI" },
    { id: "other", name: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    // minimal validation – you can extend
    if (!formData.contactNumber.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Contact Number is required",
      });
      return false;
    }
    if (!formData.date) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Date is required",
      });
      return false;
    }
    if (!formData.leadSource) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Lead source is required",
      });
      return false;
    }
    if (!formData.status) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Status is required",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Map front-end state → backend payload
      const payload = {
        requirements_details: formData.requirementDetails || "",
        hvac_application: formData.hvacApplication || "",
        capacity_required: formData.tonCapacity || "",
        lead_source: formData.leadSource || null,   
        status: formData.status || null,           
        date: formData.date || null,
        followup_date: formData.followupDate || null,
        remarks: formData.remarks || "",
      };

      // When editing, preserve existing FKs unless you provide UI
      if (lead) {
        payload.customer = lead.customer ?? null;
        payload.assign_to = lead.assign_to ?? null;
        payload.creatd_by = lead.creatd_by ?? null;
      } else {
        // For now these stay null – you can later wire a proper customer / user select.
        payload.customer = null;
        payload.assign_to = null;
        payload.creatd_by = null;
      }

      const url = lead ? `${API_URL}${lead.id}/` : API_URL;
      const method = lead ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg =
          data?.detail || JSON.stringify(data) || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      Swal.fire({
        icon: "success",
        text: lead ? "Lead updated successfully" : "Lead added successfully",
        timer: 1200,
        showConfirmButton: false,
      });

      onSuccess && onSuccess(data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to save lead",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start sm:items-center p-6 z-50 mt-15">
      <div className="relative w-full max-w-2xl p-6 bg-white rounded-md shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl text-gray-500 hover:text-black"
        >
          <RxCross2 />
        </button>

        <h1 className="text-2xl font-bold text-center mb-4">
          {lead ? "Edit Lead" : "Add Lead"}
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* CUSTOMER DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Number */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Contact Number
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  name="contactNumber"
                  placeholder="Enter Contact Number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
                />
                <FaUser className="text-gray-500 text-xl" />
              </div>
            </div>

            {/* Customer Name (readonly for now) */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Customer Name
              </label>
              <input
                name="clientName"
                placeholder="Customer Name"
                value={formData.clientName}
                readOnly
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 bg-gray-100 placeholder-slate-400"
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Customer Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                readOnly
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 bg-gray-100 placeholder-slate-400"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-normal text-gray-600">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300"
              />
            </div>
          </div>

          {/* LEAD DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead Source */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Lead Source
              </label>
              <select
                name="leadSource"
                value={formData.leadSource}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300"
              >
                <option value="">Select Lead Source</option>
                {leadSourceOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300"
              >
                <option value="">Select Status</option>
                <option value="open">Open</option>
                <option value="in_process">In Process</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Assign To (dummy options for now) */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Assign To
              </label>
              <select
                name="assignTo"
                value={formData.assignTo}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300"
              >
                <option value="">Assign To</option>
                {assignOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Credited By (display only for now) */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Credited By
              </label>
              <input
                name="creditedBy"
                placeholder="Enter name"
                value={formData.creditedBy}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Follow-up Date
              </label>
              <input
                type="date"
                name="followupDate"
                value={formData.followupDate}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300"
              />
            </div>
          </div>

          {/* PRODUCT / REQUIREMENTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-normal text-gray-600">
                HVAC Application
              </label>
              <input
                name="hvacApplication"
                placeholder="Enter HVAC Application"
                value={formData.hvacApplication}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-normal text-gray-600">
                TON / Capacity
              </label>
              <input
                name="tonCapacity"
                placeholder="Enter Ton / Capacity"
                value={formData.tonCapacity}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-normal text-gray-600">
              Requirement Details
            </label>
            <textarea
              name="requirementDetails"
              placeholder="Enter requirement"
              value={formData.requirementDetails}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="text-sm font-normal text-gray-600">
              Remarks
            </label>
            <textarea
              name="remarks"
              placeholder="Enter remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-400 rounded-md"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md"
              disabled={loading}
            >
              {loading ? (lead ? "Updating..." : "Saving...") : lead ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
