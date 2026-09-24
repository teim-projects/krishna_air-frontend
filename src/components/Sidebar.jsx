// Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "../hooks/useAuth";

/* ----------------------
   1. Define items grouped into sections as instructed
   ---------------------- */
const allItems = [
  // OVERVIEW -> Home
  { key: "home", label: "Dashboard", icon: HomeIcon, path: "/dashboard", docType: null, section: "overview" },

  // SALES -> Enquiries, Quotation, Contact, Item Master
  { key: "leads", label: "Lead Management", icon: TargetIcon, path: "/leads", docType: "Lead", section: "sales" },
  { key: "quotes", label: "Quotation", icon: QuoteIcon, path: "/quotation", docType: "Quotation", section: "sales" },
  { key: "contacts", label: "Customer", icon: UserIcon, path: "/customer", docType: "Customer", section: "sales" },
  { key: "item_master", label: "Product Master", icon: BoxIcon, path: "/item_master", docType: "Item Master", section: "sales" },

  // OPERATION -> Invoices, Inventory, AMC
  { key: "invoices", label: "Invoices", icon: InvoiceIcon, path: "/invoice", docType: "Invoice", section: "operation" },
  { key: "inventory", label: "Inventory", icon: InventoryIcon, path: "/inventory", docType: "Inventory", section: "operation" },
  { key: "amc", label: "AMC", icon: AmcIcon, path: "/amc", docType: "AMC", section: "operation" },

  // USER MANAGEMENT -> Account
  { key: "accounts", label: "Account", icon: BuildingIcon, path: "/accounts", docType: "Accounts", section: "user_management" },

  // ADMINISTRATION -> Role Permissions
  { key: "role_permissions", label: "Role Permissions", icon: ShieldIcon, path: "/role-permissions", docType: "Role Permissions", section: "administration" },
  { key: "message_templates", label: "Message Templates", icon: TemplateIcon, path: "/message-templates", docType: null, section: "administration" },
];

const SECTION_CONFIG = [
  { key: "overview", title: "Overview" },
  { key: "sales", title: "Sales" },
  { key: "operation", title: "Operation" },
  { key: "user_management", title: "User Management" },
  { key: "administration", title: "Administration" },
];

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const baseApi = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

  const { userRole, isAdmin, hasAnyPermission } = useUserRole(baseApi);

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
    const roleName = userRole?.name?.toLowerCase();
    if (roleName === 'technician') {
      return [
        { key: "home", label: "Home", icon: HomeIcon, path: "/dashboard", docType: null, section: "overview" },
        { key: "work_list", label: "Work List", icon: ListIcon, path: "/accounts?tab=work_history", docType: "Work History", section: "operation" },
        { key: "completed_work_list", label: "Completed Work List", icon: CheckIcon, path: "/accounts?tab=completed_work", docType: "Completed Work", section: "operation" },
      ].filter(item => !item.docType || hasAnyPermission(item.docType));
    }

    return allItems.filter(item => {
      if (!item.docType) {
        return true;
      }
      if (item.key === "role_permissions") {
        return isAdmin;
      }
      if (isAdmin) {
        return true;
      }
      return hasAnyPermission(item.docType);
    });
  }, [userRole, isAdmin, hasAnyPermission]);

  const sections = React.useMemo(() => {
    return SECTION_CONFIG.map(sec => {
      const items = filteredItems.filter(item => item.section === sec.key);
      return { title: sec.title, items };
    }).filter(sec => sec.items.length > 0);
  }, [filteredItems]);

  return (
    <aside className="w-full h-full bg-white border-r border-slate-200/80 pt-4 pb-2 px-3 flex flex-col overflow-hidden select-none">
      <nav className="flex flex-col gap-3.5 overflow-hidden flex-1">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-extrabold text-[#8e9ab0] uppercase tracking-wider px-3 mb-1 block">
              {section.title}
            </span>
            <div className="flex flex-col gap-0.5">
              {section.items.map((it) => (
                <SidebarItem key={it.key} item={it} active={isActive(it.path, currentPath)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function isActive(itemPath, currentPath) {
  if (!itemPath) return false;
  return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
}

function SidebarItem({ item, active }) {
  const base =
    "group flex items-center gap-3 px-3.5 py-2 rounded-2xl transition-all duration-150 select-none relative text-xs font-semibold";
  const activeClass = "text-[#0088ff] bg-[#f0f7ff] font-bold";
  const inactiveClass = "text-[#334155] hover:bg-slate-50 hover:text-slate-900";
  const iconColor = active ? "text-[#0088ff]" : "text-[#8e9ab0] group-hover:text-slate-700";

  return (
    <Link
      to={item.path || "#"}
      className={`${base} ${active ? activeClass : inactiveClass}`}
      aria-current={active ? "page" : undefined}
    >
      {/* Active Indicator Line */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[5px] h-5 bg-[#0088ff] rounded-r-full" />
      )}

      <span className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-105 ${iconColor}`}>
        <item.icon className="w-4.5 h-4.5" />
      </span>

      <span className="flex-1 truncate">{item.label}</span>
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
function ListIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TemplateIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-3.75-12v.75m0 3v.75m0 3v.75m0 3V18M3 6.75A.75.75 0 013.75 6h6.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-6.5a.75.75 0 01-.75-.75V6.75z" />
    </svg>
  );
}

