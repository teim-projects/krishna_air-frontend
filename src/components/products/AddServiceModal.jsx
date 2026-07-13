import { useState, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";
import Select from "react-select";

const AddServiceModal = ({ isOpen, onClose, baseApi, serviceToEdit, onServiceAdd }) => {
  const [items, setItems] = useState([]);

  const [formData, setFormData] = useState({
    service_name: "",
    service_category: "",
    description: "",
    service_type: "",
    items: [],
    unit: "Nos",
    labor_rate: 0,
    sequence: 0
  });

  const [loading, setLoading] = useState(false);

  // Unit options
  const UNIT_OPTIONS = ["Nos", "Mtr", "Kg", "Lot", "Sqft", "Sqmt", "Ft", "Set"];

  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
  });

  // Fetch Items for material-based services
  const fetchItems = async () => {
    try {
      const res = await axios.get(
        `${baseApi}/product/item/?all=true`,
        authHeaders()
      );
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setItems(data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();

      if (serviceToEdit) {
        const linkedItemIds = Array.isArray(serviceToEdit.items)
          ? serviceToEdit.items.map((i) => (typeof i === "object" && i !== null ? i.id : i))
          : [];

        setFormData({
          service_name: serviceToEdit.name || "",
          service_category: serviceToEdit.category || serviceToEdit.service_category || "",
          description: serviceToEdit.description || "",
          service_type: serviceToEdit.service_type || "",
          items: linkedItemIds,
          unit: serviceToEdit.unit || "Nos",
          labor_rate: serviceToEdit.labor_rate || 0,
          sequence: serviceToEdit.sequence || 0
        });
      } else {
        handleReset();
      }
    }
  }, [isOpen, serviceToEdit]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      service_name: "",
      service_category: "",
      description: "",
      service_type: "",
      items: [],
      unit: "",
      labor_rate: 0,
      sequence: 0
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.service_name || !formData.service_name.trim() || !formData.service_type) {
        alert("Service Name and Service Type are required");
        return;
      }

      setLoading(true);

      const servicePayload = {
        category: (formData.service_category || "").trim(),  // ✅ FIXED: was service_name
        subcategory: "",  // Optional, can be added later if needed
        name: (formData.service_name || "").trim(),
        description: (formData.description || "").trim(),
        service_type: formData.service_type || "",
        items: formData.service_type === 'MATERIAL' ? (formData.items || []) : [],
        unit: formData.unit || "",
        labor_rate: parseFloat(formData.labor_rate) || 0,
        sequence: 0,
        is_active: true
      };

      console.log("Sending payload:", servicePayload);

      let response;
      if (serviceToEdit) {
        response = await axios.put(
          `${baseApi}/quotation/service-masters-create/${serviceToEdit.id}/`,
          servicePayload,
          authHeaders()
        );
        console.log("Service updated successfully:", response.data);
        alert("Service updated successfully!");
      } else {
        response = await axios.post(
          `${baseApi}/quotation/service-masters-create/`,
          servicePayload,
          authHeaders()
        );
        console.log("Service created successfully:", response.data);
        alert("Service created successfully!");
      }

      handleReset();
      onClose();
      if (onServiceAdd) {
        onServiceAdd();
      }

    } catch (err) {
      console.error("Error saving service:", err);
      console.error("Error response:", err.response?.data);
      alert(`Error: ${err.response?.data?.detail || err.response?.data || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    handleReset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start sm:items-center p-6 z-50 mt-15">
      <div className="relative w-full max-w-2xl p-6 bg-white rounded-md shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-xl text-gray-500 hover:text-black"
        >
          <RxCross2 />
        </button>

        <h1 className="text-2xl font-bold mb-1">{serviceToEdit ? "Edit Service" : "Add Service"}</h1>
        <p className="text-sm text-gray-500 mb-6">Service Management System</p>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            {/* Row 1: Service Name & Service Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-normal text-gray-600">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="service_name"
                  value={formData.service_name}
                  onChange={handleChange}
                  placeholder="e.g., REFRIGERANT PIPING"
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-normal text-gray-600">Service Category</label>
                <input
                  type="text"
                  name="service_category"
                  value={formData.service_category}
                  onChange={handleChange}
                  placeholder="e.g., between IDU to ODU"
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Service Type */}
            <div>
              <label className="text-sm font-normal text-gray-600">Service Type</label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Service Type</option>
                <option value="LABOR">Labor Only</option>
                <option value="MATERIAL">Material Based</option>
              </select>
            </div>

            {/* Item Selection (only for MATERIAL type) */}
            {formData.service_type === 'MATERIAL' && (
              <div>
                <label className="text-sm font-normal text-gray-600 mb-1 block">Linked Items</label>
                <Select
                  isMulti
                  options={items.map((item) => ({
                    value: item.id,
                    label: `${item.item_code} - ${item.material_type_name || ""}`,
                  }))}
                  value={items
                    .map((item) => ({
                      value: item.id,
                      label: `${item.item_code} - ${item.material_type_name || ""}`,
                    }))
                    .filter((opt) => formData.items.includes(opt.value))}
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      items: selected ? selected.map((s) => s.value) : [],
                    }))
                  }
                  placeholder="Search and select items..."
                  className="mt-1"
                />
              </div>
            )}

            {/* Row 2: Unit & Labor Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-normal text-gray-600">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Unit</option>
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-normal text-gray-600">Labor Rate (₹)</label>
                <input
                  type="number"
                  name="labor_rate"
                  value={formData.labor_rate}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-normal text-gray-600">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Enter service description..."
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              🔄 Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Saving..." : (serviceToEdit ? "Update Service" : "Save Service")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;
