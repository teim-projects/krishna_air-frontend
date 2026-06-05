// AddServiceModal.jsx - Replace the entire content
import { useState, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";

const AddServiceModal = ({ isOpen, onClose, baseApi, onServiceAdd }) => {
  const [items, setItems] = useState([]);

  const [formData, setFormData] = useState({
    service_name: "",
    service_subcategory: "",
    description: "",
    service_type: "",
    item: "",
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
    }
  }, [isOpen]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      service_name: "",
      service_subcategory: "",
      description: "",
      service_type: "",
      item: "",
      unit: "Nos",
      labor_rate: 0,
      sequence: 0
    });
  };

  // Save service
  const handleSave = async () => {
    try {
      if (!formData.service_name.trim() || !formData.service_type) {
        alert("Service Name and Service Type are required");
        return;
      }

      setLoading(true);

      // First create category if it doesn't exist
      let categoryId = null;
      try {
        const categoryPayload = {
          name: formData.service_name.trim(),
          description: formData.description.trim(),
          sequence: parseInt(formData.sequence) || 0,
          is_active: true
        };

        const categoryResponse = await axios.post(
          `${baseApi}/quotation/service-categories-create/`,
          categoryPayload,
          authHeaders()
        );
        categoryId = categoryResponse.data.id;
      } catch (err) {
        console.error("Error creating category:", err);
      }

      // Create subcategory if provided
      let subcategoryId = null;
      if (formData.service_subcategory.trim() && categoryId) {
        try {
          const subcategoryPayload = {
            category: categoryId,
            name: formData.service_subcategory.trim(),
            description: formData.description.trim(),
            sequence: parseInt(formData.sequence) || 0,
            is_active: true
          };

          const subcategoryResponse = await axios.post(
            `${baseApi}/quotation/service-subcategories/`,
            subcategoryPayload,
            authHeaders()
          );
          subcategoryId = subcategoryResponse.data.id;
        } catch (err) {
          console.error("Error creating subcategory:", err);
        }
      }

      // Create service master
      const servicePayload = {
        category: categoryId,
        subcategory: subcategoryId,
        name: formData.service_subcategory.trim() || formData.service_name.trim(),
        description: formData.description.trim(),
        service_type: formData.service_type,
        item: formData.service_type === 'MATERIAL' && formData.item ? parseInt(formData.item) : null,
        unit: formData.unit,
        labor_rate: parseFloat(formData.labor_rate) || 0,
        sequence: parseInt(formData.sequence) || 0,
        is_active: true
      };

      const response = await axios.post(
        `${baseApi}/quotation/service-masters-create/`,
        servicePayload,
        authHeaders()
      );

      console.log("Service created successfully:", response.data);
      console.log("Calling onServiceAdd callback...");
      alert("Service created successfully!");
      handleReset();
      onClose();

      // Notify parent component to refresh the list
      if (onServiceAdd) {
        console.log("Executing onServiceAdd callback");
        onServiceAdd();
      } else {
        console.log("WARNING: onServiceAdd callback not provided");
      }

    } catch (err) {
      console.error("Error saving service:", err);
      alert(`Error: ${err.response?.data?.detail || err.message}`);
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

        <h1 className="text-2xl font-bold mb-1">Add Service</h1>
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
                <label className="text-sm font-normal text-gray-600">Service Subcategory</label>
                <input
                  type="text"
                  name="service_subcategory"
                  value={formData.service_subcategory}
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
                <label className="text-sm font-normal text-gray-600">Linked Item</label>
                <select
                  name="item"
                  value={formData.item}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} - {item.material_type_name}
                    </option>
                  ))}
                </select>
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
              {loading ? "Saving..." : "Save Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;
