import React, { useEffect, useState, useMemo } from "react";
import Base from "../components/Base";
import DashboardWidget from "./DashboardWidget";
import { dashboardConfig } from "./dashboardConfig";
import { useUserRole } from "../hooks/useAuth";
import Chart from "react-apexcharts";

export default function Dashboard() {
  const [widgetData, setWidgetData] = useState({});
  const baseApi = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  const { userRole } = useUserRole(baseApi);
  const roleName = userRole?.name?.toLowerCase();

  const [techStats, setTechStats] = useState({ pending: 0, completed: 0 });
  const [rawPendingData, setRawPendingData] = useState([]);
  const [rawCompletedData, setRawCompletedData] = useState([]);
  const [loadingTech, setLoadingTech] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      "";

    // General Dashboard widgets load
    dashboardConfig.forEach(async (widget) => {
      if (!widget.api) return;

      try {
        const res = await fetch(widget.api, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();

        setWidgetData((prev) => ({
          ...prev,
          [widget.id]: data.count || 0,
        }));
      } catch (error) {
        console.error("API Error: ", widget.api);
      }
    });
  }, []);

  useEffect(() => {
    if (roleName !== 'technician') return;
    
    const fetchTechStats = async () => {
      setLoadingTech(true);
      const token = localStorage.getItem("access") || localStorage.getItem("token") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      try {
        const [resPending, resCompleted] = await Promise.all([
          fetch(`${baseApi}/amc/technician-work-records/`, { headers }),
          fetch(`${baseApi}/amc/completed-work/`, { headers })
        ]);
        
        const dataPending = await resPending.json();
        const dataCompleted = await resCompleted.json();
        
        setRawPendingData(dataPending);
        setRawCompletedData(dataCompleted);

        const pendingCount = Array.isArray(dataPending.results) ? dataPending.results.length : (Array.isArray(dataPending) ? dataPending.length : 0);
        const completedCount = Array.isArray(dataCompleted) ? dataCompleted.length : 0;
        
        setTechStats({
          pending: pendingCount,
          completed: completedCount
        });
      } catch (err) {
        console.error("Failed to fetch technician stats:", err);
      } finally {
        setLoadingTech(false);
      }
    };
    
    fetchTechStats();
  }, [roleName, baseApi]);

  // Compute monthly stats for charts
  const monthlyStats = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const monthlyPending = Array(12).fill(0);
    const monthlyCompleted = Array(12).fill(0);

    const getMonthIndex = (dateStr) => {
      if (!dateStr) return -1;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return -1;
      if (date.getFullYear() !== currentYear) return -1;
      return date.getMonth();
    };

    const pendingList = Array.isArray(rawPendingData.results) ? rawPendingData.results : (Array.isArray(rawPendingData) ? rawPendingData : []);
    pendingList.forEach(item => {
      const idx = getMonthIndex(item.work_date || item.created_at);
      if (idx !== -1) monthlyPending[idx]++;
    });

    const completedList = Array.isArray(rawCompletedData) ? rawCompletedData : [];
    completedList.forEach(item => {
      const idx = getMonthIndex(item.completion_date || item.updated_at);
      if (idx !== -1) monthlyCompleted[idx]++;
    });

    const currentMonthIndex = new Date().getMonth();
    const last6Months = [];
    const pendingSeries = [];
    const completedSeries = [];

    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      last6Months.push(months[idx]);
      pendingSeries.push(monthlyPending[idx]);
      completedSeries.push(monthlyCompleted[idx]);
    }

    return {
      categories: last6Months,
      pending: pendingSeries,
      completed: completedSeries
    };
  }, [rawPendingData, rawCompletedData]);

  if (roleName === 'technician') {
    const totalJobs = techStats.pending + techStats.completed;
    const completionRate = totalJobs > 0 ? Math.round((techStats.completed / totalJobs) * 100) : 0;

    // 1. Column Chart (Vertical)
    const columnChartSeries = [
      {
        name: "Jobs Count",
        data: [techStats.pending, techStats.completed]
      }
    ];

    const columnChartOptions = {
      chart: {
        type: 'bar',
        toolbar: { show: false }
      },
      colors: ['#ea580c', '#10b981'],
      plotOptions: {
        bar: {
          columnWidth: '40%',
          distributed: true,
          borderRadius: 3
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '11px',
          colors: ['#fff']
        }
      },
      legend: {
        show: false
      },
      xaxis: {
        categories: ['Assigned (Pending)', 'Completed Work'],
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 600,
            colors: ['#475569', '#475569']
          }
        }
      },
      yaxis: {
        title: {
          text: 'Jobs',
          style: { fontSize: '11px', fontWeight: 600, color: '#475569' }
        },
        labels: {
          formatter: (val) => Math.round(val)
        }
      }
    };

    // 2. Bar Chart (Horizontal Stacked)
    const barChartSeries = [
      {
        name: 'Pending',
        data: monthlyStats.pending
      },
      {
        name: 'Completed',
        data: monthlyStats.completed
      }
    ];

    const barChartOptions = {
      chart: {
        type: 'bar',
        stacked: true,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '50%',
          borderRadius: 2
        }
      },
      colors: ['#ea580c', '#10b981'],
      xaxis: {
        categories: monthlyStats.categories,
        labels: {
          formatter: (val) => Math.round(val),
          style: { colors: '#475569', fontSize: '10px' }
        }
      },
      yaxis: {
        labels: {
          style: { colors: '#475569', fontWeight: 600, fontSize: '10px' }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '11px',
        labels: { colors: '#475569' }
      },
      fill: {
        opacity: 1
      }
    };

    return (
      <Base title="  ">
        <div className="space-y-4 max-w-7xl w-full mx-auto p-2 bg-slate-50 rounded-lg">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-lg text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-wide">
                Welcome back, {userRole?.full_name || userRole?.name || 'Technician'}!
              </h2>
              <p className="text-slate-100 text-xs font-light">
                Here is a quick overview of your assigned jobs and completed work progress.
              </p>
            </div>
          </div>

          {/* KPI + Progress Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assigned Work Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Assigned Work List
                </span>
                <span className="text-3xl font-extrabold text-slate-800 block">
                  {loadingTech ? "..." : techStats.pending}
                </span>
                <span className="text-[11px] text-orange-600 font-medium block flex items-center gap-1 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-600 inline-block"></span>
                  Waiting action / in-progress
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#fef3c7] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6M9 16h6" />
                </svg>
              </div>
            </div>

            {/* Completed Work Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Completed Work List
                </span>
                <span className="text-3xl font-extrabold text-slate-800 block">
                  {loadingTech ? "..." : techStats.completed}
                </span>
                <span className="text-[11px] text-green-600 font-medium block flex items-center gap-1 mt-1">
                  <span className="text-green-600 font-semibold">✓</span>
                  Closed and processed records
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-center space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Work Progress Rate</span>
                <span className="text-slate-800 font-bold">{completionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${completionRate}%`,
                  }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Total: {totalJobs}</span>
                <span>Completed: {techStats.completed}</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column Chart Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-800">Job Status Distribution</h3>
              <div className="w-full overflow-hidden">
                <Chart
                  options={columnChartOptions}
                  series={columnChartSeries}
                  type="bar"
                  height={270}
                />
              </div>
            </div>

            {/* Bar Chart Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-800">Monthly Performance Trends</h3>
              <div className="w-full overflow-hidden">
                <Chart
                  options={barChartOptions}
                  series={barChartSeries}
                  type="bar"
                  height={270}
                />
              </div>
            </div>
          </div>
        </div>
      </Base>
    );
  }

  return (
    <Base
      title="  "
      filterTitle="Dashboard Filters"
      // filtersConfig={[]}
      // initialFilterValues={{}}
    >
      <div className="space-y-6 max-w-7xl w-full mx-auto p-4">

        {/* KPI GRID */}
        <div className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-3 
          lg:grid-cols-3 
          gap-4
        ">
          {dashboardConfig.map((widget) => (
            <DashboardWidget
              key={widget.id}
              widget={widget}
              data={widgetData[widget.id]}
            />
          ))}
        </div>

      </div>
    </Base>
  );
}
