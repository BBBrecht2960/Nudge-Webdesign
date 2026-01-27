'use client';

import { useEffect, useState } from 'react';

interface LeadChartProps {
  title: string;
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
}

interface TimelineData {
  date: string;
  total: number;
  byStatus: Record<string, number>;
}

export function LeadChart({ title, startDate, endDate, groupBy }: LeadChartProps) {
  const [data, setData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/leads?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result.timeline || []);
      } catch (error) {
        console.error('Error fetching lead chart data:', error);
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

  const formatDate = (dateStr: string) => {
    try {
      if (groupBy === 'month' && dateStr.includes('-')) {
        const [year, month] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('nl-BE', { month: 'short', year: 'numeric' });
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      switch (groupBy) {
        case 'day':
          return date.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' });
        case 'week':
          return `Week ${date.toLocaleDateString('nl-BE', { month: 'short', day: '2-digit' })}`;
        case 'month':
          return date.toLocaleDateString('nl-BE', { month: 'short', year: 'numeric' });
        default:
          return dateStr;
      }
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-2">
        <div className="flex items-end gap-1 h-[200px]">
          {data.map((item, index) => {
            const height = (item.total / maxValue) * chartHeight;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
                style={{ minWidth: '20px' }}
              >
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-primary rounded-t hover:bg-primary/80 transition-colors cursor-pointer relative"
                    style={{ height: `${height}px` }}
                    title={`${item.date}: ${item.total} leads`}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                      {item.total} leads
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2 text-center transform -rotate-45 origin-top-left whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                  {formatDate(item.date)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-4">
          <span>Min: {Math.min(...data.map((d) => d.total))}</span>
          <span>Max: {Math.max(...data.map((d) => d.total))}</span>
          <span>Gemiddelde: {Math.round(data.reduce((sum, d) => sum + d.total, 0) / data.length)}</span>
        </div>
      </div>
    </div>
  );
}
