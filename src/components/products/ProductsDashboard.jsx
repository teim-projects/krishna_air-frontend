import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function ProductsDashboard({ onNavigate }) {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "https://api.dsaqua.online";

  const token =
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    "";

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const [totals, setTotals] = useState({
    ac_types: 0,
    sub_types: 0,
    brands: 0,
    models: 0,
    variants: 0,
    inventory: 0,
  });

  const [loading, setLoading] = useState(true);

  // UNIVERSAL COUNTER FUNCTION
  const getCount = async (url) => {
    try {
      const res = await fetch(url, { headers: authHeaders });

      if (!res.ok) return 0;

      const data = await res.json();
      return (
        data.count ??
        data.results?.length ??
        data.length ??
        0
      );
    } catch (err) {
      return 0;
    }
  };

  // LOAD ALL COUNTS
  const loadDashboard = async () => {
    const result = {
      ac_types: await getCount(`${BASE_API}/api/product/actype`),
      sub_types: await getCount(`${BASE_API}/api/product/ac-subtypes`),
      brands: await getCount(`${BASE_API}/api/product/ac-brand`),
      models: await getCount(`${BASE_API}/api/product/product-model`),
      variants: await getCount(`${BASE_API}/api/product/product-variant`),
      inventory: await getCount(`${BASE_API}/api/product/product-inventory/`),
    };

    setTotals(result);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-md shadow">
        Loading Dashboard...
      </div>
    );
  }

  const labels = [
    "Inventory",
    "AC Types",
    "Sub Types",
    "Brands",
    "Models",
    "Variants",
  ];

  const values = [
    totals.inventory,
    totals.ac_types,
    totals.sub_types,
    totals.brands,
    totals.models,
    totals.variants,
  ];

  return (
    <div className="bg-white p-6 rounded-md shadow space-y-8">

      {/* MAIN TITLE */}
      <h2 className="text-xl font-semibold text-slate-700">
        Products Overview
      </h2>

      {/* CLICKABLE KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card
          label="Inventory Items"
          count={totals.inventory}
          onClick={() => onNavigate("inventory")}
        />

        <Card
          label="AC Types"
          count={totals.ac_types}
          onClick={() => onNavigate("acType")}
        />

        <Card
          label="Sub Types"
          count={totals.sub_types}
          onClick={() => onNavigate("subType")}
        />

        <Card
          label="Brands"
          count={totals.brands}
          onClick={() => onNavigate("brand")}
        />

        <Card
          label="Product Models"
          count={totals.models}
          onClick={() => onNavigate("productModel")}
        />

        <Card
          label="Product Variants"
          count={totals.variants}
          onClick={() => onNavigate("productVariant")}
        />
      </div>

      {/* BAR + LINE CHART */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">
          Product Metrics Chart
        </h3>

        <div className="relative h-[300px]">
<Bar
  data={{
    labels: labels,
    datasets: [
      {
        label: "Count",
        data: values,
        backgroundColor: "rgba(59,130,246,0.6)",
        borderColor: "rgba(59,130,246,1)",
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 45,
      },
    ],
  }}
  options={{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#475569" },
        grid: { color: "#e2e8f0" },
      },
      x: {
        ticks: { color: "#475569", font: { size: 13 } },
        grid: { display: false },
      },
    },
  }}
/>

        </div>
      </div>

    </div>
  );
}

/* CARD COMPONENT */
function Card({ label, count, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-slate-50 border border-slate-200 rounded-md shadow-sm 
      cursor-pointer hover:bg-slate-100 active:scale-95 transition"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-800">{count}</p>
    </div>
  );
}
