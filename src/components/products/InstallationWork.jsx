import { useState, useEffect } from "react";
import AddServiceModal from "./AddServiceModal";
import ServiceSelectionEngine from "./ServiceSelectionEngine";
import axios from "axios";
import Pagination from "../Pagination";

const InstallationWork = ({ base_api, filters }) => {
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showSetServiceModal, setShowSetServiceModal] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);

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
      const response = await axios.get(
        `${base_api}/quotation/service-masters/?page=${page}`,
        authHeaders()
      );

      // Handle paginated response
      const data = response.data;
      const rows = data?.results ?? [];

      setServices(rows);

      // Calculate pagination
      const count = data?.count ?? rows.length;
      const calculatedPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

      setTotalCount(count);
      setTotalPages(calculatedPages);

      // Ensure current page doesn't exceed total pages
      if (page > calculatedPages && calculatedPages > 0) {
        setCurrentPage(calculatedPages);
      } else {
        setCurrentPage(page);
      }

    } catch (err) {
      console.error("Error fetching services:", err);
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
      params.set("page", page);

      // Add filter parameters
      if (filters.category) params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.service_type) params.set("service_type", filters.service_type);
      if (filters.search && filters.search.trim()) params.set("search", filters.search);

      const url = `${base_api}/quotation/service-masters/?${params.toString()}`;
      console.log("🔎 Filter URL:", url);

      const response = await axios.get(url, authHeaders());

      const data = response.data;
      const rows = data?.results ?? [];

      setServices(rows);

      const count = data?.count ?? rows.length;
      const calculatedPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

      setTotalCount(count);
      setTotalPages(calculatedPages);

      // Ensure current page doesn't exceed total pages
      if (page > calculatedPages && calculatedPages > 0) {
        setCurrentPage(calculatedPages);
      } else {
        setCurrentPage(page);
      }

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
        `${base_api}/quotation/service-masters/${serviceId}/`,
        authHeaders()
      );
      alert("Service deleted successfully!");
      fetchServices(); // Refresh the list
    } catch (err) {
      console.error("Error deleting service:", err);
      alert(`Failed to delete service: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Handle service selection
  const handleServiceSelection = (data) => {
    setSelectedServices(data.services || []);
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

          {/* Set Service Materials Button */}
          <button
            onClick={() => setShowSetServiceModal(true)}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            🔧 Set Service Materials
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-md text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm">SR.NO</th>
              <th className="px-6 py-3 text-sm">SERVICE NAME</th>
              <th className="px-6 py-3 text-sm">CATEGORY</th>
              <th className="px-6 py-3 text-sm">SUBCATEGORY</th>
              <th className="px-6 py-3 text-sm">TYPE</th>
              <th className="px-6 py-3 text-sm">UNIT</th>
              <th className="px-6 py-3 text-sm">RATE</th>
              <th className="px-6 py-3 text-sm">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  Loading services...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  No services found. Click "+ Add Service" to create one.
                </td>
              </tr>
            ) : (
              services.map((service, index) => (
                <tr key={service.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td className="px-4 py-3 text-sm">{service.name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{service.category_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{service.subcategory_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.service_type === 'MATERIAL' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {service.service_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{service.unit || "—"}</td>
                  <td className="px-4 py-3 text-sm">₹{service.total_rate || "0"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2 justify-center">
                      {/* Edit Icon */}
                      <button
                        onClick={() => {
                          // Handle edit - you can implement this later
                          console.log("Edit service:", service.id);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Service"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Service"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        onClose={() => setShowAddServiceModal(false)}
        baseApi={base_api}
        onServiceAdd={() => {
          fetchServices(); // Refresh list after adding
        }}
      />

      {/* Set Service Materials Modal */}
      {showSetServiceModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start sm:items-center p-6 z-50 mt-15">
          <div className="relative w-full max-w-4xl p-6 bg-white rounded-md shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Set Service Materials</h2>
              <button
                onClick={() => setShowSetServiceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <ServiceSelectionEngine
              base_api={base_api}
              onSelectionChange={handleServiceSelection}
              resetTrigger={false}
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSetServiceModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle selected services
                  console.log("Selected services:", selectedServices);
                  setShowSetServiceModal(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Apply Services
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationWork;
