import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { MdClose } from 'react-icons/md';
import { formatMaterialLabel } from '../../utils/materialLabel';

const BASE_API = import.meta.env.VITE_BASE_API_URL ?? 'http://127.0.0.1:8000';

const mapQuotationLowItemToProduct = (lowItem, index, materialsList, acMaterialMappings) => {
  const itemId = lowItem.item;
  const mapping = acMaterialMappings.find((m) => m.material_id === itemId);
  const matFromList = materialsList.find((m) => m.id === itemId);

  const material_name =
    lowItem.material_display_name ||
    formatMaterialLabel({
      material_name: matFromList?.material_type_name,
      item_code: lowItem.item_code || matFromList?.item_code,
      size: matFromList?.size,
      size_unit: matFromList?.size_unit,
      thickness: matFromList?.thickness,
      thickness_unit: matFromList?.thickness_unit,
    }) ||
    lowItem.description ||
    lowItem.item_code ||
    'Unknown';

  return {
    id: `q-low-${lowItem.id ?? index}-${Date.now()}`,
    ac_type: mapping?.ac_type || '',
    material_id: itemId,
    quantity: lowItem.quantity ?? 1,
    unit: lowItem.unit || 'Nos',
    rate: parseFloat(lowItem.unit_price) || 0,
    description: lowItem.description || '',
    brand: matFromList?.brand || '',
    gst_percent: parseFloat(lowItem.gst_percent) || 18,
    mathadi_charges: parseFloat(lowItem.mathadi_charges) || 0,
    hsn_sac: lowItem.hsn_sac || '',
    material_name,
    from_quotation: true,
  };
};

const getInitialFormData = (contractType = 'one_time') => ({
  customer_contact: '',
  customer_name: '',
  customer_email: '',
  subject: '',
  contract_type: contractType,
  contract_status: 'active',
  amc_service_type: '',
  segment: 'residential',
  service_start_date: '',
  service_end_date: '',
  state: '',
  city: '',
  pincode: '',
  address: '',
  apply_gst: true,
  gst_percentage: 18,
  products: [],
});

const getInitialNewMaterial = () => ({
  ac_type: '',
  material_id: '',
  quantity: '',
  unit: 'Nos',
  rate: 0,
  description: '',
  brand: '',
  gst_percent: 18,
  mathadi_charges: 0,
  hsn_sac: '',
});

export default function ServiceManagementForm({
  open = false,
  onClose,
  onSuccess,
  baseApi = BASE_API,
  token: tokenProp,
  service = null,
  defaultContractType = 'one_time',
}) {
  const token = tokenProp || localStorage.getItem('access');
  const isEdit = Boolean(service?.id);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [acTypeList, setAcTypeList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const [formData, setFormData] = useState(getInitialFormData);

  const [acTypeLoadError, setAcTypeLoadError] = useState(false);
  const [materialsList, setMaterialsList] = useState([]);
  const [acMaterialMappings, setAcMaterialMappings] = useState([]);
  const [newMaterial, setNewMaterial] = useState(getInitialNewMaterial);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const handleClose = () => {
    onClose?.();
  };

  const resetForm = () => {
    setStep(1);
    setFormData(getInitialFormData(defaultContractType));
    setNewMaterial(getInitialNewMaterial());
    setCustomerSearchInput('');
    setSelectedCustomer(null);
    setSelectedQuotation(null);
    setQuotations([]);
    setCustomers([]);
    setShowCustomerDropdown(false);
  };

  const mapMaterialsToProducts = (materials, mappings = []) =>
    (materials || []).map((m) => {
      const mapping = mappings.find((map) => map.material_id === m.ac_type);
      return {
        id: m.id,
        ac_type: mapping?.ac_type || '',
        material_id: m.ac_type,
        material_name: m.ac_type_code || '',
        quantity: m.quantity,
        unit: m.unit || 'Nos',
        rate: parseFloat(m.rate) || 0,
        description: m.description || '',
        brand: '',
        gst_percent: 18,
        mathadi_charges: 0,
        hsn_sac: '',
      };
    });

  const loadServiceForEdit = async (recordId) => {
    try {
      const [recordRes, mappingsRes] = await Promise.all([
        axios.get(`${baseApi}/amc/service-records/${recordId}/`, { headers: authHeaders }),
        acMaterialMappings.length
          ? Promise.resolve({ data: acMaterialMappings })
          : axios.get(`${baseApi}/product/ac-material/`, { headers: authHeaders }),
      ]);

      const data = recordRes.data;
      const mappings = Array.isArray(mappingsRes.data)
        ? mappingsRes.data
        : mappingsRes.data?.results || [];

      setCustomerSearchInput(data.customer_name || '');
      if (data.customer) {
        setSelectedCustomer({ id: data.customer, name: data.customer_name });
      }
      setFormData({
        customer_contact: data.customer_contact || '',
        customer_name: data.customer_name || '',
        customer_email: data.customer_email || '',
        subject: data.subject || '',
        contract_type: data.contract_type || 'one_time',
        contract_status: data.contract_status || 'active',
        amc_service_type: data.amc_service_type || '',
        segment: data.segment || 'residential',
        service_start_date: data.service_start_date || '',
        service_end_date: data.service_end_date || '',
        state: data.state || '',
        city: data.city || '',
        pincode: data.pincode || '',
        address: data.address || '',
        apply_gst: data.apply_gst ?? true,
        gst_percentage: parseFloat(data.gst_percentage) || 18,
        products: mapMaterialsToProducts(data.materials, mappings),
      });
    } catch (error) {
      console.error('Error loading service record:', error);
      Swal.fire('Error', 'Failed to load service record for editing', 'error');
      handleClose();
    }
  };

  useEffect(() => {
    if (!open) return;

    setStep(1);
    if (service?.id) {
      loadServiceForEdit(service.id);
    } else {
      resetForm();
    }
  }, [open, service?.id]);

  // Fetch AC Types (High Side - for the AC Type dropdown)
  useEffect(() => {
    const fetchAcTypes = async () => {
      try {
        setAcTypeLoadError(false);
        const response = await axios.get(
          `${baseApi}/product/actype/`,
          { headers: authHeaders }
        );

        let acTypes = [];
        if (Array.isArray(response.data)) {
          acTypes = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          acTypes = response.data.results;
        }

        setAcTypeList(Array.isArray(acTypes) ? acTypes : []);
      } catch (error) {
        console.error('Error fetching AC types:', error);
        setAcTypeList([]);
        setAcTypeLoadError(true);
      }
    };

    if (token) fetchAcTypes();
  }, [token, baseApi]);

  // Fetch Low Side Materials (for the Select Material dropdown)
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get(
          `${baseApi}/product/item/`,
          { headers: authHeaders }
        );

        let materials = [];
        if (Array.isArray(response.data)) {
          materials = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          materials = response.data.results;
        }

        setMaterialsList(Array.isArray(materials) ? materials : []);
      } catch (error) {
        console.error('Error fetching materials:', error);
        setMaterialsList([]);
      }
    };

    if (token) fetchMaterials();
  }, [token, baseApi]);

  // Fetch AC-Material mappings (to resolve AC type for quotation items)
  useEffect(() => {
    const fetchAcMaterialMappings = async () => {
      try {
        const response = await axios.get(
          `${baseApi}/product/ac-material/`,
          { headers: authHeaders }
        );

        const mappings = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

        setAcMaterialMappings(Array.isArray(mappings) ? mappings : []);
      } catch (error) {
        console.error('Error fetching AC material mappings:', error);
        setAcMaterialMappings([]);
      }
    };

    if (token) fetchAcMaterialMappings();
  }, [token, baseApi]);

  // Search customers
  const handleCustomerSearch = async (searchTerm) => {
    setCustomerSearchInput(searchTerm);

    if (searchTerm.length < 2) {
      setCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      const response = await axios.get(
        `${baseApi}/lead/customer/?search=${searchTerm}`,
        { headers: authHeaders }
      );

      let customerList = [];
      if (Array.isArray(response.data)) {
        customerList = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        customerList = response.data.results;
      }

      setCustomers(Array.isArray(customerList) ? customerList : []);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    }
  };

  // Select customer
  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchInput(customer.name || '');
    setShowCustomerDropdown(false);

    // Auto-fill customer fields
    setFormData(prev => ({
      ...prev,
      customer_name: customer.name || '',
      customer_contact: customer.contact_number || '',
      customer_email: customer.email || '',
    }));

    // Fetch quotations for this customer
    try {
      const response = await axios.get(
        `${baseApi}/quotation/quotation/?customer=${customer.id}`,
        { headers: authHeaders }
      );

      let quotationList = [];
      if (Array.isArray(response.data)) {
        quotationList = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        quotationList = response.data.results;
      }

      setQuotations(Array.isArray(quotationList) ? quotationList : []);
      setSelectedQuotation(null);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      setQuotations([]);
    }
  };

  // Select quotation and auto-fill data
  const handleSelectQuotation = async (quotation) => {
    setSelectedQuotation(quotation);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [quoteRes, materialsRes, mappingsRes] = await Promise.all([
        axios.get(`${baseApi}/quotation/quotation/${quotation.id}/`, { headers }),
        materialsList.length
          ? Promise.resolve({ data: materialsList })
          : axios.get(`${baseApi}/product/item/`, { headers }),
        acMaterialMappings.length
          ? Promise.resolve({ data: acMaterialMappings })
          : axios.get(`${baseApi}/product/ac-material/`, { headers }),
      ]);

      const quoteData = quoteRes.data;
      const itemsData = Array.isArray(materialsRes.data)
        ? materialsRes.data
        : materialsRes.data?.results || materialsList;
      const mappingsData = Array.isArray(mappingsRes.data)
        ? mappingsRes.data
        : mappingsRes.data?.results || acMaterialMappings;

      const activeVersion =
        quoteData.versions?.find((v) => v.is_active) ||
        quoteData.versions?.[quoteData.versions.length - 1];

      if (!activeVersion) {
        Swal.fire('Info', 'No quotation version found', 'info');
        return;
      }

      const lowSideItems = activeVersion.low_side_items || [];
      const quotationProducts = lowSideItems.map((item, index) =>
        mapQuotationLowItemToProduct(item, index, itemsData, mappingsData)
      );

      setFormData((prev) => ({
        ...prev,
        subject: quoteData.subject || prev.subject,
        state: selectedCustomer?.state || prev.state,
        city: quoteData.site_city || selectedCustomer?.city || prev.city,
        pincode: String(
          quoteData.site_pincode ||
          selectedCustomer?.pin_code ||
          prev.pincode
        ),
        address: quoteData.site_address || selectedCustomer?.address || prev.address,
        products: quotationProducts,
      }));

      if (quotationProducts.length > 0) {
        Swal.fire({
          icon: 'success',
          title: 'Quotation loaded',
          text: `${quotationProducts.length} item(s) added from quotation ${quoteData.quotation_no || ''}`,
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        Swal.fire('Info', 'This quotation has no low-side items to import', 'info');
      }
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      Swal.fire('Error', 'Failed to load quotation details', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (name === 'contract_type' && value !== 'amc') {
        next.amc_service_type = '';
      }
      return next;
    });
  };

  const handleMaterialChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'rate' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

const handleAddMaterial = () => {
  if (!newMaterial.ac_type) {
    Swal.fire('Error', 'Please select AC Type', 'error');
    return;
  }
  
  if (!newMaterial.material_id) {
    Swal.fire('Error', 'Please select Material', 'error');
    return;
  }

  if (newMaterial.rate <= 0 || newMaterial.quantity <= 0) {
    Swal.fire('Error', 'Please fill Quantity and Price correctly', 'error');
    return;
  }

  // Get the material name safely
  const selectedMaterial = Array.isArray(materialsList) 
    ? materialsList.find(m => m.id === parseInt(newMaterial.material_id))
    : null;
  
  const materialName = selectedMaterial?.item_code || 'Unknown';

  setFormData(prev => ({
    ...prev,
    products: [...prev.products, { 
      ...newMaterial, 
      id: Date.now(),
      material_name: materialName
    }]
  }));

  setNewMaterial(getInitialNewMaterial());
};

  const buildRecordPayload = (totals) => {
    const { products, ...fields } = formData;
    return {
      ...fields,
      customer: selectedCustomer?.id || null,
      amc_service_type: fields.contract_type === 'amc' ? fields.amc_service_type : '',
      service_start_date: fields.service_start_date || null,
      service_end_date: fields.service_end_date || null,
      total_price_without_gst: totals.subtotal,
      gst_amount: totals.gst,
      total_price_with_gst: totals.total,
    };
  };

  const addMaterialsToRecord = async (recordId, products) => {
    for (const product of products) {
      await axios.post(
        `${baseApi}/amc/service-records/${recordId}/add_material/`,
        {
          ac_type_id: parseInt(product.material_id || product.ac_type),
          quantity: product.quantity,
          unit: product.unit,
          rate: product.rate,
          description: product.description,
        },
        { headers: authHeaders }
      );
    }
  };

  const syncMaterialsForEdit = async (recordId, products) => {
    const recordRes = await axios.get(`${baseApi}/amc/service-records/${recordId}/`, {
      headers: authHeaders,
    });
    const existing = recordRes.data.materials || [];

    for (const material of existing) {
      await axios.delete(`${baseApi}/amc/service-records/${recordId}/material/${material.id}/`, {
        headers: authHeaders,
      });
    }

    await addMaterialsToRecord(recordId, products);
  };

  const handleRemoveMaterial = (id) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const validateStep1 = () => {
    if (!formData.customer_name || !formData.customer_contact) {
      Swal.fire('Error', 'Please fill all customer fields', 'error');
      return false;
    }
    if (!formData.service_start_date) {
      Swal.fire('Error', 'Please select service start date', 'error');
      return false;
    }
    if (
      formData.service_end_date &&
      formData.service_start_date &&
      formData.service_end_date < formData.service_start_date
    ) {
      Swal.fire('Error', 'Service end date cannot be before start date', 'error');
      return false;
    }
    if (formData.contract_type === 'amc' && !formData.amc_service_type) {
      Swal.fire('Error', 'Please select AMC service type (Comprehensive or Non-Comprehensive)', 'error');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.state || !formData.city || !formData.pincode || !formData.address) {
      Swal.fire('Error', 'Please fill all location fields', 'error');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.products.length === 0) {
      Swal.fire('Error', 'Please add at least one material', 'error');
      return false;
    }
    return true;
  };

const calculateTotals = () => {
  let subtotal = 0;
  let totalGst = 0;

  if (!Array.isArray(formData.products)) {
    return { subtotal: 0, gst: 0, total: 0 };
  }

  formData.products.forEach(p => {
    try {
      const quantity = parseFloat(p.quantity) || 0;
      const rate = parseFloat(p.rate) || 0;
      const gstPercent = parseFloat(p.gst_percent) || 18;  // ← Convert to number
      
      const itemSubtotal = quantity * rate;
      const itemGst = (itemSubtotal * gstPercent) / 100;
      
      subtotal += itemSubtotal;
      totalGst += itemGst;
    } catch (e) {
      console.error('Error calculating totals:', e, p);
    }
  });

  const applyGst = formData.apply_gst === true || formData.apply_gst === 'true';
  const finalGst = applyGst ? totalGst : 0;

  return { 
    subtotal, 
    gst: finalGst, 
    total: subtotal + finalGst 
  };
};

  const totals = calculateTotals();

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep3()) {
      setStep(2);
      return;
    }
    if (!validateStep2()) {
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const payload = buildRecordPayload(totals);

      if (isEdit) {
        await axios.put(`${baseApi}/amc/service-records/${service.id}/`, payload, {
          headers: authHeaders,
        });
        await syncMaterialsForEdit(service.id, formData.products);
        Swal.fire('Success', 'Service record updated successfully', 'success');
      } else {
        const recordResponse = await axios.post(`${baseApi}/amc/service-records/`, payload, {
          headers: authHeaders,
        });
        await addMaterialsToRecord(recordResponse.data.id, formData.products);
        Swal.fire('Success', 'Service record created successfully', 'success');
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      const errMsg =
        error.response?.data?.detail ||
        JSON.stringify(error.response?.data) ||
        'Failed to save';
      Swal.fire('Error', errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

const getAcTypeName = (id) => {
  if (!id) return 'Unknown';
  
  if (Array.isArray(acTypeList)) {
    const ac = acTypeList.find(a => a && a.id === parseInt(id));
    if (ac) return ac.name || ac.item_code || 'Unknown';
  }
  
  return 'Unknown';
};

const getMaterialName = (id) => {
  if (!id) return 'Unknown';
  
  if (!Array.isArray(materialsList)) return 'Unknown';
  
  const mat = materialsList.find(m => m && m.id === parseInt(id));
  return mat?.item_code || mat?.name || 'Unknown';
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Edit Service Record' : 'Service Management Record'}
          </h2>
          <button type="button" onClick={handleClose} className="text-slate-500 hover:text-slate-700">
            <MdClose size={24} />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center py-4 bg-slate-50 border-b border-slate-200 space-x-6">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center focus:outline-none transition ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              1
            </div>
            <span className="ml-2 text-sm">Basic & Buyer Info</span>
          </button>
          
          <div className={`w-12 h-1 transition ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          
          {/* Step 2 */}
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
            className={`flex items-center focus:outline-none transition ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </div>
            <span className="ml-2 text-sm">Items</span>
          </button>
          
          <div className={`w-12 h-1 transition ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          
          {/* Step 3 */}
          <button
            type="button"
            onClick={() => {
              if (validateStep1() && validateStep3()) setStep(3);
            }}
            className={`flex items-center focus:outline-none transition ${step >= 3 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition font-semibold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              3
            </div>
            <span className="ml-2 text-sm">Additional Info & Terms</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Customer Details with Search */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Customer Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={customerSearchInput}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                {/* Customer Dropdown */}
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                    {customers.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-slate-500">{customer.email || customer.contact_number}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quotation Selection */}
              {selectedCustomer && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Select Quotation <span className="text-slate-400 font-normal">(auto-fills items table)</span>
                  </label>
                  <select
                    value={selectedQuotation?.id || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setSelectedQuotation(null);
                        setFormData((prev) => ({ ...prev, products: [] }));
                        return;
                      }
                      const quot = quotations.find((q) => q.id === parseInt(value));
                      if (quot) handleSelectQuotation(quot);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Quotation --</option>
                    {quotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotation_no} ({new Date(q.created_at || q.quotation_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  {quotations.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1">No quotations found for this customer.</p>
                  )}
                </div>
              )}

              {/* Auto-filled Customer Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact <span className="text-red-600">*</span></label>
                  <input type="text" name="customer_contact" value={formData.customer_contact} onChange={handleInputChange} placeholder="10-digit mobile" maxLength="15" className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email </label>
                  <input type="email" name="customer_email" value={formData.customer_email} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject <span className="text-red-600">*</span></label>
                <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contract Type</label>
                  <select name="contract_type" value={formData.contract_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="one_time">One Time</option>
                    <option value="amc">AMC</option>
                    <option value="warranty">Warranty</option>
                  </select>
                </div>
                {formData.contract_type === 'amc' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      AMC Service Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="amc_service_type"
                      value={formData.amc_service_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="COMPREHENSIVE">Comprehensive</option>
                      <option value="NON_COMPREHENSIVE">Non-Comprehensive</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select name="contract_status" value={formData.contract_status} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Segment</label>
                  <select name="segment" value={formData.segment} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Service Start Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="service_start_date"
                    value={formData.service_start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service End Date</label>
                  <input
                    type="date"
                    name="service_end_date"
                    value={formData.service_end_date}
                    onChange={handleInputChange}
                    min={formData.service_start_date || undefined}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location Details (Additional Info & Terms) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-600">*</span></label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-red-600">*</span></label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode <span className="text-red-600">*</span></label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} maxLength="10" className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address <span className="text-red-600">*</span></label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
              </div>
            </div>
          )}

          {/* STEP 2: Materials (Items) */}
          {step === 2 && (
            <div className="space-y-4">
              {selectedQuotation && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg">
                  Items loaded from quotation <strong>{selectedQuotation.quotation_no}</strong>.
                  You can edit values in the table or add more items below.
                </div>
              )}
              {/* Low Side Items Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Low Side Items</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  + Add Product
                </button>
              </div>

              {/* Materials Form */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                {/* Row 1: AC Type & Select Material */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select AC Type <span className="text-red-600">*</span></label>
                    <select
                      value={newMaterial.ac_type}
                      onChange={(e) => {
                        setNewMaterial(prev => ({
                          ...prev,
                          ac_type: e.target.value
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                    >
                      <option value="">-- Select AC Type --</option>
                      {Array.isArray(acTypeList) && acTypeList.length > 0 ? (
                        acTypeList.map(ac => (
                          <option key={ac.id} value={ac.id}>
                            {ac.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No AC types available</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Material <span className="text-red-600">*</span></label>
                    <select
                      value={newMaterial.material_id || ''}
                      onChange={(e) => {
                        setNewMaterial(prev => ({
                          ...prev,
                          material_id: e.target.value
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                    >
                      <option value="">-- Select Material --</option>
                      {Array.isArray(materialsList) && materialsList.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.item_code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Qty, Price, Brand, GST% */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Qty"
                    value={newMaterial.quantity || ''}
                    onChange={handleMaterialChange}
                    min="0.01"
                    step="0.01"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  />

                  <input
                    type="number"
                    name="rate"
                    placeholder="Price"
                    value={newMaterial.rate || ''}
                    onChange={handleMaterialChange}
                    min="0"
                    step="0.01"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  />

                  <select
                    name="brand"
                    value={newMaterial.brand || ''}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, brand: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  >
                    <option value="">Select Brand</option>
                    {acTypeList && acTypeList.map(item => (
                      item.brand_name && (
                        <option key={`${item.id}-${item.brand_id}`} value={item.brand_id}>
                          {item.brand_name}
                        </option>
                      )
                    ))}
                  </select>

                  <input
                    type="number"
                    name="gst_percent"
                    placeholder="GST%"
                    value={newMaterial.gst_percent || ''}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, gst_percent: e.target.value || 18}))}
                        min="0"
                        step="0.01"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  />
                </div>

                {/* Row 3: Mathadi Charges */}
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="number"
                    name="mathadi_charges"
                    placeholder="Mathadi Charges"
                    value={newMaterial.mathadi_charges || ''}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, mathadi_charges: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  />
                </div>

                {/* Row 4: HSN & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="hsn_sac"
                    placeholder="HSN"
                    value={newMaterial.hsn_sac || ''}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, hsn_sac: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  />

                  <select
                    name="unit"
                    value={newMaterial.unit}
                    onChange={handleMaterialChange}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  >
                    <option>Rmt</option>
                    <option>Ft</option>
                    <option>Smtr</option>
                    <option>Sqft</option>
                    <option>Nos</option>
                    <option>Kg</option>
                    <option>Lot</option>
                    <option>m</option>
                    <option>in</option>
                  </select>
                </div>

                {/* Row 5: Description */}
                <div>
                  <textarea
                    name="description"
                    placeholder="Enter item description..."
                    value={newMaterial.description}
                    onChange={handleMaterialChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  />
                </div>
              </div>

{/* Materials Table */}
{formData.products.length > 0 && (
  <div className="overflow-x-auto border rounded-lg">
    <table className="w-full text-sm">
      <thead className="bg-slate-100 border-b">
        <tr>
          <th className="px-4 py-2 text-left">AC Type</th>
          <th className="px-4 py-2 text-left">Material</th>
          <th className="px-4 py-2 text-center">Qty</th>
          <th className="px-4 py-2 text-center">Unit</th>
          <th className="px-4 py-2 text-right">Price</th>
          <th className="px-4 py-2 text-right">GST%</th>
          <th className="px-4 py-2 text-right">Amount</th>
          <th className="px-4 py-2 text-center">Action</th>
        </tr>
      </thead>
      <tbody>
        {formData.products.map((p) => {
          const itemSubtotal = p.quantity * p.rate;
          const itemGst = (itemSubtotal * (p.gst_percent || 18)) / 100;
          const itemTotal = itemSubtotal + itemGst;
          
          return (
            <tr key={p.id} className="border-t hover:bg-slate-50">
              <td className="px-4 py-2">{getAcTypeName(p.ac_type)}</td>
              <td className="px-4 py-2">{p.material_name || getMaterialName(p.material_id)}</td>
              <td className="px-4 py-2 text-center">{p.quantity}</td>
              <td className="px-4 py-2 text-center">{p.unit}</td>
              <td className="px-4 py-2 text-right">₹{(parseFloat(p.rate) || 0).toFixed(2)}</td>
              <td className="px-4 py-2 text-right">{(parseFloat(p.gst_percent) || 18).toFixed(2)}%</td>
              <td className="px-4 py-2 text-right font-semibold">₹{itemTotal.toFixed(2)}</td>
              <td className="px-4 py-2 text-center">
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(p.id)}
                  className="text-red-600 hover:text-red-800 font-bold"
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

              {/* Totals */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 border">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹ {totals.subtotal.toFixed(2)}</span>
                </div>
                {formData.apply_gst && (
                  <div className="flex justify-between">
                    <span>GST :</span>
                    <span className="font-semibold">₹ {totals.gst.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>₹ {totals.total.toFixed(2)}</span>
                </div>
                <label className="flex items-center gap-2 mt-4">
                  <input type="checkbox" name="apply_gst" checked={formData.apply_gst} onChange={handleInputChange} />
                  <span className="text-sm">Apply GST</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-slate-50">
          <button type="button" onClick={handleClose} className="px-6 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium">
            Cancel
          </button>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium">
              Previous
            </button>
          )}
          {step < 3 && (
            <button
              onClick={() => {
                if (step === 1 && validateStep1()) setStep(2);
                if (step === 2 && validateStep3()) setStep(3);
              }}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Next
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="ml-auto px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Record' : 'Create Record'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
