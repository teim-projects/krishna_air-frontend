import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";

const AcMaterials = ({ open, onClose, base_api }) => {
    const [acTypes, setAcTypes] = useState([]);
    const [items, setItems] = useState([]);

    const [selectedAcType, setSelectedAcType] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);

    const [loading, setLoading] = useState(false);

    // Auth headers
    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    });

    // 🔹 Fetch AC Types
    const fetchAcTypes = async () => {
        try {
            const res = await axios.get(
                `${base_api}/product/actype/`,
                authHeaders()
            );
            const data = res.data?.results || res.data;
            setAcTypes(data || []);
        } catch (err) {
            console.error("AC Types error:", err);
        }
    };

    // 🔹 Fetch Items
    const fetchItems = async () => {
        try {
            const res = await axios.get(
                `${base_api}/product/item/?all=true`,
                authHeaders()
            );
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setItems(data);
        } catch (err) {
            console.error("Items error:", err);
        }
    };

    // 🔹 Fetch already mapped materials
    const fetchSelectedMaterials = async (acTypeId) => {
        try {
            const res = await axios.get(
                `${base_api}/product/ac-material/?ac_type=${acTypeId}`,
                authHeaders()
            );

            const data = res.data?.results || [];

            const materialIds = data.map((obj) => obj.material_id);

            setSelectedItems(materialIds);
        } catch (err) {
            console.error("Fetch selected materials error:", err);
            setSelectedItems([]);
        }
    };

    // 🔹 Load data when modal opens
    useEffect(() => {
        if (open) {
            fetchAcTypes();
            fetchItems();

            setSelectedAcType("");
            setSelectedItems([]);
        }
    }, [open]);

    // 🔹 Load selected materials when AC type changes
    useEffect(() => {
        if (selectedAcType) {
            fetchSelectedMaterials(selectedAcType);
        } else {
            setSelectedItems([]);
        }
    }, [selectedAcType]);

    // ❗ AFTER hooks
    if (!open) return null;

    // Convert items to React Select options
    const itemOptions = items.map((item) => ({
        value: item.id,
        label: `${item.item_code} - ${item.material_type_name || ""}`,
    }));

    // 🔹 Submit (Bulk Update)
    const handleSubmit = async () => {
        if (!selectedAcType) {
            alert("Please select AC Type");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ac_type: selectedAcType,
                material: selectedItems,
            };

            await axios.post(
                `${base_api}/product/ac-material/bulk-update/`,
                payload,
                authHeaders()
            );

            alert("Materials updated successfully!");
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to update materials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-white w-[800px] max-h-[90vh] overflow-auto rounded-lg shadow-lg p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-3 text-xl text-gray-600 hover:text-black"
                >
                    ✖
                </button>

                <h2 className="text-xl font-semibold mb-4">Set AC Materials</h2>

                <div className="space-y-4">
                    {/* AC TYPE */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Select AC Type
                        </label>
                        <select
                            value={selectedAcType}
                            onChange={(e) => setSelectedAcType(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">-- Select AC Type --</option>
                            {acTypes.map((ac) => (
                                <option key={ac.id} value={ac.id}>
                                    {ac.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* MATERIAL MULTI SELECT */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Select Materials
                        </label>

                        <Select
                            isMulti
                            options={itemOptions}
                            value={itemOptions.filter((opt) =>
                                selectedItems.includes(opt.value)
                            )}
                            onChange={(selected) =>
                                setSelectedItems(
                                    selected ? selected.map((s) => s.value) : []
                                )
                            }
                            placeholder="Search and select materials..."
                            className="mt-1"
                        />

                        {/* Selected Count */}
                        <p className="text-sm text-gray-500 mt-1">
                            Selected: {selectedItems.length} materials
                        </p>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedAcType}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcMaterials;