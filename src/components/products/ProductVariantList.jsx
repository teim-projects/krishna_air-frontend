import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import TableView from "../TableView";
import { MdEdit, MdDelete } from "react-icons/md";

export default function ProductVariantList({ appliedFilters }) {
  const BASE_API =
    import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

  const API_URL = `${BASE_API}/api/product/product-variant/`;
  const MODEL_API = `${BASE_API}/api/product/product-model/`;

  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      "",
    []
  );

  const [rows, setRows] = useState([]);
  const [models, setModels] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const initialForm = {
    id: null,
    product_model: "",
    capacity: "",
    star_rating: "",
    price: "",
    is_active: true,
  };

  const [formData, setFormData] = useState(initialForm);
  const isEdit = formData.id !== null;

  /* LOAD MODELS */
  const loadModels = async () => {
    const m = await fetch(MODEL_API, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const modelData = await m.json();
    setModels(modelData.results || modelData);
  };

  /* LOAD VARIANTS */
  const loadData = async () => {
    const params = new URLSearchParams();

    if (appliedFilters?.search) params.set("search", appliedFilters.search);
    if (appliedFilters?.star_rating)
      params.set("star_rating", appliedFilters.star_rating);
    if (appliedFilters?.is_active)
      params.set("is_active", appliedFilters.is_active);

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const data = await res.json();
    setRows(data.results || data);
  };

  useEffect(() => {
    loadModels();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [appliedFilters]);

  /* SUBMIT FORM */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      product_model: formData.product_model, // IMPORTANT FIX
    };

    const url = isEdit ? `${API_URL}${formData.id}/` : API_URL;

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      Swal.fire("Error", "Failed to save variant", "error");
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
      product_model: row.product_model || "",
      capacity: row.capacity,
      star_rating: row.star_rating,
      price: row.price,
      is_active: row.is_active,
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

    Swal.fire("Deleted", "Variant removed", "success");
    loadData();
  };

  /* TABLE COLUMNS */
  const columns = [
    { key: "sr", label: "Sr.No", render: (_, i) => i + 1 },
    { key: "model_name", label: "Model" },
    { key: "capacity", label: "Capacity" },
    { key: "star_rating", label: "Rating" },
    { key: "price", label: "Price" },
    { key: "sku", label: "SKU" },
    {
      key: "is_active",
      label: "Active",
      render: (r) => (r.is_active ? "Yes" : "No"),
    },
  ];

  const inputBox =
    "w-full h-10 border border-slate-300 rounded-md px-3 text-sm focus:outline-sky-500";

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold"></h2>

        <button
          onClick={() => {
            setFormData(initialForm);
            setShowModal(true);
          }}
          className="px-3 py-1 bg-sky-600 text-white rounded-md shadow text-sm"
        >
          + Add Variant
        </button>
      </div>

      {/* TABLE */}
      <TableView
        columns={columns}
        rows={rows}
        actions={(row) => (
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
        )}
      />

      {/* POPUP */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[50%] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-semibold">
                {isEdit ? "Edit Variant" : "Add Variant"}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-slate-600 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* MODEL */}
              <div>
                <label className="text-sm font-medium">Product Model</label>
                <select
                  className={inputBox}
                  value={formData.product_model}
                  onChange={(e) =>
                    setFormData({ ...formData, product_model: e.target.value })
                  }
                >
                  <option value="">Select Model</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CAPACITY */}
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <input
                  className={inputBox}
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
              </div>

              {/* STAR RATING + PRICE */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Star Rating</label>
                  <select
                    className={inputBox}
                    value={formData.star_rating}
                    onChange={(e) =>
                      setFormData({ ...formData, star_rating: e.target.value })
                    }
                  >
                    <option value="">Select Rating</option>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} Star
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Price</label>
                  <input
                    type="number"
                    className={inputBox}
                    placeholder="Enter Price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* ACTIVE */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label className="text-sm">Active</label>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md shadow"
              >
                {isEdit ? "Update Variant" : "Add Variant"}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
