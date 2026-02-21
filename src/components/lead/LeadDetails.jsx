import { useEffect, useState } from "react";
import { MdClose, MdOutlineRemoveRedEye } from "react-icons/md";
import axios from "axios";

// Local reusable component for Follow-up Product Details Modal
const FollowUpProductModal = ({ open, onClose, followUp, baseApi, token }) => {
  const [productDetails, setProductDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !followUp?.product_details) return;

    const fetchProductNames = async () => {
      setLoading(true);
      try {
        // Auth headers
        const authHeaders = {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };

        // Fetch all required data in parallel using axios
        const [acTypesRes, acSubTypesRes, brandsRes, modelsRes, variantsRes] = await Promise.all([
          axios.get(`${baseApi}/api/product/actype/`, authHeaders),
          axios.get(`${baseApi}/api/product/ac-subtypes/`, authHeaders),
          axios.get(`${baseApi}/api/product/ac-brand/`, authHeaders),
          axios.get(`${baseApi}/api/product/product-model/`, authHeaders),
          axios.get(`${baseApi}/api/product/product-variant/`, authHeaders),
        ]);

        const acTypes = acTypesRes.data;
        const acSubTypes = acSubTypesRes.data;
        const brands = brandsRes.data;
        const models = modelsRes.data;
        const variants = variantsRes.data;

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100"
        >
          <MdClose size={22} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Follow-up Product Details</h2>

        {/* Follow-up Info */}
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

        {/* Product Details */}
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
                      <td className="p-2 text-right">
                        ₹{product.expected_price || "0"}
                      </td>
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

const LeadDetails = ({ open, onClose, leadId, baseApi, token }) => {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // State for follow-up product modal
  const [showFollowUpProductModal, setShowFollowUpProductModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);

  useEffect(() => {
    if (!open || !leadId) return;

    const fetchLead = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await axios.get(`${baseApi}/api/lead/lead/${leadId}/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        setLead(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || String(err));
        setLead(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [open, leadId, baseApi, token]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center mt-10 justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        {/* header */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100"
        >
          <MdClose size={22} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Enquiry Details</h2>

        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {!loading && !lead && !error && (
          <div className="text-sm text-slate-500">No data found</div>
        )}

        {!loading && lead && (
          <div className="space-y-4">
            {/* 1️⃣ Customer + Assigned To */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Customer & Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                {/* Customer */}
                <div>
                  <div className="font-medium text-slate-600 mb-1">Customer</div>
                  <div>Name: {lead.customer_name || "—"}</div>
                  <div>Contact: {lead.customer_contact || "—"}</div>
                  <div>Email: {lead.customer_email || "—"}</div>

                  <br />
                  <div>Project Name: {lead.project_name || "—"}</div>
                  <div>Address: {lead.project_adderess || "—"}</div>
                </div>

                {/* Assigned To */}
                <div>
                  <div className="font-medium text-slate-600 mb-1">Assigned To</div>
                  <div>Name: {lead.assign_to_details?.full_name || "—"}</div>
                  <div>Mobile: {lead.assign_to_details?.mobile_no || "—"}</div>
                  <div>Email: {lead.assign_to_details?.email || "—"}</div>
                </div>

                {/* Created By */}
                <div>
                  <div className="font-medium text-slate-600 mb-1">Created By</div>
                  <div>Name: {lead.creatd_by_details?.full_name || "—"}</div>
                  <div>Mobile: {lead.creatd_by_details?.mobile_no || "—"}</div>
                  <div>Email: {lead.creatd_by_details?.email || "—"}</div>
                </div>

                {/* Reference By */}
                <div>
                  <div className="font-medium text-slate-600 mb-1">Reference By</div>
                  <div>Name: {lead.referance_by_details?.full_name || "—"}</div>
                  <div>Mobile: {lead.referance_by_details?.mobile_no || "—"}</div>
                  <div>Email: {lead.referance_by_details?.email || "—"}</div>
                </div>
              </div>

            </div>

            {/* 2️⃣ Enquiry / Application / Source */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Enquiry Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-slate-600">
                    Requirements details:
                  </span>{" "}
                  {lead.requirements_details || "—"}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium text-slate-600">
                      Enquiry source:
                    </span>{" "}
                    {lead.lead_source || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">
                      Status:
                    </span>{" "}
                    {lead.status || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">
                      Remarks:
                    </span>{" "}
                    {lead.remarks || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* 2️⃣ Product Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Product Details</h3>

              {lead.product_details && lead.product_details.length > 0 ? (
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
                      {lead.product_details.map((product, index) => (
                        <tr key={product.id} className="border-t">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">{product.ac_type_name || "—"}</td>
                          <td className="p-2">{product.ac_sub_type_name || "—"}</td>
                          <td className="p-2">{product.brand_name || "—"}</td>
                          <td className="p-2">{product.product_model_name || "—"}</td>
                          <td className="p-2">{product.variant_name || "—"}</td>
                          <td className="p-2 text-right">{product.quantity || 0}</td>
                          <td className="p-2 text-right">
                            ₹{product.expected_price || "0"}
                          </td>
                          <td className="p-2">{product.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No products added to this lead.
                </div>
              )}
            </div>


            {/* 3️⃣ Follow-up details + fixed followups */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Follow-up Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="font-medium text-slate-600">Enquiry date:</span>{" "}
                  {lead.enquiry_date || "—"}
                </div>
                <div>
                  <span className="font-medium text-slate-600">
                    Next followup:
                  </span>{" "}
                  {lead.followup_date || "—"}
                </div>
                <div>
                  <span className="font-medium text-slate-600">
                    Current status:
                  </span>{" "}
                  {lead.status || "—"}
                </div>
              </div>

              {/* Fixed followup slots (static for now) */}
              <div>
                <div className="font-medium text-slate-600 mb-2">
                  Followup history
                </div>

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

                            {/* Optional: show FAQ answers under each followup */}
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
                              onClick={() => {
                                setSelectedFollowUp(fu);
                                setShowFollowUpProductModal(true);
                              }}
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


        )}
      </div>

      {/* Follow-up Product Details Modal */}
      <FollowUpProductModal
        open={showFollowUpProductModal}
        onClose={() => {
          setShowFollowUpProductModal(false);
          setSelectedFollowUp(null);
        }}
        followUp={selectedFollowUp}
        baseApi={baseApi}
        token={token}
      />
    </div>
  );
};

export default LeadDetails;
