import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import ReusableForm from "../Form";

const AMC_TYPE_OPTIONS = [
  { value: "COMPREHENSIVE", label: "Comprehensive" },
  { value: "NON_COMPREHENSIVE", label: "Non-Comprehensive" },
];

const VISIT_FREQUENCY_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
];

const VISITS_PER_YEAR = {
  MONTHLY: 12,
  QUARTERLY: 4,
  HALF_YEARLY: 2,
  YEARLY: 1,
};

/** Expected visits for standard frequency over AMC start–end dates. */
function computeStandardExpectedVisits(frequency, amcStart, amcEnd) {
  if (!frequency || frequency === "CUSTOM" || !amcStart || !amcEnd) return null;
  const perYear = VISITS_PER_YEAR[frequency];
  if (!perYear) return null;
  const start = new Date(amcStart);
  const end = new Date(amcEnd);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return Math.max(1, Math.round((days / 365.25) * perYear));
}

const formatAmcTypeLabel = (type) =>
  AMC_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;

const normalizePhone = (phone) => (phone || "").replace(/\D/g, "").slice(-10);

const matchCustomerId = (record, customers) => {
  if (record.customer) return record.customer;

  const recordPhone = normalizePhone(record.customer_contact);
  if (!recordPhone) return null;

  const match = customers.find((c) => {
    const phones = [
      normalizePhone(c.contact_number),
      normalizePhone(c.secondary_contact_number),
      normalizePhone(c.poc_contact_number),
    ].filter(Boolean);
    return phones.includes(recordPhone);
  });

  return match?.id ?? null;
};

const buildAmcCustomerMap = (serviceRecords, customers) => {
  const map = new Map();

  for (const record of serviceRecords) {
    if (record.contract_type !== "amc") continue;

    const customerId = matchCustomerId(record, customers);
    if (!customerId || map.has(customerId)) continue;

    const customer = customers.find((c) => c.id === customerId);
    const name = customer?.name || record.customer_name;
    const typeLabel = record.amc_service_type
      ? formatAmcTypeLabel(record.amc_service_type)
      : "";

    map.set(customerId, {
      customerId,
      customerName: name,
      amcType: record.amc_service_type || "",
      label: typeLabel ? `${name} (${typeLabel})` : name,
    });
  }

  return map;
};

const emptyFormData = {
  customer: "",
  amc_type: "",
  visit_frequency: "QUARTERLY",
  total_visit_count: "",
  schedule_note: "",
  product_variant: "",
  sale_date: "",
  warranty_end_date: "",
  amc_start_date: "",
  amc_end_date: "",
  status: "ACTIVE",
  amc_cost: "",
  is_renewal: false,
};

export default function AddAmcForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  amc = null,
  token,
}) {
  const [formData, setFormData] = useState(emptyFormData);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [amcCustomerMap, setAmcCustomerMap] = useState(new Map());

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        const [recordsRes, customersRes, variantsRes] = await Promise.all([
          fetch(`${baseApi}/amc/service-records/?contract_type=amc`, { headers }),
          fetch(`${baseApi}/quotation/customer/`, { headers }),
          fetch(`${baseApi}/product/product-variant/?all=true`, { headers }),
        ]);

        let records = [];
        let customers = [];
        let variantList = [];

        if (recordsRes.ok) {
          const data = await recordsRes.json();
          records = data.results || data || [];
        }
        if (customersRes.ok) {
          const data = await customersRes.json();
          customers = data.results || data || [];
        }
        if (variantsRes.ok) {
          const data = await variantsRes.json();
          variantList = data.results || data || [];
        }

        setVariants(variantList);
        setAmcCustomerMap(buildAmcCustomerMap(records, customers));
      } catch (err) {
        console.error("Error fetching dropdowns:", err);
      }
    };

    fetchData();
  }, [open, baseApi, token]);

  useEffect(() => {
    if (!amc || !open) {
      setFormData(emptyFormData);
      return;
    }

    setFormData({
      customer: amc.customer || "",
      amc_type: amc.amc_type || "",
      visit_frequency: amc.visit_frequency || "QUARTERLY",
      total_visit_count: amc.total_visit_count ?? "",
      schedule_note: amc.schedule_note || "",
      product_variant: amc.product_variant || "",
      sale_date: amc.sale_date || "",
      warranty_end_date: amc.warranty_end_date || "",
      amc_start_date: amc.amc_start_date || "",
      amc_end_date: amc.amc_end_date || "",
      status: amc.status || "ACTIVE",
      amc_cost: amc.amc_cost || "",
      is_renewal: amc.is_renewal || false,
    });
  }, [amc, open]);

  useEffect(() => {
    if (formData.sale_date && !formData.warranty_end_date) {
      const sale = new Date(formData.sale_date);
      sale.setFullYear(sale.getFullYear() + 1);
      const formattedWarrantyEnd = sale.toISOString().split("T")[0];
      setFormData((prev) => ({
        ...prev,
        warranty_end_date: formattedWarrantyEnd,
        amc_start_date: formattedWarrantyEnd,
      }));
    }
  }, [formData.sale_date]);

  useEffect(() => {
    if (formData.amc_start_date && !formData.amc_end_date) {
      const start = new Date(formData.amc_start_date);
      start.setFullYear(start.getFullYear() + 1);
      start.setDate(start.getDate() - 1);
      const formattedAmcEnd = start.toISOString().split("T")[0];
      setFormData((prev) => ({
        ...prev,
        amc_end_date: formattedAmcEnd,
      }));
    }
  }, [formData.amc_start_date]);

  const handleFormChange = (newData) => {
    if (String(newData.customer) !== String(formData.customer)) {
      const entry = amcCustomerMap.get(parseInt(newData.customer, 10));
      if (entry?.amcType) {
        newData = { ...newData, amc_type: entry.amcType };
      }
    }
    setFormData(newData);
  };

  if (!open) return null;

  const customerOptions = (() => {
    const options = Array.from(amcCustomerMap.values()).map((entry) => ({
      value: entry.customerId,
      label: entry.label,
    }));

    if (amc?.customer && !options.some((o) => String(o.value) === String(amc.customer))) {
      options.unshift({
        value: amc.customer,
        label: amc.customer_name || `Customer #${amc.customer}`,
      });
    }

    return options;
  })();

  const validate = () => {
    if (!formData.customer) {
      Swal.fire({ icon: "error", title: "Validation", text: "Customer is required" });
      return false;
    }
    if (!formData.amc_type) {
      Swal.fire({ icon: "error", title: "Validation", text: "Type of AMC is required" });
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
    if (formData.visit_frequency === "CUSTOM") {
      const n = parseInt(formData.total_visit_count, 10);
      if (!n || n < 1) {
        Swal.fire({
          icon: "error",
          title: "Validation",
          text: "For custom frequency, enter total number of visits (minimum 1).",
        });
        return false;
      }
    }
    return true;
  };

  const formatBackendErrors = (errorData) => {
    if (typeof errorData === "string") return errorData;
    if (errorData.detail) return errorData.detail;
    if (typeof errorData === "object" && errorData !== null) {
      return Object.entries(errorData)
        .map(([field, msgs]) => {
          const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
        customer: parseInt(data.customer, 10),
        amc_type: data.amc_type,
        product_variant: parseInt(data.product_variant, 10),
        amc_cost: parseFloat(data.amc_cost),
      };
      if (payload.visit_frequency === "CUSTOM") {
        payload.total_visit_count = parseInt(payload.total_visit_count, 10);
      } else {
        payload.total_visit_count = null;
        payload.schedule_note = null;
      }

      const url = amc ? `${baseApi}/amc/contracts/${amc.id}/` : `${baseApi}/amc/contracts/`;
      const method = amc ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(formatBackendErrors(errorData));
      }

      Swal.fire({
        icon: "success",
        text: amc ? "Contract updated successfully" : "Contract created successfully",
        timer: 1200,
        showConfirmButton: false,
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save AMC contract" });
    } finally {
      setLoading(false);
    }
  };

  const variantOptions = variants.map((v) => ({
    value: v.id,
    label: `${v.sku} - ${v.product_model_name || ""}`,
  }));

  const fields = useMemo(() => {
    const base = [
    {
      name: "customer",
      label: "Customer (AMC Service Records only)",
      type: "searchable_select",
      required: true,
      placeholder: customerOptions.length
        ? "Search customer from AMC service records..."
        : "No AMC service management customers found",
      options: customerOptions,
      gridCols: 1,
    },
    {
      name: "amc_type",
      label: "Type of AMC",
      type: "select",
      required: true,
      options: AMC_TYPE_OPTIONS,
      gridCols: 1,
    },
    {
      name: "visit_frequency",
      label: "Frequency of Visit",
      type: "select",
      required: true,
      options: VISIT_FREQUENCY_OPTIONS,
      gridCols: 1,
    },
    ...(formData.visit_frequency === "CUSTOM"
      ? [
          {
            name: "total_visit_count",
            label: "Total visits in this AMC period",
            type: "number",
            required: true,
            placeholder: "e.g. 4",
            gridCols: 1,
          },
          {
            name: "schedule_note",
            label: "Custom schedule note",
            type: "textarea",
            required: false,
            placeholder: "e.g. 4 visits to be done within first 6 months",
            gridCols: 1,
          },
        ]
      : []),
    {
      name: "product_variant",
      label: "AC Variant / Model",
      type: "searchable_select",
      required: true,
      placeholder: "Type to search AC model...",
      options: variantOptions,
      gridCols: 1,
    },
    {
      name: "amc_cost",
      label: "AMC Cost (INR)",
      type: "number",
      required: true,
      placeholder: "e.g., 5000",
      gridCols: 1,
    },
    {
      name: "sale_date",
      label: "Sale / Installation Date",
      type: "date",
      required: true,
      gridCols: 1,
    },
    {
      name: "warranty_end_date",
      label: "Warranty End Date",
      type: "date",
      required: true,
      gridCols: 1,
    },
    {
      name: "amc_start_date",
      label: "AMC Start Date",
      type: "date",
      required: true,
      gridCols: 1,
    },
    {
      name: "amc_end_date",
      label: "AMC End Date",
      type: "date",
      required: true,
      gridCols: 1,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "CLOSED", label: "Closed" },
        { value: "EXPIRED", label: "Expired" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
      gridCols: 1,
    },
  ];
    return base;
  }, [formData.visit_frequency, customerOptions, variantOptions]);

  const autoVisitHint =
    formData.visit_frequency && formData.visit_frequency !== "CUSTOM"
      ? computeStandardExpectedVisits(
          formData.visit_frequency,
          formData.amc_start_date,
          formData.amc_end_date
        )
      : formData.visit_frequency === "CUSTOM" && formData.total_visit_count
        ? parseInt(formData.total_visit_count, 10)
        : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-3xl relative max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{amc ? "Edit AMC Contract" : "Create AMC Contract"}</h2>
          <button onClick={onClose} className="text-xl font-bold hover:text-red-500">✕</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {customerOptions.length === 0 && !amc && (
            <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Add a Service Management record with Contract Type &quot;AMC&quot; first. Only those customers appear here.
            </p>
          )}
          {autoVisitHint != null && !Number.isNaN(autoVisitHint) && (
            <p className="mb-4 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2">
              Expected service visits for this AMC period:{" "}
              <span className="font-semibold text-slate-800">{autoVisitHint}</span>
              {formData.visit_frequency === "CUSTOM" && formData.schedule_note && (
                <span className="block mt-1 text-xs text-slate-500">{formData.schedule_note}</span>
              )}
            </p>
          )}
          <ReusableForm
            fields={fields}
            formData={formData}
            onChange={handleFormChange}
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
