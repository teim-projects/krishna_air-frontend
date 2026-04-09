import { useEffect, useState } from "react";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import AcMaterialList from "./AcMaterialList";

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

  // Add GST toggle states
  const [highSideGstEnabled, setHighSideGstEnabled] = useState(true);
  const [lowSideGstEnabled, setLowSideGstEnabled] = useState(true);

  // Unit options array
  const unitOptions = ["Rmt", "Ft", "Smtr", "Sqft", "Nos", "Kg", "Lot", "m", "in"];

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
    unit: "Nos",
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
    unit: "Nos",
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

  // const [materialTypes, setMaterialTypes] = useState([]);
  // const [itemTypes, setItemTypes] = useState([]);
  // const [featureTypes, setFeatureTypes] = useState([]);
  // const [itemClasses, setItemClasses] = useState([]);
  // const [lowItemsMaster, setLowItemsMaster] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [resetMaterials, setResetMaterials] = useState(0);


  /* ================= LOADERS ================= */
  const loadAcTypes = async () => {
    const r = await api.get("product/actype/");
    setAcTypes(normalize(r.data));
  };

  useEffect(() => {
    loadAcTypes();
  }, []);

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

    const params = {};

    if (data.material_type_id) params.material_type_id = data.material_type_id;
    if (data.item_type_id) params.item_type_id = data.item_type_id;
    if (data.feature_type_id) params.feature_type_id = data.feature_type_id;
    if (data.item_class_id) params.item_class_id = data.item_class_id;

    const r = await api.get("product/item/", { params });

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

    // Only material + item type are required
    if (copy.material_type_id && copy.item_type_id) {
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
      unit: selectedVariant?.unit || draftHighItem.unit,
      quantity: draftHighItem.quantity || 1,
      unit_price: draftHighItem.unit_price || 0,
      rate: draftHighItem.rate || 0,
      gst_percent: highSideGstEnabled ? (draftHighItem.gst_percent || 18) : 0,
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
      unit: "Nos",
      quantity: "",
      unit_price: "",
      rate: "",
      gst_percent: "",
      mathadi_charges: "",
      transportation_charges: ""
    });
  };

  useEffect(() => {
    if (draftHighItem.product_variant) {
      const v = variants.find(
        x => String(x.id) === String(draftHighItem.product_variant)
      );

      if (v) {
        setDraftHighItem(prev => ({
          ...prev,
          unit: v.unit || prev.unit
        }));
      }
    }
  }, [draftHighItem.product_variant, variants]);

  const addLowItem = () => {
    if (selectedMaterials.length === 0) {
      alert("Select Material");
      return;
    }

    const newItems = selectedMaterials.map(mat => ({
      ...draftLowItem,
      quantity: draftLowItem.quantity || 1,
      unit_price: draftLowItem.unit_price || 0,
      rate: draftLowItem.rate || 0,
      gst_percent: lowSideGstEnabled ? (draftLowItem.gst_percent || 18) : 0,
      mathadi_charges: draftLowItem.mathadi_charges || 0,
      unit: mat.unit || draftLowItem.unit,
      item: mat.id,
      item_code: mat.material_name || mat.item_code
    }));

    setLowItems(prev => [...prev, ...newItems]);

    // ✅ RESET
    setSelectedMaterials([]);
    setResetMaterials(prev => prev + 1);

    setDraftLowItem({
      material_type_id: "",
      item_type_id: "",
      feature_type_id: "",
      item_class_id: "",
      item: "",
      description: "",
      hsn_sac: "",
      unit: "Nos",
      quantity: "",
      unit_price: "",
      rate: "",
      gst_percent: "",
      mathadi_charges: ""
    });
  };

  useEffect(() => {
    if (selectedMaterials.length === 1) {
      const mat = selectedMaterials[0];

      setDraftLowItem(prev => ({
        ...prev,
        unit: mat.unit || prev.unit
      }));
    }
  }, [selectedMaterials]);



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
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-gray-700">High Side Products</h3>
            <button
              type="button"
              onClick={() => setHighSideGstEnabled(!highSideGstEnabled)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                highSideGstEnabled 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}
            >
              GST {highSideGstEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <button 
          type="button"
          onClick={addHighItem}
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

            {highSideGstEnabled && (
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

          <div className="grid grid-cols-2 gap-3">
            <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="HSN"
              value={draftHighItem.hsn_sac}
              onChange={e => updateHighDraft("hsn_sac", e.target.value)} />
            {/* <div className="col-span-full">
              <textarea
                className="w-full px-3 py-2 rounded-md border border-black"
                placeholder="Enter product description..."
                value={draftHighItem.description}
                onChange={e => updateHighDraft("description", e.target.value)}
                rows={2}
              />
            </div> */}

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftHighItem.unit}
              onChange={e => updateHighDraft("unit", e.target.value)}>
              {unitOptions.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>


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
            <div className="overflow-x-auto">
              <table className="min-w-[900px] table-fixed text-sm border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-2 py-2 border-r">#</th>
                    <th className="w-40 px-2 py-2 border-r">Variant</th>
                    <th className="w-24 px-2 py-2 border-r">HSN</th>
                    <th className="w-20 px-2 py-2 border-r">Unit</th>
                    <th className="w-20 px-2 py-2 border-r">Qty</th>
                    <th className="w-28 px-2 py-2 border-r">{isInvoice ? "Rate" : "Price"}</th>
                    {highSideGstEnabled && (
                      <th className="w-20 px-2 py-2 border-r">GST%</th>
                    )}

                    {!isInvoice && (
                      <>
                        <th className="w-28 px-2 py-2 border-r">Mathadi</th>
                        <th className="w-28 px-2 py-2 border-r">Transport</th>
                      </>
                    )}

                    <th className="px-2 py-2 border-r">Description</th>
                    <th className="w-16 px-2 py-2">Action</th>
                  </tr>
                </thead>

                {/* ✅ REQUIRED */}
                <tbody>
                  {items.map((row, i) => {
                    const variantName = row.variant_sku || row.product_variant;

                    return (
                      <tr key={i} className="border-b">
                        <td className="w-12 px-2 py-2 border-r">{i + 1}</td>

                        <td className="w-40 px-2 py-2 border-r truncate">
                          {variantName}
                        </td>

                        <td className="w-24 px-2 py-2 border-r">
                          <input className="w-full border rounded px-1 py-1"
                            value={row.hsn_sac || ""}
                            onChange={e => {
                              const copy = [...items];
                              copy[i].hsn_sac = e.target.value;
                              setItems(copy);
                            }}
                          />
                        </td>

                        <td className="w-20 px-2 py-2 border-r">
                          <select className="w-full border rounded px-1 py-1"
                            value={row.unit || "Nos"}
                            onChange={e => {
                              const copy = [...items];
                              copy[i].unit = e.target.value;
                              setItems(copy);
                            }}>
                            {unitOptions.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </td>

                        <td className="w-20 px-2 py-2 border-r">
                          <input type="number"
                            className="w-full border rounded px-1 py-1"
                            value={row.quantity}
                            onChange={e => {
                              const copy = [...items];
                              copy[i].quantity = e.target.value;
                              setItems(copy);
                            }}
                          />
                        </td>

                        <td className="w-28 px-2 py-2 border-r">
                          <input type="number"
                            className="w-full border rounded px-1 py-1"
                            value={isInvoice ? row.rate : row.unit_price}
                            onChange={e => {
                              const copy = [...items];
                              copy[i][isInvoice ? "rate" : "unit_price"] = e.target.value;
                              setItems(copy);
                            }}
                          />
                        </td>

                        {highSideGstEnabled && (
                          <td className="w-20 px-2 py-2 border-r">
                            <input type="number"
                              className="w-full border rounded px-1 py-1"
                              value={row.gst_percent}
                              onChange={e => {
                                const copy = [...items];
                                copy[i].gst_percent = e.target.value;
                                setItems(copy);
                              }}
                            />
                          </td>
                        )}

                        {!isInvoice && (
                          <>
                            <td className="w-28 px-2 py-2 border-r">
                              <input type="number"
                                className="w-full border rounded px-1 py-1"
                                value={row.mathadi_charges || 0}
                                onChange={e => {
                                  const copy = [...items];
                                  copy[i].mathadi_charges = e.target.value;
                                  setItems(copy);
                                }}
                              />
                            </td>

                            <td className="w-28 px-2 py-2 border-r">
                              <input type="number"
                                className="w-full border rounded px-1 py-1"
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

                        <td className="px-2 py-2 border-r">
                          <textarea
                            className="w-full border rounded px-1 py-1 text-xs"
                            value={row.description || ""}
                            onChange={e => {
                              const copy = [...items];
                              copy[i].description = e.target.value;
                              setItems(copy);
                            }}
                          />
                        </td>

                        <td className="w-16 px-2 py-2 text-center">
                          <button onClick={() =>
                            setItems(prev => prev.filter((_, idx) => idx !== i))
                          }>
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
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-gray-700">Low Side Items</h3>
            <button
              type="button"
              onClick={() => setLowSideGstEnabled(!lowSideGstEnabled)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                lowSideGstEnabled 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}
            >
              GST {lowSideGstEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <button 
          type="button"
          onClick={addLowItem}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            + Add Product
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1 - 4 dropdowns */}
          <div className="gap-3">

            <AcMaterialList
              base_api={baseApi}
              resetTrigger={resetMaterials}
              onSelectionChange={(data) => {
                setSelectedMaterials(data.materials);
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* ✅ QTY FIELD */}
            <input
              type="number"
              placeholder="Qty"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={draftLowItem.quantity}
              onChange={e => updateLowDraft("quantity", e.target.value)}
            />

            {/* ✅ PRICE FIELD (IMPORTANT) */}
            <input
              type="number"
              placeholder={isInvoice ? "Rate" : "Price"}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={isInvoice ? draftLowItem.rate : draftLowItem.unit_price}
              onChange={e => updateLowDraft(isInvoice ? "rate" : "unit_price", e.target.value)}
            />

            {/* ✅ GST */}
            {lowSideGstEnabled && (
              <input
                type="number"
                placeholder="GST%"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draftLowItem.gst_percent}
                onChange={e => updateLowDraft("gst_percent", e.target.value)}
              />
            )}


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
          </div>
          {/* {gstType !== "NO_GST" && (
            <input className="border rounded-lg px-3 py-2"
              type="number"
              placeholder="GST%"
              value={draftLowItem.gst_percent}
              onChange={e => updateLowDraft("gst_percent", e.target.value)} />
          )} */}
          {/* Row 4 - Invoice specific fields */}

          <div className="grid grid-cols-2 gap-3">
            <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="HSN"
              value={draftLowItem.hsn_sac}
              onChange={e => updateLowDraft("hsn_sac", e.target.value)} />

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftLowItem.unit}
              onChange={e => updateLowDraft("unit", e.target.value)}>
              {unitOptions.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div >

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
        </div >
        {
          lowItems.length > 0 && (
            <div className="p-4">
              <div className="border border-gray-200 rounded-lg overflow-auto max-h-[400px]">

                <table className="min-w-[1000px] w-full text-sm border-collapse table-fixed">

                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="w-12 px-2 py-2 border-r">#</th>
                      <th className="w-40 px-2 py-2 border-r">Item</th>

                      <th className="w-24 px-2 py-2 border-r">HSN</th>
                      <th className="w-20 px-2 py-2 border-r">Unit</th>

                      <th className="w-20 px-2 py-2 border-r">Qty</th>
                      <th className="w-28 px-2 py-2 border-r">
                        {isInvoice ? "Rate" : "Price"}
                      </th>
                      {lowSideGstEnabled && (
                        <th className="w-20 px-2 py-2 border-r">GST%</th>
                      )}

                      {!isInvoice && (
                        <th className="w-28 px-2 py-2 border-r">Mathadi</th>
                      )}

                      <th className="px-2 py-2 border-r">Description</th>
                      <th className="w-16 px-2 py-2">Action</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {lowItems.map((row, i) => {
                      const itemName = row.item_code || row.item;

                      return (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="w-12 px-2 py-2 border-r">{i + 1}</td>

                          <td className="w-40 px-2 py-2 border-r truncate">
                            {itemName}
                          </td>

                          <td className="w-24 px-2 py-2 border-r">
                            <input
                              className="w-full border rounded px-1 py-1"
                              value={row.hsn_sac || ""}
                              onChange={e => {
                                const copy = [...lowItems];
                                copy[i].hsn_sac = e.target.value;
                                setLowItems(copy);
                              }}
                            />
                          </td>

                          <td className="w-20 px-2 py-2 border-r">
                            <select
                              className="w-full border rounded px-1 py-1"
                              value={row.unit || "Nos"}
                              onChange={e => {
                                const copy = [...lowItems];
                                copy[i].unit = e.target.value;
                                setLowItems(copy);
                              }}>
                              {unitOptions.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </td>

                          <td className="w-20 px-2 py-2 border-r">
                            <input
                              type="number"
                              className="w-full border rounded px-1 py-1"
                              value={row.quantity}
                              onChange={e => {
                                const copy = [...lowItems];
                                copy[i].quantity = e.target.value;
                                setLowItems(copy);
                              }}
                            />
                          </td>

                          <td className="w-28 px-2 py-2 border-r">
                            <input
                              type="number"
                              className="w-full border rounded px-1 py-1"
                              value={isInvoice ? row.rate : row.unit_price}
                              onChange={e => {
                                const copy = [...lowItems];
                                copy[i][isInvoice ? "rate" : "unit_price"] = e.target.value;
                                setLowItems(copy);
                              }}
                            />
                          </td>

                          {lowSideGstEnabled && (
                            <td className="w-20 px-2 py-2 border-r">
                              <input
                                type="number"
                                className="w-full border rounded px-1 py-1"
                                placeholder="GST%"
                                value={row.gst_percent || ""}
                                onChange={e => {
                                  const copy = [...lowItems];
                                  copy[i].gst_percent = e.target.value;
                                  setLowItems(copy);
                                }}
                              />
                            </td>
                          )}

                          {!isInvoice && (
                            <td className="w-28 px-2 py-2 border-r">
                              <input
                                type="number"
                                className="w-full border rounded px-1 py-1"
                                value={row.mathadi_charges || 0}
                                onChange={e => {
                                  const copy = [...lowItems];
                                  copy[i].mathadi_charges = e.target.value;
                                  setLowItems(copy);
                                }}
                              />
                            </td>
                          )}

                          <td className="px-2 py-2 border-r">
                            <textarea
                              className="w-full border rounded px-1 py-1 text-xs"
                              value={row.description || ""}
                              onChange={e => {
                                const copy = [...lowItems];
                                copy[i].description = e.target.value;
                                setLowItems(copy);
                              }}
                            />
                          </td>

                          <td className="w-16 px-2 py-2 text-center">
                            <button
                              onClick={() =>
                                setLowItems(prev => prev.filter((_, idx) => idx !== i))
                              }
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
      </div >

    </div >
  );
}