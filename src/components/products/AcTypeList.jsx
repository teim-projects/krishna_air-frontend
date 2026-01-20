import React, { useCallback, useEffect, useMemo, useState } from "react";
import TableView from "../TableView";
import Swal from "sweetalert2";
import { MdEdit, MdDelete } from "react-icons/md";

export default function AcTypeListModal({ appliedFilters }) {
  const BASE_API =
    import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const API_URL = `${BASE_API}/api/product/actype/`;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
  });

  const isEditMode = formData.id !== null;

  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      "",
    []
  );

  /* =====================================
        FETCH DATA (with Base Filters)
  ===================================== */
  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page });

        // BASE FILTER → Search
        if (appliedFilters?.search) {
          params.set("search", appliedFilters.search.trim());
        }

        const res = await fetch(`${API_URL}?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Failed to fetch AC Types");

        const data = await res.json();

        if (data.results) {
          setRows(data.results);
          setTotalPages(Math.ceil(data.count / PAGE_SIZE));
        } else {
          setRows(data);
          setTotalPages(Math.ceil(data.length / PAGE_SIZE));
        }

        setCurrentPage(page);
      } catch (err) {
        setError(err.message);
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [API_URL, token, appliedFilters]
  );

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  // re-run search when Base filter changes
  useEffect(() => {
    fetchData(1);
  }, [appliedFilters]);

  /* =====================================
        ADD / UPDATE
  ===================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire("Error", "Name is required!", "error");
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
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Save failed");

      Swal.fire(
        "Success",
        isEditMode ? "Updated successfully!" : "Added successfully!",
        "success"
      );

      setFormData({ id: null, name: "", description: "" });
      fetchData(currentPage);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* =====================================
        DELETE
  ===================================== */
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

      Swal.fire("Deleted!", "AC Type removed", "success");
      fetchData(currentPage);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* =====================================
        LOAD EDIT FORM
  ===================================== */
  const handleEdit = (row) => {
    setFormData(row);
  };

  const cancelEdit = () =>
    setFormData({ id: null, name: "", description: "" });

  /* =====================================
        TABLE COLUMNS
  ===================================== */
  const columns = [
    { key: "sr", label: "Sr.No", render: (_, idx) => idx + 1 },
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
  ];

  const actionsRenderer = (row) => (
    <>
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
    </>
  );

  return (
    <div className="space-y-5">

      {/* ---- TITLE ONLY (NO FILTER BUTTON) ---- */}
      {/* <h2 className="text-xl font-semibold tracking-wide">
        AC Types
      </h2> */}

      {/* ---- ADD / EDIT FORM ---- */}
      <div className="bg-white p-4 rounded-md shadow">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-9 px-3 text-sm border border-slate-300 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full h-9 px-3 text-sm border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="bg-sky-600 text-white px-5 h-9 rounded text-sm"
            >
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

      {/* ---- TABLE ---- */}
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
        emptyMessage="No AC Types found"
      />
    </div>
  );
}
