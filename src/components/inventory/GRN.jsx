import React, { useState, useEffect, useMemo } from "react";
import { MdEdit, MdDelete, MdCheckCircle } from "react-icons/md";
import Swal from "sweetalert2";
import AddGrnForm from "./AddGrnForm";
import TableView from "../TableView";
import axios from "axios";

export default function GRN({ base_api, filters }) {
  const BASE_API = base_api;

  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showGrnForm, setShowGrnForm] = useState(false);
  const [editingGrn, setEditingGrn] = useState(null);
  const PAGE_SIZE = 10;

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  const fetchGrns = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_API}/inventory/grns/?page=${page}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = response.data;
      if (data.results) {
        setGrns(data.results);
        setTotalPages(Math.ceil((data.count || 0) / PAGE_SIZE));
        setCurrentPage(page);
      } else {
        setGrns(data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching GRNs:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch GRNs",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrns(currentPage);
  }, [currentPage]);

  const handleEdit = (grn) => {
    setEditingGrn(grn);
    setShowGrnForm(true);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete GRN?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${BASE_API}/inventory/grns/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "GRN deleted successfully",
      });

      fetchGrns(currentPage);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.detail || "Failed to delete GRN",
      });
    }
  };

  const handleComplete = async (id) => {
    try {
      await axios.post(
        `${BASE_API}/inventory/grns/${id}/complete/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Completed",
        text: "GRN completed",
      });

      fetchGrns(currentPage);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.detail || "Failed to complete GRN",
      });
    }
  };

  const columns = [
    { key: "grn_no", label: "GRN No" },
    {
      key: "purchase_order_details",
      label: "PO No",
      render: (row) => row.purchase_order_details?.purchase_order_no || "N/A",
    },
    {
      key: "vendor",
      label: "Vendor",
      render: (row) => row.purchase_order_details?.vendor_details?.name || "N/A",
    },
    { key: "grn_date", label: "GRN Date" },
    {
      key: "is_completed",
      label: "Status",
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          row.is_completed
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {row.is_completed ? "Completed" : "Pending"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">GRNs</h2>
        <button
          onClick={() => {
            setEditingGrn(null);
            setShowGrnForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create GRN
        </button>
      </div>

      <TableView
        columns={columns}
        rows={grns}
        loading={loading}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        actions={(row) => (
          <>
            <button
              onClick={() => handleEdit(row)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
              title="Edit"
            >
              <MdEdit size={18} />
            </button>
            {!row.is_completed && (
              <button
                onClick={() => handleComplete(row.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                title="Complete"
              >
                <MdCheckCircle size={18} />
              </button>
            )}
            <button
              onClick={() => handleDelete(row.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
              title="Delete"
            >
              <MdDelete size={18} />
            </button>
          </>
        )}
        emptyMessage="No GRNs found"
      />

      <AddGrnForm
        open={showGrnForm}
        onClose={() => setShowGrnForm(false)}
        base_api={BASE_API}
        grn={editingGrn}
        onSuccess={() => fetchGrns(currentPage)}
        token={token}
      />
    </div>
  );
}