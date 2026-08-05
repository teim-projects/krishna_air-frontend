// Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "../hooks/useAuth";

/* ----------------------
   1. Define items (moved inside component setup scope for clarity/safety)
   ---------------------- */
const allItems = [
  { key: "home", label: "Home", icon: HomeIcon, path: "/dashboard", docType: null },
  { key: "leads", label: "Enquiries", icon: TargetIcon, path: "/leads", docType: "Lead" },
  { key: "contacts", label: "Contacts", icon: UserIcon, path: "/customer", docType: "Customer" },
  { key: "accounts", label: "Accounts", icon: BuildingIcon, path: "/accounts", docType: "Accounts" },
  { key: "quotes", label: "Quotes", icon: QuoteIcon, path: "/quotation", docType: "Quotation" },
  { key: "invoices", label: "Invoices", icon: InvoiceIcon, path: "/invoice", docType: "Invoice" },
  { key: "item_master", label: "Item Master", icon: BoxIcon, path: "/item_master", docType: "Item Master" },
  { key: "inventory", label: "Inventory", icon: InventoryIcon, path: "/inventory", docType: "Inventory" },
  { key: "amc", label: "AMC", icon: AmcIcon, path: "/amc", docType: "AMC" },
  { key: "role_permissions", label: "Role Permissions", icon: ShieldIcon, path: "/role-permissions", docType: "Role Permissions" },
];

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const baseApi = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

  const { userRole, isAdmin, hasPermission, hasAnyPermission, isLoading: loadingRole } = useUserRole(baseApi);

  // Listen for permission updates and force re-render
  const [, setPermissionUpdateCounter] = React.useState(0);
  React.useEffect(() => {
    const handlePermissionsUpdated = () => {
      setPermissionUpdateCounter(prev => prev + 1);
    };
    
    window.addEventListener("permissionsUpdated", handlePermissionsUpdated);
    return () => {
      window.removeEventListener("permissionsUpdated", handlePermissionsUpdated);
    };
  }, []);

  const filteredItems = React.useMemo(() => {
    // While refreshing auth, keep showing cached permissions (already in state from localStorage).
    return allItems.filter(item => {
      // 1. Home (no docType) is always visible
      if (!item.docType) {
        return true;
      }

      // 2. Role Permissions is admin only
      if (item.key === "role_permissions") {
        return isAdmin;
      }

      // 3. Admin has 100% full access to all sidebar items
      if (isAdmin) {
        return true;
      }

      // 4. Non-admin staff: check if they have ANY permission (read, create, write, or delete)
      return hasAnyPermission(item.docType);
    });
  }, [userRole, isAdmin, hasAnyPermission]);


  return (
    <aside className="w-55 bg-white border-r border-slate-100 min-h-screen px-3 py-4">
      <nav className="space-y-1">
        {/* 4. ✅ Render the filtered items */}
        {filteredItems.map((it) => (
          <SidebarItem key={it.key} item={it} active={isActive(it.path, currentPath)} />
        ))}
      </nav>
    </aside>
  );
}

function isActive(itemPath, currentPath) {
  if (!itemPath) return false;
  // exact match or startsWith (for nested routes)
  return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
}

function SidebarItem({ item, active }) {
  const base =
    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 select-none";
  const textClass = active ? "text-sky-700 font-bold " : "text-sm text-slate-700 font-medium";
  const iconColor = active ? "text-sky-700" : "text-slate-400";

  return (
    <Link
      to={item.path || "#"}
      className={`${active ? "bg-sky-100" : "hover:bg-sky-50"} ${base}`}
      aria-current={active ? "page" : undefined}
    >
      <span className={`flex-shrink-0 ${iconColor}`}>
        <item.icon className="w-5 h-5" />
      </span>

      <span className={`${textClass} flex-1`}>{item.label}</span>

      {active && (
        <span className="w-6 h-6 flex items-center justify-center rounded-full">
          <svg className="w-4 h-4 text-slate-800" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="19" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </span>
      )}
    </Link>
  );
}

/* ----------------------
   Inline SVG icons (included for completeness)
   ---------------------- */

function HomeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TargetIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 3l-4.35 4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 20a6.5 6.5 0 0113 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function BuildingIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7h.01M16 7h.01M8 11h.01M16 11h.01M8 15h.01M16 15h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function BoxIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M21 16V8a2 2 0 00-1-1.73L13 3.27a2 2 0 00-2 0L4 6.27A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function QuoteIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M9 7h6v6H9zM3 7h6v6H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function InvoiceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7h8M7 11h8M7 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function InventoryIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AmcIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

