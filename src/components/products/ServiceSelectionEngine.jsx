// ServiceSelectionEngine.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const ServiceSelectionEngine = ({ base_api, onSelectionChange, resetTrigger }) => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [selectedServices, setSelectedServices] = useState([]);

    // Auth headers
    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    });

    // Fetch Categories
    const fetchCategories = async () => {
        try {
            const res = await axios.get(
                `${base_api}/quotation/service-categories/`,
                authHeaders()
            );
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setCategories(data);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    // Fetch Subcategories when category changes
    const fetchSubcategories = async (categoryId) => {
        try {
            const category = categories.find(cat => cat.id === parseInt(categoryId));
            if (category && category.subcategories) {
                setSubcategories(category.subcategories);
            }
        } catch (err) {
            console.error("Error fetching subcategories:", err);
        }
    };

    // Fetch Materials (Services) when subcategory changes
    const fetchMaterials = async (subcategoryId) => {
        try {
            const res = await axios.get(
                `${base_api}/quotation/service-masters/?subcategory=${subcategoryId}`,
                authHeaders()
            );
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setMaterials(data);
        } catch (err) {
            console.error("Error fetching materials:", err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchSubcategories(selectedCategory);
            setSelectedSubcategory("");
            setMaterials([]);
        } else {
            setSubcategories([]);
            setMaterials([]);
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedSubcategory) {
            fetchMaterials(selectedSubcategory);
        } else {
            setMaterials([]);
        }
    }, [selectedSubcategory]);

    useEffect(() => {
        if (onSelectionChange) {
            const selectedData = materials
                .filter(mat => selectedServices.includes(mat.id))
                .map(mat => ({
                    id: mat.id,
                    service_name: mat.name,
                    category_name: mat.category_name,
                    subcategory_name: mat.subcategory_name,
                    item_code: mat.item_code,
                    unit: mat.unit,
                    total_rate: mat.total_rate
                }));

            onSelectionChange({
                services: selectedData
            });
        }
    }, [selectedServices]);

    useEffect(() => {
        setSelectedServices([]);
    }, [resetTrigger]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Category Dropdown */}
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border rounded-md px-3 py-2"
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                {/* Subcategory Dropdown */}
                <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="border rounded-md px-3 py-2"
                    disabled={!selectedCategory}
                >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((subcat) => (
                        <option key={subcat.id} value={subcat.id}>
                            {subcat.name}
                        </option>
                    ))}
                </select>

                {/* Material Dropdown */}
                <select
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val && !selectedServices.includes(val)) {
                            setSelectedServices([...selectedServices, val]);
                        }
                    }}
                    className="border rounded-md px-3 py-2"
                    disabled={!selectedSubcategory}
                >
                    <option value="">Select Material</option>
                    {materials.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                            {mat.item_code} - {mat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Selected Services Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
                {selectedServices.map((id) => {
                    const service = materials.find(m => m.id === id);
                    return (
                        <div
                            key={id}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                        >
                            {service?.item_code} - {service?.name}
                            <button
                                onClick={() =>
                                    setSelectedServices(selectedServices.filter(i => i !== id))
                                }
                                className="text-red-500 font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default ServiceSelectionEngine;
