import { useState, useEffect, useMemo } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import AddPoFrom from "./AddPoFrom";

export default function PurchaseOrder({ base_api }) {
  const BASE_API = base_api;

  // State for sites list
  const [po, setPo] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showPoForm, setShowPoForm] = useState(false);
  const [editingPo, setEditingPo] = useState(null);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  // Fetch sites from API (will be implemented later)
  const fetchPO = async () => {
    setLoading(true);
    try {
      // Note: Update this URL when backend is ready
      const response = await fetch(`${BASE_API}/inventory/purchase-orders/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setPo(data.results || data);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sites on component mount (commented out until backend is ready)
  useEffect(() => {
    fetchPO();
  }, []);

  // Handle delete site
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete purchase order?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      // Note: Update this URL when backend is ready
      const response = await fetch(`${BASE_API}/inventory/purchase-orders/${id}/`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      Swal.fire({
        icon: "success",
        text: "Purchase Order deleted successfully",
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh site list
      fetchPO();
    } catch (error) {
      console.error("Error deleting site:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.message || "Failed to delete site"
      });
    }
  };

  // Handle edit site
  const handleEdit = (po) => {
    setEditingPo(po);
    setShowPoForm(true);
  };

  // Handle add site button
  const handleAddPo = () => {
    // console.log("Add PO clicked");
    setEditingPo(null);
    setShowPoForm(true);
  };

  // Handle form success (after add/edit)
  const handleFormSuccess = (data) => {
    console.log("Purchase Order saved:", data);
    // Refresh site list
    fetchPO();
    setEditingPo(null);
  };

  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Purchase Order Management</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${po.length} site(s) found`}
          </div>
        </div>
        <div>
          <button
            onClick={handleAddPo}
            className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700"
          >
            + Add Purchase Order
          </button>
        </div>
      </div>

      {/* Sites Table */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vendor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Site</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">PO Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">PO Number</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Contact Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Contact No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Grand Total</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {po.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                  No purchase orders found. Click "Add Purchase Order" to create one.
                </td>
              </tr>
            ) : (
              po.map((order, index) => (
                <tr key={order.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">{order.vendor || "-"}</td>
                  <td className="px-4 py-3 text-sm">{order.site || "-"}</td>
                  <td className="px-4 py-3 text-sm">{order.po_date || "-"}</td>
                  <td className="px-4 py-3 text-sm">{order.purchase_order_no || "-"}</td>
                  <td className="px-4 py-3 text-sm">{order.contact_name || "-"}</td>
                  <td className="px-4 py-3 text-sm">{order.contact_no || "-"}</td>
                  <td className="px-4 py-3 text-sm">₹{order.grand_total || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(order)}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
                        title="Delete"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Site Modal */}
      <AddPoFrom
        open={showPoForm}
        onClose={() => {
          setShowPoForm(false);
          setEditingPo(null);
        }}
        baseApi={BASE_API}
        po={editingPo}
        onSuccess={handleFormSuccess}
        token={token}
      />
    </div>
  );
}
