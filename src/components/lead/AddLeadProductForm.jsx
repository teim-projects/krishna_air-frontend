import React, { useEffect, useState } from "react";
import axios from "axios";
import { CiCircleRemove } from "react-icons/ci";

const AddLeadProductForm = ({
  products,
  setProducts,
  baseApi,
  authToken,
  deletedProductIds,
  setDeletedProductIds,
}) => {


  console.log("baseApi", baseApi)
  /* ===================== STATES ===================== */
  const [acType, setAcType] = useState([]);
  const [brands, setBrands] = useState([]);

  /* ===================== API CALLS ===================== */

  const fetchAcTypes = async () => {
    try {
      const res = await axios.get(
        `${baseApi.replace(/\/$/, "")}/api/product/actype/`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setAcType(res.data.results || []);
    } catch (err) {
      console.error("AC Type fetch failed:", err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get(
        `${baseApi.replace(/\/$/, "")}/api/product/ac-brand/`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setBrands(res.data.results || []);
    } catch (err) {
      console.error("Brand fetch failed:", err);
    }
  };

  const fetchAcSubTypes = async (acTypeId, index) => {
    try {
      const res = await axios.get(
        `${baseApi.replace(/\/$/, "")}/api/product/ac-subtypes/?ac_type_id=${acTypeId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setProducts(prev =>
        prev.map((p, i) =>
          i === index
            ? { ...p, ac_sub_type_options: res.data.results || [] }
            : p
        )
      );
    } catch (err) {
      console.error("AC Sub Type fetch failed:", err);
    }
  };


  const fetchProductModels = async (acSubTypeID, brandID, index) => {
    try {
      const res = await axios.get(
        `${baseApi.replace(/\/$/, "")}/api/product/product-model/?ac_sub_type_id=${acSubTypeID}&brand_id=${brandID}`,
        { headers: { Authorization: `Bearer ${authToken}` } }


      );

      setProducts(prev =>
        prev.map((p, i) =>
          i === index
            ? {
              ...p, product_model_options: res.data.results || [],
              product_model: "",
              product_model_name: "",
            }
            : p
        )
      );
    }
    catch (err) {
      console.error("Product Model fetch failed:", err);
    }

  }


  const fetchProductVariants = async (productModelID, index) => {
    try {
      const res = await axios.get(
        `${baseApi.replace(/\/$/, "")}/api/product/product-variant/?product_model=${productModelID}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setProducts(prev =>
        prev.map((p, i) =>
          i === index
            ? { ...p, product_variant_options: res.data.results || [] }
            : p
        )
      );
    } catch (err) {
      console.error("Product Variant fetch failed:", err);
    }
  }

  /* ===================== INIT ===================== */
  useEffect(() => {
    if (!baseApi || !authToken) return;
    fetchAcTypes();
    fetchBrands();
  }, [baseApi, authToken]);

  /* ===================== HELPERS ===================== */

  const addProductRow = () => {
    const last = products[products.length - 1];
    if (!last?.ac_type) return;

    setProducts(prev => [
      ...prev,
      {

        ac_type: "",
        ac_type_name: "",
        ac_sub_type: "",
        ac_sub_type_name: "",
        brand: "",
        brand_name: "",
        product_model: "",
        product_model_name: "",
        variant: "",
        variant_name: "",
        quantity: 1,
        expected_price: "",
        remarks: "",
        ac_sub_type_options: [],
      }
    ]);
  };


  const removeProductRow = (index) => {
    setProducts(prev => {
      const p = prev[index];
      if (p.id) {
        setDeletedProductIds(ids => [...ids, p.id]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateProduct = (index, field, value) => {
    setProducts(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const lastIndex = products.length - 1;

  /* ===================== UI ===================== */

  return (
    <div className="border border-slate-300 rounded-md p-2 mt-4">

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-md font-semibold">Product Details</h2>
        <button
          type="button"
          onClick={addProductRow}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
        >
          + Add Product
        </button>
      </div>

      {/* ===== FORM (ONLY LAST PRODUCT) ===== */}
      {products.map((product, index) =>
        index === lastIndex ? (
          <div key={index} className="rounded-md p-3 mb-3 border border-slate-300">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* AC TYPE */}
              <select
                value={product.ac_type}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = acType.find(t => t.id === Number(value));

                  updateProduct(index, "ac_type", value);
                  updateProduct(index, "ac_type_name", selected?.name || "");
                  updateProduct(index, "ac_sub_type", "");
                  updateProduct(index, "ac_sub_type_name", "");
                  updateProduct(index, "ac_sub_type_options", []);

                  if (value) fetchAcSubTypes(value, index);
                }}
                className="px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">AC Type</option>
                {acType.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>

              {/* BRAND */}
              <select
                value={product.brand}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = brands.find(b => b.id === Number(value));
                  updateProduct(index, "brand", value);
                  updateProduct(index, "brand_name", selected?.name || "");

                  if (value && product.ac_sub_type) {
                    fetchProductModels(value, product.ac_sub_type, index);
                  }
                }}
                className="px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">Brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* AC SUB TYPE */}
              <select
                value={product.ac_sub_type}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = product.ac_sub_type_options?.find(
                    s => s.id === Number(value)
                  );
                  updateProduct(index, "ac_sub_type", value);
                  updateProduct(index, "ac_sub_type_name", selected?.name || "");

                  if (value && product.brand) {
                    fetchProductModels(value, product.brand, index);
                  }
                }}
                className="px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">AC Sub Type</option>
                {(product.ac_sub_type_options || []).map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>



              {/* MODEL */}
              <select
                value={product.product_model}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = product.product_model_options?.find(
                    (m) => m.id === Number(value)
                  );

                  updateProduct(index, "product_model", value);
                  updateProduct(index, "product_model_name", selected?.name || "");

                  if (value) {
                    fetchProductVariants(value, index);
                  }

                }}
                className="px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">Model</option>
                {product.product_model_options?.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.model}
                  </option>
                ))}
              </select>

              {/* VARIANT */}
              <select
                value={product.variant}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = product.product_variant_options?.find(
                    (v) => v.id === Number(value)
                  );
                  updateProduct(index, "variant", value);
                  updateProduct(index, "variant_name", selected?.sku || "");
                }}
                className="px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">Variant</option>
                {product.product_variant_options?.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.sku}
                  </option>
                ))}
              </select>

              {/* QUANTITY */}
              <input
                type="number"
                min="1"
                value={product.quantity}
                onChange={(e) =>
                  updateProduct(index, "quantity", e.target.value)
                }
                className="px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <input
                type="number"
                placeholder="Expected Price"
                value={product.expected_price}
                onChange={(e) =>
                  updateProduct(index, "expected_price", e.target.value)
                }
                className="px-3 py-2 border border-slate-300 rounded-md"
              />

              <input
                type="text"
                placeholder="Product Remarks"
                value={product.remarks}
                onChange={(e) =>
                  updateProduct(index, "remarks", e.target.value)
                }
                className="px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
        ) : null
      )}

      {/* ===== TABLE (OLD PRODUCTS) ===== */}
      {products.length > 1 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border border-slate-300 text-sm border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 p-2">#</th>
                <th className="border border-slate-300 p-2">AC Type</th>
                <th className="border border-slate-300 p-2">AC Sub Type</th>
                <th className="border border-slate-300 p-2">Brand</th>
                <th className="border border-slate-300 p-2">Model</th>
                <th className="border border-slate-300 p-2">Variant</th>
                <th className="border border-slate-300 p-2">Qty</th>
                <th className="border border-slate-300 p-2">Price</th>
                <th className="border border-slate-300 p-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {products.slice(0, -1).map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-2 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-slate-300 p-2">
                    {p.ac_type_name}
                  </td>
                  <td className="border border-slate-300 p-2">
                    {p.ac_sub_type_name}
                  </td>
                  <td className="border border-slate-300 p-2">
                    {p.brand_name}
                  </td>
                  <td className="border border-slate-300 p-2">
                    {p.product_model_name}
                  </td>
                  <td className="border border-slate-300 p-2">
                    {p.variant_name}
                  </td>
                  <td className="border border-slate-300 p-2 text-center w-2.5">
                    <input
                      type="number"
                      min="1"
                      value={p.quantity}
                      onChange={(e) =>
                        updateProduct(i, "quantity", e.target.value)
                      }
                      className="w-16 px-2 py-2 border rounded-md text-center"
                    />

                  </td>
                  <td className="border border-slate-300 p-2">
                    <input
                      type="number"
                      value={p.expected_price}
                      onChange={(e) =>
                        updateProduct(i, "expected_price", e.target.value)
                      }
                      className="w-24 px-2 py-2 border rounded-md"
                    />

                  </td>
                  <td className="border border-slate-300 p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeProductRow(i)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <CiCircleRemove size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      )}
    </div>
  );
};

export default AddLeadProductForm;
