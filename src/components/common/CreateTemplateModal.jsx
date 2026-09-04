import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import axios from "axios";

const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${BASE_API}/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function CreateTemplateModal({ isOpen, onClose, template = null, onSuccess }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [category, setCategory] = useState("QUOTATIONS");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  const placeholders = [
    { label: "{customer_name}", value: "{customer_name}" },
    { label: "{mobile_number}", value: "{mobile_number}" },
    { label: "{site_name}", value: "{site_name}" },
    { label: "{quotation_no}", value: "{quotation_no}" },
    { label: "{amount}", value: "{amount}" },
  ];

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.name || "");
        setChannel(template.channel || "EMAIL");
        setCategory(template.category || "QUOTATIONS");
        setSubject(template.subject || "");
        setBody(template.body || "");
      } else {
        setName("");
        setChannel("EMAIL");
        setCategory("QUOTATIONS");
        setSubject("");
        setBody("");
      }
    }
  }, [isOpen, template]);

  if (!isOpen) return null;

  const insertPlaceholder = (ph) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = body;
    const newText =
      currentText.substring(0, startPos) +
      ph +
      currentText.substring(endPos, currentText.length);

    setBody(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = startPos + ph.length;
    }, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !subject || !body) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = { name, channel, category, subject, body };
      if (template?.id) {
        await api.put(`auth/email-templates/${template.id}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Saved",
          text: "Template updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.post("auth/email-templates/", payload);
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "New template created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.detail || "Failed to save template. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 mt-15 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="relative w-full max-w-xl my-6 mx-auto px-4">
        <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none p-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-solid border-slate-200 rounded-t">
            <h3 className="text-xl font-bold text-slate-800">
              {template ? "Edit Template" : "Create New Template"}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-slate-400 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-slate-600"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                TEMPLATE NAME *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Service Schedule Email"
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  CHANNEL
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                >
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                >
                  <option value="LEADS">Leads / Enquiries</option>
                  <option value="QUOTATIONS">Quotations</option>
                  <option value="INVOICES">Invoices</option>
                  <option value="PURCHASE_ORDERS">Purchase Orders</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                SUBJECT LINE
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Service schedule - {customer_name}"
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-700">
                  MESSAGE BODY
                </label>
                <span className="text-xs text-blue-600 font-medium">
                  Click chip to insert placeholder
                </span>
              </div>

              {/* Placeholder chips */}
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {placeholders.map((ph) => (
                  <button
                    key={ph.value}
                    type="button"
                    onClick={() => insertPlaceholder(ph.value)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    + {ph.label}
                  </button>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows="6"
                placeholder="Enter template message text..."
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-solid border-slate-200 rounded-b gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center min-w-[120px] ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
