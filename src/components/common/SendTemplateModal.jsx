import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { MdEmail, MdClose, MdContentCopy } from "react-icons/md";
import { FaWhatsapp, FaExternalLinkAlt, FaPaperPlane } from "react-icons/fa";

const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${BASE_API}/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function SendTemplateModal({
  isOpen,
  onClose,
  category, // e.g. 'QUOTATIONS', 'INVOICES', 'PURCHASE_ORDERS'
  documentId,
  documentData = {}, // Actual row data used for placeholder resolution
}) {
  const [channel, setChannel] = useState("EMAIL"); // EMAIL or WHATSAPP
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [rawMessageBody, setRawMessageBody] = useState("");
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' or 'edit'
  const [sending, setSending] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");

  // Build context for placeholders
  const placeholderContext = {
    customer_name:
      documentData.customer_name ||
      documentData.customer?.name ||
      documentData.vendor?.name ||
      documentData.buyer_name ||
      "",
    mobile_number:
      documentData.customer?.mobile_no ||
      documentData.customer?.contact_number ||
      documentData.vendor?.mobile ||
      "",
    site_name: documentData.site_name || documentData.site?.name || "",
    quotation_no:
      documentData.quotation_no ||
      documentData.invoice_no ||
      documentData.purchase_order_no ||
      "",
    amount:
      documentData.grand_total ||
      documentData.versions?.find((v) => v.is_active)?.total_amount ||
      documentData.total_amount ||
      "",
  };

  const resolvePlaceholders = (text) => {
    if (!text) return "";
    let resolved = text;
    Object.keys(placeholderContext).forEach((key) => {
      const placeholder = `{${key}}`;
      resolved = resolved.replaceAll(placeholder, placeholderContext[key] || "");
    });
    return resolved;
  };

  // Fetch templates for category & channel
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get(
          `auth/email-templates/?channel=${channel}&category=${category}`
        );
        setTemplates(response.data.results || response.data || []);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      }
    };

    if (isOpen) {
      fetchTemplates();
      setRecipientEmail(
        documentData.customer_email ||
          documentData.customer?.email ||
          documentData.vendor?.email ||
          ""
      );
      setCc("");
      setBcc("");
    }
  }, [isOpen, channel, category, documentData]);

  // Handle template selection
  useEffect(() => {
    if (selectedTemplateId) {
      const selected = templates.find((t) => String(t.id) === String(selectedTemplateId));
      if (selected) {
        setSubjectLine(resolvePlaceholders(selected.subject));
        setRawMessageBody(resolvePlaceholders(selected.body));
      }
    } else {
      setSubjectLine("");
      setRawMessageBody("");
    }
  }, [selectedTemplateId, templates]);

  if (!isOpen) return null;

  // Endpoint selector
  const getSendEndpoint = () => {
    if (category === "QUOTATIONS") return `quotation/quotation/${documentId}/send-email/`;
    if (category === "INVOICES") return `invoice/invoice/${documentId}/send-email/`;
    if (category === "PURCHASE_ORDERS") return `inventory/purchase-order/${documentId}/send-email/`;
    return "";
  };

  const handleSendDirectEmail = async (e) => {
    e.preventDefault();
    if (!recipientEmail) {
      Swal.fire({ icon: "error", title: "Error", text: "Recipient email is required." });
      return;
    }

    setSending(true);
    try {
      const endpoint = getSendEndpoint();
      const payload = {
        recipient: recipientEmail,
        cc,
        bcc,
        subject: subjectLine,
        body: rawMessageBody,
      };
      
      // If quotation, pass version_id in payload if available
      if (category === "QUOTATIONS" && documentData.versions) {
        const activeVersion = documentData.versions.find((v) => v.is_active);
        if (activeVersion) {
          payload.version_id = activeVersion.id;
        }
      }

      await api.post(endpoint, payload);

      Swal.fire({
        icon: "success",
        title: "Sent",
        text: "Email sent successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Send Failed",
        text: err.response?.data?.error || "Failed to send email.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleOpenInApp = () => {
    const mailto = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(rawMessageBody)}`;
    window.open(mailto, "_blank");
  };

  const handleCopyText = () => {
    if (!rawMessageBody) return;
    navigator.clipboard.writeText(rawMessageBody);
    Swal.fire({
      icon: "success",
      title: "Copied!",
      text: "Template text copied to clipboard.",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 mt-15 overflow-hidden outline-none focus:outline-none">
      <div className="relative w-full max-w-2xl mx-auto px-4 my-4 max-h-[calc(100vh-6rem)] flex flex-col">
        <div className="border-0 rounded-lg shadow-2xl relative flex flex-col w-full bg-white outline-none focus:outline-none overflow-hidden max-h-full">
          {/* Header Banner */}
          <div className="bg-[#4f46e5] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-md">
                <MdEmail size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-wide">Send Template Message</h3>
                <p className="text-xs opacity-90 font-medium">Auto-filled template generator for Leads & Customers</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-slate-200">
              <MdClose size={26} />
            </button>
          </div>

          {/* Subheader recipient indicator */}
          <div className="bg-slate-50 px-6 py-3 flex items-center justify-between text-sm border-b border-slate-100">
            {/* Tabs for Channel */}
            <div className="flex bg-slate-200/70 p-0.5 rounded-lg">
              <button
                onClick={() => setChannel("EMAIL")}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  channel === "EMAIL" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                }`}
              >
                <MdEmail size={14} />
                Email Channel
              </button>
              <button
                onClick={() => setChannel("WHATSAPP")}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  channel === "WHATSAPP" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600"
                }`}
              >
                <FaWhatsapp size={14} className="text-emerald-500" />
                WhatsApp Channel
              </button>
            </div>

            <div className="text-slate-600 text-sm font-medium">
              Recipient: <span className="font-bold text-slate-800">{placeholderContext.customer_name || "N/A"}</span>
            </div>
          </div>

          {/* Modal Form */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {channel === "WHATSAPP" ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                WhatsApp Channel templates and sharing logic will be integrated here in the next step.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Recipient Email Address
                    </label>
                    <input
                      type="text"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="mt-1.5 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Select Template ({templates.length} Available)
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="mt-1.5 block w-full px-3.5 py-2.5 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    >
                      <option value="">-- Select Template --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      CC
                    </label>
                    <input
                      type="text"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com"
                      className="mt-1.5 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      BCC
                    </label>
                    <input
                      type="text"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                      className="mt-1.5 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={subjectLine}
                    onChange={(e) => setSubjectLine(e.target.value)}
                    placeholder="Subject line will populate from template"
                    className="mt-1.5 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>

                {/* Tabs switcher (Preview / Edit) */}
                <div className="flex items-center justify-between border-b border-slate-200 mt-6">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveTab("preview")}
                      type="button"
                      className={`py-2 px-1 border-b-2 font-semibold text-sm transition-all ${
                        activeTab === "preview"
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      Visual HTML Card Preview
                    </button>
                    <button
                      onClick={() => setActiveTab("edit")}
                      type="button"
                      className={`py-2 px-1 border-b-2 font-semibold text-sm transition-all ${
                        activeTab === "edit"
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      Edit Raw Message Text
                    </button>
                  </div>

                  <button
                    onClick={handleCopyText}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded transition-colors"
                  >
                    <MdContentCopy size={13} />
                    Copy Text
                  </button>
                </div>

                {/* Tabs content */}
                <div className="mt-4">
                  {activeTab === "preview" ? (
                    <div className="border rounded-lg bg-slate-50 p-4 max-h-[300px] overflow-y-auto">
                      {/* Interactive Visual Preview mimicking the generic base wrapper */}
                      <div className="max-w-[450px] mx-auto bg-white rounded-md shadow border border-slate-200 overflow-hidden text-slate-800 text-sm">
                        <div className="bg-sky-600 text-white py-3 text-center font-bold text-base">
                          KRISHNA AIR SYSTEMS
                        </div>
                        <div className="p-5">
                          <span className="inline-block bg-amber-100 text-amber-800 text-2xs uppercase px-2 py-0.5 rounded-full font-bold mb-3 tracking-wide">
                            {category}
                          </span>
                          <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-sans">
                            {rawMessageBody || (
                              <span className="text-slate-400 font-normal italic">
                                Select a template above to generate visual preview.
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-slate-50 py-3 text-center border-t text-2xs text-slate-500">
                          © 2026 Krishna Air. All rights reserved.<br />
                          For support, contact us at connectteim@gmail.com
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={rawMessageBody}
                        onChange={(e) => setRawMessageBody(e.target.value)}
                        rows="8"
                        placeholder="Write or edit template message text..."
                        className="mt-1 block w-full px-4 py-3 border border-slate-700 rounded-lg text-sm bg-[#090d16] text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer buttons */}
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t gap-2">
            <button
              onClick={onClose}
              type="button"
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              disabled={sending}
            >
              Cancel
            </button>

            {channel === "EMAIL" && (
              <div className="flex gap-3">
                <button
                  onClick={handleOpenInApp}
                  type="button"
                  className="px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg shadow-sm flex items-center gap-1.5"
                  disabled={!selectedTemplateId}
                >
                  <FaExternalLinkAlt size={12} />
                  Open in Gmail / App
                </button>
                <button
                  onClick={handleSendDirectEmail}
                  type="button"
                  className={`px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md flex items-center gap-2 min-w-[150px] justify-center ${
                    sending || !selectedTemplateId ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={sending || !selectedTemplateId}
                >
                  <FaPaperPlane size={12} />
                  {sending ? "Sending..." : "Send Direct Email"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
