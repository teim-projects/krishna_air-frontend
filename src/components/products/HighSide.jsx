import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import axios from "axios";

export const highSideProductFiltersConfig = [
    { key: "ac_type", label: "AC Type", type: "text", placeholder: "Search AC Type" },
    { key: "brand", label: "Brand", type: "text", placeholder: "Search Brand" },
];

export const highSideModelFiltersConfig = [
    { key: "model_name", label: "Model Name", type: "text", placeholder: "Search Model" },
    { key: "variant", label: "Variant", type: "text", placeholder: "Search Variant" },
];

const HighSide = ({ base_api, filters, activeTab, onTabChange }) => {
    // const [activeTab, setActiveTab] = useState("product");
    const BASE_API = base_api;
    // ===== AC TYPES =====
    const [acType, setAcType] = useState("");
    const [subTypeMap, setSubTypeMap] = useState({});
    const [subTypes, setSubTypes] = useState([{ id: null, name: "" }]);
    const [editingId, setEditingId] = useState(null);
    const [editingSubTypes, setEditingSubTypes] = useState([]);
    const [list, setList] = useState([]);

    // ===== BRANDS =====
    const [brands, setBrands] = useState([]);
    const [brandInput, setBrandInput] = useState("");
    const [editingBrandId, setEditingBrandId] = useState(null);


    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    });

    // ================= API =================
    const fetchAcTypes = async () => {
        const res = await axios.get(`${BASE_API}/api/product/actype/`, authHeaders());
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setList(rows);
        rows.forEach((row) => fetchAcSubTypesByType(row.id));
    };

    const searchAcTypes = async (query) => {
        if (!query) return; // guard
        const res = await axios.get(
            `${BASE_API}/api/product/actype/?search=${encodeURIComponent(query)}`,
            authHeaders()
        );
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setList(rows);
    };


    const fetchAcSubTypesByType = async (acTypeId) => {
        // console.log("acType",acTypeId)
        const res = await axios.get(
            `${BASE_API}/api/product/ac-subtypes/?ac_type_id=${acTypeId}`,
            authHeaders()
        );
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        // console.log("rows",rows);
        setSubTypeMap((prev) => ({ ...prev, [acTypeId]: rows }));
    };


    const searchBrands = async (query) => {
        if (!query) return; // guard
        const res = await axios.get(
            `${BASE_API}/api/product/ac-brand/?search=${encodeURIComponent(query)}`,
            authHeaders()
        );
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setBrands(rows);
    };
    const fetchBrands = async () => {
        const res = await axios.get(`${BASE_API}/api/product/ac-brand/`, authHeaders());
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setBrands(rows);
    };



    useEffect(() => {
        if (activeTab !== "product") return;

        if (filters?.ac_type) {
            searchAcTypes(filters.ac_type);
        } else {
            fetchAcTypes();
        }

        if (filters?.brand) {
            searchBrands(filters.brand);
        } else {
            fetchBrands();
        }
    }, [filters, activeTab]);

    useEffect(() => {
        fetchAcTypes();
        fetchBrands();
    }, [BASE_API]);



    // ================= SubType Handlers =================
    const addSubTypeField = () =>
        setSubTypes([...subTypes, { id: null, name: "" }]);

    const updateSubType = (index, value) => {
        const updated = [...subTypes];
        updated[index] = { ...updated[index], name: value };
        setSubTypes(updated);
    };

    const removeSubType = (index) => {
        if (subTypes.length === 1) return;
        setSubTypes(subTypes.filter((_, i) => i !== index));
    };

    // ================= SAVE =================
    const handleAddOrUpdate = async () => {
        if (!acType.trim()) return;

        let acTypeId = editingId;

        // 1. Save AC Type
        if (editingId) {
            await axios.put(
                `${BASE_API}/api/product/actype/${editingId}/`,
                { name: acType },
                authHeaders()
            );
        } else {
            const res = await axios.post(
                `${BASE_API}/api/product/actype/`,
                { name: acType },
                authHeaders()
            );
            acTypeId = res.data.id;
        }

        const current = subTypes
            .map((s) => ({ id: s.id, name: s.name.trim() }))
            .filter((s) => s.name);

        // 2. DELETE removed
        await Promise.all(
            editingSubTypes.map((old) => {
                if (!current.find((c) => c.id === old.id)) {
                    return axios.delete(
                        `${BASE_API}/api/product/ac-subtypes/${old.id}/`,
                        authHeaders()
                    );
                }
                return Promise.resolve();
            })
        );

        // 3. PATCH updated
        await Promise.all(
            current.map((c) => {
                if (c.id) {
                    const old = editingSubTypes.find((o) => o.id === c.id);
                    if (old && old.name !== c.name) {
                        return axios.patch(
                            `${BASE_API}/api/product/ac-subtypes/${c.id}/`,
                            { name: c.name },
                            authHeaders()
                        );
                    }
                }
                return Promise.resolve();
            })
        );

        // 4. POST new
        await Promise.all(
            current.map((c) => {
                if (!c.id) {
                    return axios.post(
                        `${BASE_API}/api/product/ac-subtypes/`,
                        { name: c.name, ac_type_id: acTypeId },
                        authHeaders()
                    );
                }
                return Promise.resolve();
            })
        );

        await fetchAcTypes();
        setAcType("");
        setSubTypes([{ id: null, name: "" }]);
        setEditingId(null);
        setEditingSubTypes([]);
    };

    // ================= EDIT =================
    const handleEdit = async (row) => {
        setAcType(row.name);
        setEditingId(row.id);

        const res = await axios.get(
            `${BASE_API}/api/product/ac-subtypes/?ac_type_id=${row.id}`,
            authHeaders()
        );

        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];

        setEditingSubTypes(rows);
        setSubTypes(
            rows.length
                ? rows.map((s) => ({ id: s.id, name: s.name }))
                : [{ id: null, name: "" }]
        );
    };


    const handleDelete = async (id) => {
        if (!window.confirm("Delete this AC Type?")) return;
        await axios.delete(`${BASE_API}/api/product/actype/${id}/`, authHeaders());
        fetchAcTypes();
    };
    // ===== BRAND HANDLERS =====
    const handleAddOrUpdateBrand = async () => {
        if (!brandInput.trim()) return;

        if (editingBrandId) {
            // UPDATE
            await axios.patch(
                `${BASE_API}/api/product/ac-brand/${editingBrandId}/`,
                { name: brandInput },
                authHeaders()
            );
        } else {
            // CREATE
            await axios.post(
                `${BASE_API}/api/product/ac-brand/`,
                { name: brandInput },
                authHeaders()
            );
        }

        setBrandInput("");
        setEditingBrandId(null);
        fetchBrands();   // refresh list from backend
    };


    const handleEditBrand = (brand) => {
        setBrandInput(brand.name);
        setEditingBrandId(brand.id);
    };

    const handleDeleteBrand = async (id) => {
        if (!window.confirm("Delete this brand?")) return;

        await axios.delete(
            `${BASE_API}/api/product/ac-brand/${id}/`,
            authHeaders()
        );

        fetchBrands();   // refresh list
    };
    const filteredAcList = list.filter((row) => {
        if (filters?.ac_type) {
            return row.name.toLowerCase().includes(filters.ac_type.toLowerCase());
        }
        return true;
    });

    const filteredBrands = brands.filter((b) => {
        if (filters?.brand) {
            return b.name.toLowerCase().includes(filters.brand.toLowerCase());
        }
        return true;
    });




    return (
        <div className="bg-white rounded-lg p-4">
            {/* Tabs */}
            <div className="flex gap-6 border-b mb-6">
                <button
                    onClick={() => onTabChange("product")}
                    className={`pb-2 ${activeTab === "product"
                        ? "border-b-2 border-black font-semibold"
                        : "text-gray-500"
                        }`}
                >
                    Product Details
                </button>

                <button
                    onClick={() => onTabChange("model")}
                    className={`pb-2 ${activeTab === "model"
                        ? "border-b-2 border-black font-semibold"
                        : "text-gray-500"
                        }`}
                >
                    Models
                </button>
            </div>

            {activeTab === "product" && (
                <>
                    {/* ===== AC TYPE FORM ===== */}
                    <div className="rounded-lg p-4 mb-6 bg-gray-50">
                        <h2 className="font-semibold mb-4">
                            {editingId ? "Edit AC Type" : "Add AC Type"}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm mb-1">AC Type</label>
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-0"
                                placeholder="Enter AC Type name"
                                value={acType}
                                onChange={(e) => setAcType(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm">Sub Types</label>
                                <button
                                    onClick={addSubTypeField}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                >
                                    <FiPlus /> Add Sub Type
                                </button>
                            </div>
                            {subTypes.map((sub, i) => (
                                <div key={sub.id ?? i} className="flex gap-2 mb-2">
                                    <input
                                        className="w-full px-4 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-0"
                                        placeholder={`Sub Type ${i + 1}`}
                                        value={sub.name || ""}
                                        onChange={(e) => updateSubType(i, e.target.value)}
                                    />
                                    {subTypes.length > 1 && (
                                        <button
                                            onClick={() => removeSubType(i)}
                                            className="text-red-500 hover:bg-red-100 p-2 rounded"
                                        >
                                            <FiX />
                                        </button>
                                    )}
                                </div>
                            ))}

                        </div>

                        <button
                            onClick={handleAddOrUpdate}
                            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
                        >
                            {editingId ? "Update" : "Add"}
                        </button>
                    </div>

                    {/* ===== AC TYPE TABLE ===== */}

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">

                        <table className="w-full text-md text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-sm">Sr.No</th>
                                    <th className="px-6 py-3 text-sm">AC Type</th>
                                    <th className="px-6 py-3 text-sm">Sub Types</th>
                                    <th className="px-6 py-3 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(list) && list.length > 0 ? (
                                    list.map((row, index) => (
                                        <tr key={row.id} className="border-b border-gray-200">
                                            <td className="px-6 py-4 text-sm">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm">{row.name}</td>
                                            <td className="px-6 py-4">
                                                <ul className="list-disc text-sm text-gray-700 py-1 pl-4">
                                                    {subTypeMap[row.id]?.map((s) => (
                                                        <li key={s.id}>{s.name}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-x-4">
                                                    <FiEdit
                                                        onClick={() => handleEdit(row)}
                                                        className="text-yellow-600 hover:text-yellow-700 cursor-pointer"
                                                    />
                                                    <FiTrash2
                                                        onClick={() => handleDelete(row.id)}
                                                        className="text-red-600 hover:text-red-700 cursor-pointer"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                                            No AC Types found
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>

                    {/* ===== BRAND FORM ===== */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                        <h2 className="font-semibold mb-4">
                            {editingBrandId ? "Edit Brand" : "Add Brand"}
                        </h2>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Enter Brand name"
                                value={brandInput}
                                onChange={(e) => setBrandInput(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-0"
                            />
                            <button
                                onClick={handleAddOrUpdateBrand}
                                className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
                            >
                                {editingBrandId ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>

                    {/* ===== BRAND TABLE ===== */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-md text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-sm">Sr.No</th>
                                    <th className="px-6 py-3 text-sm">Brand Name</th>
                                    <th className="px-6 py-3 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {brands.map((brand, index) => (
                                    <tr key={brand.id} className="border-b border-gray-200">
                                        <td className="px-6 py-4 text-sm">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm">{brand.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-x-4">
                                                <FiEdit
                                                    onClick={() => handleEditBrand(brand)}
                                                    className="text-yellow-600 hover:text-yellow-700 cursor-pointer"
                                                />
                                                <FiTrash2
                                                    onClick={() => handleDeleteBrand(brand.id)}
                                                    className="text-red-600 hover:text-red-700 cursor-pointer"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === "model" && (
                <div className="text-gray-500">
                    Models UI will come here (Brand, Model No, Variant mapping, etc.)
                </div>
            )}
        </div>
    );
};



export default HighSide;
