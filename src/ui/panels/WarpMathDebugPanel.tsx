import { Panel } from '@ui/Panel';

export function WarpMathDebugPanel({ debugUv, debugCenter, debugWarpResult, debugGridPoints, onMouseMove }: any) {
  return (
    <Panel title="Warp Math Debug">
      <div className="warp-debug-view" onMouseMove={onMouseMove}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {debugGridPoints.map((point: any, index: number) => (
            <g key={index}><line x1={point.uv.x * 100} y1={point.uv.y * 100} x2={point.warpedUv.x * 100} y2={point.warpedUv.y * 100} stroke="rgba(255,180,120,0.25)" strokeWidth="0.35" /><circle cx={point.warpedUv.x * 100} cy={point.warpedUv.y * 100} r="0.6" fill="#59c1ff" /></g>
          ))}
          <circle cx={debugCenter.x * 100} cy={debugCenter.y * 100} r="1.2" fill="#ffd166" />
          <circle cx={debugUv.x * 100} cy={debugUv.y * 100} r="1.2" fill="#90ee90" />
          <line x1={debugUv.x * 100} y1={debugUv.y * 100} x2={debugWarpResult.warpedUv.x * 100} y2={debugWarpResult.warpedUv.y * 100} stroke="#ff7b7b" strokeWidth="0.8" />
          <circle cx={debugWarpResult.warpedUv.x * 100} cy={debugWarpResult.warpedUv.y * 100} r="1.4" fill="#ff7b7b" />
        </svg>
      </div>
      <ul>
        <li>Original point: ({debugUv.x.toFixed(3)}, {debugUv.y.toFixed(3)})</li>
        <li>Warped point: ({debugWarpResult.warpedUv.x.toFixed(3)}, {debugWarpResult.warpedUv.y.toFixed(3)})</li>
        <li>Influence: {debugWarpResult.influence.toFixed(3)}</li>
      </ul>
    </Panel>
  );
}
