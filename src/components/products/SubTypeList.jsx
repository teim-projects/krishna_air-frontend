import React, { useCallback, useEffect, useMemo, useState } from "react";
import TableView from "../TableView";
import Swal from "sweetalert2";
import { MdEdit, MdDelete } from "react-icons/md";

export default function SubTypeList({ appliedFilters }) {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const API_URL = `${BASE_API}/api/product/ac-subtypes/`;
  const AC_TYPE_API = `${BASE_API}/api/product/actype/`;

  const [rows, setRows] = useState([]);
  const [acTypes, setAcTypes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
    ac_type_id: "",
  });

  const isEditMode = formData.id !== null;

  const token = useMemo(
    () => localStorage.getItem("access") || localStorage.getItem("token") || "",
    []
  );

  /* ---------------------------------------------------------
       FETCH AC TYPES (dropdown)
  --------------------------------------------------------- */
  const fetchAcTypes = async () => {
    try {
      const req = await fetch(AC_TYPE_API, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (req.ok) {
        const data = await req.json();
        setAcTypes(data.results || data);
      }
    } catch (err) {
      console.error("AC Type fetch failed", err);
    }
  };

  const getAcTypeName = (id) => {
    const f = acTypes.find((t) => t.id === id);
    return f ? f.name : "—";
  };

  /* ---------------------------------------------------------
       FETCH SUBTYPES (supports Base filter)
  --------------------------------------------------------- */
  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("page", page);

        // Base Search Filter
        if (appliedFilters?.search) {
          params.set("search", appliedFilters.search.trim());
        }

        const req = await fetch(`${API_URL}?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!req.ok) throw new Error("Failed to fetch");

        const data = await req.json();

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
    [API_URL, appliedFilters, token]
  );

  useEffect(() => {
    fetchAcTypes();
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  // Re-run on Base filter updates
  useEffect(() => {
    fetchData(1);
  }, [appliedFilters]);

  /* ---------------------------------------------------------
       SUBMIT (Add / Update)
  --------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire("Error", "Name required!", "error");
      return;
    }

    try {
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode ? `${API_URL}${formData.id}/` : API_URL;

      const req = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          ac_type_id: formData.ac_type_id,
        }),
      });

      if (!req.ok) throw new Error("Save failed");

      Swal.fire("Success", isEditMode ? "Updated!" : "Added!", "success");

      setFormData({ id: null, name: "", description: "", ac_type_id: "" });
      fetchData(currentPage);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* ---------------------------------------------------------
       DELETE
  --------------------------------------------------------- */
  const handleDelete = async (id) => {
    const ok = await Swal.fire({
      title: "Delete?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!ok.isConfirmed) return;

    try {
      const req = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!req.ok) throw new Error("Delete failed");

      Swal.fire("Deleted!", "SubType removed", "success");
      fetchData(currentPage);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* ---------------------------------------------------------
       EDIT
  --------------------------------------------------------- */
  const handleEdit = (row) => {
    setFormData({
      id: row.id,
      name: row.name,
      description: row.description,
      ac_type_id: row.ac_type_id,
    });
  };

  const cancelEdit = () =>
    setFormData({ id: null, name: "", description: "", ac_type_id: "" });

  /* ---------------------------------------------------------
       TABLE COLUMNS
  --------------------------------------------------------- */
  const columns = [
    { key: "sr", label: "Sr.No", render: (_, idx) => idx + 1 },

    { key: "name", label: "Name" },

    {
      key: "description",
      label: "Description",
      render: (r) => (
        <span title={r.description}>
          {r.description?.length > 10
            ? r.description.slice(0, 10) + "..."
            : r.description || "—"}
        </span>
      ),
    },

    {
      key: "ac_type",
      label: "AC Type",
      render: (row) => getAcTypeName(row.ac_type_id),
    },
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

  /* ---------------------------------------------------------
       UI
  --------------------------------------------------------- */
  return (
    <div className="space-y-5">
      {/* <h2 className="text-xl font-semibold tracking-wide">Sub Types</h2> */}

      {/* FORM */}
      <div className="bg-white p-4 rounded-md shadow">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSubmit}>

          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              className="w-full h-9 px-3 text-sm border border-slate-300 rounded"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <input
              className="w-full h-9 px-3 text-sm border border-slate-300 rounded"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">AC Type</label>
            <select
              className="w-full h-9 px-3 text-sm border border-slate-300 rounded"
              value={formData.ac_type_id}
              onChange={(e) =>
                setFormData({ ...formData, ac_type_id: e.target.value })
              }
            >
              <option value="">Select AC Type</option>
              {acTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button className="bg-sky-600 text-white px-5 h-9 rounded text-sm" type="submit">
              {isEditMode ? "Update" : "Add"}
            </button>
            {isEditMode && (
              <button
                onClick={cancelEdit}
                type="button"
                className="bg-gray-300 px-4 h-9 rounded text-sm"
              >
                Cancel
              </button>
            )}
          </div>

        </form>
      </div>

      {/* TABLE */}
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
        emptyMessage="No Sub Types found"
      />
    </div>
  );
}
