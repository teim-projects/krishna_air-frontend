import { useState } from "react";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";

const AddServiceModal = ({ isOpen, onClose, baseApi, onServiceAdd }) => {
  const [formData, setFormData] = useState({
    category_name: "",
    category_description: "",
    subcategory_name: "",
    subcategory_description: "",
    sequence: 0
  });

  const [loading, setLoading] = useState(false);

  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
  });

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      category_name: "",
      category_description: "",
      subcategory_name: "",
      subcategory_description: "",
      sequence: 0
    });
  };

  // Save service category and subcategory
  const handleSave = async () => {
    try {
      if (!formData.category_name.trim()) {
        alert("Category name is required");
        return;
      }

      setLoading(true);

      // First create the category
      const categoryPayload = {
        name: formData.category_name.trim(),
        description: formData.category_description.trim(),
        sequence: parseInt(formData.sequence) || 0,
        is_active: true
      };

      const categoryResponse = await axios.post(
        `${baseApi}/quotation/service-categories-create/`,
        categoryPayload,
        authHeaders()
      );

      console.log("Category created:", categoryResponse.data);

      // If subcategory is provided, create it
      if (formData.subcategory_name.trim()) {
        const subcategoryPayload = {
          category: categoryResponse.data.id,
          name: formData.subcategory_name.trim(),
          description: formData.subcategory_description.trim(),
          sequence: parseInt(formData.sequence) || 0,
          is_active: true
        };

        const subcategoryResponse = await axios.post(
          `${baseApi}/quotation/service-subcategories/`,
          subcategoryPayload,
          authHeaders()
        );

        console.log("Subcategory created:", subcategoryResponse.data);
      }

      alert("Service category created successfully!");
      handleReset();
      onClose();
      
      // Notify parent component
      if (onServiceAdd) {
        onServiceAdd();
      }

    } catch (err) {
      console.error("Error saving service:", err);
      alert(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start sm:items-center p-6 z-50 mt-15">
      <div className="relative w-full max-w-2xl p-6 bg-white rounded-md shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl text-gray-500 hover:text-black"
        >
          <RxCross2 />
        </button>

        <h1 className="text-2xl font-bold mb-1">Add Service Category</h1>
        <p className="text-sm text-gray-500 mb-6">Service Category Management System</p>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Form Fields */}
          <div className="space-y-4">
            {/* Category Name */}
            <div>
              <label className="text-sm font-normal text-gray-600">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="category_name"
                value={formData.category_name}
                onChange={handleChange}
                placeholder="e.g., REFRIGERANT PIPING, CONTROL CABLING"
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Description */}
            <div>
              <label className="text-sm font-normal text-gray-600">Category Description</label>
              <textarea
                name="category_description"
                value={formData.category_description}
                onChange={handleChange}
                rows={3}
                placeholder="Enter category description..."
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Subcategory Name */}
            <div>
              <label className="text-sm font-normal text-gray-600">Subcategory Name (Optional)</label>
              <input
                type="text"
                name="subcategory_name"
                value={formData.subcategory_name}
                onChange={handleChange}
                placeholder="e.g., between IDU to ODU, with Insulation"
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Subcategory Description */}
            <div>
              <label className="text-sm font-normal text-gray-600">Subcategory Description</label>
              <textarea
                name="subcategory_description"
                value={formData.subcategory_description}
                onChange={handleChange}
                rows={3}
                placeholder="Enter subcategory description..."
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Sequence */}
            <div>
              <label className="text-sm font-normal text-gray-600">Display Order</label>
              <input
                type="number"
                name="sequence"
                value={formData.sequence}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="w-full mt-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
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
