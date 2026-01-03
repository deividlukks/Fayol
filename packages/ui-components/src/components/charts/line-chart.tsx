import * as React from 'react';
import { cn } from '../../lib/utils';

export interface LineChartDataPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showDots?: boolean;
  smooth?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = '#3b82f6',
  showGrid = true,
  showDots = true,
  smooth = true,
  className,
}) => {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = React.useState<{
    show: boolean;
    x: number;
    y: number;
    value: number;
    label: string;
  }>({ show: false, x: 0, y: 0, value: 0, label: '' });

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 600;
  const chartHeight = height;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;

  const getX = (index: number) => {
    const innerWidth = chartWidth - padding.left - padding.right;
    return padding.left + (index / (data.length - 1 || 1)) * innerWidth;
  };

  const getY = (value: number) => {
    const innerHeight = chartHeight - padding.top - padding.bottom;
    return padding.top + innerHeight - ((value - minValue) / valueRange) * innerHeight;
  };

  // Gera path para a linha
  const generatePath = () => {
    if (data.length === 0) return '';

    let path = `M ${getX(0)} ${getY(data[0].value)}`;

    if (smooth && data.length > 2) {
      // Smooth curve (simplified)
      for (let i = 1; i < data.length; i++) {
        const x = getX(i);
        const y = getY(data[i].value);
        const prevX = getX(i - 1);
        const prevY = getY(data[i - 1].value);
        const cpX = (prevX + x) / 2;
        path += ` Q ${cpX} ${prevY}, ${x} ${y}`;
      }
    } else {
      // Straight lines
      for (let i = 1; i < data.length; i++) {
        path += ` L ${getX(i)} ${getY(data[i].value)}`;
      }
    }

    return path;
  };

  // Gera path para área preenchida
  const generateAreaPath = () => {
    if (data.length === 0) return '';
    const linePath = generatePath();
    const bottomY = getY(minValue);
    return `${linePath} L ${getX(data.length - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const innerWidth = chartWidth - padding.left - padding.right;
    const relativeX = (x - padding.left) / innerWidth;
    const index = Math.round(relativeX * (data.length - 1));

    if (index >= 0 && index < data.length) {
      setTooltip({
        show: true,
        x: getX(index),
        y: getY(data[index].value),
        value: data[index].value,
        label: data[index].label,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, show: false }));
  };

  return (
    <div className={cn('relative', className)}>
      <svg
        ref={svgRef}
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="overflow-visible"
      >
        {/* Grid lines */}
        {showGrid && (
          <g className="grid">
            {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
              const y = padding.top + (chartHeight - padding.top - padding.bottom) * percent;
              return (
                <line
                  key={percent}
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        {/* Area fill */}
        <path
          d={generateAreaPath()}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Line */}
        <path
          d={generatePath()}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots &&
          data.map((point, index) => (
            <circle
              key={index}
              cx={getX(index)}
              cy={getY(point.value)}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
          ))}

        {/* Y-axis labels */}
        {[maxValue, maxValue * 0.5, minValue].map((value, index) => (
          <text
            key={index}
            x={padding.left - 10}
            y={getY(value)}
            textAnchor="end"
            alignmentBaseline="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {value.toFixed(0)}
          </text>
        ))}

        {/* X-axis labels (show every nth label to avoid crowding) */}
        {data.map((point, index) => {
          const showLabel = data.length <= 7 || index % Math.ceil(data.length / 7) === 0;
          if (!showLabel) return null;
          return (
            <text
              key={index}
              x={getX(index)}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {point.label}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="absolute z-10 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg pointer-events-none"
          style={{
            left: `${(tooltip.x / chartWidth) * 100}%`,
            top: `${(tooltip.y / chartHeight) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="font-semibold">{tooltip.label}</div>
          <div>{tooltip.value.toLocaleString('pt-BR')}</div>
        </div>
      )}
    </div>
  );
};
