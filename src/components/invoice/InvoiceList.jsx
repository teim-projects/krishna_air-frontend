import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import axios from "axios";
import { FaWhatsapp } from "react-icons/fa";
import { MdRemoveRedEye, MdDownload, MdEdit, MdDelete, MdEmail, MdHistory, MdFileDownload } from "react-icons/md";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useDocPermissions } from "../../hooks/useAuth";
import SendTemplateModal from "../common/SendTemplateModal";
import CreateTemplateModal from "../common/CreateTemplateModal";

const BASE_API =
  import.meta.env.VITE_BASE_API_URL;

const api = axios.create({
  baseURL: `${BASE_API}/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * InvoiceList
 * Props:
 *   onAdd    – called when user clicks "+ Create Invoice"
 *   onEdit   – called with invoice id when user clicks Edit
 *   filters  – applied filter object from FiltersPanel (passed by Invoice.jsx)
 *
 * Exposed ref methods:
 *   refreshList() – force re-fetch (called from parent after add/edit)
 */
const InvoiceList = forwardRef(({ onAdd, onEdit, filters = {} }, ref) => {
  const { canCreate, canEdit, canDelete } = useDocPermissions('Invoice');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // ─── Build query string from filters ───────────────────────────────────────
  const buildParams = useCallback((f = {}) => {
    const params = new URLSearchParams();

    // Full-text search → DRF SearchFilter uses ?search=
    if (f.search) params.set("search", f.search);

    // Date range → InvoiceFilter date_from / date_to
    if (f.date?.from) params.set("date_from", f.date.from);
    if (f.date?.to)   params.set("date_to",   f.date.to);

    // GST type → InvoiceFilter exact match
    if (f.gst_type) params.set("gst_type", f.gst_type);

    return params.toString();
  }, []);

  // ─── Fetch invoices whenever filters change ─────────────────────────────────
  const fetchInvoices = useCallback(() => {
    setLoading(true);
    const qs = buildParams(filters);
    api
      .get(`invoice/invoice/${qs ? `?${qs}` : ""}`)
      .then((res) => {
        setData(res.data.results || res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [filters, buildParams]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshList: fetchInvoices
  }));

  const handleExportExcel = () => {
    try {
      if (!data || data.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "No invoice data available to export." });
        return;
      }

      const exportData = data.map((r, idx) => ({
        "Sr.No": idx + 1,
        "Invoice No": r.invoice_no || "-",
        "Invoice Date": r.invoice_date ? new Date(r.invoice_date).toLocaleDateString() : "-",
        "Buyer": r.buyer_name || "-",
        "GST Type": r.gst_type || "-",
        "Grand Total": `₹${Number(r.grand_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Invoices_Export_${dateStr}.xlsx`);

      Swal.fire({
        icon: "success",
        title: "Exported!",
        text: "Invoice list exported successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Export Error:", err);
      Swal.fire({ icon: "error", title: "Export Failed", text: err.message || "Could not export invoice excel file." });
    }
  };

  /* ================= PDF VIEW ================= */

  const handleViewPDF = async (invoiceId) => {
    try {
      const response = await api.get(
        `/invoice/${invoiceId}/pdf/`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
      alert("Failed to view PDF");
    }
  };

  /* ================= PDF DOWNLOAD ================= */

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await api.get(
        `/invoice/${invoiceId}/pdf/`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;

      // ✅ IMPORTANT
      link.setAttribute("download", `invoice_${invoiceId}.pdf`);

      document.body.appendChild(link);
      link.click();

      // remove silently
      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    }
  };

  const handleOpenEmailModal = (invoice) => {
    setSelectedDoc(invoice);
    setEmailModalOpen(true);
  };

  /* ================= DELETE ================= */

  const handleDeleteInvoice = async (invoiceId) => {
    const ok = window.confirm("Delete this invoice?");
    if (!ok) return;

    try {
      await api.delete(`invoice/invoice/${invoiceId}/`);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section — matches PurchaseOrder.jsx */}
      <div className="bg-white p-4 rounded-md shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Invoice Management</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${data.length} invoice(s) found`}
          </div>
        </div>
        <div className="w-full sm:w-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:shadow-sm flex items-center gap-1.5"
            title="Export Invoices Excel Sheet"
          >
            <MdFileDownload className="text-sky-600 text-base" />
            <span>Export</span>
          </button>

          {canCreate && (
            <button
              onClick={onAdd}
              className="w-full sm:w-auto px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 text-center"
            >
              + Create Invoice
            </button>
          )}
        </div>
      </div>

      {/* Table — matches PurchaseOrder.jsx */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Invoice No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Buyer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Total Amount</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((inv, index) => (
              <tr key={inv.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  {inv.invoice_no}
                </td>

                <td className="px-4 py-3 text-sm">
                  {inv.invoice_date
                    ? new Date(inv.invoice_date).toLocaleDateString()
                    : "N/A"}
                </td>

                <td className="px-4 py-3 text-sm">{inv.buyer_name}</td>

                <td className="px-4 py-3 text-sm font-medium">
                  ₹
                  {Number(inv.grand_total || 0).toLocaleString(
                    "en-IN",
                    { minimumFractionDigits: 2 }
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* ORDER matches PurchaseOrder.jsx: History | View | Edit | Download | WhatsApp | Email | Delete */}
                    <button className="px-2 py-1 bg-purple-200 text-purple-800 rounded hover:bg-purple-300" title="Invoice History">
                      <MdHistory />
                    </button>

                    <button onClick={() => handleViewPDF(inv.id)} className="px-2 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300" title="View">
                      <MdRemoveRedEye />
                    </button>

                    {canEdit && (
                      <button onClick={() => onEdit(inv.id)} className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300" title="Edit">
                        <MdEdit />
                      </button>
                    )}

                    <button onClick={() => handleDownloadPDF(inv.id)} className="px-2 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300" title="Download">
                      <MdDownload />
                    </button>

                    <button className="px-2 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300" title="WhatsApp">
                      <FaWhatsapp />
                    </button>

                    <button onClick={() => handleOpenEmailModal(inv)} className="px-2 py-1 bg-sky-200 text-sky-800 rounded hover:bg-sky-300" title="Email">
                      <MdEmail />
                    </button>

                    {canDelete && (
                      <button onClick={() => handleDeleteInvoice(inv.id)} className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300" title="Delete">
                        <MdDelete />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {data.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                  No invoices found. Create your first invoice!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SendTemplateModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        category="INVOICES"
        documentId={selectedDoc?.id}
        documentData={selectedDoc || {}}
      />


    </div>
  );
});

export default InvoiceList;