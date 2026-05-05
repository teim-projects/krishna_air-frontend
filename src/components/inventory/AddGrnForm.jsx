import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import ReusableForm from "../Form";
import axios from "axios";

export default function AddGrnForm({
  open,
  onClose,
  onSuccess,
  base_api,
  grn = null
}) {
  const BASE_API = base_api;

  const [formData, setFormData] = useState({
    purchase_order: "",
    grn_date: "",
    products: [],
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poProducts, setPoProducts] = useState([]);
  const [selectedPoId, setSelectedPoId] = useState(null);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  // Reset step when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      if (!grn) {
        setFormData({
          purchase_order: "",
          grn_date: "",
          products: [],
        });
        setSelectedPoId(null);
        setPoProducts([]);
      }
    }
  }, [open]);

  // Fetch purchase orders on modal open
  useEffect(() => {
    if (open) {
      fetchPurchaseOrders();
    }
  }, [open]);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get(`${BASE_API}/inventory/purchase-orders/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = response.data.results || response.data;
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch purchase orders",
      });
    }
  };

  // Fetch PO products when PO is selected
  useEffect(() => {
    if (selectedPoId && open) {
      fetchPoProducts(selectedPoId);
    }
  }, [selectedPoId, open]);

  const fetchPoProducts = async (poId) => {
    try {
      const response = await axios.get(
        `${BASE_API}/inventory/purchase-orders/${poId}/products/`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const products = response.data.results || response.data;
      const productsWithQty = Array.isArray(products)
        ? products.map((p) => ({
            ...p,
            received_quantity: 0,
            rejected_quantity: 0,
          }))
        : [];

      setPoProducts(productsWithQty);
      setFormData((prev) => ({
        ...prev,
        products: productsWithQty,
      }));
    } catch (error) {
      console.error("Error fetching PO products:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch purchase order products",
      });
    }
  };

  // If editing existing GRN
  useEffect(() => {
    if (grn && open) {
      setFormData({
        purchase_order: grn.purchase_order || "",
        grn_date: grn.grn_date || "",
        products: grn.products || [],
      });
      setSelectedPoId(grn.purchase_order);
    }
  }, [grn, open]);

  // Step validation functions
  const validateStep1 = () => {
    if (!formData.purchase_order) {
      alert("Purchase Order is required");
      return false;
    }
    if (!formData.grn_date) {
      alert("GRN Date is required");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const hasAnyQuantity = formData.products.some(
      (p) => (p.received_quantity || 0) > 0 || (p.rejected_quantity || 0) > 0
    );

    if (!hasAnyQuantity) {
      alert("At least one product must have received or rejected quantity");
      return false;
    }

    for (const product of formData.products) {
      if ((product.rejected_quantity || 0) > (product.received_quantity || 0)) {
        alert(
          `"${product.description}" - Rejected quantity cannot exceed received quantity`
        );
        return false;
      }
    }

    return true;
  };

  const handleFormChange = (updatedData) => {
    setFormData(updatedData);
    
    // If PO changed, fetch new products
    if (updatedData.purchase_order !== formData.purchase_order) {
      setSelectedPoId(updatedData.purchase_order);
    }
  };

  const handleProductChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedProducts = [...prev.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: parseFloat(value) || 0,
      };
      return {
        ...prev,
        products: updatedProducts,
      };
    });
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        purchase_order: formData.purchase_order,
        grn_date: formData.grn_date,
        products: formData.products.map((p) => ({
          purchase_order_product: p.id,
          received_quantity: p.received_quantity || 0,
          rejected_quantity: p.rejected_quantity || 0,
        })),
      };

      const url = grn
        ? `${BASE_API}/inventory/grns/${grn.id}/`
        : `${BASE_API}/inventory/grns/`;

      const method = grn ? "PUT" : "POST";

      await axios({
        method,
        url,
        data: payload,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      Swal.fire({
        icon: "success",
        title: grn ? "GRN Updated" : "GRN Created",
        text: grn
          ? "GRN updated successfully"
          : "GRN created successfully",
      });

      setStep(1);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving GRN:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.detail || "Failed to save GRN",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Step 1 Fields - Basic Information
  const step1Fields = [
    {
      name: "purchase_order",
      label: "Purchase Order",
      type: "select",
      required: true,
      gridCols: 2,
      placeholder: "Select Purchase Order",
      options: purchaseOrders.map((po) => ({
        value: po.id,
        label: `${po.purchase_order_no} - ${po.vendor_details?.name || "N/A"}`,
      })),
      disabled: grn !== null,
    },
    {
      name: "grn_date",
      label: "GRN Date",
      type: "date",
      required: true,
      gridCols: 2,
    },
  ];

  const getCurrentFields = () => {
    if (step === 1) return step1Fields;
    return [];
  };

  return (
    <>
      <div className="fixed inset-0 mt-8 bg-black/40 flex items-start sm:items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-lg w-full max-w-4xl relative max-h-[85vh] flex flex-col">

          {/* Header */}
          <div className="sticky top-0 bg-white z-10 border-b px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {grn ? "Edit GRN" : "Add GRN"}
              </h2>
              <button
                onClick={onClose}
                className="text-xl font-bold hover:text-red-500"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  1
                </div>
                <span className="ml-2">PO Selection</span>
              </div>
              <div className={`w-8 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  2
                </div>
                <span className="ml-2">Received Items</span>
              </div>
              <div className={`w-8 h-1 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div className={`flex items-center ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  3
                </div>
                <span className="ml-2">Review</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 1 && (
              <div className="space-y-4">
                <ReusableForm
                  fields={step1Fields}
                  formData={formData}
                  onChange={handleFormChange}
                  loading={loading}
                  showCancel={true}
                  onCancel={onClose}
                  submitText="Next"
                  cancelText="Cancel"
                  onSubmit={() => {}}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Enter Received Quantities
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-3 py-2 text-left">Description</th>
                        <th className="border px-3 py-2 text-center">PO Qty</th>
                        <th className="border px-3 py-2 text-center">UOM</th>
                        <th className="border px-3 py-2 text-center">Received Qty</th>
                        <th className="border px-3 py-2 text-center">Rejected Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.products && formData.products.length > 0 ? (
                        formData.products.map((product, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="border px-3 py-2">
                              {product.description || "N/A"}
                            </td>
                            <td className="border px-3 py-2 text-center">
                              {product.quantity || 0}
                            </td>
                            <td className="border px-3 py-2 text-center">
                              {product.uom || ""}
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.received_quantity || 0}
                                onChange={(e) =>
                                  handleProductChange(
                                    index,
                                    "received_quantity",
                                    e.target.value
                                  )
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.rejected_quantity || 0}
                                onChange={(e) =>
                                  handleProductChange(
                                    index,
                                    "rejected_quantity",
                                    e.target.value
                                  )
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="border px-3 py-4 text-center text-gray-500">
                            No products found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Review GRN Details
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Purchase Order:</span>
                    <span>
                      {purchaseOrders.find((p) => p.id == formData.purchase_order)
                        ?.purchase_order_no || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">GRN Date:</span>
                    <span>{formData.grn_date}</span>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-gray-600 font-medium mb-2">Products Summary:</p>
                    <div className="text-sm space-y-2">
                      {formData.products.map((product, index) => (
                        <div key={index} className="flex justify-between text-gray-700">
                          <span>{product.description || "N/A"}</span>
                          <span>
                            Received: {product.received_quantity || 0}, Rejected:{" "}
                            {product.rejected_quantity || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-100 p-6 flex justify-between gap-3 sticky bottom-0 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>

            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={handlePreviousStep}
                  className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : grn ? "Update GRN" : "Create GRN"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}