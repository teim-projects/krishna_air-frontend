import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, Target } from "lucide-react";

const BASE_API =
  import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

export default function SalesIntelligence() {
  const [data, setData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All");

  const [selectedPrediction, setSelectedPrediction] = useState("All");
  const [selectedConversionClass, setSelectedConversionClass] =
    useState("All");

  const fetchSalesIntelligence = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [scoringResponse, conversionResponse] =
        await Promise.all([
          fetch(
            `${BASE_API}/sales-intelligence/lead-scoring/`,
            { headers }
          ),
          fetch(
            `${BASE_API}/sales-intelligence/lead-conversion/`,
            { headers }
          ),
        ]);

      if (!scoringResponse.ok) {
        throw new Error(
          `Lead scoring request failed with status ${scoringResponse.status}`
        );
      }

      if (!conversionResponse.ok) {
        throw new Error(
          `Lead conversion request failed with status ${conversionResponse.status}`
        );
      }

      const scoringResult = await scoringResponse.json();
      const conversionResult = await conversionResponse.json();

      setData(scoringResult);
      setConversionData(conversionResult);
    } catch (err) {
      setError(
        err.message || "Failed to load sales intelligence."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesIntelligence();
  }, []);

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];

    if (selectedPriority === "All") {
      return data.leads;
    }

    return data.leads.filter(
      (lead) => lead.priority === selectedPriority
    );
  }, [data, selectedPriority]);

  const conversionPredictions =
    conversionData?.predictions ?? [];

  const filteredConversionPredictions = useMemo(() => {
    return conversionPredictions.filter((lead) => {
      const prediction =
        lead.conversion_prediction === 1
          ? "Likely"
          : "Unlikely";

      const matchesPrediction =
        selectedPrediction === "All" ||
        prediction === selectedPrediction;

      const matchesConversionClass =
        selectedConversionClass === "All" ||
        lead.conversion_class === selectedConversionClass;

      return (
        matchesPrediction &&
        matchesConversionClass
      );
    });
  }, [
    conversionPredictions,
    selectedPrediction,
    selectedConversionClass,
  ]);

  const getCustomerName = (leadId) => {
    const lead = data?.leads?.find(
      (item) => item.lead_id === leadId
    );

    return lead?.customer || "-";
  };

  const highConversionCount =
    conversionPredictions.filter(
      (lead) => lead.conversion_class === "High"
    ).length;

  const mediumConversionCount =
    conversionPredictions.filter(
      (lead) => lead.conversion_class === "Medium"
    ).length;

  const lowConversionCount =
    conversionPredictions.filter(
      (lead) => lead.conversion_class === "Low"
    ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 text-sm">
          Loading Sales Intelligence...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ================================================== */}
        {/* LEAD SCORING */}
        {/* ================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Lead Scoring Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">

            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0088ff]" />

              <div>
                <h2 className="font-bold text-slate-800">
                  Lead Scoring
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Rule-based lead scoring and priority classification
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">
                Priority
              </label>

              <select
                value={selectedPriority}
                onChange={(e) =>
                  setSelectedPriority(e.target.value)
                }
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

          </div>

          {/* Lead Scoring KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">

            <KpiCard
              title="Total Leads"
              value={data?.total_leads ?? 0}
            />

            <KpiCard
              title="High Priority"
              value={data?.high ?? 0}
            />

            <KpiCard
              title="Medium Priority"
              value={data?.medium ?? 0}
            />

            <KpiCard
              title="Low Priority"
              value={data?.low ?? 0}
            />

          </div>

          {/* Lead Scoring Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-slate-50">
                <tr>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Lead ID
                  </th>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Customer
                  </th>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Lead Score
                  </th>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Priority
                  </th>

                </tr>
              </thead>

              <tbody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.lead_id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >

                      <td className="px-5 py-3 font-medium text-slate-700">
                        #{lead.lead_id}
                      </td>

                      <td className="px-5 py-3 font-medium text-slate-700">
                        {lead.customer || "-"}
                      </td>

                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {lead.lead_score}
                      </td>

                      <td className="px-5 py-3">
                        <PriorityBadge
                          priority={lead.priority}
                        />
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      No leads found for{" "}
                      {selectedPriority} priority.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </div>

        {/* ================================================== */}
        {/* LEAD CONVERSION PREDICTION */}
        {/* ================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Conversion Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">

            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#0088ff]" />

              <div>
                <h2 className="font-bold text-slate-800">
                  Lead Conversion Prediction
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Logistic Regression based conversion probability
                </p>
              </div>
            </div>

            {/* Conversion Slicers */}
            <div className="flex items-center gap-3 flex-wrap">

              {/* Prediction Slicer */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">
                  Prediction
                </label>

                <select
                  value={selectedPrediction}
                  onChange={(e) =>
                    setSelectedPrediction(e.target.value)
                  }
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="All">All</option>
                  <option value="Likely">Likely</option>
                  <option value="Unlikely">Unlikely</option>
                </select>
              </div>

              {/* Conversion Class Slicer */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">
                  Conversion Class
                </label>

                <select
                  value={selectedConversionClass}
                  onChange={(e) =>
                    setSelectedConversionClass(e.target.value)
                  }
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="All">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

            </div>

          </div>

          {/* Conversion Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">

            <ConversionCard
              title="High Conversion"
              value={highConversionCount}
            />

            <ConversionCard
              title="Medium Conversion"
              value={mediumConversionCount}
            />

            <ConversionCard
              title="Low Conversion"
              value={lowConversionCount}
            />

          </div>

          {/* Conversion Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-slate-50">
                <tr>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Lead ID
                  </th>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Customer
                  </th>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Conversion Probability
                  </th>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Prediction
                  </th>

                  <th className="text-left px-5 py-3 font-semibold text-slate-600">
                    Conversion Class
                  </th>

                </tr>
              </thead>

              <tbody>
                {filteredConversionPredictions.length > 0 ? (
                  filteredConversionPredictions.map((lead) => (
                    <tr
                      key={lead.lead_id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >

                      <td className="px-5 py-3 font-medium text-slate-700">
                        #{lead.lead_id}
                      </td>

                      <td className="px-5 py-3 font-medium text-slate-700">
                        {getCustomerName(lead.lead_id)}
                      </td>

                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {(
                          lead.conversion_probability * 100
                        ).toFixed(2)}
                        %
                      </td>

                      <td className="px-5 py-3">
                        <PredictionBadge
                          prediction={
                            lead.conversion_prediction
                          }
                        />
                      </td>

                      <td className="px-5 py-3">
                        <ConversionBadge
                          classification={
                            lead.conversion_class
                          }
                        />
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      No conversion predictions found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </div>

      </div>
    </div>
  );
}


/* ================================================== */
/* REUSABLE UI COMPONENTS */
/* ================================================== */

function KpiCard({ title, value }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="text-2xl font-bold text-slate-800 mt-2">
        {value}
      </p>
    </div>
  );
}


function ConversionCard({ title, value }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="text-2xl font-bold text-slate-800 mt-1">
        {value}
      </p>
    </div>
  );
}


function PriorityBadge({ priority }) {
  const classes = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${
        classes[priority] || classes.Low
      }`}
    >
      {priority}
    </span>
  );
}


function PredictionBadge({ prediction }) {
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${
        prediction === 1
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {prediction === 1 ? "Likely" : "Unlikely"}
    </span>
  );
}


function ConversionBadge({ classification }) {
  const classes = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${
        classes[classification] || classes.Low
      }`}
    >
      {classification}
    </span>
  );
}
