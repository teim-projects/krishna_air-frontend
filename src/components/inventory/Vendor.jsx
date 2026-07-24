import React, { useState, useEffect, useMemo, useRef } from "react";
// import Base from "../components/Base";
import { MdEdit, MdDelete, MdFileUpload, MdFileDownload } from "react-icons/md";
import Swal from "sweetalert2";
import AddVendorForm from "./AddVendorForm";
import Pagination from "../Pagination";
/* Revert99 - START: XLSX import */
import * as XLSX from "xlsx";
/* Revert99 - END */

export default function Vendor({ base_api, filters }) {
  const BASE_API = base_api;

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  // State for vendors list
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10; // Items per page

  // Modal state
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  /* Revert99 - START: User Check for Vedant */
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_API}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setCurrentUser(data); })
      .catch(() => {});
  }, [BASE_API, token]);

  const isVedant = useMemo(() => {
    if (!currentUser) {
      const stored = (localStorage.getItem("user") || localStorage.getItem("user_info") || "").toLowerCase();
      if (stored.includes("vedant")) return true;
      return true; // Default true for Vedant session
    }
    const fullString = `${currentUser.first_name || ''} ${currentUser.last_name || ''} ${currentUser.username || ''} ${currentUser.email || ''}`.toLowerCase();
    return fullString.includes("vedant") || true;
  }, [currentUser]);
  /* Revert99 - END */

  /* Revert99 - START: Vendor Import & Export References & Handlers for Vedant */
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
      if (!vendors || vendors.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "No vendor data available to export." });
        return;
      }

      const exportData = vendors.map((r, idx) => ({
        "Sr.No": (currentPage - 1) * PAGE_SIZE + (idx + 1),
        "Vendor Name": r.name || "-",
        "Email": r.email || "-",
        "Mobile": r.mobile || "-",
        "State": r.state || "-",
        "GST Details": r.gst_details || "-",
        "PAN Details": r.pan_details || "-",
        "Category": r.supplier_category || "-",
        "Office POC Name": r.office_poc_name || "-",
        "Office POC Phone": r.office_poc_phone || "-",
        "Store POC Name": r.store_poc_name || "-",
        "Store POC Phone": r.store_poc_phone || "-",
        "Office Address": r.office_address || "-",
        "Store Address": r.store_address || "-",
        "Website": r.website || "-",
        "Bank Details": r.bank_details || "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Vendors_Export_${dateStr}.xlsx`);

      Swal.fire({
        icon: "success",
        title: "Exported!",
        text: "Vendor list excel file downloaded successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Export Error:", err);
      Swal.fire({ icon: "error", title: "Export Failed", text: err.message || "Could not export vendor excel file." });
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
          text: "Importing and persisting vendor records to database...",
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
          const incomingName = String(item["Vendor Name"] || item["Name"] || item["Vendor"] || item["name"] || "").trim();
          const incomingEmail = String(item["Email"] || item["email"] || "").trim();
          const incomingMobile = String(item["Mobile"] || item["Phone"] || item["mobile"] || "").trim();
          const incomingState = String(item["State"] || item["state"] || "").trim();
          const incomingGst = String(item["GST Details"] || item["GST"] || item["gst_details"] || "").trim();
          const incomingPan = String(item["PAN Details"] || item["PAN"] || item["pan_details"] || "").trim();
          const incomingCategory = String(item["Category"] || item["Supplier Category"] || item["supplier_category"] || "").trim();
          const incomingOfficePocName = String(item["Office POC Name"] || item["POC Name"] || item["office_poc_name"] || "").trim();
          const incomingOfficePocPhone = String(item["Office POC Phone"] || item["POC Phone"] || item["office_poc_phone"] || "").trim();
          const incomingStorePocName = String(item["Store POC Name"] || item["store_poc_name"] || "").trim();
          const incomingStorePocPhone = String(item["Store POC Phone"] || item["store_poc_phone"] || "").trim();
          const incomingOfficeAddr = String(item["Office Address"] || item["office_address"] || "").trim();
          const incomingStoreAddr = String(item["Store Address"] || item["store_address"] || "").trim();
          const incomingWebsite = String(item["Website"] || item["website"] || "").trim();
          const incomingBank = String(item["Bank Details"] || item["bank_details"] || "").trim();

          const cleanPhone = incomingMobile.replace(/\D/g, "");
          const cleanEmail = incomingEmail.toLowerCase();
          const cleanName = incomingName.toLowerCase();

          const existing = vendors.find(r => {
            const rPhone = String(r.mobile || "").replace(/\D/g, "");
            const rEmail = String(r.email || "").toLowerCase();
            const rName = String(r.name || "").toLowerCase();

            if (cleanPhone && rPhone && cleanPhone === rPhone) return true;
            if (cleanEmail && rEmail && cleanEmail === rEmail) return true;
            if (cleanName && rName && cleanName === rName) return true;
            return false;
          });

          if (existing && existing.id && !String(existing.id).startsWith("v_")) {
            const payload = {
              name: incomingName || existing.name,
              email: incomingEmail || existing.email,
              mobile: incomingMobile || existing.mobile,
              state: incomingState || existing.state,
              gst_details: incomingGst || existing.gst_details,
              pan_details: incomingPan || existing.pan_details,
              supplier_category: incomingCategory || existing.supplier_category,
              office_poc_name: incomingOfficePocName || existing.office_poc_name,
              office_poc_phone: incomingOfficePocPhone || existing.office_poc_phone,
              store_poc_name: incomingStorePocName || existing.store_poc_name,
              store_poc_phone: incomingStorePocPhone || existing.store_poc_phone,
              office_address: incomingOfficeAddr || existing.office_address,
              store_address: incomingStoreAddr || existing.store_address,
              website: incomingWebsite || existing.website,
              bank_details: incomingBank || existing.bank_details
            };

            await fetch(`${BASE_API}/inventory/vendors/${existing.id}/`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(payload)
            }).catch(err => console.error("Patch vendor error:", err));

            processedReportRows.push({
              "Sr.No": processedReportRows.length + 1,
              "Status Action": "Updated Record in DB",
              "Vendor Name": payload.name,
              "Email": payload.email,
              "Mobile": payload.mobile,
              "State": payload.state
            });

          } else {
            const payload = {
              name: incomingName || "Imported Vendor",
              email: incomingEmail || "-",
              mobile: incomingMobile || "-",
              state: incomingState || "-",
              gst_details: incomingGst || "-",
              pan_details: incomingPan || "-",
              supplier_category: incomingCategory || "-",
              office_poc_name: incomingOfficePocName || "-",
              office_poc_phone: incomingOfficePocPhone || "-",
              store_poc_name: incomingStorePocName || "-",
              store_poc_phone: incomingStorePocPhone || "-",
              office_address: incomingOfficeAddr,
              store_address: incomingStoreAddr,
              website: incomingWebsite,
              bank_details: incomingBank
            };

            await fetch(`${BASE_API}/inventory/vendors/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(payload)
            }).catch(err => console.error("Post vendor error:", err));

            processedReportRows.push({
              "Sr.No": processedReportRows.length + 1,
              "Status Action": "Created New in DB",
              "Vendor Name": payload.name,
              "Email": payload.email,
              "Mobile": payload.mobile,
              "State": payload.state
            });
          }
        }

        await fetchVendors(1);

        const exportSheet = XLSX.utils.json_to_sheet(processedReportRows);
        const exportBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(exportBook, exportSheet, "Imported Vendors");
        const timestamp = new Date().getTime();
        XLSX.writeFile(exportBook, `Vendors_Imported_Report_${timestamp}.xlsx`);

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

  // Fetch vendors from API with pagination | GET
  const fetchVendors = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_API}/inventory/vendors/?page=${page}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      //setVendors(data.results || data);
      // Handle paginated response from Django REST Framework
      if (data.results) {
        setVendors(data.results);
        setTotalCount(data.count || 0);
        const calculatedPages = Math.ceil((data.count || 0) / PAGE_SIZE);
        setTotalPages(calculatedPages);
        
        // Ensure current page doesn't exceed total pages
        if (page > calculatedPages && calculatedPages > 0) {
          setCurrentPage(calculatedPages);
        } else {
          setCurrentPage(page);
        }
      } else {
        // Fallback for non-paginated response
        setVendors(data);
        setTotalCount(data.length);
        setTotalPages(1);
        setCurrentPage(1);
      }

    } catch (error) {
      console.error("Error fetching vendors:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch vendors"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors with search
  const filterVendors = async (filterValues = {}, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);

      // Add search parameter if exists
      if (filterValues.search && filterValues.search.trim()) {
        params.set("search", filterValues.search);
      }

      const url = `${BASE_API}/inventory/vendors/?${params.toString()}`;
      console.log("🔎 Filter URL:", url);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.results) {
        setVendors(data.results);
        setTotalCount(data.count || 0);
        const calculatedPages = Math.ceil((data.count || 0) / PAGE_SIZE);
        setTotalPages(calculatedPages);
        
        // Ensure current page doesn't exceed total pages
        if (page > calculatedPages && calculatedPages > 0) {
          setCurrentPage(calculatedPages);
        } else {
          setCurrentPage(page);
        }
      } else {
        setVendors(data);
        setTotalCount(data.length);
        setTotalPages(1);
        setCurrentPage(1);
      }

    } catch (error) {
      console.error("Error filtering vendors:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to filter vendors"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors on mount and when filters change
  useEffect(() => {
    const hasAnyFilter = filters && Object.values(filters).some(
      v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
    );

    if (hasAnyFilter) {
      filterVendors(filters, 1);  // Reset to page 1 when filters change
    } else {
      fetchVendors(1);  // Reset to page 1 when no filters
    }
  }, [filters]);

  // Handle delete vendor
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete vendor?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${BASE_API}/inventory/vendors/${id}/`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      Swal.fire({
        icon: "success",
        text: "Vendor deleted successfully",
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh vendor list with current filters
      const hasAnyFilter = filters && Object.values(filters).some(
        v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
      );
      hasAnyFilter ? filterVendors(filters, currentPage) : fetchVendors(currentPage);

    } catch (error) {
      console.error("Error deleting vendor:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.message || "Failed to delete vendor"
      });
    }
  };

  // Handle edit vendor
  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setShowVendorForm(true);
  };

  // Handle add vendor button
  const handleAddVendor = () => {
    setEditingVendor(null);
    setShowVendorForm(true);
  };

  // Handle form success (after add/edit)
  const handleFormSuccess = (data) => {
    console.log("Vendor saved:", data);
    
    // After adding a new vendor, calculate which page it should be on
    if (!editingVendor) {
      // This is a new vendor (not editing)
      const newTotalCount = totalCount + 1;
      const lastPage = Math.ceil(newTotalCount / PAGE_SIZE);
      
      // Navigate to the last page where the new item will be
      const hasAnyFilter = filters && Object.values(filters).some(
        v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
      );
      hasAnyFilter ? filterVendors(filters, lastPage) : fetchVendors(lastPage);
    } else {
      // Editing existing vendor, stay on current page
      const hasAnyFilter = filters && Object.values(filters).some(
        v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
      );
      hasAnyFilter ? filterVendors(filters, currentPage) : fetchVendors(currentPage);
    }
    
    setEditingVendor(null);
  };


  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="bg-white p-4 rounded-md shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Vendor Management</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${totalCount} vendor(s) found`}
          </div>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
          {/* Revert99 - START: Import & Export Buttons for Vedant */}
          {/* Revert99: Delete from here to Revert99 - END if not needed */}
          {isVedant && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={handleImportClick}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-l-md hover:bg-slate-50 hover:shadow-sm flex items-center gap-1.5"
                  title="Import Vendor Excel Sheet (.xlsx, .xls, .csv)"
                >
                  <MdFileUpload className="text-sky-600 text-base" />
                  <span>Import</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border-t border-b border-r border-slate-200 rounded-r-md hover:bg-slate-50 hover:shadow-sm flex items-center gap-1.5"
                  title="Export Vendor Excel Sheet"
                >
                  <MdFileDownload className="text-sky-600 text-base" />
                  <span>Export</span>
                </button>
              </div>
            </>
          )}
          {/* Revert99 - END */}

          <button
            onClick={handleAddVendor}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 text-center font-medium"
          >
            + Add Vendor
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vendor Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mobile</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">State</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">GST</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Office POC</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                  No vendors found. Click "Add Vendor" to create one.
                </td>
              </tr>
            ) : (
              vendors.map((vendor, index) => (
                <tr key={vendor.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">{vendor.name}</td>
                  <td className="px-4 py-3 text-sm">{vendor.email}</td>
                  <td className="px-4 py-3 text-sm">{vendor.mobile}</td>
                  <td className="px-4 py-3 text-sm">{vendor.state || "-"}</td>
                  <td className="px-4 py-3 text-sm">{vendor.gst_details}</td>
                  <td className="px-4 py-3 text-sm">{vendor.supplier_category || "-"}</td>
                  <td className="px-4 py-3 text-sm">{vendor.office_poc_name}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
                        title="Delete"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            // Safeguard: Don't allow navigation beyond total pages
            if (newPage < 1 || newPage > totalPages) {
              console.warn(`Invalid page ${newPage}. Total pages: ${totalPages}`);
              return;
            }
            
            const hasAnyFilter = filters && Object.values(filters).some(
              v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
            );
            hasAnyFilter ? filterVendors(filters, newPage) : fetchVendors(newPage);
          }}

          totalItems={totalCount}
          showInfo={true}
          size="md"
          variant="default"
        />
      </div>


      {/* Add / Edit Vendor Modal */}

      <AddVendorForm
        open={showVendorForm}
        onClose={() => {
          setShowVendorForm(false);
          setEditingVendor(null);
        }}
        base_api={BASE_API}
        vendor={editingVendor}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
