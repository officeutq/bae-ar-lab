import type { FaceGeometry } from '@engine/geometry/types';
import type { WarpPreset } from '@app-types/preset';
import { Panel } from '@ui/Panel';

export function JsonOutputPanel({ preset, geometry }: { preset: WarpPreset; geometry: FaceGeometry | null }) {
  return <Panel title="JSON Output"><pre>{JSON.stringify({ preset, geometry }, null, 2)}</pre></Panel>;
}
