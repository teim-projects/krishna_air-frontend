import React, { useState, useEffect, useMemo, useCallback } from "react";
import Base from "../components/Base";
import Swal from "sweetalert2";
import {
  MdDelete,
  MdAdd,
  MdSecurity,
  MdCheck,
} from "react-icons/md";

const DOCUMENT_TYPES = [
  "All",
  "Purchase Order (PO)",
  "Lead",
  "Customer",
  "Quotation",
  "Invoice",
  "Item Master",
  "High Side",
  "Low Side",
  "Installation Work",
  "Inventory",
  "GRN",
  "Material Issue",
  "Material Return",
  "Delivery Challan",
  "AMC",
  "Service Management",
  "Accounts",
  "Work History",
  "Completed Work",
  "Branch",
  "Site",
  "Role Permissions",
];

const PERMISSION_KEYS = [
  { key: "read_permission", label: "View", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "create_permission", label: "Create", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "write_permission", label: "Edit", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "delete_permission", label: "Delete", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { key: "view_all_permission", label: "View All", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: "modify_all_permission", label: "Modify All", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
];

export default function RolePermissionsManager() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const initialFilters = useMemo(
    () => ({
      search: "",
      document_type: "",
      role: "",
    }),
    []
  );
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // Modal / Edit state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [newDocType, setNewDocType] = useState("Purchase Order (PO)");
  const [newRoleId, setNewRoleId] = useState("");
  
  // Bulk assign state
  const [bulkAssignRole, setBulkAssignRole] = useState("");
  const [bulkAssignPermissions, setBulkAssignPermissions] = useState({});
  const [bulkAssignDocTypes, setBulkAssignDocTypes] = useState(
    DOCUMENT_TYPES.filter((dt) => dt !== "All")
  );
  
  // Copy permissions state
  const [sourceRole, setSourceRole] = useState("");
  const [targetRole, setTargetRole] = useState("");

  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const token =
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // Config for Base FiltersPanel drawer
  const filtersConfig = useMemo(
    () => [
      {
        key: "search",
        type: "search",
        label: "Search",
        placeholder: "Search document type or role...",
      },
      {
        key: "document_type",
        type: "select",
        label: "Document Type",
        placeholder: "All Document Types",
        options: DOCUMENT_TYPES.filter((dt) => dt !== "All").map((dt) => ({
          value: dt,
          label: dt,
        })),
      },
      {
        key: "role",
        type: "select",
        label: "Role",
        placeholder: "All Roles",
        options: roles.map((r) => ({
          value: r.id.toString(),
          label: r.name,
        })),
      },
    ],
    [roles]
  );

  const handleFilterChange = useCallback((filters) => {
    setAppliedFilters(filters);
  }, []);

  // Fetch Roles and Permission rules
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPerms, resRoles] = await Promise.all([
        fetch(`${baseApi}/auth/role-permissions/`, { headers: authHeaders }),
        fetch(`${baseApi}/auth/roles/`, { headers: authHeaders }),
      ]);

      if (resPerms.ok) {
        const permsData = await resPerms.json();
        setPermissions(permsData);
      }
      if (resRoles.ok) {
        const rolesData = await resRoles.json();
        setRoles(rolesData);
        if (rolesData.length > 0 && !newRoleId) {
          setNewRoleId(rolesData[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set admin role as selected after data loads
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      const adminRole = roles.find((role) => role.name.toLowerCase().includes("admin"));
      if (adminRole) {
        setSelectedRole(adminRole);
        setAppliedFilters((prev) => ({ ...prev, role: String(adminRole.id) }));
      }
    }
  }, [roles]);

  // Filter permissions rules
  const filteredPermissions = useMemo(() => {
    return permissions.filter((item) => {
      const search = (appliedFilters.search || "").toLowerCase().trim();
      const docTypeFilter = appliedFilters.document_type || "";
      const roleFilter = appliedFilters.role || "";

      const matchSearch =
        !search ||
        item.document_type.toLowerCase().includes(search) ||
        (item.role_name && item.role_name.toLowerCase().includes(search));

      const matchDoc =
        !docTypeFilter ||
        docTypeFilter === "All" ||
        item.document_type.toLowerCase() === docTypeFilter.toLowerCase();

      const matchRole =
        !roleFilter ||
        roleFilter === "All" ||
        (item.role && item.role.toString() === roleFilter.toString());

      return matchSearch && matchDoc && matchRole;
    });
  }, [permissions, appliedFilters]);

  // Toggle single permission flag
  const handleTogglePermission = async (permId, key, currentValue) => {
    const updatedValue = !currentValue;

    setPermissions((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, [key]: updatedValue } : p))
    );

    if (editingRule && editingRule.id === permId) {
      setEditingRule((prev) => ({ ...prev, [key]: updatedValue }));
    }

    try {
      const res = await fetch(`${baseApi}/auth/role-permissions/${permId}/`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ [key]: updatedValue }),
      });

      if (!res.ok) {
        setPermissions((prev) =>
          prev.map((p) => (p.id === permId ? { ...p, [key]: currentValue } : p))
        );
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Failed to update permission flag.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (err) {
      setPermissions((prev) =>
        prev.map((p) => (p.id === permId ? { ...p, [key]: currentValue } : p))
      );
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Could not connect to server.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  // Delete Rule
  const handleDeleteRule = (permId) => {
    Swal.fire({
      title: "Delete Permission Rule?",
      text: "This will remove the permission entry for this role and document type.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${baseApi}/auth/role-permissions/${permId}/`, {
            method: "DELETE",
            headers: authHeaders,
          });
          if (res.ok) {
            setPermissions((prev) => prev.filter((p) => p.id !== permId));
            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: "Permission rule deleted successfully.",
              timer: 1500,
              showConfirmButton: false,
            });
          } else {
            Swal.fire("Error", "Failed to delete rule", "error");
          }
        } catch (err) {
          Swal.fire("Error", "Network error deleting rule", "error");
        }
      }
    });
  };

  // Add Rule
  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRoleId) {
      Swal.fire("Warning", "Please select a target role", "warning");
      return;
    }

    try {
      const res = await fetch(`${baseApi}/auth/role-permissions/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          document_type: newDocType,
          role: newRoleId,
          read_permission: true,
          write_permission: false,
        }),
      });

      if (res.ok) {
        const createdPerm = await res.json();
        setPermissions((prev) => [createdPerm, ...prev]);
        setShowAddModal(false);
        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "Permission rule created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const data = await res.json();
        Swal.fire("Error", data.detail || JSON.stringify(data), "error");
      }
    } catch (err) {
      Swal.fire("Error", "Failed to add rule", "error");
    }
  };


  // Helper for role badge colors matching site theme
  const getRoleBadgeStyle = (roleName = "") => {
    const name = roleName.toLowerCase();
    if (name.includes("admin")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    if (name.includes("sales")) {
      return "bg-sky-100 text-sky-800 border-sky-200";
    }
    if (name.includes("tech") || name.includes("service")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <Base
      title="Role Permissions"
      filterTitle="Permission Filters"
      filtersConfig={filtersConfig}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      <div className="space-y-6">
        {/* Role Selection Section */}
        <div className="bg-white p-4 rounded-md shadow border border-slate-100">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Select Role to Configure
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role);
                      setAppliedFilters({ ...appliedFilters, role: String(role.id) });
                    }}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                      selectedRole?.id === role.id
                        ? "bg-sky-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <MdAdd className="text-lg" />
                Add Permission
              </button>

            </div>
          </div>
        </div>

        {/* Permission Matrix Header for Selected Role */}
        {selectedRole && (
          <div className="bg-white p-6 rounded-md shadow border border-slate-100">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">
                  Permission Matrix for <span className="text-sky-600 font-bold">{selectedRole.name}</span>
                </h2>
                <p className="text-sm text-slate-600">
                  Toggle module visibility and action permissions. Click Save Changes when complete.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap justify-end w-full lg:w-auto">
                <button
                  onClick={() => {
                    Swal.fire({
                      title: "Grant Full Access?",
                      text: `Give ${selectedRole.name} full permissions for all modules?`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#0284c7",
                      cancelButtonColor: "#64748b",
                      confirmButtonText: "Yes, Grant Full Access",
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        Swal.fire({
                          title: "Granting Access...",
                          html: "This may take a moment.",
                          icon: "info",
                          allowOutsideClick: false,
                          allowEscapeKey: false,
                          didOpen: () => Swal.showLoading(),
                        });
                        
                        try {
                          const rolePerms = permissions.filter(p => p.role === selectedRole.id);
                          let successCount = 0;
                          
                          for (const perm of rolePerms) {
                            const permData = {
                              read_permission: true,
                              create_permission: true,
                              write_permission: true,
                              delete_permission: true,
                              import_permission: true,
                              export_permission: true,
                              view_all_permission: true,
                              modify_all_permission: true,
                            };
                            
                            const res = await fetch(`${baseApi}/auth/role-permissions/${perm.id}/`, {
                              method: "PATCH",
                              headers: authHeaders,
                              body: JSON.stringify(permData),
                            });
                            
                            if (res.ok) {
                              successCount++;
                              setPermissions((prev) =>
                                prev.map((p) => (p.id === perm.id ? { ...p, ...permData } : p))
                              );
                            }
                          }
                          
                          Swal.close();
                          Swal.fire({
                            icon: "success",
                            title: "Full Access Granted",
                            text: `${successCount} permission(s) updated for ${selectedRole.name}.`,
                            timer: 1500,
                            showConfirmButton: false,
                          });
                        } catch (err) {
                          Swal.close();
                          Swal.fire("Error", "Failed to grant full access", "error");
                        }
                      }
                    });
                  }}
                  className="px-4 py-2 rounded-md text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                >
                  Grant Full Access
                </button>
                <button
                  onClick={() => {
                    Swal.fire({
                      title: "Read Only Access?",
                      text: `Set ${selectedRole.name} to read-only for all modules?`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#0284c7",
                      cancelButtonColor: "#64748b",
                      confirmButtonText: "Yes, Set Read Only",
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        Swal.fire({
                          title: "Setting Access...",
                          html: "This may take a moment.",
                          icon: "info",
                          allowOutsideClick: false,
                          allowEscapeKey: false,
                          didOpen: () => Swal.showLoading(),
                        });
                        
                        try {
                          const rolePerms = permissions.filter(p => p.role === selectedRole.id);
                          let successCount = 0;
                          
                          for (const perm of rolePerms) {
                            const permData = {
                              read_permission: true,
                              create_permission: false,
                              write_permission: false,
                              delete_permission: false,
                              import_permission: false,
                              export_permission: false,
                              view_all_permission: false,
                              modify_all_permission: false,
                            };
                            
                            const res = await fetch(`${baseApi}/auth/role-permissions/${perm.id}/`, {
                              method: "PATCH",
                              headers: authHeaders,
                              body: JSON.stringify(permData),
                            });
                            
                            if (res.ok) {
                              successCount++;
                              setPermissions((prev) =>
                                prev.map((p) => (p.id === perm.id ? { ...p, ...permData } : p))
                              );
                            }
                          }
                          
                          Swal.close();
                          Swal.fire({
                            icon: "success",
                            title: "Read-Only Access Set",
                            text: `${successCount} permission(s) updated for ${selectedRole.name}.`,
                            timer: 1500,
                            showConfirmButton: false,
                          });
                        } catch (err) {
                          Swal.close();
                          Swal.fire("Error", "Failed to set read-only access", "error");
                        }
                      }
                    });
                  }}
                  className="px-4 py-2 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                >
                  Read Only Access
                </button>
                <button
                  onClick={() => {
                    Swal.fire({
                      title: "Clear All Access?",
                      text: `Remove all permissions for ${selectedRole.name}?`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#ef4444",
                      cancelButtonColor: "#64748b",
                      confirmButtonText: "Yes, Clear All",
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        Swal.fire({
                          title: "Clearing Access...",
                          html: "This may take a moment.",
                          icon: "info",
                          allowOutsideClick: false,
                          allowEscapeKey: false,
                          didOpen: () => Swal.showLoading(),
                        });
                        
                        try {
                          const rolePerms = permissions.filter(p => p.role === selectedRole.id);
                          let successCount = 0;
                          
                          for (const perm of rolePerms) {
                            const permData = {
                              read_permission: false,
                              create_permission: false,
                              write_permission: false,
                              delete_permission: false,
                              import_permission: false,
                              export_permission: false,
                              view_all_permission: false,
                              modify_all_permission: false,
                            };
                            
                            const res = await fetch(`${baseApi}/auth/role-permissions/${perm.id}/`, {
                              method: "PATCH",
                              headers: authHeaders,
                              body: JSON.stringify(permData),
                            });
                            
                            if (res.ok) {
                              successCount++;
                              setPermissions((prev) =>
                                prev.map((p) => (p.id === perm.id ? { ...p, ...permData } : p))
                              );
                            }
                          }
                          
                          Swal.close();
                          Swal.fire({
                            icon: "success",
                            title: "Access Cleared",
                            text: `${successCount} permission(s) cleared for ${selectedRole.name}.`,
                            timer: 1500,
                            showConfirmButton: false,
                          });
                        } catch (err) {
                          Swal.close();
                          Swal.fire("Error", "Failed to clear access", "error");
                        }
                      }
                    });
                  }}
                  className="px-4 py-2 rounded-md text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
                >
                  Clear All Access
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table — matches AMC / Invoices page table */}
        <div className="bg-white rounded-md shadow overflow-x-auto border border-slate-100">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-16">
                  Sr.No
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-44">
                  Document Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Active Permissions
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-24">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading permissions...
                  </td>
                </tr>
              ) : filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                    <MdSecurity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    No permission rules found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPermissions.map((perm, index) => (
                  <tr
                    key={perm.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                      {perm.document_type}
                    </td>

                    {/* Permissions Badges */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {PERMISSION_KEYS.map(({ key, label, color }) => {
                          const isChecked = !!perm[key];
                          return (
                            <button
                              key={key}
                              onClick={() =>
                                handleTogglePermission(perm.id, key, perm[key])
                              }
                              className={`px-3 py-1.5 text-xs font-medium rounded border transition cursor-pointer flex items-center gap-1 ${isChecked
                                ? `${color} shadow-2xs`
                                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                }`}
                              title={`Click to toggle ${label}`}
                            >
                              {isChecked && <MdCheck className="text-xs" />}
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Action Buttons — Delete only */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteRule(perm.id)}
                          className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 transition"
                          title="Delete Rule"
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
        </div>
      </div>

      {/* Create Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Add Single Permission
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Document Type
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
                >
                  {DOCUMENT_TYPES.filter((dt) => dt !== "All").map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Target Role
                </label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Base>
  );
}