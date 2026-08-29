import React, { useState, useEffect } from "react";
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

export default function EmailModal({
  isOpen,
  onClose,
  endpoint,
  defaultRecipient = "",
  defaultSubject = "",
  defaultBody = "",
  attachmentName = "",
  additionalData = {},
}) {
  const [recipient, setRecipient] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecipient(defaultRecipient || "");
      setCc("");
      setBcc("");
      setSubject(defaultSubject || "");
      setBody(defaultBody || "");
    }
  }, [isOpen, defaultRecipient, defaultSubject, defaultBody]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipient) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Recipient email is required.",
      });
      return;
    }

    setSending(true);
    try {
      const response = await api.post(endpoint, {
        recipient,
        cc,
        bcc,
        subject,
        body,
        ...additionalData,
      });

      
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.detail || "Email sending initiated.",
      });
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.error || "Failed to send email. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50">
      <div className="relative w-full max-w-lg my-6 mx-auto px-4">
        <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none p-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-solid border-slate-200 rounded-t">
            <h3 className="text-xl font-semibold text-slate-800">Send Email</h3>
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
              <label className="block text-sm font-medium text-slate-700">To <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com (comma separated for multiple)"
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">CC</label>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">BCC</label>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows="4"
                placeholder="Write your email body here..."
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900"
              />
            </div>

            {attachmentName && (
              <div className="bg-slate-50 p-2 rounded-md border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">Attachment:</span>
                <span className="truncate max-w-[200px]" title={attachmentName}>{attachmentName}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-solid border-slate-200 rounded-b gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md flex items-center justify-center min-w-[100px] ${
                  sending ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
