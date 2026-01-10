import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaUser } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import Swal from "sweetalert2";
import { fetchCustomerByPhone } from "../customers/customerLookup";
import { useUserRole } from '../../hooks/useAuth';
import AddCustomerForm from "../customers/AddCustomerForm";



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
    enquiry_date: "",
    clientName: "",
    contactNumber: "",
    email: "",
    secondary_email: "",
    address: "",
    projectName: "",
    projectAddress: "",
    requirementDetails: "",
    hvacApplication: "",
    tonCapacity: "",
    leadSource: "",
    leadSourceInput: "",
    status: "",
    assignTo: "",
    creditedBy: "",
    referance_by: "",
    followupDate: "",
    remarks: "",
  });



  // NEW: keep matched customer id
  const [customerId, setCustomerId] = useState(null);
  const [assignOptions, setAssignOptions] = useState([]);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [assignId, setAssignId] = useState(null);


  const [loading, setLoading] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [referenceOptions, setReferenceOptions] = useState([]);
  const [loadingReference, setLoadingReference] = useState(false);
  const [showLeadSourceInput, setShowLeadSourceInput] = useState(false);
  const [latestLead, setLatestLead] = useState(null);
  const [loadingLatestLead, setLoadingLatestLead] = useState(false);


  const leadSourceOptions = [
    { id: "google_ads", name: "Google Ads", needsInput: false },
    { id: "indiamart", name: "IndiaMART", needsInput: false },
    { id: "bni", name: "BNI", needsInput: true },
    { id: "justdial", name: "Justdial", needsInput: false },
    { id: "reference", name: "Reference", needsInput: true },
    { id: "architect/interior_designer", name: "Architect Interior Designer", needsInput: true },
    { id: "builder", name: "Builder", needsInput: true },
    { id: "existing_customer", name: "Existing Customer", needsInput: true },
    { id: "ka_staff", name: "KA Staff", needsInput: true },
    { id: "other", name: "Other", needsInput: true },
  ];



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

  // featch all staff records
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoadingReference(true);

    const url = `${baseApi.replace(/\/$/, "")}/api/auth/staff/all`;

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
        const items = Array.isArray(data) ? data : data.results ?? [];
        setReferenceOptions(
          items.map((u) => ({
            id: u.id,
            name: `${u.first_name} ${u.last_name}`,
          }))
        );
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch reference staff:", err);
          setReferenceOptions([]);
        }
      })
      .finally(() => setLoadingReference(false));

    return () => controller.abort();
  }, [open, baseApi, authToken]);



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

      const selected = leadSourceOptions.find(
        opt => opt.id === lead.lead_source
      );

      setFormData({
        enquiry_date: lead.enquiry_date || "",
        clientName: lead.customer_name || "",
        contactNumber: lead.customer_contact || "",
        email: lead.customer_email || "",
        secondary_email: lead.customer_secondary_email || "",
        address: lead.customer_address || "",
        projectName: lead.project_name || "",
        projectAddress: lead.project_adderess || "",
        requirementDetails: lead.requirements_details || "",
        hvacApplication: lead.hvac_application || "",
        tonCapacity: lead.capacity_required || "",
        leadSource: lead.lead_source || "",
        leadSourceInput: lead.lead_source_input || "",
        status: lead.status || "",
        assignTo: lead.assign_to || "",
        creditedBy: lead.creatd_by_details?.full_name || "",
        referance_by: lead.referance_by || "",
        followupDate: lead.followup_date || "",
        remarks: lead.remarks || "",
      });
      setCustomerId(lead.customer ?? null);
      setAssignId(lead.assign_to ?? null);
      setShowLeadSourceInput(!!selected?.needsInput);
    } else {
      // reset for new lead
      setFormData({
        enquiry_date: "",
        clientName: "",
        contactNumber: "",
        email: "",
        secondary_email: "",
        address: "",
        projectName: "",
        project_adderess: "",
        requirementDetails: "",
        hvacApplication: "",
        tonCapacity: "",
        leadSource: "",
        leadSourceInput: "",
        status: "",
        assignTo: "",
        creditedBy: "",
        referance_by: "",
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



  const fetchLatestLeadByMobile = async (mobile) => {
    if (!mobile) return;

    setLoadingLatestLead(true);
    try {
      const res = await fetch(
        `${baseApi.replace(/\/$/, "")}/api/lead/lead/latest-lead-by-mobile/?mobile=${mobile}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        }
      );

      if (!res.ok) {
        setLatestLead(null);
        return;
      }

      const data = await res.json();
      setLatestLead(data);

      // 🔹 OPTIONAL: Auto-fill some fields from latest lead
      setFormData((prev) => ({
        projectName: data.project_name || prev.projectName,
        projectAddress: data.project_adderess || prev.projectAddress,
      }));

    } catch (err) {
      console.error("Latest lead fetch error:", err);
      setLatestLead(null);
    } finally {
      setLoadingLatestLead(false);
    }
  };




  // These should match your Django TextChoices values



  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "assignTo") {
      setAssignId(value === "" ? null : Number(value));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearError = (e) => {
    e.target.classList.remove("input-error");
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
            secondary_email: customer.secondary_email ?? "",
            address: customer.address ?? "",
          }));

          fetchLatestLeadByMobile(phone);
        } else {
          setCustomerId(null);
          setFormData((prev) => ({ ...prev, clientName: "", email: "", secondary_email: "", address: "" }));
        }
      } catch (err) {
        // if aborted, ignore; otherwise log
        if (err?.name === "AbortError") {
          // aborted by typing — ignore
        } else {
          console.error("Customer lookup error:", err);
          // keep UX quiet; do not clear name/email here unless you want to
          setCustomerId(null);
          setFormData((prev) => ({ ...prev, clientName: "", email: "", secondary_email: "" }));
        }
      } finally {
        lookupAbortRef.current = null;
        setLoadingLookup(false);
      }
    }, 500);
  };


  // Input validations and errors

  const showError = (field, message) => {
    Swal.fire({
      icon: "error",
      title: "Validation",
      text: message,
    });

    const el = document.querySelector(`[name="${field}"]`);
    if (el) {
      el.classList.add("input-error");
      el.focus();
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validate = () => {
    if (!formData.contactNumber.trim()) {
      showError("contactNumber", "Contact Number is required");
      return false;
    }

    if (!formData.clientName) {
      showError("clientName", "Client Name is required");
      return false;
    }

    if (!formData.email) {
      showError("email", "Email is required");
      return false;
    }

    if (!emailRegex.test(formData.email)) {
      showError("email", "Please enter a valid email address");
      return false;
    }

    if (!formData.address) {
      showError("address", "Address is required");
      return false;
    }

    if (!formData.enquiry_date) {
      showError("enquiry_date", "Enquiry Date is required");
      return false;
    }

    if (!formData.leadSource) {
      showError("leadSource", "Lead source is required");
      return false;
    }

    const selectedSource = leadSourceOptions.find(
      opt => opt.id === formData.leadSource
    );

    if (selectedSource?.needsInput && !formData.leadSourceInput.trim()) {
      showError("leadSource", "Please enter lead source details");
      return false;
    }

    if (!formData.status) {
      showError("status", "Status is required");
      return false;
    }

    if (!formData.referance_by) {
      showError("referance_by", "Referance By is required");
      return false;
    }

    return true;
  };


  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {

      let finalCustomerId = customerId;

      // ✅ Create customer ONLY if not exists
      if (!finalCustomerId) {
        if (!formData.clientName.trim()) {
          throw new Error("Customer name is required");
        }

        const customerRes = await fetch(
          `${baseApi.replace(/\/$/, "")}/api/lead/customer/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
              contact_number: formData.contactNumber,
              name: formData.clientName,
              email: formData.email,
              secondary_email: formData.secondary_email,
              address: formData.address,
            }),
          }
        );

        if (!customerRes.ok) {
          const txt = await customerRes.text();
          throw new Error(txt || "Failed to create customer");
        }

        const newCustomer = await customerRes.json();
        finalCustomerId = newCustomer.id;
      }



      // Map front-end state → backend payload
      const payload = {
        project_name: formData.projectName || "",
        project_adderess: formData.projectAddress || "",
        requirements_details: formData.requirementDetails || "",
        hvac_application: formData.hvacApplication || "",
        capacity_required: formData.tonCapacity || "",
        lead_source: formData.leadSource || null,
        lead_source_input: showLeadSourceInput
          ? formData.leadSourceInput
          : null,
        status: formData.status || null,
        referance_by: formData.referance_by || null,
        enquiry_date: formData.enquiry_date || null,
        followup_date: formData.followupDate || null,
        remarks: formData.remarks || "",
      };

      // When editing, preserve existing FKs unless you provide UI
      if (lead) {
        // if we resolved a new customerId from lookup, prefer it; otherwise preserve lead.customer
        payload.customer = finalCustomerId;
        payload.assign_to = assignId;
      } else {
        payload.customer = finalCustomerId;
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
    <>
      <style>
        {`
      .input-error {
        border: 2px solid red !important;
      }
    `}
      </style>
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
            {lead ? "Edit Enquiry" : "Add Enquiry"}
          </h1>

          {loadingLatestLead && (
            <div className="text-xs text-blue-500 mt-1">
              Fetching latest enquiry...
            </div>
          )}

          {latestLead && (
            <div className="text-xs text-green-600 mt-1">
              Last Project: {latestLead.project_name} | {latestLead.address}
            </div>
          )}

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
                    onChange={(e) => {
                      clearError(e);
                      handleContactChange(e);
                    }}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
                  />

                  {/* <button
                  type="button" // Important to prevent form submission
                  onClick={() => setShowCustomerForm(true)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors" // Add hover style for visual cue
                  title="Add/Edit Customer Details"
                >
                  <FaUser className="text-gray-500 text-xl" />
                </button> */}
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
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
                  readOnly={!!customerId}
                  className={`w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400 ${customerId ? "bg-gray-100" : ""
                    }`}
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
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
                  readOnly={!!customerId}
                  className={`w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400 ${customerId ? "bg-gray-100" : ""
                    }`}
                />

              </div>

              {/* Secondary Email (readonly) */}
              <div>
                <label className="text-sm font-normal text-gray-600">
                  Customer Secondary Email
                </label>
                <input
                  type="email"
                  name="secondary_email"
                  placeholder="Email Address"
                  value={formData.secondary_email}
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
                  readOnly={!!customerId}
                  className={`w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400 ${customerId ? "bg-gray-100" : ""
                    }`}
                />

              </div>


              <div>
                <label className="text-sm font-normal text-gray-600">
                  Address
                </label>
                <textarea
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
                  readOnly={!!customerId}
                  rows={2}
                  className={`w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400 
                  ${customerId ? "bg-gray-100" : ""}`}
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
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
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
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 placeholder-slate-400"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-normal text-gray-600">Enquiry Date</label>
                <input
                  type="date"
                  name="enquiry_date"
                  value={formData.enquiry_date}
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
                  readOnly={!!lead}
                  className={`w-full mt-1 px-3 py-2 rounded-md border border-slate-300 
                  ${lead ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
              </div>
            </div>

            {/* ... rest unchanged ... */}
            {/* LEAD DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


              <div>
                <label className="text-sm font-normal text-gray-600">
                Enquiry Source
                </label>

                <select
                  name="leadSource"
                  value={formData.leadSource}
                  onChange={(e) => {
                    clearError(e);

                    const selected = leadSourceOptions.find(
                      opt => opt.id === e.target.value
                    );

                    setFormData(prev => ({
                      ...prev,
                      leadSource: e.target.value,
                      leadSourceInput: ""   // reset on change
                    }));

                    setShowLeadSourceInput(!!selected?.needsInput);
                  }}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300"
                >
                  <option value="">Select Enquiry Source</option>
                  {leadSourceOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>


                {/* 👇 SAME FIELD STORED */}
                {showLeadSourceInput && (
                  <input
                    type="text"
                    name="leadSourceInput"
                    placeholder="Enter details"
                    value={formData.leadSourceInput}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        leadSourceInput: e.target.value
                      }))
                    }
                    className="w-full mt-2 px-3 py-2 rounded-md border border-slate-300"
                    required
                  />
                )}

              </div>



              {/* Status */}
              <div>
                <label className="text-sm font-normal text-gray-600">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
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
                    value={formData.assignTo}
                    onChange={(e) => {
                      clearError(e);
                      handleChange(e);
                    }}
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

              <div>
                <label className="text-sm font-normal text-gray-600">
                  Enquiry Generate By
                </label>

                <select
                  name="referance_by"
                  value={formData.referance_by}
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300"
                >
                  <option value="">Select</option>

                  {referenceOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                {loadingReference && (
                  <div className="text-xs text-gray-500 mt-1">
                    Loading references...
                  </div>
                )}
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
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
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
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
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
                  onChange={(e) => {
                    clearError(e);
                    handleChange(e);
                  }}
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
                onChange={(e) => {
                  clearError(e);
                  handleChange(e);
                }}
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
                onChange={(e) => {
                  clearError(e);
                  handleChange(e);
                }}
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
                clientName: newCustomer.name,
                contactNumber: newCustomer.contact_number,
                email: newCustomer.email
              }));
            }
          }}
        />
      </div>
    </>
  );
}
