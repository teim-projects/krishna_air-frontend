import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import AddLeadProductForm from "./AddLeadProductForm";


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
  const [status, setStatus] = useState(followup?.status ?? "open");
  const [remarks, setRemarks] = useState(followup?.remarks ?? "");

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
          `${BASE_API}/api/lead/lead/${leadId}/`,
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
    setStatus(followup?.status ?? "open");
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
  
    if (leadData?.product_details?.length) {
      const mapped = leadData.product_details.map(p => ({
        id: p.id,
  
        ac_type: "",
        ac_type_name: p.ac_type,
  
        ac_sub_type: "",
        ac_sub_type_name: p.ac_sub_type,
  
        brand: "",
        brand_name: p.brand,
  
        product_model: "",
        product_model_name: p.product_model,
  
        variant: "",
        variant_name: p.variant,
  
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
        const res = await fetch(`${BASE_API}/api/lead/lead-faqs/`, {
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
        ? `${BASE_API}/api/lead/lead-followups/${followup.id}/`
        : `${BASE_API}/api/lead/lead-followups/`;
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
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-lg relative max-h-[85vh] flex flex-col">
        {/* ---- FIXED HEADER ---- */}
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {followup ? "Edit Follow-up" : "Add Follow-up"}
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
            {/* Follow-up Date */}
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

            {/* Next Follow-up Date */}
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
    </div>
  );
}
