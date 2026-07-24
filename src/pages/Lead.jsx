import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Base from "../components/Base";
import TableView from "../components/TableView";
import LeadDetails from "../components/lead/LeadDetails";
import AddLeadFollowUpForm from "../components/lead/AddLeadFollowUpForm";
import AddLeadForm from "../components/lead/AddLeadForm";
import { MdEdit, MdDelete, MdOutlineRemoveRedEye, MdEditDocument, MdAdd, MdFileUpload, MdFileDownload } from "react-icons/md";
import Swal from "sweetalert2";
import { useUserRole } from '../hooks/useAuth';
import AddQuotation from "../components/quotations/AddQuotation";
/* Revert99 - START: XLSX import */
import * as XLSX from "xlsx";
const getXLSX = async () => XLSX;
/* Revert99 - END */


export default function Lead() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const API_URL = `${BASE_API}/lead/lead/`;

  // ✅ Called hook to get user role
  const { userRole, isLoading: loadingUser } = useUserRole(BASE_API);

  // Initialize assign_to filter as empty string as well
  // const initialFilters = useMemo(() => ({ search: "", status: "", assign_to: "", lead_source: "", }), []);
  const initialFilters = useMemo(() => ({
    search: "",
    status: "",
    assign_to: "",
    lead_source: "",
    date: { from: "", to: "" },
    followup_date: { from: "", to: "" },
    overdue: [],
    sort_by: "",
  }), []);


  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  //forn connect enquiry to quotattion
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [quotationLeadData, setQuotationLeadData] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE_FALLBACK = 10;
  const PAGE_SIZE = 10;

  // modal / edit state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [leadDetailsId, setLeadDetailsId] = useState(null);

  const [showLeadFollowUp, setShowLeadFollowUp] = useState(false);
  const [followUpLeadId, setFollowUpLeadId] = useState(null);

  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assignToOptions, setAssignToOptions] = useState([]);

  /* Revert99 - START: Import & Export References & Handlers */
  // Revert99: Delete from here to Revert99 - END if not needed
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleExportExcel = async () => {
    try {
      if (!rows || rows.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "No enquiry data available to export." });
        return;
      }

      const XLSX = await getXLSX();

      const exportData = rows.map((r, idx) => ({
        "Sr.No": (currentPage - 1) * PAGE_SIZE + (idx + 1),
        "Date": formatDate(r.date),
        "Followup Date": formatDate(r.followup_date),
        "Project Name": r.project_name || "-",
        "Name": r.customer_name || "-",
        "Contact": r.customer_contact || "-",
        "Source": r.lead_source || "-",
        "Status": r.status || "-",
        "Assign To": r.assign_to_details?.full_name || "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiries");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Enquiries_Export_${dateStr}.xlsx`);

      Swal.fire({
        icon: "success",
        title: "Exported!",
        text: "Enquiries excel file downloaded successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Export Error:", err);
      Swal.fire({ icon: "error", title: "Export Failed", text: err.message || "Could not export excel file." });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "Please upload Excel files only (.xlsx, .xls, .csv).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        Swal.fire({
          title: "Saving to Database...",
          text: "Importing and persisting enquiry records to database...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const XLSX = await getXLSX();
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!parsedData || parsedData.length === 0) {
          Swal.close();
          Swal.fire({ icon: "warning", title: "Empty Sheet", text: "The uploaded excel sheet contains no data." });
          return;
        }

        const processedReportRows = [];

        for (let i = 0; i < parsedData.length; i++) {
          const item = parsedData[i];
          const todayStr = new Date().toISOString().split("T")[0];
          const incomingContact = String(item["Contact"] || item["Mobile"] || item["Phone"] || item["contact"] || "").trim();
          const incomingName = String(item["Name"] || item["Customer Name"] || item["name"] || item["Customer"] || "").trim();
          const incomingProject = String(item["Project Name"] || item["Project"] || item["project_name"] || "").trim();
          const incomingDate = item["Date"] || item["date"] || todayStr;
          const incomingFollowup = item["Followup Date"] || item["Follow-up Date"] || item["followup_date"] || "";
          const incomingSource = item["Source"] || item["Lead Source"] || item["lead_source"] || "other";
          const incomingStatus = (item["Status"] || item["status"] || "open").toLowerCase().replace(" ", "_");

          const cleanPhone = incomingContact.replace(/\D/g, "");

          const existing = rows.find(r => {
            const rPhone = String(r.customer_contact || "").replace(/\D/g, "");
            if (cleanPhone && rPhone && cleanPhone === rPhone) return true;
            if (incomingName && r.customer_name &&
                incomingName.toLowerCase() === r.customer_name.toLowerCase() &&
                incomingProject && r.project_name &&
                incomingProject.toLowerCase() === r.project_name.toLowerCase()) {
              return true;
            }
            return false;
          });

          if (existing && existing.id && !String(existing.id).startsWith("imp_")) {
            const payload = {
              date: incomingDate || existing.date,
              followup_date: incomingFollowup || existing.followup_date,
              project_name: incomingProject || existing.project_name,
              customer_name: incomingName || existing.customer_name,
              customer_contact: incomingContact || existing.customer_contact,
              lead_source: incomingSource || existing.lead_source,
              status: incomingStatus || existing.status
            };

            await fetch(`${API_URL}${existing.id}/`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(payload)
            }).catch(err => console.error("Patch lead error:", err));

            processedReportRows.push({
              "Sr.No": processedReportRows.length + 1,
              "Status Action": "Updated Record in DB",
              "Date": payload.date,
              "Name": payload.customer_name,
              "Contact": payload.customer_contact,
              "Project": payload.project_name,
              "Status": payload.status
            });

          } else {
            const payload = {
              date: incomingDate,
              followup_date: incomingFollowup,
              project_name: incomingProject || "Imported Project",
              customer_name: incomingName || "Imported Customer",
              customer_contact: incomingContact || "-",
              customer_email: item["Email"] || item["email"] || "",
              lead_source: incomingSource,
              status: incomingStatus
            };

            await fetch(API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(payload)
            }).catch(err => console.error("Post lead error:", err));

            processedReportRows.push({
              "Sr.No": processedReportRows.length + 1,
              "Status Action": "Created New in DB",
              "Date": payload.date,
              "Name": payload.customer_name,
              "Contact": payload.customer_contact,
              "Project": payload.project_name,
              "Status": payload.status
            });
          }
        }

        await fetchData(1);

        const exportSheet = XLSX.utils.json_to_sheet(processedReportRows);
        const exportBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(exportBook, exportSheet, "Imported Enquiries");
        const timestamp = new Date().getTime();
        XLSX.writeFile(exportBook, `Enquiries_Imported_Report_${timestamp}.xlsx`);

        Swal.fire({
          icon: "success",
          title: "Import Successful!",
          text: `Excel data saved to database successfully from "${file.name}".`,
          timer: 1500,
          showConfirmButton: false,
        });

      } catch (err) {
        console.error("Import Error:", err);
        Swal.fire({ icon: "error", title: "Import Failed", text: "Failed to save imported data to database." });
      }
    };

    reader.readAsBinaryString(file);
  };
  /* Revert99 - END */

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  const status_choice = useMemo(() => [
    { value: "open", label: "Open" },
    { value: "in_process", label: "In Process" },
    { value: "closed", label: "Closed" },
  ], []);

  const leadSourceOptions = useMemo(() => [
    { value: "google_ads", label: "Google Ads" },
    { value: "indiamart", label: "IndiaMART" },
    { value: "bni", label: "BNI" },
    { value: "justdial", label: "Justdial" },
    { value: "reference", label: "Reference" },
    { value: "architect/interior_designer", label: "Architect Interior Designer" },
    { value: "builder", label: "Builder" },
    { value: "existing_customer", label: "Existing Customer" },
    { value: "ka_staff", label: "KA Staff" },
    { value: "other", label: "Other" },
  ], []);


  // =========================================================
  //  useEffect: Fetch Staff Data for Filters (Conditional Fetch)
  // =========================================================
  useEffect(() => {
    // ✅ Only fetch if token exists AND user role is NOT sales
    if (!token || userRole?.name === "sales" || loadingUser) {
      setAssignToOptions([]);
      setLoadingStaff(false);
      return;
    }

    setLoadingStaff(true);
    const controller = new AbortController();

    const staffUrl = `${BASE_API.replace(/\/$/, "")}/auth/staff/?search=sales`;

    fetch(staffUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to fetch staff: ${res.status} ${res.statusText} ${txt}`);
        }
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data.results ?? [];
        const mappedStaff = items.map((u) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        }));
        setAssignToOptions(mappedStaff);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error("Failed to fetch assignable staff:", err);
        setAssignToOptions([]);
      })
      .finally(() => setLoadingStaff(false));

    return () => controller.abort();

  }, [BASE_API, token, userRole, loadingUser]); // Added userRole, loadingUser to deps
  // =========================================================


  const baseFilters = useMemo(() => [
    { key: "search", type: "search", label: "Search", placeholder: "Search name, email, contact..." },
    {
      key: "status",
      type: "select",
      label: "Status",
      placeholder: "Status",
      options: [...status_choice.map(r => ({ value: r.value, label: r.label }))]
    },
    // Assign To filter definition
    {
      key: "assign_to",
      type: "select",
      label: loadingStaff ? "Assign to (Loading...)" : "Assign to",
      placeholder: "Assign to",
      options: assignToOptions.map(at => ({ value: String(at.id), label: at.name }))
    },
    {
      key: "lead_source",
      type: "select",
      label: "Source",
      placeholder: "Source",
      options: [...leadSourceOptions.map(ls => ({ value: ls.value, label: ls.label }))]
    },
    {
      key: "overdue",
      type: "checkbox",
      label: "Overdue Follow-ups",
      options: [
        { value: "true", label: "Show only overdue" }
      ]
    },
    {
      key: "date",
      type: "daterange",
      label: "Lead Date",
    },
    {
      key: "followup_date",
      type: "daterange",
      label: "Follow-up Date",
    },
    {
      key: "sort_by",
      type: "select",
      label: "Sort By",
      placeholder: "Default (Priority)",
      options: [
        { value: "-date",           label: "Newest First" },
        { value: "date",            label: "Oldest First" },
        { value: "customer__name",  label: "Customer Name A to Z" },
        { value: "-customer__name", label: "Customer Name Z to A" },
        { value: "followup_date",   label: "Follow-up Date Ascending" },
        { value: "-followup_date",  label: "Follow-up Date Descending" },
      ],
    },
  ], [status_choice, assignToOptions, loadingStaff, leadSourceOptions]);

  // ✅ CONDITIONAL FILTERING LOGIC: Hide Assign To filter for sales users
  const leadFilters = useMemo(() => {
    // If user role is still loading, show no filters to prevent flicker
    if (loadingUser) return [];

    return baseFilters.filter(filter => {
      // If user is sales, hide the 'assign_to' filter
      if (userRole?.name === 'sales' && filter.key === 'assign_to') {
        return false;
      }
      return true;
    });
  }, [baseFilters, userRole, loadingUser]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error("No bearer token found in localStorage.");

      const params = new URLSearchParams();
      params.set("page", String(page));

      // attach filters
      if (appliedFilters.search) params.set("search", appliedFilters.search);
      if (appliedFilters.status) params.set("status", appliedFilters.status);
      if (appliedFilters.lead_source) params.set("lead_source", appliedFilters.lead_source);

      // 🔹 LEAD DATE RANGE
      if (appliedFilters.date?.from) {
        params.set("date_from", appliedFilters.date.from);
      }
      if (appliedFilters.date?.to) {
        params.set("date_to", appliedFilters.date.to);
      }

      // 🔹 FOLLOWUP DATE RANGE
      if (appliedFilters.followup_date?.from) {
        params.set("followup_date_from", appliedFilters.followup_date.from);
      }
      if (appliedFilters.followup_date?.to) {
        params.set("followup_date_to", appliedFilters.followup_date.to);
      }

      // 🔴 OVERDUE FILTER
      if (appliedFilters.overdue?.includes("true")) {
        params.set("overdue", "true");
      }


      // ✅ Final check for assign_to: Only include filter if user is NOT sales
      // The backend handles the restriction for sales users automatically.
      if (userRole?.name !== 'sales' && appliedFilters.assign_to) {
        params.set("assign_to", appliedFilters.assign_to);
      }

      // 🔹 SORT / ORDERING — maps to DRF OrderingFilter ?ordering=
      if (appliedFilters.sort_by) {
        params.set("ordering", appliedFilters.sort_by);
      }

      const url = `${API_URL}?${params.toString()}`;

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

      // ... (rest of data handling remains the same) ...

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
  }, [token, appliedFilters, API_URL, userRole]); // Added userRole to deps

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
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getRowClassName = (lead) => {
    if (!lead.followup_date) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followupDate = new Date(lead.followup_date);
    followupDate.setHours(0, 0, 0, 0);

    // Today's followup - Yellow
    if (followupDate.getTime() === today.getTime()) {
      return "bg-yellow-100";
    }

    // Missed followup - Red
    if (followupDate < today) {
      return "bg-red-100";
    }

    return "";
  };

  const columns = [
    { key: "sr", label: "Sr.No", render: (_, idx) => (currentPage - 1) * PAGE_SIZE + (idx + 1) },
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
    { key: "followup_date", label: "Followup Date", render: (r) => formatDate(r.followup_date) },
    { key: "project_name", label: "Project Name", render: (r) => r.project_name || "-" },
    { key: "name", label: "Name", render: (r) => r.customer_name },
    { key: "contact", label: "Contact", render: (r) => r.customer_contact },
    // { key: "email", label: "Email", render: (r) => r.customer_email },
    // { key: "hvac_application", label: "HVAC Application", render: (r) => r.hvac_application },
    { key: "lead_source", label: "Source", render: (r) => r.lead_source },
    { key: "status", label: "Status", render: (r) => r.status },
    // ✅ SHOW ONLY IF USER IS NOT SALES
    ...(userRole?.name !== "sales"
      ? [{
        key: "assign_to",
        label: "Assign To",
        render: (r) => r.assign_to_details?.full_name || "-"
      }]
      : [])
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

      {/* NEW QUOTATION BUTTON */}
      <button
        onClick={() => {
          setQuotationLeadData(row);
          setShowQuotationForm(true);
        }}
        className="px-2 py-1 bg-green-200 text-green-800 rounded"
        title="Create Quotation"
      >
        <MdAdd />
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
      title="Enquiries"
      filtersConfig={leadFilters}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
      headerActions={
        /* Revert99 - START: Import & Export Buttons near Filters */
        /* Revert99: Delete from here to Revert99 - END if not needed */
        <>
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-white hover:shadow-sm"
            title="Import Excel Sheet (.xlsx, .xls, .csv)"
          >
            <MdFileUpload className="text-sky-600 text-base" />
            <span className="hidden sm:inline text-sm text-slate-700">Import</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-white hover:shadow-sm"
            title="Export Enquiries to Excel"
          >
            <MdFileDownload className="text-sky-600 text-base" />
            <span className="hidden sm:inline text-sm text-slate-700">Export</span>
          </button>
        </>
        /* Revert99 - END */
      }
    >
      <div className="space-y-6 ">
        <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Enquiry Management</h2>
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
          pageSize={PAGE_SIZE} // Using the actual PAGE_SIZE here
          actions={actionsRenderer}
          emptyMessage="No leads found"
          rowClassName={getRowClassName}
        />
      </div>
      <AddLeadForm
        open={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        baseApi={BASE_API}
        token={token}
        lead={editingLead}  // null = add | object = edit
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
        leadId={followUpLeadId}
        onSuccess={() => {
          fetchData(currentPage);
          setShowLeadFollowUp(false);
          setFollowUpLeadId(null);
        }}
      />

      {/* ADD QUOTATION FORM */}
      {showQuotationForm && (
        <AddQuotation
          leadData={quotationLeadData}
          onBack={() => {
            setShowQuotationForm(false);
            setQuotationLeadData(null);
            // Refresh the leads list
            fetchData(currentPage);
          }}
        />
      )}

    </Base>
  );
}