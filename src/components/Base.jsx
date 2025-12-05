import React, { useState,  useCallback  } from "react";
import FiltersPanel from "./FiltersPanel";
import { FaFilter } from "react-icons/fa";

/**
 * Base layout wrapper
 *
 * Props:
 * - title: string (page title)
 * - filtersConfig: array (passed to FiltersPanel). If null/undefined, filter button hidden.
 * - initialFilterValues: object forwarded to FiltersPanel
 * - onFiltersChange: function(filters) callback
 * - sidebarWidth: number (px) default 256 (w-64)
 * - drawerWidth: number (px) default 320 (~w-80)
 * - children: page content
 */
export default function Base({
  title = "Page",
  filtersConfig = null,
  initialFilterValues = {},
  onFiltersChange = () => {},
  sidebarWidth = 230,
  drawerWidth = 320,
  children,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleFilterChange = useCallback((filters) => {
    onFiltersChange && onFiltersChange(filters);
  }, [onFiltersChange]);


  // compute left offset for desktop (inline style)
  const leftStyle = { left: `${sidebarWidth}px`, width: `${drawerWidth}px` };

  return (
    <div className="relative h-full flex">
      {/* Render drawer only if page supplies a filtersConfig */}
      {filtersConfig && filtersOpen && (
        <>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-y-0 top-15 bg-white  shadow-lg z-50 transform transition-transform duration-200"
            style={leftStyle}
          >
            <div className="p-6  flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-700">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="text-slate-600 hover:text-slate-800 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="h-full overflow-auto">
              <FiltersPanel
                config={filtersConfig}
                initialValues={initialFilterValues}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Backdrop on small screens */}
          <button
            onClick={() => setFiltersOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            aria-hidden="true"
          />
        </>
      )}

      {/* Main content area (shifts right on md when drawer open) */}
      <div className={"flex-1 flex flex-col transition-all duration-300 " + (filtersOpen ? "md:ml-80" : "")}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-transparent">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* show filter trigger only if filtersConfig provided */}
            {filtersConfig && (
              <button
                onClick={() => setFiltersOpen((s) => !s)}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-white hover:shadow-sm"
                title="Show filters"
                aria-expanded={filtersOpen}
              >
                <FaFilter className="text-sky-600" />
                <span className="hidden sm:inline text-sm text-slate-700">Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
