import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function EditServiceVisitForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  token,
  visit = null,
}) {
  const [plannedDate, setPlannedDate] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [techLoading, setTechLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    if (!open || !visit) return;
    setPlannedDate(visit.planned_date || "");
    setWorkDescription(visit.work_description || "");
    setSelectedTechnician(
      visit.technician_id ? String(visit.technician_id) : ""
    );
  }, [open, visit]);

  useEffect(() => {
    if (!open || !token) return;

    const fetchTechnicians = async () => {
      setTechLoading(true);
      try {
        const res = await fetch(`${baseApi}/amc/technician-work-records/technicians/`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setTechnicians(Array.isArray(data) ? data : data.results || []);
        } else {
          const staffRes = await fetch(`${baseApi}/auth/staff/`, { headers });
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            const list = staffData.results || staffData;
            setTechnicians(
              (Array.isArray(list) ? list : []).filter(
                (u) => u.role?.name?.toLowerCase() === "technician"
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to load technicians", err);
      } finally {
        setTechLoading(false);
      }
    };

    fetchTechnicians();
  }, [open, baseApi, token]);

  if (!open || !visit) return null;

  const isAllocated = Boolean(visit.is_allocated || visit.technician_work_record_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plannedDate) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please select service date" });
      return;
    }

    setLoading(true);
    try {
      if (isAllocated && visit.technician_work_record_id) {
        const wrPayload = {
          work_date: plannedDate,
          work_description: workDescription,
        };
        if (selectedTechnician) {
          wrPayload.technician = parseInt(selectedTechnician, 10);
        }
        const wrRes = await fetch(
          `${baseApi}/amc/technician-work-records/${visit.technician_work_record_id}/`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify(wrPayload),
          }
        );
        if (!wrRes.ok) {
          const err = await wrRes.json().catch(() => ({}));
          throw new Error(
            err.detail || err.message || "Failed to update technician work record"
          );
        }
      } else {
        const res = await fetch(`${baseApi}/amc/service-visits/${visit.id}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            planned_date: plannedDate,
            work_description: workDescription,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || err.message || "Failed to update service visit");
        }

        if (selectedTechnician) {
          const allocRes = await fetch(
            `${baseApi}/amc/service-visits/${visit.id}/allocate-work-to-technician/`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                technician: parseInt(selectedTechnician, 10),
                work_date: plannedDate,
                work_description: workDescription,
                payment_amount: visit.amount,
                payment_status: "pending",
              }),
            }
          );
          if (!allocRes.ok) {
            const err = await allocRes.json().catch(() => ({}));
            throw new Error(
              err.detail || err.message || "Visit saved but technician allocation failed"
            );
          }
        }
      }

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: selectedTechnician && !isAllocated
          ? "Service visit updated and technician assigned"
          : "Service visit updated successfully",
        timer: 1200,
        showConfirmButton: false,
      });
      onSuccess?.();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] mt-15">
      <div className="bg-white w-full max-w-lg rounded-md shadow-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Edit Service Visit {visit.visit_number ? `#${visit.visit_number}` : ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Service Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Technician
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              disabled={techLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-50"
            >
              <option value="">— Not assigned yet —</option>
              {technicians.map((t) => {
                const label =
                  t.display_name ||
                  `${t.first_name || ""} ${t.last_name || ""}`.trim() ||
                  t.email ||
                  `Technician #${t.id}`;
                return (
                  <option key={t.id} value={t.id}>
                    {label}
                  </option>
                );
              })}
            </select>
            {techLoading && (
              <p className="text-xs text-slate-400 mt-1">Loading technicians...</p>
            )}
            {!isAllocated && selectedTechnician && (
              <p className="text-xs text-slate-500 mt-1">
                Saving will assign this technician to the visit (per-visit amount: ₹
                {parseFloat(visit.amount || 0).toLocaleString("en-IN")}).
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Work Description / Instructions
            </label>
            <textarea
              rows="3"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="Add instructions for technician..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm disabled:bg-gray-400"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
