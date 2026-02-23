import React, { useEffect, useState } from "react";
import { FiX, FiTrash2 } from "react-icons/fi";
import axios from "axios";

const AddModelForm = ({ open, base_api, authHeaders, onClose, onSuccess, model }) => {
  const BASE_API = base_api;
  const [isPart, setIsPart] = useState(false);
  const [variants, setVariants] = useState([
    { capacity: "", star: "", mrp: "", dp: "", active: true },
  ]);

  // fetch Ac Types, Subtypes, Brands here using BASE_API and populate the dropdowns

  const [acTypes, setAcTypes] = useState([]);
  const [selectedAcType, setSelectedAcType] = useState("");
  const [subtypes, setSubtypes] = useState([]);
  const [selectedSubtype, setSelectedSubtype] = useState("");
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");

  const [modelName, setModelName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [phase, setPhase] = useState("");
  const [year, setYear] = useState("");
  const [inverter, setInverter] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [partName, setPartName] = useState("");
  const [modelNoIdu, setModelNoIdu] = useState("");
  const [modelNoOdu, setModelNoOdu] = useState("");
  const [description, setDescription] = useState("");

  // console.log("selectedAcType",selectedAcType);

  const fetchAcTypes = async () => {
    try {
      const res = await axios.get(`${BASE_API}/api/product/actype/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setAcTypes(rows);
      // console.log("Ac Types:", rows);
    }
    catch (err) {
      console.error("Error fetching AC Types:", err);
    }

  }


  const fetchSubtypes = async (acTypeId) => {
    try {
      const res = await axios.get(`${BASE_API}/api/product/ac-subtypes/?ac_type_id=${acTypeId}`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setSubtypes(rows);
      // console.log("Subtypes:", rows);
    }
    catch (err) {
      console.error("Error fetching Subtypes:", err);
    }
  }

  const fetchBrands = async () => {
    try {
      const res = await axios.get(`${BASE_API}/api/product/ac-brand/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setBrands(rows);
      // console.log("Brands:", rows);
    }
    catch (err) {
      console.error("Error fetching Brands:", err);
    }
  }



  useEffect(() => {
    if (open) {
      fetchAcTypes();
      fetchBrands();
    }
  }, [open]);



  useEffect(() => {
    if (!model || !open) return;

    setModelName(model.name || "");
    setModelNumber(model.model_no || "");
    setSelectedSubtype(model.ac_sub_type_id || "");
    setSelectedBrand(model.brand_id || "");
    setPhase(model.phase || "");
    setInverter(model.inverter ?? false);
    setIsActive(model.is_active ?? true);
    setYear(model.year_of_manufacture || "");
    setDescription(model.description || "");
    setIsPart(!!model.is_part);
    setPartName(model.part_name || "");
    setModelNoIdu(model.model_no_idu || "");
    setModelNoOdu(model.model_no_odu || "");

    // 🔥 Important: derive AC Type from Subtype
    if (model.ac_type_id) {
      setSelectedAcType(model.ac_type_id);
      fetchSubtypes(model.ac_type_id);
    }
  }, [model, open]);


  if (!open) return null;

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { capacity: "", star: "", mrp: "", dp: "", active: true },
    ]);
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index, key, value) => {
    const updated = [...variants];
    updated[index][key] = value;
    setVariants(updated);
  };

  // const addModel = async () => {
  //   if (!modelName.trim() || !modelNumber.trim() || !selectedSubtype) {
  //     alert("Please fill in all required fields (marked with *)");
  //     return;
  //   }

  //   const payload = {
  //     name: modelName,
  //     model_no: modelNumber,
  //     ac_sub_type_id: selectedSubtype,
  //     brand_id: selectedBrand || null,
  //     phase: phase || null,
  //     inverter: inverter,
  //     is_active: isActive,
  //     is_part: isPart,
  //     year_of_manufacture: year ? Number(year) : null,
  //     part_name: isPart ? partName : "",
  //     model_no_idu: isPart ? modelNoIdu : "",
  //     model_no_odu: isPart ? modelNoOdu : "",
  //     description: description || "",
  //   };

  //   try {
  //     const res = await axios.post(
  //       `${BASE_API}/api/product/product-model/`,
  //       payload,
  //       authHeaders()
  //     );

  //     const productModelId = res.data.id; // 👈 important
  //     console.log("Model created:", productModelId);

  //     // 👉 Step 2: Create Variants
  //     await createVariants(productModelId);

  //     alert("✅ Model + Variants added successfully!");
  //     onSuccess?.(res.data);
  //     onClose?.();
  //   } catch (err) {
  //     console.error("❌ Error creating model:", err?.response?.data || err);
  //     alert("Failed to add model.");
  //   }
  // };

  const saveModel = async () => {
    if (!modelName.trim() || !modelNumber.trim() || !selectedSubtype) {
      alert("Please fill required fields");
      return;
    }

    const payload = {
      name: modelName,
      model_no: modelNumber,
      ac_sub_type_id: selectedSubtype || null,
      brand_id: selectedBrand || null,
      phase,
      inverter,
      is_active: isActive,
      year_of_manufacture: year || null,
      description,
    };

    try {
      let res;

      if (model?.id) {
        // ✅ UPDATE model only (variants handled in Variant modal)
        await axios.put(
          `${BASE_API}/api/product/product-model/${model.id}/`,
          payload,
          authHeaders()
        );
        alert("✅ Model updated");
      } else {
        // ✅ CREATE model
        res = await axios.post(
          `${BASE_API}/api/product/product-model/`,
          payload,
          authHeaders()
        );

        const productModelId = res.data.id;   // 👈 IMPORTANT

        // ✅ CREATE variants after model is created
        if (variants.length > 0) {
          await createVariants(productModelId);
        }

        alert("✅ Model + Variants created");
      }

      onSuccess();
    } catch (err) {
      console.error("❌ Save model failed:", err?.response?.data || err);
      alert("Failed to save model");
    }
  };



  const createVariants = async (productModelId) => {
    const validVariants = variants.filter(v =>
      v.capacity && v.star && v.mrp && v.dp
    );

    if (validVariants.length === 0) return;

    const requests = validVariants.map((v) => {
      const variantPayload = {
        product_model: productModelId,
        capacity: v.capacity,
        star_rating: Number(v.star),
        mrp: Number(v.mrp),
        dp: Number(v.dp),
        is_active: v.active ?? true,
      };

      return axios.post(
        `${BASE_API}/api/product/product-variant/`,
        variantPayload,
        authHeaders()
      );
    });

    await Promise.all(requests);
  };



  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mt-12 max-h-[90vh] overflow-hidden flex flex-col">


      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">
          Add Product Model
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <FiX size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

        <h3 className="text-lg font-semibold text-gray-900">Model Details</h3>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AC Type *</label>
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedAcType}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedAcType(id);
                setSelectedSubtype("");
                fetchSubtypes(id);
              }}
            >
              <option>Select AC Type</option>
              {acTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AC Subtype</label>
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedSubtype}
              onChange={(e) => setSelectedSubtype(e.target.value)}
              disabled={!selectedAcType}
            >
              <option>Select Subtype</option>
              {subtypes.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option>Select Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model Name *</label>
            <input
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter model name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model Number *</label>
            <input
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter model number"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}

            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
            >
              <option>Select Phase</option>
              <option>1 Phase</option>
              <option>3 Phase</option>

            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-6 pb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" name="inverter"
                checked={inverter} onChange={(e) => setInverter(e.target.checked)}
              />
              Inverter
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isPart}
                onChange={(e) => setIsPart(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              Is Part
            </label>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="radio" name="status" value="active"
                checked={isActive === true} onChange={() => setIsActive(true)}
                className="text-blue-600" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="radio" name="status" value="inactive"
                checked={isActive === false} onChange={() => setIsActive(false)}
                className="text-blue-600" />
              Inactive
            </label>
          </div>
        </div>

        {/* ✅ Part Fields */}
        {isPart && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input className="px-4 py-2.5 border border-gray-300 rounded-lg" placeholder="Part Name"
              value={partName} onChange={(e) => setPartName(e.target.value)} />

            <input className="px-4 py-2.5 border border-gray-300 rounded-lg" placeholder="Model No IDU"
              value={modelNoIdu} onChange={(e) => setModelNoIdu(e.target.value)} />

            <input className="px-4 py-2.5 border border-gray-300 rounded-lg" placeholder="Model No ODU"
              value={modelNoOdu} onChange={(e) => setModelNoOdu(e.target.value)} />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Variants */}
        {/* Variants (Only show when creating a new model) */}
        {!model && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
              <button
                onClick={addVariant}
                className="text-blue-600 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                >
                  {/* Inputs */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g. 1.5 Ton"
                        value={v.capacity}
                        onChange={(e) => updateVariant(idx, "capacity", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Star Rating
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        value={v.star}
                        onChange={(e) => updateVariant(idx, "star", e.target.value)}
                      >
                        <option>Select</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Star</option>
                        <option value="3">3 Star</option>
                        <option value="4">4 Star</option>
                        <option value="5">5 Star</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        MRP
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter MRP"
                        value={v.mrp}
                        onChange={(e) => updateVariant(idx, "mrp", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DP
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter DP"
                        value={v.dp}
                        onChange={(e) => updateVariant(idx, "dp", e.target.value)}
                      />
                    </div>

                    <div className="col-span-full mt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={v.active}
                          onChange={(e) => updateVariant(idx, "active", e.target.checked)}
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {variants.length > 1 && (
                    <button
                      onClick={() => removeVariant(idx)}
                      className="mt-8 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Variant"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-8 py-6 border-t border-gray-200 bg-gray-50">
        <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-100">
          Cancel
        </button>
        <button onClick={saveModel}
          className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700">
          {model ? "Update Model" : "Create Model"}
        </button>

      </div>

    </div>


  );
};

export default AddModelForm;
