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

  const { getOrCreateTermTypeId, loading } = useTermTypes({
    baseApi: BASE_API,
    token: localStorage.getItem("access")
  });

  const isEdit = !!id;

  // ================= FORM DATA STATE =================
  const [formData, setFormData] = useState({
    // Customer info
    customer_phone: "",
    customer_name: "",
    customer_id: "",

    // Invoice header
    invoice_no: "",
    invoice_date: new Date().toISOString().split('T')[0],
    branch: "",
    site: "",
    gst_type: "CGST_SGST",

    // Buyer information
    buyer_address: "",
    buyer_gstin: "",
    buyer_state: "",
    buyer_state_code: "",

    // Ship to
    ship_to_address: "",
    same_as_buyer: true,

    // Additional info
    delivery_note: "",
    delivery_note_date: "",
    supplier_ref: "",
    other_references: "",
    buyer_order_no: "",
    dispatch_doc_no: "",
    dispatched_through: "",
    destination: "",
    work_description: "",

    // Company/Bank details
    bank_name: "",
    account_no: "",
    ifsc_code: "",
    declaration: ""
  });

  // ================= MASTER DATA =================
  const [sites, setSites] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading_form, setLoadingForm] = useState(false);


  // ================= TERMS AND CONDITIONS =================
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [paymentTypeId, setPaymentTypeId] = useState(null);
  const [deliveryTypeId, setDeliveryTypeId] = useState(null);

  // ================= ITEMS =================
  const [items, setItems] = useState([]);
  const [lowItems, setLowItems] = useState([]);

  // ================= STATE SEARCH =================
  const [stateSearch, setStateSearch] = useState("");
  const [showStateList, setShowStateList] = useState(false);
  const filteredStates = STATES.filter(s =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // ================= LOAD MASTER DATA =================
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // Load sites
        const siteRes = await api.get("auth/site/");
        setSites(normalize(siteRes.data));

        // Load branches
        const branchRes = await api.get("auth/branch/");
        setBranches(normalize(branchRes.data));
      } catch (err) {
        console.log("Error loading master data:", err);
      }
    };

    loadMasterData();
  }, []);

  // ================= INITIALIZE TERM TYPES =================
  useEffect(() => {
    if (loading) return;

    const initTypes = async () => {
      const paymentId = await getOrCreateTermTypeId(
        "Invoice Payment",
        "Terms of Payment"
      );

      const deliveryId = await getOrCreateTermTypeId(
        "Invoice Delivery",
        "Terms of Delivery"
      );

      setPaymentTypeId(paymentId);
      setDeliveryTypeId(deliveryId);
    };

    initTypes();
  }, [loading]);

  // ================= EDIT LOAD =================
  useEffect(() => {
    if (!isEdit || !paymentTypeId || !deliveryTypeId) return;

    const loadInvoiceData = async () => {
      try {
        const res = await api.get(`invoice/invoice/${id}/`);
        const inv = res.data;

        // Set form data
        setFormData({
          customer_phone: inv.customer_phone || "",
          customer_name: inv.buyer_name || "",
          customer_id: inv.customer || "",
          invoice_no: inv.invoice_no,
          invoice_date: inv.invoice_date,
          branch: inv.branch || "",
          site: inv.site || "",
          gst_type: inv.gst_type,
          buyer_address: inv.buyer_address || "",
          buyer_gstin: inv.buyer_gstin || "",
          buyer_state: inv.buyer_state || "",
          buyer_state_code: inv.buyer_state_code || "",
          ship_to_address: inv.ship_to_address || "",
          same_as_buyer: !inv.ship_to_address,
          delivery_note: inv.delivery_note || "",
          delivery_note_date: inv.delivery_note_date || "",
          supplier_ref: inv.supplier_ref || "",
          other_references: inv.other_references || "",
          buyer_order_no: inv.buyer_order_no || "",
          dispatch_doc_no: inv.dispatch_doc_no || "",
          dispatched_through: inv.dispatched_through || "",
          destination: inv.destination || "",
          work_description: inv.work_description || "",
          bank_name: inv.bank_name || "",
          account_no: inv.account_no || "",
          ifsc_code: inv.ifsc_code || "",
          declaration: inv.declaration || ""
        });

        // Load Terms
        if (inv.terms_conditions_details) {
          const payment = inv.terms_conditions_details
            .filter(t => t.terms_condition_type_name === "Invoice Payment")
            .map(t => t.id);

          const delivery = inv.terms_conditions_details
            .filter(t => t.terms_condition_type_name === "Invoice Delivery")
            .map(t => t.id);

          setPaymentTerms(payment);
          setDeliveryTerms(delivery);
        }

        // Set items
        const highItems = inv.high_side_items || [];
        const lowItemsList = inv.low_side_items || [];

        setItems(highItems.map(i => ({
          product_variant: i.product_variant,
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
          item_code: i.item_code,
          description: i.description,
          hsn_sac: i.hsn_sac,
          quantity: i.quantity,
          unit: i.unit,
          rate: i.rate,
          gst_percent: i.gst_percent
        })));
      } catch (err) {
        console.log("Error loading invoice:", err);
      }
    };

    loadInvoiceData();
  }, [id, paymentTypeId, deliveryTypeId]);
  // ================= CUSTOMER SEARCH =================
  const handlePhoneSearch = async (phone) => {
    if (phone.length >= 10) {
      try {
        const res = await api.get(`lead/customer/?search=${phone}`);
        const data = normalize(res.data);

        if (data.length > 0) {
          const cust = data[0];
          setFormData(prev => ({
            ...prev,
            customer_phone: phone,
            customer_name: cust.name,
            customer_id: cust.id,
            buyer_address: cust.address || "",
            buyer_gstin: cust.gstin || "",
            buyer_state: cust.state || "",
            buyer_state_code: cust.state_code || "",
            ship_to_address: prev.same_as_buyer ? (cust.address || "") : prev.ship_to_address
          }));
        }
      } catch (err) {
        console.log("Error searching customer:", err);
      }
    }
  };

  // ================= STATE CHANGE HANDLER =================
  const handleStateChange = (value) => {
    setStateSearch(value);

    const found = STATES.find(
      s => s.name.toLowerCase() === value.toLowerCase()
    );

    if (found) {
      setFormData(prev => ({
        ...prev,
        buyer_state: found.name,
        buyer_state_code: found.code
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        buyer_state: value
      }));
    }
  };

  // ================= SHIP TO TOGGLE =================
  const handleShipToToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      same_as_buyer: checked,
      ship_to_address: checked ? prev.buyer_address : ""
    }));
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setFormData({
      customer_phone: "",
      customer_name: "",
      customer_id: "",
      invoice_no: "",
      invoice_date: new Date().toISOString().split('T')[0],
      branch: "",
      site: "",
      gst_type: "CGST_SGST",
      buyer_address: "",
      buyer_gstin: "",
      buyer_state: "",
      buyer_state_code: "",
      ship_to_address: "",
      same_as_buyer: true,
      delivery_note: "",
      delivery_note_date: "",
      supplier_ref: "",
      other_references: "",
      buyer_order_no: "",
      dispatch_doc_no: "",
      dispatched_through: "",
      destination: "",
      work_description: "",
      bank_name: "",
      account_no: "",
      ifsc_code: "",
      declaration: ""
    });

    setPaymentTerms([]);
    setDeliveryTerms([]);

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
  const handleSubmit = async (data) => {
    // Validation
    if (!data.customer_id) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please search and select a customer" });
      return;
    }
    // if (!data.invoice_no.trim()) {
    //   Swal.fire({ icon: "error", title: "Validation", text: "Invoice number is required" });
    //   return;
    // }
    if (items.length === 0 && lowItems.length === 0) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please add at least one item" });
      return;
    }

    setLoadingForm(true);

    const payload = {
      invoice_no: data.invoice_no,
      customer: data.customer_id ? Number(data.customer_id) : null,
      site: data.site || null,
      branch: data.branch || null,
      terms_conditions: [
        ...paymentTerms,
        ...deliveryTerms
      ],

      invoice_date: data.invoice_date,

      // Buyer snapshot
      buyer_name: data.customer_name,
      buyer_address: data.buyer_address,
      buyer_gstin: data.buyer_gstin,
      buyer_state: data.buyer_state,
      buyer_state_code: data.buyer_state_code,

      // Ship to
      ship_to_address: data.ship_to_address,

      // Company snapshot
      bank_name: data.bank_name,
      account_no: data.account_no,
      ifsc_code: data.ifsc_code,
      declaration: data.declaration,

      // Header fields
      delivery_note: data.delivery_note,
      delivery_note_date: data.delivery_note_date,
      supplier_ref: data.supplier_ref,
      other_references: data.other_references,
      buyer_order_no: data.buyer_order_no,
      dispatch_doc_no: data.dispatch_doc_no,
      dispatched_through: data.dispatched_through,
      destination: data.destination,
      work_description: data.work_description,

      // GST Type
      gst_type: data.gst_type,

      high_side_items: items.map(i => ({
        product_variant: Number(i.product_variant),
        description: i.description,
        hsn_sac: i.hsn_sac,
        gst_percent: Number(i.gst_percent),
        quantity: Number(i.quantity),
        unit: i.unit,
        rate: Number(i.rate)
      })),

      low_side_items: lowItems.map(l => ({
        item: Number(l.item),
        description: l.description,
        gst_percent: Number(l.gst_percent),
        quantity: Number(l.quantity),
        unit: l.unit,
        rate: Number(l.rate)
      }))
    };

    try {
      if (isEdit) {
        await api.put(`invoice/invoice/${id}/`, payload);
      } else {
        await api.post("invoice/invoice/", payload);
      }

      Swal.fire({
        icon: "success",
        text: isEdit ? "Invoice updated successfully" : "Invoice created successfully",
        timer: 1200,
        showConfirmButton: false
      });

      resetForm();
      if (onBack) onBack();

    } catch (err) {
      console.log(err.response?.data);
      Swal.fire({ icon: "error", title: "Error", text: "Error saving invoice" });
    } finally {
      setLoadingForm(false);
    }
  };

  // ================= FIELD DEFINITIONS =================
  const basicInfoFields = [
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
    // {
    //   name: "invoice_no",
    //   label: "Invoice Number",
    //   type: "text",
    //   required: true,
    //   gridCols: 1,
    //   placeholder: "Enter invoice number"
    // },
    {
      name: "invoice_date",
      label: "Invoice Date",
      type: "date",
      required: true,
      gridCols: 1
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
      name: "site",
      label: "Site",
      type: "select",
      gridCols: 1,
      placeholder: "Select Site",
      options: sites.map(site => ({ value: site.id, label: site.name }))
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
    }
  ];

  const buyerInfoFields = [
    {
      name: "buyer_address",
      label: "Buyer Address",
      type: "textarea",
      rows: 2,
      gridCols: 2,
      placeholder: "Enter buyer address"
    },
    {
      name: "buyer_gstin",
      label: "Buyer GSTIN",
      type: "text",
      gridCols: 1,
      placeholder: "Enter GSTIN"
    },
    {
      name: "buyer_state",
      label: "Buyer State",
      type: "component",
      gridCols: 1,
      component: ({ value, onChange }) => (
        <div className="relative">
          <input
            className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Select State"
            value={stateSearch || value}
            onChange={(e) => {
              handleStateChange(e.target.value);
              setShowStateList(true);
            }}
            onFocus={() => setShowStateList(true)}
          />
          {showStateList && filteredStates.length > 0 && (
            <div className="absolute z-20 bg-white border w-full max-h-40 overflow-y-auto rounded-md shadow">
              {filteredStates.map((s, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    setStateSearch(s.name);
                    onChange(s.name);
                    setFormData(prev => ({
                      ...prev,
                      buyer_state: s.name,
                      buyer_state_code: s.code
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
      )
    },
    {
      name: "buyer_state_code",
      label: "State Code",
      type: "text",
      disabled: true,
      gridCols: 1,
      placeholder: "Auto-filled"
    }
  ];

  const shipToFields = [
    {
      name: "same_as_buyer",
      label: "Same as Buyer Address",
      type: "checkbox",
      gridCols: 2,
      component: ({ value, onChange }) => (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => {
              onChange(e.target.checked);
              handleShipToToggle(e.target.checked);
            }}
          />
          Same as Buyer Address
        </label>
      )
    },
    {
      name: "ship_to_address",
      label: "Ship To Address",
      type: "textarea",
      rows: 2,
      gridCols: 2,
      disabled: formData.same_as_buyer,
      placeholder: "Enter shipping address"
    }
  ];

  const additionalInfoFields = [
    {
      name: "delivery_note",
      label: "Delivery Note",
      type: "text",
      gridCols: 1,
      placeholder: "Enter delivery note"
    },
    {
      name: "delivery_note_date",
      label: "Delivery Note Date",
      type: "date",
      gridCols: 1
    },
    {
      name: "supplier_ref",
      label: "Supplier Reference",
      type: "text",
      gridCols: 1,
      placeholder: "Enter supplier reference"
    },
    {
      name: "other_references",
      label: "Other References",
      type: "text",
      gridCols: 1,
      placeholder: "Enter other references"
    },
    {
      name: "buyer_order_no",
      label: "Buyer Order No",
      type: "text",
      gridCols: 1,
      placeholder: "Enter buyer order number"
    },
    {
      name: "dispatch_doc_no",
      label: "Dispatch Document No",
      type: "text",
      gridCols: 1,
      placeholder: "Enter dispatch document number"
    },
    {
      name: "dispatched_through",
      label: "Dispatched Through",
      type: "text",
      gridCols: 1,
      placeholder: "Enter dispatch method"
    },
    {
      name: "destination",
      label: "Destination",
      type: "text",
      gridCols: 1,
      placeholder: "Enter destination"
    },
    {
      name: "work_description",
      label: "Work Description",
      type: "textarea",
      rows: 3,
      gridCols: 2,
      placeholder: "Enter work description"
    }
  ];

  const companyBankFields = [
    {
      name: "bank_name",
      label: "Bank Name",
      type: "text",
      gridCols: 1,
      placeholder: "Enter bank name"
    },
    {
      name: "account_no",
      label: "Account Number",
      type: "text",
      gridCols: 1,
      placeholder: "Enter account number"
    },
    {
      name: "ifsc_code",
      label: "IFSC Code",
      type: "text",
      gridCols: 1,
      placeholder: "Enter IFSC code"
    },
    {
      name: "declaration",
      label: "Declaration",
      type: "textarea",
      rows: 2,
      gridCols: 2,
      placeholder: "Enter declaration"
    }
  ];

  // ================= UI =================
  return (
    <>
      <div className="fixed inset-0 mt-8 bg-black/40 flex items-start sm:items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-lg w-full max-w-5xl relative max-h-[90vh] flex flex-col">

          {/* FIXED HEADER */}
          <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {isEdit ? "Edit Invoice" : "Create New Invoice"}
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

            {/* Basic Information */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Basic Information</h3>
              <ReusableForm
                fields={basicInfoFields}
                formData={formData}
                onChange={setFormData}
                onSubmit={() => { }}
                submitButtonClass="hidden"
              />
            </div>

            {/* Buyer Information */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Buyer Information</h3>
              <ReusableForm
                fields={buyerInfoFields}
                formData={formData}
                onChange={setFormData}
                onSubmit={() => { }}
                submitButtonClass="hidden"
              />
            </div>

            {/* Ship To */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Ship To</h3>
              <ReusableForm
                fields={shipToFields}
                formData={formData}
                onChange={setFormData}
                onSubmit={() => { }}
                submitButtonClass="hidden"
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
                mode="invoice"
                gstType={formData.gst_type}
              />
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Additional Information</h3>
              <ReusableForm
                fields={additionalInfoFields}
                formData={formData}
                onChange={setFormData}
                onSubmit={() => { }}
                submitButtonClass="hidden"
              />
            </div>

            {/* Company/Bank Details */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Company/Bank Details</h3>
              <ReusableForm
                fields={companyBankFields}
                formData={formData}
                onChange={setFormData}
                onSubmit={() => { }}
                submitButtonClass="hidden"
              />
            </div>

            {/* Terms and Conditions */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Terms & Conditions</h3>
              <div className="space-y-4">
                <div>
                  <TermsMultiSelect
                    label="Payment Terms"
                    value={paymentTerms}
                    onChange={setPaymentTerms}
                    termsType={paymentTypeId}
                    baseApi={BASE_API}
                    token={localStorage.getItem("access")}
                  />
                </div>

                <div>
                  <TermsMultiSelect
                    label="Delivery Terms"
                    value={deliveryTerms}
                    onChange={setDeliveryTerms}
                    termsType={deliveryTypeId}
                    baseApi={BASE_API}
                    token={localStorage.getItem("access")}
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
                disabled={loading_form}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(formData)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading_form}
              >
                {loading_form ? "Saving..." : (isEdit ? "Update Invoice" : "Save Invoice")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}