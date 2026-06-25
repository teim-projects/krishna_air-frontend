import { useState, useMemo } from "react";
import Base from "../components/Base";
import AmcList from "../components/amc/AmcList";
import ServiceVisitList from "../components/amc/ServiceVisitList";
import PackageList from "../components/amc/PackageList";
import AmcInvoiceList from "../components/amc/AmcInvoiceList";

export default function AmcPage() {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const [activeTab, setActiveTab] = useState("contracts"); // 'contracts' | 'services' | 'packages' | 'invoices'
  const [filters, setFilters] = useState({});

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  // ─── Filter configs per tab ────────────────────────────────────────────────
  const filtersConfigMap = {
    contracts: [
      { key: "search", label: "Search", type: "search", placeholder: "Search by contract no, customer name..." }
    ],
    services: [
      { key: "search", label: "Search", type: "search", placeholder: "Search by contract, engineer, customer..." }
    ],
    packages: [
      { key: "search", label: "Search", type: "search", placeholder: "Search by package name, type..." }
    ],
    invoices: [
      { key: "search", label: "Search", type: "search", placeholder: "Search invoices..." }
    ]
  };

  const filterTitleMap = {
    contracts: "AMC Contract Filters",
    services:  "Service Visit Filters",
    packages:  "Package Filters",
    invoices:  "Invoice Filters"
  };

  const tabs = [
    { key: "contracts", label: "AMC Contracts" },
    { key: "services",  label: "Service Visits" },
    { key: "invoices",  label: "Invoices" },
    { key: "packages",  label: "Packages" },
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
        {/* Tab Buttons */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
              onClick={() => { setActiveTab(key); setFilters({}); }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Render based on active tab */}
        {activeTab === "contracts" && <AmcList      baseApi={baseApi} token={token} filters={filters} />}
        {activeTab === "services"  && <ServiceVisitList baseApi={baseApi} token={token} filters={filters} />}
        {activeTab === "packages"  && <PackageList  baseApi={baseApi} token={token} filters={filters} />}
        {activeTab === "invoices"  && <AmcInvoiceList baseApi={baseApi} token={token} filters={filters} />}
      </div>
    </Base>
  );
}
