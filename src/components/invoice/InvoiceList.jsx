import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import axios from "axios";
import { FaWhatsapp } from "react-icons/fa";
import { MdRemoveRedEye, MdDownload, MdEdit, MdDelete, MdEmail, MdHistory } from "react-icons/md";

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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

  if (loading) return <div style={loadingWrap}>Loading...</div>;

  return (
    <div style={pageWrap}>
      {/* HEADER */}
      <div style={headerWrap}>
        <button onClick={onAdd} style={addBtn}>
          + Create Invoice
        </button>
      </div>

      {/* CARD */}
      <div style={cardWrap}>
        <h3 style={cardTitle}>Invoices</h3>

        <table width="100%" style={{ borderCollapse: "collapse" }}>
          <thead style={thead}>
            <tr>
              <th style={th}>Invoice No</th>
              <th style={th}>Date</th>
              <th style={th}>Buyer</th>
              <th style={th}>Total Amount</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((inv) => (
              <tr key={inv.id} style={row}>
                <td style={{ ...td, fontWeight: 600 }}>
                  {inv.invoice_no}
                </td>

                <td style={td}>
                  {inv.invoice_date
                    ? new Date(inv.invoice_date).toLocaleDateString()
                    : "N/A"}
                </td>

                <td style={td}>{inv.buyer_name}</td>

                <td style={{ ...td, fontWeight: 600 }}>
                  ₹
                  {Number(inv.grand_total || 0).toLocaleString(
                    "en-IN",
                    { minimumFractionDigits: 2 }
                  )}
                </td>

                {/* ACTIONS */}
                <td style={td}>
                  <div style={actionWrap}>
                    {/* ORDER matches PurchaseOrder.jsx: History | View | Edit | Download | WhatsApp | Email | Delete */}
                    <button style={btnPurple} title="Invoice History">
                      <MdHistory />
                    </button>

                    <button onClick={() => handleViewPDF(inv.id)} style={btnBlue} title="View">
                      <MdRemoveRedEye />
                    </button>

                    <button onClick={() => onEdit(inv.id)} style={btnYellow} title="Edit">
                      <MdEdit />
                    </button>

                    <button onClick={() => handleDownloadPDF(inv.id)} style={btnGreen} title="Download">
                      <MdDownload />
                    </button>

                    <button style={btnGreen} title="WhatsApp">
                      <FaWhatsapp />
                    </button>

                    <button style={btnSky} title="Email">
                      <MdEmail />
                    </button>

                    <button onClick={() => handleDeleteInvoice(inv.id)} style={btnRed} title="Delete">
                      <MdDelete />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {data.length === 0 && !loading && (
              <tr>
                <td colSpan="5" style={emptyRow}>
                  No invoices found. Create your first invoice!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default InvoiceList;

/* ================= UI STYLES (MATCH QUOTATION PAGE) ================= */

const pageWrap = {
  padding: "30px",
  background: "#f6f7fb",
  minHeight: "100vh",
};

const headerWrap = {
  marginBottom: "20px",
};

const addBtn = {
  background: "#2d6cdf",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
};

const cardWrap = {
  background: "#fff",
  borderRadius: "12px",
  padding: "22px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};

const cardTitle = {
  marginBottom: "12px",
  fontWeight: 600,
};

const thead = {
  background: "#f3f4f8",
};

const th = {
  textAlign: "left",
  padding: "12px",
  fontSize: "13px",
};

const td = {
  padding: "12px",
  fontSize: "13px",
};

const row = {
  borderBottom: "1px solid #eee",
};

const emptyRow = {
  textAlign: "center",
  padding: "40px",
  color: "#777",
};

const actionWrap = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

// Action button styles — match PurchaseOrder.jsx exactly
// PO ref: className="px-2 py-1 bg-{color}-200 text-{color}-800 rounded text-sm"
const _btn = { padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", fontSize: "14px" };
const btnBlue   = { ..._btn, background: "#bfdbfe", color: "#1e40af" }; // bg-blue-200   text-blue-800
const btnGreen  = { ..._btn, background: "#bbf7d0", color: "#166534" }; // bg-green-200  text-green-800
const btnYellow = { ..._btn, background: "#fef08a", color: "#854d0e" }; // bg-yellow-200 text-yellow-800
const btnSky    = { ..._btn, background: "#bae6fd", color: "#075985" }; // bg-sky-200    text-sky-800
const btnRed    = { ..._btn, background: "#fecaca", color: "#991b1b" }; // bg-red-200    text-red-800
const btnPurple = { ..._btn, background: "#e9d5ff", color: "#6b21a8" }; // bg-purple-200 text-purple-800

const loadingWrap = {
  padding: "25px",
  background: "#f6f7fb",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};