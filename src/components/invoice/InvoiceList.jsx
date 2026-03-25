import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { FaWhatsapp } from "react-icons/fa";
import { FiMail } from "react-icons/fi";

import { FiEye, FiDownload, FiTrash2, FiEdit } from "react-icons/fi";

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

const InvoiceList = forwardRef(({ onAdd, onEdit }, ref) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = () => {
    api
      .get("invoice/invoice/")
      .then((res) => {
        setData(res.data.results || res.data);
      })
      .catch((err) => console.error(err));
  };

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

                {/* ACTIONS ICON UI */}
                <td style={td}>
                  <div style={actionWrap}>
  <button
    onClick={() => handleViewPDF(inv.id)}
    style={iconBtn}
    title="View PDF"
  >
    <FiEye size={16} />
  </button>

  <button
    onClick={() => handleDownloadPDF(inv.id)}
    style={iconBtn}
    title="Download PDF"
  >
    <FiDownload size={16} />
  </button>

  {/* UI ONLY ICONS */}
  <button style={iconBtn} title="WhatsApp">
    <FaWhatsapp size={16} color="#25D366" />
  </button>

  <button style={iconBtn} title="Mail">
    <FiMail size={16} />
  </button>

  <button
    onClick={() => onEdit(inv.id)}
    style={iconBtn}
    title="Edit"
  >
    <FiEdit size={16} />
  </button>

  <button
    onClick={() => handleDeleteInvoice(inv.id)}
    style={iconBtn}
    title="Delete"
  >
    <FiTrash2 size={16} color="#e74c3c" />
  </button>
</div>
                </td>
              </tr>
            ))}

            {data.length === 0 && (
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
  gap: "10px",
};

const iconBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
};