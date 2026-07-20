import { useEffect, useState, useMemo } from "react";
import { MdEdit, MdDelete, MdRemoveRedEye, MdPictureAsPdf } from "react-icons/md";
import Swal from "sweetalert2";
import DeliveryChallanForm from "./DeliveryChallanForm";
import Pagination from "../Pagination";

export default function DeliveryChallan({ base_api, filters }) {
  const [dcList, setDcList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDcForm, setShowDcForm] = useState(false);
  const [editingDc, setEditingDc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 10;
  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      "",
    []
  );

  const fetchDC = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("page_size", PAGE_SIZE);

      if (filters) {
        if (filters.search) params.append("search", filters.search);
        if (filters.status && filters.status !== "All") {
          params.append("status", filters.status.toLowerCase());
        }
      }

      const response = await fetch(
        `${base_api}/inventory/delivery-challan/?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json();
      if (data.results) {
        setDcList(data.results);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / PAGE_SIZE));
        setCurrentPage(page);
      } else {
        const list = Array.isArray(data) ? data : [];
        setDcList(list);
        setTotalCount(list.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching delivery challans:", err);
      setDcList([]);
      setTotalCount(0);
      setTotalPages(1);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch delivery challans",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDC(1);
  }, [filters]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Delivery Challan?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${base_api}/inventory/delivery-challan/${id}/`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      if (!response.ok) throw new Error("Delete failed");

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Delivery Challan deleted successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchDC(currentPage);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete delivery challan",
      });
    }
  };

  const handleViewPDF = (id) => {
    window.open(`${base_api}/inventory/delivery-challan/${id}/pdf/`, "_blank");
  };

  const handleDownloadPDF = (id) => {
    window.open(
      `${base_api}/inventory/delivery-challan/${id}/pdf/?download=1`,
      "_blank"
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: "bg-yellow-100 text-yellow-800",
      in_transit: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
    };
    const style = map[status?.toLowerCase()] || "bg-slate-100 text-slate-800";
    const label = status
      ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Unknown";

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${style}`}>
        {label}
      </span>
    );
  };

  const openCreateForm = () => {
    setEditingDc(null);
    setShowDcForm(true);
  };

  const closeModal = () => {
    setShowDcForm(false);
    setEditingDc(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-md shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Delivery Challan Management</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${totalCount} delivery challan(s) found`}
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={openCreateForm}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 text-center font-medium"
            type="button"
          >
            + Add Delivery Challan
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">DC Number</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Issue Number</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Dispatch Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Destination</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Delivery Partner</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                  Loading delivery challans...
                </td>
              </tr>
            ) : dcList.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                  No delivery challans found. Click "+ Add Delivery Challan" to create one.
                </td>
              </tr>
            ) : (
              dcList.map((dc, index) => (
                <tr key={dc.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{dc.dc_number || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    {dc.material_issue_details?.issue_number || dc.issue_number || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">{dc.dispatch_date || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    {dc.delivery_destination_name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {dc.delivery_partner_name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(dc.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewPDF(dc.id)}
                        className="px-2 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300"
                        title="View PDF"
                        type="button"
                      >
                        <MdRemoveRedEye />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(dc.id)}
                        className="px-2 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300"
                        title="Download PDF"
                        type="button"
                      >
                        <MdPictureAsPdf />
                      </button>
                      <button
                        onClick={() => {
                          setEditingDc(dc);
                          setShowDcForm(true);
                        }}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                        title="Edit"
                        type="button"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(dc.id)}
                        className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
                        title="Delete"
                        type="button"
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            fetchDC(page);
          }}
          totalItems={totalCount}
          showInfo={true}
          size="md"
          variant="default"
        />
      </div>

      <DeliveryChallanForm
        open={showDcForm}
        onClose={closeModal}
        onSuccess={() => {
          closeModal();
          fetchDC(currentPage);
        }}
        base_api={base_api}
        dc={editingDc}
      />
    </div>
  );
}
