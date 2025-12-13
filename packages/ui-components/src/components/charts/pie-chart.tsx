import * as React from 'react';
import { cn } from '../../lib/utils';

export interface PieChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartDataPoint[];
  size?: number;
  innerRadius?: number; // Para criar donut chart (0-1)
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 200,
  innerRadius = 0,
  showLabels = true,
  showLegend = true,
  className,
}) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = size / 2 - 10;
  const innerR = radius * innerRadius;

  // Calcula ângulos para cada slice
  const getSliceData = () => {
    let currentAngle = -90; // Começa no topo

    return data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
        color,
      };
    });
  };

  const slices = getSliceData();

  // Converte ângulo para coordenadas cartesianas
  const polarToCartesian = (angle: number, r: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(radians),
      y: center + r * Math.sin(radians),
    };
  };

  // Gera SVG path para um slice
  const getSlicePath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(endAngle, radius);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    if (innerRadius > 0) {
      // Donut chart
      const innerStart = polarToCartesian(startAngle, innerR);
      const innerEnd = polarToCartesian(endAngle, innerR);

      return [
        `M ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
        'Z',
      ].join(' ');
    } else {
      // Pie chart
      return [
        `M ${center} ${center}`,
        `L ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
        'Z',
      ].join(' ');
    }
  };

  // Calcula posição do label
  const getLabelPosition = (startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = innerRadius > 0 ? (radius + innerR) / 2 : radius * 0.7;
    return polarToCartesian(midAngle, labelRadius);
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg width={size} height={size} className="overflow-visible">
        {slices.map((slice, index) => {
          const isHovered = hoveredIndex === index;
          const transform = isHovered
            ? `translate(${polarToCartesian((slice.startAngle + slice.endAngle) / 2, 5).x - center}, ${polarToCartesian((slice.startAngle + slice.endAngle) / 2, 5).y - center})`
            : '';

          return (
            <g
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-transform"
              style={{ transform }}
            >
              <path
                d={getSlicePath(slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                opacity={isHovered ? 0.8 : 1}
              />
              {showLabels && slice.percentage > 0.05 && (
                <text
                  x={getLabelPosition(slice.startAngle, slice.endAngle).x}
                  y={getLabelPosition(slice.startAngle, slice.endAngle).y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="white"
                  pointerEvents="none"
                >
                  {(slice.percentage * 100).toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {slices.map((slice, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="h-3 w-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className={cn('truncate', hoveredIndex === index && 'font-semibold')}>
                {slice.label}
              </span>
              <span className="ml-auto font-medium text-gray-600">
                {slice.value.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
