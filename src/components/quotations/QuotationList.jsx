// quotation/QuotationList.jsx

import { useEffect, useState, useCallback } from "react";
import React from "react";
import axios from "axios";

import {
  MdRemoveRedEye,
  MdDownload,
  MdEdit,
  MdDelete,
  MdEmail,
  MdHistory,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";

const BASE_API =
  import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${BASE_API}/`,
});

// TOKEN
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const normalize = (d) => (Array.isArray(d) ? d : d?.results || []);

/**
 * QuotationList
 * Props:
 *   onAdd    – called when user clicks "+ Add Quotation"
 *   onEdit   – called with quotation id when user clicks Edit
 *   filters  – applied filter object from FiltersPanel (parent passes via Quotation.jsx)
 */
export default function QuotationList({ onAdd, onEdit, filters = {} }) {
  const [list, setList] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState({});
  const [openRow, setOpenRow] = useState(null);
  const [loading, setLoading] = useState(false);

  // CLOSE PANEL ON OUTSIDE CLICK
  useEffect(() => {
    const close = () => setOpenRow(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // ─── Build query string from filters ───────────────────────────────────────
  const buildParams = useCallback((f = {}) => {
    const params = new URLSearchParams();

    // Full-text search → DRF SearchFilter uses ?search=
    if (f.search) params.set("search", f.search);

    // Date range → custom InvoiceFilter date_from / date_to
    if (f.date?.from) params.set("date_from", f.date.from);
    if (f.date?.to)   params.set("date_to",   f.date.to);

    return params.toString();
  }, []);

  // ─── Fetch quotations whenever filters change ───────────────────────────────
  const fetchQuotations = useCallback(() => {
    setLoading(true);
    const qs = buildParams(filters);
    api
      .get(`quotation/quotation/${qs ? `?${qs}` : ""}`)
      .then((res) => {
        const data = normalize(res.data);
        const initialVersion = {};
        data.forEach((q) => {
          const active = q.versions?.find((v) => v.is_active);
          if (active) initialVersion[q.id] = active.id;
        });
        setSelectedVersion(initialVersion);
        setList(data);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [filters, buildParams]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const getActiveVersion = (q) =>
    q.versions?.find((v) => v.id === selectedVersion[q.id]);

  const handleViewPDF = async (quotationId, versionId = null) => {
    try {
      const url = versionId
        ? `quotation/quotation/${quotationId}/version/${versionId}/pdf/`
        : `quotation/quotation/${quotationId}/pdf/`;

      const response = await api.get(url, { responseType: "blob" });

      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);

      window.open(fileURL);

    } catch (err) {
      console.error(err);
      alert("Failed to open PDF");
    }
  };

  const handleDownloadPDF = async (quotationId, versionId = null) => {
    try {
      const url = versionId
        ? `quotation/quotation/${quotationId}/version/${versionId}/pdf/`
        : `quotation/quotation/${quotationId}/pdf/`;

      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `quotation_${quotationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    }
  };

  const handleDeleteVersion = async (quotationId, versionId) => {
    const ok = window.confirm("Delete this version?");
    if (!ok) return;

    try {
      await api.delete(
        `quotation/quotation/${quotationId}/version/${versionId}/delete/`
      );
      fetchQuotations();
    } catch (err) {
      console.error(err);
      alert("Failed to delete version");
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return "0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  if (loading) return <div style={loadingWrap}>Loading...</div>;

  return (
    <div style={pageWrap}>
      {/* ADD BUTTON */}
      <div style={headerWrap}>
        <button onClick={onAdd} style={addBtn}>
          + Add Quotation
        </button>
      </div>

      <div style={cardWrap}>
        <h3 style={cardTitle}>Quotations</h3>

        <table width="100%" style={{ borderCollapse: "collapse" }}>
          <thead style={thead}>
            <tr>
              <th style={th}>Sr.No</th>
              <th style={th}>Customer Name</th>
              <th style={th}>Site Name</th>
              <th style={th}>Products</th>
              <th style={th}>Total Amount</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((q, i) => {
              const activeVersion = getActiveVersion(q);

              return (
                <React.Fragment key={q.id}>
                  {/* MAIN ROW */}
                  <tr style={row}>
                    <td style={td}>{i + 1}</td>

                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>
                        {q.customer_name}
                      </div>
                      <div style={subText}>{q.customer_contact}</div>
                    </td>

                    <td style={td}>{q.site_name_detail || q.site_name || "-"}</td>

                    <td style={td}>
                      {activeVersion?.product_count || "1 item(s)"}
                    </td>

                    <td style={td}>
                      ₹{formatAmount(activeVersion?.total_amount)}
                    </td>


                    {/* ACTIONS */}
                    <td style={td}>
                      <div style={actionWrap}>
                        {/* ORDER matches PurchaseOrder.jsx: History | View | Edit | Download | WhatsApp | Email | Delete */}
                        <button
                          style={openRow === q.id ? btnPurpleActive : btnPurple}
                          title="Version History"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRow(openRow === q.id ? null : q.id);
                          }}
                        >
                          <MdHistory />
                        </button>

                        <button onClick={() => handleViewPDF(q.id)} style={btnBlue} title="View">
                          <MdRemoveRedEye />
                        </button>

                        <button onClick={() => onEdit(q.id)} style={btnYellow} title="Edit">
                          <MdEdit />
                        </button>

                        <button onClick={() => handleDownloadPDF(q.id)} style={btnGreen} title="Download">
                          <MdDownload />
                        </button>

                        <button style={btnGreen} title="WhatsApp">
                          <FaWhatsapp />
                        </button>

                        <button style={btnSky} title="Email">
                          <MdEmail />
                        </button>

                        <button onClick={() => handleDeleteVersion(q.id, activeVersion.id)} style={btnRed} title="Delete">
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* FULL VERSION HISTORY TABLE */}
                  {openRow === q.id && (
                    <tr>
                      <td colSpan="6" style={versionTableWrap}>
                        <div style={versionTitle}>Version History</div>

                        <table width="100%" style={versionTable}>
                          <thead style={thead}>
                            <tr>
                              <th style={thSmall}>Version</th>
                              <th style={thSmall}>Date</th>
                              <th style={thSmall}>Products</th>
                              <th style={thSmall}>Total</th>
                              <th style={thSmall}>Actions</th>
                            </tr>
                          </thead>

                          <tbody>
                            {q.versions
                              ?.filter((v) => !v.is_active)
                              .map((v) => (
                                <tr key={v.id} style={row}>
                                  <td style={tdSmall}>{v.version_no}</td>
                                  <td style={tdSmall}>
                                    {v.created_at?.split("T")[0]}
                                  </td>
                                  <td style={tdSmall}>1 item(s)</td>
                                  <td style={tdSmall}>
                                    ₹{formatAmount(v.total_amount)}
                                  </td>

                                  <td style={tdSmall}>
                                    <div style={actionWrapSmall}>
                                      <button onClick={() => handleViewPDF(q.id, v.id)} style={btnBlue} title="View">
                                        <MdRemoveRedEye />
                                      </button>

                                      <button onClick={() => handleDownloadPDF(q.id, v.id)} style={btnGreen} title="Download">
                                        <MdDownload />
                                      </button>

                                      <button style={btnGreen} title="WhatsApp">
                                        <FaWhatsapp />
                                      </button>

                                      <button style={btnSky} title="Email">
                                        <MdEmail />
                                      </button>

                                      <button onClick={() => handleDeleteVersion(q.id, v.id)} style={btnRed} title="Delete">
                                        <MdDelete />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {list.length === 0 && !loading && (
              <tr>
                <td colSpan="7" style={emptyRow}>
                  No quotations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= UI STYLES ================= */

const pageWrap = {
  padding: "30px",
  background: "#f6f7fb",
  minHeight: "100vh",
  width: "100%",
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
  width: "100%",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};

const cardTitle = {
  marginBottom: "12px",
  fontWeight: 600,
};

const thead = { background: "#f3f4f8" };

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

const subText = {
  fontSize: "12px",
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
const btnBlue        = { ..._btn, background: "#bfdbfe", color: "#1e40af" }; // bg-blue-200   text-blue-800
const btnGreen       = { ..._btn, background: "#bbf7d0", color: "#166534" }; // bg-green-200  text-green-800
const btnYellow      = { ..._btn, background: "#fef08a", color: "#854d0e" }; // bg-yellow-200 text-yellow-800
const btnSky         = { ..._btn, background: "#bae6fd", color: "#075985" }; // bg-sky-200    text-sky-800
const btnRed         = { ..._btn, background: "#fecaca", color: "#991b1b" }; // bg-red-200    text-red-800
const btnPurple      = { ..._btn, background: "#e9d5ff", color: "#6b21a8" }; // bg-purple-200 text-purple-800
const btnPurpleActive= { ..._btn, background: "#c084fc", color: "#581c87" }; // bg-purple-400 text-purple-900 (active)

const versionTableWrap = {
  background: "#fafafa",
  padding: "18px 18px 18px 60px", // 👈 pushes table inside
};


const thSmall = {
  textAlign: "left",
  padding: "10px",
  fontSize: "12px",
};

const tdSmall = {
  padding: "10px",
  fontSize: "12px",
};

const actionWrapSmall = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};



const versionTitle = {
  fontWeight: 600,
  marginBottom: "8px",
};

const versionTable = {
  borderCollapse: "collapse",
  background: "#fff",
  borderRadius: "8px",
};

const loadingWrap = {
  padding: "25px",
  background: "#f6f7fb",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};