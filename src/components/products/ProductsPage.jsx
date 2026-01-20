import React, { useState, useMemo } from "react";
import Base from "../Base";

// Sections
import AcTypeList from "./AcTypeList";
import BrandList from "./BrandList";
import SubTypeList from "./SubTypeList";
import InventoryList from "./InventoryList";
import ProductModelList from "./ProductModelList";
import ProductVariantList from "./ProductVariantList";

export default function ProductsPage() {
  const [activeSection, setActiveSection] = useState("inventory");
  const [filters, setFilters] = useState({});

  // MAIN SECTION TITLES
  const sectionTitleMap = {
    inventory: "Inventory",
    products: "Products",
    acType: "AC Types",
    subType: "Sub Types",
    brand: "Brands",
    productModel: "Product Models",
    productVariant: "Product Variants",
  };

  // DYNAMIC FILTER HEADER TITLE
  const filterTitleMap = {
    inventory: "Inventory Filters",
    products: "Products Filters",
    acType: "AC Type Filters",
    subType: "Sub Type Filters",
    brand: "Brand Filters",
    productModel: "Product Model Filters",
    productVariant: "Product Variant Filters",
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
    // ⭐ NEW — Serial number search
    { 
      key: "serial", 
      type: "search", 
      label: "Serial No", 
      placeholder: "Search Serial No" 
    },

    // ⭐ NEW — SKU search
    { 
      key: "sku", 
      type: "search", 
      label: "SKU", 
      placeholder: "Search SKU" 
    },

    // ⭐ NEW — Capacity search
    { 
      key: "capacity", 
      type: "search", 
      label: "Capacity", 
      placeholder: "Search Capacity" 
    },

    // ⭐ NEW — Deep FK Brand filter
    {
      key: "brand",
      type: "search",
      label: "Brand Name",
      placeholder: "Search Brand Name"
    },
    // ⭐ NEW — PURCHASE DATE (this was missing)
    {
      key: "purchase_date",
      type: "date",
      label: "Purchase Date",
    },

    // ⭐ Existing Status filter
    {
      key: "status",
      type: "select",
      label: "Status",
      options: [
        { value: "", label: "All" },
        { value: "IN_STOCK", label: "In Stock" },
        { value: "SOLD", label: "Sold" },
        { value: "DAMAGED", label: "Damaged" }
      ]
    }
  ];


        default:
        return [{ key: "search", type: "search", label: "Search" }];
    }
  }, [activeSection]);

  // TAB BUTTONS
  const tabButtons = [
    { type: "inventory", label: "Inventory" },
    { type: "acType", label: "AC Types" },
    { type: "subType", label: "Sub Types" },
    { type: "brand", label: "Brands" },
    { type: "productModel", label: "Product Models" },
    { type: "productVariant", label: "Product Variants" },
    { type: "products", label: "Products" },
  ];

  return (
    <Base
      title={sectionTitleMap[activeSection]}
      filterTitle={filterTitleMap[activeSection]}   // ⭐ DYNAMIC FILTER HEADING
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

        {/* SECTION CONTENT */}
        {activeSection === "acType" && <AcTypeList appliedFilters={filters} />}
        {activeSection === "subType" && <SubTypeList appliedFilters={filters} />}
        {activeSection === "brand" && <BrandList appliedFilters={filters} />}
        {activeSection === "productModel" && (
          <ProductModelList appliedFilters={filters} />
        )}
        {activeSection === "productVariant" && (
          <ProductVariantList appliedFilters={filters} />
        )}
        {activeSection === "inventory" && (
          <InventoryList appliedFilters={filters} />
        )}

        {/* PRODUCTS (you don't want dashboard → show simple message) */}
        {activeSection === "products" && (
          <div className="p-6 bg-white rounded-md shadow text-slate-600">
            Products section…
          </div>
        )}
      </div>
    </Base>
  );
}


















