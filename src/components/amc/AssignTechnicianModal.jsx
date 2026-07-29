import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";

export default function AssignTechnicianModal({ open, onClose, onSuccess, baseApi, token, service, isContract = false }) {
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [selectedTech, setSelectedTech] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(
    service?.payment_amount ?? service?.amount ?? (isContract ? (service?.amc_cost || 0) : (service?.total_price_with_gst || 0))
  );
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [gpsLocation, setGpsLocation] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [workDate, setWorkDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [existingRecord, setExistingRecord] = useState(null);

  useEffect(() => {
    if (!open) return;

    // Reset fields first to prevent leaks
    setExistingRecord(null);
    setSelectedTech("");
    setWorkDate(service?.planned_date || service?.work_date || new Date().toISOString().split("T")[0]);
    setPaymentAmount(
      service?.payment_amount ?? service?.amount ?? (isContract ? (service?.amc_cost || 0) : (service?.total_price_with_gst || 0))
    );
    setPaymentStatus("pending");
    setGpsLocation("");
    setWorkDescription("");
    setCustomerName(service?.customer_name || "");
    setCustomerPhone(service?.customer_phone || service?.customer_contact || "");

    if (service?.work_description) {
      setWorkDescription(service.work_description);
    }

    // Prefill payment amount with service/contract totals if available
    const draftAmount = service?.payment_amount ?? service?.amount;
    if (draftAmount != null && draftAmount !== "") {
      setPaymentAmount(parseFloat(draftAmount).toFixed(2));
    } else if (isContract && service?.amc_cost) {
      setPaymentAmount(parseFloat(service.amc_cost).toFixed(2));
    } else if (service?.total_price_with_gst) {
      setPaymentAmount(parseFloat(service.total_price_with_gst).toFixed(2));
    }

    if (service) {
      setCustomerName(service.customer_name || "");
      setCustomerPhone(service.customer_contact || service.customer_phone || "");
    }
    
    // Fetch staff list and filter technicians
    const fetchTechnicians = async () => {
      setLoadingTechs(true);
      try {
        const res = await fetch(`${baseApi}/auth/staff/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          const staffList = data.results || data;
          if (Array.isArray(staffList)) {
            const techStaff = staffList.filter(
              (u) => u.role?.name?.toLowerCase() === "technician"
            );
            setTechnicians(techStaff);
          }
        }
      } catch (err) {
        console.error("Failed to load technicians", err);
      } finally {
        setLoadingTechs(false);
      }
    };

    const fetchExistingAssignment = async () => {
      if (isContract || !service?.id) return;
      try {
        const res = await fetch(`${baseApi}/amc/technician-work-records/?service_record=${service.id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.results || data;
          if (Array.isArray(list) && list.length > 0) {
            const existing = list[0];
            setExistingRecord(existing);
            setSelectedTech(existing.technician || "");
            setWorkDate(existing.work_date || new Date().toISOString().split("T")[0]);
            setPaymentAmount(existing.payment_amount || 0);
            setPaymentStatus(existing.payment_status || "pending");
            setGpsLocation(existing.gps_location || "");
            setWorkDescription(existing.work_description || "");
            if (existing.customer_name) setCustomerName(existing.customer_name);
            if (existing.customer_phone) setCustomerPhone(existing.customer_phone);
          }
        }
      } catch (err) {
        console.error("Failed to load existing assignment", err);
      }
    };

    fetchTechnicians();
    fetchExistingAssignment();
  }, [open, baseApi, token, service, isContract]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTech) {
      Swal.fire({ icon: "warning", text: "Please select a technician" });
      return;
    }
    if (!customerName.trim()) {
      Swal.fire({ icon: "warning", text: "Customer name is required" });
      return;
    }
    if (!customerPhone.trim()) {
      Swal.fire({ icon: "warning", text: "Contact number is required" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        technician: parseInt(selectedTech),
        payment_amount: parseFloat(paymentAmount) || 0,
        payment_status: paymentStatus,
        gps_location: gpsLocation,
        work_description: workDescription,
        work_date: workDate,
        customer_name: customerName,
        customer_phone: customerPhone,
      };

      let endpoint = "";
      if (existingRecord) {
        endpoint = `${baseApi}/amc/technician-work-records/${existingRecord.id}/`;
      } else if (service?.amc_service_visit_id) {
        endpoint = `${baseApi}/amc/service-visits/${service.amc_service_visit_id}/allocate-work-to-technician/`;
      } else if (isContract) {
        endpoint = `${baseApi}/amc/contracts/${service.id}/allocate-work-to-technician/`;
      } else {
        endpoint = `${baseApi}/amc/service-records/${service.id}/allocate-work-to-technician/`;
      }

      const method = existingRecord ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: existingRecord ? "Updated!" : "Assigned!",
          text: existingRecord ? "Assignment updated successfully" : "Technician assigned successfully",
          timer: 1500,
          showConfirmButton: false
        });
        onSuccess();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.message || "Failed to save technician assignment");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">
        {/* Header (styled exactly like ServiceManagementForm) */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">
            Allocate work to Technician
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <MdClose size={24} />
          </button>
        </div>

        {/* Form Body (Scrollable container matching other forms) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Info Card */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm focus:outline-none bg-white font-medium text-slate-800"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contact No.</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm focus:outline-none bg-white font-medium text-slate-800"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Select Technician */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Technician <span className="text-red-600">*</span>
              </label>
              {loadingTechs ? (
                <div className="text-sm text-slate-500 py-2">Loading technicians...</div>
              ) : technicians.length === 0 ? (
                <div className="text-sm text-amber-600 py-2 bg-amber-50 rounded px-2">
                  No technicians found. Please create technician accounts first.
                </div>
              ) : (
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm focus:outline-none bg-white"
                >
                  <option value="">-- Choose Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name || t.last_name ? `${t.first_name} ${t.last_name}` : t.email} ({t.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Work Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Work Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Amount <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm focus:outline-none"
              />
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Status <span className="text-red-600">*</span>
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm focus:outline-none bg-white"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* GPS Location (Text Area) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              GPS Location
            </label>
            <textarea
              rows="2"
              placeholder="Enter coordinates or GPS address details..."
              value={gpsLocation}
              onChange={(e) => setGpsLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm focus:outline-none"
            ></textarea>
          </div>

          {/* Work Description (Text Area) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Work Description / Instructions
            </label>
            <textarea
              rows="3"
              placeholder="Add specific instructions for the technician..."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm focus:outline-none"
            ></textarea>
          </div>

          {/* Footer (styled matching the main service form) */}
          <div className="flex gap-3 pt-4 border-t justify-end bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || technicians.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:bg-gray-400 font-medium transition text-sm"
            >
              {submitting
                ? (existingRecord ? "Updating Assign..." : "Assigning...")
                : (existingRecord ? "Update Assign" : "Assign")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
