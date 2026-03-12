import { useEffect, useState } from "react";
import axios from "axios";

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
    quantity: 1,
    unit_price: 0,
    rate: 0,
    gst_percent: 18,
    mathadi_charges: 0,
    transportation_charges: 0
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
    quantity: 1,
    unit_price: 0,
    rate: 0,
    gst_percent: 18,
    mathadi_charges: 0
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
    quantity: 1,
    unit_price: 0,
    rate: 0,
    gst_percent: 18,
    mathadi_charges: 0,
    transportation_charges: 0
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
      quantity: 1,
      unit_price: 0,
      rate: 0,
      gst_percent: 18,
      mathadi_charges: 0
    });
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      {/* ================= HIGH SIDE ================= */}

      <div className="space-y-3">
        <h3 className="font-semibold">High Side Products</h3>

        <div className="grid md:grid-cols-5 gap-3">

          <select className="border rounded-lg px-3 py-2"
            value={draftHighItem.acType}
            onChange={e => updateHighDraft("acType", e.target.value)}>
            <option>AC Type</option>
            {acTypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2"
            value={draftHighItem.subType}
            onChange={e => updateHighDraft("subType", e.target.value)}>
            <option>SubType</option>
            {subTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2"
            value={draftHighItem.brand}
            onChange={e => updateHighDraft("brand", e.target.value)}>
            <option>Brand</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2"
            value={draftHighItem.model}
            onChange={e => updateHighDraft("model", e.target.value)}>
            <option>Model</option>
            {models.map(m => <option key={m.id} value={m.id}>{m.model_no}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2"
            value={draftHighItem.product_variant}
            onChange={e => updateHighDraft("product_variant", e.target.value)}>
            <option>Variant</option>
            {variants.map(v => <option key={v.id} value={v.id}>{v.sku}</option>)}
          </select>
        </div>

        <div className="grid md:grid-cols-5 gap-3">

          {isInvoice && (
            <>
              <input className="border rounded-lg px-3 py-2"
                placeholder="Description"
                value={draftHighItem.description}
                onChange={e => updateHighDraft("description", e.target.value)} />

              <input className="border rounded-lg px-3 py-2"
                placeholder="HSN"
                value={draftHighItem.hsn_sac}
                onChange={e => updateHighDraft("hsn_sac", e.target.value)} />

              <input className="border rounded-lg px-3 py-2"
                placeholder="Unit"
                value={draftHighItem.unit}
                onChange={e => updateHighDraft("unit", e.target.value)} />
            </>
          )}

          <input className="border rounded-lg px-3 py-2"
            type="number"
            placeholder="Qty"
            value={draftHighItem.quantity}
            onChange={e => updateHighDraft("quantity", e.target.value)} />

          <input className="border rounded-lg px-3 py-2"
            type="number"
            placeholder={isInvoice ? "Rate" : "Price"}
            value={isInvoice ? draftHighItem.rate : draftHighItem.unit_price}
            onChange={e => updateHighDraft(isInvoice ? "rate" : "unit_price", e.target.value)} />

           {gstType !== "NO_GST" && (
          <input className="border rounded-lg px-3 py-2"
            type="number"
            placeholder="GST%"
            value={draftHighItem.gst_percent}
            onChange={e => updateHighDraft("gst_percent", e.target.value)} />
           )}

          {!isInvoice && (
<>
<input
  className="border rounded-lg px-3 py-2"
  type="number"
  placeholder="Mathadi Charges"
  value={draftHighItem.mathadi_charges}
  onChange={e => updateHighDraft("mathadi_charges", e.target.value)}
/>

<input
  className="border rounded-lg px-3 py-2"
  type="number"
  placeholder="Transportation Charges"
  value={draftHighItem.transportation_charges}
  onChange={e => updateHighDraft("transportation_charges", e.target.value)}
/>
</>
)}

        </div>

        <div className="flex justify-end">
          <button onClick={addHighItem}
            className="px-4 py-2 bg-green-600 text-white rounded-lg">
            + Add High Product
          </button>
        </div>

        {items.length > 0 && (
<div className="overflow-x-auto border rounded-lg">
<table className="w-full text-sm border-collapse">

<thead className="bg-gray-200">
<tr>
<th className="border p-2">#</th>
<th className="border p-2">AC Type</th>
<th className="border p-2">AC Sub Type</th>
<th className="border p-2">Brand</th>
<th className="border p-2">Model</th>
<th className="border p-2">Variant</th>
{isInvoice && (
<th className="border p-2">Description</th>
)}
{isInvoice && (
<>
<th className="border p-2">HSN</th>
<th className="border p-2">Unit</th>
</>
)}

<th className="border p-2">Qty</th>
<th className="border p-2">{isInvoice ? "Rate" : "Price"}</th>
{gstType !== "NO_GST" && (
<th className="border p-2">GST%</th>
)}

{!isInvoice && (
<>
<th className="border p-2">Mathadi</th>
<th className="border p-2">Transport</th>
</>
)}
<th className="border p-2">Action</th>
</tr>
</thead>

<tbody>

{items.map((row,i)=>{

const acName = row.ac_type_name || "-";
const subName = row.ac_sub_type_name || "-";
const brandName = row.brand_name || "-";
const modelName = row.model_no || "-";
const variantName = row.variant_sku || row.product_variant;
return(
<tr key={i} className="text-center bg-white">

<td className="border p-2">{i+1}</td>
<td className="border p-2">{acName}</td>
<td className="border p-2">{subName}</td>
<td className="border p-2">{brandName}</td>
<td className="border p-2">{modelName}</td>
<td className="border p-2">{variantName}</td>
{isInvoice && (
<td className="border p-2">{row.description}</td>
)}
{isInvoice && (
<>
<td className="border p-2">
<input
className="border rounded px-2 py-1 w-[90px]"
value={row.hsn_sac||""}
onChange={e=>{
const copy=[...items];
copy[i].hsn_sac=e.target.value;
setItems(copy);
}}
/>
</td>

<td className="border p-2">
<input
className="border rounded px-2 py-1 w-[70px]"
value={row.unit||"NOS"}
onChange={e=>{
const copy=[...items];
copy[i].unit=e.target.value;
setItems(copy);
}}
/>
</td>
</>
)}

<td className="border p-2">
<input
type="number"
className="border rounded px-2 py-1 w-[70px]"
value={row.quantity}
onChange={e=>{
const copy=[...items];
copy[i].quantity=e.target.value;
setItems(copy);
}}
/>
</td>

<td className="border p-2">
<input
type="number"
className="border rounded px-2 py-1 w-[90px]"
value={isInvoice?row.rate:row.unit_price}
onChange={e=>{
const copy=[...items];
copy[i][isInvoice?"rate":"unit_price"]=e.target.value;
setItems(copy);
}}
/>
</td>

{gstType !== "NO_GST" && (
<td className="border p-2">
<input
type="number"
className="border rounded px-2 py-1 w-[60px]"
value={row.gst_percent}
onChange={e=>{
const copy=[...items];
copy[i].gst_percent=e.target.value;
setItems(copy);
}}
/>
</td>
)}

{!isInvoice && (
<>
<td className="border p-2">
<input
  type="number"
  className="border rounded px-2 py-1 w-[80px]"
  value={row.mathadi_charges || 0}
  onChange={e=>{
    const copy=[...items];
    copy[i].mathadi_charges=e.target.value;
    setItems(copy);
  }}
/>
</td>

<td className="border p-2">
<input
  type="number"
  className="border rounded px-2 py-1 w-[80px]"
  value={row.transportation_charges || 0}
  onChange={e=>{
    const copy=[...items];
    copy[i].transportation_charges=e.target.value;
    setItems(copy);
  }}
/>
</td>
</>
)}

<td className="border p-2">
<button
className="text-red-500 font-bold"
onClick={()=>setItems(items.filter((_,idx)=>idx!==i))}
>
✕
</button>
</td>

</tr>
);
})}

</tbody>
</table>
</div>
)}
      </div>

      {/* ================= LOW SIDE ================= */}

      <div className="space-y-3">
        <h3 className="font-semibold">Low Side Items</h3>

        <div className="grid md:grid-cols-5 gap-3">

          <select className="border rounded-lg px-3 py-2"
            value={draftLowItem.material_type_id}
            onChange={e => updateLowDraft("material_type_id", e.target.value)}>
            <option>Material Type</option>
            {materialTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2"
            value={draftLowItem.item_type_id}
            onChange={e => updateLowDraft("item_type_id", e.target.value)}>
            <option>Item Type</option>
            {itemTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2"
            value={draftLowItem.feature_type_id}
            onChange={e => updateLowDraft("feature_type_id", e.target.value)}>
            <option>Feature</option>
            {featureTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2"
            value={draftLowItem.item_class_id}
            onChange={e => updateLowDraft("item_class_id", e.target.value)}>
            <option>Item Class</option>
            {itemClasses.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2"
            value={draftLowItem.item}
            onChange={e => updateLowDraft("item", e.target.value)}>
            <option>Select Item</option>
            {lowItemsMaster.map(i => <option key={i.id} value={i.id}>{i.item_code}</option>)}
          </select>

        </div>

        <div className="grid md:grid-cols-6 gap-3">

          <input className="border rounded-lg px-3 py-2"
            type="number"
            placeholder="Qty"
            value={draftLowItem.quantity}
            onChange={e => updateLowDraft("quantity", e.target.value)} />

          <input className="border rounded-lg px-3 py-2"
            type="number"
            placeholder={isInvoice ? "Rate" : "Price"}
            value={isInvoice ? draftLowItem.rate : draftLowItem.unit_price}
            onChange={e => updateLowDraft(isInvoice ? "rate" : "unit_price", e.target.value)} />


          {gstType !== "NO_GST" && (
          <input className="border rounded-lg px-3 py-2"
            type="number"
            placeholder="GST%"
            value={draftLowItem.gst_percent}
            onChange={e => updateLowDraft("gst_percent", e.target.value)} />
          )}

{isInvoice && (

            <input
className="border rounded-lg px-3 py-2"
placeholder="Description"
value={draftLowItem.description}
onChange={e => updateLowDraft("description", e.target.value)}
/>
)}

           {!isInvoice && (

            
<input
  className="border rounded-lg px-3 py-2"
  type="number"
  placeholder="Mathadi Charges"
  value={draftLowItem.mathadi_charges}
  onChange={e => updateLowDraft("mathadi_charges", e.target.value)}
/>



)}

        </div>

        <div className="flex justify-end">
          <button onClick={addLowItem}
            className="px-4 py-2 bg-green-600 text-white rounded-lg">
            + Add Low Item
          </button>
        </div>

        {lowItems.length > 0 && (
<div className="overflow-x-auto border rounded-lg">
<table className="w-full text-sm border-collapse">

<thead className="bg-gray-200">
<tr>
<th className="border p-2">#</th>
<th className="border p-2">Item</th>

{isInvoice && (
<>

<th className="border p-2">Unit</th>
</>
)}

<th className="border p-2">Qty</th>
<th className="border p-2">{isInvoice ? "Rate" : "Price"}</th>
{gstType !== "NO_GST" && (
<th className="border p-2">GST%</th>
)}
{isInvoice && (
<th>Description</th>
)}
{!isInvoice && (
<th className="border p-2">Mathadi</th>
)}
<th className="border p-2">Action</th>
</tr>
</thead>

<tbody>

{lowItems.map((row,i)=>{

const itemName = row.item_code || row.item;

return(
<tr key={i} className="text-center bg-white">

<td className="border p-2">{i+1}</td>
<td className="border p-2">{itemName}</td>

{isInvoice && (
<>


<td className="border p-2">
<input
className="border rounded px-2 py-1"
value={row.unit||"NOS"}
onChange={e=>{
const copy=[...lowItems];
copy[i].unit=e.target.value;
setLowItems(copy);
}}
/>
</td>
</>
)}

<td className="border p-2">
<input
type="number"
className="border rounded px-2 py-1 w-[70px]"
value={row.quantity}
onChange={e=>{
const copy=[...lowItems];
copy[i].quantity=e.target.value;
setLowItems(copy);
}}
/>
</td>

<td className="border p-2">
<input
type="number"
className="border rounded px-2 py-1 w-[90px]"
value={isInvoice?row.rate:row.unit_price}
onChange={e=>{
const copy=[...lowItems];
copy[i][isInvoice?"rate":"unit_price"]=e.target.value;
setLowItems(copy);
}}
/>
</td>

{gstType !== "NO_GST" && (
<td className="border p-2">
<input
type="number"
className="border rounded px-2 py-1 w-[60px]"
value={row.gst_percent}
onChange={e=>{
const copy=[...lowItems];
copy[i].gst_percent=e.target.value;
setLowItems(copy);
}}
/>
</td>
)}

{isInvoice && (
<td className="border p-2">
<input
  className="border rounded px-2 py-1 w-[150px]"
  value={row.description || ""}
  onChange={e=>{
    const copy=[...lowItems];
    copy[i].description = e.target.value;
    setLowItems(copy);
  }}
/>
</td>
)}


{!isInvoice && (
<td className="border p-2">
<input
  type="number"
  className="border rounded px-2 py-1 w-[80px]"
  value={row.mathadi_charges || 0}
  onChange={e=>{
    const copy=[...lowItems];
    copy[i].mathadi_charges=e.target.value;
    setLowItems(copy);
  }}
/>
</td>
)}

<td className="border p-2">
<button
className="text-red-500 font-bold"
onClick={()=>setLowItems(lowItems.filter((_,idx)=>idx!==i))}
>
✕
</button>
</td>

</tr>
);
})}

</tbody>
</table>
</div>
)}

      </div>

    </div>
  );
}