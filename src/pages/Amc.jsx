import { useState, useMemo } from "react";
import Base from "../components/Base";
import AmcList from "../components/amc/AmcList";
import ServiceVisitList from "../components/amc/ServiceVisitList";
import PackageList from "../components/amc/PackageList";

export default function AmcPage() {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const [activeTab, setActiveTab] = useState("contracts"); // 'contracts' | 'services' | 'packages'

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  return (
    <Base title="AMC Management">
      <div className="p-4">
        {/* Tab Buttons — matching Inventory.jsx pattern exactly */}
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "contracts" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
            onClick={() => setActiveTab("contracts")}
          >
            AMC Contracts
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "services" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
            onClick={() => setActiveTab("services")}
          >
            Service Visits
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "packages" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
            onClick={() => setActiveTab("packages")}
          >
            Packages
          </button>
        </div>

        {/* Render based on active tab */}
        {activeTab === "contracts" && <AmcList baseApi={baseApi} token={token} />}
        {activeTab === "services" && <ServiceVisitList baseApi={baseApi} token={token} />}
        {activeTab === "packages" && <PackageList baseApi={baseApi} token={token} />}
      </div>
    </Base>
  );
}
