import { useState, useEffect } from "react";
import { MdCheckCircle, MdPending, MdAttachMoney } from "react-icons/md";
import Swal from "sweetalert2";

export default function AmcInvoiceList({ baseApi, token, filters = {} }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payFilter, setPayFilter] = useState("all"); // all | UNPAID | PARTIAL | PAID

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `${baseApi}/amc/invoices/`;
      const params = new URLSearchParams();
      if (payFilter !== "all") params.append("payment_status", payFilter);
      if (filters?.search) params.append("search", filters.search);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.results || data);
      } else {
        throw new Error("Failed to load invoices");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch AMC invoices" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [baseApi, token, filters, payFilter]);

  const handleMarkPaid = async (id) => {
    const result = await Swal.fire({
      title: "Mark Invoice as Paid?",
      text: "This will update the payment status to Paid.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, mark paid",
      confirmButtonColor: "#16a34a"
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/amc/invoices/${id}/mark_paid/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        Swal.fire({ icon: "success", text: "Invoice marked as paid", timer: 1200, showConfirmButton: false });
        fetchInvoices();
      } else {
        throw new Error("Failed to mark as paid");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const getPayBadge = (status) => {
    switch (status) {
      case "PAID":    return "bg-green-100 text-green-800";
      case "PARTIAL": return "bg-amber-100 text-amber-800";
      default:        return "bg-red-100 text-red-800";
    }
  };

  // Summary totals
  const totalAmount   = invoices.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const unpaidAmount  = invoices.filter(i => i.payment_status !== "PAID")
                                .reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const paidAmount    = invoices.filter(i => i.payment_status === "PAID")
                                .reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-md shadow p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600"><MdAttachMoney size={22} /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Invoiced</p>
            <p className="text-lg font-bold text-slate-800">₹{totalAmount.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-md shadow p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600"><MdCheckCircle size={22} /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Collected</p>
            <p className="text-lg font-bold text-green-700">₹{paidAmount.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-md shadow p-4 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600"><MdPending size={22} /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Outstanding</p>
            <p className="text-lg font-bold text-red-600">₹{unpaidAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Header + Filter Tabs */}
      <div className="bg-white p-4 rounded-md shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">AMC Invoices</h2>
          <div className="text-sm text-slate-500">
            {loading ? "Loading..." : `${invoices.length} invoice(s) found`}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "UNPAID", "PARTIAL", "PAID"].map(f => (
            <button
              key={f}
              onClick={() => setPayFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                payFilter === f
                  ? f === "PAID" ? "bg-green-600 text-white"
                    : f === "UNPAID" ? "bg-red-600 text-white"
                    : f === "PARTIAL" ? "bg-amber-500 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Invoice No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Invoice Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Contract / Customer</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Parts</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Labour</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Subtotal</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">GST ({invoices[0]?.gst_percent ?? 18}%)</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="11" className="px-4 py-8 text-center text-sm text-slate-500">Loading invoices...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-4 py-8 text-center text-sm text-slate-500">
                  No invoices found. Invoices are auto-generated when a Non-Comprehensive service visit is marked Completed.
                </td>
              </tr>
            ) : (
              invoices.map((inv, idx) => {
                const sd = inv.service_details || {};
                const contractNo = sd.amc_contract_number || `Service #${inv.service}`;
                const customerName = sd.customer_name || "";
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{inv.invoice_date}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-slate-700">{contractNo}</div>
                      {customerName && <div className="text-xs text-slate-400">{customerName}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">₹{parseFloat(inv.parts_total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">₹{parseFloat(inv.labor_total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">₹{parseFloat(inv.subtotal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-500">₹{parseFloat(inv.gst_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-slate-800">₹{parseFloat(inv.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPayBadge(inv.payment_status)}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inv.payment_status !== "PAID" ? (
                        <button
                          onClick={() => handleMarkPaid(inv.id)}
                          className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded hover:bg-green-200 flex items-center gap-1 mx-auto"
                        >
                          <MdCheckCircle size={13} /> Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
