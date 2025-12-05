
import React from "react";
import Base from "../components/Base";

const dashboardFilters = [
  { key: "search", type: "search", label: "Search", placeholder: "Search name, email, mobile..." },
  { key: "date", type: "daterange", label: "Date Range" },
  {
    key: "category",
    type: "select",
    label: "Category",
    placeholder: "Choose category",
    options: [
      { value: "leads", label: "Leads" },
      { value: "accounts", label: "Accounts" },
      { value: "products", label: "Products" },
    ],
  },
];

export default function Dashboard() {
  const initialFilters = React.useMemo(() => ({ q: "" }), []);

  // stable callback
  const handleFilterChange = React.useCallback((filters) => {
    console.log("Dashboard filters:", filters);
    // fetch or dispatch events here
  }, []);

  return (
    <Base
      title="Dashboard Overview"
      filtersConfig={dashboardFilters}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      {/* === Page Body (children) === */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white shadow rounded-md">Total Leads</div>
          <div className="p-4 bg-white shadow rounded-md">Total Accounts</div>
          <div className="p-4 bg-white shadow rounded-md">Upcoming Tasks</div>
        </div>

        <div className="bg-white p-6 rounded-md shadow">
          <p className="text-slate-600">
            Use the filter button (top-right) to open the left filter panel. On larger screens the main content will shift right so the panel is visible alongside content.
          </p>
        </div>

        {/* Add more dashboard widgets, charts, tables here */}
      </div>
    </Base>
  );
}
