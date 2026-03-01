import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PurchaseOrderItems({
  baseApi,
  token,
  initialProducts = [],
  onProductsChange
}) {

  const api = axios.create({
    baseURL: baseApi,
    headers: { Authorization: `Bearer ${token}` }
  });

  const [products, setProducts] = useState(initialProducts || []);

  useEffect(() => {
    setProducts(initialProducts || []);
  }, [initialProducts]);

  // ===================== HIGH SIDE STATES =====================

  const [acTypes, setAcTypes] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);

  const [highForm, setHighForm] = useState({
    acType: "",
    subType: "",
    brand: "",
    model: "",
    variant: "",
    quantity: 1,
    rate: 0,
    uom: "Nos"
  });

  // ===================== LOW SIDE STATES =====================

  const [materialTypes, setMaterialTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [features, setFeatures] = useState([]);
  const [itemClasses, setItemClasses] = useState([]);
  const [items, setItems] = useState([]);

  const [lowForm, setLowForm] = useState({
    materialType: "",
    itemType: "",
    feature: "",
    itemClass: "",
    item: "",
    quantity: 1,
    rate: 0,
    uom: "Meter"
  });

  // ===================== SECTION STATES =====================

  const [sectionTitle, setSectionTitle] = useState("");
  const [activeSection, setActiveSection] = useState(null);

  // ===================== INITIAL LOAD =====================

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [acRes, materialRes] = await Promise.all([
        api.get("/product/actype/"),
        api.get("/product/material-type/")
      ]);
      setAcTypes(acRes.data?.results || []);
      setMaterialTypes(materialRes.data?.results || []);
    } catch (err) {
      console.error("Error loading initial data", err);
    }
  };

  // ===================== HIGH SIDE CASCADE =====================

  // Subtypes depend on AC Type
  useEffect(() => {
    if (!highForm.acType) return;
    api.get(`/product/ac-subtypes/?ac_type_id__id=${highForm.acType}`)
      .then(res => setSubTypes(res.data?.results || []));
  }, [highForm.acType]);

  // Brands 
  useEffect(() => {
    api.get("/product/ac-brand/")
      .then(res => {
        const data = res.data?.results || res.data || [];
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Brand load error", err));
  }, []);

  // Models depend on subtype and brand
  useEffect(() => {
    if (!highForm.brand || !highForm.subType) return;
    api.get(`/product/product-model/?brand_id=${highForm.brand}&ac_sub_type_id__ac_type_id=1&ac_sub_type_id=${highForm.subType}`)
      .then(res => setModels(res.data?.results || []));
  }, [highForm.brand]);

  useEffect(() => {
    if (!highForm.model) return;
    api.get(`/product/product-variant/?product_model=${highForm.model}`)
      .then(res => setVariants(res.data?.results || []));
  }, [highForm.model]);

  // ===================== LOW SIDE CASCADE =====================

  useEffect(() => {
    if (!lowForm.materialType) return;
    api.get(`/product/item-types/?materialType=${lowForm.materialType}`)
      .then(res => setItemTypes(res.data?.results || []));
  }, [lowForm.materialType]);

  useEffect(() => {
    if (!lowForm.itemType) return;
    api.get(`/product/features/?itemType=${lowForm.itemType}`)
      .then(res => setFeatures(res.data?.results || []));
  }, [lowForm.itemType]);

  useEffect(() => {
    if (!lowForm.feature) return;
    api.get(`/product/item-classes/?feature=${lowForm.feature}`)
      .then(res => setItemClasses(res.data?.results || []));
  }, [lowForm.feature]);

  useEffect(() => {
    if (!lowForm.itemClass) return;
    api.get(`/product/items/?class=${lowForm.itemClass}`)
      .then(res => setItems(res.data?.results || []));
  }, [lowForm.itemClass]);



  // ===================== ADD SECTION =====================

  const addSection = () => {
    if (!sectionTitle.trim()) return;

    const sectionCount = products.filter(p => p.is_section).length + 1;
    const serial = sectionCount.toString();

    const newSection = {
      serial_no: serial,
      sort_order: products.length + 1,
      is_section: true,
      section_title: sectionTitle,
      product_variant: null,
      item: null,
      description: null,
      quantity: 0,
      uom: null,
      rate: 0
    };

    const updated = [...products, newSection];
    updateProducts(updated);
    setActiveSection(serial);
    setSectionTitle("");
  };

  // ===================== HELPERS =====================

  const generateItemSerial = () => {
    if (!activeSection) return null;

    const childCount = products.filter(
      p =>
        !p.is_section &&
        p.serial_no.startsWith(activeSection + ".")
    ).length;

    return `${activeSection}.${childCount + 1}`;
  };

  const updateProducts = (updated) => {
    setProducts(updated);
    onProductsChange(updated);
  };

  // ===================== ADD HIGH PRODUCT =====================

  const addHighProduct = () => {
    if (!highForm.variant) return;
    if (!activeSection) {
      alert("Please create or select a section first.");
      return;
    }

    const selected = variants.find(v => v.id == highForm.variant);

    const newProduct = {
      serial_no: generateItemSerial(),
      sort_order: products.length + 1,
      is_section: false,
      section_title: null,
      product_variant: selected.id,
      item: null,
      description: selected.name,
      quantity: parseFloat(highForm.quantity),
      uom: highForm.uom,
      rate: parseFloat(highForm.rate)
    };

    updateProducts([...products, newProduct]);
  };
  // ===================== ADD LOW ITEM =====================

  const addLowItem = () => {
    if (!lowForm.item) return;
    if (!activeSection) {
      alert("Please create or select a section first.");
      return;
    }

    const selected = items.find(i => i.id == lowForm.item);

    const newProduct = {
      serial_no: generateItemSerial(),
      sort_order: products.length + 1,
      is_section: false,
      section_title: null,
      product_variant: null,
      item: selected.id,
      description: selected.name,
      quantity: parseFloat(lowForm.quantity),
      uom: lowForm.uom,
      rate: parseFloat(lowForm.rate)
    };

    updateProducts([...products, newProduct]);
  };

  // ===================== EDIT ROW =====================

  const handleEdit = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    updateProducts(updated);
  };

  const removeRow = (index) => {
    const updated = products.filter((_, i) => i !== index);

    // Recalculate numbering per section
    let sectionCounter = 0;

    const finalList = [];
    updated.forEach(p => {
      if (p.is_section) {
        sectionCounter++;
        p.serial_no = sectionCounter.toString();
        finalList.push(p);
      } else {
        const parent = finalList
          .slice()
          .reverse()
          .find(s => s.is_section);

        if (parent) {
          const childCount = finalList.filter(
            x =>
              !x.is_section &&
              x.serial_no.startsWith(parent.serial_no + ".")
          ).length;

          p.serial_no = `${parent.serial_no}.${childCount + 1}`;
        }

        finalList.push(p);
      }
    });

    updateProducts(finalList);
  };
  // ===================== UI =====================

  return (
    <div className="space-y-8">
      {/* ================= ADD SECTION ================= */}
      <div className="border rounded-xl p-4 bg-gray-50 shadow-sm">
        <h4 className="font-semibold mb-2">Add Section</h4>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Section Title (e.g. Air Conditioners)"
            className="border rounded-md px-3 py-2 flex-1"
            value={sectionTitle}
            onChange={e => setSectionTitle(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            onClick={addSection}
          >
            + Add Section
          </button>
        </div>
      </div>

      {/* ================= HIGH SIDE ================= */}
      <div className="border rounded-xl p-5 shadow-sm bg-white">
        <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">
          High Side Products
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setHighForm({ ...highForm, acType: e.target.value })}
          >
            <option value="">AC Type</option>
            {acTypes.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setHighForm({ ...highForm, subType: e.target.value })}
          >
            <option value="">Sub Type</option>
            {subTypes.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setHighForm({ ...highForm, brand: e.target.value })}
          >
            <option value="">Brand</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setHighForm({ ...highForm, model: e.target.value })}
          >
            <option value="">Model</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setHighForm({ ...highForm, variant: e.target.value })}
          >
            <option value="">Variant</option>
            {variants.map(v => (
              <option key={v.id} value={v.id}>{v.variant_sku}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <input
            type="number"
            placeholder="Qty"
            className="border rounded-md px-2 py-1 w-24"
            value={highForm.quantity}
            onChange={e => setHighForm({ ...highForm, quantity: e.target.value })}
          />
          <input
            type="number"
            placeholder="Rate"
            className="border rounded-md px-2 py-1 w-32"
            value={highForm.rate}
            onChange={e => setHighForm({ ...highForm, rate: e.target.value })}
          />
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md"
            onClick={addHighProduct}
          >
            + Add High Product
          </button>
        </div>
      </div>

      {/* ================= LOW SIDE ================= */}
      <div className="border rounded-xl p-5 shadow-sm bg-white">
        <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">
          Low Side Items
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setLowForm({ ...lowForm, materialType: e.target.value })}
          >
            <option value="">Material Type</option>
            {materialTypes.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setLowForm({ ...lowForm, itemType: e.target.value })}
          >
            <option value="">Item Type</option>
            {itemTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setLowForm({ ...lowForm, feature: e.target.value })}
          >
            <option value="">Feature</option>
            {features.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setLowForm({ ...lowForm, itemClass: e.target.value })}
          >
            <option value="">Item Class</option>
            {itemClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-2 py-1"
            onChange={e => setLowForm({ ...lowForm, item: e.target.value })}
          >
            <option value="">Select Item</option>
            {items.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <input
            type="number"
            placeholder="Qty"
            className="border rounded-md px-2 py-1 w-24"
            value={lowForm.quantity}
            onChange={e => setLowForm({ ...lowForm, quantity: e.target.value })}
          />
          <input
            type="number"
            placeholder="Rate"
            className="border rounded-md px-2 py-1 w-32"
            value={lowForm.rate}
            onChange={e => setLowForm({ ...lowForm, rate: e.target.value })}
          />
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md"
            onClick={addLowItem}
          >
            + Add Low Item
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="border rounded-xl shadow-sm bg-white p-4 overflow-x-auto">
        <h4 className="font-semibold text-gray-700 mb-3">Selected Items</h4>

        <table className="min-w-full text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">S.No</th>
              <th className="border px-3 py-2 text-left">Description</th>
              <th className="border px-3 py-2 text-left">Qty</th>
              <th className="border px-3 py-2 text-left">UOM</th>
              <th className="border px-3 py-2 text-left">Rate</th>
              <th className="border px-3 py-2 text-left">Amount</th>
              <th className="border px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, index) => (
              <tr
                key={index}
                onClick={() => p.is_section && setActiveSection(p.serial_no)}
                className={
                  p.is_section
                    ? `bg-gray-200 font-semibold cursor-pointer ${activeSection === p.serial_no
                      ? "ring-2 ring-blue-500"
                      : ""
                    }`
                    : "hover:bg-gray-50"
                }
              >
                <td className="border px-3 py-2">{p.serial_no}</td>

                {p.is_section ? (
                  <>
                    <td colSpan="5" className="border px-3 py-2">
                      {p.section_title}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        className="text-red-600"
                        onClick={() => removeRow(index)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border px-3 py-2">{p.variants}</td>
                    <td className="border px-3 py-2">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-20"
                        value={p.quantity}
                        onChange={e =>
                          handleEdit(index, "quantity", parseFloat(e.target.value))
                        }
                      />
                    </td>
                    <td className="border px-3 py-2">{p.uom}</td>
                    <td className="border px-3 py-2">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-24"
                        value={p.rate}
                        onChange={e =>
                          handleEdit(index, "rate", parseFloat(e.target.value))
                        }
                      />
                    </td>
                    <td className="border px-3 py-2 font-medium">
                      {(p.quantity * p.rate).toFixed(2)}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        className="text-red-600"
                        onClick={() => removeRow(index)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}