import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import TableView from "../TableView";
import { MdEdit, MdDelete } from "react-icons/md";

export default function InventoryList({ appliedFilters }) {
  const BASE_API =
    import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

  const API_URL = `${BASE_API}/api/product/product-inventory/`;
  const VARIANT_API = `${BASE_API}/api/product/product-variant/`;

  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      "",
    []
  );

  const [rows, setRows] = useState([]);
  const [variants, setVariants] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const initialForm = {
    id: null,
    serial_no: "",
    status: "IN_STOCK",
    warehouse: "",
    purchase_date: "",
    warranty_start: "",
    warranty_end: "",
    product_variant: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const isEdit = formData.id !== null;

  /* LOAD VARIANTS */
  const loadVariants = async () => {
    const v = await fetch(VARIANT_API, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const variantData = await v.json();
    setVariants(variantData.results || variantData);
  };

  /* LOAD INVENTORY WITH ALL FILTERS */
  const loadData = async () => {
    const params = new URLSearchParams();

    // ⭐ MULTI-SEARCH FIELDS
    if (appliedFilters?.serial) params.append("search", appliedFilters.serial);
    if (appliedFilters?.sku) params.append("search", appliedFilters.sku);
    if (appliedFilters?.capacity) params.append("search", appliedFilters.capacity);
    if (appliedFilters?.brand) params.append("search", appliedFilters.brand);

    // ⭐ PURCHASE DATE (DIRECT FILTER)
    if (appliedFilters?.purchase_date)
      params.set("purchase_date", appliedFilters.purchase_date);

    // ⭐ STATUS
    if (appliedFilters?.status)
      params.set("status", appliedFilters.status);

    // ⭐ WAREHOUSE
    if (appliedFilters?.warehouse)
      params.set("warehouse", appliedFilters.warehouse);

    const finalURL = `${API_URL}?${params.toString()}`;
    console.log("Inventory API Call =>", finalURL);

    const res = await fetch(finalURL, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const data = await res.json();
    const list = data.results || data;

    setRows(list);

    const uniqueWarehouses = [...new Set(list.map((x) => x.warehouse))];
    setWarehouses(uniqueWarehouses);
  };

  useEffect(() => {
    loadVariants();
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
      purchase_date: formData.purchase_date || null,
      warranty_start: formData.warranty_start || null,
      warranty_end: formData.warranty_end || null,
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
      Swal.fire("Error", "Failed to save inventory", "error");
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
      serial_no: row.serial_no,
      status: row.status,
      warehouse: row.warehouse,
      purchase_date: row.purchase_date || "",
      warranty_start: row.warranty_start || "",
      warranty_end: row.warranty_end || "",
      product_variant: row.product_variant,
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

    Swal.fire("Deleted", "Inventory removed", "success");
    loadData();
  };

  /* TABLE COLUMNS */
  const columns = [
    { key: "sr", label: "Sr.No", render: (_, i) => i + 1 },
    { key: "serial_no", label: "Serial No" },
    { key: "variant_name", label: "Variant" },
    { key: "status", label: "Status" },
    { key: "warehouse", label: "Warehouse" },
    { key: "purchase_date", label: "Purchase Date" },
    { key: "warranty_start", label: "Warranty Start" },
    { key: "warranty_end", label: "Warranty End" },
  ];

  const inputBox =
    "w-full h-10 border border-slate-300 rounded-md px-3 text-sm focus:outline-sky-500";

  return (
    <div className="space-y-5">

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold"></h2>

        <button
          onClick={() => {
            setFormData(initialForm);
            setShowModal(true);
          }}
          className="px-3 py-1 bg-sky-600 text-white rounded-md shadow text-sm"
        >
          + Add Inventory
        </button>
      </div>

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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[50%] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-semibold">
                {isEdit ? "Edit Inventory" : "Add Inventory"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-slate-600 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="text-sm font-medium">Product Variant</label>
                <select
                  className={inputBox}
                  value={formData.product_variant}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      product_variant: e.target.value,
                    })
                  }
                >
                  <option value="">Select Variant</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.sku}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Serial No</label>
                <input
                  className={inputBox}
                  value={formData.serial_no}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_no: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className={inputBox}
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="IN_STOCK">IN_STOCK</option>
                    <option value="SOLD">SOLD</option>
                    <option value="DAMAGED">DAMAGED</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Warehouse</label>
                  <select
                    className={inputBox}
                    value={formData.warehouse}
                    onChange={(e) =>
                      setFormData({ ...formData, warehouse: e.target.value })
                    }
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w, i) => (
                      <option key={i} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Purchase Date</label>
                  <input
                    type="date"
                    className={inputBox}
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Warranty Start</label>
                  <input
                    type="date"
                    className={inputBox}
                    value={formData.warranty_start}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warranty_start: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Warranty End</label>
                <input
                  type="date"
                  className={inputBox}
                  value={formData.warranty_end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warranty_end: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md shadow"
              >
                {isEdit ? "Update Inventory" : "Add Inventory"}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
