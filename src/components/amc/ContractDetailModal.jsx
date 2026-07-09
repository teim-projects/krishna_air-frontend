import { MdClose, MdPersonAdd, MdEdit, MdDelete } from "react-icons/md";
import AssignTechnicianModal from "./AssignTechnicianModal";
import EditWorkRecordForm from "../accounts/EditWorkRecordForm";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function ContractDetailModal({ contract, baseApi, token, onClose }) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const fetchVisits = async () => {
    if (!contract?.service_record_id) return;
    setLoadingVisits(true);
    try {
      const res = await fetch(`${baseApi}/amc/technician-work-records/?service_record=${contract.service_record_id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch service visits", err);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [contract?.service_record_id, baseApi, token]);

  const handleEditWorkRecord = (record) => {
    setEditingRecord(record);
  };

  const handleDeleteWorkRecord = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${baseApi}/amc/technician-work-records/${id}/`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Work record has been deleted.",
            timer: 1500,
            showConfirmButton: false
          });
          fetchVisits();
        } else {
          throw new Error("Failed to delete record");
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message });
      }
    }
  };

  if (!contract) return null;

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE: "bg-green-100 text-green-800",
      EXPIRED: "bg-red-100 text-red-800",
      CANCELLED: "bg-amber-100 text-amber-800",
      INACTIVE: "bg-slate-100 text-slate-800",
    };
    return map[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
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
              }[contract.visit_frequency] || "—"}
            </p>
          </div>
        </div>

        {/* Assign Button centered horizontally and below the cards */}
        <div className="px-6 pb-5 flex justify-center">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5"
          >
            <MdPersonAdd size={18} />
            <span>Assign Technician</span>
          </button>
        </div>

        {/* Service Visits Section */}
        {contract?.service_record_id && visits.length > 0 && (
          <div className="px-6 pb-6 border-t pt-5">
            <h3 className="text-md font-bold text-slate-800 mb-3">Service Visits</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Technician</th>
                    <th className="px-4 py-2">Work Date</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Payment Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => (
                    <tr key={visit.id} className="bg-white border-b border-slate-200 hover:bg-slate-50 text-slate-700">
                      <td className="px-4 py-2 font-medium text-slate-900">{visit.technician_name}</td>
                      <td className="px-4 py-2">{visit.work_date}</td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{visit.work_description || "—"}</td>
                      <td className="px-4 py-2">₹{parseFloat(visit.payment_amount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          visit.payment_status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {visit.payment_status === "completed" ? "Completed" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditWorkRecord(visit)}
                            className="p-1 text-amber-600 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                            title="Edit visit"
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteWorkRecord(visit.id)}
                            className="p-1 text-red-600 hover:text-red-950 bg-red-50 hover:bg-red-100 rounded transition-colors"
                            title="Delete visit"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
            fetchVisits();
          }}
          baseApi={baseApi}
          token={token}
          service={contract}
          isContract={true}
        />
      )}

      {editingRecord && (
        <EditWorkRecordForm
          open={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={() => {
            setEditingRecord(null);
            fetchVisits();
          }}
          baseApi={baseApi}
          token={token}
          workRecord={editingRecord}
        />
      )}
    </div>
  );
}
