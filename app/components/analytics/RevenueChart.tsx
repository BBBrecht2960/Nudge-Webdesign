'use client';

import { useEffect, useState } from 'react';

interface RevenueChartProps {
  title: string;
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month' | 'quarter';
}

interface TimelineData {
  date: string;
  total: number;
  count: number;
}

const CHART_HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 32, left: 44 };

export function RevenueChart({ title, startDate, endDate, groupBy }: RevenueChartProps) {
  const [data, setData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result.timeline || []);
      } catch (error) {
        console.error('Error fetching revenue chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, groupBy]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-muted-foreground">Geen data beschikbaar</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const labelStep = Math.max(1, Math.floor(data.length / 8));
  const showLabel = (index: number) => index % labelStep === 0 || index === data.length - 1;

  const formatDate = (dateStr: string) => {
    try {
      if (groupBy === 'quarter' && dateStr.includes('-Q')) {
        const [year, q] = dateStr.split('-Q');
        return `Q${q} ${year}`;
      }
      const parts = dateStr.split('-').map(Number);
      if (groupBy === 'month' && parts.length >= 2 && !dateStr.includes('Q')) {
        const date = new Date(parts[0], parts[1] - 1, 1);
        return date.toLocaleDateString('nl-BE', { month: 'short', year: 'numeric' });
      }
      if (parts.length >= 3) {
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        if (isNaN(date.getTime())) return dateStr;
        switch (groupBy) {
          case 'day':
            return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
          case 'week':
            return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
          default:
            return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
        }
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const formatY = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
    return v.toFixed(0);
  };

  const yTicks = 5;
  const innerWidth = 400;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const scaleY = (v: number) => PADDING.top + innerHeight - (v / maxValue) * innerHeight;
  const scaleX = (i: number) => PADDING.left + (i / Math.max(data.length - 1, 1)) * (innerWidth - PADDING.left - PADDING.right);

  const pathD = data
    .map((item, i) => {
      const x = scaleX(i);
      const y = scaleY(item.total);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const yTickValues: number[] = [];
  for (let i = 0; i <= yTicks; i++) {
    yTickValues.push((maxValue * i) / yTicks);
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${innerWidth + PADDING.left + PADDING.right} ${CHART_HEIGHT}`}
          className="w-full min-w-[320px] h-[220px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines (dashed) */}
          {yTickValues.slice(0, -1).map((v, i) => {
            const y = scaleY(v);
            return (
              <line
                key={i}
                x1={PADDING.left}
                y1={y}
                x2={innerWidth - PADDING.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            );
          })}
          {data.map((_, i) => i).filter(showLabel).map((i) => {
            const x = scaleX(i);
            return (
              <line
                key={i}
                x1={x}
                y1={PADDING.top}
                x2={x}
                y2={PADDING.top + innerHeight}
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            );
          })}
          {/* Y-axis labels */}
          {yTickValues.map((v, i) => (
            <text
              key={i}
              x={PADDING.left - 8}
              y={scaleY(v) + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[11px]"
            >
              {formatY(v)}
            </text>
          ))}
          {/* X-axis labels */}
          {data.map((item, index) =>
            showLabel(index) ? (
              <text
                key={index}
                x={scaleX(index)}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {formatDate(item.date)}
              </text>
            ) : null
          )}
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="rgb(144, 103, 198)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points (circles) */}
          {data.map((item, i) => (
            <circle
              key={i}
              cx={scaleX(i)}
              cy={scaleY(item.total)}
              r={3}
              fill="rgb(144, 103, 198)"
              className="hover:r-4 transition-[r]"
            >
              <title>
                {formatDate(item.date)}: €{item.total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground pt-3 mt-1 border-t border-border/80">
        <span>Min: €{Math.min(...data.map((d) => d.total)).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>Max: €{Math.max(...data.map((d) => d.total)).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>Gem.: €{(data.reduce((sum, d) => sum + d.total, 0) / data.length).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
