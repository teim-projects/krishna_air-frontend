// quotation/QuotationList.jsx

import { useEffect, useState } from "react";
import axios from "axios";

import {
  FiEye,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiChevronDown,
  FiMail,
} from "react-icons/fi";
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

export default function QuotationList({ onAdd, onEdit }) {
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

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = () => {
    setLoading(true);
    api
      .get("quotation/quotation/")
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
  };

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
              <th style={th}>Version</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((q, i) => {
              const activeVersion = getActiveVersion(q);

              return (
                <>
                  {/* MAIN ROW */}
                  <tr key={q.id} style={row}>
                    <td style={td}>{i + 1}</td>

                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>
                        {q.customer_name}
                      </div>
                      <div style={subText}>{q.customer_contact}</div>
                    </td>

                    <td style={td}>{q.site_name}</td>

                    <td style={td}>
                      {activeVersion?.product_count || "1 item(s)"}
                    </td>

                    <td style={td}>
                      ₹{formatAmount(activeVersion?.total_amount)}
                    </td>

                    <td style={td}>
                      <span style={versionBadge}>
                        {activeVersion?.version_no}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={td}>
                      <div style={actionWrap}>
                        <button
                          onClick={() => handleViewPDF(q.id)}
                          style={iconBtn}
                        >
                          <FiEye size={16} />
                        </button>

                        <button
                          onClick={() => handleDownloadPDF(q.id)}
                          style={iconBtn}
                        >
                          <FiDownload size={16} />
                        </button>

                        <button style={iconBtn}>
                          <FaWhatsapp size={16} color="#25D366" />
                        </button>

                        <button style={iconBtn}>
                          <FiMail size={16} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRow(openRow === q.id ? null : q.id);
                          }}
                          style={iconBtn}
                        >
                          <FiChevronDown size={16} />
                        </button>

                        <button onClick={() => onEdit(q.id)} style={iconBtn}>
                          <FiEdit size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteVersion(q.id, activeVersion.id)
                          }
                          style={iconBtn}
                        >
                          <FiTrash2 size={16} color="#e74c3c" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* FULL VERSION HISTORY TABLE */}
                  {openRow === q.id && (
                    <tr>
                      <td colSpan="7" style={versionTableWrap}>
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
                                      <button
                                        onClick={() => handleViewPDF(q.id, v.id)}
                                        style={iconBtnSmall}
                                      >
                                        <FiEye size={14} />
                                      </button>

                                      <button
                                        onClick={() => handleDownloadPDF(q.id, v.id)}
                                        style={iconBtnSmall}
                                      >
                                        <FiDownload size={14} />
                                      </button>

                                      <button style={iconBtnSmall}>
                                        <FaWhatsapp size={14} color="#25D366" />
                                      </button>

                                      <button style={iconBtnSmall}>
                                        <FiMail size={14} />
                                      </button>

                                      {/* ✅ DELETE BACK AGAIN */}
                                      <button
                                        onClick={() => handleDeleteVersion(q.id, v.id)}
                                        style={iconBtnSmall}
                                      >
                                        <FiTrash2 size={14} color="#e74c3c" />
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
                </>
              );
            })}
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

const subText = {
  fontSize: "12px",
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

const versionBadge = {
  background: "#e8f7ee",
  color: "#27ae60",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
};

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

const iconBtnSmall = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "3px",
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