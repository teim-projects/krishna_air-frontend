import { useState, useEffect, useMemo } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import AddSiteForm from "./AddSiteForm";

export default function Site() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  
  // State for sites list
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  // Fetch sites from API (will be implemented later)
  const fetchSites = async () => {
    setLoading(true);
    try {
      // Note: Update this URL when backend is ready
      const response = await fetch(`${BASE_API}/inventory/sites/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSites(data.results || data);
    } catch (error) {
      console.error("Error fetching sites:", error);
      // Don't show error alert for now since backend is not ready
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: "Failed to fetch sites"
      // });
    } finally {
      setLoading(false);
    }
  };

  // Fetch sites on component mount (commented out until backend is ready)
  useEffect(() => {
    fetchSites();
  }, []);

  // Handle delete site
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete site?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    
    if (!result.isConfirmed) return;

    try {
      // Note: Update this URL when backend is ready
      const response = await fetch(`${BASE_API}/api/sites/${id}/`, {
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
        text: "Site deleted successfully",
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh site list
      fetchSites();
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
  const handleEdit = (site) => {
    setEditingSite(site);
    setShowSiteForm(true);
  };

  // Handle add site button
  const handleAddSite = () => {
    setEditingSite(null);
    setShowSiteForm(true);
  };

  // Handle form success (after add/edit)
  const handleFormSuccess = (data) => {
    console.log("Site saved:", data);
    // Refresh site list
    fetchSites();
    setEditingSite(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Site Management</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${sites.length} site(s) found`}
          </div>
        </div>
        <div>
          <button
            onClick={handleAddSite}
            className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700"
          >
            + Add Site
          </button>
        </div>
      </div>

      {/* Sites Table */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Site Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Shortcut</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">City</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">State</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Pincode</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Owner Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Owner Contact</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                  No sites found. Click "Add Site" to create one.
                </td>
              </tr>
            ) : (
              sites.map((site, index) => (
                <tr key={site.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">{site.name}</td>
                  <td className="px-4 py-3 text-sm">{site.site_shortcut || "-"}</td>
                  <td className="px-4 py-3 text-sm">{site.city}</td>
                  <td className="px-4 py-3 text-sm">{site.state}</td>
                  <td className="px-4 py-3 text-sm">{site.pincode}</td>
                  <td className="px-4 py-3 text-sm">{site.owner_name}</td>
                  <td className="px-4 py-3 text-sm">{site.owner_contact}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(site)}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(site.id)}
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
      <AddSiteForm
        open={showSiteForm}
        onClose={() => {
          setShowSiteForm(false);
          setEditingSite(null);
        }}
        baseApi={BASE_API}
        site={editingSite}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
