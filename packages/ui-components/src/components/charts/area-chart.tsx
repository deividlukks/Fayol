import { useMemo } from 'react';
import { cn } from '../../lib/utils';

export interface AreaChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface AreaChartProps {
  data: AreaChartDataPoint[];
  className?: string;
  height?: number;
  color?: string;
  color2?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  fillOpacity?: number;
}

export function AreaChart({
  data,
  className,
  height = 300,
  color = '#3b82f6',
  color2 = '#10b981',
  showGrid = true,
  showLabels = true,
  fillOpacity = 0.2,
}: AreaChartProps) {
  const { maxValue, points, points2 } = useMemo(() => {
    const values = data.flatMap((d) => [d.value, d.value2 || 0]);
    const max = Math.max(...values);
    const width = 100 / (data.length - 1 || 1);

    const pts = data.map((d, i) => ({
      x: i * width,
      y: 100 - (d.value / max) * 100,
      label: d.label,
      value: d.value,
    }));

    const pts2 = data.map((d, i) => ({
      x: i * width,
      y: 100 - ((d.value2 || 0) / max) * 100,
      label: d.label,
      value: d.value2 || 0,
    }));

    return { maxValue: max, points: pts, points2: pts2 };
  }, [data]);

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${path} L 100 100 L 0 100 Z`;
  }, [points]);

  const pathData2 = useMemo(() => {
    if (points2.length === 0 || !data[0].value2) return '';
    const path = points2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${path} L 100 100 L 0 100 Z`;
  }, [points2, data]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const linePath2 = useMemo(() => {
    if (points2.length === 0 || !data[0].value2) return '';
    return points2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points2, data]);

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {showGrid && (
          <g className="text-slate-200">
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.2"
              />
            ))}
          </g>
        )}

        {data[0].value2 && (
          <>
            <path d={pathData2} fill={color2} fillOpacity={fillOpacity} />
            <path
              d={linePath2}
              fill="none"
              stroke={color2}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        <path d={pathData} fill={color} fillOpacity={fillOpacity} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1"
            fill={color}
            className="hover:r-2 transition-all cursor-pointer"
          />
        ))}
      </svg>

      {showLabels && (
        <div className="flex justify-between mt-2 text-xs text-slate-600">
          {data.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
