import { useState, useEffect } from "react";
import AddServiceModal from "./AddServiceModal";
import axios from "axios";
import Pagination from "../Pagination";

const InstallationWork = ({ base_api, filters }) => {
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
  });

  // Fetch services with pagination
  const fetchServices = async (page = 1) => {
    setLoading(true);
    try {
      console.log("Fetching services from:", `${base_api}/quotation/service-masters/`);

      const response = await axios.get(
        `${base_api}/quotation/service-masters/`,  // Remove ?page=${page}
        authHeaders()
      );

      console.log("Services API response:", response.data);

      // Handle non-paginated response (since pagination_class = None in backend)
      const data = response.data;
      const rows = Array.isArray(data) ? data : (data?.results ?? []);

      console.log("Services rows:", rows);
      setServices(rows);

      // Calculate pagination for frontend display
      const count = rows.length;
      const calculatedPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

      setTotalCount(count);
      setTotalPages(calculatedPages);

      // Get items for current page
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedRows = rows.slice(startIndex, endIndex);

      setServices(paginatedRows);
      setCurrentPage(page);

    } catch (err) {
      console.error("Error fetching services:", err);
      console.error("Error details:", err.response?.data);
      alert("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  // Filter services with pagination
  const filterServices = async (filters = {}, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Add filter parameters (no page parameter since backend doesn't use pagination)
      if (filters.category) params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.service_type) params.set("service_type", filters.service_type);
      if (filters.search && filters.search.trim()) params.set("search", filters.search);

      const url = `${base_api}/quotation/service-masters/?${params.toString()}`;
      console.log("🔎 Filter URL:", url);

      const response = await axios.get(url, authHeaders());

      // Handle non-paginated response
      const data = response.data;
      const rows = Array.isArray(data) ? data : (data?.results ?? []);

      // Calculate pagination for frontend display
      const count = rows.length;
      const calculatedPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

      setTotalCount(count);
      setTotalPages(calculatedPages);

      // Get items for current page
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedRows = rows.slice(startIndex, endIndex);

      setServices(paginatedRows);
      setCurrentPage(page);

    } catch (err) {
      console.error("Error filtering services:", err);
      alert("Failed to filter services");
    } finally {
      setLoading(false);
    }
  };

  // Delete service
  const handleDelete = async (serviceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${base_api}/quotation/service-masters-create/${serviceId}/`,
        authHeaders()
      );
      alert("Service deleted successfully!");
      fetchServices(currentPage); // Refresh current page
    } catch (err) {
      console.error("Error deleting service:", err);
      alert(`Failed to delete service: ${err.response?.data?.detail || err.message}`);
    }
  };


  // Fetch services on mount and when filters change
  useEffect(() => {
    const hasAnyFilter = filters && Object.values(filters).some(
      v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
    );

    if (hasAnyFilter) {
      filterServices(filters, 1);  // Reset to page 1 when filters change
    } else {
      fetchServices(1);  // Reset to page 1 when no filters
    }
  }, [base_api, filters]);

  return (
    <div className="bg-white rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Installation Work Services</h2>
          <p className="text-sm text-gray-500">{totalCount} service(s) available</p>
        </div>

        <div className="flex gap-3">
          {/* Add Service Button */}
          <button
            onClick={() => setShowAddServiceModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <span className="text-xl">+</span>
            Add Service
          </button>
        </div>
      </div>

      {/* Table */}
      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-md text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm">SR.NO</th>
              <th className="px-6 py-3 text-sm">SERVICE TYPE</th>
              <th className="px-6 py-3 text-sm">SERVICE NAME</th>
              <th className="px-6 py-3 text-sm">CATEGORY</th>
              <th className="px-6 py-3 text-sm">UNIT</th>
              <th className="px-6 py-3 text-sm">RATE</th>
              <th className="px-6 py-3 text-sm text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  Loading services...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No services found. Click "+ Add Service" to create one.
                </td>
              </tr>
            ) : (
              services.map((service, index) => (
                <tr key={service.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.service_type === 'MATERIAL'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                      }`}>
                      {service.service_type === 'MATERIAL' ? 'Material' : 'Labor'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{service.name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{service.category || "—"}</td>
                  <td className="px-4 py-3 text-sm">{service.unit || "—"}</td>
                  <td className="px-4 py-3 text-sm font-semibold">₹{service.total_rate || "0"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2 justify-center items-center">
                      {/* Edit Icon */}
                      <button
                        onClick={() => {
                          setServiceToEdit(service);
                          setShowAddServiceModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit Service"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Service"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={(newPage) => {
            // Safeguard: Don't allow navigation beyond total pages
            if (newPage < 1 || newPage > totalPages) {
              console.warn(`Invalid page ${newPage}. Total pages: ${totalPages}`);
              return;
            }

            // Check if filters are active
            const hasAnyFilter = filters && Object.values(filters).some(
              v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
            );

            // Call appropriate function
            hasAnyFilter ? filterServices(filters, newPage) : fetchServices(newPage);
          }}
        />
      </div>

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={showAddServiceModal}
        onClose={() => {
          setShowAddServiceModal(false);
          setServiceToEdit(null);
        }}
        baseApi={base_api}
        serviceToEdit={serviceToEdit}
        onServiceAdd={() => {
          console.log("Service saved - refreshing list...");
          if (serviceToEdit) {
            fetchServices(currentPage);
          } else {
            fetchServices(1);
            setCurrentPage(1);
          }
        }}
      />
    </div>
  );
};

export default InstallationWork;
