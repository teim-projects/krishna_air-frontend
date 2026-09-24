import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MdEdit, MdDelete, MdRemoveRedEye, MdEmail } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import CreateTemplateModal from "../components/common/CreateTemplateModal";

const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${BASE_API}/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function MessageTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // 'ALL', 'EMAIL', 'WHATSAPP'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get("auth/email-templates/");
      setTemplates(response.data.results || response.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch message templates.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this template deletion!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`auth/email-templates/${id}/`);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Template has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchTemplates();
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete template.",
        });
      }
    }
  };

  const handleView = (template) => {
    Swal.fire({
      title: `<strong>${template.name}</strong>`,
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.6; color: #334155;">
          <p><strong>Channel:</strong> ${template.channel}</p>
          <p><strong>Category:</strong> ${template.category}</p>
          <p><strong>Subject:</strong> ${template.subject || "None"}</p>
          <div style="margin-top: 15px; padding: 12px; background: #f1f5f9; border-radius: 6px; white-space: pre-wrap; font-family: monospace;">${template.body}</div>
        </div>
      `,
      confirmButtonText: "Close",
    });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  // Filter logic
  const filteredTemplates = templates.filter((t) => {
    if (activeTab === "ALL") return true;
    return t.channel === activeTab;
  });

  const countEmail = templates.filter((t) => t.channel === "EMAIL").length;
  const countWhatsApp = templates.filter((t) => t.channel === "WHATSAPP").length;

  const categoryLabels = {
    LEADS: "Leads",
    QUOTATIONS: "Quotations",
    INVOICES: "Invoices",
    PURCHASE_ORDERS: "Purchase Orders",
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Message Templates Management</h2>
          <p className="text-sm text-slate-500">
            Create, edit, and organize email and WhatsApp templates with dynamic placeholders
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm transition-colors text-sm"
        >
          + Create Template
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ALL"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          All Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab("EMAIL")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "EMAIL"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Email Templates ({countEmail})
        </button>
        <button
          onClick={() => setActiveTab("WHATSAPP")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "WHATSAPP"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          WhatsApp Templates ({countWhatsApp})
        </button>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Template Name</th>
              <th className="px-6 py-4">Channel</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                  Loading templates...
                </td>
              </tr>
            ) : filteredTemplates.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                  No templates found.
                </td>
              </tr>
            ) : (
              filteredTemplates.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{t.name}</td>
                  <td className="px-6 py-4">
                    {t.channel === "EMAIL" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <MdEmail className="text-sm" />
                        Email
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <FaWhatsapp className="text-sm" />
                        WhatsApp
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                      {categoryLabels[t.category] || t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]" title={t.subject}>
                    {t.channel === "EMAIL" ? t.subject : "None"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1.5 rounded bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition-colors"
                        title="Edit Template"
                      >
                        <MdEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleView(t)}
                        className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
                        title="View Template Details"
                      >
                        <MdRemoveRedEye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
                        title="Delete Template"
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
        onSuccess={fetchTemplates}
      />
    </div>
  );
}
