import React, { useState } from "react";

/**
 * FunnelChart
 * Renders an inverted trapezoidal funnel matching Zoho Analytics visualization.
 * 
 * Props:
 *   data: Array of { status | label | name, count, percentage }
 *   title?: string (e.g. "status")
 *   height?: number
 *   palette?: string[]
 */

const DEFAULT_PALETTE = [
  "#5b8df6", // Royal blue (top segment)
  "#2dd4bf", // Mint / Teal (middle segment)
  "#f87171", // Salmon / Coral (bottom segment)
  "#fb923c", // Amber / Orange
  "#a855f7", // Purple
  "#38bdf8", // Sky blue
  "#ec4899", // Pink
  "#10b981", // Emerald
];

export default function FunnelChart({
  data = [],
  title = "status",
  height = 290,
  palette = DEFAULT_PALETTE,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [disabledKeys, setDisabledKeys] = useState(new Set());

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-slate-400 text-xs">
        No data available
      </div>
    );
  }

  // Filter out disabled segments
  const activeData = data.filter((item) => {
    const key = item.status || item.label || item.name || "";
    return !disabledKeys.has(key);
  });

  const toggleKey = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (next.size < data.length - 1) {
          next.add(key);
        }
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (disabledKeys.size > 0) {
      setDisabledKeys(new Set());
    }
  };

  // Dimensions for SVG Funnel
  const svgWidth = 340;
  const svgHeight = height || 290;
  const paddingY = 16;
  const availableHeight = svgHeight - paddingY * 2;

  // Funnel width constraints
  const topWidthMax = 260;
  const bottomWidthMin = 52;
  const centerX = svgWidth / 2;

  const totalCount = activeData.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;
  const count = activeData.length;

  const minSegmentHeight = 38;
  const gap = 3;
  const totalGaps = (count - 1) * gap;

  // Distribute segment heights
  const segmentHeights = activeData.map((d) => {
    const share = (d.count || 1) / totalCount;
    return Math.max(share, 0.18);
  });
  const sumWeights = segmentHeights.reduce((a, b) => a + b, 0) || 1;
  const scaledHeights = segmentHeights.map((w) => (w / sumWeights) * (availableHeight - totalGaps));

  // Compute points for each trapezoid
  let currentY = paddingY;
  const trapezoids = activeData.map((item, idx) => {
    const segHeight = Math.max(scaledHeights[idx] || 36, minSegmentHeight);
    const startY = currentY;
    const endY = currentY + segHeight;

    const progressStart = (startY - paddingY) / availableHeight;
    const progressEnd = (endY - paddingY) / availableHeight;

    const wTop = topWidthMax - (topWidthMax - bottomWidthMin) * Math.min(progressStart, 0.95);
    const wBottom = topWidthMax - (topWidthMax - bottomWidthMin) * Math.min(progressEnd, 0.95);

    const x1 = centerX - wTop / 2;
    const x2 = centerX + wTop / 2;
    const x3 = centerX + wBottom / 2;
    const x4 = centerX - wBottom / 2;

    currentY = endY + gap;

    const color = palette[idx % palette.length];
    const key = item.status || item.label || item.name || `item-${idx}`;
    const pct = item.percentage !== undefined ? item.percentage : ((item.count / totalCount) * 100).toFixed(1);

    return {
      item,
      key,
      points: `${x1},${startY} ${x2},${startY} ${x3},${endY} ${x4},${endY}`,
      color,
      pct: typeof pct === "number" ? pct.toFixed(1) : pct,
      count: item.count,
      centerY: startY + segHeight / 2,
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full py-1">
      {/* Funnel SVG View */}
      <div className="relative flex-1 flex justify-center items-center w-full min-h-[260px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[360px] drop-shadow-xs"
          style={{ height: `${svgHeight}px` }}
        >
          <defs>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.15" />
            </filter>
          </defs>

          {trapezoids.map((t, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={t.key}
                className="transition-transform duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <polygon
                  points={t.points}
                  fill={t.color}
                  filter={isHovered ? "url(#shadow)" : undefined}
                  className="transition-all duration-200"
                  style={{
                    opacity: hoveredIdx === null || isHovered ? 1 : 0.88,
                    transformOrigin: `${centerX}px ${t.centerY}px`,
                    transform: isHovered ? "scale(1.025)" : "scale(1)",
                  }}
                />
                {/* Centered Percentage Label */}
                <text
                  x={centerX}
                  y={t.centerY + 4}
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="700"
                  textAnchor="middle"
                  className="select-none pointer-events-none drop-shadow-xs font-sans"
                >
                  {t.pct}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && trapezoids[hoveredIdx] && (
          <div
            className="absolute z-20 bg-slate-800 text-white text-[11px] rounded px-2.5 py-1 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${centerX}px`,
              top: `${trapezoids[hoveredIdx].centerY - 10}px`,
            }}
          >
            <div className="font-semibold capitalize">{trapezoids[hoveredIdx].key}</div>
            <div className="text-slate-300">
              Count: <span className="font-bold text-white">{trapezoids[hoveredIdx].count}</span> ({trapezoids[hoveredIdx].pct}%)
            </div>
          </div>
        )}
      </div>

      {/* Right-side Legend with checkboxes and count column matching the screenshot */}
      <div className="flex flex-col gap-1.5 min-w-[150px] max-w-[210px] pr-2 text-xs select-none pl-3 border-l border-slate-100">
        {/* Header 'status' checkbox */}
        <label
          onClick={toggleAll}
          className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 hover:text-slate-900 pb-1.5 border-b border-slate-100"
        >
          <input
            type="checkbox"
            checked={disabledKeys.size === 0}
            onChange={toggleAll}
            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer"
          />
          <span className="text-[11px] text-slate-700 font-semibold lowercase">{title}</span>
        </label>

        {/* Individual checkboxes with counts */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          {data.map((item, idx) => {
            const key = item.status || item.label || item.name || `item-${idx}`;
            const color = palette[idx % palette.length];
            const isChecked = !disabledKeys.has(key);

            return (
              <label
                key={key}
                className="flex items-center justify-between gap-2 cursor-pointer text-slate-600 hover:text-slate-900 text-[11.5px] transition group"
                onMouseEnter={() => {
                  const activeIdx = activeData.findIndex((d) => (d.status || d.label || d.name) === key);
                  if (activeIdx !== -1) setHoveredIdx(activeIdx);
                }}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleKey(key)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer shrink-0"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-2xs shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate capitalize font-normal group-hover:text-slate-900 text-[11px]">
                    {key.replace(/_/g, " ")}
                  </span>
                </div>
                {item.count !== undefined && (
                  <span className="text-[11px] text-slate-500 font-medium shrink-0 tabular-nums ml-1">
                    {item.count}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
