/**
 * Dashboard.jsx
 * Tab-based analytics dashboard backed by /dashboard/* endpoints.
 * Styled to match the modern Zoho Analytics BI dashboard visualization
 * based on the reference designs for Customer Management, Follow-up Management,
 * Sales Overview, and Lead Management.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import Chart from "react-apexcharts";
import { useUserRole } from "../hooks/useAuth";
import FunnelChart from "../components/dashboard/FunnelChart";
import {
  RotateCw,
  Maximize2,
  Minimize2,
  Calendar,
  ChevronDown,
  X,
  Search,
  ArrowUpDown,
  MoveDiagonal,
} from "lucide-react";

// ─── constants ────────────────────────────────────────────────────────────────
const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

const TABS = [
  { key: "sales",      label: "Sales Overview" },
  { key: "leads",      label: "Lead Management" },
  { key: "customers",  label: "Customer Managemnet" }, // Matches screenshot spelling
  { key: "followups",  label: "Follow-up Management" },
  { key: "products",   label: "Product & Service Manag..." },
  { key: "quotations", label: "Quotation Management" },
  { key: "invoices",   label: "Invoice Management" },
];

const TAB_ENDPOINT = {
  sales:      "sales-overview",
  leads:      "leads",
  customers:  "customers",
  followups:  "followups",
  products:   "products",
  quotations: "quotations",
  invoices:   "invoices",
};

const TAB_PARAMS = {
  sales:      ["date_from", "date_to", "product_names"],
  leads:      ["date_from", "date_to", "lead_status", "lead_type"],
  customers:  ["date_from", "date_to", "product_names"],
  followups:  ["date_from", "date_to", "lead_status"],
  products:   ["product_names"],
  quotations: ["date_from", "date_to", "product_names"],
  invoices:   ["date_from", "date_to", "product_names"],
};

// ─── small helpers ─────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === undefined || n === null) return "0";
  const num = Number(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

function fmtCurrency(n) {
  if (n === undefined || n === null) return "0.00";
  return Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// KPI card with colored border accents, centered values and clean compact typography
function KpiCard({ title, value, isCurrency, borderColor = "border-[#38bdf8]", hasInfo = false }) {
  let displayVal;
  if (isCurrency) {
    displayVal = fmtCurrency(value);
  } else if (value === undefined || value === null) {
    displayVal = "0";
  } else if (typeof value === "string") {
    displayVal = value;
  } else if (typeof value === "number") {
    displayVal = value.toLocaleString();
  } else {
    displayVal = fmtNum(value);
  }

  const strVal = String(displayVal ?? "");
  const len = strVal.length;
  let fontSizeClass = "text-xl sm:text-2xl";
  if (len >= 13) {
    fontSizeClass = "text-xs sm:text-sm md:text-[15px]";
  } else if (len >= 10) {
    fontSizeClass = "text-sm sm:text-base md:text-lg";
  } else if (len >= 6) {
    fontSizeClass = "text-base sm:text-lg md:text-xl";
  } else if (len >= 4) {
    fontSizeClass = "text-lg sm:text-xl md:text-[22px]";
  }

  return (
    <div
      className={`relative bg-white rounded-lg shadow-2xs ${borderColor} border-[1.5px] px-2 sm:px-3 py-2 sm:py-2.5 flex flex-col items-center justify-center text-center hover:shadow-xs transition-all duration-150 min-h-[64px] sm:min-h-[70px] min-w-0 overflow-hidden w-full`}
    >
      <span className="text-[11px] sm:text-xs font-semibold text-slate-600 tracking-normal mb-0.5 line-clamp-1 max-w-full px-1 select-none text-center">
        {title}
      </span>
      <span
        className={`${fontSizeClass} font-bold text-slate-900 tracking-tight my-0 max-w-full truncate px-1 tabular-nums block text-center`}
        title={strVal}
      >
        {displayVal}
      </span>
      {hasInfo && (
        <span
          className="absolute bottom-1 right-1.5 text-slate-400 hover:text-slate-600 text-[10px] select-none cursor-default font-serif"
          title="Info"
        >
          ⓘ
        </span>
      )}
    </div>
  );
}

// Section header with solid banner colors and exactly two action buttons (Sort & Expand) matching reference
// Section header with solid banner colors and exactly two action buttons (Sort & Expand) matching reference
function SectionHeader({
  title,
  color = "#14b8a6",
  actions = true,
  onSort,
  onExpand,
  isExpanded = false,
  sortOrder = null,
  xField = "invoice_date",
}) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    if (!showSortMenu) return;
    const handleClickOutside = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortMenu]);

  const sortOptions = [
    { key: "x_asc",  label: `By ${xField} - Ascending` },
    { key: "x_desc", label: `By ${xField} - Descending` },
    { key: "y_asc",  label: "By Y-Value - Ascending" },
    { key: "y_desc", label: "By Y-Value - Descending" },
  ];

  return (
    <div
      className="px-3.5 sm:px-4 py-2 rounded-t-xl text-white text-xs md:text-sm font-semibold tracking-wide flex items-center justify-between select-none"
      style={{ background: color }}
    >
      <span className="truncate pr-2">{title}</span>
      {actions && (
        <div className="flex items-center gap-0.5 bg-white/20 border border-white/30 rounded-md px-1 py-0.5 shadow-2xs shrink-0">
          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSortMenu((v) => !v);
              }}
              className={`p-1 rounded transition cursor-pointer flex items-center justify-center ${
                sortOrder || showSortMenu ? "bg-white/35 text-white shadow-xs" : "hover:bg-white/25 text-white/90 hover:text-white"
              }`}
              title="Sort"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            {/* Zoho Analytics Sort Dropdown Menu matching screenshot */}
            {showSortMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 px-1 min-w-[215px] text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 select-none">
                  Sort X Axis:
                </div>
                <div className="flex flex-col gap-0.5">
                  {sortOptions.map((opt) => {
                    const isSelected = sortOrder === opt.key;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => {
                          if (onSort) onSort(isSelected ? null : opt.key);
                          setShowSortMenu(false);
                        }}
                        className={`px-2.5 py-1.5 rounded text-[11.5px] cursor-pointer transition select-none flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <span className="text-[10px] ml-1">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpand && onExpand();
            }}
            className="p-1 hover:bg-white/25 text-white/90 hover:text-white rounded transition cursor-pointer flex items-center justify-center"
            title={isExpanded ? "Collapse" : "Expand in half screen"}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <MoveDiagonal className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Context to share isExpanded status with child charts if needed
export const ChartCardContext = React.createContext({ isExpanded: false });

// Helper to apply Zoho Analytics 4-way sorting across datasets
function applyChartSort(data, sortOrder, xKey, yKey) {
  if (!sortOrder || !Array.isArray(data)) return data;
  const sorted = [...data];
  if (sortOrder === "y_desc") {
    return sorted.sort((a, b) => (Number(b[yKey]) || 0) - (Number(a[yKey]) || 0));
  }
  if (sortOrder === "y_asc") {
    return sorted.sort((a, b) => (Number(a[yKey]) || 0) - (Number(b[yKey]) || 0));
  }
  if (sortOrder === "x_asc") {
    return sorted.sort((a, b) =>
      String(a[xKey] ?? "").localeCompare(String(b[xKey] ?? ""), undefined, { numeric: true })
    );
  }
  if (sortOrder === "x_desc") {
    return sorted.sort((a, b) =>
      String(b[xKey] ?? "").localeCompare(String(a[xKey] ?? ""), undefined, { numeric: true })
    );
  }
  return sorted;
}

// Chart card wrapper - expands in HALF SCREEN (58vw x 75vh) and supports Zoho Sort dropdown
function ChartCard({
  title,
  color = "#14b8a6",
  actions = true,
  onSort,
  sortOrder = null,
  xField = "invoice_date",
  children,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={() => setIsExpanded(false)}
        />
      )}
      <div
        className={
          isExpanded
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[18vw] lg:left-[20vw] md:translate-x-0 z-50 w-[94vw] md:w-[78vw] lg:w-[75vw] h-[75vh] min-h-[520px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            : "bg-white rounded-xl shadow-2xs border border-slate-200/80 overflow-hidden flex flex-col"
        }
      >
        <SectionHeader
          title={title}
          color={color}
          actions={actions}
          onSort={onSort}
          sortOrder={sortOrder}
          xField={xField}
          onExpand={() => setIsExpanded((v) => !v)}
          isExpanded={isExpanded}
        />
        <div
          className={`p-3.5 md:p-4 flex-1 flex flex-col min-h-0 ${
            isExpanded ? "overflow-y-auto" : "justify-center"
          }`}
        >
          <ChartCardContext.Provider value={{ isExpanded }}>
            {typeof children === "function" ? children({ isExpanded }) : children}
          </ChartCardContext.Provider>
        </div>
      </div>
    </>
  );
}

// Loading state
function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm gap-2">
      <RotateCw className="w-5 h-5 animate-spin text-blue-600" />
      <span>Loading dashboard data…</span>
    </div>
  );
}

// ─── shared chart defaults ────────────────────────────────────────────────────
const BASE_CHART = {
  toolbar: { show: false },
  zoom:    { enabled: false },
  fontFamily: "inherit",
};
const ZOHO_PALETTE = ["#5b8df6", "#2dd4bf", "#f87171", "#fb923c", "#a855f7", "#06b6d4", "#ec4899", "#10b981", "#facc15"];

// Reusable right-side Checkbox Legend component matching Zoho Analytics screenshot
function CheckboxLegend({
  title,
  items = [],
  disabledKeys = new Set(),
  onToggle,
  onToggleAll,
  isExpanded = false,
}) {
  const allChecked = disabledKeys.size === 0;

  return (
    <div
      className={`flex flex-col gap-1.5 pr-2 text-xs select-none pl-3 border-l border-slate-100 ${
        isExpanded
          ? "min-w-[240px] md:min-w-[290px] max-w-[380px]"
          : "min-w-[145px] max-w-[210px]"
      }`}
    >
      <div
        onClick={() => onToggleAll && onToggleAll()}
        className="flex items-center gap-1.5 font-semibold text-slate-700 pb-1 border-b border-slate-100 cursor-pointer hover:text-slate-900 group"
      >
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => {
            e.stopPropagation();
            onToggleAll && onToggleAll();
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer"
        />
        <span className="text-[11px] text-slate-700 font-semibold lowercase truncate group-hover:text-slate-900">
          {title}
        </span>
      </div>
      <div className={`flex flex-col gap-1.5 pt-0.5 overflow-y-auto ${isExpanded ? "max-h-[460px]" : "max-h-60"}`}>
        {items.map((it, idx) => {
          const key = it.key ?? it.label;
          const isChecked = !disabledKeys.has(key);

          return (
            <div
              key={idx}
              onClick={() => onToggle && onToggle(key)}
              className="flex items-center justify-between gap-2 text-slate-600 text-[11.5px] hover:text-slate-900 group cursor-pointer transition py-0.5"
            >
              <div className="flex items-center gap-1.5 truncate">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggle && onToggle(key);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer shrink-0"
                />
                <span
                  className="w-2.5 h-2.5 rounded-2xs shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: it.color }}
                />
                <span className="truncate capitalize font-normal group-hover:text-slate-900 text-[11px]">
                  {String(it.label).replace(/_/g, " ")}
                </span>
              </div>
              {it.count !== undefined && (
                <span className="text-[11px] text-slate-500 font-medium shrink-0 tabular-nums ml-1">
                  {it.count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Treemap Component for "Revenue by Customer" (Matches reference images) ───
function CustomerTreemap({ data = [], bannerColor = "#f59e0b", title = "Revenue by Customer", legendTitle = "buyer_name" }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (disabledKeys.size > 0) setDisabledKeys(new Set());
  };

  let activeData = data.filter(r => !disabledKeys.has(r.customer));
  activeData = applyChartSort(activeData, sortOrder, "customer", "revenue");

  const treemapSeries = [
    {
      data: activeData.map(r => ({
        x: r.customer,
        y: r.revenue,
      }))
    }
  ];

  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.customer === r.customer);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const treemapOptions = {
    chart: {
      ...BASE_CHART,
      type: "treemap",
      animations: { enabled: true, speed: 350 },
    },
    colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false,
      }
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: "11px", fontWeight: "600", colors: ["#ffffff"] },
      formatter: function(text, op) {
        const val = op.value;
        return [text, Number(val).toFixed(2)];
      },
      offsetY: -2
    },
    tooltip: {
      theme: "light",
      y: { formatter: v => fmtCurrency(v) },
    },
    legend: { show: false },
  };

  const legendItems = data.map((r, i) => ({
    key: r.customer,
    label: r.customer,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title={title}
      color={bannerColor}
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField={legendTitle}
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="treemap"
              height={isExpanded ? 460 : 280}
              options={treemapOptions}
              series={treemapSeries}
            />
          </div>
          <CheckboxLegend
            title={legendTitle}
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Monthly Revenue Trend Chart (SalesTab) ───
function MonthlyRevenueTrendChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.month));
  activeData = applyChartSort(activeData, sortOrder, "month", "revenue");

  const activeMonths = activeData.map(r => r.month);
  const activeRevenues = activeData.map(r => r.revenue);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.month === r.month);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.month,
    label: r.month,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Monthly Revenue Trend"
      color="#00bdae"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="invoice_date"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                plotOptions: { bar: { horizontal: false, distributed: true, borderRadius: 2, columnWidth: "55%" } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: activeMonths,
                  title: { text: "Month & Year ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { style: { fontSize: "10px", colors: "#64748b" } },
                  axisBorder: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: { text: "Revenue Amount ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: { theme: "light", y: { formatter: v => fmtCurrency(v) } },
                legend: { show: false },
              }}
              series={[{ name: "Revenue", data: activeRevenues }]}
            />
          </div>
          <CheckboxLegend
            title="invoice_date"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Invoice vs Quotation Chart (SalesTab) ───
function InvoiceVsQuotationChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = [...data];
  if (sortOrder === "y_desc") {
    activeData.sort((a, b) => ((b.invoice_count || 0) + (b.quotation_count || 0)) - ((a.invoice_count || 0) + (a.quotation_count || 0)));
  } else if (sortOrder === "y_asc") {
    activeData.sort((a, b) => ((a.invoice_count || 0) + (a.quotation_count || 0)) - ((b.invoice_count || 0) + (b.quotation_count || 0)));
  } else if (sortOrder === "x_asc") {
    activeData.sort((a, b) => String(a.month ?? "").localeCompare(String(b.month ?? ""), undefined, { numeric: true }));
  } else if (sortOrder === "x_desc") {
    activeData.sort((a, b) => String(b.month ?? "").localeCompare(String(a.month ?? ""), undefined, { numeric: true }));
  }

  const ivqMonths = activeData.map(r => r.month);
  const series = [];
  const colors = [];
  if (!disabledKeys.has("invoice Count")) {
    series.push({ name: "invoice Count", data: activeData.map(r => r.invoice_count) });
    colors.push("#5b8df6");
  }
  if (!disabledKeys.has("quotation Count")) {
    series.push({ name: "quotation Count", data: activeData.map(r => r.quotation_count) });
    colors.push("#2dd4bf");
  }

  const legendItems = [
    { key: "invoice Count", label: "invoice Count", color: "#5b8df6" },
    { key: "quotation Count", label: "quotation Count", color: "#2dd4bf" },
  ];

  return (
    <ChartCard
      title="Invoice vs Quotation"
      color="#2196f3"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="invoice_date"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: colors.length > 0 ? colors : ["#5b8df6"],
                plotOptions: { bar: { horizontal: false, borderRadius: 2, columnWidth: "50%" } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: ivqMonths,
                  title: { text: "Month & Year ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { style: { fontSize: "10px", colors: "#64748b" } },
                  axisBorder: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: { text: "Count ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                legend: { show: false },
              }}
              series={series}
            />
          </div>
          <CheckboxLegend
            title="Legend"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Monthly Invoice Count Chart (SalesTab) ───
function MonthlyInvoiceCountChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.month));
  activeData = applyChartSort(activeData, sortOrder, "month", "count");

  const activeMonths = activeData.map(r => r.month);
  const activeCounts = activeData.map(r => r.count);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.month === r.month);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.month,
    label: r.month,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Monthly Invoice Count"
      color="#f57c00"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="invoice_date"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                plotOptions: { bar: { horizontal: false, distributed: true, borderRadius: 2, columnWidth: "55%" } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: activeMonths,
                  title: { text: "Month & Year ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { style: { fontSize: "10px", colors: "#64748b" } },
                  axisBorder: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: { text: "Invoice Count ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: { theme: "light" },
                legend: { show: false },
              }}
              series={[{ name: "Invoices", data: activeCounts }]}
            />
          </div>
          <CheckboxLegend
            title="invoice_date"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Lead Source Pie Chart (LeadsTab) ───
function LeadSourcePieChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.source));
  activeData = applyChartSort(activeData, sortOrder, "source", "count");

  const activeSeries = activeData.map(r => r.count);
  const activeLabels = activeData.map(r => r.source);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.source === r.source);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.source,
    label: r.source,
    count: r.count,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Lead Source Distribution"
      color="#e91e63"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="lead_source"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px] flex items-center justify-center">
            <Chart
              type="pie"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "pie", animations: { enabled: true, speed: 350 } },
                labels: activeLabels,
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                dataLabels: {
                  enabled: true,
                  formatter: (val) => `${val.toFixed(1)}%`,
                  style: { fontSize: "10px", fontWeight: "600" },
                  dropShadow: { enabled: false },
                },
                tooltip: { theme: "light" },
                legend: { show: false },
              }}
              series={activeSeries}
            />
          </div>
          <CheckboxLegend
            title="lead_source"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Lead Type Bar Chart (LeadsTab) ───
function LeadTypeBarChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.type));
  activeData = applyChartSort(activeData, sortOrder, "type", "count");

  const activeTypes = activeData.map(r => r.type);
  const activeCounts = activeData.map(r => r.count);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.type === r.type);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.type,
    label: r.type,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Lead Type Distribution"
      color="#f57c00"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="is_service_lead"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                plotOptions: { bar: { horizontal: false, distributed: true, borderRadius: 2, columnWidth: "50%" } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: activeTypes,
                  title: { text: "is_service_lead ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { style: { fontSize: "10px", colors: "#64748b" } },
                  axisBorder: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: { text: "Lead Count ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: { theme: "light" },
                legend: { show: false },
              }}
              series={[{ name: "Count", data: activeCounts }]}
            />
          </div>
          <CheckboxLegend
            title="is_service_lead"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Customer by Month Chart (CustomersTab) ───
function CustomerByMonthChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.month));
  activeData = applyChartSort(activeData, sortOrder, "month", "count");

  const activeMonths = activeData.map(r => r.month);
  const activeCounts = activeData.map(r => r.count);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.month === r.month);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.month,
    label: r.month,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Customer by Month"
      color="#00bdae"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="date"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                plotOptions: { bar: { horizontal: false, distributed: true, borderRadius: 2, columnWidth: "55%" } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: activeMonths,
                  title: { text: "Month&Year of date ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { style: { fontSize: "10px", colors: "#64748b" } },
                  axisBorder: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: { text: "Customer Count ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: { theme: "light" },
                legend: { show: false },
              }}
              series={[{ name: "Customers", data: activeCounts }]}
            />
          </div>
          <CheckboxLegend
            title="date"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Revenue by AC Type Chart (ProductsTab) ───
function RevenueByAcTypeChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.ac_type));
  activeData = applyChartSort(activeData, sortOrder, "ac_type", "revenue");

  const activeCategories = activeData.map(r => r.ac_type);
  const activeRevenues = activeData.map(r => r.revenue);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.ac_type === r.ac_type);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.ac_type,
    label: r.ac_type,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Revenue by AC Type"
      color="#00bdae"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="name"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                plotOptions: {
                  bar: {
                    horizontal: false,
                    distributed: true,
                    borderRadius: 2,
                    columnWidth: "55%",
                  },
                },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: activeCategories,
                  title: { text: "AC Name ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { style: { fontSize: "10px", colors: "#64748b" } },
                  axisBorder: { show: true, color: "#e2e8f0" },
                  axisTicks: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: { text: "Revenue Amount ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: { theme: "light", y: { formatter: v => fmtCurrency(v) } },
                legend: { show: false },
              }}
              series={[{ name: "Revenue", data: activeRevenues }]}
            />
          </div>
          <CheckboxLegend
            title="name"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Top Selling Material Types Chart (ProductsTab) ───
function TopSellingMaterialTypesChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.material_type));
  activeData = applyChartSort(activeData, sortOrder, "material_type", "amount");

  const activeCategories = activeData.map(r => r.material_type);
  const activeAmounts = activeData.map(r => r.amount);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.material_type === r.material_type);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.material_type,
    label: r.material_type,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Top Selling Material Types"
      color="#2196f3"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="name"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                plotOptions: {
                  bar: {
                    horizontal: false,
                    distributed: true,
                    borderRadius: 2,
                    columnWidth: "55%",
                  },
                },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: activeCategories,
                  title: { text: "name ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { style: { fontSize: "10px", colors: "#64748b" } },
                  axisBorder: { show: true, color: "#e2e8f0" },
                  axisTicks: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: { text: "Amount ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: {
                  theme: "light",
                  custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const name = w.globals.categoryLabels[dataPointIndex] || "";
                    const val = series[seriesIndex][dataPointIndex];
                    return `
                      <div class="px-2.5 py-1.5 text-[11px] bg-white border border-slate-200 shadow-md rounded text-slate-800">
                        <div class="font-semibold text-blue-600">name: <span class="text-slate-800">${name}</span></div>
                        <div class="font-medium text-slate-700">Amount: ${fmtCurrency(val)}</div>
                        <div class="text-[10px] text-slate-400 mt-0.5 italic">Click to: View Underlying Data / Drill Down</div>
                      </div>
                    `;
                  },
                },
                legend: { show: false },
              }}
              series={[{ name: "Amount", data: activeAmounts }]}
            />
          </div>
          <CheckboxLegend
            title="name"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Revenue by Product Model Chart (ProductsTab) ───
function RevenueByProductModelChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.model));
  activeData = applyChartSort(activeData, sortOrder, "model", "revenue");

  const activeCategories = activeData.map(r => r.model);
  const activeRevenues = activeData.map(r => r.revenue);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.model === r.model);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.model,
    label: r.model,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Revenue by Product Model"
      color="#e91e63"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="name"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                plotOptions: {
                  bar: {
                    horizontal: false,
                    distributed: true,
                    borderRadius: 2,
                    columnWidth: "55%",
                  },
                },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: activeCategories,
                  title: { text: "Model Name ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: {
                    rotate: -45,
                    rotateAlways: true,
                    style: { fontSize: "10px", colors: "#64748b" },
                    trim: true,
                    maxHeight: 75,
                  },
                  axisBorder: { show: true, color: "#e2e8f0" },
                  axisTicks: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: { text: "Revenue Model ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: { theme: "light", y: { formatter: v => fmtCurrency(v) } },
                legend: { show: false },
              }}
              series={[{ name: "Revenue", data: activeRevenues }]}
            />
          </div>
          <CheckboxLegend
            title="name"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

// ─── Top Product Variants Chart (ProductsTab) ───
function TopProductVariantsChart({ data = [] }) {
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [sortOrder, setSortOrder] = useState(null);

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < data.length - 1) next.add(key);
      return next;
    });
  };
  const toggleAll = () => { if (disabledKeys.size > 0) setDisabledKeys(new Set()); };

  let activeData = data.filter(r => !disabledKeys.has(r.variant));
  activeData = applyChartSort(activeData, sortOrder, "variant", "quantity");

  const activeCategories = activeData.map(r => r.variant);
  const activeQuantities = activeData.map(r => r.quantity);
  const activeColors = activeData.map(r => {
    const idx = data.findIndex(d => d.variant === r.variant);
    return ZOHO_PALETTE[idx % ZOHO_PALETTE.length];
  });

  const legendItems = data.map((r, i) => ({
    key: r.variant,
    label: r.variant,
    color: ZOHO_PALETTE[i % ZOHO_PALETTE.length],
  }));

  return (
    <ChartCard
      title="Top Product Variants"
      color="#f57c00"
      onSort={setSortOrder}
      sortOrder={sortOrder}
      xField="sku"
    >
      {({ isExpanded }) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full h-full">
          <div className="flex-1 w-full h-full min-h-[280px]">
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 350 } },
                colors: activeColors.length > 0 ? activeColors : ZOHO_PALETTE,
                plotOptions: {
                  bar: {
                    horizontal: true,
                    distributed: true,
                    borderRadius: 2,
                    barHeight: "55%",
                  },
                },
                dataLabels: { enabled: false },
                xaxis: {
                  title: { text: "Total quantity ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: {
                    rotate: -45,
                    rotateAlways: true,
                    formatter: v => fmtNum(v),
                    style: { fontSize: "10px", colors: "#64748b" },
                  },
                  axisBorder: { show: true, color: "#e2e8f0" },
                  axisTicks: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  categories: activeCategories,
                  title: { text: "Variant Name ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: {
                    style: { fontSize: "10px", colors: "#64748b" },
                    trim: true,
                    maxWidth: 130,
                  },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: { theme: "light", y: { formatter: v => String(v) } },
                legend: { show: false },
              }}
              series={[{ name: "Quantity", data: activeQuantities }]}
            />
          </div>
          <CheckboxLegend
            title="sku"
            items={legendItems}
            disabledKeys={disabledKeys}
            onToggle={toggleKey}
            onToggleAll={toggleAll}
            isExpanded={isExpanded}
          />
        </div>
      )}
    </ChartCard>
  );
}

function lineOptions(categories, yTitle = "Follow-ups Count", xTitle = "Month & Year") {
  return {
    chart: {
      ...BASE_CHART,
      type: "line",
      animations: { enabled: true, speed: 450 },
    },
    colors: ["#5b8df6"],
    stroke: { curve: "straight", width: 2.5 },
    dataLabels: { enabled: false },
    markers: {
      size: 5,
      colors: ["#ffffff"],
      strokeColors: "#5b8df6",
      strokeWidth: 2.5,
      hover: { size: 7 },
    },
    xaxis: {
      categories,
      title: xTitle ? { text: `${xTitle} ⌄`, style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } } : undefined,
      labels: { style: { fontSize: "10px", colors: "#64748b" } },
      axisBorder: { show: true, color: "#e2e8f0" },
      axisTicks: { show: true, color: "#e2e8f0" },
    },
    yaxis: {
      title: yTitle ? { text: `${yTitle} ⌄`, style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } } : undefined,
      labels: { formatter: (v) => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
    },
    grid: {
      strokeDashArray: 3,
      borderColor: "#f1f5f9",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: "light",
      y: { formatter: (v) => fmtNum(v) },
    },
    legend: { show: false },
  };
}

// ─── TAB VIEWS ────────────────────────────────────────────────────────────────

// 1. Sales Overview (Matches media_1788956366989.jpg & media_1788956366967.jpg)
function SalesTab({ data }) {
  if (!data) return <Loading />;
  const { kpi, monthly_revenue_trend, invoice_vs_quotation, revenue_by_customer, monthly_invoice_count } = data;

  return (
    <div className="space-y-4">
      {/* 5 Centered KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-3.5">
        <KpiCard title="Total Revenue"    value={kpi?.total_revenue}   isCurrency borderColor="border-[#38bdf8]" />
        <KpiCard title="Total Customer"   value={kpi?.total_customer}  borderColor="border-[#38bdf8]" hasInfo />
        <KpiCard title="Total Leads"      value={kpi?.total_leads}     borderColor="border-[#f472b6]" />
        <KpiCard title="Total Invoice"    value={kpi?.total_invoice}   borderColor="border-[#fb923c]" />
        <KpiCard title="Total Quotations" value={kpi?.total_quotation} borderColor="border-[#fb923c]" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top-Left: Monthly Revenue Trend */}
        <MonthlyRevenueTrendChart data={monthly_revenue_trend || []} />

        {/* Top-Right: Invoice vs Quotation Grouped Bar with Actions */}
        <InvoiceVsQuotationChart data={invoice_vs_quotation || []} />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bottom-Left: Revenue by Customer as Treemap with Rose Banner */}
        <CustomerTreemap
          data={revenue_by_customer || []}
          bannerColor="#e91e63"
          title="Revenue by Customer"
          legendTitle="buyer_name"
        />

        {/* Bottom-Right: Monthly Invoice Count with Distributed Bar & Orange Banner */}
        <MonthlyInvoiceCountChart data={monthly_invoice_count || []} />
      </div>
    </div>
  );
}

// 2. Lead Management (Matches media_1788956366976.jpg & media_1788956366984.jpg)
function LeadsTab({ data }) {
  if (!data) return <Loading />;
  const { kpi, monthly_trend, status_distribution, source_distribution, type_distribution } = data;

  const months = monthly_trend?.map(r => r.month) || [];
  const counts = monthly_trend?.map(r => r.count) || [];

  return (
    <div className="space-y-4">
      {/* 5 Centered KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-3.5">
        <KpiCard title="Total Leads"   value={kpi?.total_leads}   borderColor="border-[#38bdf8]" />
        <KpiCard title="Open Leads"    value={kpi?.open_leads}    borderColor="border-[#38bdf8]" />
        <KpiCard title="Closed Leads"  value={kpi?.closed_leads}  borderColor="border-[#f472b6]" />
        <KpiCard title="Sales Lead"    value={kpi?.sales_leads}   borderColor="border-[#fb923c]" />
        <KpiCard title="Service Leads" value={kpi?.service_leads} borderColor="border-[#fb923c]" />
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top-Left: Monthly Lead Trend with Teal Banner */}
        <ChartCard title="Monthly Lead Trend" color="#00bdae">
          {({ isExpanded }) => (
            <Chart
              type="line"
              height={isExpanded ? 460 : 280}
              options={lineOptions(months, "Lead Count", "Month & Year")}
              series={[{ name: "Leads", data: counts }]}
            />
          )}
        </ChartCard>

        {/* Top-Right: Lead Status Distribution as Funnel with Blue Banner */}
        <ChartCard title="Lead Status Distribution" color="#2196f3">
          {({ isExpanded }) => (
            <FunnelChart
              data={status_distribution || []}
              title="status"
              height={isExpanded ? 460 : 280}
              palette={["#5b8df6", "#2dd4bf", "#f87171", "#fb923c"]}
            />
          )}
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bottom-Left: Lead Source Distribution Pie Chart with Rose Banner & Table Legend */}
        <LeadSourcePieChart data={source_distribution || []} />

        {/* Bottom-Right: Lead Type Distribution with Orange Banner & Distributed Bars */}
        <LeadTypeBarChart data={type_distribution || []} />
      </div>
    </div>
  );
}

// 3. Customer Management (Matches media_1788957503995.jpg & media_1788957504000.jpg)
function CustomersTab({ data }) {
  if (!data) return <Loading />;
  const { kpi, revenue_by_customer, customers_by_month, customers_by_quotations } = data;

  const revByCustomer = revenue_by_customer || [];
  const custByMonth   = customers_by_month || [];
  const custByQuot    = customers_by_quotations || [];

  const custByQuotOptions = {
    chart: {
      ...BASE_CHART,
      type: "bar",
      animations: { enabled: true, speed: 400 },
    },
    colors: ["#5b8df6"],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 2,
        columnWidth: "42%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: custByQuot.map(r => r.customer),
      title: {
        text: "Customer Name ⌄",
        style: { fontSize: "11px", fontWeight: 500, color: "#64748b" },
      },
      labels: {
        rotate: -45,
        rotateAlways: true,
        style: { fontSize: "10px", colors: "#64748b" },
        trim: true,
        maxHeight: 80,
      },
      axisBorder: { show: true, color: "#e2e8f0" },
      axisTicks: { show: true, color: "#e2e8f0" },
    },
    yaxis: {
      title: {
        text: "Quotation Count ⌄",
        style: { fontSize: "11px", fontWeight: 500, color: "#64748b" },
      },
      labels: {
        formatter: (v) => fmtNum(v),
        style: { fontSize: "10px", colors: "#64748b" },
      },
    },
    grid: {
      strokeDashArray: 3,
      borderColor: "#f1f5f9",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: { theme: "light" },
    legend: { show: false },
  };

  return (
    <div className="space-y-5">
      {/* 4 Centered KPI Cards matching media_1788957503995.jpg */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3.5">
        <KpiCard title="Total Customers"  value={kpi?.total_customers}  borderColor="border-[#38bdf8]" />
        <KpiCard title="Total Sites"      value={kpi?.total_sites}      borderColor="border-[#38bdf8]" />
        <KpiCard title="Total Quotations" value={kpi?.total_quotations} borderColor="border-[#f472b6]" />
        <KpiCard title="Customer Revenue" value={kpi?.customer_revenue} isCurrency borderColor="border-[#fb923c]" />
      </div>

      {/* Row 1: Revenue by Customer Treemap + Customer by Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top-Left: Revenue by Customer Treemap with Solid Amber Banner */}
        <CustomerTreemap
          data={revByCustomer}
          bannerColor="#f59e0b"
          title="Revenue by Customer"
          legendTitle="buyer_name"
        />

        {/* Top-Right: Customer by Month with Solid Teal Banner & Distributed Bars */}
        <CustomerByMonthChart data={custByMonth || []} />
      </div>

      {/* Row 2: Customers by Quotations (Centered wide card matching media_1788957504000.jpg) */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[780px]">
          <ChartCard title="Customers by Quotations" color="#2196f3">
            {({ isExpanded }) => (
              <Chart
                type="bar"
                height={isExpanded ? 460 : 280}
                options={custByQuotOptions}
                series={[{ name: "Quotations", data: custByQuot.map(r => r.count) }]}
              />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// 4. Follow-up Management (Matches media_1788957503996.jpg)
function FollowupsTab({ data }) {
  if (!data) return <Loading />;
  const { kpi, status_distribution, monthly_followups } = data;

  const months = monthly_followups?.map(r => r.month) || [];
  const counts = monthly_followups?.map(r => r.count) || [];

  return (
    <div className="space-y-4">
      {/* 4 Centered KPI Cards matching media_1788957503996.jpg */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3.5">
        <KpiCard
          title="Total Follow-ups"
          value={kpi?.total_followups}
          borderColor="border-[#38bdf8]"
        />
        <KpiCard
          title="Open Follow-ups"
          value={kpi?.open_followups}
          borderColor="border-[#38bdf8]"
        />
        <KpiCard
          title="Closed Follow-ups"
          value={kpi?.closed_followups}
          borderColor="border-[#f472b6]"
        />
        <KpiCard
          title="In Process Follow-ups"
          value={kpi?.inprocess_followups}
          borderColor="border-[#fb923c]"
        />
      </div>

      {/* 2 Charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Follow-up Status with Amber Header & Inverted Trapezoid Funnel */}
        <ChartCard title="Follow-up Status" color="#f59e0b">
          {({ isExpanded }) => (
            <FunnelChart
              data={status_distribution || []}
              title="status"
              height={isExpanded ? 460 : 280}
              palette={["#5b8df6", "#2dd4bf", "#f87171", "#fb923c"]}
            />
          )}
        </ChartCard>

        {/* Right: Monthly Follow-ups with Teal Header & Line Chart with circular markers */}
        <ChartCard title="Monthly Follow-ups" color="#00bdae">
          {({ isExpanded }) => (
            <Chart
              type="line"
              height={isExpanded ? 460 : 280}
              options={lineOptions(months, "Follow-ups Count", "Month & Year")}
              series={[{ name: "Follow-ups", data: counts }]}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// 5. Product & Service Management
function ProductsTab({ data }) {
  if (!data) return <Loading />;
  const { kpi, revenue_by_ac_type, top_material_types, revenue_by_model, top_variants } = data;

  // Use real data from backend — empty array = no records for current filters
  const acTypeData   = revenue_by_ac_type  || [];
  const materialData = top_material_types  || [];
  const modelData    = revenue_by_model    || [];
  const variantData  = top_variants        || [];

  // KPI values directly from backend — null/undefined shows as 0
  const totalAcTypes    = kpi?.total_ac_types  ?? 0;
  const totalVariants   = kpi?.total_variants  ?? 0;
  const totalUnitSold   = kpi?.total_unit_sold !== undefined && kpi?.total_unit_sold !== null
    ? Number(kpi.total_unit_sold).toFixed(2)
    : "0.00";
  const totalUnitsQuoted = kpi?.units_quoted   ?? 0;
  const productRevenue   = kpi?.product_revenue ?? 0;

  return (
    <div className="space-y-4">
      {/* 5 KPI Cards Strip matching media_1789021028256.jpg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-3.5">
        <KpiCard
          title="Total AC Types"
          value={totalAcTypes}
          borderColor="border-[#38bdf8]"
        />
        <KpiCard
          title="Total Variants"
          value={totalVariants}
          borderColor="border-[#38bdf8]"
        />
        <KpiCard
          title="Total Unit Sold"
          value={totalUnitSold}
          borderColor="border-[#f472b6]"
        />
        <KpiCard
          title="Total Units Quoted"
          value={totalUnitsQuoted}
          borderColor="border-[#fb923c]"
        />
        <KpiCard
          title="Product Revenue"
          value={productRevenue}
          isCurrency
          borderColor="border-[#fb923c]"
        />
      </div>

      {/* 2 × 2 Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Row 1 Left: Revenue by AC Type (Solid Teal #00bdae header) */}
        <RevenueByAcTypeChart data={acTypeData} />

        {/* Row 1 Right: Top Selling Material Types (Solid Blue #2196f3 header) */}
        <TopSellingMaterialTypesChart data={materialData} />

        {/* Row 2 Left: Revenue by Product Model (Solid Rose/Magenta #e91e63 header) */}
        <RevenueByProductModelChart data={modelData} />

        {/* Row 2 Right: Top Product Variants (Solid Orange #f57c00 header & Horizontal Bars) */}
        <TopProductVariantsChart data={variantData} />
      </div>
    </div>
  );
}

// 6. Quotation Management
function QuotationsTab({ data }) {
  if (!data) return <Loading />;
  const { kpi, monthly_trend, customers_by_quotations } = data;

  // Use real data from backend — no fallbacks
  const quotTrend    = monthly_trend            || [];
  const custQuotData = customers_by_quotations  || [];

  const totalQuotations = kpi?.total_quotations ?? 0;
  const totalAmount     = kpi?.total_amount     ?? 0;

  return (
    <div className="space-y-4">
      {/* KPI Cards: Compact width and placed close to each other */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56 sm:w-64">
          <KpiCard
            title="Total Quotations"
            value={totalQuotations}
            borderColor="border-[#38bdf8]"
          />
        </div>
        <div className="w-56 sm:w-64">
          <KpiCard
            title="Total Quotation Amount"
            value={totalAmount}
            isCurrency
            borderColor="border-[#fb923c]"
          />
        </div>
      </div>

      {/* 2 Charts 1:1 Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Monthly Quotation Trend (Solid Rose/Magenta #e91e63 header) */}
        <ChartCard title="Monthly Quotation Trend" color="#e91e63">
          {({ isExpanded }) => (
            <Chart
              type="line"
              height={isExpanded ? 460 : 280}
              options={{
                ...lineOptions(quotTrend.map(r => r.month), "Quotation Amount", "Month&Year of created_at"),
                tooltip: { theme: "light", y: { formatter: v => fmtCurrency(v) } },
              }}
              series={[{ name: "Amount", data: quotTrend.map(r => r.amount) }]}
            />
          )}
        </ChartCard>

        {/* Right: Customers by Quotations (Solid Orange #f57c00 header & Uniform Blue Bars) */}
        <ChartCard title="Customers by Quotations" color="#f57c00">
          {({ isExpanded }) => (
            <Chart
              type="bar"
              height={isExpanded ? 460 : 280}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 400 } },
                colors: ["#5b8df6"],
                plotOptions: {
                  bar: {
                    horizontal: false,
                    borderRadius: 2,
                    columnWidth: "45%",
                  },
                },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: custQuotData.map(r => r.customer),
                  title: {
                    text: "Customer Name ⌄",
                    style: { fontSize: "11px", fontWeight: 500, color: "#64748b" },
                  },
                  labels: {
                    rotate: -45,
                    rotateAlways: true,
                    style: { fontSize: "10px", colors: "#64748b" },
                    trim: true,
                    maxHeight: 80,
                  },
                  axisBorder: { show: true, color: "#e2e8f0" },
                  axisTicks: { show: true, color: "#e2e8f0" },
                },
                yaxis: {
                  title: {
                    text: "Quotation Count ⌄",
                    style: { fontSize: "11px", fontWeight: 500, color: "#64748b" },
                  },
                  labels: {
                    formatter: v => fmtNum(v),
                    style: { fontSize: "10px", colors: "#64748b" },
                  },
                },
                grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
                tooltip: { theme: "light" },
                legend: { show: false },
              }}
              series={[{ name: "Count", data: custQuotData.map(r => r.count) }]}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// 7. Invoice Management
function InvoicesTab({ data }) {
  if (!data) return <Loading />;
  const { kpi, revenue_by_customer, invoice_count_by_month, monthly_revenue } = data;

  const revByCustomer = revenue_by_customer || [];
  const monthlyCount  = invoice_count_by_month || [];
  const monthlyRev    = monthly_revenue || [];

  return (
    <div className="space-y-4">
      {/* KPI Cards: Compact width and placed close to each other */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56 sm:w-64">
          <KpiCard title="Total Invoices"       value={kpi?.total_invoice} borderColor="border-[#38bdf8]" />
        </div>
        <div className="w-56 sm:w-64">
          <KpiCard title="Total Invoice Amount" value={kpi?.total_amount}  isCurrency borderColor="border-[#fb923c]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CustomerTreemap
          data={revByCustomer}
          bannerColor="#e91e63"
          title="Revenue by Customer"
          legendTitle="buyer_name"
        />

        <ChartCard title="Invoice Count by Month" color="#f57c00">
          {({ isExpanded }) => (
            <Chart
              type="line"
              height={isExpanded ? 460 : 280}
              options={lineOptions(monthlyCount.map(r => r.month), "Invoice Count", "Month & Year")}
              series={[{ name: "Count", data: monthlyCount.map(r => r.count) }]}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="Monthly Invoice Revenue" color="#3b82f6">
          {({ isExpanded }) => (
            <Chart
              type="bar"
              height={isExpanded ? 460 : 260}
              options={{
                chart: { ...BASE_CHART, type: "bar", animations: { enabled: true, speed: 400 } },
                colors: ["#5b8df6"],
                plotOptions: { bar: { horizontal: false, borderRadius: 2, columnWidth: "40%" } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: monthlyRev.map(r => r.month),
                  title: { text: "Month & Year ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                  labels: { style: { fontSize: "10px", colors: "#64748b" } },
                axisBorder: { show: true, color: "#e2e8f0" },
              },
              yaxis: {
                title: { text: "Revenue ⌄", style: { fontSize: "11px", fontWeight: 500, color: "#64748b" } },
                labels: { formatter: v => fmtNum(v), style: { fontSize: "10px", colors: "#64748b" } },
              },
              grid: { strokeDashArray: 3, borderColor: "#f1f5f9" },
              tooltip: { theme: "light", y: { formatter: v => fmtCurrency(v) } },
              legend: { show: false },
            }}
            series={[{ name: "Revenue", data: monthlyRev.map(r => r.revenue) }]}
          />
        )}
      </ChartCard>
      </div>
    </div>
  );
}

// ─── Technician dashboard ─────────────────────────────────────────────────────
function TechnicianDashboard({ userRole, baseApi }) {
  const [techStats, setTechStats] = useState({ pending: 0, completed: 0 });

  useEffect(() => {
    const token = localStorage.getItem("access") || localStorage.getItem("token") || "";
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch(`${baseApi}/amc/technician-work-records/`, { headers }),
      fetch(`${baseApi}/amc/completed-work/`, { headers }),
    ])
      .then(async ([r1, r2]) => {
        const d1 = await r1.json();
        const d2 = await r2.json();
        const pending   = Array.isArray(d1.results) ? d1.results.length : (Array.isArray(d1) ? d1.length : 0);
        const completed = Array.isArray(d2) ? d2.length : 0;
        setTechStats({ pending, completed });
      })
      .catch(() => {});
  }, [baseApi]);

  const totalJobs = techStats.pending + techStats.completed;
  const rate = totalJobs > 0 ? Math.round((techStats.completed / totalJobs) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-xl text-white shadow-sm">
        <h2 className="text-xl font-bold">Welcome back, {userRole?.full_name || userRole?.name || "Technician"}!</h2>
        <p className="text-sm opacity-85">Overview of assigned and completed jobs.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Assigned Work" value={techStats.pending} borderColor="border-[#38bdf8]" />
        <KpiCard title="Completed Work" value={techStats.completed} borderColor="border-[#38bdf8]" />
        <div className="bg-white rounded-xl p-5 shadow-2xs border-2 border-[#f472b6] flex flex-col justify-center gap-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Progress Rate</span><span>{rate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${rate}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Total: {totalJobs}</span><span>Done: {techStats.completed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FILTER COMPONENTS ────────────────────────────────────────────────────────

function CheckboxDropdown({ label, options, selected, onApply }) {
  const [open, setOpen]         = useState(false);
  const [draft, setDraft]       = useState(selected);
  const [search, setSearch]     = useState("");
  const ref                     = useRef(null);

  useEffect(() => { setDraft(selected); }, [selected]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const allSelected = draft.length === 0 || draft.length === options.length;
  const filtered    = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    if (allSelected) {
      setDraft([]);
    } else {
      setDraft(options.map(o => o.value));
    }
  };
  const toggleOne = (val) => setDraft(prev =>
    prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
  );

  const handleOK = () => {
    onApply(draft.length === options.length ? [] : draft);
    setOpen(false);
  };
  const handleClear = () => { setDraft([]); };

  const triggerLabel = allSelected ? "All" : draft.length === 1
    ? options.find(o => o.value === draft[0])?.label || draft[0]
    : `${draft.length} selected`;

  return (
    <div className="relative flex items-center gap-1.5" ref={ref}>
      <label className="text-slate-600 text-[11.5px] font-medium whitespace-nowrap">{label}</label>
      <button
        type="button"
        onClick={() => { setSearch(""); setOpen(v => !v); }}
        className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs min-w-[84px] justify-between transition"
      >
        <span className="truncate max-w-[100px]">{triggerLabel}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl w-52 py-1"
          style={{ minWidth: "190px" }}
        >
          {options.length > 5 && (
            <div className="px-2 py-1 border-b border-slate-100">
              <div className="flex items-center border border-slate-300 rounded px-2 py-0.5 bg-white">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-xs outline-none bg-transparent"
                />
                <Search className="w-3 h-3 text-slate-400 shrink-0" />
              </div>
            </div>
          )}

          <div className="px-3 py-1.5 border-b border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
              />
              All
            </label>
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map(opt => (
              <div key={opt.value} className="px-3 py-1.5 hover:bg-slate-50">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.includes(opt.value)}
                    onChange={() => toggleOne(opt.value)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                  />
                  <span className="truncate capitalize">{opt.label}</span>
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-100 mt-1">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleOK}
              className="text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold px-3 py-1 rounded shadow-2xs cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function miniCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toYMD(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function formatDisplay(dateStr) {
  if (!dateStr) return "";
  const d = parseYMD(dateStr);
  if (!d) return dateStr;
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function MiniCalendar({ title, value, min, max, onSelect }) {
  const today = new Date();
  const init = value ? parseYMD(value) : null;
  const [view, setView] = useState({ year: init?.getFullYear() ?? today.getFullYear(), month: init?.getMonth() ?? today.getMonth() });

  const days = miniCalendarDays(view.year, view.month);

  const prevMonth = () => setView(v => {
    const d = new Date(v.year, v.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setView(v => {
    const d = new Date(v.year, v.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const prevYear = () => setView(v => ({ ...v, year: v.year - 1 }));
  const nextYear = () => setView(v => ({ ...v, year: v.year + 1 }));

  const isToday = (d) => {
    if (!d) return false;
    return d === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear();
  };
  const isSelected = (d) => {
    if (!d || !value) return false;
    const sel = parseYMD(value);
    return sel && sel.getDate() === d && sel.getMonth() === view.month && sel.getFullYear() === view.year;
  };
  const isDisabled = (d) => {
    if (!d) return false;
    const dt = new Date(view.year, view.month, d);
    if (min && dt < parseYMD(min)) return true;
    if (max && dt > parseYMD(max)) return true;
    return false;
  };

  return (
    <div className="w-52">
      {title && <div className="text-[10px] font-semibold text-slate-400 uppercase px-1 mb-1">{title}</div>}
      <div className="flex items-center justify-between mb-2 px-1">
        <button type="button" onClick={prevYear} className="text-slate-400 hover:text-slate-700 px-0.5 text-sm">«</button>
        <button type="button" onClick={prevMonth} className="text-slate-400 hover:text-slate-700 px-0.5 text-sm">‹</button>
        <span className="text-xs font-semibold text-slate-700 flex-1 text-center">
          {FULL_MONTHS[view.month]} {view.year}
        </span>
        <button type="button" onClick={nextMonth} className="text-slate-400 hover:text-slate-700 px-0.5 text-sm">›</button>
        <button type="button" onClick={nextYear} className="text-slate-400 hover:text-slate-700 px-0.5 text-sm">»</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(dn => (
          <div key={dn} className="text-center text-[9px] font-bold text-slate-400">{dn}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d, i) => {
          const disabled = isDisabled(d);
          const selected = isSelected(d);
          const tday     = isToday(d);
          return (
            <button
              key={i}
              type="button"
              disabled={!d || disabled}
              onClick={() => d && !disabled && onSelect(toYMD(new Date(view.year, view.month, d)))}
              className={`
                h-6 w-full text-[10px] rounded transition
                ${!d ? "invisible" : ""}
                ${disabled ? "text-slate-200 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"}
                ${selected ? "bg-blue-600 text-white font-bold hover:bg-blue-700" : ""}
                ${tday && !selected ? "border border-blue-400 text-blue-600 font-semibold" : ""}
                ${!selected && !tday && d ? "text-slate-700" : ""}
              `}
            >
              {d || ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePicker({ dateFrom, dateTo, onApply }) {
  const [open, setOpen]      = useState(false);
  const [draftFrom, setFrom] = useState(dateFrom);
  const [draftTo,   setTo]   = useState(dateTo);
  const ref                  = useRef(null);

  useEffect(() => { setFrom(dateFrom); setTo(dateTo); }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const triggerLabel = dateFrom || dateTo
    ? `${formatDisplay(dateFrom) || "…"} → ${formatDisplay(dateTo) || "…"}`
    : "- Select -";

  const handleOK = () => {
    onApply(draftFrom, draftTo);
    setOpen(false);
  };
  const handleClear = () => { setFrom(""); setTo(""); };

  return (
    <div className="relative flex items-center gap-1.5" ref={ref}>
      <label className="text-slate-600 text-[11.5px] font-medium whitespace-nowrap">Date:</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs min-w-[110px] justify-between transition"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{triggerLabel}</span>
        </div>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-3"
          style={{ minWidth: "450px" }}
        >
          <div className="flex gap-2 mb-3">
            <div className="flex items-center gap-1.5 border border-slate-300 rounded px-2 py-1 text-xs flex-1 bg-white">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span className={draftFrom ? "text-slate-800 font-medium" : "text-slate-400"}>
                {draftFrom ? formatDisplay(draftFrom) : "From Date"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 border border-slate-300 rounded px-2 py-1 text-xs flex-1 bg-white">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span className={draftTo ? "text-slate-800 font-medium" : "text-slate-400"}>
                {draftTo ? formatDisplay(draftTo) : "To Date"}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <MiniCalendar
              title="From"
              value={draftFrom}
              max={draftTo || undefined}
              onSelect={setFrom}
            />
            <MiniCalendar
              title="To"
              value={draftTo}
              min={draftFrom || undefined}
              onSelect={setTo}
            />
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleOK}
              className="text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold px-4 py-1.5 rounded shadow-2xs cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────

function FilterBar({ filters, onChange, filterOptions, activeTab }) {
  const statusOptions  = (filterOptions.lead_statuses || []).map(v => ({ value: v, label: v }));
  const typeOptions    = (filterOptions.lead_types    || []).map(v => ({ value: v, label: v }));
  const productOptions = (filterOptions.product_names || []).map(v => ({ value: v, label: v }));

  const hasActive =
    filters.lead_status.length > 0 ||
    filters.lead_type.length   > 0 ||
    filters.date_from           ||
    filters.date_to             ||
    filters.product_names.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-2 bg-[#f0f4f9] border-b border-slate-200 text-xs select-none shadow-2xs">
      <span className="font-semibold text-slate-600 flex items-center gap-1 tracking-tight">
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        Filters
      </span>

      {/* Lead Status */}
      <CheckboxDropdown
        label="Lead Status:"
        options={statusOptions}
        selected={filters.lead_status}
        onApply={vals => onChange("lead_status", vals)}
      />

      {/* Lead type */}
      <CheckboxDropdown
        label="Lead type:"
        options={typeOptions}
        selected={filters.lead_type}
        onApply={vals => onChange("lead_type", vals)}
      />

      {/* Date range */}
      <DateRangePicker
        dateFrom={filters.date_from}
        dateTo={filters.date_to}
        onApply={(from, to) => onChange("__date__", { from, to })}
      />

      {/* Product Name */}
      <CheckboxDropdown
        label="Product Name:"
        options={productOptions}
        selected={filters.product_names}
        onApply={vals => onChange("product_names", vals)}
      />

      {hasActive && (
        <button
          type="button"
          onClick={() => onChange("__reset__")}
          className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium text-xs ml-auto cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Clear filters
        </button>
      )}
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const baseApi  = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const { userRole } = useUserRole(baseApi);
  const roleName = userRole?.name?.toLowerCase();

  const [activeTab,    setActiveTab]    = useState("products"); // Default to Product & Service Management
  const [tabData,      setTabData]      = useState({});
  const [loading,      setLoading]      = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dashboardRef   = useRef(null);

  const [filterOptions, setFilterOptions] = useState({
    lead_statuses: [],
    lead_types:    [],
    lead_sources:  [],
    product_names: [],
  });

  const [filters, setFilters] = useState({
    lead_status:   [],
    lead_type:     [],
    date_from:     "",
    date_to:       "",
    product_names: [],
  });

  // Fetch dynamic filter options once on mount
  useEffect(() => {
    const token = localStorage.getItem("access") || localStorage.getItem("token") || "";
    fetch(`${baseApi}/dashboard/filter-options/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setFilterOptions(data); })
      .catch(() => {});
  }, [baseApi]);

  const handleFilterChange = useCallback((key, value) => {
    setTabData({});
    if (key === "__reset__") {
      setFilters({ lead_status: [], lead_type: [], date_from: "", date_to: "", product_names: [] });
    } else if (key === "__date__") {
      setFilters(prev => ({ ...prev, date_from: value.from || "", date_to: value.to || "" }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  const fetchTab = useCallback(async (tab, currentFilters) => {
    const token    = localStorage.getItem("access") || localStorage.getItem("token") || "";
    const endpoint = TAB_ENDPOINT[tab];
    if (!endpoint) return;

    const allowed = TAB_PARAMS[tab] || [];
    const params  = new URLSearchParams();

    if (allowed.includes("lead_status") && currentFilters.lead_status?.length)
      params.set("lead_status", currentFilters.lead_status.join(","));
    if (allowed.includes("lead_type") && currentFilters.lead_type?.length)
      params.set("lead_type", currentFilters.lead_type.join(","));
    if (allowed.includes("date_from") && currentFilters.date_from)
      params.set("date_from", currentFilters.date_from);
    if (allowed.includes("date_to") && currentFilters.date_to)
      params.set("date_to", currentFilters.date_to);
    if (allowed.includes("product_names") && currentFilters.product_names?.length)
      params.set("product_names", currentFilters.product_names.join(","));

    const url = `${baseApi}/dashboard/${endpoint}/?${params.toString()}`;
    setLoading(true);
    try {
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTabData(prev => ({ ...prev, [tab]: json }));
    } catch (err) {
      console.error(`Dashboard fetch error [${tab}]:`, err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [baseApi]);

  useEffect(() => {
    fetchTab(activeTab, filters);
  }, [activeTab, filters, fetchTab]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTabData(prev => ({ ...prev, [activeTab]: null }));
    fetchTab(activeTab, filters);
  };

  const toggleFullscreen = () => {
    if (!dashboardRef.current) return;
    if (!document.fullscreenElement) {
      dashboardRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (roleName === "technician") {
    return <TechnicianDashboard userRole={userRole} baseApi={baseApi} />;
  }

  const renderTab = () => {
    if (loading && !tabData[activeTab]) return <Loading />;
    const d = tabData[activeTab];
    switch (activeTab) {
      case "sales":      return <SalesTab      data={d} />;
      case "leads":      return <LeadsTab      data={d} />;
      case "customers":  return <CustomersTab  data={d} />;
      case "followups":  return <FollowupsTab  data={d} />;
      case "products":   return <ProductsTab   data={d} />;
      case "quotations": return <QuotationsTab data={d} />;
      case "invoices":   return <InvoicesTab   data={d} />;
      default:           return null;
    }
  };

  return (
    <div
      ref={dashboardRef}
      className={`flex flex-col h-full w-full bg-[#f8fafc] overflow-y-auto ${
        isFullscreen ? "p-4 bg-white" : ""
      }`}
    >
      <div className="flex flex-col w-full max-w-[1550px] mx-auto bg-white rounded-xl shadow-xs border border-slate-200/80 my-1">
        {/* ─── STICKY TOP SECTION (Header + Tabs + Filter bar remain visible when scrolling!) ── */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
          {/* Top Dashboard Title Bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-white">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>

            {/* Right: Refresh & Expand Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualRefresh}
                title="Reload Data"
                className="border border-slate-300 hover:bg-slate-50 text-slate-600 p-1.5 rounded-md shadow-2xs transition cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                className="border border-slate-300 hover:bg-slate-50 text-slate-600 p-1.5 rounded-md shadow-2xs transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex flex-wrap gap-0 border-b border-slate-200 bg-white">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-[3px] transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "border-blue-600 text-slate-900 bg-transparent font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            {loading && (
              <span className="ml-auto self-center pr-4 text-xs text-blue-600 flex items-center gap-1 animate-pulse">
                <RotateCw className="w-3 h-3 animate-spin" />
                Updating…
              </span>
            )}
          </div>

          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onChange={handleFilterChange}
            filterOptions={filterOptions}
            activeTab={activeTab}
          />
        </div>

        {/* ─── SCROLLABLE TAB CONTENT CANVAS ───────────────────────────────────── */}
        <div className="flex-1 p-4 md:p-5 relative bg-[#f8fafc]">
          {loading && tabData[activeTab] && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-2xs z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-white px-3 py-1.5 rounded-md shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-700">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Updating visualizations…</span>
              </div>
            </div>
          )}
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
