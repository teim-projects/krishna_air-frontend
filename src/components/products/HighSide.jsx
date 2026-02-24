import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import axios from "axios";
import AddModelForm from "./AddModelForm";
import { MdOutlineNavigateNext, MdOutlineNavigateBefore } from "react-icons/md";

export const highSideProductFiltersConfig = [
    { key: "ac_type", label: "AC Type", type: "text", placeholder: "Search AC Type" },
    { key: "brand", label: "Brand", type: "text", placeholder: "Search Brand" },
];

const status_choice = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

const inverter = [
    { id: 1, name: "Inverter" },
    { id: 0, name: "Non-Inverter" },
];

export const highSideModelFiltersConfig = (brands = [], acTypes = []) => [
    { key: "search", label: "Model Name", type: "search", placeholder: "Search Model" },
    // { key: "variant", label: "Variant", type: "text", placeholder: "Search Variant" },
    {
        key: "status",
        type: "select",
        label: "Status",
        placeholder: "Status",
        options: [...status_choice.map(r => ({ value: r.value, label: r.label }))]
    },

    {
        key: "brand_id",
        type: "select",
        label: "Brand",
        placeholder: "Select Brand",
        options: [...brands.map(b => ({ value: b.id, label: b.name }))]

    },

    {
        key: "inveter",
        type: "select",
        label: "Inverter",
        placeholder: "Select Inverter",
        options: [...inverter.map(i => ({ value: i.id, label: i.name }))]

    },

    {
        key: "ac_type_id",
        type: "select",
        label: "AC Type",
        placeholder: "Select AC Type",
        options: [...acTypes.map(t => ({ value: t.id, label: t.name }))]
    },

    {
        key: "phase",
        type: "select",
        label: "Phase",
        placeholder: "Select Phase",
        options: [
            { value: "1 Phase", label: "1 Phase" },
            { value: "3 Phase", label: "3 Phase" },
        ]
    },



];

const HighSide = ({ base_api, filters, activeTab, onTabChange, brands, setBrands, acTypes,
    setAcTypes, }) => {
    // const [activeTab, setActiveTab] = useState("product");
    const BASE_API = base_api;
    // ===== AC TYPES =====
    const [acType, setAcType] = useState("");
    const [subTypeMap, setSubTypeMap] = useState({});
    const [subTypes, setSubTypes] = useState([{ id: null, name: "" }]);
    const [editingId, setEditingId] = useState(null);
    const [editingSubTypes, setEditingSubTypes] = useState([]);
    const [list, setList] = useState([]);
    const [openAddModel, setOpenAddModel] = useState(false);
    // ===== BRANDS =====
    // const [brands, setBrands] = useState([]);
    const [brandInput, setBrandInput] = useState("");
    const [editingBrandId, setEditingBrandId] = useState(null);

    const [models, setModels] = useState([]);
    const [variants, setVariants] = useState([]);
    const [openVariantModal, setOpenVariantModal] = useState(false);
    const [activeModel, setActiveModel] = useState(null);

    const [editingModel, setEditingModel] = useState(null);


    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 10;

    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    });



    // ================= API =================
    const fetchAcTypes = async () => {
        const res = await axios.get(`${BASE_API}/product/actype/`, authHeaders());
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setAcTypes(rows);
        setList(rows);
        // console.log("AV types", rows);
        rows.forEach((row) => fetchAcSubTypesByType(row.id));
    };

    
    const fetchAcSubTypesByType = async (acTypeId) => {
        // console.log("acType",acTypeId)
        const res = await axios.get(
            `${BASE_API}/product/ac-subtypes/?ac_type_id=${acTypeId}`,
            authHeaders()
        );
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        // console.log("rows",rows);
        setSubTypeMap((prev) => ({ ...prev, [acTypeId]: rows }));
    };


   

    const fetchBrands = async () => {
        const res = await axios.get(`${BASE_API}/product/ac-brand/`, authHeaders());
        const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setBrands(rows);
    };



    
    const filterModel = async (filters = {}, page = 1) => {
        try {
            const params = new URLSearchParams();
            params.set("page", page);

            if (typeof filters.search === "string" && filters.search.trim()) {
                params.set("search", filters.search);
            }

            if (filters.status === "active") params.set("is_active", "true");
            if (filters.status === "inactive") params.set("is_active", "false");

            if (filters.brand_id) params.set("brand_id", filters.brand_id);
            if (filters.inveter !== undefined) params.set("inverter", filters.inveter);
            if (filters.ac_type_id) params.set("ac_sub_type_id__ac_type_id", filters.ac_type_id);
            if (filters.phase) params.set("phase", filters.phase);

            const url = `${BASE_API}/product/product-model/?${params.toString()}`;
            console.log("🔎 Model Filter URL:", url);

            const res = await axios.get(url, authHeaders());

            const data = res.data;
            const rows = data?.results ?? [];

            setModels(rows);

            const count = data?.count ?? rows.length;
            const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

            setTotalPages(pages);
            setCurrentPage(page);

        } catch (err) {
            console.error("❌ Model filter failed:", err?.response?.data || err);
            setModels([]);
        }
    };


    useEffect(() => {
        if (activeTab === "model") {
            fetchModels(1);   // reset to page 1 when switching tab
        }
    }, [activeTab]);


    useEffect(() => {
        if (activeTab !== "model") return;

        const hasAnyFilter = Object.values(filters || {}).some(
            v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
        );

        if (hasAnyFilter) {
            filterModel(filters, 1);   // reset to page 1 on new filter
        } else {
            fetchModels(1);
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
                `${BASE_API}/product/actype/${editingId}/`,
                { name: acType },
                authHeaders()
            );
        } else {
            const res = await axios.post(
                `${BASE_API}/product/actype/`,
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
                        `${BASE_API}/product/ac-subtypes/${old.id}/`,
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
                            `${BASE_API}/product/ac-subtypes/${c.id}/`,
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
                        `${BASE_API}/product/ac-subtypes/`,
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
            `${BASE_API}/product/ac-subtypes/?ac_type_id=${row.id}`,
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
        await axios.delete(`${BASE_API}/product/actype/${id}/`, authHeaders());
        fetchAcTypes();
    };


    // ===== BRAND HANDLERS =====
    const handleAddOrUpdateBrand = async () => {
        if (!brandInput.trim()) return;

        if (editingBrandId) {
            // UPDATE
            await axios.patch(
                `${BASE_API}/product/ac-brand/${editingBrandId}/`,
                { name: brandInput },
                authHeaders()
            );
        } else {
            // CREATE
            await axios.post(
                `${BASE_API}/product/ac-brand/`,
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
            `${BASE_API}/product/ac-brand/${id}/`,
            authHeaders()
        );

        fetchBrands();   // refresh list
    };  

    const handleDeleteModel = async (id) => {
        if (!window.confirm("Delete this model?")) return;

        await axios.delete(`${BASE_API}/product/product-model/${id}/`, authHeaders());
        fetchModels();
    };

    const handleEditModel = (model) => {
        setEditingModel(model);
        setOpenAddModel(true);
    };

    // Ac type and Brand Filters

    const filteredAcList = list.filter((row) => {
        if (filters?.ac_type) {
            return row.name
                ?.toLowerCase()
                .includes(filters.ac_type.toLowerCase());
        }
        return true;
    });

    const filteredBrands = brands.filter((b) => {
        if (filters?.brand) {
            return b.name
                ?.toLowerCase()
                .includes(filters.brand.toLowerCase());
        }
        return true;
    });


 


    // Model related handlers will go here 

    const [loadingModels, setLoadingModels] = useState(false);

    const fetchModels = async (page = 1) => {
        try {
            setLoadingModels(true);

            const res = await axios.get(
                `${BASE_API}/product/product-model/?page=${page}`,
                authHeaders()
            );

            const data = res.data;
            const rows = data?.results ?? [];

            setModels(rows);

            const count = data?.count ?? rows.length;
            const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

            setTotalPages(pages);
            setCurrentPage(page);

        } catch (err) {
            console.error("Failed to fetch models:", err?.response?.data || err);
        } finally {
            setLoadingModels(false);
        }
    };


    const openVariantsModal = async (model) => {
        setActiveModel(model);
        await fetchVariants(model.id);
        setOpenVariantModal(true);
    };

    const fetchVariants = async (modelId) => {
        try {
            const res = await axios.get(
                `${BASE_API}/product/product-variant/?product_model=${modelId}`,
                authHeaders()
            );

            const rows = res.data?.results ?? [];
            setVariants(rows);
            console.log("variants:", rows);
        } catch (err) {
            console.error("Failed to fetch variants:", err?.response?.data || err);
            setVariants([]);
        }
    };


    useEffect(() => {
        if (activeTab === "model") {
            fetchModels();

        }
    }, [activeTab]);




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
                                {Array.isArray(filteredAcList) && filteredAcList.length > 0 ? (
                                    filteredAcList.map((row, index) => (
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
                                {filteredBrands.map((brand, index) => (
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
                <div className="space-y-6">

                    {/* Header with Create button */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800"> </h2>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
                            onClick={() => setOpenAddModel(true)}
                        >
                            + Create Model
                        </button>

                    </div>

                    {/* Models Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Sr.No</th>
                                    <th className="px-4 py-3">AC Type</th>
                                    <th className="px-4 py-3">Subtype</th>
                                    <th className="px-4 py-3">Brand</th>
                                    <th className="px-4 py-3">Model Name</th>
                                    <th className="px-4 py-3">Model No</th>
                                    <th className="px-4 py-3">Phase</th>
                                    <th className="px-4 py-3">Inverter</th>
                                    <th className="px-4 py-3">Variants</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {models.length === 0 ? (
                                    // ✅ Empty state
                                    <tr>
                                        <td colSpan={11} className="px-6 py-10 text-center text-gray-500">
                                            No models yet. Click{" "}
                                            <span className="font-medium">"Create Model"</span> to add one.
                                        </td>
                                    </tr>
                                ) : (
                                    // ✅ Render models
                                    models.map((model, index) => (
                                        <tr key={model.id ?? index} className="border-b">
                                            <td className="px-4 py-2">{index + 1}</td>
                                            <td className="px-4 py-2">{model.ac_type_name ?? "-"}</td>
                                            <td className="px-4 py-2">{model.ac_sub_type_name ?? "-"}</td>
                                            <td className="px-4 py-2">{model.brand_name ?? "-"}</td>
                                            <td className="px-4 py-2">{model.name}</td>
                                            <td className="px-4 py-2">{model.model_no}</td>

                                            <td className="px-4 py-2">{model.phase ?? "-"}</td>
                                            <td className="px-4 py-2">{model.is_inverter ? "Yes" : "No"}</td>
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={() => {
                                                        setActiveModel(model);
                                                        setOpenVariantModal(true);
                                                    }}
                                                    className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                                                >
                                                    View
                                                </button>

                                            </td>

                                            <td className="px-4 py-2">
                                                {model.is_active ? (
                                                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-x-4">
                                                    <button
                                                        onClick={() => handleEditModel(model)}   // 👈 edit handler
                                                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                                        title="Edit"
                                                    >
                                                        <FiEdit />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteModel(model.id)}   // 👈 delete handler
                                                        className="text-red-600 hover:text-red-800 cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                )}
                            </tbody>

                        </table>

                        {/* 🔹 Pagination Bar */}
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
                            {/* Left: Page info */}
                            <div className="text-sm text-gray-600">
                                Page <span className="font-medium">{currentPage}</span> of{" "}
                                <span className="font-medium">{totalPages}</span>
                            </div>

                            {/* Right: Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => {
                                        const prev = currentPage - 1;
                                        const hasFilter = Object.values(filters || {}).some(
                                            v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
                                        );
                                        hasFilter ? filterModel(filters, prev) : fetchModels(prev);
                                    }}
                                    className={`px-3 py-1.5 border rounded-md text-sm ${currentPage === 1
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "hover:bg-gray-100"
                                        }`}
                                >
                                    <MdOutlineNavigateBefore />
                                </button>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => {
                                        const next = currentPage + 1;
                                        const hasFilter = Object.values(filters || {}).some(
                                            v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
                                        );
                                        hasFilter ? filterModel(filters, next) : fetchModels(next);
                                    }}
                                    className={`px-3 py-1.5 border rounded-md text-sm ${currentPage === totalPages
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "hover:bg-gray-100"
                                        }`}
                                >
                                    <MdOutlineNavigateNext />
                                </button>
                            </div>
                        </div>






                    </div>
                    {/* Modal Popup */}
                    {openAddModel && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md">
                            <div className="w-full max-w-5xl">
                                <AddModelForm
                                    base_api={BASE_API}
                                    authHeaders={authHeaders}
                                    open={openAddModel}
                                    model={editingModel}
                                    onClose={() => {
                                        setOpenAddModel(false);
                                        setEditingModel(null);
                                    }}
                                    onSuccess={() => {
                                        setOpenAddModel(false);
                                        setEditingModel(null);
                                        fetchModels();
                                    }}
                                />
                            </div>
                        </div>
                    )}

                </div>
            )}

            {openVariantModal && activeModel && (
                <VariantModal
                    open={openVariantModal}
                    onClose={() => setOpenVariantModal(false)}
                    model={activeModel}
                    baseApi={BASE_API}
                    authHeaders={authHeaders}
                />
            )}



        </div>
    );
};



export default HighSide;


// Variant Modal Component
const VariantModal = ({ open, onClose, model, baseApi, authHeaders }) => {
    const [variants, setVariants] = useState([]);
    const [form, setForm] = useState({
        id: null,
        capacity: "",
        star: "",
        mrp: "",
        dp: "",
        active: true,
    });

    // Fetch variants
    const loadVariants = async () => {
        const res = await axios.get(
            `${baseApi}/product/product-variant/?product_model=${model.id}`,
            authHeaders()
        );

        const rows = res.data?.results ?? [];
        setVariants(
            rows.map(v => ({
                id: v.id,
                sku: v.sku,
                capacity: v.capacity,
                star: String(v.star_rating),
                mrp: v.mrp,
                dp: v.dp,
                active: v.is_active,
            }))
        );
    };

    useEffect(() => {
        if (open && model) loadVariants();
    }, [open, model]);

    // Form handlers
    const updateForm = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setForm({ id: null, capacity: "", star: "", mrp: "", dp: "", active: true });
    };

    // Add or Update variant
    const saveVariant = async () => {
        if (!form.capacity || !form.star || !form.mrp || !form.dp) {
            alert("Fill all fields");
            return;
        }

        const payload = {
            product_model: model.id,
            capacity: form.capacity,
            star_rating: Number(form.star),
            mrp: Number(form.mrp),
            dp: Number(form.dp),
            is_active: form.active,
        };

        if (form.id) {
            // UPDATE
            await axios.put(
                `${baseApi}/product/product-variant/${form.id}/`,
                payload,
                authHeaders()
            );
        } else {
            // CREATE
            await axios.post(
                `${baseApi}/product/product-variant/`,
                payload,
                authHeaders()
            );
        }

        await loadVariants();
        resetForm();
    };

    const handleEdit = (v) => {
        setForm(v); // load into form
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this variant?")) return;

        await axios.delete(
            `${baseApi}/product/product-variant/${id}/`,
            authHeaders()
        );

        loadVariants();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-5xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Variants – {model?.name}</h2>
                    <button onClick={onClose}><FiX /></button>
                </div>

                {/* 🔹 Single Add/Edit Form */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                    <input value={form.capacity} onChange={e => updateForm("capacity", e.target.value)} placeholder="Capacity" className="border px-3 py-2 rounded" />
                    <select value={form.star} onChange={e => updateForm("star", e.target.value)} className="border px-3 py-2 rounded">
                        <option value="">Star</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Star</option>
                        <option value="3">3 Star</option>
                        <option value="4">4 Star</option>
                        <option value="5">5 Star</option>
                    </select>
                    <input value={form.mrp} onChange={e => updateForm("mrp", e.target.value)} placeholder="MRP" className="border px-3 py-2 rounded" />
                    <input value={form.dp} onChange={e => updateForm("dp", e.target.value)} placeholder="DP" className="border px-3 py-2 rounded" />
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.active} onChange={e => updateForm("active", e.target.checked)} />
                        Active
                    </label>

                    <div className="col-span-full flex gap-2 mt-2">
                        <button onClick={saveVariant} className="px-4 py-2 bg-blue-600 text-white rounded">
                            {form.id ? "Update" : "Add"}
                        </button>
                        {form.id && (
                            <button onClick={resetForm} className="px-4 py-2 border rounded">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* 🔹 Variants Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">SKU No</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Capacity</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Star</th>
                                <th className="px-4 py-3 font-medium text-gray-700">MRP</th>
                                <th className="px-4 py-3 font-medium text-gray-700">DP</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-700 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {variants.map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3">{v.sku}</td>
                                    <td className="px-4 py-3">{v.capacity}</td>
                                    <td className="px-4 py-3">{v.star}</td>
                                    <td className="px-4 py-3">₹{Number(v.mrp).toLocaleString()}</td>
                                    <td className="px-4 py-3">₹{Number(v.dp).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        {v.active ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                Inactive
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleEdit(v)}
                                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                                title="Edit"
                                            >
                                                <FiEdit size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(v.id)}
                                                className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                                title="Delete"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>


            </div>
        </div>
    );
};

