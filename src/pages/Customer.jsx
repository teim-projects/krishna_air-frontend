import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Base from "../components/Base";
import TableView from "../components/TableView";
import { MdEdit, MdDelete, MdFileUpload, MdFileDownload } from "react-icons/md";
import Swal from "sweetalert2";
import AddCustomerForm from "../components/customers/AddCustomerForm"; // <-- import the form
/* Revert99 - START: XLSX import */
import * as XLSX from "xlsx";
/* Revert99 - END */

export default function Customer() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const API_URL = `${BASE_API}/lead/customer/`;
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
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  /* Revert99 - START: Customer Import & Export References & Handlers */
  // Revert99: Delete from here to Revert99 - END if not needed
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleExportExcel = () => {
    try {
      if (!rows || rows.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "No customer contact data available to export." });
        return;
      }

      const exportData = rows.map((r, idx) => ({
        "Sr.No": (currentPage - 1) * PAGE_SIZE_FALLBACK + (idx + 1),
        "Company Name": r.name || "-",
        "Contact": r.contact_number || "-",
        "Email": r.email || "-",
        "Landline No": r.land_line_no || "-",
        "POC Name": r.poc_name || "-",
        "POC Contact": r.poc_contact_number || "-",
        "City": r.city || "-",
        "State": r.state || "-",
        "PIN Code": r.pin_code || "-",
        "Address": r.address || "-",
        "GST": r.gst || "-",
        "PAN": r.pan || "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Customers_Export_${dateStr}.xlsx`);

      Swal.fire({
        icon: "success",
        title: "Exported!",
        text: "Customer contacts excel file downloaded successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Export Error:", err);
      Swal.fire({ icon: "error", title: "Export Failed", text: err.message || "Could not export customer excel file." });
    }
  };

  const handleFileUpload = async (e) => {
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
          text: "Importing and persisting customer records to database...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

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
          const incomingName = String(item["Company Name"] || item["Name"] || item["Company"] || item["name"] || "").trim();
          const incomingContact = String(item["Contact"] || item["Contact Number"] || item["Phone"] || item["contact_number"] || "").trim();
          const incomingEmail = String(item["Email"] || item["email"] || "").trim();
          const incomingLandline = String(item["Landline No"] || item["Landline"] || item["land_line_no"] || "").trim();
          const incomingPocName = String(item["POC Name"] || item["POC"] || item["poc_name"] || "").trim();
          const incomingPocContact = String(item["POC Contact"] || item["POC Phone"] || item["poc_contact_number"] || "").trim();
          const incomingCity = String(item["City"] || item["city"] || "").trim();
          const incomingState = String(item["State"] || item["state"] || "").trim();
          const incomingPin = String(item["PIN Code"] || item["Pin"] || item["pin_code"] || "").trim();
          const incomingAddress = String(item["Address"] || item["address"] || "").trim();
          const incomingGst = String(item["GST"] || item["gst"] || "").trim();
          const incomingPan = String(item["PAN"] || item["pan"] || "").trim();

          const cleanPhone = incomingContact.replace(/\D/g, "");
          const cleanEmail = incomingEmail.toLowerCase();
          const cleanName = incomingName.toLowerCase();

          // Check if matching record exists in DB rows
          const existing = rows.find(r => {
            const rPhone = String(r.contact_number || "").replace(/\D/g, "");
            const rEmail = String(r.email || "").toLowerCase();
            const rName = String(r.name || "").toLowerCase();

            if (cleanPhone && rPhone && cleanPhone === rPhone) return true;
            if (cleanEmail && rEmail && cleanEmail === rEmail) return true;
            if (cleanName && rName && cleanName === rName) return true;
            return false;
          });

          if (existing && existing.id && !String(existing.id).startsWith("cust_")) {
            // Update existing customer record in DB
            const payload = {
              name: incomingName || existing.name,
              contact_number: incomingContact || existing.contact_number,
              email: incomingEmail || existing.email,
              land_line_no: incomingLandline || existing.land_line_no,
              poc_name: incomingPocName || existing.poc_name,
              poc_contact_number: incomingPocContact || existing.poc_contact_number,
              city: incomingCity || existing.city,
              state: incomingState || existing.state,
              pin_code: incomingPin || existing.pin_code,
              address: incomingAddress || existing.address,
              gst: incomingGst || existing.gst,
              pan: incomingPan || existing.pan
            };

            await fetch(`${API_URL}${existing.id}/`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(payload)
            }).catch(err => console.error("Patch customer error:", err));

            processedReportRows.push({
              "Sr.No": processedReportRows.length + 1,
              "Status Action": "Updated Record in DB",
              "Company Name": payload.name,
              "Contact": payload.contact_number,
              "Email": payload.email,
              "City": payload.city,
              "State": payload.state
            });

          } else {
            // Create new customer record in DB
            const payload = {
              name: incomingName || "Imported Customer",
              contact_number: incomingContact || "-",
              email: incomingEmail || "-",
              land_line_no: incomingLandline || "-",
              poc_name: incomingPocName || "-",
              poc_contact_number: incomingPocContact || "-",
              city: incomingCity || "-",
              state: incomingState || "-",
              pin_code: incomingPin,
              address: incomingAddress,
              gst: incomingGst,
              pan: incomingPan
            };

            await fetch(API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(payload)
            }).catch(err => console.error("Post customer error:", err));

            processedReportRows.push({
              "Sr.No": processedReportRows.length + 1,
              "Status Action": "Created New in DB",
              "Company Name": payload.name,
              "Contact": payload.contact_number,
              "Email": payload.email,
              "City": payload.city,
              "State": payload.state
            });
          }
        }

        // Refetch updated list from DB
        await fetchData(1);

        const exportSheet = XLSX.utils.json_to_sheet(processedReportRows);
        const exportBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(exportBook, exportSheet, "Imported Customers");
        const timestamp = new Date().getTime();
        XLSX.writeFile(exportBook, `Customers_Imported_Report_${timestamp}.xlsx`);

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

  const customerFilters = useMemo(() => [
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
        const calculatedPages = Math.max(1, Math.ceil(count / pageSize));
        
        setRows(items);
        setTotalCount(count);
        setTotalPages(calculatedPages);
        
        // Ensure current page doesn't exceed total pages
        if (page > calculatedPages && calculatedPages > 0) {
          setCurrentPage(calculatedPages);
        } else {
          setCurrentPage(page);
        }
      } else if (Array.isArray(data)) {
        const calculatedPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE_FALLBACK));
        setRows(data);
        setTotalCount(data.length);
        setTotalPages(calculatedPages);
        setCurrentPage(1);
      } else {
        const items = Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : [];
        const calculatedPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE_FALLBACK));
        setRows(items);
        setTotalCount(items.length);
        setTotalPages(calculatedPages);
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
      title: "Delete customer?",
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
      Swal.fire({ icon: "success", text: "Customer deleted", timer: 1000, showConfirmButton: false });
      // refresh current page
      fetchData(currentPage);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: err.message || String(err) });
    }
  };

  const columns = [
    { key: "sr", label: "Sr.No", render: (_, idx) => (currentPage - 1) * PAGE_SIZE_FALLBACK + (idx + 1) },
    { key: "name", label: "Company Name", render: (r) => r.name },
    { key: "contact", label: "Contact", render: (r) => r.contact_number },
    { key: "email", label: "Email", render: (r) => r.email },
    { key: "land_line_no", label: "Landline No", render: (r) => r.land_line_no },
    { key: "poc_name", label: "POC Name", render: (r) => r.poc_name },
    { key: "poc_contact_number", label: "POC Contact", render: (r) => r.poc_contact_number },
    { key: "city", label: "City", render: (r) => r.city },
    { key: "state", label: "State", render: (r) => r.state },
    // { key: "pin", label: "Pin", render: (r) => r.pin_code },
    // { key: "addr", label: "Address", render: (r) => r.address },
    // { key: "site_addr", label: "Site Address", render: (r) => r.site_address },
  ];

  // actions renderer (centered by TableView)
    const actionsRenderer = useCallback((row) => (
      <>
        <button
          onClick={() => { setEditingCustomer(row); setShowCustomerForm(true); }}
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
      title="Customers"
      filtersConfig={customerFilters}
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
            title="Export Customers to Excel"
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
            <h2 className="text-lg font-semibold">Customers</h2>
            <div className="text-sm text-slate-600">
              {loading ? "Loading…" : `${totalCount} total • ${rows.length} shown`}
            </div>
          </div>
          <div className="flex items-center gap-3">
            
            <button
              onClick={() => { setEditingCustomer(null); setShowCustomerForm(true); }}
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
          onPageChange={(p) => {
            // Safeguard: Don't allow navigation beyond total pages
            if (p < 1 || p > totalPages) {
              console.warn(`Invalid page ${p}. Total pages: ${totalPages}`);
              return;
            }
            setCurrentPage(p);
          }}
          pageSize={PAGE_SIZE_FALLBACK}
          actions={actionsRenderer}
          emptyMessage="No customers found"
        />
      </div>

      {/* Add / Edit Customer Modal */}
      <AddCustomerForm
        open={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        baseApi={BASE_API}
        customer={editingCustomer}
        onSuccess={() => {
          // After adding a new customer, calculate which page it should be on
          if (!editingCustomer) {
            // This is a new customer (not editing)
            const newTotalCount = totalCount + 1;
            const lastPage = Math.ceil(newTotalCount / PAGE_SIZE_FALLBACK);
            
            // Navigate to the last page where the new item will be
            fetchData(lastPage);
          } else {
            // Editing existing customer, stay on current page
            fetchData(currentPage);
          }
          
          setEditingCustomer(null);
        }}
      />
    </Base>
  );
}
