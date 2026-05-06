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
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPoData, setSelectedPoData] = useState(null);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

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

  // When PO changes, fetch its products
  useEffect(() => {
    if (formData.purchase_order && open) {
      const po = purchaseOrders.find((p) => p.id === parseInt(formData.purchase_order));
      if (po) {
        setSelectedPoData(po);
      }
    }
  }, [formData.purchase_order, purchaseOrders, open]);

  // If editing existing GRN
  useEffect(() => {
    if (grn && open) {
      setFormData({
        purchase_order: grn.purchase_order || "",
        grn_date: grn.grn_date || "",
      });
      setStep(1);
    } else if (open) {
      setFormData({
        purchase_order: "",
        grn_date: "",
      });
      setStep(1);
    }
  }, [grn, open]);

  // Step validation functions
  const validateStep1 = () => {
    if (!formData.purchase_order) {
      Swal.fire({ icon: "error", title: "Validation", text: "Purchase Order is required" });
      return false;
    }
    if (!formData.grn_date) {
      Swal.fire({ icon: "error", title: "Validation", text: "GRN Date is required" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const hasAnyQuantity = formData.received_quantities?.some((q) => q > 0) || 
                           formData.rejected_quantities?.some((q) => q > 0);

    if (!hasAnyQuantity) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "At least one product must have received or rejected quantity",
      });
      return false;
    }

    // Check rejected doesn't exceed received
    for (let i = 0; i < (selectedPoData?.products?.length || 0); i++) {
      if ((formData.rejected_quantities?.[i] || 0) > (formData.received_quantities?.[i] || 0)) {
        Swal.fire({
          icon: "error",
          title: "Validation",
          text: `Rejected quantity cannot exceed received quantity`,
        });
        return false;
      }
    }

    return true;
  };

  const handleFormChange = (updatedData) => {
    setFormData(updatedData);
  };

  const handleStep1Submit = () => {
    if (validateStep1()) {
      // Initialize quantity arrays for step 2
      const products = selectedPoData?.products || [];
      const receivedQties = new Array(products.length).fill(0);
      const rejectedQties = new Array(products.length).fill(0);
      
      setFormData((prev) => ({
        ...prev,
        received_quantities: formData.received_quantities || receivedQties,
        rejected_quantities: formData.rejected_quantities || rejectedQties,
      }));
      setStep(2);
    }
  };

  const handleStep2Submit = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      const products = selectedPoData?.products || [];
      const payload = {
        purchase_order: formData.purchase_order,
        grn_date: formData.grn_date,
        products: products.map((p, index) => ({
          purchase_order_product: p.id,
          received_quantity: formData.received_quantities?.[index] || 0,
          rejected_quantity: formData.rejected_quantities?.[index] || 0,
        })),
      };

      const url = grn
        ? `${BASE_API}/inventory/grn/${grn.id}/`
        : `${BASE_API}/inventory/grn/`;

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

  // ========== STEP 1: PO Selection ==========
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

  // ========== STEP 2: Received Items ==========
  const step2Fields = selectedPoData?.products?.map((product, index) => [
    {
      name: `product_${index}_desc`,
      label: `${product.description || "Product"} (PO Qty: ${product.quantity})`,
      type: "text",
      disabled: true,
      gridCols: 2,
      value: product.description,
    },
    {
      name: `received_${index}`,
      label: "Received Qty",
      type: "number",
      gridCols: 1,
      min: "0",
      step: "0.01",
      value: formData.received_quantities?.[index] || 0,
      onChange: (e) => {
        const newArr = [...(formData.received_quantities || new Array(selectedPoData.products.length).fill(0))];
        newArr[index] = parseFloat(e.target.value) || 0;
        setFormData((prev) => ({ ...prev, received_quantities: newArr }));
      },
    },
    {
      name: `rejected_${index}`,
      label: "Rejected Qty",
      type: "number",
      gridCols: 1,
      min: "0",
      step: "0.01",
      value: formData.rejected_quantities?.[index] || 0,
      onChange: (e) => {
        const newArr = [...(formData.rejected_quantities || new Array(selectedPoData.products.length).fill(0))];
        newArr[index] = parseFloat(e.target.value) || 0;
        setFormData((prev) => ({ ...prev, rejected_quantities: newArr }));
      },
    },
  ]).flat() || [];

  // ========== STEP 3: Review ==========
  const step3Fields = [
    {
      name: "review_po",
      label: "Purchase Order",
      type: "text",
      disabled: true,
      gridCols: 2,
      value: purchaseOrders.find((p) => p.id === parseInt(formData.purchase_order))?.purchase_order_no || "N/A",
    },
    {
      name: "review_vendor",
      label: "Vendor",
      type: "text",
      disabled: true,
      gridCols: 2,
      value: selectedPoData?.vendor_details?.name || "N/A",
    },
    {
      name: "review_date",
      label: "GRN Date",
      type: "text",
      disabled: true,
      gridCols: 2,
      value: formData.grn_date,
    },
  ];

  const getCurrentFields = () => {
    switch (step) {
      case 1:
        return step1Fields;
      case 2:
        return step2Fields;
      case 3:
        return step3Fields;
      default:
        return step1Fields;
    }
  };

  const handleSubmit = () => {
    if (step === 1) {
      handleStep1Submit();
    } else if (step === 2) {
      handleStep2Submit();
    } else if (step === 3) {
      handleFinalSubmit();
    }
  };

  const handleCancel = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
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

          {/* Content - Using ReusableForm for ALL steps */}
          <div className="flex-1 overflow-y-auto p-6">
            <ReusableForm
              fields={getCurrentFields()}
              formData={formData}
              onChange={handleFormChange}
              loading={loading}
              showCancel={true}
              onCancel={handleCancel}
              submitText={step === 3 ? (grn ? "Update GRN" : "Create GRN") : "Next"}
              cancelText={step > 1 ? "Back" : "Cancel"}
              onSubmit={handleSubmit}
            />

            {/* Step 2 & 3 Product Summary */}
            {(step === 2 || step === 3) && selectedPoData?.products && selectedPoData.products.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3">Products Summary:</h4>
                <div className="space-y-2 text-sm">
                  {selectedPoData.products.map((product, index) => (
                    <div key={index} className="flex justify-between text-gray-700">
                      <span>{product.description} (PO: {product.quantity})</span>
                      <span>
                        Received: {formData.received_quantities?.[index] || 0}, Rejected:{" "}
                        {formData.rejected_quantities?.[index] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
