import { useEffect, useState } from "react";
import axios from "axios";
import SmartProductSelect from "./SmartProductSelect";
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

  // Add tab state for low side
  const [lowSideActiveTab, setLowSideActiveTab] = useState("materials");

  // Add service items state
  const [serviceItems, setServiceItems] = useState([]);

  // Update existing high side items when GST toggle changes
  useEffect(() => {
    setItems(prevItems =>
      prevItems.map(item => ({
        ...item,
        gst_percent: highSideGstEnabled ? (item.gst_percent || 18) : 0
      }))
    );
  }, [highSideGstEnabled]);

  // Update existing low side items when GST toggle changes
  useEffect(() => {
    setLowItems(prevItems =>
      prevItems.map(item => ({
        ...item,
        gst_percent: lowSideGstEnabled ? (item.gst_percent || 18) : 0
      }))
    );
  }, [lowSideGstEnabled]);

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
    product_variant: "",
    ac_type_name: "",
    ac_sub_type_name: "",
    brand_name: "",
    model_no: "",
    variant_sku: "",
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
    brand: "",
    description: "",
    hsn_sac: "",
    unit: "Nos",
    quantity: "",
    unit_price: "",
    rate: "",
    gst_percent: "",
    mathadi_charges: ""
  });

  // Add service draft state
  const [draftServiceItem, setDraftServiceItem] = useState({
    service: "",
    service_type: "",
    category: "",
    material: "",
    quantity: "",
    unit: "NOS",
    price: "",
    gst_percent: "",
    mathadi_charges: ""
  });

  /* ================= MASTERS ================= */
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [resetMaterials, setResetMaterials] = useState(0);
  const [lowItemsMaster, setLowItemsMaster] = useState([]);
  const [brands, setBrands] = useState([]);

  // Service masters
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [materials, setMaterials] = useState([]);

  /* ================= LOADERS ================= */

  // Load brands for low side items
  const loadBrands = async () => {
    try {
      // Get brands from items endpoint instead
      const res = await api.get("product/item/");
      const items = Array.isArray(res.data) ? res.data : (res.data.results || []);

      // Extract unique brands from items
      const uniqueBrands = [];
      const seenBrands = new Set();

      items.forEach(item => {
        if (item.brand_id && item.brand_name && !seenBrands.has(item.brand_id)) {
          uniqueBrands.push({
            id: item.brand_id,
            name: item.brand_name
          });
          seenBrands.add(item.brand_id);
        }
      });

      setBrands(uniqueBrands);
    } catch (err) {
      console.error("Error loading brands:", err);
      setBrands([]);
    }
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

  // Service loaders
  const loadServiceMaterials = async () => {
    try {
      const response = await api.get(`quotation/service-masters/`);
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setMaterials(data);
    } catch (err) {
      console.error("Error loading services:", err);
      setMaterials([]);
    }
  };

  /* ================= UPDATE DRAFT FUNCTIONS ================= */
  const updateHighDraft = (field, value) => {
    const copy = { ...draftHighItem, [field]: value };
    setDraftHighItem(copy);
  };

  const updateLowDraft = (field, value) => {
    const copy = { ...draftLowItem, [field]: value };

    if (copy.material_type_id && copy.item_type_id) {
      loadLowSideItems(copy);
    }

    setDraftLowItem(copy);
  };

  const updateServiceDraft = (field, value) => {
    setDraftServiceItem(prev => ({ ...prev, [field]: value }));
  };

  /* ================= SERVICE HANDLERS ================= */
  const handleMaterialChange = (serviceId) => {
    const selectedService = materials.find(s => s.id === parseInt(serviceId));
    if (selectedService) {
      updateServiceDraft("service", serviceId);
      updateServiceDraft("service_type", selectedService.service_type);
      updateServiceDraft("category", selectedService.category);
      updateServiceDraft("unit", selectedService.unit || "NOS");
      updateServiceDraft("price", selectedService.labor_rate || 0);
      updateServiceDraft("material", "");  // Reset material selection

      // If material-based, fetch linked items
      if (selectedService.service_type === 'MATERIAL' && selectedService.items?.length > 0) {
        // Items are already in selectedService.items
      }
    }
  };



  /* ================= ADD ROWS ================= */

  const addHighItem = () => {
    if (!draftHighItem.product_variant) {
      alert("Select Product Variant");
      return;
    }

    const newRow = {
      ...draftHighItem,
      quantity: draftHighItem.quantity || 1,
      unit_price: draftHighItem.unit_price || 0,
      rate: draftHighItem.rate || 0,
      gst_percent: highSideGstEnabled ? (draftHighItem.gst_percent || 18) : 0,
      mathadi_charges: draftHighItem.mathadi_charges || 0,
      transportation_charges: draftHighItem.transportation_charges || 0,
    };

    setItems(prev => [...prev, newRow]);

    setDraftHighItem({
      product_variant: "",
      ac_type_name: "",
      ac_sub_type_name: "",
      brand_name: "",
      model_no: "",
      variant_sku: "",
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

  const addLowItem = () => {
    if (selectedMaterials.length === 0) {
      alert("Select Material");
      return;
    }

    const newItems = selectedMaterials.map(mat => {
      let brandToUse = mat.brand_id;
      let brandNameToUse = mat.brand_name;

      if (!mat.brand_id || draftLowItem.brand) {
        brandToUse = draftLowItem.brand;
        const selectedBrand = brands.find(b => b.id == draftLowItem.brand);
        brandNameToUse = selectedBrand?.name || "";
      }

      return {
        ...draftLowItem,
        quantity: draftLowItem.quantity || 1,
        unit_price: draftLowItem.unit_price || 0,
        rate: draftLowItem.rate || 0,
        gst_percent: lowSideGstEnabled ? (draftLowItem.gst_percent || 18) : 0,
        mathadi_charges: draftLowItem.mathadi_charges || 0,
        unit: mat.unit || draftLowItem.unit,
        item: mat.id,
        item_code: mat.material_name || mat.item_code,
        brand: brandToUse,
        brand_name: brandNameToUse
      };
    });

    setLowItems(prev => [...prev, ...newItems]);

    setSelectedMaterials([]);
    setResetMaterials(prev => prev + 1);

    setDraftLowItem({
      material_type_id: "",
      item_type_id: "",
      feature_type_id: "",
      item_class_id: "",
      item: "",
      brand: "",
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

const addServiceItem = () => {
    if (!draftServiceItem.service) {
        alert("Please select a service");
        return;
    }
    
    if (draftServiceItem.service_type === 'MATERIAL' && !draftServiceItem.material) {
        alert("Please select at least one material");
        return;
    }

    const selectedService = materials.find(s => s.id === parseInt(draftServiceItem.service));
    const selectedMaterialIds = draftServiceItem.material 
        ? draftServiceItem.material.split(',').map(Number) 
        : [];

    // If Labor type and no materials selected, create one entry for the service itself
    if (draftServiceItem.service_type === 'LABOR' || selectedMaterialIds.length === 0) {
        const quantity = parseFloat(draftServiceItem.quantity) || 0;
        const price = parseFloat(draftServiceItem.price) || 0;
        const gstPercent = parseFloat(draftServiceItem.gst_percent) || 0;
        const mathadiCharges = parseFloat(draftServiceItem.mathadi_charges) || 0;

        const baseAmount = quantity * price;
        const gstAmount = (baseAmount * gstPercent) / 100;
        const totalAmount = baseAmount + gstAmount + mathadiCharges;

        const newServiceItem = {
            id: Date.now() + Math.random(),
            service_id: draftServiceItem.service,
            service_name: selectedService?.name || "",
            category: draftServiceItem.category,
            material_id: null,
            material_name: "(Labor Only)",
            quantity: quantity,
            unit: draftServiceItem.unit,
            price: price,
            gst_percent: gstPercent,
            mathadi_charges: mathadiCharges,
            base_amount: baseAmount,
            gst_amount: gstAmount,
            total_amount: totalAmount
        };

        setServiceItems(prev => [...prev, newServiceItem]);
    } else {
        // Create an entry for each selected material
        const newServiceItems = selectedMaterialIds.map(materialId => {
            const selectedMaterial = selectedService?.items?.find(item => item.id === materialId);
            
            const quantity = parseFloat(draftServiceItem.quantity) || 0;
            const price = parseFloat(draftServiceItem.price) || 0;
            const gstPercent = parseFloat(draftServiceItem.gst_percent) || 0;
            const mathadiCharges = parseFloat(draftServiceItem.mathadi_charges) || 0;

            const baseAmount = quantity * price;
            const gstAmount = (baseAmount * gstPercent) / 100;
            const totalAmount = baseAmount + gstAmount + mathadiCharges;

            return {
                id: Date.now() + Math.random(),
                service_id: draftServiceItem.service,
                service_name: selectedService?.name || "",
                category: draftServiceItem.category,
                material_id: materialId,
                material_name: selectedMaterial?.item_code || "",
                quantity: quantity,
                unit: draftServiceItem.unit,
                price: price,
                gst_percent: gstPercent,
                mathadi_charges: mathadiCharges,
                base_amount: baseAmount,
                gst_amount: gstAmount,
                total_amount: totalAmount
            };
        });

        setServiceItems(prev => [...prev, ...newServiceItems]);
    }

    // ✅ IMPORTANT: Update parent component's serviceItems prop if it exists
    // This ensures the data flows back to parent component
    if (mode === "quotation" && onServiceItemsChange) {
        const updatedItems = [...serviceItems];
        onServiceItemsChange(updatedItems);
    }

    // Reset form
    setDraftServiceItem({
        service: "",
        service_type: "",
        category: "",
        material: "",
        quantity: "",
        unit: "NOS",
        price: "",
        gst_percent: "",
        mathadi_charges: ""
    });
};

  const removeServiceItem = (serviceId) => {
    setServiceItems(prev => prev.filter(item => item.id !== serviceId));
  };

  /* ================= EFFECTS ================= */

  useEffect(() => {
    loadBrands();
    loadServiceMaterials();
  }, []);

  useEffect(() => {
    if (selectedMaterials.length > 0) {
      const uniqueBrands = [...new Set(selectedMaterials.map(mat => mat.brand_id).filter(Boolean))];

      if (uniqueBrands.length === 1) {
        updateLowDraft("brand", uniqueBrands[0]);
      } else if (uniqueBrands.length > 1) {
        updateLowDraft("brand", "");
      } else {
        updateLowDraft("brand", "");
      }
    }
  }, [selectedMaterials]);

  useEffect(() => {
    if (selectedMaterials.length === 1) {
      const mat = selectedMaterials[0];
      setDraftLowItem(prev => ({
        ...prev,
        unit: mat.unit || prev.unit
      }));
    }
  }, [selectedMaterials]);

  // Group services by category for display
  const groupedServices = serviceItems.reduce((acc, service) => {
    const categoryName = service.category_name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(service);
    return acc;
  }, {});
  /* ================= RENDER FUNCTIONS ================= */

  const renderMaterialsTab = () => (
    <div className="space-y-4">
      <div className="gap-3">
        <AcMaterialList
          base_api={baseApi}
          resetTrigger={resetMaterials}
          onSelectionChange={(data) => {
            setSelectedMaterials(data.materials || []);
          }}
          showValidation={false}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="number"
          placeholder="Qty"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={draftLowItem.quantity}
          onChange={e => updateLowDraft("quantity", e.target.value)}
        />

        <input
          type="number"
          placeholder={isInvoice ? "Rate" : "Price"}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={isInvoice ? draftLowItem.rate : draftLowItem.unit_price}
          onChange={e => updateLowDraft(isInvoice ? "rate" : "unit_price", e.target.value)}
        />

        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={draftLowItem.brand}
          onChange={e => updateLowDraft("brand", e.target.value)}
          disabled={selectedMaterials.length > 0 &&
            [...new Set(selectedMaterials.map(mat => mat.brand_id).filter(Boolean))].length === 1}
        >
          <option value="">Select Brand</option>
          {(() => {
            if (selectedMaterials.length > 0) {
              const materialBrands = selectedMaterials
                .filter(mat => mat.brand_id && mat.brand_name)
                .map(mat => ({ id: mat.brand_id, name: mat.brand_name }));

              const uniqueBrands = materialBrands.filter((brand, index, self) =>
                index === self.findIndex(b => b.id === brand.id)
              );

              return uniqueBrands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ));
            } else {
              return brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ));
            }
          })()}
        </select>

        {lowSideGstEnabled && (
          <input
            type="number"
            placeholder="GST%"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={draftLowItem.gst_percent}
            onChange={e => updateLowDraft("gst_percent", e.target.value)}
          />
        )}

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

      <div className="grid grid-cols-2 gap-3">
        <input
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="HSN"
          value={draftLowItem.hsn_sac}
          onChange={e => updateLowDraft("hsn_sac", e.target.value)}
        />

        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={draftLowItem.unit}
          onChange={e => updateLowDraft("unit", e.target.value)}
        >
          {unitOptions.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 items-start">
        <textarea
          className="border border-gray-300 rounded-md px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter item description..."
          value={draftLowItem.description}
          onChange={e => updateLowDraft("description", e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-6">
      {/* Service Selection Form */}
      {/* Service Selection Form */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <h4 className="text-md font-medium mb-4">Add Installation Work Service</h4>

        {/* ROW 1: Service Name & Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Service Name Dropdown */}
          <select
            value={draftServiceItem.service}
            onChange={(e) => handleMaterialChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Service</option>
            {materials.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>

          {/* Material Dropdown - ONLY if Material-Based */}
          {draftServiceItem.service_type === 'MATERIAL' && (
            <select
              onChange={(e) => {
                const val = parseInt(e.target.value);
                const currentMaterials = draftServiceItem.material
                  ? draftServiceItem.material.split(',').map(Number)
                  : [];
                if (val && !currentMaterials.includes(val)) {
                  updateServiceDraft("material", [...currentMaterials, val].join(','));
                }
                e.target.value = "";
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Material</option>
              {materials
                .find(s => s.id === parseInt(draftServiceItem.service))
                ?.items?.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.item_code}
                  </option>
                )) || []}
            </select>
          )}
        </div>

        {/* Selected Materials Chips */}
        {draftServiceItem.service_type === 'MATERIAL' && (
          <div className="flex flex-wrap gap-2">
            {(draftServiceItem.material
              ? draftServiceItem.material.split(',').map(Number)
              : [])
              .map((materialId) => {
                const mat = materials
                  .find(s => s.id === parseInt(draftServiceItem.service))
                  ?.items?.find(item => item.id === materialId);

                return mat ? (
                  <div
                    key={materialId}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    {mat.item_code}
                    <button
                      onClick={() => {
                        const currentMaterials = draftServiceItem.material
                          .split(',')
                          .map(Number)
                          .filter(id => id !== materialId);
                        updateServiceDraft("material", currentMaterials.join(','));
                      }}
                      className="text-red-500 font-bold hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : null;
              })}
          </div>
        )}

        {/* ROW 2: Quantity, Unit, GST%, Mathadi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            type="number"
            placeholder="Quantity"
            value={draftServiceItem.quantity}
            onChange={(e) => updateServiceDraft("quantity", e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={draftServiceItem.unit}
            onChange={(e) => updateServiceDraft("unit", e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {unitOptions.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="GST Percentage"
            value={draftServiceItem.gst_percent}
            onChange={(e) => updateServiceDraft("gst_percent", e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Mathadi Charges"
            value={draftServiceItem.mathadi_charges}
            onChange={(e) => updateServiceDraft("mathadi_charges", e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ROW 3: Price */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="number"
            placeholder="Price per unit"
            value={draftServiceItem.price}
            onChange={(e) => updateServiceDraft("price", e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Add Service Button */}
        <button
          type="button"
          onClick={addServiceItem}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          + Add Service
        </button>
      </div>
    </div>
  );
  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <style>
        {`
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
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${highSideGstEnabled
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
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Product *
            </label>
            <SmartProductSelect
              baseApi={baseApi}
              authToken={authToken}
              placeholder="Search: LG 1.5 ton split, Daikin inverter, Blue Star window..."
              onSelect={(product) => {
                setDraftHighItem(prev => ({
                  ...prev,
                  product_variant: product.id,
                  ac_type_name: product.ac_type_name,
                  ac_sub_type_name: product.ac_sub_type_name,
                  brand_name: product.brand_name,
                  model_no: product.model_name,
                  variant_sku: product.variant_sku
                }));
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={draftHighItem.unit}
              onChange={e => updateHighDraft("unit", e.target.value)}>
              {unitOptions.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          {!isInvoice && (
            <div className="grid grid-cols-5 gap-3">
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 col-span-1"
                type="number"
                placeholder="Mathadi Charges"
                value={draftHighItem.mathadi_charges}
                onChange={e => updateHighDraft("mathadi_charges", e.target.value)}
              />

              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 col-span-1"
                type="number"
                placeholder="Transportation Charges"
                value={draftHighItem.transportation_charges}
                onChange={e => updateHighDraft("transportation_charges", e.target.value)}
              />

              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 col-span-3"
                placeholder="HSN"
                value={draftHighItem.hsn_sac}
                onChange={e => updateHighDraft("hsn_sac", e.target.value)}
              />
            </div>
          )}

          {isInvoice && (
            <div className="grid grid-cols-2 gap-3">
              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="HSN"
                value={draftHighItem.hsn_sac}
                onChange={e => updateHighDraft("hsn_sac", e.target.value)} />
            </div>
          )}

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
                <tbody>
                  {items.map((row, i) => {
                    const variantName = row.variant_sku || row.product_variant;
                    return (
                      <tr key={i} className="border-b">
                        <td className="w-12 px-2 py-2 border-r">{i + 1}</td>
                        <td className="w-40 px-2 py-2 border-r truncate">{variantName}</td>
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
      {/* ================= LOW SIDE WITH TABS ================= */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-gray-700">Low Side Items</h3>
            <button
              type="button"
              onClick={() => setLowSideGstEnabled(!lowSideGstEnabled)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${lowSideGstEnabled
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
                }`}
            >
              GST {lowSideGstEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <button
            type="button"
            onClick={lowSideActiveTab === "materials" ? addLowItem : addServiceItem}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            + Add {lowSideActiveTab === "materials" ? "Product" : "Service"}
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setLowSideActiveTab("materials")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${lowSideActiveTab === "materials"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Materials
              </button>
              <button
                type="button"
                onClick={() => setLowSideActiveTab("services")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${lowSideActiveTab === "services"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Services
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {lowSideActiveTab === "materials" ? renderMaterialsTab() : renderServicesTab()}
        </div>

        {/* Services Table */}
{serviceItems.length > 0 && (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Service / Material</th>
                    <th className="px-4 py-3 text-left font-medium">Unit</th>
                    <th className="px-4 py-3 text-left font-medium">Qty</th>
                    <th className="px-4 py-3 text-left font-medium">Price</th>
                    <th className="px-4 py-3 text-left font-medium">GST%</th>
                    <th className="px-4 py-3 text-center font-medium">Total</th>
                    <th className="px-4 py-3 text-center font-medium">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {(() => {
                    let serviceIndex = 1;
                    const serviceGroups = {};
                    
                    // Group items by service
                    serviceItems.forEach(item => {
                        if (!serviceGroups[item.service_id]) {
                            serviceGroups[item.service_id] = [];
                        }
                        serviceGroups[item.service_id].push(item);
                    });
                    
                    return Object.entries(serviceGroups).map(([serviceId, items], groupIdx) => {
                        const rows = [];
                        
                        // Add service header row
                        rows.push(
                            <tr key={`service-${serviceId}`} className="bg-gray-50 hover:bg-gray-100">
                                <td className="px-4 py-3 font-bold text-lg">{serviceIndex}</td>
                                <td className="px-4 py-3 font-semibold">
                                    {items[0].service_name} <span className="text-gray-600 text-sm"> {items[0].category}</span>
                                </td>
                                <td colSpan="6"></td>
                            </tr>
                        );
                        
                        // Add material rows
                        items.forEach((item, materialIndex) => {
                            rows.push(
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold">{serviceIndex}.{materialIndex + 1}</td>
                                    <td className="px-4 py-3">{item.material_name}</td>
                                    <td className="px-4 py-3">{item.unit}</td>
                                    
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const updated = [...serviceItems];
                                                const idx = serviceItems.findIndex(i => i.id === item.id);
                                                updated[idx].quantity = parseFloat(e.target.value) || 0;
                                                updated[idx].base_amount = updated[idx].quantity * updated[idx].price;
                                                updated[idx].gst_amount = (updated[idx].base_amount * updated[idx].gst_percent) / 100;
                                                updated[idx].total_amount = updated[idx].base_amount + updated[idx].gst_amount + updated[idx].mathadi_charges;
                                                setServiceItems(updated);
                                            }}
                                            className="w-16 border border-gray-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => {
                                                const updated = [...serviceItems];
                                                const idx = serviceItems.findIndex(i => i.id === item.id);
                                                updated[idx].price = parseFloat(e.target.value) || 0;
                                                updated[idx].base_amount = updated[idx].quantity * updated[idx].price;
                                                updated[idx].gst_amount = (updated[idx].base_amount * updated[idx].gst_percent) / 100;
                                                updated[idx].total_amount = updated[idx].base_amount + updated[idx].gst_amount + updated[idx].mathadi_charges;
                                                setServiceItems(updated);
                                            }}
                                            className="w-20 border border-gray-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.gst_percent}
                                            onChange={(e) => {
                                                const updated = [...serviceItems];
                                                const idx = serviceItems.findIndex(i => i.id === item.id);
                                                updated[idx].gst_percent = parseFloat(e.target.value) || 0;
                                                updated[idx].gst_amount = (updated[idx].base_amount * updated[idx].gst_percent) / 100;
                                                updated[idx].total_amount = updated[idx].base_amount + updated[idx].gst_amount + updated[idx].mathadi_charges;
                                                setServiceItems(updated);
                                            }}
                                            className="w-16 border border-gray-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    
                                    <td className="px-4 py-3 text-right font-semibold">₹{item.total_amount.toFixed(2)}</td>
                                    
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => removeServiceItem(item.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        });
                        
                        serviceIndex++;
                        return rows;
                    }).flat();
                })()}
            </tbody>
        </table>
    </div>
)}
      </div>
    </div>
  );
}