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

const normalize = (data) =>
  Array.isArray(data) ? data : data?.results || [];



const STATES = [
  { name: "Andhra Pradesh", code: "37" },
  { name: "Arunachal Pradesh", code: "12" },
  { name: "Assam", code: "18" },
  { name: "Bihar", code: "10" },
  { name: "Chhattisgarh", code: "22" },
  { name: "Goa", code: "30" },
  { name: "Gujarat", code: "24" },
  { name: "Haryana", code: "06" },
  { name: "Himachal Pradesh", code: "02" },
  { name: "Jharkhand", code: "20" },
  { name: "Karnataka", code: "29" },
  { name: "Kerala", code: "32" },
  { name: "Madhya Pradesh", code: "23" },
  { name: "Maharashtra", code: "27" },
  { name: "Manipur", code: "14" },
  { name: "Meghalaya", code: "17" },
  { name: "Mizoram", code: "15" },
  { name: "Nagaland", code: "13" },
  { name: "Odisha", code: "21" },
  { name: "Punjab", code: "03" },
  { name: "Rajasthan", code: "08" },
  { name: "Sikkim", code: "11" },
  { name: "Tamil Nadu", code: "33" },
  { name: "Telangana", code: "36" },
  { name: "Tripura", code: "16" },
  { name: "Uttar Pradesh", code: "09" },
  { name: "Uttarakhand", code: "05" },
  { name: "West Bengal", code: "19" },
];


export default function AddInvoice({ id, onBack }) {

  const isEdit = !!id;

  // ================= COMPANY PROFILE =================
  const [companyProfile, setCompanyProfile] = useState(null);
  const [stateSearch, setStateSearch] = useState("");
  const [showStateList, setShowStateList] = useState(false);
  const filteredStates = STATES.filter(s =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase())
  );


  const handleStateChange = (value) => {
  setStateSearch(value);

  setBuyerSnapshot(prev => ({
    ...prev,
    buyer_state: value
  }));

  const found = STATES.find(
    s => s.name.toLowerCase() === value.toLowerCase()
  );

  if (found) {
    setBuyerSnapshot(prev => ({
      ...prev,
      buyer_state: found.name,
      buyer_state_code: found.code
    }));
  }
};
  
  // ================= CUSTOMER =================
  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    id: "",
    address: "",
    gstin: "",
    state: "",
    state_code: ""
  });

  // ================= INVOICE HEADER =================
  const [form, setForm] = useState({
    invoice_no: isEdit ? "" : "INV-" + Date.now(),
    invoice_date: new Date().toISOString().split('T')[0],
    delivery_note: "",
    supplier_ref: "",
    buyer_order_no: "",
    destination: "",
    terms_of_delivery: "",
    site_name: "",
    work_description: "",
    gst_type: "CGST_SGST"
  });

  // ================= BUYER SNAPSHOT =================
  const [buyerSnapshot, setBuyerSnapshot] = useState({
    buyer_name: "",
    buyer_address: "",
    buyer_gstin: "",
    buyer_state: "",
    buyer_state_code: ""
  });

  // ================= SHIP TO =================
  const [shipTo, setShipTo] = useState({
    ship_to_address: "",
    same_as_buyer: true
  });

  // ================= COMPANY SNAPSHOT =================
  const [companySnapshot, setCompanySnapshot] = useState({
    company_name: "",
    company_address: "",
    company_gstin: "",
    company_pan: "",
    company_email: "",
    company_msme_number: "",
    bank_name: "",
    account_no: "",
    ifsc_code: "",
    branch: "",
    declaration: ""
  });

  // ================= HIGH SIDE ITEMS =================
  const [items,setItems] = useState([]);

  // ================= LOW SIDE ITEMS =================
  const [lowItems,setLowItems] = useState([]);

  // ================= LOAD MASTERS =================
 
  // ================= EDIT LOAD =================
  useEffect(() => {
    if (!isEdit) return;

    api.get(`invoice/invoice/${id}/`)
      .then(res => {
        const inv = res.data;

        // Set customer
        setCustomer({
          phone: "", // You might need to fetch customer details separately
          name: inv.buyer_name,
          id: inv.customer,
          address: inv.buyer_address,
          gstin: inv.buyer_gstin,
          state: inv.buyer_state,
          state_code: inv.buyer_state_code
        });

        // Set form fields
        setForm({
          invoice_no: inv.invoice_no,
          invoice_date: inv.invoice_date,
          delivery_note: inv.delivery_note || "",
          supplier_ref: inv.supplier_ref || "",
          buyer_order_no: inv.buyer_order_no || "",
          destination: inv.destination || "",
          terms_of_delivery: inv.terms_of_delivery || "",
          site_name: inv.site_name || "",
          work_description: inv.work_description || "",
          gst_type: inv.gst_type
        });

        // Set buyer snapshot
        setBuyerSnapshot({
          buyer_name: inv.buyer_name,
          buyer_address: inv.buyer_address,
          buyer_gstin: inv.buyer_gstin,
          buyer_state: inv.buyer_state,
          buyer_state_code: inv.buyer_state_code
        });

        // Set ship to
        setShipTo({
          ship_to_address: inv.ship_to_address || "",
          same_as_buyer: !inv.ship_to_address
        });

        // Set company snapshot
        setCompanySnapshot({
          company_name: inv.company_name,
          company_address: inv.company_address,
          company_gstin: inv.company_gstin,
          company_pan: inv.company_pan,
          company_email: inv.company_email || "",
          company_msme_number: inv.company_msme_number || "",
          bank_name: inv.bank_name,
          account_no: inv.account_no,
          ifsc_code: inv.ifsc_code,
          branch: inv.branch,
          declaration: inv.declaration || ""
        });

        // Set items (you'll need to separate high/low based on your data structure)
        const highItems = inv.items.filter(item => item.product_variant);
        const lowItemsList = inv.items.filter(item => item.item);

        setItems(highItems.map(i => ({
  product_variant: i.product_variant,

  // ⭐ ADD THESE
  ac_type_name: i.ac_type_name,
  ac_sub_type_name: i.ac_sub_type_name,
  brand_name: i.brand_name,
  model_no: i.model_no,
  variant_sku: i.variant_sku,

  description: i.description,
  hsn_sac: i.hsn_sac,
  quantity: i.quantity,
  unit: i.unit,
  rate: i.rate,
  gst_percent: i.gst_percent
})));

       setLowItems(lowItemsList.map(i => ({
  item: i.item,

  // ⭐ ADD THIS
  item_code: i.item_code,

  description: i.description,
  hsn_sac: i.hsn_sac,
  quantity: i.quantity,
  unit: i.unit,
  rate: i.rate,
  gst_percent: i.gst_percent
})));
      });
  }, [id]);

  // ================= CUSTOMER SEARCH =================
  const handlePhone = async (e) => {
    const phone = e.target.value;
    setCustomer(prev => ({ ...prev, phone }));

    if (phone.length >= 10) {
      const res = await api.get(`lead/customer/?search=${phone}`);
      const data = normalize(res.data);

      if (data.length > 0) {
        const cust = data[0];
        setCustomer({
          phone,
          name: cust.name,
          id: cust.id,
          address: cust.address || "",
          gstin: cust.gstin || "",
          state: cust.state || "",
          state_code: cust.state_code || ""
        });

        // Auto-fill buyer snapshot
        setBuyerSnapshot({
          buyer_name: cust.name,
          buyer_address: cust.address || "",
          buyer_gstin: cust.gstin || "",
          buyer_state: cust.state || "",
          buyer_state_code: cust.state_code || ""
        });

        // Auto-fill ship to if same as buyer
        if (shipTo.same_as_buyer) {
          setShipTo(prev => ({
            ...prev,
            ship_to_address: cust.address || ""
          }));
        }
      }
    }
  };

  
 



  // ================= HANDLE SHIP TO TOGGLE =================
  const handleShipToToggle = (e) => {
    const same = e.target.checked;
    setShipTo({
      same_as_buyer: same,
      ship_to_address: same ? buyerSnapshot.buyer_address : ""
    });
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setCustomer({
      phone: "",
      name: "",
      id: "",
      address: "",
      gstin: "",
      state: "",
      state_code: ""
    });

    setForm({
      invoice_no: "INV-" + Date.now(),
      invoice_date: new Date().toISOString().split('T')[0],
      delivery_note: "",
      supplier_ref: "",
      buyer_order_no: "",
      destination: "",
      terms_of_delivery: "",
      site_name: "",
      work_description: "",
      gst_type: "CGST_SGST"
    });

    setBuyerSnapshot({
      buyer_name: "",
      buyer_address: "",
      buyer_gstin: "",
      buyer_state: "",
      buyer_state_code: ""
    });

    setShipTo({
      ship_to_address: "",
      same_as_buyer: true
    });

    if (companyProfile) {
      setCompanySnapshot({
        company_name: companyProfile.name || "",
        company_address: companyProfile.address || "",
        company_gstin: companyProfile.gstin || "",
        company_pan: companyProfile.pan || "",
        bank_name: companyProfile.bank_name || "",
        account_no: companyProfile.account_no || "",
        ifsc_code: companyProfile.ifsc_code || "",
        branch: companyProfile.branch || "",
        declaration: companyProfile.declaration || ""
      });
    }

    setItems([{
      acType: "",
      subType: "",
      brand: "",
      model: "",
      product_variant: "",
      description: "",
      hsn_sac: "",
      quantity: 1,
      unit: "NOS",
      rate: 0,
      gst_percent: 18
    }]);

    setLowItems([{
      material_type_id: "",
      item_type_id: "",
      feature_type_id: "",
      item_class_id: "",
      item: "",
      description: "",
      hsn_sac: "",
      quantity: 1,
      unit: "NOS",
      rate: 0,
      gst_percent: 18
    }]);

   
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {

    // Combine high and low items
    const allItems = [
      ...items.map(i => ({
        product_variant: i.product_variant ? Number(i.product_variant) : null,
        item: null,
        description: i.description,
        hsn_sac: i.hsn_sac,
        gst_percent: Number(i.gst_percent),
        quantity: Number(i.quantity),
        unit: i.unit,
        rate: Number(i.rate)
      })),
      ...lowItems.map(l => ({
        product_variant: null,
        item: l.item ? Number(l.item) : null,
        description: l.description,
        hsn_sac: l.hsn_sac,
        gst_percent: Number(l.gst_percent),
        quantity: Number(l.quantity),
        unit: l.unit,
        rate: Number(l.rate)
      }))
    ].filter(item => item.description || item.product_variant || item.item);

    const payload = {
      invoice_no: form.invoice_no,
      customer: customer.id ? Number(customer.id) : null,

      invoice_date: form.invoice_date,

      // Buyer snapshot
      buyer_name: buyerSnapshot.buyer_name,
      buyer_address: buyerSnapshot.buyer_address,
      buyer_gstin: buyerSnapshot.buyer_gstin,
      buyer_state: buyerSnapshot.buyer_state,
      buyer_state_code: buyerSnapshot.buyer_state_code,

      // Ship to
      ship_to_address: shipTo.ship_to_address,

      // Company snapshot
      company_name: companySnapshot.company_name,
      company_address: companySnapshot.company_address,
      company_gstin: companySnapshot.company_gstin,
      company_pan: companySnapshot.company_pan,
      company_email: companySnapshot.company_email,
      company_msme_number: companySnapshot.company_msme_number,
      bank_name: companySnapshot.bank_name,
      account_no: companySnapshot.account_no,
      ifsc_code: companySnapshot.ifsc_code,
      branch: companySnapshot.branch,
      declaration: companySnapshot.declaration,

      // Header fields
      delivery_note: form.delivery_note,
      supplier_ref: form.supplier_ref,
      buyer_order_no: form.buyer_order_no,
      destination: form.destination,
      terms_of_delivery: form.terms_of_delivery,
      site_name: form.site_name,
      work_description: form.work_description,

      // GST Type
      gst_type: form.gst_type,

      // Items
      items: allItems
    };

    try {
      if (isEdit) {
        await api.put(`invoice/invoice/${id}/`, payload);
        alert("Invoice Updated Successfully ✅");
      } else {
        await api.post("invoice/invoice/", payload);
        alert("Invoice Created Successfully ✅");
      }

      resetForm();
      if (onBack) onBack();

    } catch (err) {
      console.log(err.response?.data);
      alert("Error saving invoice ❌");
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
  {isEdit ? "Edit Invoice" : "Create New Invoice"}
</h2>

{/* ================= INVOICE HEADER ================= */}
<div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
  <div>
    <label className="text-sm font-medium">Invoice Number</label>
    <input
      className="w-full border rounded-lg px-3 py-2 bg-gray-100"
      value={form.invoice_no}
      readOnly
    />
  </div>

  <div>
    <label className="text-sm font-medium">Invoice Date</label>
    <input
      type="date"
      className="w-full border rounded-lg px-3 py-2"
      value={form.invoice_date}
      onChange={(e)=>setForm({...form,invoice_date:e.target.value})}
    />
  </div>
</div>

{/* ================= CUSTOMER DETAILS ================= */}
<div className="space-y-3">
<h3 className="text-lg font-semibold">Customer Details</h3>

<div className="grid md:grid-cols-2 gap-4">

<input
className="w-full px-3 py-2 rounded-md border border-slate-300"
placeholder="Customer Phone"
value={customer.phone}
onChange={handlePhone}
/>

<input
className="w-full px-3 py-2 rounded-md border border-slate-300 bg-gray-100"
value={customer.name}
readOnly
/>

</div>
</div>

{/* ================= BUYER INFO ================= */}
<div className="space-y-3">
<h3 className="text-lg font-semibold">Buyer Information</h3>

<textarea
className="w-full border rounded-lg px-3 py-2"
rows="2"
value={buyerSnapshot.buyer_address}
onChange={(e)=>setBuyerSnapshot({...buyerSnapshot,buyer_address:e.target.value})}
/>

<div className="grid md:grid-cols-2 gap-4">

<input
className="border rounded-lg px-3 py-2"
placeholder="GSTIN"
value={buyerSnapshot.buyer_gstin}
onChange={(e)=>setBuyerSnapshot({...buyerSnapshot,buyer_gstin:e.target.value})}
/>

<div className="relative">
<input
  className="border rounded-lg px-3 py-2 w-full"
  placeholder="State"
  value={stateSearch || buyerSnapshot.buyer_state}
  onChange={(e)=>{
    handleStateChange(e.target.value);
    setShowStateList(true);
  }}
  onFocus={()=>setShowStateList(true)}
/>

{showStateList && filteredStates.length > 0 && (
  <div className="absolute z-20 bg-white border w-full max-h-40 overflow-y-auto rounded-md shadow">
    {filteredStates.map((s,i)=>(
      <div
        key={i}
        className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
        onClick={()=>{
          setStateSearch(s.name);
          setBuyerSnapshot(prev=>({
            ...prev,
            buyer_state:s.name,
            buyer_state_code:s.code
          }));
          setShowStateList(false);
        }}
      >
        {s.name}
      </div>
    ))}
  </div>
)}
</div>

<input
className="border rounded-lg px-3 py-2"
placeholder="State Code"
value={buyerSnapshot.buyer_state_code}
onChange={(e)=>setBuyerSnapshot({...buyerSnapshot,buyer_state_code:e.target.value})}
/>

</div>
</div>

{/* ================= SHIP TO ================= */}
<div className="space-y-3">
<label className="flex items-center gap-2">
<input type="checkbox" checked={shipTo.same_as_buyer} onChange={handleShipToToggle}/>
Same as Buyer Address
</label>

<textarea
className="w-full border rounded-lg px-3 py-2"
rows="2"
value={shipTo.ship_to_address}
onChange={(e)=>setShipTo({ship_to_address:e.target.value,same_as_buyer:false})}
disabled={shipTo.same_as_buyer}
/>
</div>

{/* ================= GST TYPE ================= */}
<div className="flex items-center gap-3">
<label className="font-medium">GST Type :</label>
<select
className="border rounded-md px-3 py-2"
value={form.gst_type}
onChange={(e)=>setForm({...form,gst_type:e.target.value})}
>
<option value="CGST_SGST">CGST + SGST</option>
<option value="IGST">IGST</option>
</select>
</div>

{/* ================= HIGH SIDE PRODUCTS (FULL ORIGINAL) ================= */}
{/* ================= HIGH SIDE PRODUCTS ================= */}

<ItemSelectionEngine
 baseApi={BASE_API}
 authToken={localStorage.getItem("access")}
 items={items}
 setItems={setItems}
 lowItems={lowItems}
 setLowItems={setLowItems}
 mode="invoice"
/>

{/* ================= ADDITIONAL INFO ================= */}
<div className="space-y-3">
<h3 className="text-lg font-semibold">Additional Information</h3>

<div className="grid md:grid-cols-3 gap-4">

<input className="border rounded-lg px-3 py-2" placeholder="Delivery Note"
value={form.delivery_note}
onChange={(e)=>setForm({...form,delivery_note:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Supplier Ref"
value={form.supplier_ref}
onChange={(e)=>setForm({...form,supplier_ref:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Buyer Order No"
value={form.buyer_order_no}
onChange={(e)=>setForm({...form,buyer_order_no:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Destination"
value={form.destination}
onChange={(e)=>setForm({...form,destination:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Terms of Delivery"
value={form.terms_of_delivery}
onChange={(e)=>setForm({...form,terms_of_delivery:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Site Name"
value={form.site_name}
onChange={(e)=>setForm({...form,site_name:e.target.value})}/>

</div>

<textarea
className="w-full border rounded-lg px-3 py-2"
rows="3"
placeholder="Work Description"
value={form.work_description}
onChange={(e)=>setForm({...form,work_description:e.target.value})}
/>
</div>

{/* ================= COMPANY DETAILS FULL ================= */}
<div className="space-y-3">
<h3 className="text-lg font-semibold">Company Details</h3>

<div className="grid md:grid-cols-3 gap-4">

<input className="border rounded-lg px-3 py-2" placeholder="Company Name"
value={companySnapshot.company_name}
onChange={(e)=>setCompanySnapshot({...companySnapshot,company_name:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Company Address"
value={companySnapshot.company_address}
onChange={(e)=>setCompanySnapshot({...companySnapshot,company_address:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Company GSTIN"
value={companySnapshot.company_gstin}
onChange={(e)=>setCompanySnapshot({...companySnapshot,company_gstin:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Company PAN"
value={companySnapshot.company_pan}
onChange={(e)=>setCompanySnapshot({...companySnapshot,company_pan:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Company Email"
value={companySnapshot.company_email}
onChange={(e)=>setCompanySnapshot({...companySnapshot,company_email:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="MSME Number"
value={companySnapshot.company_msme_number}
onChange={(e)=>setCompanySnapshot({...companySnapshot,company_msme_number:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Bank Name"
value={companySnapshot.bank_name}
onChange={(e)=>setCompanySnapshot({...companySnapshot,bank_name:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Account No"
value={companySnapshot.account_no}
onChange={(e)=>setCompanySnapshot({...companySnapshot,account_no:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="IFSC Code"
value={companySnapshot.ifsc_code}
onChange={(e)=>setCompanySnapshot({...companySnapshot,ifsc_code:e.target.value})}/>

<input className="border rounded-lg px-3 py-2" placeholder="Branch"
value={companySnapshot.branch}
onChange={(e)=>setCompanySnapshot({...companySnapshot,branch:e.target.value})}/>

</div>

<textarea
className="w-full border rounded-lg px-3 py-2"
placeholder="Declaration"
value={companySnapshot.declaration}
onChange={(e)=>setCompanySnapshot({...companySnapshot,declaration:e.target.value})}
/>
</div>

{/* ================= SUBMIT ================= */}
<div className="flex justify-end">
<button
className="px-5 py-2 bg-blue-600 text-white rounded-md"
onClick={handleSubmit}
>
{isEdit ? "Update Invoice" : "Save Invoice"}
</button>
</div>

</div>
</div>
);
}