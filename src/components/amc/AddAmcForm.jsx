import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import ReusableForm from "../Form";

export default function AddAmcForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  amc = null,
  token
}) {
  const [formData, setFormData] = useState({
    customer: "",
    package: "",
    product_variant: "",
    sale_date: "",
    warranty_end_date: "",
    amc_start_date: "",
    amc_end_date: "",
    amc_included_in_sale: false,
    status: "ACTIVE",
    amc_cost: "",
    is_renewal: false
  });

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [variants, setVariants] = useState([]);

  // Fetch initial dropdown data
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        // Fetch Customers
        const custRes = await fetch(`${baseApi}/quotation/customer/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (custRes.ok) {
          const custData = await custRes.json();
          setCustomers(custData.results || custData);
        }

        // Fetch Packages
        const pkgRes = await fetch(`${baseApi}/amc/packages/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          setPackages(pkgData.results || pkgData);
        }

        // Fetch Product Variants
        const varRes = await fetch(`${baseApi}/product/product-variant/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (varRes.ok) {
          const varData = await varRes.json();
          setVariants(varData.results || varData);
        }
      } catch (err) {
        console.error("Error fetching dropdowns:", err);
      }
    };

    fetchData();
  }, [open, baseApi, token]);

  // Handle edit modes and populate fields
  useEffect(() => {
    if (!amc || !open) {
      setFormData({
        customer: "",
        package: "",
        product_variant: "",
        sale_date: "",
        warranty_end_date: "",
        amc_start_date: "",
        amc_end_date: "",
        amc_included_in_sale: false,
        status: "ACTIVE",
        amc_cost: "",
        is_renewal: false
      });
      return;
    }

    setFormData({
      customer: amc.customer || "",
      package: amc.package || "",
      product_variant: amc.product_variant || "",
      sale_date: amc.sale_date || "",
      warranty_end_date: amc.warranty_end_date || "",
      amc_start_date: amc.amc_start_date || "",
      amc_end_date: amc.amc_end_date || "",
      amc_included_in_sale: amc.amc_included_in_sale || false,
      status: amc.status || "ACTIVE",
      amc_cost: amc.amc_cost || "",
      is_renewal: amc.is_renewal || false
    });
  }, [amc, open]);

  // Auto calculate dates
  useEffect(() => {
    if (formData.sale_date && !formData.warranty_end_date) {
      // Set warranty end date to 1 year after sale date
      const sale = new Date(formData.sale_date);
      sale.setFullYear(sale.getFullYear() + 1);
      const formattedWarrantyEnd = sale.toISOString().split("T")[0];
      setFormData(prev => ({
        ...prev,
        warranty_end_date: formattedWarrantyEnd,
        amc_start_date: formattedWarrantyEnd
      }));
    }
  }, [formData.sale_date]);

  useEffect(() => {
    if (formData.amc_start_date && !formData.amc_end_date) {
      // Set AMC end date to 1 year after start date
      const start = new Date(formData.amc_start_date);
      start.setFullYear(start.getFullYear() + 1);
      start.setDate(start.getDate() - 1); // standard 365 days
      const formattedAmcEnd = start.toISOString().split("T")[0];
      setFormData(prev => ({
        ...prev,
        amc_end_date: formattedAmcEnd
      }));
    }
  }, [formData.amc_start_date]);

  // Set default cost from package selection
  useEffect(() => {
    if (formData.package && packages.length > 0) {
      const selectedPkg = packages.find(p => p.id === parseInt(formData.package));
      if (selectedPkg && !formData.amc_cost) {
        setFormData(prev => ({ ...prev, amc_cost: selectedPkg.annual_cost }));
      }
    }
  }, [formData.package, packages]);

  if (!open) return null;

  const validate = () => {
    if (!formData.customer) {
      Swal.fire({ icon: "error", title: "Validation", text: "Customer is required" });
      return false;
    }
    if (!formData.package) {
      Swal.fire({ icon: "error", title: "Validation", text: "Package is required" });
      return false;
    }
    if (!formData.product_variant) {
      Swal.fire({ icon: "error", title: "Validation", text: "Product Variant is required" });
      return false;
    }
    if (!formData.amc_cost || isNaN(parseFloat(formData.amc_cost))) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please enter a valid AMC cost" });
      return false;
    }
    return true;
  };

  const formatBackendErrors = (errorData) => {
    if (typeof errorData === "string") return errorData;
    if (errorData.detail) return errorData.detail;
    if (typeof errorData === "object" && errorData !== null) {
      return Object.entries(errorData)
        .map(([field, msgs]) => {
          const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          const message = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
          return `${fieldName}: ${message}`;
        })
        .join("\n");
    }
    return "An unexpected error occurred.";
  };

  const handleSubmit = async (data) => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...data,
        customer: parseInt(data.customer),
        package: parseInt(data.package),
        product_variant: parseInt(data.product_variant),
        amc_cost: parseFloat(data.amc_cost)
      };

      const url = amc ? `${baseApi}/amc/contracts/${amc.id}/` : `${baseApi}/amc/contracts/`;
      const method = amc ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(formatBackendErrors(errorData));
      }

      Swal.fire({
        icon: "success",
        text: amc ? "Contract updated successfully" : "Contract created successfully",
        timer: 1200,
        showConfirmButton: false
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save AMC contract" });
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const packageOptions = packages.map(p => ({ value: p.id, label: `${p.name} (${p.package_type})` }));
  const variantOptions = variants.map(v => ({ value: v.id, label: `${v.sku} - ${v.product_model_name || ""}` }));

  const fields = [
    {
      name: "customer",
      label: "Customer",
      type: "searchable_select",
      required: true,
      placeholder: "Type to search customer...",
      options: customerOptions,
      gridCols: 1
    },
    {
      name: "package",
      label: "AMC Package",
      type: "searchable_select",
      required: true,
      placeholder: "Type to search package...",
      options: packageOptions,
      gridCols: 1
    },
    {
      name: "product_variant",
      label: "AC Variant / Model",
      type: "searchable_select",
      required: true,
      placeholder: "Type to search AC model...",
      options: variantOptions,
      gridCols: 1
    },
    {
      name: "amc_cost",
      label: "AMC Cost (INR)",
      type: "number",
      required: true,
      placeholder: "e.g., 5000",
      gridCols: 1
    },
    {
      name: "sale_date",
      label: "Sale / Installation Date",
      type: "date",
      required: true,
      gridCols: 1
    },
    {
      name: "warranty_end_date",
      label: "Warranty End Date",
      type: "date",
      required: true,
      gridCols: 1
    },
    {
      name: "amc_start_date",
      label: "AMC Start Date",
      type: "date",
      required: true,
      gridCols: 1
    },
    {
      name: "amc_end_date",
      label: "AMC End Date",
      type: "date",
      required: true,
      gridCols: 1
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "EXPIRED", label: "Expired" },
        { value: "CANCELLED", label: "Cancelled" }
      ],
      gridCols: 1
    },
    {
      name: "amc_included_in_sale",
      label: "AMC Included in Sale Price?",
      type: "checkbox",
      gridCols: 1
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-3xl relative max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{amc ? "Edit AMC Contract" : "Create AMC Contract"}</h2>
          <button onClick={onClose} className="text-xl font-bold hover:text-red-500">✕</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <ReusableForm
            fields={fields}
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            loading={loading}
            submitText={amc ? "Update" : "Save"}
            onCancel={onClose}
            showCancel={true}
          />
        </div>
      </div>
    </div>
  );
}
