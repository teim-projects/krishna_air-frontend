import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import TableView from "../TableView";
import { MdEdit, MdDelete } from "react-icons/md";

export default function ProductModelList({ appliedFilters }) {
  const BASE_API =
    import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

  const API_URL = `${BASE_API}/api/product/product-model/`;
  const SUBTYPE_API = `${BASE_API}/api/product/ac-subtypes/`;
  const BRAND_API = `${BASE_API}/api/product/ac-brand/`;

  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      "",
    []
  );

  const [rows, setRows] = useState([]);
  const [subtypes, setSubtypes] = useState([]);
  const [brands, setBrands] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const initialForm = {
    id: null,
    name: "",
    model_no: "",
    phase: "1P",
    inverter: true,
    is_active: true,
    description: "",
    ac_sub_type_id: "",
    brand_id: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const isEdit = formData.id !== null;

  /* LOAD DROPDOWN DATA */
  const loadDropdownData = async () => {
    const s = await fetch(SUBTYPE_API, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const b = await fetch(BRAND_API, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    setSubtypes((await s.json()).results || []);
    setBrands((await b.json()).results || []);
  };

  /* LOAD MODELS */
  const loadData = async () => {
    const params = new URLSearchParams();

    if (appliedFilters?.search) {
      params.set("search", appliedFilters.search);
    }
    if (appliedFilters?.brand_name) {
      params.set("brand_name", appliedFilters.brand_name);
    }
    if (appliedFilters?.phase) {
      params.set("phase", appliedFilters.phase);
    }
    if (appliedFilters?.inverter) {
      params.set("inverter", appliedFilters.inverter);
    }
    if (appliedFilters?.is_active) {
      params.set("is_active", appliedFilters.is_active);
    }

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const data = await res.json();
    setRows(data.results || data);
  };

  useEffect(() => {
    loadDropdownData();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [appliedFilters]);

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isEdit ? `${API_URL}${formData.id}/` : API_URL;

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      Swal.fire("Error", "Failed to save model", "error");
      return;
    }

    Swal.fire("Success", isEdit ? "Updated" : "Added", "success");

    setShowModal(false);
    setFormData(initialForm);
    loadData();
  };

  /* EDIT */
  const handleEdit = (row) => {
    setFormData({
      id: row.id,
      name: row.name,
      model_no: row.model_no,
      phase: row.phase,
      inverter: row.inverter,
      is_active: row.is_active,
      description: row.description,
      ac_sub_type_id: row.ac_sub_type_id,
      brand_id: row.brand_id,
    });

    setShowModal(true);
  };

  /* DELETE */
  const handleDelete = async (id) => {
    const ok = await Swal.fire({
      title: "Delete?",
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;

    await fetch(`${API_URL}${id}/`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    Swal.fire("Deleted", "Record removed", "success");
    loadData();
  };

  /* TABLE COLUMNS */
  const columns = [
    { key: "sr", label: "Sr.No", render: (_, i) => i + 1 },
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "ac_sub_type_name", label: "Subtype" },
    { key: "brand_name", label: "Brand" },
    { key: "phase", label: "Phase" },
    {
      key: "inverter",
      label: "Inverter",
      render: (r) => (r.inverter ? "Yes" : "No"),
    },
    {
      key: "is_active",
      label: "Active",
      render: (r) => (r.is_active ? "Yes" : "No"),
    },
  ];

  const actionsRenderer = (row) => (
    <div className="flex gap-2 justify-center">
      <button
        onClick={() => handleEdit(row)}
        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded"
      >
        <MdEdit size={18} />
      </button>

      <button
        onClick={() => handleDelete(row.id)}
        className="px-2 py-1 bg-red-100 text-red-700 rounded"
      >
        <MdDelete size={18} />
      </button>
    </div>
  );

  return (
    <div className="space-y-3">

      {/* TOP BAR */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-semibold"></h2>

        <button
          onClick={() => {
            setFormData(initialForm);
            setShowModal(true);
          }}
          className="px-3 py-1 bg-sky-600 text-white rounded-md text-sm shadow hover:bg-sky-700"
        >
          + Add Model
        </button>
      </div>

      {/* TABLE */}
      <TableView columns={columns} rows={rows} actions={actionsRenderer} />

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[55%] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-semibold tracking-wide">
                {isEdit ? "Edit Model" : "Add Model"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-slate-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ROW 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600">AC Subtype</label>
                  <select
                    className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm"
                    value={formData.ac_sub_type_id}
                    onChange={(e) =>
                      setFormData({ ...formData, ac_sub_type_id: e.target.value })
                    }
                  >
                    <option value="">Select Subtype</option>
                    {subtypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600">Brand</label>
                  <select
                    className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm"
                    value={formData.brand_id}
                    onChange={(e) =>
                      setFormData({ ...formData, brand_id: e.target.value })
                    }
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROW 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600">Model Name</label>
                  <input
                    className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Model Name"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600">Model No</label>
                  <input
                    className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm"
                    value={formData.model_no}
                    onChange={(e) =>
                      setFormData({ ...formData, model_no: e.target.value })
                    }
                    placeholder="Model No"
                  />
                </div>
              </div>

              {/* ROW 3 */}
              <div className="flex items-center gap-10 mt-1">
                <div className="flex flex-col">
                  <label className="text-sm text-slate-600 mb-1">Phase</label>
                  <select
                    className="h-10 w-36 border border-slate-300 rounded-md px-3 text-sm"
                    value={formData.phase}
                    onChange={(e) =>
                      setFormData({ ...formData, phase: e.target.value })
                    }
                  >
                    <option value="">Select Phase</option>
                    <option value="1P">1 Phase</option>
                    <option value="3P">3 Phase</option>
                  </select>
                </div>

                <label className="flex items-center mt-6 gap-2">
                  <input
                    type="checkbox"
                    checked={formData.inverter}
                    onChange={(e) =>
                      setFormData({ ...formData, inverter: e.target.checked })
                    }
                  />
                  Inverter
                </label>

                <label className="flex items-center mt-6 gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="text-sm text-slate-600">Description</label>
                <textarea
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Write description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-2 bg-sky-600 text-white rounded-md shadow hover:bg-sky-700"
              >
                {isEdit ? "Update Model" : "Add Model"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
