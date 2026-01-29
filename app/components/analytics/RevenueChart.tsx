'use client';

import { useEffect, useState } from 'react';

interface RevenueChartProps {
  title: string;
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
}

interface TimelineData {
  date: string;
  total: number;
  count: number;
}

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
  const chartHeight = 200;
  // Toon maar een deel van de x-as-labels zodat ze leesbaar blijven (niet 8px breed)
  const labelStep = Math.max(1, Math.floor(data.length / 8));
  const showLabel = (index: number) => index % labelStep === 0 || index === data.length - 1;

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number);
      if (groupBy === 'month' && parts.length >= 2) {
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

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6">{title}</h3>
      <div className="space-y-4">
        <div className="flex items-end gap-2 h-[240px] pb-8">
          {data.map((item, index) => {
            const height = item.total > 0 ? Math.max((item.total / maxValue) * chartHeight, 4) : 0;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative min-w-0"
              >
                <div className="w-full flex flex-col justify-end h-full px-0.5">
                  <div
                    className="w-full rounded-t-md hover:rounded-t-lg transition-all cursor-pointer relative shadow-sm hover:shadow-md"
                    style={{ 
                      height: `${height}px`,
                      background: 'linear-gradient(180deg, rgba(144, 103, 198, 1) 0%, rgba(144, 103, 198, 0.85) 100%)',
                      minHeight: item.total > 0 ? '4px' : '0px'
                    }}
                    title={`${formatDate(item.date)}: €${item.total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                      €{item.total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-3 text-center w-full min-w-0 h-4">
                  {showLabel(index) ? (
                    <span title={`${formatDate(item.date)}: €${item.total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                      {formatDate(item.date)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground pt-4 border-t border-border">
          <span>Min: €{Math.min(...data.map((d) => d.total)).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span>Max: €{Math.max(...data.map((d) => d.total)).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span>Gemiddelde: €{(data.reduce((sum, d) => sum + d.total, 0) / data.length).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}
