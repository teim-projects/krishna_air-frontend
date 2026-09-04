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
  { key: "message_templates", label: "Message Templates", icon: TemplateIcon, path: "/message-templates", docType: null },
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
    const roleName = userRole?.name?.toLowerCase();
    if (roleName === 'technician') {
      return [
        { key: "home", label: "Dashboard", icon: HomeIcon, path: "/dashboard", docType: null },
        { key: "work_list", label: "Work List", icon: ListIcon, path: "/accounts?tab=work_history", docType: "Work History" },
        { key: "completed_work_list", label: "Completed Work List", icon: CheckIcon, path: "/accounts?tab=completed_work", docType: "Completed Work" },
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
    const mainSection = [];
    const salesSection = [];
    const opsSection = [];
    const adminSection = [];
    const systemSection = [];
    
    filteredItems.forEach(item => {
      if (item.key === "home" || item.key === "leads" || item.key === "contacts" || item.key === "work_list" || item.key === "completed_work_list") {
        mainSection.push(item);
      } else if (item.key === "quotes" || item.key === "invoices" || item.key === "amc") {
        salesSection.push(item);
      } else if (item.key === "accounts" || item.key === "item_master" || item.key === "inventory") {
        opsSection.push(item);
      } else if (item.key === "role_permissions") {
        adminSection.push(item);
      } else if (item.key === "message_templates") {
        systemSection.push(item);
      } else {
        mainSection.push(item);
      }
    });

    return [
      { title: "Core CRM", items: mainSection },
      { title: "Sales & Billing", items: salesSection },
      { title: "Operations", items: opsSection },
      { title: "Administration", items: adminSection },
      { title: "System", items: systemSection }
    ].filter(sec => sec.items.length > 0);
  }, [filteredItems]);

  return (
    <aside className="w-full bg-gradient-to-b from-white to-slate-50/50 border-r border-slate-100 min-h-screen py-6 px-4 flex flex-col justify-between overflow-y-auto">
      <nav className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1 block">
              {section.title}
            </span>
            <div className="flex flex-col">
              {section.items.map((it) => (
                <SidebarItem key={it.key} item={it} active={isActive(it.path, currentPath)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="pt-4 border-t border-slate-100 mt-6 px-3 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          System Status
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">Online</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}

function isActive(itemPath, currentPath) {
  if (!itemPath) return false;
  return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
}

function SidebarItem({ item, active }) {
  const base =
    "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 select-none relative mb-1 text-sm font-medium";
  const activeClass = "text-sky-600 bg-sky-50/70 font-semibold";
  const inactiveClass = "text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 hover:translate-x-1";
  const iconColor = active ? "text-sky-500" : "text-slate-400 group-hover:text-slate-600";

  return (
    <Link
      to={item.path || "#"}
      className={`${base} ${active ? activeClass : inactiveClass}`}
      aria-current={active ? "page" : undefined}
    >
      {/* Active Indicator Line */}
      {active && (
        <span className="absolute left-0 w-1 h-5 bg-sky-500 rounded-r-full" />
      )}

      <span className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${iconColor}`}>
        <item.icon className="w-5 h-5" />
      </span>

      <span className="flex-1">{item.label}</span>
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

