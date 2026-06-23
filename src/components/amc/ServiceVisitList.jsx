import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdBuild } from "react-icons/md";
import Swal from "sweetalert2";
import AddServiceVisitForm from "./AddServiceVisitForm";

export default function ServiceVisitList({ baseApi, token }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);

  // Modal for adding parts
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [partsVisitId, setPartsVisitId] = useState(null);
  const [partData, setPartData] = useState({
    inventory_item: "",
    quantity: 1,
    rate_per_unit: "",
    include_in_customer_invoice: false
  });
  const [expandedVisits, setExpandedVisits] = useState({});

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseApi}/amc/services/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(data.results || data);
      } else {
        throw new Error("Failed to load visits");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch visits" });
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${baseApi}/inventory/inventory/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInventoryItems(data.results || data);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  useEffect(() => {
    fetchVisits();
    fetchInventory();
  }, [baseApi, token]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this visit record",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/amc/services/${id}/`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Visit record deleted successfully", timer: 1200 });
        fetchVisits();
      } else {
        throw new Error("Failed to delete visit");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleAddParts = (visitId) => {
    setPartsVisitId(visitId);
    setPartData({ inventory_item: "", quantity: 1, rate_per_unit: "", include_in_customer_invoice: false });
    setShowPartsModal(true);
  };

  const handlePartsSubmit = async (e) => {
    e.preventDefault();
    if (!partData.inventory_item || !partData.rate_per_unit) {
      Swal.fire({ icon: "error", title: "Validation", text: "All fields are required" });
      return;
    }

    try {
      const res = await fetch(`${baseApi}/amc/services/${partsVisitId}/add_parts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          inventory_item: parseInt(partData.inventory_item),
          quantity: parseInt(partData.quantity),
          rate_per_unit: parseFloat(partData.rate_per_unit),
          include_in_customer_invoice: partData.include_in_customer_invoice
        })
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Parts added successfully", timer: 1200 });
        setShowPartsModal(false);
        fetchVisits();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add parts");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "PENDING_PARTS":
        return "bg-amber-100 text-amber-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section card matching PurchaseOrder */}
      <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Service Visit Management</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${visits.length} service visit(s) found`}
          </div>
        </div>
        <div>
          <button
            onClick={() => {
              setSelectedVisit(null);
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 text-sm font-medium"
          >
            + Schedule Visit
          </button>
        </div>
      </div>

      {/* Table Card matching PurchaseOrder */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">AMC Contract</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Visit Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Service Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Engineer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Billable?</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading service visits...
                </td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                  No service visits found. Click "+ Schedule Visit" to create one.
                </td>
              </tr>
            ) : (
              visits.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-600">{item.amc_contract_number || `Contract ID: ${item.amc_contract}`}</td>
                  <td className="px-4 py-3 text-sm">{item.visit_date}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.service_type === "SCHEDULED"
                      ? "Scheduled Maintenance"
                      : item.service_type === "EMERGENCY"
                      ? "Emergency Repair"
                      : "Follow-up"}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.engineer_assigned || "Not Assigned"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.is_billable ? (
                      <span className="text-red-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setExpandedVisits(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className={`px-2 py-1 rounded text-xs font-semibold ${expandedVisits[item.id] ? "bg-purple-400 text-purple-900" : "bg-purple-200 text-purple-800 hover:bg-purple-300"}`}
                        title="View Spare Parts"
                      >
                        Parts ({item.parts_used?.length || 0})
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVisit(item);
                          setShowAddForm(true);
                        }}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
                      {item.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleAddParts(item.id)}
                          className="px-2 py-1 bg-indigo-200 text-indigo-800 rounded hover:bg-indigo-300"
                          title="Add Spare Parts"
                        >
                          <MdBuild />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
                        title="Delete"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              )).reduce((acc, row, idx) => {
                // Map visits.map elements to alternating Fragment row pairs
                const item = visits[idx];
                acc.push(
                  <React.Fragment key={`group-${item.id}`}>
                    {row}
                    {expandedVisits[item.id] && (
                      <tr className="bg-slate-50">
                        <td colSpan="8" className="px-8 py-3">
                          <div className="border border-slate-200 rounded-md bg-white p-3 space-y-2 shadow-sm">
                            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Spare Parts & Low Side Materials Used
                            </h4>
                            {(!item.parts_used || item.parts_used.length === 0) ? (
                              <p className="text-sm text-slate-500 italic">No spare parts/materials recorded for this visit.</p>
                            ) : (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b text-left text-slate-600 font-medium">
                                    <th className="py-1">Part / Material</th>
                                    <th className="py-1">Quantity</th>
                                    <th className="py-1">Rate</th>
                                    <th className="py-1">Total Cost</th>
                                    <th className="py-1">Billable?</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {item.parts_used.map((part) => (
                                    <tr key={part.id} className="text-slate-600">
                                      <td className="py-1 font-medium">{part.product_name || "Unknown"}</td>
                                      <td className="py-1">{part.quantity_used}</td>
                                      <td className="py-1">₹{part.rate_per_unit}</td>
                                      <td className="py-1 font-semibold">₹{part.total_cost}</td>
                                      <td className="py-1">
                                        {part.include_in_customer_invoice ? (
                                          <span className="text-red-600 font-medium">Yes</span>
                                        ) : (
                                          <span className="text-slate-500">No (Inclusive)</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
                return acc;
              }, [])
            )}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <AddServiceVisitForm
          open={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setSelectedVisit(null);
          }}
          onSuccess={() => {
            fetchVisits();
          }}
          base_api={baseApi}
          visit={selectedVisit}
        />
      )}

      {showPartsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Spare Part / Material</h3>
              <button onClick={() => setShowPartsModal(false)} className="text-xl hover:text-red-500">
                ✕
              </button>
            </div>
            <form onSubmit={handlePartsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Select Spare Part / Material</label>
                <select
                  value={partData.inventory_item}
                  onChange={(e) => setPartData({ ...partData, inventory_item: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Item...</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.display_name || item.item_name || item.product_variant_name} (Qty: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={partData.quantity}
                  onChange={(e) => setPartData({ ...partData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Rate per Unit (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={partData.rate_per_unit}
                  onChange={(e) => setPartData({ ...partData, rate_per_unit: e.target.value })}
                  placeholder="Rate per unit"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="include_in_customer_invoice"
                  checked={partData.include_in_customer_invoice}
                  onChange={(e) => setPartData({ ...partData, include_in_customer_invoice: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="include_in_customer_invoice" className="text-sm text-slate-700 select-none">
                  Billable? (Include in customer invoice)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPartsModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
