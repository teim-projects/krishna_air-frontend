import React, { useCallback, useEffect, useMemo, useState } from "react";
import Base from "../components/Base";
import AddStaffForm from "../components/accounts/AddStaffForm";
import EditWorkRecordForm from "../components/accounts/EditWorkRecordForm";
import CompletedWorkDetailModal from "../components/accounts/CompletedWorkDetailModal";
import { MdEdit, MdDelete } from "react-icons/md";
import RolePage from "../pages/RolesPage";
import Swal from "sweetalert2";
import TableView from "../components/TableView"; // <-- reusable table

export default function Accounts() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const initialFilters = useMemo(() => ({ search: "", role: "" }), []);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [workRecords, setWorkRecords] = useState([]);
  const [completedWorkRows, setCompletedWorkRows] = useState([]);
  const [loadingWork, setLoadingWork] = useState(false);
  const [loadingCompletedWork, setLoadingCompletedWork] = useState(false);
  const [editingWorkRecord, setEditingWorkRecord] = useState(null);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [completedWorkDetailId, setCompletedWorkDetailId] = useState(null);
  const [showCompletedWorkDetail, setShowCompletedWorkDetail] = useState(false);

  const token = useMemo(() => {
    return (
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      ""
    );
  }, []);

  // dynamic filters config (role options loaded)
  const dashboardFilters = useMemo(() => {
    return [
      { key: "search", type: "search", label: "Search", placeholder: "Search name, email, mobile..." },
      {
        key: "role",
        type: "select",
        label: "Role",
        placeholder: "All roles",
        options: [...roles.map(r => ({ value: String(r.id), label: r.name }))]
      },
    ];
  }, [roles]);

  // fetch roles
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      if (!token) throw new Error("No bearer token found.");

      const url = `${BASE_API}/auth/roles/`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${body ? " — " + body : ""}`);
      }

      const data = await res.json();

      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setRolesError(err.message || String(err));
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [token, BASE_API]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // fetch staff - supports paginated and non-paginated responses
  const PAGE_SIZE = 10;
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error("No bearer token found in localStorage.");

      const params = new URLSearchParams();
      params.set("page", String(page));
      // attach filters
      if (appliedFilters.search) params.set("search", appliedFilters.search);
      if (appliedFilters.role) params.set("role", appliedFilters.role);

      const url = `${BASE_API}/auth/staff/?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${body ? " — " + body : ""}`);
      }

      const data = await res.json();

      // If DRF pagination is enabled, response will contain `results`
      if (data && Array.isArray(data.results)) {
        setRows(data.results);
        const count = Number.isFinite(data.count) ? data.count : (data.results.length || 0);
        setTotalCount(count);
        // compute total pages (PAGE_SIZE must match backend page size)
        const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
        setTotalPages(pages);
        setCurrentPage(page);
      } else if (Array.isArray(data)) {
        // not paginated: backend returned raw array
        setRows(data);
        setTotalCount(data.length);
        setTotalPages(Math.max(1, Math.ceil(data.length / PAGE_SIZE)));
        setCurrentPage(1);
      } else {
        // unexpected shape
        throw new Error("Unexpected staff response shape");
      }
    } catch (err) {
      setError(err.message || String(err));
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, appliedFilters, BASE_API]);

  // initial load and reload whenever filters or page change
  useEffect(() => {
    // whenever filters change, reset to page 1
    setCurrentPage(1);
    fetchData(1);
  }, [appliedFilters, fetchData]);

  // when currentPage changes (via pagination UI), fetch that page
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const handleFilterChange = useCallback((filters) => {
    setAppliedFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const fetchWorkRecords = useCallback(async () => {
    setLoadingWork(true);
    try {
      if (!token) return;
      const res = await fetch(`${BASE_API}/amc/technician-work-records/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkRecords(data.results || data);
      }
    } catch (err) {
      console.error("Failed to load work records", err);
    } finally {
      setLoadingWork(false);
    }
  }, [token, BASE_API]);

  const fetchCompletedWork = useCallback(async () => {
    setLoadingCompletedWork(true);
    try {
      if (!token) return;
      const res = await fetch(`${BASE_API}/amc/completed-work/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedWorkRows(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load completed work", err);
      setCompletedWorkRows([]);
    } finally {
      setLoadingCompletedWork(false);
    }
  }, [token, BASE_API]);

  useEffect(() => {
    if (activeTab === "low") {
      fetchWorkRecords();
    }
    if (activeTab === "installation") {
      fetchCompletedWork();
    }
  }, [activeTab, fetchWorkRecords, fetchCompletedWork]);

  const handleDeleteStaff = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Staff?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${BASE_API}/auth/staff/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Staff member deleted successfully",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const data = await res.json();
        throw new Error(data.detail || data.message || "Failed to delete staff member");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Deletion Failed",
        text: err.message
      });
    }

    fetchData(currentPage);
  };

  const handleDeleteWorkRecord = useCallback(async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Work Record?",
      text: "Are you sure you want to delete this work record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${BASE_API}/amc/technician-work-records/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Work record deleted successfully",
          timer: 1500,
          showConfirmButton: false
        });
        fetchWorkRecords();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.message || "Failed to delete work record");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Deletion Failed",
        text: err.message
      });
    }
  }, [BASE_API, token, fetchWorkRecords]);

  // table columns for TableView
  const columns = useMemo(() => ([
    {
      key: "sr",
      label: "Sr.No",
      render: (_, idx) => (currentPage - 1) * PAGE_SIZE + (idx + 1)
    },
    { key: "email", label: "Email", render: r => r.email },
    { key: "mobile", label: "Mobile", render: r => r.mobile_no },
    { key: "first_name", label: "First Name", render: r => r.first_name },
    { key: "last_name", label: "Last Name", render: r => r.last_name },
    { key: "role", label: "Role", render: r => r.role?.name ?? "" },
  ]), [currentPage]);

  const displayRows = useMemo(() => {
    if (activeTab === "technician") {
      return rows.filter(r => r.role?.name?.toLowerCase() === "technician");
    }
    return rows;
  }, [rows, activeTab]);

  const completedWorkColumns = useMemo(() => ([
    {
      key: "sr",
      label: "Sr.No",
      render: (_, idx) => idx + 1,
    },
    { key: "customer", label: "Customer Name", render: r => r.customer_name || "—" },
    { key: "technician", label: "Technician Name", render: r => r.technician_name || "—" },
    { key: "completion_date", label: "Completion Date", render: r => r.completion_date || "—" },
  ]), []);

  const completedWorkActionsRenderer = useCallback((row) => (
    <button
      type="button"
      onClick={() => {
        setCompletedWorkDetailId(row.id);
        setShowCompletedWorkDetail(true);
      }}
      className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
    >
      View more
    </button>
  ), []);

  const workColumns = useMemo(() => ([
    {
      key: "sr",
      label: "Sr.No",
      render: (_, idx) => idx + 1
    },
    { key: "technician", label: "Technician", render: r => r.technician_name },
    { key: "customer", label: "Customer Name", render: r => r.customer_name },
    { key: "phone", label: "Phone", render: r => r.customer_phone },
    { key: "work_date", label: "Work Date", render: r => r.work_date },
    { key: "end_date", label: "End Date", render: r => r.service_end_date || "—" },
    { key: "description", label: "Description", render: r => r.work_description || "—" },
    { key: "payment", label: "Payment Amount", render: r => `₹${parseFloat(r.payment_amount || 0).toFixed(2)}` },
    {
      key: "status",
      label: "Payment Status",
      render: r => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          r.payment_status === "completed" 
            ? "bg-green-100 text-green-800" 
            : "bg-amber-100 text-amber-800"
        }`}>
          {r.payment_status?.toUpperCase()}
        </span>
      )
    }
  ]), []);

  // actions renderer (centered by TableView)
  const actionsRenderer = useCallback((row) => (
    <>
      <button
        onClick={() => { setEditingStaff(row); setShowStaffForm(true); }}
        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
        title="Edit"
      >
        <MdEdit />
      </button>

      <button
        onClick={() => handleDeleteStaff(row.id)}
        className="px-2 py-1 bg-red-200 text-red-800 rounded"
        title="Delete"
      >
        <MdDelete />
      </button>
    </>
  ), [handleDeleteStaff]);

  const workActionsRenderer = useCallback((row) => (
    <>
      <button
        onClick={() => { setEditingWorkRecord(row); setShowWorkForm(true); }}
        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
        title="Edit"
      >
        <MdEdit />
      </button>

      <button
        onClick={() => handleDeleteWorkRecord(row.id)}
        className="px-2 py-1 bg-red-200 text-red-800 rounded"
        title="Delete"
      >
        <MdDelete />
      </button>
    </>
  ), [handleDeleteWorkRecord]);

  return (
    <Base
      title="Accounts Overview"
      filtersConfig={dashboardFilters}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      <div className="space-y-6">
        {/* Category Selection Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded font-medium transition w-full sm:w-auto text-center ${
              activeTab === "all"
                ? "bg-blue-800 text-blue-100"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setActiveTab("technician")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded font-medium transition w-full sm:w-auto text-center ${
              activeTab === "technician"
                ? "bg-blue-800 text-blue-100"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            Technician List
          </button>
          <button
            onClick={() => setActiveTab("low")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded font-medium transition w-full sm:w-auto text-center ${
              activeTab === "low"
                ? "bg-blue-800 text-blue-100"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            Work history
          </button>
          <button
            onClick={() => setActiveTab("installation")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded font-medium transition w-full sm:w-auto text-center ${
              activeTab === "installation"
                ? "bg-blue-800 text-blue-100"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            Completed Work
          </button>
        </div>

        <div className="bg-white p-4 rounded-md shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {activeTab === "low" ? "Technician Work History" :
               activeTab === "installation" ? "Completed Work Records" :
               "Staff Accounts & Roles"}
            </h2>
            <div className="text-sm text-slate-600">
              {activeTab === "low" ? `${workRecords.length} record(s) found` :
               activeTab === "installation" ? `${completedWorkRows.length} record(s) found` :
               (loading ? "Loading…" : `${activeTab === "technician" ? displayRows.length : totalCount} total • ${displayRows.length} shown`)}
            </div>
          </div>

          {(activeTab === "all" || activeTab === "technician") && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowAddRole(true)}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 text-center w-full sm:w-auto"
              >
                Manage Roles
              </button>

              <button
                onClick={() => { setEditingStaff(null); setShowStaffForm(true); }}
                className="px-4 py-2 rounded-md bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 text-center w-full sm:w-auto"
              >
                + Add Staff
              </button>

              {rolesLoading ? <div className="text-sm text-slate-500 text-center">Loading roles…</div> :
               rolesError ? <div className="text-sm text-red-500 text-center">Roles error</div> : null}
            </div>
          )}
        </div>

        {/* Reusable TableView */}
        {activeTab === "low" ? (
          <TableView
            columns={workColumns}
            rows={workRecords}
            loading={loadingWork}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            pageSize={100}
            actions={workActionsRenderer}
            emptyMessage="No work records found."
          />
        ) : activeTab === "installation" ? (
          <TableView
            columns={completedWorkColumns}
            rows={completedWorkRows}
            loading={loadingCompletedWork}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            pageSize={100}
            actions={completedWorkActionsRenderer}
            emptyMessage="No completed work found."
          />
        ) : (
          <TableView
            columns={columns}
            rows={displayRows}
            loading={loading}
            error={error}
            page={currentPage}
            totalPages={activeTab === "technician" ? 1 : totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            pageSize={PAGE_SIZE}
            actions={actionsRenderer}
            emptyMessage="No records"
          />
        )}
      </div>

      {/* Manage Roles modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-full max-w-3xl p-4">
            <RolePage baseApi={BASE_API} onClose={() => {setShowAddRole(false); 
                      fetchRoles();}} />
          </div>
        </div>
      )}



      <AddStaffForm
        open={showStaffForm}
        onClose={() => setShowStaffForm(false)}
        onSuccess={() => fetchData(currentPage)}
        baseApi={BASE_API}
        roles={roles}
        staff={editingStaff}
      />

      <EditWorkRecordForm
        open={showWorkForm}
        onClose={() => setShowWorkForm(false)}
        onSuccess={() => fetchWorkRecords()}
        baseApi={BASE_API}
        workRecord={editingWorkRecord}
      />

      <CompletedWorkDetailModal
        open={showCompletedWorkDetail}
        onClose={() => {
          setShowCompletedWorkDetail(false);
          setCompletedWorkDetailId(null);
        }}
        baseApi={BASE_API}
        itemId={completedWorkDetailId}
      />
    </Base>
  );
}
