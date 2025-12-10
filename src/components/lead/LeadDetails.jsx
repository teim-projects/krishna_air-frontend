import React, { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";

const LeadDetails = ({ open, onClose, leadId, baseApi, token }) => {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !leadId) return;

    const fetchLead = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${baseApi}/api/lead/lead/${leadId}/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText} ${txt}`);
        }

        const data = await res.json();
        setLead(data);
      } catch (err) {
        setError(err.message || String(err));
        setLead(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [open, leadId, baseApi, token]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center mt-10 justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        {/* header */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100"
        >
          <MdClose size={22} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Lead Details</h2>

        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {!loading && !lead && !error && (
          <div className="text-sm text-slate-500">No data found</div>
        )}

        {!loading && lead && (
          <div className="space-y-4">
            {/* 1️⃣ Customer + Assigned To */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Customer & Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-slate-600 mb-1">
                    Customer
                  </div>
                  <div>Name: {lead.customer_name}</div>
                  <div>Contact: {lead.customer_contact}</div>
                  <div>Email: {lead.customer_email}</div>
                </div>

                <div className="row grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assigned To */}
                  <div>
                    <div className="font-medium text-slate-600 mb-1">Assigned To</div>
                    <div>Name: {lead.assign_to_details?.full_name || "—"}</div>
                    <div>Mobile: {lead.assign_to_details?.mobile_no || "—"}</div>
                    <div>Email: {lead.assign_to_details?.email || "—"}</div>
                  </div>

                  {/* Created By */}
                  <div>
                    <div className="font-medium text-slate-600 mb-1">Created By</div>
                    <div>Name: {lead.creatd_by_details?.full_name || "—"}</div>
                    <div>Mobile: {lead.creatd_by_details?.mobile_no || "—"}</div>
                    <div>Email: {lead.creatd_by_details?.email || "—"}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2️⃣ Enquiry / Application / Source */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Lead Enquiry Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-slate-600">
                    Requirements details:
                  </span>{" "}
                  {lead.requirements_details || "—"}
                </div>
                <div>
                  <span className="font-medium text-slate-600">
                    HVAC application:
                  </span>{" "}
                  {lead.hvac_application || "—"}
                </div>
                <div>
                  <span className="font-medium text-slate-600">
                    Capacity required:
                  </span>{" "}
                  {lead.capacity_required || "—"}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium text-slate-600">
                      Lead source:
                    </span>{" "}
                    {lead.lead_source || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">
                      Status:
                    </span>{" "}
                    {lead.status || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">
                      Remarks:
                    </span>{" "}
                    {lead.remarks || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* 3️⃣ Follow-up details + fixed followups */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Follow-up Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="font-medium text-slate-600">Lead date:</span>{" "}
                  {lead.date || "—"}
                </div>
                <div>
                  <span className="font-medium text-slate-600">
                    Next followup:
                  </span>{" "}
                  {lead.followup_date || "—"}
                </div>
                <div>
                  <span className="font-medium text-slate-600">
                    Current status:
                  </span>{" "}
                  {lead.status || "—"}
                </div>
              </div>

              {/* Fixed followup slots (static for now) */}
              <div>
                <div className="font-medium text-slate-600 mb-2">
                  Followup history
                </div>

                {lead.followups && lead.followups.length > 0 ? (
                  <table className="w-full text-sm border border-slate-200 rounded-md overflow-hidden">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Followup Date</th>
                        <th className="p-2 text-left">Next Followup</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.followups.map((fu, idx) => (
                        <tr key={fu.id} className="border-t align-top">
                          <td className="p-2">{idx + 1}</td>
                          <td className="p-2">{fu.followup_date || "—"}</td>
                          <td className="p-2">{fu.next_followup_date || "—"}</td>
                          <td className="p-2">{fu.status || "—"}</td>
                          <td className="p-2">
                            <div>{fu.remarks || "—"}</div>

                            {/* Optional: show FAQ answers under each followup */}
                            {fu.faq_answers && fu.faq_answers.length > 0 && (
                              <div className="mt-2 text-xs text-slate-600">
                                <div className="font-semibold mb-1">FAQs:</div>
                                <ul className="list-disc list-inside space-y-1">
                                  {fu.faq_answers.map((faq) => (
                                    <li key={faq.id}>
                                      <span className="font-medium">
                                        {faq.faq_question}:
                                      </span>{" "}
                                      {faq.answer || "—"}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-sm text-slate-500">
                    No followups recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>


        )}
      </div>
    </div>
  );
};

export default LeadDetails;
