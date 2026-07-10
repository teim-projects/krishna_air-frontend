import { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdPersonAdd, MdAssignmentInd } from "react-icons/md";
import Swal from "sweetalert2";
import ServiceManagementForm from "./ServiceManagementForm";
import AssignTechnicianModal from "./AssignTechnicianModal";

export default function ServiceManagementList({ baseApi, token, filters = {} }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningService, setAssigningService] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      let url = `${baseApi}/amc/service-records/`;
      if (filters?.search) {
        url += `?search=${encodeURIComponent(filters.search)}`;
      }
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data.results || data);
      } else {
        throw new Error("Failed to load services");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch services" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [baseApi, token, filters]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this service record",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/amc/service-records/${id}/`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Service record deleted successfully", timer: 1200 });
        fetchServices();
      } else {
        throw new Error("Failed to delete service record");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const filteredServices = services.filter((item) => {
    if (!typeFilter) return true;
    if (typeFilter === "amc") {
      return item.contract_type === "amc";
    }
    return item.contract_type === "one_time" || item.contract_type === "warranty";
  });

  const getTypeLabel = (contractType) => {
    if (contractType === "one_time") return "One Time";
    if (contractType === "warranty") return "Warranty";
    if (contractType === "amc") return "AMC";
    return contractType?.toUpperCase() || "—";
  };

  const emptyMessage =
    typeFilter === "amc"
      ? 'No AMC service records found. Click "+ Add Service" to create one.'
      : typeFilter === "one_time_warranty"
        ? 'No One Time or Warranty service records found. Click "+ Add Service" to create one.'
        : 'No service records found. Click "+ Add Service" to create one.';

  return (
    <div className="space-y-6">
      {/* Header card matching PackageList */}
      <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Service Management Records</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${filteredServices.length} service(s) found`}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter("amc")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              typeFilter === "amc"
                ? "bg-sky-600 text-white hover:bg-sky-700"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100"
            }`}
          >
            AMC Services
          </button>
          <button
            onClick={() => setTypeFilter("one_time_warranty")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              typeFilter === "one_time_warranty"
                ? "bg-sky-600 text-white hover:bg-sky-700"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100"
            }`}
          >
            One Time / Warranty
          </button>
          <button
            onClick={() => {
              setSelectedService(null);
              setShowAddForm(true);
            }}
            className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Table Card matching PackageList */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Customer Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Start Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">End Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Total Amount</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                  Loading services...
                </td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredServices.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.customer_name}</td>
                  <td className="px-4 py-3 text-sm">{item.customer_contact}</td>
                  <td className="px-4 py-3 text-sm">{item.subject}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      {getTypeLabel(item.contract_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(item.contract_status)}`}>
                      {item.contract_status?.charAt(0).toUpperCase() + item.contract_status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.service_start_date
                      ? new Date(item.service_start_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.service_end_date
                      ? new Date(item.service_end_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">₹{parseFloat(item.total_price_with_gst || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Assign Technician button */}
                      {item.contract_type?.toLowerCase() !== "amc" && (
                        item.assigned_technicians && item.assigned_technicians.length > 0 ? (
                          <button
                            onClick={() => {
                              setAssigningService(item);
                              setShowAssignModal(true);
                            }}
                            className="px-2 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300 transition"
                            title={`Assigned: ${item.assigned_technicians.map((t) => t.name).join(", ")}`}
                          >
                            <MdAssignmentInd />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setAssigningService(item);
                              setShowAssignModal(true);
                            }}
                            className="px-2 py-1 bg-purple-200 text-purple-800 rounded hover:bg-purple-300 transition"
                            title="Assign Technician"
                          >
                            <MdPersonAdd />
                          </button>
                        )
                      )}

                      <button
                        onClick={() => {
                          setSelectedService(item);
                          setShowAddForm(true);
                        }}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form - Only shows when button is clicked */}
      {showAddForm && (
        <ServiceManagementForm
          key={selectedService?.id ?? `new-${typeFilter}`}
          open={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setSelectedService(null);
          }}
          onSuccess={() => {
            setShowAddForm(false);
            setSelectedService(null);
            fetchServices();
          }}
          baseApi={baseApi}
          service={selectedService}
          token={token}
          defaultContractType={typeFilter === "amc" ? "amc" : "one_time"}
        />
      )}

      {/* Assign Technician Modal */}
      {showAssignModal && assigningService && (
        <AssignTechnicianModal
          open={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningService(null);
          }}
          onSuccess={() => {
            setShowAssignModal(false);
            setAssigningService(null);
            fetchServices();
          }}
          baseApi={baseApi}
          token={token}
          service={assigningService}
        />
      )}
    </div>
  );
}
