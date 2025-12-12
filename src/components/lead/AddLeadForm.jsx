import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaUser } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import Swal from "sweetalert2";
import { fetchCustomerByPhone } from "../customers/customerLookup";
import { useUserRole } from '../../hooks/useAuth';
import AddCustomerForm from "../customers/AddCustomerForm";

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
  const API_URL = `${baseApi.replace(/\/$/, "")}/api/lead/lead/`;
  const { userRole, isLoading: loadingRole } = useUserRole(baseApi);
  const [formData, setFormData] = useState({
    date: "",
    clientName: "",
    contactNumber: "",
    email: "",
    projectName:"",
    projectAddress:"",
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

  // NEW: keep matched customer id
  const [customerId, setCustomerId] = useState(null);
  const [assignOptions, setAssignOptions] = useState([]);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [assignId, setAssignId] = useState(null);
  // const [userRole, setUserRole] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);


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


  // for debounce + abort
  const lookupTimerRef = useRef(null);
  const lookupAbortRef = useRef(null);

  

  // Fetch sales staff when modal opens
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoadingAssign(true);

    const url = `${baseApi.replace(/\/$/, "")}/api/auth/staff/?search=sales`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText} ${txt}`);
        }
        return res.json();
      })
      .then((data) => {
        // expects paginated { results: [...] } or an array directly
        const items = Array.isArray(data) ? data : data.results ?? [];
        const mapped = items.map((u) => ({
          id: u.id,
          name: u.first_name,
          last_name: u.last_name,
        }));
        setAssignOptions(mapped);
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          // aborted — fine
        } else {
          console.error("Failed to fetch staff:", err);
          setAssignOptions([]);
        }
      })
      .finally(() => setLoadingAssign(false));

    return () => controller.abort();
    // Only refetch when modal opens, baseApi or authToken change
  }, [open, baseApi, authToken]);

  // Populate on open / when editing
  useEffect(() => {
    if (!open) return;

    if (lead) {
      setFormData({
        date: lead.date || "",
        clientName: lead.customer_name || "",
        contactNumber: lead.customer_contact || "",
        email: lead.customer_email || "",
        projectName:lead.project_name || "",
        projectAddress:lead.project_adderess || "",
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
      setCustomerId(lead.customer ?? null);
    } else {
      // reset for new lead
      setFormData({
        date: "",
        clientName: "",
        contactNumber: "",
        email: "",
        projectName:"",
        project_adderess:"",
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
      setCustomerId(null);
    }
    setLoading(false);
    // cancel any pending lookup
    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
    if (lookupAbortRef.current) {
      try {
        lookupAbortRef.current.abort();
      } catch { }
      lookupAbortRef.current = null;
    }
  }, [open, lead]);

  if (!open) return null;





  // These should match your Django TextChoices values
  const leadSourceOptions = [
    { id: "google_ads", name: "Google Ads" },
    { id: "indiamart", name: "IndiaMART" },
    { id: "bni", name: "BNI" },
    { id: "other", name: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "assignTo") {
      setAssignId(value === "" ? null : Number(value));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // NEW: debounced contact handler that calls the simple fetch function
  const handleContactChange = (e) => {
    const phone = e.target.value;
    // update UI instantly
    setFormData((prev) => ({ ...prev, contactNumber: phone }));

    // clear previous timer
    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
    // abort previous fetch
    if (lookupAbortRef.current) {
      try {
        lookupAbortRef.current.abort();
      } catch { }
      lookupAbortRef.current = null;
    }

    // If empty, clear customer info
    if (!phone || phone.trim() === "") {
      setCustomerId(null);
      setFormData((prev) => ({ ...prev, clientName: "", email: "" }));
      setLoadingLookup(false);
      return;
    }

    // wait 500ms after typing stops
    lookupTimerRef.current = setTimeout(async () => {
      lookupTimerRef.current = null;
      setLoadingLookup(true);

      // use AbortController so we can cancel fetch if user types again
      const controller = new AbortController();
      lookupAbortRef.current = controller;

      try {
        // fetchCustomerByPhone is your headless single-file util; pass baseApi & token
        const customer = await fetchCustomerByPhone(baseApi, authToken, phone, {
          signal: controller.signal,
        });

        // NOTE: fetchCustomerByPhone, as provided earlier, doesn't accept signal.
        // If your version doesn't accept signal, the abort won't work — that's OK but recommended to add support.
        // Treat the result:
        if (customer) {
          setCustomerId(customer.id ?? null);
          setFormData((prev) => ({
            ...prev,
            clientName: customer.full_name ?? customer.name ?? "",
            email: customer.email ?? "",
          }));
        } else {
          setCustomerId(null);
          setFormData((prev) => ({ ...prev, clientName: "", email: "" }));
        }
      } catch (err) {
        // if aborted, ignore; otherwise log
        if (err?.name === "AbortError") {
          // aborted by typing — ignore
        } else {
          console.error("Customer lookup error:", err);
          // keep UX quiet; do not clear name/email here unless you want to
          setCustomerId(null);
          setFormData((prev) => ({ ...prev, clientName: "", email: "" }));
        }
      } finally {
        lookupAbortRef.current = null;
        setLoadingLookup(false);
      }
    }, 500);
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
        project_name: formData.projectName || "",
        project_adderess: formData.projectAddress || "",
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
        // if we resolved a new customerId from lookup, prefer it; otherwise preserve lead.customer
        payload.customer = customerId ?? lead.customer ?? null;
        payload.assign_to = assignId;
      } else {
        payload.customer = customerId ?? null;
        payload.assign_to = assignId;

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
                  onChange={handleContactChange}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
                />

                <button
                  type="button" // Important to prevent form submission
                  onClick={() => setShowCustomerForm(true)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors" // Add hover style for visual cue
                  title="Add/Edit Customer Details"
                >
                  <FaUser className="text-gray-500 text-xl" />
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {loadingLookup ? "Looking up customer..." : customerId ? `Matched customer id: ${customerId}` : ""}
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

            <div>
              <label className="text-sm font-normal text-gray-600">
                Project Name
              </label>
              <input
                name="projectName"
                placeholder="Project Name"
                value={formData.projectName}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-normal text-gray-600">
                Project Address
              </label>
              <input
                name="projectAddress"
                placeholder="Project address"
                value={formData.projectAddress}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
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

          {/* ... rest unchanged ... */}
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
            {userRole.name !== "sales" && (

              <div>
                <label className="text-sm font-normal text-gray-600">
                  Assign To
                </label>
                <select
                  name="assignTo"
                  value={formData.assignTo} // <--- The value is here
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300"
                >
                  <option value="">Assign To</option>
                  {assignOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} {o.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

           

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
      {/* 👇 NEW: Render the Customer Form conditionally */}
      <AddCustomerForm
        open={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        baseApi={baseApi}
        token={authToken} // use the memoized token
        // Optional: Pass initial data if adding a new customer
        initialData={{
          contact: formData.contactNumber,
          email: formData.email,
          name: formData.clientName
        }}
        // Optional: Handle success (e.g., if a new customer is created,
        // you might want to automatically update customerId here)
        onSuccess={(newCustomer) => {
          setShowCustomerForm(false);
          // If successful, update the Lead Form state with the new customer info
          if (newCustomer?.id) {
            setCustomerId(newCustomer.id);
            setFormData(prev => ({
              ...prev,
              clientName:  newCustomer.name,
              contactNumber: newCustomer.contact_number,
              email: newCustomer.email
            }));
          }
        }}
      />
    </div>
  );
}
