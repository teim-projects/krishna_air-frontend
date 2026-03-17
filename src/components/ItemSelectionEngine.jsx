import { useEffect, useState } from "react";
import axios from "axios";
import { MdDelete } from "react-icons/md";

export default function ItemSelectionEngine({
  baseApi,
  authToken,
  items,
  setItems,
  lowItems,
  setLowItems,
  mode = "quotation",
  gstType
}) {

  const isInvoice = mode === "invoice";

  const api = axios.create({ baseURL: `${baseApi}/` });

  api.interceptors.request.use(config => {
    if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
    return config;
  });

  const normalize = d => Array.isArray(d) ? d : d?.results || [];

  /* ================= DRAFT STATES ================= */

  const [draftHighItem, setDraftHighItem] = useState({
    acType: "",
    subType: "",
    brand: "",
    model: "",
    product_variant: "",
    description: "",
    hsn_sac: "",
    unit: "NOS",
    quantity: "",
    unit_price: "",
    rate: "",
    gst_percent: "",
    mathadi_charges: "",
    transportation_charges: ""
  });

  const [draftLowItem, setDraftLowItem] = useState({
    material_type_id: "",
    item_type_id: "",
    feature_type_id: "",
    item_class_id: "",
    item: "",
    description: "",
    hsn_sac: "",
    unit: "NOS",
    quantity: "",
    unit_price: "",
    rate: "",
    gst_percent: "",
    mathadi_charges: ""
  });

  /* ================= MASTERS ================= */

  const [acTypes, setAcTypes] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);

  const [materialTypes, setMaterialTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [featureTypes, setFeatureTypes] = useState([]);
  const [itemClasses, setItemClasses] = useState([]);
  const [lowItemsMaster, setLowItemsMaster] = useState([]);

  useEffect(() => {
    api.get("product/actype/").then(r => setAcTypes(normalize(r.data)));
    api.get("product/material-type/").then(r => setMaterialTypes(normalize(r.data)));
    api.get("product/item-type/").then(r => setItemTypes(normalize(r.data)));
    api.get("product/feature-type/").then(r => setFeatureTypes(normalize(r.data)));
    api.get("product/item-class/").then(r => setItemClasses(normalize(r.data)));
  }, []);

  /* ================= LOADERS ================= */

  const loadSubTypes = async (id) => {
    const r = await api.get(`product/ac-subtypes/?ac_type_id=${id}`);
    setSubTypes(normalize(r.data));
  };

  const loadBrands = async (id) => {
    const r = await api.get(`product/ac-brand/?subtype=${id}`);
    setBrands(normalize(r.data));
  };

  const loadModels = async (subType, brand) => {
    const r = await api.get(`product/product-model/?ac_sub_type_id=${subType}&brand_id=${brand}`);
    setModels(normalize(r.data));
  };

  const loadVariants = async (id) => {
    const r = await api.get(`product/product-variant/?product_model=${id}`);
    setVariants(normalize(r.data));
  };

  const loadLowSideItems = async (data) => {
    const r = await api.get(
      `product/item/?material_type_id=${data.material_type_id}&item_type_id=${data.item_type_id}&feature_type_id=${data.feature_type_id}&item_class_id=${data.item_class_id}`
    );
    setLowItemsMaster(normalize(r.data));
  };
  /* ================= UPDATE DRAFT HIGH ================= */

  const updateHighDraft = (field, value) => {
    const copy = { ...draftHighItem, [field]: value };

    if (field === "acType") {
      copy.subType = "";
      copy.brand = "";
      copy.model = "";
      loadSubTypes(value);
    }

    if (field === "subType") {
      copy.brand = "";
      copy.model = "";
      loadBrands(value);
    }

    if (field === "brand") {
      copy.model = "";
      loadModels(copy.subType, value);
    }

    if (field === "model") {
      loadVariants(value);
    }

    setDraftHighItem(copy);
  };

  /* ================= UPDATE LOW DRAFT ================= */

  const updateLowDraft = (field, value) => {
    const copy = { ...draftLowItem, [field]: value };

    if (
      copy.material_type_id &&
      copy.item_type_id &&
      copy.feature_type_id &&
      copy.item_class_id
    ) {
      loadLowSideItems(copy);
    }

    setDraftLowItem(copy);
  };
  /* ================= ADD ROWS ================= */

  const addHighItem = () => {
    if (!draftHighItem.product_variant) {
      alert("Select Product Variant");
      return;
    }

    const selectedVariant = variants.find(
      v => String(v.id) === String(draftHighItem.product_variant)
    );

    const newRow = {
      ...draftHighItem,
      quantity: draftHighItem.quantity || 1,
      unit_price: draftHighItem.unit_price || 0,
      rate: draftHighItem.rate || 0,
      gst_percent: draftHighItem.gst_percent || 18,
      mathadi_charges: draftHighItem.mathadi_charges || 0,
      transportation_charges: draftHighItem.transportation_charges || 0,

      // ⭐ inject display fields
      ac_type_name: selectedVariant?.ac_type_name,
      ac_sub_type_name: selectedVariant?.ac_sub_type_name,
      brand_name: selectedVariant?.brand_name,
      model_no: selectedVariant?.model_no,
      variant_sku: selectedVariant?.variant_sku,
    };

    setItems(prev => [...prev, newRow]);

    setDraftHighItem({
      acType: "",
      subType: "",
      brand: "",
      model: "",
      product_variant: "",
      description: "",
      hsn_sac: "",
      unit: "NOS",
      quantity: "",
      unit_price: "",
      rate: "",
      gst_percent: "",
      mathadi_charges: "",
      transportation_charges: ""
    });
  };
  const addLowItem = () => {
    if (!draftLowItem.item) {
      alert("Select Item");
      return;
    }

    const selectedItem = lowItemsMaster.find(
      i => String(i.id) === String(draftLowItem.item)
    );

    const newLow = {
      ...draftLowItem,
      quantity: draftLowItem.quantity || 1,
      unit_price: draftLowItem.unit_price || 0,
      rate: draftLowItem.rate || 0,
      gst_percent: draftLowItem.gst_percent || 18,
      mathadi_charges: draftLowItem.mathadi_charges || 0,
      item_code: selectedItem?.item_code
    };

    setLowItems(prev => [...prev, newLow]);
    setDraftLowItem({
      material_type_id: "",
      item_type_id: "",
      feature_type_id: "",
      item_class_id: "",
      item: "",
      description: "",
      hsn_sac: "",
      unit: "NOS",
      quantity: "",
      unit_price: "",
      rate: "",
      gst_percent: "",
      mathadi_charges: ""
    });
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <style>
        {`
          /* Hide number input spinners */
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>
      {/* ================= HIGH SIDE ================= */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-700">High Side Products</h3>
          <button onClick={addHighItem}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            + Add Product
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1 - 4 dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftHighItem.acType}
              onChange={e => updateHighDraft("acType", e.target.value)}>
              <option>AC Type</option>
              {acTypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftHighItem.subType}
              onChange={e => updateHighDraft("subType", e.target.value)}>
              <option>SubType</option>
              {subTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftHighItem.brand}
              onChange={e => updateHighDraft("brand", e.target.value)}>
              <option>Brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftHighItem.model}
              onChange={e => updateHighDraft("model", e.target.value)}>
              <option>Model</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.model_no}</option>)}
            </select>
          </div>
          {/* Row 2 - remaining inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftHighItem.product_variant}
              onChange={e => updateHighDraft("product_variant", e.target.value)}>
              <option>Variant</option>
              {variants.map(v => <option key={v.id} value={v.id}>{v.sku}</option>)}
            </select>

            <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="number"
              placeholder="Qty"
              value={draftHighItem.quantity}
              onChange={e => updateHighDraft("quantity", e.target.value)} />

            <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="number"
              placeholder={isInvoice ? "Rate" : "Price"}
              value={isInvoice ? draftHighItem.rate : draftHighItem.unit_price}
              onChange={e => updateHighDraft(isInvoice ? "rate" : "unit_price", e.target.value)} />

            {gstType !== "NO_GST" && (
              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number"
                placeholder="GST%"
                value={draftHighItem.gst_percent}
                onChange={e => updateHighDraft("gst_percent", e.target.value)} />
            )}
          </div>

          {/* Row 3 - Additional fields for non-invoice mode */}
          {!isInvoice && (
            <div className="grid grid-cols-2 gap-3">
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number"
                placeholder="Mathadi Charges"
                value={draftHighItem.mathadi_charges}
                onChange={e => updateHighDraft("mathadi_charges", e.target.value)}
              />

              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number"
                placeholder="Transportation Charges"
                value={draftHighItem.transportation_charges}
                onChange={e => updateHighDraft("transportation_charges", e.target.value)}
              />
            </div>
          )}
          {/* Row 4 - Invoice specific fields */}
          {isInvoice && (
            <div className="grid grid-cols-2 gap-3">
              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="HSN"
                value={draftHighItem.hsn_sac}
                onChange={e => updateHighDraft("hsn_sac", e.target.value)} />

              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Unit"
                value={draftHighItem.unit}
                onChange={e => updateHighDraft("unit", e.target.value)} />
            </div>
          )}

          {/* Row 5 - Description full width */}
          <div className="flex gap-3 items-start">
            <textarea 
              className="border border-gray-300 rounded-md px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter product description..."
              value={draftHighItem.description}
              onChange={e => updateHighDraft("description", e.target.value)}
              rows={2}
            />
          </div>
        </div>
        {items.length > 0 && (
          <div className="p-4">
            <div className="border border-gray-200 rounded-lg">
              <table className="w-full text-sm border-collapse table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">Variant</th>

                  {isInvoice && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">HSN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-16">Unit</th>
                    </>
                  )}

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-16">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">{isInvoice ? "Rate" : "Price"}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-16">GST%</th>

                  {!isInvoice && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">Mathadi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">Transport</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {items.map((row, i) => {
                  const variantName = row.variant_sku || row.product_variant;
                  return (
                    <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{i + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 truncate" title={variantName}>{variantName}</td>

                      {isInvoice && (
                        <>
                          <td className="px-4 py-3 border-r border-gray-200">
                            <input
                              className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={row.hsn_sac || ""}
                              onChange={e => {
                                const copy = [...items];
                                copy[i].hsn_sac = e.target.value;
                                setItems(copy);
                              }}
                            />
                          </td>

                          <td className="px-4 py-3 border-r border-gray-200">
                            <input
                              className="border border-gray-300 rounded px-2 py-1 w-16 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={row.unit || "NOS"}
                              onChange={e => {
                                const copy = [...items];
                                copy[i].unit = e.target.value;
                                setItems(copy);
                              }}
                            />
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 border-r border-gray-200">
                        <input
                          type="number"
                          className="border border-gray-300 rounded px-2 py-1 w-16 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={row.quantity}
                          onChange={e => {
                            const copy = [...items];
                            copy[i].quantity = e.target.value;
                            setItems(copy);
                          }}
                        />
                      </td>

                      <td className="px-4 py-3 border-r border-gray-200">
                        <input
                          type="number"
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={isInvoice ? row.rate : row.unit_price}
                          onChange={e => {
                            const copy = [...items];
                            copy[i][isInvoice ? "rate" : "unit_price"] = e.target.value;
                            setItems(copy);
                          }}
                        />
                      </td>

                      <td className="px-4 py-3 border-r border-gray-200">
                        <input
                          type="number"
                          className="border border-gray-300 rounded px-2 py-1 w-16 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={row.gst_percent}
                          onChange={e => {
                            const copy = [...items];
                            copy[i].gst_percent = e.target.value;
                            setItems(copy);
                          }}
                        />
                      </td>
                      {!isInvoice && (
                        <>
                          <td className="px-4 py-3 border-r border-gray-200">
                            <input
                              type="number"
                              className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={row.mathadi_charges || 0}
                              onChange={e => {
                                const copy = [...items];
                                copy[i].mathadi_charges = e.target.value;
                                setItems(copy);
                              }}
                            />
                          </td>

                          <td className="px-4 py-3 border-r border-gray-200">
                            <input
                              type="number"
                              className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={row.transportation_charges || 0}
                              onChange={e => {
                                const copy = [...items];
                                copy[i].transportation_charges = e.target.value;
                                setItems(copy);
                              }}
                            />
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3 border-r border-gray-200">
                        <textarea
                          className="border border-gray-300 rounded px-2 py-1 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={row.description || ""}
                          onChange={e => {
                            const copy = [...items];
                            copy[i].description = e.target.value;
                            setItems(copy);
                          }}
                          rows={2}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <button
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                          title="Delete"
                        >
                          <MdDelete />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
      {/* ================= LOW SIDE ================= */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-700">Low Side Items</h3>
          <button onClick={addLowItem}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            + Add Product
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1 - 4 dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftLowItem.material_type_id}
              onChange={e => updateLowDraft("material_type_id", e.target.value)}>
              <option>Material Type</option>
              {materialTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftLowItem.item_type_id}
              onChange={e => updateLowDraft("item_type_id", e.target.value)}>
              <option>Item Type</option>
              {itemTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftLowItem.feature_type_id}
              onChange={e => updateLowDraft("feature_type_id", e.target.value)}>
              <option>Feature</option>
              {featureTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftLowItem.item_class_id}
              onChange={e => updateLowDraft("item_class_id", e.target.value)}>
              <option>Item Class</option>
              {itemClasses.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          {/* Row 2 - remaining inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftLowItem.item}
              onChange={e => updateLowDraft("item", e.target.value)}>
              <option>Select Item</option>
              {lowItemsMaster.map(i => <option key={i.id} value={i.id}>{i.item_code}</option>)}
            </select>

            <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="number"
              placeholder="Qty"
              value={draftLowItem.quantity}
              onChange={e => updateLowDraft("quantity", e.target.value)} />

            <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="number"
              placeholder={isInvoice ? "Rate" : "Price"}
              value={isInvoice ? draftLowItem.rate : draftLowItem.unit_price}
              onChange={e => updateLowDraft(isInvoice ? "rate" : "unit_price", e.target.value)} />

            {gstType !== "NO_GST" && (
              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number"
                placeholder="GST%"
                value={draftLowItem.gst_percent}
                onChange={e => updateLowDraft("gst_percent", e.target.value)} />
            )}
          </div>

          {/* Row 3 - Additional fields for non-invoice mode */}
          {!isInvoice && (
            <div className="grid grid-cols-1 gap-3">
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number"
                placeholder="Mathadi Charges"
                value={draftLowItem.mathadi_charges}
                onChange={e => updateLowDraft("mathadi_charges", e.target.value)}
              />
            </div>
          )}
          {/* Row 4 - Invoice specific fields */}
          {isInvoice && (
            <div className="grid grid-cols-2 gap-3">
              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="HSN"
                value={draftLowItem.hsn_sac}
                onChange={e => updateLowDraft("hsn_sac", e.target.value)} />

              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Unit"
                value={draftLowItem.unit}
                onChange={e => updateLowDraft("unit", e.target.value)} />
            </div>
          )}

          {/* Row 5 - Description full width */}
          <div className="flex gap-3 items-start">
            <textarea
              className="border border-gray-300 rounded-md px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter item description..."
              value={draftLowItem.description}
              onChange={e => updateLowDraft("description", e.target.value)}
              rows={2}
            />
          </div>
        </div>
        {lowItems.length > 0 && (
          <div className="p-4">
            <div className="border border-gray-200 rounded-lg">
              <table className="w-full text-sm border-collapse table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">Item</th>

                  {isInvoice && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">HSN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-16">Unit</th>
                    </>
                  )}

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-16">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">{isInvoice ? "Rate" : "Price"}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-16">GST%</th>
                  {!isInvoice && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">Mathadi</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {lowItems.map((row, i) => {
                  const itemName = row.item_code || row.item;
                  return (
                    <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{i + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 truncate" title={itemName}>{itemName}</td>

                      {isInvoice && (
                        <>
                          <td className="px-4 py-3 border-r border-gray-200">
                            <input
                              className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={row.hsn_sac || ""}
                              onChange={e => {
                                const copy = [...lowItems];
                                copy[i].hsn_sac = e.target.value;
                                setLowItems(copy);
                              }}
                            />
                          </td>

                          <td className="px-4 py-3 border-r border-gray-200">
                            <input
                              className="border border-gray-300 rounded px-2 py-1 w-16 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={row.unit || "NOS"}
                              onChange={e => {
                                const copy = [...lowItems];
                                copy[i].unit = e.target.value;
                                setLowItems(copy);
                              }}
                            />
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 border-r border-gray-200">
                        <input
                          type="number"
                          className="border border-gray-300 rounded px-2 py-1 w-16 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={row.quantity}
                          onChange={e => {
                            const copy = [...lowItems];
                            copy[i].quantity = e.target.value;
                            setLowItems(copy);
                          }}
                        />
                      </td>

                      <td className="px-4 py-3 border-r border-gray-200">
                        <input
                          type="number"
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={isInvoice ? row.rate : row.unit_price}
                          onChange={e => {
                            const copy = [...lowItems];
                            copy[i][isInvoice ? "rate" : "unit_price"] = e.target.value;
                            setLowItems(copy);
                          }}
                        />
                      </td>

                      <td className="px-4 py-3 border-r border-gray-200">
                        <input
                          type="number"
                          className="border border-gray-300 rounded px-2 py-1 w-16 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={row.gst_percent}
                          onChange={e => {
                            const copy = [...lowItems];
                            copy[i].gst_percent = e.target.value;
                            setLowItems(copy);
                          }}
                        />
                      </td>
                      {!isInvoice && (
                        <td className="px-4 py-3 border-r border-gray-200">
                          <input
                            type="number"
                            className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={row.mathadi_charges || 0}
                            onChange={e => {
                              const copy = [...lowItems];
                              copy[i].mathadi_charges = e.target.value;
                              setLowItems(copy);
                            }}
                          />
                        </td>
                      )}

                      <td className="px-4 py-3 border-r border-gray-200">
                        <textarea
                          className="border border-gray-300 rounded px-2 py-1 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={row.description || ""}
                          onChange={e => {
                            const copy = [...lowItems];
                            copy[i].description = e.target.value;
                            setLowItems(copy);
                          }}
                          rows={2}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <button
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => setLowItems(lowItems.filter((_, idx) => idx !== i))}
                          title="Delete"
                        >
                          <MdDelete />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

    </div>
  );
}