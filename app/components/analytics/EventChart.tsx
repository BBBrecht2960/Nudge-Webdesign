'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface EventData {
  count: number;
  trend: number;
}

interface EventChartProps {
  title: string;
  eventName: string;
  days?: number;
}

export function EventChart({ title, eventName, days = 30 }: EventChartProps) {
  const [data, setData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/analytics/events?days=${days}`);
        if (response.ok) {
          const result = await response.json();
          setData(result.events[eventName] || { count: 0, trend: 0 });
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventName, days]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{data?.count.toLocaleString('nl-BE') || 0}</span>
          <span className="text-sm text-muted-foreground">events</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Laatste {days} dagen
        </p>
      </div>
    </div>
  );
}
