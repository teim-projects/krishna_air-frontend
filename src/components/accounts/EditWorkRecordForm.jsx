import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";

export default function EditWorkRecordForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  workRecord = null,
}) {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [workDescription, setWorkDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [techLoading, setTechLoading] = useState(false);
  const BASE_API = baseApi;

  const token = useMemo(() => {
    return (
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      ""
    );
  }, []);

  // Fetch active technicians
  useEffect(() => {
    if (!open || !token) return;

    const fetchTechnicians = async () => {
      setTechLoading(true);
      try {
        const res = await fetch(`${BASE_API}/amc/technician-work-records/technicians/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setTechnicians(data);
        } else {
          console.error("Failed to fetch technicians:", res.statusText);
        }
      } catch (err) {
        console.error("Error fetching technicians:", err);
      } finally {
        setTechLoading(false);
      }
    };

    fetchTechnicians();
  }, [open, BASE_API, token]);

  // Sync state values with workRecord prop
  useEffect(() => {
    if (workRecord) {
      setSelectedTechnician(workRecord.technician || "");
      setWorkDate(workRecord.work_date || "");
      setWorkDescription(workRecord.work_description || "");
    }
  }, [workRecord, open]);

  if (!open || !workRecord) return null;

  const validate = () => {
    if (!selectedTechnician) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please select a technician" });
      return false;
    }
    if (!workDate) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please select a visit date" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const payload = {
      technician: selectedTechnician,
      work_date: workDate,
      work_description: workDescription, // remarks mapped to work_description
    };

    const url = `${BASE_API}/amc/technician-work-records/${workRecord.id}/`;

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.non_field_errors?.[0] ||
            JSON.stringify(data) ||
            `${res.status} ${res.statusText}`
        );
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Work record updated successfully",
        timer: 1200,
        showConfirmButton: false,
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update work record",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-xl hover:text-slate-900 text-slate-500"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-4">Edit Work Record</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Technician Dropdown */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Assign Technician</label>
            <select
              className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              disabled={techLoading}
            >
              <option value="">Select Technician</option>
              {technicians.map((t) => {
                const displayName = `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.email;
                return (
                  <option key={t.id} value={t.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
            {techLoading && <span className="text-xs text-slate-400 mt-1 block">Loading technicians...</span>}
          </div>

          {/* Visit Date */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Visit Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
            />
          </div>

          {/* Remark */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Remark</label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              rows="3"
              placeholder="Enter remarks..."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-slate-700 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
