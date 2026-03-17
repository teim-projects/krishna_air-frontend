import { useEffect, useState } from "react";
import axios from "axios";
import ItemSelectionEngine from "../ItemSelectionEngine";
import TermsMultiSelect from "../TermsMultiSelect";
import useTermTypes from "../../hooks/useTermTypes";
import ReusableForm from "../Form";
import Swal from "sweetalert2";

const BASE_API =
  import.meta.env.VITE_BASE_API_URL;

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
  const [validityTypeId, setValidityTypeId] = useState(null);
  const [warrantyTypeId, setWarrantyTypeId] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    customer_phone: "",
    customer_name: "",
    customer_id: "",
    subject: "",
    branch: "",
    site: "",
    gst_type: "CGST_SGST",
    thank_you_note: ""
  });

  //branch and site data
  const [branches, setBranches] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= HIGH SIDE ITEMS =================
  const [items, setItems] = useState([]);

  // ================= LOW SIDE ITEMS =================
  const [lowItems, setLowItems] = useState([]);

  // ================= TERMS AND CONDITIONS =================
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [validityTerms, setValidityTerms] = useState([]);
  const [warrantyTerms, setWarrantyTerms] = useState([]);


  // ================= LOAD MASTERS =================

  // Initialize term types when component opens
  useEffect(() => {
    const initTypes = async () => {
      const paymentId = await getOrCreateTermTypeId("Quotation Payment", "Terms of Payment");
      const validityId = await getOrCreateTermTypeId("Quotation Validity", "Validity Terms");
      const warrantyId = await getOrCreateTermTypeId("Quotation Warranty", "Warranty Terms");
      
      setPaymentTypeId(paymentId);
      setValidityTypeId(validityId);
      setWarrantyTypeId(warrantyId);
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

        setFormData({
          customer_phone: q.customer_contact || "",
          customer_name: q.customer_name || "",
          customer_id: q.customer || "",
          subject: q.subject || "",
          branch: q.branch || "",
          site: q.site || "",
          thank_you_note: q.thank_you_note || "",
          gst_type: q.versions.find(v => v.is_active)?.gst_type || "CGST_SGST"
        });

        const paymentTermsData = q.terms_conditions_details
          ?.filter(t => t.terms_condition_type_name === "Quotation Payment")
          .map(t => t.id) || [];

        const validityTermsData = q.terms_conditions_details
          ?.filter(t => t.terms_condition_type_name === "Quotation Validity")
          .map(t => t.id) || [];

        const warrantyTermsData = q.terms_conditions_details
          ?.filter(t => t.terms_condition_type_name === "Quotation Warranty")
          .map(t => t.id) || [];

        setPaymentTerms(paymentTermsData);
        setValidityTerms(validityTermsData);
        setWarrantyTerms(warrantyTermsData);

        const active = q.versions.find(v => v.is_active);
        
        setItems(
          active.high_side_items.map(i => ({
            product_variant: i.product_variant,
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
  const handlePhoneSearch = async (phone) => {
    if (phone.length >= 10) {
      try {
        const res = await api.get(`lead/customer/?search=${phone}`);
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];

        if (data.length > 0) {
          setFormData(prev => ({
            ...prev,
            customer_phone: phone,
            customer_name: data[0].name,
            customer_id: data[0].id
          }));
        }
      } catch (err) {
        console.log("Error searching customer:", err);
      }
    }
  };

  // ================= HIGH SIDE LOADERS =================




  const resetForm = () => {
    setFormData({
      customer_phone: "",
      customer_name: "",
      customer_id: "",
      subject: "AC Quotation",
      branch: "",
      site: "",
      gst_type: "CGST_SGST",
      thank_you_note: ""
    });

    // Reset terms and conditions
    setPaymentTerms([]);
    setValidityTerms([]);
    setWarrantyTerms([]);

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
  };


  // ================= SUBMIT =================
  const handleSubmit = async (data) => {
    // Validation
    if (!data.customer_id) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please search and select a customer" });
      return;
    }
    if (!data.subject.trim()) {
      Swal.fire({ icon: "error", title: "Validation", text: "Subject is required" });
      return;
    }
    if (items.length === 0 && lowItems.length === 0) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please add at least one item" });
      return;
    }

    setLoading(true);
    
    const payload = {
      customer: Number(data.customer_id),
      subject: data.subject,
      branch: data.branch ? Number(data.branch) : null,
      site: data.site ? Number(data.site) : null,
      thank_you_note: data.thank_you_note,

      // Add terms and conditions
      terms_conditions: [
        ...(paymentTerms || []).map(t => t.id || t),
        ...(validityTerms || []).map(t => t.id || t),
        ...(warrantyTerms || []).map(t => t.id || t)
      ],

      versions: [{
        gst_type: data.gst_type,

        high_side_items: items.map(i => ({
          product_variant: Number(i.product_variant),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          gst_percent: Number(i.gst_percent),
          mathadi_charges: Number(i.mathadi_charges),
          transportation_charges: Number(i.transportation_charges)
        })),

        low_side_items: lowItems.map(l => ({
          item: Number(l.item),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
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

      Swal.fire({
        icon: "success",
        text: isEdit ? "Quotation updated successfully" : "Quotation saved successfully",
        timer: 1200,
        showConfirmButton: false
      });

      resetForm();
      onBack && onBack();

    } catch (err) {
      console.log(err.response?.data);
      Swal.fire({ icon: "error", title: "Error", text: "Error saving quotation" });
    } finally {
      setLoading(false);
    }
  };

  // ================= FIELD DEFINITIONS =================
  const fields = [
    {
      name: "customer_phone",
      label: "Customer Phone",
      type: "phone",
      required: true,
      gridCols: 1,
      placeholder: "Enter customer phone",
      component: ({ value, onChange }) => (
        <input
          type="text"
          className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={value}
          onChange={(e) => {
            const phone = e.target.value.replace(/\D/g, "");
            onChange(phone);
            handlePhoneSearch(phone);
          }}
          placeholder="Enter customer phone"
          maxLength={10}
        />
      )
    },
    {
      name: "customer_name",
      label: "Customer Name",
      type: "text",
      disabled: true,
      gridCols: 1,
      placeholder: "Auto-filled from phone search"
    },
    {
      name: "subject",
      label: "Subject",
      type: "text",
      required: true,
      gridCols: 1,
      placeholder: "Enter quotation subject"
    },
    {
      name: "site",
      label: "Site",
      type: "select",
      gridCols: 1,
      placeholder: "Select Site",
      options: sites.map(site => ({ value: site.id, label: site.name }))
    },
    {
      name: "branch",
      label: "Branch",
      type: "select",
      gridCols: 1,
      placeholder: "Select Branch",
      options: branches.map(branch => ({ value: branch.id, label: branch.name }))
    },
    {
      name: "gst_type",
      label: "GST Type",
      type: "select",
      required: true,
      gridCols: 1,
      options: [
        { value: "CGST_SGST", label: "CGST + SGST" },
        { value: "IGST", label: "IGST" },
        { value: "NO_GST", label: "No GST" }
      ]
    },
    {
      name: "thank_you_note",
      label: "Thank You Note",
      type: "textarea",
      rows: 2,
      gridCols: 2,
      placeholder: "Enter thank you note"
    }
  ];

  // ================= UI =================
  return (
    <>
      <div className="fixed inset-0 mt-8 bg-black/40 flex items-start sm:items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-lg w-full max-w-4xl relative max-h-[90vh] flex flex-col">

          {/* FIXED HEADER */}
          <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {isEdit ? "Edit Quotation" : "Add Quotation"}
            </h2>
            <button
              onClick={onBack}
              className="text-xl font-bold hover:text-red-500"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* SCROLLABLE FORM BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Basic Information Form */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Basic Information</h3>
              <ReusableForm
                fields={fields}
                formData={formData}
                onChange={setFormData}
                onSubmit={handleSubmit}
                loading={loading}
                submitText={isEdit ? "Update Quotation" : "Save Quotation"}
                onCancel={onBack}
                showCancel={false}
                submitButtonClass="hidden" // Hide submit button as we'll add custom one
              />
            </div>

            {/* Items Selection */}
            <div>
              <ItemSelectionEngine
                baseApi={BASE_API}
                authToken={localStorage.getItem("access")}
                items={items}
                setItems={setItems}
                lowItems={lowItems}
                setLowItems={setLowItems}
                mode="quotation"
              />
            </div>

            {/* Terms and Conditions */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Terms & Conditions</h3>
              <div className="space-y-4">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validity Terms
                  </label>
                  <TermsMultiSelect
                    value={validityTerms}
                    onChange={setValidityTerms}
                    termsType={validityTypeId}
                    baseApi={BASE_API}
                    token={token}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Terms
                  </label>
                  <TermsMultiSelect
                    value={warrantyTerms}
                    onChange={setWarrantyTerms}
                    termsType={warrantyTypeId}
                    baseApi={BASE_API}
                    token={token}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(formData)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : (isEdit ? "Update Quotation" : "Save Quotation")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
