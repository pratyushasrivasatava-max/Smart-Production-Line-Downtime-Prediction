import React from 'react';

interface GaugeChartProps {
  value: number; // 0 to 1
  label?: string;
  size?: number;
  format?: (v: number) => string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  label = 'Failure Probability',
  size = 140,
  format = (v) => `${(v * 100).toFixed(0)}%`,
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  // 240 degree gauge arc
  const startAngle = 150;
  const totalAngle = 240;
  const currentAngle = startAngle + value * totalAngle;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, start: number, end: number) => {
    const s = polarToCartesian(x, y, r, end);
    const e = polarToCartesian(x, y, r, start);
    const largeArcFlag = end - start <= 180 ? '0' : '1';
    return ['M', s.x, s.y, 'A', r, r, 0, largeArcFlag, 0, e.x, e.y].join(' ');
  };

  const bgPath = describeArc(center, center, radius, 150, 150 + totalAngle);
  const activePath = describeArc(center, center, radius, 150, Math.min(150 + totalAngle, currentAngle));

  // Determine stroke color
  let strokeColor = '#10b981'; // Green
  if (value >= 0.85) {
    strokeColor = '#ef4444'; // Red
  } else if (value >= 0.6) {
    strokeColor = '#f97316'; // Orange
  } else if (value >= 0.3) {
    strokeColor = '#f59e0b'; // Amber
  }

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size * 0.9 }}>
      <svg width={size} height={size * 0.9} className="overflow-visible">
        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active arc */}
        {value > 0.01 && (
          <path
            d={activePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
          {format(value)}
        </span>
        <span className="text-[11px] text-neutral-500 font-medium tracking-wide uppercase mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
};
