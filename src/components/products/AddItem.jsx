import { useState, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";
import ManageItemTypes from "./ManageItemTypes";

const AddItem = ({ open, onClose, base_api, editMode = false, itemData = null }) => {
  // Unit options arrays
  const LENGTH_UNITS = ["mm", "cm", "in", "Ft", "mt", "Rmt", "Sqmt", "Sqft", "Swg", "Nos", "Kg", "Lot"];
  const DENSITY_UNITS = ["g/cm³", "kg/m³"];

  const [showManageModal, setShowManageModal] = useState(false);

  // Dropdown options from API
  const [materialTypes, setMaterialTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [featureTypes, setFeatureTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [brands, setBrands] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    material_type_id: "",
    item_type_id: "",
    feature_type_id: "",
    item_class_id: "",
    size: "",
    size_unit: "mm",
    thickness: "",
    thickness_unit: "mm",
    density: "",
    density_unit: "g/cm³",
    brand: "",
    description: ""
  });

  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
  });

  // Fetch Material Types
  const fetchMaterialTypes = async () => {
    try {
      const res = await axios.get(`${base_api}/product/material-type/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setMaterialTypes(rows);
    } catch (err) {
      console.error("Error fetching Material Types:", err);
    }
  };

  // Fetch Item Types
  const fetchItemTypes = async () => {
    try {
      const res = await axios.get(`${base_api}/product/item-type/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setItemTypes(rows);
    } catch (err) {
      console.error("Error fetching Item Types:", err);
    }
  };

  // Fetch Feature Types
  const fetchFeatureTypes = async () => {
    try {
      const res = await axios.get(`${base_api}/product/feature-type/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setFeatureTypes(rows);
    } catch (err) {
      console.error("Error fetching Feature Types:", err);
    }
  };

  // Fetch Classes
  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${base_api}/product/item-class/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setClasses(rows);
    } catch (err) {
      console.error("Error fetching Classes:", err);
    }
  };

  // Fetch Brands
  const fetchBrands = async () => {
    try {
      const res = await axios.get(`${base_api}/product/ac-brand/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setBrands(rows);
    } catch (err) {
      console.error("Error fetching Brands:", err);
    }
  };

  // Fetch all data when modal opens
  useEffect(() => {
    if (!open) return;

    fetchMaterialTypes();
    fetchItemTypes();
    fetchFeatureTypes();
    fetchClasses();
    fetchBrands();
  }, [open, base_api]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editMode && itemData) {
      setFormData({
        material_type_id: itemData.material_type_id || "",
        item_type_id: itemData.item_type_id || "",
        feature_type_id: itemData.feature_type_id || "",
        item_class_id: itemData.item_class_id || "",
        size: itemData.size || "",
        size_unit: itemData.size_unit || "mm",
        thickness: itemData.thickness || "",
        thickness_unit: itemData.thickness_unit || "mm",
        density: itemData.density || "",
        density_unit: itemData.density_unit || "g/cm³",
        brand: itemData.brand || "",
        description: itemData.description || ""
      });
    } else if (!editMode) {
      // Reset form for Add mode
      handleReset();
    }
  }, [editMode, itemData, open]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      material_type_id: "",
      item_type_id: "",
      feature_type_id: "",
      item_class_id: "",
      size: "",
      size_unit: "mm",
      thickness: "",
      thickness_unit: "mm",
      density: "",
      density_unit: "g/cm³",
      brand: "",
      description: ""
    });
  };

  // Save item (Add or Edit)
  const handleSave = async () => {
    try {
      if (!formData.material_type_id || !formData.item_type_id) {
        alert("Please fill all required fields");
        return;
      }

      // Build payload matching backend expectations
      const payload = {
        material_type_id: parseInt(formData.material_type_id),
        item_type_id: parseInt(formData.item_type_id),
        feature_type_id: formData.feature_type_id ? parseInt(formData.feature_type_id) : null,
        item_class_id: formData.item_class_id ? parseInt(formData.item_class_id) : null,
        size: formData.size,
        size_unit: formData.size_unit,
        thickness: formData.thickness,
        thickness_unit: formData.thickness_unit,
        density: formData.density,
        density_unit: formData.density_unit,
        brand: formData.brand ? parseInt(formData.brand) : null,
        description: formData.description
      };

      console.log("Sending payload:", payload);

      if (editMode && itemData) {
        // UPDATE existing item (PUT request)
        const response = await axios.put(
          `${base_api}/product/item/${itemData.id}/`,
          payload,
          authHeaders()
        );
        console.log("Item updated:", response.data);
        alert("Item updated successfully!");
      } else {
        // CREATE new item (POST request)
        const response = await axios.post(
          `${base_api}/product/item/`,
          payload,
          authHeaders()
        );
        console.log("Item created:", response.data);
        alert("Item saved successfully!");
      }

      handleReset();
      onClose();
    } catch (err) {
      console.error("Error saving item:", err);
      console.error("Error response:", err.response?.data);
      alert(`Error: ${JSON.stringify(err.response?.data) || err.message}`);
    }
  };


  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex justify-center items-start sm:items-center p-6 z-50 mt-15">
        <div className="relative w-full max-w-2xl p-6 bg-white rounded-md shadow-lg max-h-[90vh] overflow-y-auto">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-xl text-gray-500 hover:text-black"
          >
            <RxCross2 />
          </button>

          <h1 className="text-2xl font-bold mb-1">
            {editMode ? "Edit Item" : "Add Item"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">Item Master Management System</p>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Manage Button Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-blue-900 font-semibold text-base">Manage Material Types</h3>
                <p className="text-blue-700 text-sm">Add custom material types, item types, feature types, and classes</p>
              </div>
              <button
                type="button"
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Row 1: Material Type & Item Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-normal text-gray-600">
                    Material Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="material_type_id"
                    value={formData.material_type_id}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Material Type</option>
                    {materialTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-600">
                    Item Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="item_type_id"
                    value={formData.item_type_id}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Item Type</option>
                    {itemTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Feature Type & Class */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-normal text-gray-600">
                    Feature Type</label>
                  <select
                    name="feature_type_id"
                    value={formData.feature_type_id}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Feature Type</option>
                    {featureTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-600">Class</label>
                  <select
                    name="item_class_id"
                    value={formData.item_class_id}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Class</option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Size & Thickness */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-normal text-gray-600">Size</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      placeholder="Enter size"
                      className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                    <select
                      name="size_unit"
                      value={formData.size_unit}
                      onChange={handleChange}
                      className="w-20 px-2 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      {LENGTH_UNITS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-normal text-gray-600">Thickness</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      name="thickness"
                      value={formData.thickness}
                      onChange={handleChange}
                      placeholder="Enter thickness"
                      className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                    <select
                      name="thickness_unit"
                      value={formData.thickness_unit}
                      onChange={handleChange}
                      className="w-20 px-2 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      {LENGTH_UNITS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 4: Density */}
              <div>
                <label className="text-sm font-normal text-gray-600">Density</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    name="density"
                    value={formData.density}
                    onChange={handleChange}
                    placeholder="Enter density"
                    className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    name="density_unit"
                    value={formData.density_unit}
                    onChange={handleChange}
                    className="w-24 px-2 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    {DENSITY_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Brand */}
              <div>
                <label className="text-sm font-normal text-gray-600">
                  Brand
                </label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Brand</option>
                  {brands.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 6: Description */}
              <div>
                <label className="text-sm font-normal text-gray-600">Non Standard Feature</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter detailed description of the item..."
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                🔄 Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editMode ? "Update Item" : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Manage Item Types Modal */}
      <ManageItemTypes
        open={showManageModal}
        onClose={() => {
          setShowManageModal(false);
          // Refresh dropdowns after managing types
          fetchMaterialTypes();
          fetchItemTypes();
          fetchFeatureTypes();
          fetchClasses();
        }}
        base_api={base_api}
      />
    </>
  );
};

export default AddItem;
