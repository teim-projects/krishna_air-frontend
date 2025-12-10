import React, { useCallback, useEffect, useMemo, useState } from "react";
import Base from "../components/Base";
import TableView from "../components/TableView";
import LeadDetails from "../components/lead/LeadDetails";
import AddLeadFollowUpForm from "../components/lead/AddLeadFollowUpForm";
import AddLeadForm from "../components/lead/AddLeadForm";
import { MdEdit, MdDelete, MdOutlineRemoveRedEye, MdEditDocument } from "react-icons/md";
import Swal from "sweetalert2";


export default function Lead() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const API_URL = `${BASE_API}/api/lead/lead/`;
  const initialFilters = useMemo(() => ({ search: "" }), []);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE_FALLBACK = 10;

  // modal / edit state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [leadDetailsId, setLeadDetailsId] = useState(null);

  const [showLeadFollowUp, setShowLeadFollowUp] = useState(false);
  const [followUpLeadId, setFollowUpLeadId] = useState(null);


  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  const leadFilters = useMemo(() => [
    { key: "search", type: "search", label: "Search", placeholder: "Search name, email, contact..." },
  ], []);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (appliedFilters?.search) params.set("search", appliedFilters.search);

      const url = `${API_URL}?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${body ? " — " + body : ""}`);
      }

      const data = await res.json();

      if (data && Array.isArray(data.results)) {
        const items = data.results;
        const count = Number.isFinite(data.count) ? data.count : items.length;
        const pageSize = items.length || PAGE_SIZE_FALLBACK;
        setRows(items);
        setTotalCount(count);
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
        setCurrentPage(page);
      } else if (Array.isArray(data)) {
        setRows(data);
        setTotalCount(data.length);
        setTotalPages(Math.max(1, Math.ceil(data.length / PAGE_SIZE_FALLBACK)));
        setCurrentPage(1);
      } else {
        const items = Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : [];
        setRows(items);
        setTotalCount(items.length);
        setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE_FALLBACK)));
        setCurrentPage(1);
      }
    } catch (err) {
      setError(err.message || String(err));
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, appliedFilters]);

  useEffect(() => { fetchData(currentPage); }, [fetchData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const handleFilterChange = useCallback((filters) => {
    setAppliedFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: "Delete Lead?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });
    if (!res.isConfirmed) return;

    try {
      const resp = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`${resp.status} ${resp.statusText} — ${text}`);
      }
      Swal.fire({ icon: "success", text: "Lead deleted", timer: 1000, showConfirmButton: false });
      // refresh current page
      fetchData(currentPage);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: err.message || String(err) });
    }
  };

  const columns = [
    { key: "sr", label: "Sr.No", render: (_, idx) => (currentPage - 1) * PAGE_SIZE_FALLBACK + (idx + 1) },
    { key: "date", label: "Date", render: (r) => r.date },
    { key: "followup_date", label: "Followup Date", render: (r) => r.followup_date },
    { key: "name", label: "Name", render: (r) => r.customer_name },
    { key: "contact", label: "Contact", render: (r) => r.customer_contact },
    { key: "email", label: "Email", render: (r) => r.customer_email },
    { key: "hvac_application", label: "HVAC Application", render: (r) => r.hvac_application },
    { key: "lead_source", label: "Source", render: (r) => r.lead_source },
    { key: "status", label: "Status", render: (r) => r.status },
    { key: "assign_to", label: "Assign to", render: (r) => r.assign_to_details.full_name }


  ];

  // actions renderer (centered by TableView)
  const actionsRenderer = useCallback((row) => (
    <>
      <button
        onClick={() => {
          setLeadDetailsId(row.id);
          setShowLeadDetails(true);
        }}
        className="px-2 py-1 bg-blue-200 text-blue-800 rounded"
        title="View"
      >
        <MdOutlineRemoveRedEye />
      </button>

      <button
        onClick={() => {
          setFollowUpLeadId(row.id);
          setShowLeadFollowUp(true);
        }}
        className="px-2 py-1 bg-gray-200 text-black rounded"
        title="Follow-up"
      >
        <MdEditDocument />
      </button>


      <button
        onClick={() => { setEditingLead(row); setShowLeadForm(true); }}
        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
        title="Edit"
      >
        <MdEdit />
      </button>

      <button
        onClick={() => handleDelete(row.id)}
        className="px-2 py-1 bg-red-200 text-red-800 rounded"
        title="Delete"
      >
        <MdDelete />
      </button>
    </>
  ), [handleDelete]);

  return (
    <Base
      title="Leads"
      filtersConfig={leadFilters}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      <div className="space-y-6 ">
        <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Lead Management</h2>
            <div className="text-sm text-slate-600">
              {loading ? "Loading…" : `${totalCount} total • ${rows.length} shown`}
            </div>
          </div>
          <div className="flex items-center gap-3">

            <button
              onClick={() => { setEditingLead(null); setShowLeadForm(true); }}
              className="px-4 py-2 rounded-md bg-sky-600 text-white"
            >
              + Add
            </button>
          </div>
        </div>

        <TableView
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
          pageSize={PAGE_SIZE_FALLBACK}
          actions={actionsRenderer}
          emptyMessage="No leads found"
        />
      </div>
      <AddLeadForm
        open={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        baseApi={BASE_API}
        token={token}
        lead={editingLead}   // null = add | object = edit
        onSuccess={() => {
          fetchData(currentPage);
          setShowLeadForm(false);
          setEditingLead(null);
        }}
      />


      <LeadDetails
        open={showLeadDetails}
        onClose={() => setShowLeadDetails(false)}
        leadId={leadDetailsId}
        baseApi={BASE_API}
        token={token}
      />

      {/* 👉 Follow-up form modal – use your existing AddLeadFollowUpForm */}
      <AddLeadFollowUpForm
        open={showLeadFollowUp}
        onClose={() => setShowLeadFollowUp(false)}
        baseApi={BASE_API}
        token={token}
        leadId={followUpLeadId}          // <-- IMPORTANT
        onSuccess={() => {
          fetchData(currentPage);        // refresh list after saving followup
          setShowLeadFollowUp(false);
          setFollowUpLeadId(null);
        }}
      />


    </Base>
  );
}
