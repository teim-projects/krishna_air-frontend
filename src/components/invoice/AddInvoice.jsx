import { useEffect, useState } from "react";
import axios from "axios";

const BASE_API =
  import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${BASE_API}/api/`,
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

export default function AddInvoice({ id, onBack }) {

  const isEdit = !!id;

  // ================= COMPANY PROFILE =================
  const [companyProfile, setCompanyProfile] = useState(null);

  // ================= HIGH SIDE MASTER =================
  const [acTypes, setAcTypes] = useState([]);
  const [subTypes, setSubTypes] = useState({});
  const [brands, setBrands] = useState({});
  const [models, setModels] = useState({});
  const [variants, setVariants] = useState({});

  // ================= LOW SIDE MASTER =================
  const [materialTypes, setMaterialTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [featureTypes, setFeatureTypes] = useState([]);
  const [itemClasses, setItemClasses] = useState([]);
  const [lowItemsMaster, setLowItemsMaster] = useState({});

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
  const [items, setItems] = useState([
    {
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
    }
  ]);

  // ================= LOW SIDE ITEMS =================
  const [lowItems, setLowItems] = useState([
    {
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
    }
  ]);

  // ================= LOAD MASTERS =================
  useEffect(() => {
    // Load High Side Masters
    api.get("product/actype/")
      .then(res => setAcTypes(normalize(res.data)));

    // Load Low Side Masters
    api.get("product/material-type/")
      .then(res => setMaterialTypes(normalize(res.data)));

    api.get("product/item-type/")
      .then(res => setItemTypes(normalize(res.data)));

    api.get("product/feature-type/")
      .then(res => setFeatureTypes(normalize(res.data)));

    api.get("product/item-class/")
      .then(res => setItemClasses(normalize(res.data)));

    // Load Company Profile
    
  }, []);

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
          acType: "",
          subType: "",
          brand: "",
          model: "",
          product_variant: i.product_variant,
          description: i.description,
          hsn_sac: i.hsn_sac,
          quantity: i.quantity,
          unit: i.unit,
          rate: i.rate,
          gst_percent: i.gst_percent
        })));

        setLowItems(lowItemsList.map(i => ({
          material_type_id: "",
          item_type_id: "",
          feature_type_id: "",
          item_class_id: "",
          item: i.item,
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

    // Auto-fill variant details
    if (normalize(res.data).length > 0) {
      const variant = normalize(res.data)[0];
      // You might want to fetch more details about the variant
      updateItem(index, "description", variant.description || "");
      updateItem(index, "hsn_sac", variant.hsn_sac || "");
      updateItem(index, "rate", variant.selling_price || 0);
      updateItem(index, "gst_percent", variant.gst_percent || 18);
    }
  };

  // ================= LOW SIDE ITEM LOAD =================
  const loadLowSideItems = async (index, data) => {
    const res = await api.get(
      `product/item/?material_type_id=${data.material_type_id}&item_type_id=${data.item_type_id}&feature_type_id=${data.feature_type_id}&item_class_id=${data.item_class_id}`
    );
    setLowItemsMaster(prev => ({ ...prev, [index]: normalize(res.data) }));
  };

  // ================= UPDATE HIGH SIDE ITEM =================
  const updateItem = (index, field, value) => {

  const copy = [...items];
  copy[index][field] = value;

  if (field === "acType") {
    copy[index].subType = "";
    copy[index].brand = "";
    copy[index].model = "";
    copy[index].product_variant = "";
    loadSubTypes(index, value);
  }

  if (field === "subType") {
    copy[index].brand = "";
    copy[index].model = "";
    copy[index].product_variant = "";
    loadBrands(index, value);
  }

  if (field === "brand") {
    copy[index].model = "";
    copy[index].product_variant = "";
    loadModels(index, value);
  }

  if (field === "model") {
    copy[index].product_variant = "";
    loadVariants(index, value);
  }

  // ✅ STEP 2 GOES HERE
  if(field === "product_variant" && value){

    const selected =
      (variants[index] || []).find(v => v.id == value);

    if(selected){
      copy[index].description = selected.description || "";
      copy[index].hsn_sac = selected.hsn_sac || "";
      copy[index].rate = selected.selling_price || 0;
      copy[index].gst_percent = selected.gst_percent || 18;
    }
  }

  setItems(copy);
};


  // ================= UPDATE LOW SIDE ITEM =================
  const updateLowItem = (index, field, value) => {
    const copy = [...lowItems];
    copy[index][field] = value;

    if (
      copy[index].material_type_id &&
      copy[index].item_type_id &&
      copy[index].feature_type_id &&
      copy[index].item_class_id
    ) {
      loadLowSideItems(index, copy[index]);
    }

    // Auto-fill item details when item is selected
    if (field === "item" && value) {
      const selectedItem = (lowItemsMaster[index] || []).find(i => i.id == value);
      if (selectedItem) {
        copy[index].description = selectedItem.description || "";
        copy[index].hsn_sac = selectedItem.hsn_sac || "";
        copy[index].rate = selectedItem.selling_price || 0;
        copy[index].gst_percent = selectedItem.gst_percent || 18;
      }
    }

    setLowItems(copy);
  };

  // ================= ADD ROWS =================
  const addHighRow = () => {
    setItems([...items, {
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
  };

  const addLowRow = () => {
    setLowItems([...lowItems, {
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

  // ================= REMOVE ROWS =================
  const removeHighRow = (index) => {
    if (items.length > 1) {
      const copy = items.filter((_, i) => i !== index);
      setItems(copy);
    }
  };

  const removeLowRow = (index) => {
    if (lowItems.length > 1) {
      const copy = lowItems.filter((_, i) => i !== index);
      setLowItems(copy);
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

    setSubTypes({});
    setBrands({});
    setModels({});
    setVariants({});
    setLowItemsMaster({});
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            {isEdit ? "Edit Invoice" : "Create New Invoice"}
          </h2>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>

        {/* Invoice Number and Date */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              value={form.invoice_no}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
            />
          </div>
        </div>

        {/* Customer Search */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700">Customer Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter customer phone"
                value={customer.phone}
                onChange={handlePhone}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                value={customer.name}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Buyer Information */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700">Buyer Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows="2"
                value={buyerSnapshot.buyer_address}
                onChange={(e) => setBuyerSnapshot({ ...buyerSnapshot, buyer_address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={buyerSnapshot.buyer_gstin}
                onChange={(e) => setBuyerSnapshot({ ...buyerSnapshot, buyer_gstin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={buyerSnapshot.buyer_state}
                onChange={(e) => setBuyerSnapshot({ ...buyerSnapshot, buyer_state: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={buyerSnapshot.buyer_state_code}
                onChange={(e) => setBuyerSnapshot({ ...buyerSnapshot, buyer_state_code: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Ship To */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-700">Ship To Address</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shipTo.same_as_buyer}
                onChange={handleShipToToggle}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Same as Buyer Address</span>
            </label>
          </div>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            rows="2"
            value={shipTo.ship_to_address}
            onChange={(e) => setShipTo({ ship_to_address: e.target.value, same_as_buyer: false })}
            disabled={shipTo.same_as_buyer}
          />
        </div>

        {/* GST Type */}
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">GST Type :</label>
          <select
            className="border rounded-lg px-3 py-2"
            value={form.gst_type}
            onChange={(e) => setForm({ ...form, gst_type: e.target.value })}
          >
            <option value="CGST_SGST">CGST + SGST</option>
            <option value="IGST">IGST</option>
          </select>
        </div>

        {/* HIGH SIDE PRODUCTS */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">High Side Products</h3>

          {items.map((item, index) => (
            <div key={index} className="border rounded-xl p-4 bg-gray-50 space-y-3 relative">

              {items.length > 1 && (
                <button
                  onClick={() => removeHighRow(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              )}

              {/* Product Selection Row */}
              <div className="grid md:grid-cols-5 gap-3">
                <select
                  className="border rounded-lg px-2 py-2"
                  value={item.acType}
                  onChange={(e) => updateItem(index, "acType", e.target.value)}
                >
                  <option value="">AC Type</option>
                  {acTypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                <select
                  className="border rounded-lg px-2 py-2"
                  disabled={!item.acType}
                  value={item.subType}
                  onChange={(e) => updateItem(index, "subType", e.target.value)}
                >
                  <option value="">SubType</option>
                  {(subTypes[index] || []).map(s =>
                    <option key={s.id} value={s.id}>{s.name}</option>
                  )}
                </select>

                <select
                  className="border rounded-lg px-2 py-2"
                  disabled={!item.subType}
                  value={item.brand}
                  onChange={(e) => updateItem(index, "brand", e.target.value)}
                >
                  <option value="">Brand</option>
                  {(brands[index] || []).map(b =>
                    <option key={b.id} value={b.id}>{b.name}</option>
                  )}
                </select>

                <select
                  className="border rounded-lg px-2 py-2"
                  disabled={!item.brand}
                  value={item.model}
                  onChange={(e) => updateItem(index, "model", e.target.value)}
                >
                  <option value="">Model</option>
                  {(models[index] || []).map(m =>
                    <option key={m.id} value={m.id}>{m.model_no}</option>
                  )}
                </select>

                <select
                  className="border rounded-lg px-2 py-2"
                  disabled={!item.model}
                  value={item.product_variant}
                  onChange={(e) => updateItem(index, "product_variant", e.target.value)}
                >
                  <option value="">Variant</option>
                  {(variants[index] || []).map(v =>
                    <option key={v.id} value={v.id}>{v.sku}</option>
                  )}
                </select>
              </div>

              {/* Item Details Row */}
              <div className="grid md:grid-cols-6 gap-3">
                <input
                  className="border rounded-lg px-2 py-2 md:col-span-2"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                />
                <input
                  className="border rounded-lg px-2 py-2"
                  placeholder="HSN/SAC"
                  value={item.hsn_sac}
                  onChange={(e) => updateItem(index, "hsn_sac", e.target.value)}
                />
                <input
                  type="number"
                  className="border rounded-lg px-2 py-2"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                />
                <input
                  type="text"
                  className="border rounded-lg px-2 py-2"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => updateItem(index, "unit", e.target.value)}
                />
                <input
                  type="number"
                  className="border rounded-lg px-2 py-2"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => updateItem(index, "rate", e.target.value)}
                />
                <input
                  type="number"
                  className="border rounded-lg px-2 py-2"
                  placeholder="GST%"
                  value={item.gst_percent}
                  onChange={(e) => updateItem(index, "gst_percent", e.target.value)}
                />
              </div>

              {/* Line Total Display */}
              <div className="text-right text-sm text-gray-600">
                Line Total: ₹{(item.quantity * item.rate).toFixed(2)}
              </div>
            </div>
          ))}

          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            onClick={addHighRow}
          >
            + Add Product
          </button>
        </div>

        {/* LOW SIDE ITEMS */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Low Side Items</h3>

          {lowItems.map((item, index) => (
            <div key={index} className="border rounded-xl p-4 bg-gray-50 space-y-3 relative">

              {lowItems.length > 1 && (
                <button
                  onClick={() => removeLowRow(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              )}

              {/* Item Selection Row */}
              <div className="grid md:grid-cols-5 gap-3">
                <select
                  className="border rounded-lg px-2 py-2"
                  value={item.material_type_id}
                  onChange={(e) => updateLowItem(index, "material_type_id", e.target.value)}
                >
                  <option value="">Material Type</option>
                  {materialTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <select
                  className="border rounded-lg px-2 py-2"
                  value={item.item_type_id}
                  onChange={(e) => updateLowItem(index, "item_type_id", e.target.value)}
                >
                  <option value="">Item Type</option>
                  {itemTypes.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>

                <select
                  className="border rounded-lg px-2 py-2"
                  value={item.feature_type_id}
                  onChange={(e) => updateLowItem(index, "feature_type_id", e.target.value)}
                >
                  <option value="">Feature Type</option>
                  {featureTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>

                <select
                  className="border rounded-lg px-2 py-2"
                  value={item.item_class_id}
                  onChange={(e) => updateLowItem(index, "item_class_id", e.target.value)}
                >
                  <option value="">Item Class</option>
                  {itemClasses.map(ic => <option key={ic.id} value={ic.id}>{ic.name}</option>)}
                </select>

                <select
                  className="border rounded-lg px-2 py-2"
                  value={item.item}
                  onChange={(e) => updateLowItem(index, "item", e.target.value)}
                >
                  <option value="">Select Item</option>
                  {(lowItemsMaster[index] || []).map(i =>
                    <option key={i.id} value={i.id}>{i.item_code}</option>
                  )}
                </select>
              </div>

              {/* Item Details Row */}
              <div className="grid md:grid-cols-6 gap-3">
                <input
                  className="border rounded-lg px-2 py-2 md:col-span-2"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLowItem(index, "description", e.target.value)}
                />
                <input
                  className="border rounded-lg px-2 py-2"
                  placeholder="HSN/SAC"
                  value={item.hsn_sac}
                  onChange={(e) => updateLowItem(index, "hsn_sac", e.target.value)}
                />
                <input
                  type="number"
                  className="border rounded-lg px-2 py-2"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateLowItem(index, "quantity", e.target.value)}
                />
                <input
                   type="text"
                  className="border rounded-lg px-2 py-2"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => updateLowItem(index, "unit", e.target.value)}
                />
                <input
                  type="number"
                  className="border rounded-lg px-2 py-2"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => updateLowItem(index, "rate", e.target.value)}
                />
                <input
                  type="number"
                  className="border rounded-lg px-2 py-2"
                  placeholder="GST%"
                  value={item.gst_percent}
                  onChange={(e) => updateLowItem(index, "gst_percent", e.target.value)}
                />
              </div>

              {/* Line Total Display */}
              <div className="text-right text-sm text-gray-600">
                Line Total: ₹{(item.quantity * item.rate).toFixed(2)}
              </div>
            </div>
          ))}

          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            onClick={addLowRow}
          >
            + Add Low Item
          </button>
        </div>

        {/* Header Fields */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700">Additional Information</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Delivery Note"
              value={form.delivery_note}
              onChange={(e) => setForm({ ...form, delivery_note: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Supplier Ref"
              value={form.supplier_ref}
              onChange={(e) => setForm({ ...form, supplier_ref: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Buyer Order No"
              value={form.buyer_order_no}
              onChange={(e) => setForm({ ...form, buyer_order_no: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Destination"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Terms of Delivery"
              value={form.terms_of_delivery}
              onChange={(e) => setForm({ ...form, terms_of_delivery: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Site Name"
              value={form.site_name}
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            />
          </div>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Work Description"
            rows="3"
            value={form.work_description}
            onChange={(e) => setForm({ ...form, work_description: e.target.value })}
          />
        </div>

        {/* Company Bank Details (Read-only) */}
        {/* Company Details */}
<div className="space-y-3">
  <h3 className="text-lg font-semibold text-gray-700">Company Details</h3>

  <div className="grid md:grid-cols-3 gap-4">

    <input
      className="border rounded-lg px-3 py-2"
      placeholder="Company Name"
      value={companySnapshot.company_name}
      onChange={(e)=>setCompanySnapshot({
        ...companySnapshot,
        company_name:e.target.value
      })}
    />

    <input
      className="border rounded-lg px-3 py-2"
      placeholder="Company Address"
      value={companySnapshot.company_address}
      onChange={(e)=>setCompanySnapshot({
        ...companySnapshot,
        company_address:e.target.value
      })}
    />

    <input
      className="border rounded-lg px-3 py-2"
      placeholder="Company GSTIN"
      value={companySnapshot.company_gstin}
      onChange={(e)=>setCompanySnapshot({
        ...companySnapshot,
        company_gstin:e.target.value
      })}
    />

    <input
      className="border rounded-lg px-3 py-2"
      placeholder="Company PAN"
      value={companySnapshot.company_pan}
      onChange={(e)=>setCompanySnapshot({
        ...companySnapshot,
        company_pan:e.target.value
      })}
    />

    <input
  className="border rounded-lg px-3 py-2"
  placeholder="Company Email"
  value={companySnapshot.company_email}
  onChange={(e)=>setCompanySnapshot({
    ...companySnapshot,
    company_email:e.target.value
  })}
/>

<input
  className="border rounded-lg px-3 py-2"
  placeholder="MSME Number"
  value={companySnapshot.company_msme_number}
  onChange={(e)=>setCompanySnapshot({
    ...companySnapshot,
    company_msme_number:e.target.value
  })}
/>


    <input
      className="border rounded-lg px-3 py-2"
      placeholder="Bank Name"
      value={companySnapshot.bank_name}
      onChange={(e)=>setCompanySnapshot({
        ...companySnapshot,
        bank_name:e.target.value
      })}
    />

    <input
      className="border rounded-lg px-3 py-2"
      placeholder="Account No"
      value={companySnapshot.account_no}
      onChange={(e)=>setCompanySnapshot({
        ...companySnapshot,
        account_no:e.target.value
      })}
    />

    <input
      className="border rounded-lg px-3 py-2"
      placeholder="IFSC Code"
      value={companySnapshot.ifsc_code}
      onChange={(e)=>setCompanySnapshot({
        ...companySnapshot,
        ifsc_code:e.target.value
      })}
    />

    <input
      className="border rounded-lg px-3 py-2"
      placeholder="Branch"
      value={companySnapshot.branch}
      onChange={(e)=>setCompanySnapshot({
        ...companySnapshot,
        branch:e.target.value
      })}
    />

  </div>

  <textarea
    className="w-full border rounded-lg px-3 py-2"
    placeholder="Declaration"
    value={companySnapshot.declaration}
    onChange={(e)=>setCompanySnapshot({
      ...companySnapshot,
      declaration:e.target.value
    })}
  />
</div>



        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg"
            onClick={handleSubmit}
          >
            {isEdit ? "Update Invoice" : "Save Invoice"}
          </button>
        </div>

      </div>
    </div>
  );
}