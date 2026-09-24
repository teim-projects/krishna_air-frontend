import { MdClose, MdPersonAdd, MdEdit } from "react-icons/md";
import AssignTechnicianModal from "./AssignTechnicianModal";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import EditServiceVisitForm from "./EditServiceVisitForm";

export default function ContractDetailModal({ contract, baseApi, token, onClose }) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentDraft, setAssignmentDraft] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  const [serviceVisits, setServiceVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const fetchServiceVisits = async () => {
    if (!contract?.id) return;
    setLoadingVisits(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      let res = await fetch(`${baseApi}/amc/service-visits/?amc_contract=${contract.id}`, { headers });
      if (!res.ok) {
        res = await fetch(`${baseApi}/amc/contracts/${contract.id}/service-visits/`, { headers });
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("AMC service-visits fetch failed:", res.status, text.slice(0, 500));
        setServiceVisits([]);
        return;
      }
      const data = await res.json();
      setServiceVisits(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Failed to fetch AMC service visits", err);
      setServiceVisits([]);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    fetchServiceVisits();
  }, [contract?.id, baseApi, token]);

  const openAllocateForVisit = async (visit) => {
    if (!visit?.id) return;
    try {
      const res = await fetch(
        `${baseApi}/amc/service-visits/${visit.id}/technician-allocation-draft/`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error("Failed to load technician allocation draft");
      const data = await res.json();
      setAssignmentDraft(data);
      setShowAssignModal(true);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to open allocation" });
    }
  };

  if (!contract) return null;

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE: "bg-green-100 text-green-800",
      EXPIRED: "bg-red-100 text-red-800",
      CANCELLED: "bg-amber-100 text-amber-800",
      INACTIVE: "bg-slate-100 text-slate-800",
      CLOSED: "bg-blue-100 text-blue-800",
    };
    return map[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto mt-15">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[820px] my-6">
        <div className="flex items-start justify-between px-6 py-5 border-b bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{contract.contract_number}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {contract.customer_name}
              {contract.amc_type
                ? ` · ${contract.amc_type === "COMPREHENSIVE" ? "Comprehensive" : "Non-Comprehensive"}`
                : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors ml-4">
            <MdClose size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border-b">
          {[
            { label: "AC Variant", value: contract.product_name || "—" },
            { label: "AMC Period", value: `${contract.amc_start_date} → ${contract.amc_end_date}` },
            { label: "AMC Cost", value: `₹${parseFloat(contract.amc_cost || 0).toLocaleString("en-IN")}` },
            { label: "Status", value: contract.status, badge: true },
          ].map(({ label, value, badge }) => (
            <div key={label} className="bg-white px-4 py-3">
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              {badge
                ? <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(value)}`}>{value}</span>
                : <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 whitespace-nowrap">{value}</p>
              }
            </div>
          ))}
        </div>

        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dates</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Sale Date</dt>
                <dd className="font-medium text-slate-700">{contract.sale_date || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Warranty End</dt>
                <dd className="font-medium text-slate-700">{contract.warranty_end_date || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">AMC Included in Sale</dt>
                <dd className="font-medium text-slate-700">{contract.amc_included_in_sale ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Renewal</dt>
                <dd className="font-medium text-slate-700">{contract.is_renewal ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AMC Type</p>
            <p className="text-sm font-medium text-slate-700">
              {contract.amc_type === "COMPREHENSIVE"
                ? "Comprehensive"
                : contract.amc_type === "NON_COMPREHENSIVE"
                  ? "Non-Comprehensive"
                  : "—"}
            </p>
            <p className="text-xs text-slate-500 mt-2">Visit Frequency</p>
            <p className="text-sm font-medium text-slate-700">
              {{
                MONTHLY: "Monthly",
                QUARTERLY: "Quarterly",
                HALF_YEARLY: "Half Yearly",
                YEARLY: "Yearly",
                CUSTOM: "Custom",
              }[contract.visit_frequency] || "—"}
            </p>
            {contract.expected_visit_count != null && (
              <p className="text-xs text-slate-500 mt-1">
                Expected visits: {contract.expected_visit_count}
              </p>
            )}
            {contract.amount_per_visit != null && (
              <p className="text-xs text-slate-500 mt-1">
                Amount per visit: ₹{parseFloat(contract.amount_per_visit || 0).toLocaleString("en-IN")}
                {contract.amc_cost != null && (
                  <span> (total ₹{parseFloat(contract.amc_cost || 0).toLocaleString("en-IN")})</span>
                )}
              </p>
            )}
            {contract.visit_frequency === "CUSTOM" && contract.schedule_note && (
              <p className="text-xs text-slate-500 mt-1">{contract.schedule_note}</p>
            )}
          </div>
        </div>

        {/* Assign Button centered horizontally and below the cards */}
        <div className="px-6 pb-5 flex justify-center">
          <button
            onClick={() => {
              const pending = serviceVisits.find(
                (v) => v?.status === "SCHEDULED" && !v?.is_allocated
              );
              if (!pending) {
                Swal.fire({ icon: "info", title: "No pending visits", text: "All visits are already assigned/completed." });
                return;
              }
              openAllocateForVisit(pending);
            }}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5"
          >
            <MdPersonAdd size={18} />
            <span>Assign Technician</span>
          </button>
        </div>

        {/* Service Visits Section */}
        <div className="px-6 pb-6 border-t pt-5">
          <h3 className="text-md font-bold text-slate-800 mb-3">Service Visits</h3>
          {loadingVisits ? (
            <p className="text-sm text-slate-500">Loading service visits...</p>
          ) : serviceVisits.length === 0 ? (
            <p className="text-sm text-slate-500">
              No service visits yet. Save the AMC again or run migrate + sync if this contract was created before visits were enabled.
            </p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Sr.No</th>
                    <th className="px-4 py-2">Service Date</th>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Technician</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceVisits.map((visit) => {
                    const statusMap = {
                      SCHEDULED: { label: "Scheduled", className: "bg-slate-100 text-slate-700" },
                      ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-800" },
                      COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
                      CANCELLED: { label: "Cancelled", className: "bg-amber-100 text-amber-800" },
                    };
                    const st = statusMap[visit.status] || { label: visit.status || "—", className: "bg-slate-100 text-slate-700" };

                    return (
                      <tr key={visit.id} className="bg-white border-b border-slate-200 hover:bg-slate-50 text-slate-700">
                        <td className="px-4 py-2 text-sm">{visit.visit_number}</td>
                        <td className="px-4 py-2 text-sm">{visit.planned_date}</td>
                        <td className="px-4 py-2 text-sm">{contract.product_name || "—"}</td>
                        <td className="px-4 py-2 text-sm">{visit.technician_name || "—"}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${st.className}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingVisit(visit)}
                              className="p-1 rounded transition-colors text-amber-600 hover:text-amber-950 bg-amber-50 hover:bg-amber-100"
                              title="Edit visit"
                            >
                              <MdEdit size={16} />
                            </button>
                            <button
                              onClick={() => openAllocateForVisit(visit)}
                              disabled={visit?.is_allocated || visit.status === "COMPLETED"}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                visit?.is_allocated || visit.status === "COMPLETED"
                                  ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                                  : "bg-sky-600 hover:bg-sky-700 text-white"
                              }`}
                              title={visit?.is_allocated ? "Already allocated" : "Allocate work to technician"}
                            >
                              Allocate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-slate-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {showAssignModal && (
        <AssignTechnicianModal
          open={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            setAssignmentDraft(null);
            fetchServiceVisits();
          }}
          baseApi={baseApi}
          token={token}
          service={assignmentDraft}
          isContract={true}
        />
      )}

      {editingVisit && (
        <EditServiceVisitForm
          open={!!editingVisit}
          onClose={() => setEditingVisit(null)}
          onSuccess={() => {
            setEditingVisit(null);
            fetchServiceVisits();
          }}
          baseApi={baseApi}
          token={token}
          visit={editingVisit}
        />
      )}
    </div>
  );
}
