import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import ReusableForm from "../Form";

export default function AddPackageForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  pkg = null,
  token
}) {
  const [formData, setFormData] = useState({
    name: "",
    package_type: "COMPREHENSIVE",
    description: "",
    annual_cost: "",
    service_visits_per_year: 4,
    response_time_hours: 24,
    parts_replacement_limit: "",
    includes_emergency_calls: true,
    emergency_call_charges: 0
  });

  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (!pkg || !open) {
      setFormData({
        name: "",
        package_type: "COMPREHENSIVE",
        description: "",
        annual_cost: "",
        service_visits_per_year: 4,
        response_time_hours: 24,
        parts_replacement_limit: "",
        includes_emergency_calls: true,
        emergency_call_charges: 0
      });
      return;
    }

    setFormData({
      name: pkg.name || "",
      package_type: pkg.package_type || "COMPREHENSIVE",
      description: pkg.description || "",
      annual_cost: pkg.annual_cost || "",
      service_visits_per_year: pkg.service_visits_per_year || 4,
      response_time_hours: pkg.response_time_hours || 24,
      parts_replacement_limit: pkg.parts_replacement_limit || "",
      includes_emergency_calls: pkg.includes_emergency_calls ?? true,
      emergency_call_charges: pkg.emergency_call_charges || 0
    });
  }, [pkg, open]);

  if (!open) return null;

  const validate = () => {
    if (!formData.name.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Package name is required" });
      return false;
    }
    if (!formData.annual_cost || isNaN(parseFloat(formData.annual_cost))) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please enter a valid annual cost" });
      return false;
    }
    if (!formData.service_visits_per_year || formData.service_visits_per_year < 1) {
      Swal.fire({ icon: "error", title: "Validation", text: "Service visits must be at least 1" });
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
        annual_cost: parseFloat(data.annual_cost),
        service_visits_per_year: parseInt(data.service_visits_per_year),
        response_time_hours: parseInt(data.response_time_hours),
        parts_replacement_limit: data.parts_replacement_limit ? parseFloat(data.parts_replacement_limit) : null,
        emergency_call_charges: parseFloat(data.emergency_call_charges || 0)
      };

      const url = pkg ? `${baseApi}/amc/packages/${pkg.id}/` : `${baseApi}/amc/packages/`;
      const method = pkg ? "PUT" : "POST";

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
        text: pkg ? "Package updated successfully" : "Package created successfully",
        timer: 1200,
        showConfirmButton: false
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save package" });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "name",
      label: "Package Name",
      type: "text",
      required: true,
      placeholder: "e.g., Gold, Platinum, Basic",
      gridCols: 1
    },
    {
      name: "package_type",
      label: "Package Type",
      type: "select",
      required: true,
      options: [
        { value: "COMPREHENSIVE", label: "Comprehensive (Parts Included)" },
        { value: "NON_COMPREHENSIVE", label: "Non-Comprehensive (Parts Extra)" }
      ],
      gridCols: 1
    },
    {
      name: "annual_cost",
      label: "Annual Cost (INR)",
      type: "number",
      required: true,
      placeholder: "e.g., 5000",
      gridCols: 1
    },
    {
      name: "service_visits_per_year",
      label: "Service Visits Per Year",
      type: "number",
      required: true,
      placeholder: "e.g., 4",
      gridCols: 1
    },
    {
      name: "response_time_hours",
      label: "Response Time (Hours)",
      type: "number",
      required: true,
      placeholder: "e.g., 24",
      gridCols: 1
    },
    {
      name: "parts_replacement_limit",
      label: "Parts Replacement Limit (INR)",
      type: "number",
      placeholder: "Leave empty for unlimited (Comprehensive)",
      gridCols: 1
    },
    {
      name: "includes_emergency_calls",
      label: "Includes Emergency Calls?",
      type: "checkbox",
      gridCols: 1
    },
    {
      name: "emergency_call_charges",
      label: "Emergency Call Charges (INR)",
      type: "number",
      placeholder: "0 if included free",
      gridCols: 1
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
      placeholder: "Describe what this package includes...",
      gridCols: 2
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-3xl relative max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{pkg ? "Edit AMC Package" : "Add AMC Package"}</h2>
          <button onClick={onClose} className="text-xl font-bold hover:text-red-500" aria-label="Close">✕</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <ReusableForm
            fields={fields}
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            loading={loading}
            submitText={pkg ? "Update" : "Save"}
            onCancel={onClose}
            showCancel={true}
          />
        </div>
      </div>
    </div>
  );
}
