import { useEffect, useState } from "react";
import axios from "axios";
import ItemSelectionEngine from "../ItemSelectionEngine";
import TermsMultiSelect from "../TermsMultiSelect";
import useTermTypes from "../../hooks/useTermTypes";

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

  // Get token for API calls
  const token = localStorage.getItem("access") || localStorage.getItem("access_token");

  // Term types are needed to get the correct terms for payment and delivery
  const { getOrCreateTermTypeId } = useTermTypes({ baseApi: BASE_API, token });
  const [paymentTypeId, setPaymentTypeId] = useState(null);
  const [deliveryTypeId, setDeliveryTypeId] = useState(null);

  const [subject, setSubject] = useState("");
  //branch
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  //site
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");

  // ================= HIGH SIDE MASTER =================


  const [gstType, setGstType] = useState("CGST_SGST");

  const [thankNote, setThankNote] = useState("");

  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    id: ""
  });

  // ================= HIGH SIDE ITEMS =================
  const [items, setItems] = useState([]);

  // ================= LOW SIDE ITEMS =================
  const [lowItems, setLowItems] = useState([]);

  // ================= TERMS AND CONDITIONS =================
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);


  // ================= LOAD MASTERS =================

  // Initialize term types when component opens
  useEffect(() => {
    const initTypes = async () => {
      const paymentId = await getOrCreateTermTypeId("Quotation Payment");
      const deliveryId = await getOrCreateTermTypeId("Quotation Delivery");

      setPaymentTypeId(paymentId);
      setDeliveryTypeId(deliveryId);
    };

    initTypes();
  }, []);


  // ================= EDIT LOAD =================
  useEffect(() => {
    if (!isEdit) return;

    const loadQuotationData = async () => {
      try {
        const res = await api.get(`quotation/quotation/${id}/`);
        const q = res.data;

        setCustomer({
          phone: q.customer_contact,
          name: q.customer_name,
          id: q.customer
        });

        setSubject(q.subject || "");
        setSelectedBranch(q.branch || "");
        setSelectedSite(q.site || "");
        setThankNote(q.thank_you_note || "");

        const active = q.versions.find(v => v.is_active);
        setGstType(active.gst_type);

        // Extract terms and conditions
        const paymentTermsData = q.terms_conditions_details
          ?.filter(t => t.terms_condition_type_name === "Quotation Payment")
          .map(t => t.id) || [];

        const deliveryTermsData = q.terms_conditions_details
          ?.filter(t => t.terms_condition_type_name === "Quotation Delivery")
          .map(t => t.id) || [];

        setPaymentTerms(paymentTermsData);
        setDeliveryTerms(deliveryTermsData);

        setItems(
          active.high_side_items.map(i => ({
            product_variant: i.product_variant,
            unit: i.unit || "NOS",
            ac_type_name: i.ac_type_name,
            ac_sub_type_name: i.ac_sub_type_name,
            brand_name: i.brand_name,
            model_no: i.model_no,
            variant_sku: i.variant_sku,
            quantity: i.quantity,
            unit_price: i.unit_price,
            gst_percent: i.gst_percent,
            mathadi_charges: i.mathadi_charges || 0,
            transportation_charges: i.transportation_charges || 0,
            description: i.description || ""
          }))
        );

        setLowItems(
          active.low_side_items.map(l => ({
            item: l.item,
            item_code: l.item_code,
            unit: l.unit || "NOS",
            quantity: l.quantity,
            gst_percent: l.gst_percent || 18,
            unit_price: l.unit_price,
            mathadi_charges: l.mathadi_charges || 0,
            description: l.description || ""
          }))
        );
      } catch (err) {
        console.log("Error loading quotation:", err);
      }
    };

    loadQuotationData();
  }, [id]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // Load branches
        const branchRes = await api.get("auth/branch/");
        const branchData = Array.isArray(branchRes.data) ? branchRes.data : branchRes.data?.results || [];
        setBranches(branchData);

        // Load sites
        const siteRes = await api.get("auth/site/");
        const siteData = Array.isArray(siteRes.data) ? siteRes.data : siteRes.data?.results || [];
        setSites(siteData);
      } catch (err) {
        console.log("Error loading master data:", err);
      }
    };

    loadMasterData();
  }, []);


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
          name: data[0].name,
          id: data[0].id
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

    setSubject("AC Quotation");
    setSelectedBranch("");
    setSelectedSite("");
    setThankNote("");
    setGstType("CGST_SGST");

    // Reset terms and conditions
    setPaymentTerms([]);
    setDeliveryTerms([]);

    setItems([
      {
        acType: "",
        subType: "",
        brand: "",
        model: "",
        product_variant: "",
        quantity: 1,
        unit_price: 0,
        gst_percent: 18,
        mathadi_charges: 0,
        transportation_charges: 0
      }
    ]);

    setLowItems([
      {
        material_type_id: "",
        item_type_id: "",
        feature_type_id: "",
        item_class_id: "",
        item: "",
        quantity: 1,
        unit_price: 0,
        gst_percent: 18,
        mathadi_charges: 0
      }
    ]);

    // optional but recommended

  };


  // ================= SUBMIT =================
  const handleSubmit = async () => {

    const payload = {

      customer: Number(customer.id),
      subject: subject,
      branch: selectedBranch ? Number(selectedBranch) : null,
      site: selectedSite ? Number(selectedSite) : null,
      thank_you_note: thankNote,

      // Add terms and conditions
      terms_conditions: [
        ...(paymentTerms || []).map(t => t.id || t),
        ...(deliveryTerms || []).map(t => t.id || t)
      ],

      versions: [{
        gst_type: gstType,


        high_side_items: items.map(i => ({
          product_variant: Number(i.product_variant),
          quantity: Number(i.quantity),
          unit: i.unit,
          description: i.description || "",
          unit_price: Number(i.unit_price),
          gst_percent: Number(i.gst_percent),
          mathadi_charges: Number(i.mathadi_charges),
          transportation_charges: Number(i.transportation_charges)
        })),

        low_side_items: lowItems.map(l => ({
          item: Number(l.item),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          description: l.description || "",
          unit: l.unit,
          gst_percent: Number(l.gst_percent),
          mathadi_charges: Number(l.mathadi_charges)
        }))
      }]
    };

    try {

      if (isEdit) {
        await api.put(`quotation/quotation/${id}/`, payload);
      } else {
        await api.post("quotation/quotation/", payload);
      }

      alert("Quotation Saved Successfully ✅");

      resetForm();

      // ⭐ CLOSE MODAL & RETURN TO LIST
      onBack && onBack();

    } catch (err) {
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
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <select
            className="w-full px-3 py-2 rounded-md border border-slate-300"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            <option value="">Select Site</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>

          <select
            className="w-full px-3 py-2 rounded-md border border-slate-300"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">Select Branch</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <select
            className="w-full px-3 py-2 rounded-md border border-slate-300"
            value={gstType}
            onChange={(e) => setGstType(e.target.value)}
          >
            <option value="CGST_SGST">CGST + SGST</option>
            <option value="IGST">IGST</option>
          </select>
        </div>

        <textarea
          className="w-full px-3 py-2 rounded-md border border-slate-300"
          placeholder="Thank You Note"
          value={thankNote}
          onChange={(e) => setThankNote(e.target.value)}
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

        {/* ================= TERMS AND CONDITIONS ================= */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Terms & Conditions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms <span className="text-red-500">*</span>
              </label>
              <TermsMultiSelect
                value={paymentTerms}
                onChange={setPaymentTerms}
                termsType={paymentTypeId}
                baseApi={BASE_API}
                token={token}
              />
            </div>

            {/* Delivery Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Terms <span className="text-red-500">*</span>
              </label>
              <TermsMultiSelect
                value={deliveryTerms}
                onChange={setDeliveryTerms}
                termsType={deliveryTypeId}
                baseApi={BASE_API}
                token={token}
              />
            </div>
          </div>
        </div>

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
