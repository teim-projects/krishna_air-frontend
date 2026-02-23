import { useEffect, useState } from "react";
import axios from "axios";

const BASE_API =
  import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${BASE_API}/`,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access") ||
    localStorage.getItem("access_token");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const normalize = (data) =>
  Array.isArray(data) ? data : data?.results || [];

export default function AddQuotation({ id, onBack }) {

  const isEdit = !!id;

  // ================= HIGH SIDE MASTER =================
  const [acTypes, setAcTypes] = useState([]);
  const [subTypes, setSubTypes] = useState({});
  const [brands, setBrands] = useState({});
  const [models, setModels] = useState({});
  const [variants, setVariants] = useState({});

  // ================= LOW SIDE MASTER =================
  const [materialTypes,setMaterialTypes] = useState([]);
  const [itemTypes,setItemTypes] = useState([]);
  const [featureTypes,setFeatureTypes] = useState([]);
  const [itemClasses,setItemClasses] = useState([]);
  const [lowItemsMaster,setLowItemsMaster] = useState({});

  const [gstType, setGstType] = useState("CGST_SGST");

  const [siteName,setSiteName]=useState("");
  const [thankNote,setThankNote]=useState("");

  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    id: ""
  });

  // ================= HIGH SIDE ITEMS =================
  const [items, setItems] = useState([
    {
      acType:"",
      subType:"",
      brand:"",
      model:"",
      product_variant:"",
      quantity:1,
      unit_price:0,
      gst_percent:18,
      mathadi_charges:0,
      transportation_charges:0
    }
  ]);

  // ================= LOW SIDE ITEMS =================
  const [lowItems,setLowItems] = useState([
  {
    material_type_id:"",
    item_type_id:"",
    feature_type_id:"",
    item_class_id:"",
    item:"",
    quantity:1,
    unit_price:0,
    gst_percent:18,     // ⭐ NEW
    mathadi_charges:0
  }
]);


  // ================= LOAD MASTERS =================
  useEffect(() => {
    api.get("product/actype/")
      .then(res => setAcTypes(normalize(res.data)));

    api.get("product/material-type/")
      .then(res=>setMaterialTypes(normalize(res.data)));

    api.get("product/item-type/")
      .then(res=>setItemTypes(normalize(res.data)));

    api.get("product/feature-type/")
      .then(res=>setFeatureTypes(normalize(res.data)));

    api.get("product/item-class/")
      .then(res=>setItemClasses(normalize(res.data)));
  }, []);

  // ================= EDIT LOAD =================
  useEffect(()=>{

    if(!isEdit) return;

    api.get(`quotation/quotation/${id}/`)
      .then(res=>{

        const q = res.data;

        setCustomer({
          phone:q.customer_contact,
          name:q.customer_name,
          id:q.customer
        });

        const active = q.versions.find(v=>v.is_active);

        setGstType(active.gst_type);

        setItems(
          active.high_side_items.map(i=>({
            acType:"",
            subType:"",
            brand:"",
            model:"",
            product_variant:i.product_variant,
            quantity:i.quantity,
            unit_price:i.unit_price,
            gst_percent:i.gst_percent,
            mathadi_charges:i.mathadi_charges || 0,
            transportation_charges:i.transportation_charges || 0
          }))
        );

        setLowItems(
          active.low_side_items.map(l=>({
            material_type_id:"",
            item_type_id:"",
            feature_type_id:"",
            item_class_id:"",
            item:l.item,
            quantity:l.quantity,
            gst_percent:l.gst_percent || 18,
            unit_price:l.unit_price,
            mathadi_charges:l.mathadi_charges || 0
          }))
        );

      });

  },[id]);

  // ================= PHONE SEARCH =================
  const handlePhone = async (e) => {
    const phone = e.target.value;
    setCustomer(prev => ({ ...prev, phone }));

    if (phone.length >= 10) {
      const res = await api.get(`lead/customer/?search=${phone}`);
      const data = normalize(res.data);

      if (data.length > 0) {
        setCustomer({
          phone,
          name:data[0].name,
          id:data[0].id
        });
      }
    }
  };

  // ================= HIGH SIDE LOADERS =================
  const loadSubTypes = async (index, id) => {
    const res = await api.get(`product/ac-subtypes/?ac_type_id=${id}`);
    setSubTypes(prev => ({ ...prev, [index]: normalize(res.data) }));
  };

  const loadBrands = async (index, id) => {
    const res = await api.get(`product/ac-brand/?subtype=${id}`);
    setBrands(prev => ({ ...prev, [index]: normalize(res.data) }));
  };

  const loadModels = async (index, id) => {
    const res = await api.get(`product/product-model/?brand_id=${id}`);
    setModels(prev => ({ ...prev, [index]: normalize(res.data) }));
  };

  const loadVariants = async (index, id) => {
    const res = await api.get(`product/product-variant/?product_model=${id}`);
    setVariants(prev => ({ ...prev, [index]: normalize(res.data) }));
  };

  // ================= LOW SIDE ITEM LOAD =================
  const loadLowSideItems = async(index,data)=>{
    const res = await api.get(
      `product/item/?material_type_id=${data.material_type_id}&item_type_id=${data.item_type_id}&feature_type_id=${data.feature_type_id}&item_class_id=${data.item_class_id}`
    );

    setLowItemsMaster(prev=>({...prev,[index]:normalize(res.data)}))
  };

  // ================= UPDATE HIGH SIDE =================
  const updateItem = (index, field, value) => {
    const copy=[...items];
    copy[index][field]=value;

    if(field==="acType"){
      copy[index].subType="";
      copy[index].brand="";
      copy[index].model="";
      copy[index].product_variant="";
      loadSubTypes(index,value);
    }
    if(field==="subType"){
      copy[index].brand="";
      copy[index].model="";
      copy[index].product_variant="";
      loadBrands(index,value);
    }
    if(field==="brand"){
      copy[index].model="";
      copy[index].product_variant="";
      loadModels(index,value);
    }
    if(field==="model"){
      copy[index].product_variant="";
      loadVariants(index,value);
    }

    setItems(copy);
  };

  // ================= UPDATE LOW SIDE =================
  const updateLowItem=(index,field,value)=>{
    const copy=[...lowItems];
    copy[index][field]=value;

    if(
      copy[index].material_type_id &&
      copy[index].item_type_id &&
      copy[index].feature_type_id &&
      copy[index].item_class_id
    ){
      loadLowSideItems(index,copy[index]);
    }

    setLowItems(copy);
  };

  // ================= ADD ROWS =================
  const addRow=()=>{
    setItems([...items,{
      acType:"",
      subType:"",
      brand:"",
      model:"",
      product_variant:"",
      quantity:1,
      unit_price:0,
      gst_percent:18,
      mathadi_charges:0,
      transportation_charges:0
    }])
  };


  const removeRow = (index) => {
  const copy = [...items];
  copy.splice(index, 1);

  // always keep at least one row
  if (copy.length === 0) {
    setItems([{
      acType:"",
      subType:"",
      brand:"",
      model:"",
      product_variant:"",
      quantity:1,
      unit_price:0,
      gst_percent:18,
      mathadi_charges:0,
      transportation_charges:0
    }]);
  } else {
    setItems(copy);
  }
};

  const addLowRow=()=>{
  setLowItems([...lowItems,{
    material_type_id:"",
    item_type_id:"",
    feature_type_id:"",
    item_class_id:"",
    item:"",
    quantity:1,
    unit_price:0,
    gst_percent:18,   // ⭐ NEW
    mathadi_charges:0
  }])
};

const removeLowRow = (index) => {
  const copy = [...lowItems];
  copy.splice(index, 1);

  if (copy.length === 0) {
    setLowItems([{
      material_type_id:"",
      item_type_id:"",
      feature_type_id:"",
      item_class_id:"",
      item:"",
      quantity:1,
      unit_price:0,
      gst_percent:18,
      mathadi_charges:0
    }]);
  } else {
    setLowItems(copy);
  }
};


const resetForm = () => {

  setCustomer({
    phone: "",
    name: "",
    id: ""
  });

  setSiteName("");
  setThankNote("");
  setGstType("CGST_SGST");

  setItems([
    {
      acType:"",
      subType:"",
      brand:"",
      model:"",
      product_variant:"",
      quantity:1,
      unit_price:0,
      gst_percent:18,
      mathadi_charges:0,
      transportation_charges:0
    }
  ]);

  setLowItems([
    {
      material_type_id:"",
      item_type_id:"",
      feature_type_id:"",
      item_class_id:"",
      item:"",
      quantity:1,
      unit_price:0,
      gst_percent:18,
      mathadi_charges:0
    }
  ]);

  // optional but recommended
  setSubTypes({});
  setBrands({});
  setModels({});
  setVariants({});
  setLowItemsMaster({});
};


  // ================= SUBMIT =================
  const handleSubmit = async () => {

    const payload = {
      
      customer:Number(customer.id),
      subject:"AC Quotation",
      site_name:siteName,
      thank_you_note:thankNote,
      versions:[{
        gst_type:gstType,
        

        high_side_items:items.map(i=>({
          product_variant:Number(i.product_variant),
          quantity:Number(i.quantity),
          unit_price:Number(i.unit_price),
          gst_percent:Number(i.gst_percent),
          mathadi_charges:Number(i.mathadi_charges),
          transportation_charges:Number(i.transportation_charges)
        })),

        low_side_items:lowItems.map(l=>({
          item:Number(l.item),
          quantity:Number(l.quantity),
          unit_price:Number(l.unit_price),
          gst_percent:Number(l.gst_percent), 
          mathadi_charges:Number(l.mathadi_charges)
        }))
      }]
    };

    try{

      if(isEdit){
        await api.put(`quotation/quotation/${id}/`,payload);
      }else{
        await api.post("quotation/quotation/",payload);
      }

      alert("Quotation Saved Successfully ✅");
      resetForm();

    }catch(err){
      console.log(err.response?.data);
      alert("Error saving quotation ❌");
    }
  };

  // ================= UI =================
  return (
  <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
    <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-6 space-y-6">

      <h2 className="text-2xl font-semibold text-gray-800">
        Add Quotation
      </h2>

      {/* ================= CUSTOMER INFO ================= */}
      <div className="grid md:grid-cols-3 gap-4">
        <input
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="Customer Phone"
          value={customer.phone}
          onChange={handlePhone}
        />

        <input
          className="border rounded-lg px-3 py-2 bg-gray-50"
          placeholder="Customer Name"
          value={customer.name}
          readOnly
        />

        <input
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="Site Name"
          value={siteName}
          onChange={(e)=>setSiteName(e.target.value)}
        />
      </div>

      <textarea
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
        placeholder="Thank You Note"
        value={thankNote}
        onChange={(e)=>setThankNote(e.target.value)}
      />

      <div className="flex items-center gap-3">
        <label className="font-medium text-gray-700">GST Type :</label>
        <select
          className="border rounded-lg px-3 py-2"
          value={gstType}
          onChange={(e)=>setGstType(e.target.value)}
        >
          <option value="CGST_SGST">CGST + SGST</option>
          <option value="IGST">IGST</option>
        </select>
      </div>

      {/* ================= HIGH SIDE ================= */}
      <div className="space-y-4">
        {items.map((item,index)=>(
          <div key={index} className="border rounded-xl p-4 bg-gray-50 space-y-3 relative">


          <button
  type="button"
  onClick={() => removeRow(index)}
  className="absolute top-2 right-3 text-red-500 font-bold hover:text-red-700"
>
  ✕
</button>

            <div className="grid md:grid-cols-5 gap-3">
              <select className="border rounded-lg px-2 py-2"
                value={item.acType}
                onChange={(e)=>updateItem(index,"acType",e.target.value)}>
                <option>AC Type</option>
                {acTypes.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>

              <select className="border rounded-lg px-2 py-2"
                disabled={!item.acType}
                value={item.subType}
                onChange={(e)=>updateItem(index,"subType",e.target.value)}>
                <option>SubType</option>
                {(subTypes[index]||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <select className="border rounded-lg px-2 py-2"
                disabled={!item.subType}
                value={item.brand}
                onChange={(e)=>updateItem(index,"brand",e.target.value)}>
                <option>Brand</option>
                {(brands[index]||[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              <select className="border rounded-lg px-2 py-2"
                disabled={!item.brand}
                value={item.model}
                onChange={(e)=>updateItem(index,"model",e.target.value)}>
                <option>Model</option>
                {(models[index]||[]).map(m=><option key={m.id} value={m.id}>{m.model_no}</option>)}
              </select>

              <select className="border rounded-lg px-2 py-2"
                disabled={!item.model}
                value={item.product_variant}
                onChange={(e)=>updateItem(index,"product_variant",e.target.value)}>
                <option>Variant</option>
                {(variants[index]||[]).map(v=><option key={v.id} value={v.id}>{v.sku}</option>)}
              </select>
            </div>

            <div className="grid md:grid-cols-5 gap-3">
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="Qty"
                value={item.quantity} onChange={(e)=>updateItem(index,"quantity",e.target.value)}/>
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="Price"
                value={item.unit_price} onChange={(e)=>updateItem(index,"unit_price",e.target.value)}/>
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="GST%"
                value={item.gst_percent} onChange={(e)=>updateItem(index,"gst_percent",e.target.value)}/>
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="Mathadi"
                value={item.mathadi_charges} onChange={(e)=>updateItem(index,"mathadi_charges",e.target.value)}/>
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="Transport"
                value={item.transportation_charges} onChange={(e)=>updateItem(index,"transportation_charges",e.target.value)}/>
            </div>

          </div>
        ))}

        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          onClick={addRow}>
          + Add Product
        </button>
      </div>

      {/* ================= LOW SIDE ================= */}
      <h3 className="text-lg font-semibold text-gray-700">Low Side Items</h3>

      <div className="space-y-4">
        {lowItems.map((l,index)=>(
          <div key={index} className="border rounded-xl p-4 bg-gray-50 space-y-3 relative">

          <button
  type="button"
 onClick={() => removeLowRow(index)}
  className="absolute top-2 right-3 text-red-500 font-bold hover:text-red-700"
>
  ✕
</button>

            <div className="grid md:grid-cols-5 gap-3">
              <select className="border rounded-lg px-2 py-2"
                value={l.material_type_id}
                onChange={e=>updateLowItem(index,"material_type_id",e.target.value)}>
                <option>Material Type</option>
                {materialTypes.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <select className="border rounded-lg px-2 py-2"
                value={l.item_type_id}
                onChange={e=>updateLowItem(index,"item_type_id",e.target.value)}>
                <option>Item Type</option>
                {itemTypes.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <select className="border rounded-lg px-2 py-2"
                value={l.feature_type_id}
                onChange={e=>updateLowItem(index,"feature_type_id",e.target.value)}>
                <option>Feature Type</option>
                {featureTypes.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <select className="border rounded-lg px-2 py-2"
                value={l.item_class_id}
                onChange={e=>updateLowItem(index,"item_class_id",e.target.value)}>
                <option>Item Class</option>
                {itemClasses.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <select className="border rounded-lg px-2 py-2"
                value={l.item}
                onChange={e=>updateLowItem(index,"item",e.target.value)}>
                <option>Select Item</option>
                {(lowItemsMaster[index]||[]).map(i=>
                  <option key={i.id} value={i.id}>{i.item_code}</option>
                )}
              </select>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="Qty"
                value={l.quantity} onChange={e=>updateLowItem(index,"quantity",e.target.value)}/>
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="Price"
                value={l.unit_price} onChange={e=>updateLowItem(index,"unit_price",e.target.value)}/>
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="GST%"
                value={l.gst_percent} onChange={e=>updateLowItem(index,"gst_percent",e.target.value)}/>
              <input className="border rounded-lg px-2 py-2" type="number" placeholder="Mathadi"
                value={l.mathadi_charges} onChange={e=>updateLowItem(index,"mathadi_charges",e.target.value)}/>
            </div>

          </div>
        ))}

        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          onClick={addLowRow}>
          + Add Low Item
        </button>
      </div>

      <div className="flex justify-end">
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
          onClick={handleSubmit}>
          Save Quotation
        </button>
      </div>

    </div>
  </div>
);

}
