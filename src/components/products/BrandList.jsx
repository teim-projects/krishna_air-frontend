import React, { useCallback, useEffect, useMemo, useState } from "react";
import TableView from "../TableView";
import Swal from "sweetalert2";
import { MdEdit, MdDelete } from "react-icons/md";
import { FiFilter } from "react-icons/fi"; // 🔵 NEW FILTER ICON

export default function BrandList() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const API_URL = `${BASE_API}/api/product/ac-brand/`;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({ id: null, name: "", desc: "" });
  const isEditMode = formData.id !== null;

  const token = useMemo(
    () => localStorage.getItem("access") || localStorage.getItem("token") || "",
    []
  );

  /* ============================
        FETCH DATA
  ============================ */
  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("page", page);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`${API_URL}?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Failed to fetch Brands");

        const data = await res.json();

        if (data.results) {
          setRows(data.results);
          setTotalPages(Math.ceil(data.count / PAGE_SIZE));
        } else {
          setRows(data);
          setTotalPages(1);
        }

        setCurrentPage(page);
      } catch (err) {
        setError(err.message);
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [API_URL, token, search]
  );

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  /* ============================
        ADD / UPDATE
  ============================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire("Error", "Brand name is required!", "error");
      return;
    }

    try {
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode ? `${API_URL}${formData.id}/` : API_URL;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          desc: formData.desc,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      Swal.fire("Success", isEditMode ? "Brand Updated!" : "Brand Added!", "success");

      setFormData({ id: null, name: "", desc: "" });
      fetchData(currentPage);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* ============================
        DELETE BRAND
  ============================ */
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Delete failed");

      Swal.fire("Deleted!", "Brand removed", "success");
      fetchData(currentPage);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* ============================
        EDIT
  ============================ */
  const handleEdit = (row) => {
    setFormData({
      id: row.id,
      name: row.name,
      desc: row.desc,
    });
  };

  const cancelEdit = () => setFormData({ id: null, name: "", desc: "" });

  /* ============================
        TABLE COLUMNS
  ============================ */
  const columns = [
    { key: "sr", label: "Sr.No", render: (_, idx) => idx + 1 },
    { key: "name", label: "Brand Name" },
    { key: "desc", label: "Description" },
  ];

  const actionsRenderer = (row) => (
    <div className="flex gap-2 justify-center">
      <button
        onClick={() => handleEdit(row)}
        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded"
      >
        <MdEdit />
      </button>
      <button
        onClick={() => handleDelete(row.id)}
        className="px-2 py-1 bg-red-100 text-red-700 rounded"
      >
        <MdDelete />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">

    

   

      {/* 🔵 ADD / EDIT FORM */}
      <div className="bg-white p-4 rounded-md shadow">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="block text-sm mb-1">Brand Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-slate-300 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <input
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-end gap-2">
            <button type="submit" className="bg-sky-600 text-white px-5 h-9 rounded text-sm">
              {isEditMode ? "Update" : "Add"}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-300 px-4 h-9 rounded text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 🔵 BRAND TABLE */}
      <TableView
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
        pageSize={PAGE_SIZE}
        actions={actionsRenderer}
        emptyMessage="No Brands found"
      />
    </div>
  );
}
