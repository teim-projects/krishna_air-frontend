import { useState, useEffect } from "react";
import { MdAutorenew } from "react-icons/md";
import Swal from "sweetalert2";

const VISIT_FREQUENCY_OPTIONS = [
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
];

function addOneYearMinusOneDay(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function getNextDay(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function RenewAmcModal({ contract, baseApi, token, onClose, onSuccess }) {
  const defaultStartDate = getNextDay(contract?.amc_end_date);
  const defaultEndDate = addOneYearMinusOneDay(defaultStartDate);

  const [formData, setFormData] = useState({
    amc_start_date: defaultStartDate,
    amc_end_date: defaultEndDate,
    amc_cost: contract?.amc_cost || "",
    visit_frequency: contract?.visit_frequency || "QUARTERLY",
    renewal_remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (contract) {
      const sDate = getNextDay(contract.amc_end_date);
      setFormData({
        amc_start_date: sDate,
        amc_end_date: addOneYearMinusOneDay(sDate),
        amc_cost: contract.amc_cost || "",
        visit_frequency: contract.visit_frequency || "QUARTERLY",
        renewal_remarks: "",
      });
    }
  }, [contract]);

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setFormData((prev) => ({
      ...prev,
      amc_start_date: newStart,
      amc_end_date: addOneYearMinusOneDay(newStart),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amc_start_date) {
      Swal.fire({ icon: "error", title: "Validation", text: "New Start Date is required" });
      return;
    }
    if (!formData.amc_end_date) {
      Swal.fire({ icon: "error", title: "Validation", text: "New End Date is required" });
      return;
    }
    if (!formData.amc_cost || isNaN(parseFloat(formData.amc_cost))) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please enter a valid Annual Value (Cost)" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${baseApi}/amc/contracts/${contract.id}/create_renewal/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amc_start_date: formData.amc_start_date,
          amc_end_date: formData.amc_end_date,
          amc_cost: parseFloat(formData.amc_cost),
          visit_frequency: formData.visit_frequency,
          renewal_remarks: formData.renewal_remarks,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || "Failed to renew contract");
      }

      Swal.fire({
        icon: "success",
        title: "Renewed!",
        text: `AMC Contract ${contract.contract_number} renewed successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Renewal Error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!contract) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-md shadow-lg w-full max-w-xl relative flex flex-col my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header matching system style */}
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center rounded-t-md">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Renew AMC Contract</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {contract.contract_number} — {contract.customer_name || `Customer #${contract.customer}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Current Cycle Highlight Box */}
          <div className="bg-sky-50 border border-sky-200 rounded-md p-3.5 flex justify-between items-center">
            <div>
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block mb-0.5">
                Current Cycle
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {contract.amc_start_date || "—"} to {contract.amc_end_date || "—"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block mb-0.5">
                Annual Value
              </span>
              <span className="text-base font-bold text-sky-900">
                ₹{contract.amc_cost || 0}
              </span>
            </div>
          </div>

          {/* Form Fields: Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700 mb-1 block">
                New Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.amc_start_date}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-1 block">
                New End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.amc_end_date}
                onChange={(e) => setFormData({ ...formData, amc_end_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Form Fields: Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700 mb-1 block">
                New Annual Value (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="200.00"
                value={formData.amc_cost}
                onChange={(e) => setFormData({ ...formData, amc_cost: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-1 block">
                Frequency of Visit
              </label>
              <select
                value={formData.visit_frequency}
                onChange={(e) => setFormData({ ...formData, visit_frequency: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white"
              >
                {VISIT_FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Fields: Row 3 */}
          <div>
            <label className="text-sm text-slate-700 mb-1 block">
              Renewal Remarks / Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 10% annual price adjustment applied, customer approved via email."
              value={formData.renewal_remarks}
              onChange={(e) => setFormData({ ...formData, renewal_remarks: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white resize-none"
            />
          </div>

          {/* Footer Action Buttons matching system style */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-sm font-medium shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <MdAutorenew className={submitting ? "animate-spin text-base" : "text-base"} />
              {submitting ? "Renewing..." : "Confirm Renewal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
