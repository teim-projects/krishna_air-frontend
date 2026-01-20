export const dashboardConfig = [
  
  // ⭐ NEW: Lead Count
  {
    id: "kpi_leads",
    type: "kpi",
    title: "Total Leads",
    api: "https://api.dsaqua.online/api/lead/lead/",
    icon: "📊",
  },

  
  
    // Inventory
  {
    id: "kpi_inventory",
    type: "kpi",
    title: "Total Inventory",
    api: "https://api.dsaqua.online/api/product/product-inventory/",
    icon: "📦",
  },

  // Variants
  {
    id: "kpi_variants",
    type: "kpi",
    title: "Total Variants",
    api: "https://api.dsaqua.online/api/product/product-variant/",
    icon: "🧩",
  },

 

  // Brands
  {
    id: "kpi_brands",
    type: "kpi",
    title: "Total Brands",
    api: "https://api.dsaqua.online/api/product/ac-brand/",
    icon: "🏷️",
  },

  // AC Types
  {
    id: "kpi_ac_types",
    type: "kpi",
    title: "AC Types",
    api: "https://api.dsaqua.online/api/product/actype/",
    icon: "❄️",
  },

  // Sub Types
  {
    id: "kpi_sub_types",
    type: "kpi",
    title: "Sub Types",
    api: "https://api.dsaqua.online/api/product/ac-subtypes/",
    icon: "📘",
  },
];
