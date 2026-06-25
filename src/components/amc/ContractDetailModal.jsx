import { useState, useEffect } from "react";
import { MdClose, MdCalendarToday, MdPerson, MdBuild, MdReceipt } from "react-icons/md";

export default function ContractDetailModal({ contract, baseApi, token, onClose }) {
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("visits"); // visits | invoices

  useEffect(() => {
    if (!contract) return;
    fetchHistory();
  }, [contract]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Fetch all service visits for this contract
      const [svcRes, invRes] = await Promise.all([
        fetch(`${baseApi}/amc/services/?amc_contract=${contract.id}`, { headers }),
        fetch(`${baseApi}/amc/invoices/`, { headers })
      ]);

      if (svcRes.ok) {
        const d = await svcRes.json();
        setServices(d.results || d);
      }
      if (invRes.ok) {
        const d = await invRes.json();
        // Filter invoices belonging to this contract's services
        const allInvoices = d.results || d;
        const contractServiceIds = new Set((services.length ? services : []).map(s => s.id));
        // We'll re-filter after services are set; keep all for now, filter in render
        setInvoices(allInvoices);
      }
    } catch (err) {
      console.error("Error fetching contract history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when services update to properly filter invoices
  useEffect(() => {
    if (services.length > 0 && invoices.length > 0) {
      const svcIds = new Set(services.map(s => s.id));
      setInvoices(prev => prev.filter(inv => svcIds.has(inv.service)));
    }
  }, [services]);

  if (!contract) return null;

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE:       "bg-green-100 text-green-800",
      EXPIRED:      "bg-red-100 text-red-800",
      CANCELLED:    "bg-amber-100 text-amber-800",
      INACTIVE:     "bg-slate-100 text-slate-800",
      SCHEDULED:    "bg-blue-100 text-blue-800",
      COMPLETED:    "bg-green-100 text-green-800",
      PENDING_PARTS:"bg-amber-100 text-amber-800",
      PAID:         "bg-green-100 text-green-800",
      UNPAID:       "bg-red-100 text-red-800",
      PARTIAL:      "bg-amber-100 text-amber-800",
    };
    return map[status] || "bg-slate-100 text-slate-800";
  };

  const totalParts = services.reduce((sum, s) => {
    return sum + (s.parts_used || []).reduce((ps, p) => ps + parseFloat(p.total_cost || 0), 0);
  }, 0);

  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-6">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{contract.contract_number}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {contract.customer_name} &nbsp;·&nbsp; {contract.package_name}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors ml-4">
            <MdClose size={24} />
          </button>
        </div>

        {/* Contract Summary Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border-b">
          {[
            { label: "AC Variant",   value: contract.product_name || "—" },
            { label: "AMC Period",   value: `${contract.amc_start_date} → ${contract.amc_end_date}` },
            { label: "AMC Cost",     value: `₹${parseFloat(contract.amc_cost || 0).toLocaleString("en-IN")}` },
            { label: "Status",       value: contract.status, badge: true },
          ].map(({ label, value, badge }) => (
            <div key={label} className="bg-white px-4 py-3">
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              {badge
                ? <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(value)}`}>{value}</span>
                : <p className="text-sm font-semibold text-slate-700 mt-1">{value}</p>
              }
            </div>
          ))}
        </div>

        {/* Section Tabs */}
        <div className="flex gap-0 border-b px-6 pt-4">
          {[
            { key: "visits",   label: `Service Visits (${services.length})`,   icon: <MdBuild size={15}/> },
            { key: "invoices", label: `Invoices (${invoices.length})`,          icon: <MdReceipt size={15}/> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeSection === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-slate-400 py-10">Loading history...</p>
          ) : activeSection === "visits" ? (

            /* ── Service Visits ── */
            services.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No service visits recorded for this contract.</p>
            ) : (
              <div className="space-y-4">
                {services.map(svc => (
                  <div key={svc.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap gap-3 items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <MdCalendarToday size={14} className="text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700">{svc.visit_date}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(svc.status)}`}>
                            {svc.status}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {svc.service_type === "SCHEDULED" ? "Scheduled" : svc.service_type === "EMERGENCY" ? "Emergency" : "Follow-up"}
                          </span>
                        </div>
                        {svc.engineer_assigned && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                            <MdPerson size={13} /> {svc.engineer_assigned}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {svc.is_billable ? (
                          <span className="text-red-600 font-medium">Billable</span>
                        ) : (
                          <span className="text-slate-400">Inclusive</span>
                        )}
                      </div>
                    </div>

                    {/* Issue / Work */}
                    {(svc.issue_reported || svc.work_performed) && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {svc.issue_reported && (
                          <div className="bg-amber-50 border border-amber-100 rounded p-2">
                            <p className="text-xs font-semibold text-amber-700 mb-1">Issue Reported</p>
                            <p className="text-xs text-slate-600">{svc.issue_reported}</p>
                          </div>
                        )}
                        {svc.work_performed && (
                          <div className="bg-green-50 border border-green-100 rounded p-2">
                            <p className="text-xs font-semibold text-green-700 mb-1">Work Performed</p>
                            <p className="text-xs text-slate-600">{svc.work_performed}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Parts Used */}
                    {svc.parts_used && svc.parts_used.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                          Parts / Materials Used
                        </p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-left text-slate-500">
                              <th className="pb-1">Item</th>
                              <th className="pb-1 text-right">Qty</th>
                              <th className="pb-1 text-right">Rate</th>
                              <th className="pb-1 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {svc.parts_used.map(p => (
                              <tr key={p.id} className="border-b border-slate-50">
                                <td className="py-1 font-medium text-slate-700">{p.product_name}</td>
                                <td className="py-1 text-right text-slate-600">{p.quantity_used}</td>
                                <td className="py-1 text-right text-slate-600">₹{p.rate_per_unit}</td>
                                <td className="py-1 text-right font-semibold text-slate-700">₹{p.total_cost}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
                {totalParts > 0 && (
                  <div className="text-right text-sm font-semibold text-slate-700">
                    Total Parts Cost: ₹{totalParts.toFixed(2)}
                  </div>
                )}
              </div>
            )

          ) : (

            /* ── Invoices ── */
            invoices.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">
                No invoices generated yet. Invoices are auto-created when a Non-Comprehensive service is completed.
              </p>
            ) : (
              <div className="space-y-4">
                {invoices.map(inv => (
                  <div key={inv.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-blue-600">{inv.invoice_number}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{inv.invoice_date}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(inv.payment_status)}`}>
                        {inv.payment_status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: "Parts",    val: `₹${parseFloat(inv.parts_total).toFixed(2)}` },
                        { label: "Labour",   val: `₹${parseFloat(inv.labor_total).toFixed(2)}` },
                        { label: `GST (${inv.gst_percent}%)`, val: `₹${parseFloat(inv.gst_amount).toFixed(2)}` },
                        { label: "Total",    val: `₹${parseFloat(inv.total_amount).toFixed(2)}`, bold: true },
                      ].map(({ label, val, bold }) => (
                        <div key={label} className="bg-slate-50 rounded p-2">
                          <p className="text-slate-400">{label}</p>
                          <p className={`text-slate-800 mt-0.5 ${bold ? "font-bold" : "font-medium"}`}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="text-right text-sm font-bold text-slate-800 pt-2 border-t">
                  Grand Total Invoiced: ₹{totalInvoiced.toFixed(2)}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
