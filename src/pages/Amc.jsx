import { useState, useMemo } from "react";
import Base from "../components/Base";
import AmcList from "../components/amc/AmcList";
import ServiceManagementList from "../components/amc/ServiceManagementList";
import { useUserRole } from "../hooks/useAuth";

export default function AmcPage() {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const [activeTab, setActiveTab] = useState("contracts");
  const [filters, setFilters] = useState({});

  const { isAdmin, hasPermission, hasAnyPermission } = useUserRole(baseApi);

  const { canAccessAMC, canAccessServiceMgmt } = useMemo(() => {
    const amc = isAdmin || hasAnyPermission('AMC');
    return {
      canAccessAMC:         amc,
      canAccessServiceMgmt: isAdmin || amc || hasAnyPermission('Service Management'),
    };
  }, [isAdmin, hasAnyPermission]);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  const filtersConfigMap = {
    contracts: [
      { key: "search", label: "Search", type: "search", placeholder: "Search by contract no, customer name..." }
    ],
    management: [
      { key: "search", label: "Search", type: "search", placeholder: "Search by customer name, contact..." }
    ]
  };

  const filterTitleMap = {
    contracts: "AMC Contract Filters",
    management: "Service Management Filters"
  };

  // Only show tabs the user has access to
  const tabs = [
    ...(canAccessAMC         ? [{ key: "contracts",  label: "AMC Contracts"      }] : []),
    ...(canAccessServiceMgmt ? [{ key: "management", label: "Service Management" }] : []),
  ];

  return (
    <Base
      title="AMC Management"
      filterTitle={filterTitleMap[activeTab] || "Filters"}
      filtersConfig={filtersConfigMap[activeTab] || null}
      initialFilterValues={filters}
      onFiltersChange={setFilters}
    >
      <div className="p-4">
        <div className="flex gap-2 sm:gap-3 mb-4 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap flex-nowrap sm:flex-wrap">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`flex-shrink-0 px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              onClick={() => { setActiveTab(key); setFilters({}); }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "contracts"  && canAccessAMC         && <AmcList baseApi={baseApi} token={token} filters={filters} />}
        {activeTab === "management" && canAccessServiceMgmt  && <ServiceManagementList baseApi={baseApi} token={token} filters={filters} />}
      </div>
    </Base>
  );
}
