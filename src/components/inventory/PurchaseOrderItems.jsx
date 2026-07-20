import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import AcMaterialList from "../AcMaterialList";
import { formatLowSideTooltip, formatHighSideTooltip, formatMaterialLabel } from "../../utils/materialLabel";
export default function PurchaseOrderItems({
  baseApi,
  token,
  initialProducts = [],
  onProductsChange
}) {

  const api = axios.create({
    baseURL: baseApi,
    headers: { Authorization: `Bearer ${token}` }
  });

  const [products, setProducts] = useState(initialProducts || []);
  const LENGTH_UNITS = ["Rmt", "Ft", "Smtr", "Meter", "Sqft", "Nos", "Kg", "Lot"];

  useEffect(() => {
    setProducts(initialProducts || []);

    // // Auto-select first section in edit mode
    // const firstSection = (initialProducts || []).find(p => p.is_section);
    // if (firstSection) {
    //   setActiveSection(firstSection.serial_no);
    // }
  }, [initialProducts]);

  // ===================== HIGH SIDE STATES =====================

  const [acTypes, setAcTypes] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);

  const [highForm, setHighForm] = useState({
    acType: "",
    subType: "",
    brand: "",
    model: "",
    variant: "",
    quantity: "",
    rate: "",
    uom: "Nos",
    description: "",
    hsn_sac: ""
  });

  // ===================== LOW SIDE STATES =====================

  const [materialTypes, setMaterialTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [features, setFeatures] = useState([]);
  const [itemClasses, setItemClasses] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [resetMaterials, setResetMaterials] = useState(0);


  const [lowForm, setLowForm] = useState({
    materialType: "",
    itemType: "",
    feature: "",
    itemClass: "",
    item: "",
    brand: "",  // Add brand field
    quantity: "",
    rate: "",
    uom: LENGTH_UNITS[0],
    description: ""
  });


  const DEFAULT_HIGH_FORM = {
    acType: "",
    subType: "",
    brand: "",
    model: "",
    variant: "",
    quantity: "",
    rate: "",
    uom: "Nos",
    description: "",
    hsn_sac: ""
  };

  const DEFAULT_LOW_FORM = {
    materialType: "",
    itemType: "",
    feature: "",
    itemClass: "",
    item: "",
    brand: "",  // Add brand field
    quantity: "",
    rate: "",
    uom: LENGTH_UNITS[0],
    description: "",
    hsn_sac: ""
  };

  // ===================== SECTION STATES =====================

  const [sectionTitle, setSectionTitle] = useState("");
  const [activeSection, setActiveSection] = useState(null);

  // ===================== INITIAL LOAD =====================

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [acRes, materialRes] = await Promise.all([
        api.get("/product/actype/?all=true"),
        api.get("/product/material-type/")
      ]);
      const acData = Array.isArray(acRes.data) ? acRes.data : acRes.data?.results || [];
      const materialData = Array.isArray(materialRes.data) ? materialRes.data : materialRes.data?.results || [];
      setAcTypes(acData);
      setMaterialTypes(materialData);
    } catch (err) {
      console.error("Error loading initial data", err);
    }
  };

  // ===================== HIGH SIDE CASCADE =====================

  // Subtypes depend on AC Type
  useEffect(() => {
    if (!highForm.acType) return;
    api.get(`/product/ac-subtypes/?ac_type_id=${highForm.acType}&all=true`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setSubTypes(data);
      });
  }, [highForm.acType]);

  // Brands 
  useEffect(() => {
    api.get("/product/ac-brand/?all=true")
      .then(res => {
        const data = res.data?.results || res.data || [];
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Brand load error", err));
  }, []);

  // Auto-populate brand when material is selected
  useEffect(() => {
    if (selectedMaterials.length > 0) {
      // Get unique brands from selected materials
      const uniqueBrands = [...new Set(selectedMaterials.map(mat => mat.brand_id).filter(Boolean))];
      
      if (uniqueBrands.length === 1) {
        // If all materials have the same brand, auto-populate it
        setLowForm(prev => ({ ...prev, brand: uniqueBrands[0] }));
      } else if (uniqueBrands.length > 1) {
        // If materials have different brands, clear the selection to let user choose
        setLowForm(prev => ({ ...prev, brand: "" }));
      } else {
        // If no materials have brands, clear the selection
        setLowForm(prev => ({ ...prev, brand: "" }));
      }
    }
  }, [selectedMaterials]);

  // Models depend on subtype and brand
  useEffect(() => {
    if (!highForm.brand || !highForm.subType) return;
    api.get(`/product/product-model/?brand_id=${highForm.brand}&ac_sub_type_id=${highForm.subType}&all=true`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setModels(data);
      });
  }, [highForm.brand, highForm.subType]);

  useEffect(() => {
    if (!highForm.model) return;
    api.get(`/product/product-variant/?product_model=${highForm.model}&all=true`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setVariants(data);
      });
  }, [highForm.model]);

  // ===================== LOW SIDE CASCADE =====================

  useEffect(() => {
    if (!lowForm.materialType) return;
    api.get(`/product/item-type/`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setItemTypes(data);
      });
  }, [lowForm.materialType]);

  useEffect(() => {
    if (!lowForm.itemType) return;
    api.get(`/product/feature-type/`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setFeatures(data);
      });
  }, [lowForm.itemType]);

  useEffect(() => {
    if (!lowForm.itemType) return;
    api.get(`/product/item-class/`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setItemClasses(data);
      });
  }, [lowForm.itemType]);

  useEffect(() => {
    if (!lowForm.itemType) return;
    api.get(`/product/item/?material_type_id=${lowForm.materialType}&item_type_id=${lowForm.itemType}&item_class_id=${lowForm.itemClass}&feature_type_id=${lowForm.feature}&all=true`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setItems(data);
      });
  }, [lowForm.itemType]);








  // ===================== ADD SECTION =====================

  const addSection = () => {
    if (!sectionTitle.trim()) return;

    const sectionCount = products.filter(p => p.is_section).length + 1;
    const serial = sectionCount.toString();

    const newSection = {
      serial_no: serial,
      sort_order: products.length + 1,
      is_section: true,
      section_title: sectionTitle,
      product_variant: null,
      item: null,
      description: null,
      quantity: 0,
      uom: null,
      rate: 0
    };

    const updated = [...products, newSection];
    updateProducts(updated);
    setActiveSection(serial);
    setSectionTitle("");
  };

  // ===================== HELPERS =====================

  const generateItemSerial = (currentList) => {
    const listToUse = currentList || products;
    const hasAnySection = listToUse.some((p) => p.is_section);

    if (!activeSection || !hasAnySection) {
      const count = listToUse.filter((p) => !p.is_section).length;
      return String(count + 1);
    }

    const childCount = listToUse.filter(
      (p) =>
        !p.is_section &&
        p.serial_no &&
        p.serial_no.startsWith(activeSection + ".")
    ).length;

    return `${activeSection}.${childCount + 1}`;
  };

  const getItemInsertIndex = (list) => {
    const listToUse = list || products;
    const hasAnySection = listToUse.some((p) => p.is_section);

    if (!activeSection || !hasAnySection) {
      return listToUse.length;
    }

    return listToUse.reduce((lastIndex, p, i) => {
      if (p.serial_no?.startsWith(activeSection + ".")) return i + 1;
      if (p.serial_no === activeSection) return i + 1;
      return lastIndex;
    }, listToUse.length);
  };

  const renumberProducts = (list) => {
    const hasAnySection = list.some((p) => p.is_section);
    if (!hasAnySection) {
      let n = 0;
      return list.map((p) => {
        if (p.is_section) return p;
        n += 1;
        return { ...p, serial_no: String(n) };
      });
    }

    let sectionCounter = 0;
    const finalList = [];
    list.forEach((p) => {
      if (p.is_section) {
        sectionCounter++;
        p.serial_no = sectionCounter.toString();
        finalList.push(p);
      } else {
        const parent = finalList
          .slice()
          .reverse()
          .find((s) => s.is_section);

        if (parent) {
          const childCount = finalList.filter(
            (x) =>
              !x.is_section &&
              x.serial_no?.startsWith(parent.serial_no + ".")
          ).length;
          p.serial_no = `${parent.serial_no}.${childCount + 1}`;
        } else {
          const flatCount = finalList.filter((x) => !x.is_section).length;
          p.serial_no = String(flatCount + 1);
        }
        finalList.push(p);
      }
    });
    return finalList;
  };

  const updateProducts = (updated) => {
    setProducts(updated);
    onProductsChange(updated);
  };

  // ===================== ADD HIGH PRODUCT =====================

  const addHighProduct = () => {
    if (!highForm.variant) return;

    const selected = variants.find(v => v.id == highForm.variant);
    if (!selected) return;

    const acTypeName = acTypes.find((a) => String(a.id) === String(highForm.acType))?.name;
    const subTypeName = subTypes.find((s) => String(s.id) === String(highForm.subType))?.name;
    const brandName = brands.find((b) => String(b.id) === String(highForm.brand))?.name;
    const modelName = models.find((m) => String(m.id) === String(highForm.model))?.name;

    const newProduct = {
      serial_no: generateItemSerial(),
      sort_order: products.length + 1,
      is_section: false,
      section_title: null,
      product_variant: selected.id,
      variant_sku: selected.variant_sku || selected.sku,
      ac_type_name: acTypeName,
      ac_sub_type_name: subTypeName,
      brand_name: brandName,
      model_no: modelName,
      item: null,
      description: highForm.description,
      quantity: parseFloat(highForm.quantity),
      uom: highForm.uom,
      rate: parseFloat(highForm.rate),
      hsn_sac: highForm.hsn_sac || "",
    };

    const insertIndex = getItemInsertIndex();
    const updated = [...products];
    updated.splice(insertIndex, 0, newProduct);
    updateProducts(renumberProducts(updated));


    // ✅ RESET FORM
    setHighForm(DEFAULT_HIGH_FORM);

    // Optional: Clear dependent dropdown data
    setAcTypes([]);
    // setBrands([]);
    setSubTypes([]);
    setModels([]);
    setVariants([]);
    loadInitialData();
  };
  // ===================== ADD LOW ITEM =====================

  // const addLowItem = () => {
  //   if (!lowForm.item) return;
  //   if (!activeSection) {
  //     alert("Please create or select a section first.");
  //     return;
  //   }

  //   const selected = items.find(i => i.id == lowForm.item);

  //   const newProduct = {
  //     serial_no: generateItemSerial(),
  //     sort_order: products.length + 1,
  //     is_section: false,
  //     section_title: null,
  //     product_variant: null,
  //     item: selected.id,
  //     item_code: selected.item_code,
  //     description: lowForm.description,
  //     quantity: parseFloat(lowForm.quantity),
  //     uom: lowForm.uom,
  //     rate: parseFloat(lowForm.rate)
  //   };

  //   const insertIndex = products.reduce((lastIndex, p, i) => {
  //     if (p.serial_no.startsWith(activeSection + ".")) {
  //       return i + 1;
  //     }
  //     if (p.serial_no === activeSection) {
  //       return i + 1;
  //     }
  //     return lastIndex;
  //   }, products.length);

  //   const updated = [...products];
  //   updated.splice(insertIndex, 0, newProduct);

  //   updateProducts(updated);

  //   // ✅ RESET FORM
  //   setLowForm(DEFAULT_LOW_FORM);

  //   // Optional: Clear dependent dropdown data
  //   setMaterialTypes([]);
  //   setItemTypes([]);
  //   setFeatures([]);
  //   setItemClasses([]);
  //   setItems([]);
  //   loadInitialData();

  // };

  const addLowItem = () => {
    if (selectedMaterials.length === 0) return;

    const insertIndex = getItemInsertIndex();
    const updated = [...products];

    selectedMaterials.forEach((mat, idx) => {
      // Determine which brand to use
      let brandToUse = mat.brand_id; // Use material's brand by default
      let brandNameToUse = mat.brand_name;
      
      // If material has no brand, or user manually selected a different brand, use the selected one
      if (!mat.brand_id || lowForm.brand) {
        brandToUse = lowForm.brand;
        // Find brand name from brands array
        const selectedBrand = brands.find(b => b.id == lowForm.brand);
        brandNameToUse = selectedBrand?.name || "";
      }

      const newProduct = {
        serial_no: generateItemSerial(updated),
        sort_order: updated.length + 1,
        is_section: false,
        section_title: null,
        product_variant: null,
        item: mat.id,

        item_code: mat.item_code || mat.material_name || `Material ${mat.id}`,
        material_display_name: mat.material_display_name || formatMaterialLabel(mat),
        complete_item_name: mat.material_display_name || formatMaterialLabel(mat) || mat.material_name,

        brand: brandToUse,
        brand_name: brandNameToUse,
        description: lowForm.description,
        quantity: parseFloat(lowForm.quantity || 1),
        uom: lowForm.uom,
        rate: parseFloat(lowForm.rate || 0),
        hsn_sac: lowForm.hsn_sac || "",
      };

      updated.splice(insertIndex + idx, 0, newProduct);
    });

    updateProducts(renumberProducts(updated));

    // ✅ RESET AFTER ADD
    setSelectedMaterials([]);
    setLowForm(DEFAULT_LOW_FORM);
    setResetMaterials(prev => prev + 1);
  };

  // ===================== EDIT ROW =====================

  const handleEdit = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    updateProducts(updated);
  };

  const removeRow = (index) => {
    const updated = products.filter((_, i) => i !== index);
    updateProducts(renumberProducts(updated));
  };
  // ===================== UI =====================

  return (
    <div className="space-y-8">
      <style>
        {`
          /* Hide number input spinners */
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
      {/* ================= ADD SECTION ================= */}
      <div className="border rounded-xl p-4 bg-gray-50 shadow-sm">
        <h4 className="font-semibold mb-2">Add Section <span className="text-sm font-normal text-gray-500">(optional)</span></h4>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Section Title (e.g. Air Conditioners)"
            className="border rounded-md px-3 py-2 flex-1"
            value={sectionTitle}
            onChange={e => setSectionTitle(e.target.value)}
          />
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            onClick={addSection}
          >
            + Add Section
          </button>
        </div>
      </div>

      {/* ================= HIGH SIDE ================= */}
      <div className="border rounded-xl p-5 shadow-sm bg-white">
        <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">
          High Side Products
        </h4>

        {/* <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, acType: e.target.value })}
            >
              <option value="">AC Type</option>
              {acTypes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, subType: e.target.value })}
            >
              <option value="">Sub Type</option>
              {subTypes.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, brand: e.target.value })}
            >
              <option value="">Brand</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, model: e.target.value })}
            >
              <option value="">Model</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, variant: e.target.value })}
            >
              <option value="">Variant</option>
              {variants.map(v => (
                <option key={v.id} value={v.id}>{v.variant_sku}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <input
              type="number"
              placeholder="Qty"
              className="border rounded-md px-2 py-1 w-50"
              value={highForm.quantity}
              onChange={e => setHighForm({ ...highForm, quantity: e.target.value })}
            />
            <input
              type="number"
              placeholder="Rate"
              className="border rounded-md px-2 py-1 w-50"
              value={highForm.rate}
              onChange={e => setHighForm({ ...highForm, rate: e.target.value })}
            />

            <textarea
              placeholder="Description"
              className="border rounded-md px-2 py-1 w-full"
              value={highForm.description}
              onChange={e => setHighForm({ ...highForm, description: e.target.value })}
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md"
              onClick={addHighProduct}
            >
              + Add High Product
            </button>
          </div>
        </div> */}

        <div className="space-y-4">

          {/* Row 1 - 4 dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, acType: e.target.value })}
            >
              <option value="">AC Type</option>
              {acTypes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, subType: e.target.value })}
            >
              <option value="">Sub Type</option>
              {subTypes.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              className="border rounded-md px-2 py-1"
              value={highForm.brand}
              onChange={e =>
                setHighForm({ ...highForm, brand: e.target.value })
              }
            >
              <option value="">Brand</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, model: e.target.value })}
            >
              <option value="">Model</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Row 2 - remaining inputs except description */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <select
              className="border rounded-md px-2 py-1"
              onChange={e => setHighForm({ ...highForm, variant: e.target.value })}
            >
              <option value="">Variant</option>
              {variants.map(v => (
                <option key={v.id} value={v.id}>{v.variant_sku || v.sku}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="HSN"
              className="border rounded-md px-2 py-1"
              value={highForm.hsn_sac}
              onChange={e => setHighForm({ ...highForm, hsn_sac: e.target.value })}
            />

            <input
              type="number"
              placeholder="Qty"
              className="border rounded-md px-2 py-1"
              value={highForm.quantity}
              onChange={e => setHighForm({ ...highForm, quantity: e.target.value })}
            />

            <input
              type="number"
              placeholder="Rate"
              className="border rounded-md px-2 py-1"
              value={highForm.rate}
              onChange={e => setHighForm({ ...highForm, rate: e.target.value })}
            />

            <select
              className="border rounded-md px-2 py-1"
              value={highForm.uom}
              onChange={e => setHighForm({ ...highForm, uom: e.target.value })}
            >
              {LENGTH_UNITS.map((unit, index) => (
                <option key={index} value={unit}>
                  {unit}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md whitespace-nowrap"
              onClick={addHighProduct}
            >
              + Add
            </button>

          </div>

          <div className="flex gap-3 items-start">

            <textarea
              placeholder="Description"
              className="border rounded-md px-3 py-2 flex-1"
              rows={2}
              value={highForm.description}
              onChange={e => setHighForm({ ...highForm, description: e.target.value })}
            />



          </div>

        </div>
      </div>

      {/* ================= LOW SIDE ================= */}
      <div className="border rounded-xl p-5 shadow-sm bg-white">
        <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">
          Low Side Items
        </h4>

        <div className="space-y-4">

          {/* Row 1 - 4 dropdowns */}
          <div className="space-y-3">
            <AcMaterialList
              base_api={baseApi}
              resetTrigger={resetMaterials}
              onSelectionChange={(data) => {
                setSelectedMaterials(data.materials);
              }}
            />
          </div>

          {/* Row 2 - Remaining inputs except description */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="HSN"
              className="border rounded-md px-2 py-1"
              value={lowForm.hsn_sac}
              onChange={e => setLowForm({ ...lowForm, hsn_sac: e.target.value })}
            />

            <input
              type="number"
              placeholder="Qty"
              className="border rounded-md px-2 py-1"
              value={lowForm.quantity}
              onChange={e => setLowForm({ ...lowForm, quantity: e.target.value })}
            />

            <input
              type="number"
              placeholder="Rate"
              className="border rounded-md px-2 py-1"
              value={lowForm.rate}
              onChange={e => setLowForm({ ...lowForm, rate: e.target.value })}
            />

            {/* Brand Dropdown */}
            <select
              className="border rounded-md px-2 py-1"
              value={lowForm.brand}
              onChange={e => setLowForm({ ...lowForm, brand: e.target.value })}
              disabled={selectedMaterials.length > 0 && 
                       [...new Set(selectedMaterials.map(mat => mat.brand_id).filter(Boolean))].length === 1}
              title={
                selectedMaterials.length > 0 && 
                [...new Set(selectedMaterials.map(mat => mat.brand_id).filter(Boolean))].length === 1 
                  ? "Brand auto-populated from item" 
                  : selectedMaterials.length > 0 && 
                    [...new Set(selectedMaterials.map(mat => mat.brand_id).filter(Boolean))].length > 1
                    ? "Multiple brands detected - please select one"
                    : ""
              }
            >
              <option value="">Select Brand</option>
              {(() => {
                // If materials are selected, only show brands from those materials
                if (selectedMaterials.length > 0) {
                  const materialBrands = selectedMaterials
                    .filter(mat => mat.brand_id && mat.brand_name)
                    .map(mat => ({ id: mat.brand_id, name: mat.brand_name }));
                  
                  // Remove duplicates based on brand_id
                  const uniqueBrands = materialBrands.filter((brand, index, self) => 
                    index === self.findIndex(b => b.id === brand.id)
                  );
                  
                  return uniqueBrands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ));
                } else {
                  // If no materials selected, show all brands
                  return brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ));
                }
              })()}
            </select>

            <select
              className="border rounded-md px-2 py-1"
              value={lowForm.uom}
              onChange={e => setLowForm({ ...lowForm, uom: e.target.value })}
            >
              {LENGTH_UNITS.map((unit, index) => (
                <option key={index} value={unit}>
                  {unit}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md whitespace-nowrap"
              onClick={addLowItem}
            >
              + Add
            </button>
          </div>

          {/* Row 3 - Description full width */}
          <textarea
            placeholder="Description"
            className="border rounded-md px-3 py-2 w-full"
            rows={2}
            value={lowForm.description}
            onChange={e => setLowForm({ ...lowForm, description: e.target.value })}
          />

        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="border rounded-xl shadow-sm bg-white p-4 overflow-x-auto">
        <h4 className="font-semibold text-gray-700 mb-3">Selected Items</h4>

        <table className="min-w-full text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">S.No</th>
              <th className="border px-3 py-2 text-left">Description</th>
              <th className="border px-3 py-2 text-left">HSN</th>
              <th className="border px-3 py-2 text-left">Qty</th>
              <th className="border px-3 py-2 text-left">UOM</th>
              <th className="border px-3 py-2 text-left">Rate</th>
              <th className="border px-3 py-2 text-left">Amount</th>
              <th className="border px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, index) => (
              <tr
                key={index}
                onClick={() => p.is_section && setActiveSection(p.serial_no)}
                className={
                  p.is_section
                    ? `bg-gray-200 font-semibold cursor-pointer ${activeSection === p.serial_no
                      ? "ring-2 ring-blue-500"
                      : ""
                    }`
                    : "hover:bg-gray-50"
                }
              >
                <td className="border px-3 py-2">{p.serial_no}</td>

                {p.is_section ? (
                  <>
                    <td colSpan="6" className="border px-3 py-2">
                      {p.section_title}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => removeRow(index)}
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td
                      className="border px-3 py-2"
                      title={
                        p.product_variant
                          ? formatHighSideTooltip(p)
                          : formatLowSideTooltip(p)
                      }
                    >
                      {p.product_variant
                        ? (p.variant_sku || "")
                        : (p.item_code || p.variant_sku || "")}
                      <br />
                      {p.description}
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-24"
                        value={p.hsn_sac || ""}
                        onChange={e => handleEdit(index, "hsn_sac", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-20"
                        value={p.quantity}
                        onChange={e =>
                          handleEdit(index, "quantity", parseFloat(e.target.value))
                        }
                      />
                    </td>
                    <td className="border px-3 py-2">{p.uom}</td>
                    <td className="border px-3 py-2">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-24"
                        value={p.rate}
                        onChange={e =>
                          handleEdit(index, "rate", parseFloat(e.target.value))
                        }
                      />
                    </td>
                    <td className="border px-3 py-2 font-medium">
                      {(p.quantity * p.rate).toFixed(2)}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => removeRow(index)}
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}