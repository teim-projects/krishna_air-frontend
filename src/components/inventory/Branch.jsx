import { useState, useEffect, useMemo } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import AddBranchForm from "./AddBranchForm";

export default function Branch() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  
  // State for branches list
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  // Fetch branches from API (will be implemented later)
  const fetchBranches = async () => {
    setLoading(true);
    try {
      // Note: Update this URL when backend is ready
      const response = await fetch(`${BASE_API}/inventory/branches/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setBranches(data.results || data);
    } catch (error) {
      console.error("Error fetching branches:", error);
      // Don't show error alert for now since backend is not ready
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: "Failed to fetch branches"
      // });
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches on component mount (commented out until backend is ready)
  useEffect(() => {
     fetchBranches();
  }, []);

  // Handle delete branch
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete branch?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    
    if (!result.isConfirmed) return;

    try {
      // Note: Update this URL when backend is ready
      const response = await fetch(`${BASE_API}/api/branches/${id}/`, {
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
        text: "Branch deleted successfully",
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh branch list
      fetchBranches();
    } catch (error) {
      console.error("Error deleting branch:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.message || "Failed to delete branch"
      });
    }
  };

  // Handle edit branch
  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setShowBranchForm(true);
  };

  // Handle add branch button
  const handleAddBranch = () => {
    setEditingBranch(null);
    setShowBranchForm(true);
  };

  // Handle form success (after add/edit)
  const handleFormSuccess = (data) => {
    console.log("Branch saved:", data);
    // Refresh branch list
    fetchBranches();
    setEditingBranch(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Branch Management</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${branches.length} branch(es) found`}
          </div>
        </div>
        <div>
          <button
            onClick={handleAddBranch}
            className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700"
          >
            + Add Branch
          </button>
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Branch Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Primary Contact</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">City</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">State</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">GST No</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Head Office</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                  No branches found. Click "Add Branch" to create one.
                </td>
              </tr>
            ) : (
              branches.map((branch, index) => (
                <tr key={branch.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">{branch.name}</td>
                  <td className="px-4 py-3 text-sm">{branch.email}</td>
                  <td className="px-4 py-3 text-sm">{branch.primary_contact}</td>
                  <td className="px-4 py-3 text-sm">{branch.city}</td>
                  <td className="px-4 py-3 text-sm">{branch.state}</td>
                  <td className="px-4 py-3 text-sm">{branch.gst_no || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {branch.is_head_office ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Yes</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
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

      {/* Add / Edit Branch Modal */}
      <AddBranchForm
        open={showBranchForm}
        onClose={() => {
          setShowBranchForm(false);
          setEditingBranch(null);
        }}
        baseApi={BASE_API}
        branch={editingBranch}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
