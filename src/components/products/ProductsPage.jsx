import React, { useState, useMemo, useEffect } from "react";
import Base from "../Base";

import AcTypeList from "./AcTypeList";
import BrandList from "./BrandList";
import SubTypeList from "./SubTypeList";
import InventoryList from "./InventoryList";
import ProductModelList from "./ProductModelList";
import ProductVariantList from "./ProductVariantList";
import ProductsDashboard from "./ProductsDashboard";

export default function ProductsPage() {
  const [activeSection, setActiveSection] = useState("products");
  const [filters, setFilters] = useState({});
  const [brands, setBrands] = useState([]);

  // LOAD BRANDS FOR DROPDOWN
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const BASE_API =
          import.meta.env.VITE_BASE_API_URL ?? "https://api.dsaqua.online";

        const BRAND_API = `${BASE_API}/api/product/ac-brand`;

        const token =
          localStorage.getItem("access") || localStorage.getItem("token") || "";

        const res = await fetch(BRAND_API, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();
        setBrands(data.results || data);
      } catch (err) {
        console.log("Brand load error", err);
      }
    };

    loadBrands();
  }, []);

  // TITLES
  const sectionTitleMap = {
    inventory: "Inventory",
    acType: "AC Types",
    subType: "Sub Types",
    brand: "Brands",
    productModel: "Product Models",
    productVariant: "Product Variants",
    products: "Products Dashboard",
  };

  const filterTitleMap = {
    inventory: "Inventory Filters",
    acType: "AC Type Filters",
    subType: "Sub Type Filters",
    brand: "Brand Filters",
    productModel: "Product Model Filters",
    productVariant: "Product Variant Filters",
    products: "Dashboard Filters",
  };

  // FILTER CONFIG BASED ON ACTIVE TAB
  const filtersConfig = useMemo(() => {
    switch (activeSection) {
      // PRODUCT MODEL FILTERS
      case "productModel":
        return [
          { key: "search", type: "search", label: "Search Model" },
          {
            key: "phase",
            type: "select",
            label: "Phase",
            options: [
              { value: "", label: "All" },
              { value: "1P", label: "1 Phase" },
              { value: "3P", label: "3 Phase" },
            ],
          },
          {
            key: "inverter",
            type: "select",
            label: "Inverter",
            options: [
              { value: "", label: "All" },
              { value: "true", label: "Inverter" },
              { value: "false", label: "Non-Inverter" },
            ],
          },
          {
            key: "is_active",
            type: "select",
            label: "Active Status",
            options: [
              { value: "", label: "All" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
          { key: "brand_name", type: "search", label: "Brand Name" },
        ];

      // PRODUCT VARIANT FILTERS
      case "productVariant":
        return [
          { key: "search", type: "search", label: "Search Variant" },
          {
            key: "star_rating",
            type: "select",
            label: "Star Rating",
            options: [
              { value: "", label: "All" },
              { value: "1", label: "1 Star" },
              { value: "2", label: "2 Star" },
              { value: "3", label: "3 Star" },
              { value: "4", label: "4 Star" },
              { value: "5", label: "5 Star" },
            ],
          },
          {
            key: "is_active",
            type: "select",
            label: "Active Status",
            options: [
              { value: "", label: "All" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
        ];
        case "inventory":
        return [
          {
            key: "search",
            type: "search",
            label: "Search",
            placeholder: "Search Serial, SKU, Capacity...",
          },

          {
            key: "brand",
            type: "select",
            label: "Brand",
            options: [
              { value: "", label: "All Brands" },
              ...brands.map((b) => ({
                value: b.name,
                label: b.name,
              })),
            ],
          },

          { key: "purchase_date", type: "date", label: "Purchase Date" },

          {
            key: "status",
            type: "select",
            label: "Status",
            options: [
              { value: "", label: "All" },
              { value: "IN_STOCK", label: "In Stock" },
              { value: "SOLD", label: "Sold" },
              { value: "DAMAGED", label: "Damaged" },
            ],
          },
        ];

      default:
        return [{ key: "search", type: "search", label: "Search" }];
    }
  }, [activeSection, brands]);

  // TABS
  const tabButtons = [
    { type: "products", label: "Products" },
    { type: "inventory", label: "Inventory" },
    { type: "acType", label: "AC Types" },
    { type: "subType", label: "Sub Types" },
    { type: "brand", label: "Brands" },
    { type: "productModel", label: "Product Models" },
    { type: "productVariant", label: "Product Variants" },
  ];

  return (
    <Base
      title={sectionTitleMap[activeSection]}
      filterTitle={filterTitleMap[activeSection]}
      filtersConfig={filtersConfig}
      initialFilterValues={{}}
      onFiltersChange={(f) => setFilters(f)}
    >
      <div className="space-y-6">
        
        {/* TABS */}
        <div className="bg-white p-4 rounded-md shadow">
          <div className="flex gap-8 border-b pb-2">
            {tabButtons.map((btn) => (
              <button
                key={btn.type}
                onClick={() => setActiveSection(btn.type)}
                className={`pb-2 text-sm font-medium transition-all ${
                  activeSection === btn.type
                    ? "text-sky-600 border-b-2 border-sky-600"
                    : "text-slate-600 hover:text-sky-500"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        {activeSection === "products" && (
          <ProductsDashboard onNavigate={(section) => setActiveSection(section)} />
        )}

        {activeSection === "inventory" && (
          <InventoryList appliedFilters={filters} />
        )}

        {activeSection === "acType" && (
          <AcTypeList appliedFilters={filters} />
        )}

        {activeSection === "subType" && (
          <SubTypeList appliedFilters={filters} />
        )}

        {activeSection === "brand" && (
          <BrandList appliedFilters={filters} />
        )}

        {activeSection === "productModel" && (
          <ProductModelList appliedFilters={filters} />
        )}

        {activeSection === "productVariant" && (
          <ProductVariantList appliedFilters={filters} />
        )}

      </div>
    </Base>
  );
}
