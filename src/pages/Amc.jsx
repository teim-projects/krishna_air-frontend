import { useState, useMemo } from "react";
import Base from "../components/Base";
import AmcList from "../components/amc/AmcList";
import ServiceVisitList from "../components/amc/ServiceVisitList";
import PackageList from "../components/amc/PackageList";

export default function AmcPage() {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const [activeTab, setActiveTab] = useState("contracts"); // 'contracts' | 'services' | 'packages'
  const [filters, setFilters] = useState({});

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  // ─── Filter configs per tab (reusing Inventory.jsx pattern) ────────────────
  const contractsFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by contract no, customer name..." }
  ];

  const servicesFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by contract, engineer, date..." }
  ];

  const packagesFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by package name, type..." }
  ];

  const handleFilterChange = (vals) => {
    setFilters(vals);
  };

  return (
    <Base
      title="AMC Management"
      filterTitle={
        activeTab === "contracts" ? "AMC Contract Filters" :
          activeTab === "services" ? "Service Visit Filters" :
            activeTab === "packages" ? "Package Filters" :
              "Filters"
      }
      filtersConfig={
        activeTab === "contracts" ? contractsFiltersConfig :
          activeTab === "services" ? servicesFiltersConfig :
            activeTab === "packages" ? packagesFiltersConfig :
              null
      }
      initialFilterValues={filters}
      onFiltersChange={handleFilterChange}
    >
      <div className="p-4">
        {/* Tab Buttons — matching Inventory.jsx pattern exactly */}
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "contracts" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
            onClick={() => { setActiveTab("contracts"); setFilters({}); }}
          >
            AMC Contracts
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "services" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
            onClick={() => { setActiveTab("services"); setFilters({}); }}
          >
            Service Visits
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "packages" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
            onClick={() => { setActiveTab("packages"); setFilters({}); }}
          >
            Packages
          </button>
        </div>

        {/* Render based on active tab */}
        {activeTab === "contracts" && <AmcList baseApi={baseApi} token={token} filters={filters} />}
        {activeTab === "services" && <ServiceVisitList baseApi={baseApi} token={token} filters={filters} />}
        {activeTab === "packages" && <PackageList baseApi={baseApi} token={token} filters={filters} />}
      </div>
    </Base>
  );
}
