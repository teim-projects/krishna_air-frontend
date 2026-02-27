import { useEffect, useState } from "react";
import axios from "axios";
import ItemSelectionEngine from "../ItemSelectionEngine";

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


export default function AddQuotation({ id, onBack }) {

  const isEdit = !!id;

  // ================= HIGH SIDE MASTER =================
  

  const [gstType, setGstType] = useState("CGST_SGST");

  const [siteName,setSiteName]=useState("");
  const [thankNote,setThankNote]=useState("");

  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    id: ""
  });

  // ================= HIGH SIDE ITEMS =================
  const [items, setItems] = useState([]);

  // ================= LOW SIDE ITEMS =================
  const [lowItems,setLowItems] = useState([]);


  // ================= LOAD MASTERS =================
 

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
    product_variant: i.product_variant,

    // ⭐ VERY IMPORTANT (ADD THESE)
    ac_type_name: i.ac_type_name,
    ac_sub_type_name: i.ac_sub_type_name,
    brand_name: i.brand_name,
    model_no: i.model_no,
    variant_sku: i.variant_sku,

    quantity: i.quantity,
    unit_price: i.unit_price,
    gst_percent: i.gst_percent,
    mathadi_charges: i.mathadi_charges || 0,
    transportation_charges: i.transportation_charges || 0
  }))
);

        setLowItems(
  active.low_side_items.map(l=>({
    item: l.item,

    // ⭐ ADD THIS
    item_code: l.item_code,

    quantity: l.quantity,
    gst_percent: l.gst_percent || 18,
    unit_price: l.unit_price,
    mathadi_charges: l.mathadi_charges || 0
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
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];

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

  // ⭐ CLOSE MODAL & RETURN TO LIST
  onBack && onBack();

}catch(err){
      console.log(err.response?.data);
      alert("Error saving quotation ❌");
    }
  };

  // ================= UI =================
  return (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-start sm:items-center p-6 z-50 mt-15">
    <div className="relative w-full max-w-2xl text-[13.5px] p-6 bg-white rounded-md shadow-lg max-h-[90vh] overflow-y-auto space-y-6">

<button
  onClick={onBack}
  className="absolute top-3 right-4 text-gray-500 hover:text-black text-lg font-bold"
>
  ✕
</button>
      <h2 className="text-xl font-bold text-center mb-2">
        {isEdit ? "Edit Quotation" : "Add Quotation"}
      </h2>

      {/* ================= CUSTOMER INFO ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input
          className="w-full px-3 py-2 rounded-md border border-slate-300"
          placeholder="Customer Phone"
          value={customer.phone}
          onChange={handlePhone}
        />

        <input
          className="w-full px-3 py-2 rounded-md border border-slate-300 bg-gray-100"
          placeholder="Customer Name"
          value={customer.name}
          readOnly
        />

        <input
          className="w-full px-3 py-2 rounded-md border border-slate-300"
          placeholder="Site Name"
          value={siteName}
          onChange={(e)=>setSiteName(e.target.value)}
        />

        <select
          className="w-full px-3 py-2 rounded-md border border-slate-300"
          value={gstType}
          onChange={(e)=>setGstType(e.target.value)}
        >
          <option value="CGST_SGST">CGST + SGST</option>
          <option value="IGST">IGST</option>
        </select>
      </div>

      <textarea
        className="w-full px-3 py-2 rounded-md border border-slate-300"
        placeholder="Thank You Note"
        value={thankNote}
        onChange={(e)=>setThankNote(e.target.value)}
      />

      {/* ================= HIGH SIDE ================= */}
      {/* ================= HIGH SIDE and low ================= */}
<ItemSelectionEngine
 baseApi={BASE_API}
 authToken={localStorage.getItem("access")}
 items={items}
 setItems={setItems}
 lowItems={lowItems}
 setLowItems={setLowItems}
 mode="quotation"
/>

      <div className="flex justify-end">
        <button
          className="px-5 py-2 bg-blue-600 text-white rounded-md"
          onClick={handleSubmit}
        >
          Save Quotation
        </button>
      </div>

    </div>
  </div>
);

}
