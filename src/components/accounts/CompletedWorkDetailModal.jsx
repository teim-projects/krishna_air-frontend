import React, { useEffect, useMemo, useState } from "react";

export default function CompletedWorkDetailModal({ open, onClose, baseApi, itemId }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = useMemo(() => {
    return (
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      ""
    );
  }, []);

  useEffect(() => {
    if (!open || !itemId || !token) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setDetail(null);
      try {
        const res = await fetch(`${baseApi}/amc/completed-work/${itemId}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(body || res.statusText);
        }
        const data = await res.json();
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, itemId, baseApi, token]);

  if (!open) return null;

  const labelClass = "text-xs font-medium text-slate-500 uppercase tracking-wide";
  const valueClass = "text-sm text-slate-900 mt-0.5";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-xl hover:text-slate-900 text-slate-500"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-1 pr-8">Completed work details</h2>
        {detail?.customer_name && (
          <p className="text-sm text-slate-600 mb-4">{detail.customer_name}</p>
        )}

        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {detail && !loading && (
          <div className="space-y-5">
            <section className="rounded-md border border-slate-200 p-4 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Technician</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className={labelClass}>Name</div>
                  <div className={valueClass}>{detail.technician_name || "—"}</div>
                </div>
                <div>
                  <div className={labelClass}>Mobile no.</div>
                  <div className={valueClass}>{detail.technician_mobile || "—"}</div>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Work info</h3>
              <div className="space-y-3">
                <div>
                  <div className={labelClass}>Work</div>
                  <div className={`${valueClass} whitespace-pre-wrap`}>
                    {detail.work_description || "—"}
                  </div>
                </div>
                <div>
                  <div className={labelClass}>Work address</div>
                  <div className={`${valueClass} whitespace-pre-wrap`}>
                    {detail.work_address || "—"}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className={labelClass}>Status</div>
                    <div className={valueClass}>{detail.status || "—"}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Completion date</div>
                    <div className={valueClass}>{detail.completion_date || "—"}</div>
                  </div>
                </div>
                <div>
                  <div className={labelClass}>Technician assigned</div>
                  <div className={valueClass}>{detail.technician_assigned || "—"}</div>
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded text-slate-800 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
