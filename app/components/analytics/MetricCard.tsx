'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, trend, subtitle, icon }: MetricCardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      return val.toLocaleString('nl-BE');
    }
    return val;
  };

  const getTrendIcon = () => {
    if (!trend && trend !== 0) return null;
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!trend && trend !== 0) return '';
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="text-primary">{icon}</div>}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold">{formatValue(value)}</p>
            {trend !== undefined && trend !== null && (
              <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                {getTrendIcon()}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
