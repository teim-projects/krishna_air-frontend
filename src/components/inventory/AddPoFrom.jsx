import React, { useState, useEffect } from "react";
import ReusableForm from "../Form";
import axios from "axios";
import TermsMultiSelect from "../TermsMultiSelect";
import useTermTypes from "../../hooks/useTermTypes";
import ItemSelectionEngine from "../ItemSelectionEngine";


const AddPoForm = ({ open, onClose, baseApi, po, onSuccess, token }) => {

    // term types are needed to get the correct terms for payment and delivery
    const { getOrCreateTermTypeId } = useTermTypes({ baseApi, token });
    const [paymentTypeId, setPaymentTypeId] = useState(null);
    const [deliveryTypeId, setDeliveryTypeId] = useState(null);




    useEffect(() => {
        const initTypes = async () => {
            const paymentId = await getOrCreateTermTypeId("Po Payment");
            const deliveryId = await getOrCreateTermTypeId("Delivery");

            setPaymentTypeId(paymentId);
            setDeliveryTypeId(deliveryId);
        };

        if (open) {
            initTypes();
        }
    }, [open]);
    // ------------------------------

    const [items, setItems] = useState([]);
    const [lowItems, setLowItems] = useState([]);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        vendor: "",
        branch: "",
        site: "",
        book_no: "",
        po_date: "",
        notes: "",
        is_active: true,
    });


    // If editing existing PO
    useEffect(() => {
        if (po) {
            setFormData({
                vendor: po.vendor || "",
                branch: po.branch || "",
                site: po.site || "",
                book_no: po.book_no || "",
                po_date: po.po_date || "",
                notes: po.notes || "",
                is_active: po.is_active ?? true,
            });
        }
    }, [po]);

    const fields = [
        {
            name: "vendor",
            label: "Vendor",
            type: "select",
            required: true,
            placeholder: "Select Vendor",
            options: [
                { value: 1, label: "Vendor A" },
                { value: 2, label: "Vendor B" },
            ],
        },
        {
            name: "branch",
            label: "Branch",
            type: "select",
            required: true,
            placeholder: "Select Branch",
            options: [
                { value: 1, label: "Pune Branch" },
                { value: 2, label: "Mumbai Branch" },
            ],
        },
        {
            name: "site",
            label: "Site",
            type: "select",
            required: false,
            placeholder: "Select Site",
            options: [
                { value: 1, label: "Pune Site" },
                { value: 2, label: "Mumbai Site" },
            ],
        },
        {
            name: "book_no",
            label: "Book No",
            type: "text",
            required: true,
            placeholder: "Enter Book No",
        },
        {
            name: "po_date",
            label: "PO Date",
            type: "date",
            required: true,
        },
        {
            name: "quotation_ref_no",
            label: "Quotation Ref No",
            type: "text",
            required: false,
            placeholder: "Enter Quotation Ref No",
        },
        {
            name: "quotation_date",
            label: "Quotation Date",
            type: "date",
            required: false,
        },
        {
            name: "contact_name",
            label: "Contact Name",
            type: "text",
            required: false,
            placeholder: "Enter Contact Name",
        },
        {
            name: "contact_no",
            label: "Contact No",
            type: "text",
            required: false,
            placeholder: "Enter Contact No",
        },

        {
            name: "items_section",
            label: "Items",
            component: () => (
                <ItemSelectionEngine
                    baseApi={baseApi}
                    authToken={token}
                    items={items}
                    setItems={setItems}
                    lowItems={lowItems}
                    setLowItems={setLowItems}
                    mode="quotation"
                />
            ),
            gridCols: 2,
        },

        // {
        //     name: "notes",
        //     label: "Notes",
        //     type: "textarea",
        //     gridCols: 2,
        //     placeholder: "Enter additional notes...",
        // },

        // Terms MultiSelects
        {
            name: "payment_terms",
            label: "Payment Terms",
            required: true,
            component: ({ value, onChange }) => (
                <TermsMultiSelect
                    value={value}
                    onChange={onChange}
                    termsType={paymentTypeId}
                    baseApi={baseApi}
                    token={token}
                />
            ),
            gridCols: 2,
        },
        {
            name: "delivery_terms",
            label: "Delivery Terms",
            required: true,
            component: ({ value, onChange }) => (
                <TermsMultiSelect
                    value={value}
                    onChange={onChange}
                    termsType={deliveryTypeId}
                    baseApi={baseApi}
                    token={token}
                />
            ),
            gridCols: 2,
        },
    ];

    const handleSubmit = async (data) => {
        try {
            setLoading(true);

            if (po) {
                // Update
                await axios.put(`${baseApi}/purchase-orders/${po.id}/`, data);
            } else {
                // Create
                await axios.post(`${baseApi}/purchase-orders/`, data);
            }

            onSuccess && onSuccess();
            onClose && onClose();
        } catch (error) {
            console.error("Error saving PO:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg 
                    max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">
                        {po ? "Edit Purchase Order" : "Add Purchase Order"}
                    </h3>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <ReusableForm
                        fields={fields}
                        formData={formData}
                        onChange={setFormData}
                        onSubmit={handleSubmit}
                        loading={loading}
                        onCancel={onClose}
                        showReset={true}
                        onReset={() =>
                            setFormData({
                                vendor: "",
                                branch: "",
                                site: "",
                                book_no: "",
                                po_date: "",
                                notes: "",
                                is_active: true,
                            })
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default AddPoForm;