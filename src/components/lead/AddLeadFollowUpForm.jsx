import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import AddLeadProductForm from "./AddLeadProductForm";
import { MdClose, MdOutlineRemoveRedEye } from "react-icons/md";

// Local reusable component for Follow-up Product Details Modal
const FollowUpProductModal = ({ open, onClose, followUp, baseApi, token }) => {
  const [productDetails, setProductDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !followUp?.product_details) return;

    const fetchProductNames = async () => {
      setLoading(true);
      try {
        // Fetch all required data in parallel
        const [acTypesRes, acSubTypesRes, brandsRes, modelsRes, variantsRes] = await Promise.all([
          fetch(`${baseApi}/product/actype/?all=true`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${baseApi}/product/ac-subtypes/?all=true`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${baseApi}/product/ac-brand/?all=true`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${baseApi}/product/product-model/?all=true`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${baseApi}/product/product-variant/?all=true`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
        ]);

        const acTypes = await acTypesRes.json();
        const acSubTypes = await acSubTypesRes.json();
        const brands = await brandsRes.json();
        const models = await modelsRes.json();
        const variants = await variantsRes.json();

        // Create lookup maps
        const acTypeMap = {};
        const acSubTypeMap = {};
        const brandMap = {};
        const modelMap = {};
        const variantMap = {};

        // Map AC Types
        (Array.isArray(acTypes) ? acTypes : acTypes.results || []).forEach(type => {
          acTypeMap[type.id] = type.name;
        });

        // Map AC Sub Types
        (Array.isArray(acSubTypes) ? acSubTypes : acSubTypes.results || []).forEach(subType => {
          acSubTypeMap[subType.id] = subType.name;
        });

        // Map Brands
        (Array.isArray(brands) ? brands : brands.results || []).forEach(brand => {
          brandMap[brand.id] = brand.name;
        });

        // Map Models
        (Array.isArray(models) ? models : models.results || []).forEach(model => {
          modelMap[model.id] = model.name || model.model_no;
        });

        // Map Variants
        (Array.isArray(variants) ? variants : variants.results || []).forEach(variant => {
          variantMap[variant.id] = variant.sku;
        });

        // Map product details with names
        const mappedProducts = followUp.product_details.map(product => ({
          ...product,
          ac_type_name: acTypeMap[product.ac_type] || product.ac_type,
          ac_sub_type_name: acSubTypeMap[product.ac_sub_type] || product.ac_sub_type,
          brand_name: brandMap[product.brand] || product.brand,
          product_model_name: modelMap[product.product_model] || product.product_model,
          variant_name: variantMap[product.variant] || product.variant,
        }));

        setProductDetails(mappedProducts);
      } catch (err) {
        console.error("Error fetching product names:", err);
        // Fallback to original data
        setProductDetails(followUp.product_details || []);
      } finally {
        setLoading(false);
      }
    };

    fetchProductNames();
  }, [open, followUp, baseApi, token]);

  if (!open || !followUp) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100"
        >
          <MdClose size={22} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Follow-up Product Details</h2>

        <div className="border rounded-lg p-4 mb-4 bg-slate-50">
          <h3 className="font-semibold mb-2">Follow-up Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-600">Followup Date:</span>{" "}
              {followUp.followup_date || "—"}
            </div>
            <div>
              <span className="font-medium text-slate-600">Next Followup:</span>{" "}
              {followUp.next_followup_date || "—"}
            </div>
            <div>
              <span className="font-medium text-slate-600">Status:</span>{" "}
              {followUp.status || "—"}
            </div>
          </div>
          {followUp.remarks && (
            <div className="mt-2 text-sm">
              <span className="font-medium text-slate-600">Remarks:</span>{" "}
              {followUp.remarks}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Product Details</h3>

          {loading ? (
            <div className="text-sm text-slate-500">Loading products...</div>
          ) : productDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-md">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">AC Type</th>
                    <th className="p-2 text-left">Sub Type</th>
                    <th className="p-2 text-left">Brand</th>
                    <th className="p-2 text-left">Model</th>
                    <th className="p-2 text-left">Variant</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Expected Price</th>
                    <th className="p-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {productDetails.map((product, index) => (
                    <tr key={product.id || index} className="border-t">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{product.ac_type_name || "—"}</td>
                      <td className="p-2">{product.ac_sub_type_name || "—"}</td>
                      <td className="p-2">{product.brand_name || "—"}</td>
                      <td className="p-2">{product.product_model_name || "—"}</td>
                      <td className="p-2">{product.variant_name || "—"}</td>
                      <td className="p-2 text-right">{product.quantity || 0}</td>
                      <td className="p-2 text-right">₹{product.expected_price || "0"}</td>
                      <td className="p-2">{product.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              No products added to this follow-up.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Local reusable component for Followup History Modal
const FollowupHistoryModal = ({ open, onClose, lead, onViewProducts }) => {
  if (!open || !lead) return null;

  return (
    <div className="bg-white rounded-md shadow-lg w-full max-w-3xl relative max-h-[85vh] flex flex-col">
      <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Followup History</h2>
        <button
          onClick={onClose}
          className="text-xl font-bold hover:text-red-500"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-4 overflow-y-auto flex-1">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Follow-up Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <span className="font-medium text-slate-600">Enquiry date:</span>{" "}
              {lead.enquiry_date || "—"}
            </div>
            <div>
              <span className="font-medium text-slate-600">Next followup:</span>{" "}
              {lead.followup_date || "—"}
            </div>
            <div>
              <span className="font-medium text-slate-600">Current status:</span>{" "}
              {lead.status || "—"}
            </div>
          </div>

          <div>
            <div className="font-medium text-slate-600 mb-2">Followup history</div>

            {lead.followups && lead.followups.length > 0 ? (
              <table className="w-full text-sm border border-slate-200 rounded-md overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Followup Date</th>
                    <th className="p-2 text-left">Next Followup</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Remarks</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lead.followups.map((fu, idx) => (
                    <tr key={fu.id} className="border-t align-top">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{fu.followup_date || "—"}</td>
                      <td className="p-2">{fu.next_followup_date || "—"}</td>
                      <td className="p-2">{fu.status || "—"}</td>
                      <td className="p-2">
                        <div>{fu.remarks || "—"}</div>

                        {fu.faq_answers && fu.faq_answers.length > 0 && (
                          <div className="mt-2 text-xs text-slate-600">
                            <div className="font-semibold mb-1">FAQs:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {fu.faq_answers.map((faq) => (
                                <li key={faq.id}>
                                  <span className="font-medium">
                                    {faq.faq_question}:
                                  </span>{" "}
                                  {faq.answer || "—"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => onViewProducts(fu)}
                          className="px-2 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300"
                          title="View Products"
                        >
                          <MdOutlineRemoveRedEye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-slate-500">
                No followups recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


/**
 * AddLeadFollowUpForm
 *
 * Props:
 * - open: boolean
 * - onClose: fn()
 * - onSuccess: fn(data)
 * - baseApi: optional base url string
 * - leadId: number (required for creating followup)
 * - followup: optional object (when provided → edit mode)
 */
export default function AddLeadFollowUpForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  leadId,
  followup = null,
}) {
  const DEFAULT_API = "http://127.0.0.1:8000";
  const BASE_API = baseApi ?? DEFAULT_API;

  // --- Form state ---
  const [followupDate, setFollowupDate] = useState(followup?.followup_date ?? "");
  const [nextFollowupDate, setNextFollowupDate] = useState(
    followup?.next_followup_date ?? ""
  );
  const [status, setStatus] = useState("in_process"); 
  const [remarks, setRemarks] = useState(followup?.remarks ?? "");
  const [showHistory, setShowHistory] = useState(false);

  // State for follow-up product modal
  const [showFollowUpProductModal, setShowFollowUpProductModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);

  // FAQ state
  const [faqList, setFaqList] = useState([]);             // [{id, question, ...}]
  const [faqAnswers, setFaqAnswers] = useState({});       // { [faqId]: answer }

  const [loading, setLoading] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
  const [leadData, setLeadData] = useState(null);

  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      "",
    []
  );



  useEffect(() => {
    if (!open || !leadId) return;



    const fetchLead = async () => {
      try {
        const res = await fetch(
          `${BASE_API}/lead/lead/${leadId}/`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!res.ok) throw new Error("Failed to load lead");

        const data = await res.json();
        setLeadData(data);
      } catch (err) {
        console.error("Lead fetch error:", err);
        setLeadData(null);
      }
    };

    fetchLead();
  }, [open, leadId, BASE_API, token]);

  // // Autofill date and status based on lead data
  // useEffect(() => {
  //   if (!leadData || followup) return; // Skip if editing existing followup

  //   // 1️⃣ Autofill followup date from lead's followup_date
  //   if (leadData.followup_date && !followupDate) {
  //     setFollowupDate(leadData.followup_date);
  //   }

  //   // 2️⃣ Autofill status based on date logic
  //   if (leadData.followup_date) {
  //     const followupDateObj = new Date(leadData.followup_date);
  //     const today = new Date();
  //     const diffTime = today - followupDateObj;
  //     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  //     if (diffDays < 0) {
  //       setStatus("open"); // Future date
  //     } else if (diffDays <= 7) {
  //       setStatus("in_process"); // Within a week
  //     } else {
  //       setStatus("closed"); // Overdue
  //     }
  //   } else {
  //     setStatus("open"); // Default if no date
  //   }
  // }, [leadData, followup, followupDate]);

  // useEffect(() => {
  //   if (!leadData) return;

  //   // 1️⃣ If editing followup → use its own status
  //   if (followup?.status) {
  //     setStatus(followup.status);
  //     return;
  //   }

  //   // 2️⃣ If previous followups exist → use last followup status
  //   if (leadData?.followups?.length > 0) {
  //     const lastFollowup = leadData.followups[leadData.followups.length - 1];
  //     setStatus(lastFollowup.status);
  //     return;
  //   }

  //   // 3️⃣ Auto-determine status based on followup date
  //   if (leadData.followup_date) {
  //     const followupDateObj = new Date(leadData.followup_date);
  //     const today = new Date();
  //     const diffTime = today - followupDateObj;
  //     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  //     if (diffDays < 0) {
  //       setStatus("open"); // Future date
  //     } else if (diffDays <= 7) {
  //       setStatus("in_process"); // Within a week  
  //     } else {
  //       setStatus("closed"); // Overdue
  //     }
  //   } else {
  //     setStatus("open"); // Default
  //   }
  // }, [leadData, followup]);



  const createEmptyProductRow = () => ({
    ac_type: "",
    ac_type_name: "",
    ac_sub_type: "",
    ac_sub_type_name: "",
    brand: "",
    brand_name: "",
    product_model: "",
    product_model_name: "",
    variant: "",
    variant_name: "",
    quantity: 1,
    expected_price: "",
    remarks: "",
    ac_sub_type_options: [],
    product_model_options: [],
    product_variant_options: []
  });

  const [products, setProducts] = useState([createEmptyProductRow()]);
  const [deletedProductIds, setDeletedProductIds] = useState([]);

  // sync when followup or modal open changes
  useEffect(() => {
    setFollowupDate(followup?.followup_date ?? "");

    setNextFollowupDate(followup?.next_followup_date ?? "");
    setStatus(followup?.status ?? "in_process"); // Use existing status when editing, default to in_process when creating
    setRemarks(followup?.remarks ?? "");

    // prefill FAQ answers when editing
    if (followup?.faq_answers?.length) {
      const initial = {};
      followup.faq_answers.forEach((item) => {
        // item should look like { faq, faq_question, answer, ... }
        initial[item.faq] = item.answer || "";
      });
      setFaqAnswers(initial);
    } else {
      setFaqAnswers({});
    }

    setLoading(false);
  }, [followup, open]);


  useEffect(() => {
    if (!open) return;
    console.log("Lead data for products:", leadData);
    if (leadData?.product_details?.length) {
      const mapped = leadData.product_details.map(p => ({
        id: p.id,

        ac_type: p.ac_type_id,
        ac_type_name: p.ac_type_name,

        ac_sub_type: p.ac_sub_type_id,
        ac_sub_type_name: p.ac_sub_type_name,

        brand: p.brand_id,
        brand_name: p.brand_name,

        product_model: p.product_model_id,
        product_model_name: p.product_model_name,

        variant: p.variant_id,
        variant_name: p.variant_name,

        quantity: p.quantity || 1,
        expected_price: p.expected_price || "",
        remarks: p.remarks || "",

        ac_sub_type_options: [],
        product_model_options: [],
        product_variant_options: []
      }));

      setProducts([...mapped, createEmptyProductRow()]);
    } else {
      setProducts([createEmptyProductRow()]);
    }
  }, [leadData, open]);


  // console.log("LEAD DATA:", leadData);
  // console.log("LEAD PRODUCTS:", leadData?.product_details);



  // load FAQ master list when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchFaqs = async () => {
      setFaqLoading(true);
      try {
        const res = await fetch(`${BASE_API}/lead/lead-faqs/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          // don't block follow-up if FAQ fails – just show warning
          console.error("Failed to load FAQs", await res.text());
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data?.results) ? data.results : data;

        setFaqList(items || []);

        // if editing and we already had faqAnswers from followup, keep them
        // for new followup, ensure all FAQs have keys in state
        setFaqAnswers((prev) => {
          const next = { ...prev };
          (items || []).forEach((faq) => {
            if (next[faq.id] === undefined) next[faq.id] = "";
          });
          return next;
        });
      } catch (err) {
        console.error("FAQ fetch error", err);
      } finally {
        setFaqLoading(false);
      }
    };

    fetchFaqs();
  }, [open, BASE_API, token]);

  if (!open) return null;

  const validate = () => {
    if (!leadId && !followup) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Lead is required to create follow-up.",
      });
      return false;
    }

    if (!followupDate) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Follow-up date is required",
      });
      return false;
    }

    if (!status) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Status is required",
      });
      return false;
    }

    return true;
  };

  const productPayload = products
    .filter(p => Number(p.quantity) > 0)
    .map(p => {
      // existing product (edit)
      if (p.id) {
        return {
          id: p.id,
          ac_type: Number(p.ac_type),
          ac_sub_type: Number(p.ac_sub_type),
          brand: Number(p.brand),
          product_model: Number(p.product_model),
          variant: Number(p.variant),
          quantity: Number(p.quantity),
          expected_price: Number(p.expected_price) || 0,
          remarks: p.remarks || ""
        };
      }

      // new product
      if (
        p.ac_type &&
        p.ac_sub_type &&
        p.brand &&
        p.product_model &&
        p.variant
      ) {
        return {
          ac_type: Number(p.ac_type),
          ac_sub_type: Number(p.ac_sub_type),
          brand: Number(p.brand),
          product_model: Number(p.product_model),
          variant: Number(p.variant),
          quantity: Number(p.quantity),
          expected_price: Number(p.expected_price) || 0,
          remarks: p.remarks || ""
        };
      }

      return null;
    })
    .filter(Boolean);


  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // build FAQ payload (only non-empty answers)
      const faqPayload = Object.entries(faqAnswers)
        .filter(([, ans]) => ans && ans.toString().trim() !== "")
        .map(([faqId, ans]) => ({
          faq: Number(faqId),
          answer: ans.toString().trim(),
        }));

      const payload = {
        lead: leadId,
        followup_date: followupDate,
        next_followup_date: nextFollowupDate || null,
        status,
        remarks: remarks.trim(),
        products: productPayload,
        deleted_products: deletedProductIds
      };


      console.log("payload:", payload)
      if (faqPayload.length) {
        payload.faq_answers = faqPayload;
      }

      const url = followup
        ? `${BASE_API}/lead/lead-followups/${followup.id}/`
        : `${BASE_API}/lead/lead-followups/`;
      const method = followup ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }

      if (!res.ok) {
        const msg =
          data?.detail || JSON.stringify(data) || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      Swal.fire({
        icon: "success",
        text: followup
          ? "Follow-up updated successfully"
          : "Follow-up added successfully",
        timer: 1200,
        showConfirmButton: false,
      });

      onSuccess && onSuccess(data);
      onClose && onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to save follow-up",
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50">
        <div className={`flex gap-4 transition-all duration-300 ${showHistory ? "max-w-6xl" : "max-w-3xl"} w-full`}>
          <div className={`bg-white rounded-md shadow-lg w-full relative max-h-[85vh] flex flex-col transition-all duration-300 ${showHistory ? "max-w-3xl" : "max-w-3xl mx-auto"}`}>
            {/* ---- FIXED HEADER ---- */}
            <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {followup ? "Edit Follow-up" : "Add Follow-up"}
              </h2>

              <div className="flex items-center gap-3">
                {/* Followup History BUTTON */}
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Followup History
                </button>

                {/* CLOSE BUTTON */}
                <button
                  onClick={onClose}
                  className="text-xl font-bold hover:text-red-500"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>


            {/* ---- SCROLLABLE FORM BODY ---- */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Follow-up Date + Next Follow-up Date in one row */}
                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-md border border-slate-200"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">
                      Next Follow-up Date (optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-md border border-slate-200"
                      value={nextFollowupDate}
                      onChange={(e) => setNextFollowupDate(e.target.value)}
                    />
                  </div>
                </div>


                {/* Status */}
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">Status</label>
                  <select
                    className="w-full px-3 py-2 rounded-md border border-slate-200"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_process">In Process</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">Remarks</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-md border border-slate-200"
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>


                <AddLeadProductForm
                  products={products}
                  setProducts={setProducts}
                  baseApi={baseApi}
                  authToken={token}
                  deletedProductIds={deletedProductIds}
                  setDeletedProductIds={setDeletedProductIds}
                />


                {/* FAQ section */}
                {faqList.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-semibold">Standard Questions</h3>
                      {faqLoading && (
                        <span className="text-xs text-slate-500">Loading…</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {faqList.map((faq) => (
                        <div key={faq.id}>
                          <label className="text-sm text-slate-700 mb-1 block">
                            {faq.question}
                          </label>
                          <textarea
                            className="w-full px-3 py-2 rounded-md border border-slate-200"
                            rows={2}
                            value={faqAnswers[faq.id] ?? ""}
                            onChange={(e) =>
                              setFaqAnswers((prev) => ({
                                ...prev,
                                [faq.id]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded"
                    disabled={loading}
                  >
                    {loading
                      ? followup
                        ? "Updating..."
                        : "Saving..."
                      : followup
                        ? "Update"
                        : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {showHistory && (
            <FollowupHistoryModal
              open={showHistory}
              onClose={() => setShowHistory(false)}
              lead={leadData}
              onViewProducts={(followUp) => {
                setSelectedFollowUp(followUp);
                setShowFollowUpProductModal(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Follow-up Product Details Modal */}
      <FollowUpProductModal
        open={showFollowUpProductModal}
        onClose={() => {
          setShowFollowUpProductModal(false);
          setSelectedFollowUp(null);
        }}
        followUp={selectedFollowUp}
        baseApi={BASE_API}
        token={token}
      />
    </>
  );
}
