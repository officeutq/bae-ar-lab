import { useMemo } from 'react';
import type { WarpFalloffType } from '@app-types/preset';
import { sampleFalloffCurve } from '@engine/math/falloff/sampleFalloffCurve';

type FalloffGraphProps = {
  type: WarpFalloffType;
  sampleCount?: number;
  width?: number;
  height?: number;
};

export function FalloffGraph({ type, sampleCount = 64, width = 320, height = 160 }: FalloffGraphProps) {
  const points = useMemo(() => sampleFalloffCurve(type, sampleCount), [sampleCount, type]);

  const padding = 18;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const path = points
    .map((point, index) => {
      const x = padding + point.distance * plotWidth;
      const y = padding + (1 - point.value) * plotHeight;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const centerX = padding;
  const radiusEdgeX = width - padding;
  const maxStrengthY = padding;

  return (
    <div className="falloff-graph">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${type} falloff curve graph`}>
        <rect x={padding} y={padding} width={plotWidth} height={plotHeight} className="falloff-graph__plot" />
        <line x1={centerX} y1={padding} x2={centerX} y2={height - padding} className="falloff-graph__marker" />
        <line x1={radiusEdgeX} y1={padding} x2={radiusEdgeX} y2={height - padding} className="falloff-graph__marker" />
        <line x1={padding} y1={maxStrengthY} x2={width - padding} y2={maxStrengthY} className="falloff-graph__marker" />
        <path d={path} className="falloff-graph__curve" />

        <text x={centerX + 2} y={height - 6} className="falloff-graph__label">center</text>
        <text x={radiusEdgeX - 64} y={height - 6} className="falloff-graph__label">radius edge</text>
        <text x={padding + 2} y={padding + 12} className="falloff-graph__label">max strength</text>
      </svg>
      <p className="falloff-graph__meta">{type} · samples: {points.length}</p>
    </div>
  );
}
