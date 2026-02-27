import React, { useState, useEffect, useMemo } from "react";
// import Base from "../components/Base";
import { MdEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import AddVendorForm from "./AddVendorForm";

export default function Vendor() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  
  // State for vendors list
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  // Fetch vendors from API
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_API}/inventory/vendors/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setVendors(data.results || data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch vendors"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  // Handle delete vendor
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete vendor?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${BASE_API}/inventory/vendors/${id}/`, {
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
        text: "Vendor deleted successfully",
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh vendor list
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.message || "Failed to delete vendor"
      });
    }
  };

  // Handle edit vendor
  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setShowVendorForm(true);
  };

  // Handle add vendor button
  const handleAddVendor = () => {
    setEditingVendor(null);
    setShowVendorForm(true);
  };

  // Handle form success (after add/edit)
  const handleFormSuccess = (data) => {
    console.log("Vendor saved:", data);
    // Refresh vendor list
    fetchVendors();
    setEditingVendor(null);
  };

  return (
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Vendor Management</h2>
            <div className="text-sm text-slate-600">
              {loading ? "Loading..." : `${vendors.length} vendor(s) found`}
            </div>
          </div>
          <div>
            <button
              onClick={handleAddVendor}
              className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700"
            >
              + Add Vendor
            </button>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-md shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vendor Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mobile</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">State</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">GST</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Office POC</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                    No vendors found. Click "Add Vendor" to create one.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor, index) => (
                  <tr key={vendor.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{vendor.name}</td>
                    <td className="px-4 py-3 text-sm">{vendor.email}</td>
                    <td className="px-4 py-3 text-sm">{vendor.mobile}</td>
                    <td className="px-4 py-3 text-sm">{vendor.state || "-"}</td>
                    <td className="px-4 py-3 text-sm">{vendor.gst_details}</td>
                    <td className="px-4 py-3 text-sm">{vendor.supplier_category || "-"}</td>
                    <td className="px-4 py-3 text-sm">{vendor.office_poc_name}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                          title="Edit"
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
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


      {/* Add / Edit Vendor Modal */}

      <AddVendorForm
        open={showVendorForm}
        onClose={() => {
          setShowVendorForm(false);
          setEditingVendor(null);
        }}
        baseApi={BASE_API}
        vendor={editingVendor}
        onSuccess={handleFormSuccess}
      />
       </div>
  );
}
