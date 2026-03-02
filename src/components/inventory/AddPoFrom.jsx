import React, { useState, useEffect, use } from "react";
import ReusableForm from "../Form";
import axios from "axios";
import TermsMultiSelect from "../TermsMultiSelect";
import useTermTypes from "../../hooks/useTermTypes";
// import ItemSelectionEngine from "../ItemSelectionEngine";
import PurchaseOrderItems from "./PurchaseOrderItems";

const AddPoForm = ({ open, onClose, baseApi, po, onSuccess, token }) => {

    // term types are needed to get the correct terms for payment and delivery
    const { getOrCreateTermTypeId } = useTermTypes({ baseApi, token });
    const [loading, setLoading] = useState(false);
    const [paymentTypeId, setPaymentTypeId] = useState(null);
    const [deliveryTypeId, setDeliveryTypeId] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [branches, setBranches] = useState([]);
    const [sites, setSites] = useState([]);




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


    const [formData, setFormData] = useState({
        vendor: "",
        branch: "",
        site: "",
        book_no: "",
        po_date: "",
        quotation_ref_no: "",
        quotation_date: "",
        contact_name: "",
        contact_no: "",

        gst_percentage: 18,
        gst_type: "exclusive",
        transport_charges: 0,
        round_off: 0,

        products: [],

        payment_terms: [],
        delivery_terms: [],
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
                quotation_ref_no: po.quotation_ref_no || "",
                quotation_date: po.quotation_date || "",
                contact_name: po.contact_name || "",
                contact_no: po.contact_no || "",
                products: po.products || [],
                payment_terms: po.payment_terms || [],
                delivery_terms: po.delivery_terms || [],
            });
        }
    }, [po]);

    // Fetch vendors, branches, sites for select options (if needed)
    const fetchVendors = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseApi}/inventory/vendors/`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            setVendors(response.data.results || response.data);
            console.log("vendors", response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching vendors:", error);
        } finally {
            setLoading(false);
        }
    }
   
    const fetchBranches = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseApi}/auth/branch/`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            setBranches(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching branches:", error);
        }

        finally {
            setLoading(false);
        }
    }


    const fetchSites = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseApi}/auth/site/`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            setSites(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching sites:", error);
        }

        finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        if (open) {
            fetchVendors(); 
            fetchBranches();
            fetchSites();
        }   
    }, [open]);

    // Define form fields configuration

    const fields = [
        {
            name: "vendor",
            label: "Vendor",
            type: "select",
            required: true,
            placeholder: "Select Vendor",
            options: vendors.map(vendor => ({
                value: vendor.id,
                label: vendor.name
            })),
        },
        {
            name: "branch",
            label: "Branch",
            type: "select",
            required: true,
            placeholder: "Select Branch",
            options: branches.map(branch => ({
                value: branch.id,
                label: branch.name
            })),
        },
        {
            name: "site",
            label: "Site",
            type: "select",
            required: false,
            placeholder: "Select Site",
            options: sites.map(site => ({
                value: site.id,
                label: site.name
            })),
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
            name: "products_section",
            label: "Items",
            component: () => (
                <PurchaseOrderItems
                    baseApi={baseApi}
                    token={token}
                    initialProducts={formData.products || []}
                    onProductsChange={(products) =>
                        setFormData(prev => ({
                            ...prev,
                            products
                        }))
                    }
                />
            ),
            gridCols: 2,
        },

        {
            name: "gst_percentage",
            label: "GST %",
            type: "number",
        },
        {
            name: "gst_type",
            label: "GST Type",
            type: "select",
            options: [
                { value: "exclusive", label: "Exclusive" },
                { value: "inclusive", label: "Inclusive" },
            ],
        },
        {
            name: "transport_charges",
            label: "Transport Charges",
            type: "number",
        },
        {
            name: "round_off",
            label: "Round Off",
            type: "number",
        },

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

            const payload = {
                vendor: data.vendor,
                branch: data.branch,
                site: data.site,
                book_no: data.book_no,
                po_date: data.po_date,
                quotation_ref_no: data.quotation_ref_no,
                quotation_date: data.quotation_date,
                contact_name: data.contact_name,
                contact_no: data.contact_name,

                gst_percentage: data.gst_percentage,
                gst_type: data.gst_type,
                transport_charges: data.transport_charges,
                round_off: data.round_off,

                terms_conditions: [
                    ...(data.payment_terms || []),
                    ...(data.delivery_terms || [])
                ],

                products: data.products
            };

            if (po) {
                await axios.put(`${baseApi}/purchase-orders/${po.id}/`, payload);
            } else {
                await axios.post(`${baseApi}/purchase-orders/`, payload);
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