import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import ReusableForm from "../Form";

export default function AddServiceVisitForm({
  open,
  onClose,
  onSuccess,
  base_api,
  visit = null
}) {
  const [formData, setFormData] = useState({
    amc_contract: "",
    service_type: "SCHEDULED",
    visit_date: "",
    engineer_assigned: "",
    issue_reported: "",
    work_performed: "",
    is_billable: false,
    status: "SCHEDULED"
  });

  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  // Fetch contracts list for selection
  useEffect(() => {
    if (!open) return;
    
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${base_api}/amc/contracts/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (response.ok) {
          const data = await response.json();
          setContracts(data.results || data);
        }
      } catch (err) {
        console.error("Error fetching contracts:", err);
      }
    };

    fetchContracts();
  }, [open, base_api, token]);

  // Set form data on edit
  useEffect(() => {
    if (!visit || !open) {
      setFormData({
        amc_contract: "",
        service_type: "SCHEDULED",
        visit_date: "",
        engineer_assigned: "",
        issue_reported: "",
        work_performed: "",
        is_billable: false,
        status: "SCHEDULED"
      });
      return;
    }

    setFormData({
      amc_contract: visit.amc_contract || "",
      service_type: visit.service_type || "SCHEDULED",
      visit_date: visit.visit_date || "",
      engineer_assigned: visit.engineer_assigned || "",
      issue_reported: visit.issue_reported || "",
      work_performed: visit.work_performed || "",
      is_billable: visit.is_billable || false,
      status: visit.status || "SCHEDULED"
    });
  }, [visit, open]);

  if (!open) return null;

  const validate = () => {
    if (!formData.amc_contract) {
      Swal.fire({ icon: "error", title: "Validation", text: "AMC Contract is required" });
      return false;
    }
    if (!formData.visit_date) {
      Swal.fire({ icon: "error", title: "Validation", text: "Visit Date is required" });
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
        amc_contract: parseInt(data.amc_contract)
      };

      const url = visit ? `${base_api}/amc/services/${visit.id}/` : `${base_api}/amc/services/`;
      const method = visit ? "PUT" : "POST";

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
        text: visit ? "Service visit updated successfully" : "Service visit scheduled successfully",
        timer: 1200,
        showConfirmButton: false
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save service visit" });
    } finally {
      setLoading(false);
    }
  };

  const contractOptions = contracts.map(c => ({
    value: c.id,
    label: `${c.contract_number} - ${c.customer_name || `Customer ID: ${c.customer}`}`
  }));

  const fields = [
    {
      name: "amc_contract",
      label: "AMC Contract",
      type: "select",
      required: true,
      options: contractOptions,
      gridCols: 1
    },
    {
      name: "service_type",
      label: "Service Type",
      type: "select",
      required: true,
      options: [
        { value: "SCHEDULED", label: "Scheduled Maintenance" },
        { value: "EMERGENCY", label: "Emergency Repair" },
        { value: "FOLLOW_UP", label: "Follow-up Visit" }
      ],
      gridCols: 1
    },
    {
      name: "visit_date",
      label: "Scheduled Visit Date",
      type: "date",
      required: true,
      gridCols: 1
    },
    {
      name: "engineer_assigned",
      label: "Assigned Engineer / Technician",
      type: "text",
      placeholder: "Enter technician name",
      gridCols: 1
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "SCHEDULED", label: "Scheduled" },
        { value: "COMPLETED", label: "Completed" },
        { value: "PENDING_PARTS", label: "Pending Parts" },
        { value: "CANCELLED", label: "Cancelled" }
      ],
      gridCols: 1
    },
    {
      name: "is_billable",
      label: "Is Billable (For Non-Comprehensive parts/labor)",
      type: "checkbox",
      gridCols: 1
    },
    {
      name: "issue_reported",
      label: "Issue Reported / Request Details",
      type: "textarea",
      rows: 2,
      placeholder: "Describe customer complaint or scheduled task details...",
      gridCols: 2
    },
    {
      name: "work_performed",
      label: "Work Performed (on completion)",
      type: "textarea",
      rows: 2,
      placeholder: "Describe work carried out by technician...",
      gridCols: 2
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-2xl relative max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{visit ? "Edit Service Visit" : "Schedule Service Visit"}</h2>
          <button onClick={onClose} className="text-xl font-bold hover:text-red-500">✕</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <ReusableForm
            fields={fields}
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            loading={loading}
            submitText={visit ? "Update" : "Save"}
            onCancel={onClose}
            showCancel={true}
          />
        </div>
      </div>
    </div>
  );
}
