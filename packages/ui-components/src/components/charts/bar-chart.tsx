import { useMemo } from 'react';
import { cn } from '../../lib/utils';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  className?: string;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  showValues?: boolean;
  showGrid?: boolean;
}

export function BarChart({
  data,
  className,
  height = 300,
  orientation = 'vertical',
  showValues = true,
  showGrid = true,
}: BarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      {orientation === 'vertical' ? (
        <div className="flex h-full items-end justify-around gap-2 relative">
          {showGrid && (
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 25, 50, 75, 100].map((y) => (
                <div key={y} className="border-t border-slate-200" />
              ))}
            </div>
          )}

          {data.map((item, index) => {
            const heightPercentage = (item.value / maxValue) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1 gap-2">
                <div className="relative w-full flex items-end justify-center">
                  {showValues && (
                    <span className="absolute -top-6 text-xs font-medium text-slate-700">
                      {item.value.toLocaleString()}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                    style={{
                      height: `${heightPercentage}%`,
                      backgroundColor: item.color || '#3b82f6',
                    }}
                  />
                </div>
                <span className="text-xs text-slate-600 text-center truncate w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2 h-full justify-around">
          {data.map((item, index) => {
            const widthPercentage = (item.value / maxValue) * 100;
            return (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-24 text-right truncate">
                  {item.label}
                </span>
                <div className="flex-1 relative">
                  {showGrid && (
                    <div className="absolute inset-0 flex justify-between pointer-events-none">
                      {[0, 25, 50, 75, 100].map((x) => (
                        <div key={x} className="border-l border-slate-200 h-full" />
                      ))}
                    </div>
                  )}
                  <div
                    className="h-8 rounded-r-lg transition-all hover:opacity-80 cursor-pointer relative"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: item.color || '#3b82f6',
                    }}
                  >
                    {showValues && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
