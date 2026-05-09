import type { WarpPreset } from '@app-types/preset';

export const CURRENT_PRESET_SCHEMA_VERSION = 1;

const DEFAULT_PRESET_NAME = 'Untitled preset';

const WARP_OPERATION_TYPES = new Set(['radial_warp', 'directional_warp', 'line_warp', 'region_warp']);

function createPresetId() {
  return `preset_${crypto.randomUUID()}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function sanitizeOperation(input: unknown): WarpPreset['operations'][number] | null {
  const operation = asRecord(input);
  if (!operation) return null;
  if (!WARP_OPERATION_TYPES.has(String(operation.type ?? ''))) return null;

  const safeId = asString(operation.id, `operation_${crypto.randomUUID()}`);
  const falloffType = String(asRecord(operation.falloff)?.type ?? 'smoothstep');

  return {
    id: safeId,
    enabled: Boolean(operation.enabled),
    type: operation.type as WarpPreset['operations'][number]['type'],
    target: asString(operation.target, 'face_center') as WarpPreset['operations'][number]['target'],
    strength: asNumber(operation.strength, 0),
    radius: asNumber(operation.radius, 1),
    falloff: {
      type: (falloffType === 'linear' || falloffType === 'smoothstep' || falloffType === 'gaussian' ? falloffType : 'smoothstep') as WarpPreset['operations'][number]['falloff']['type'],
    },
    axis: {
      x: asNumber(asRecord(operation.axis)?.x, 1),
      y: asNumber(asRecord(operation.axis)?.y, 1),
    },
    direction: {
      x: asNumber(asRecord(operation.direction)?.x, 0),
      y: asNumber(asRecord(operation.direction)?.y, 0),
    },
    lineStart: {
      x: asNumber(asRecord(operation.lineStart)?.x, 0.3),
      y: asNumber(asRecord(operation.lineStart)?.y, 0.5),
    },
    lineEnd: {
      x: asNumber(asRecord(operation.lineEnd)?.x, 0.7),
      y: asNumber(asRecord(operation.lineEnd)?.y, 0.5),
    },
    width: asNumber(operation.width, 0.1),
    polygon: Array.isArray(operation.polygon)
      ? operation.polygon
        .map((point) => asRecord(point))
        .filter((point): point is Record<string, unknown> => point !== null)
        .map((point) => ({ x: asNumber(point.x, 0), y: asNumber(point.y, 0) }))
      : [],
    binding: asRecord(operation.binding) as WarpPreset['operations'][number]['binding'],
    weightMap: asRecord(operation.weightMap) as WarpPreset['operations'][number]['weightMap'],
  };
}

function migrateV0ToV1(input: Record<string, unknown>): WarpPreset {
  const operations = Array.isArray(input.operations) ? input.operations.map(sanitizeOperation).filter((item): item is WarpPreset['operations'][number] => item !== null) : [];

  return {
    schemaVersion: CURRENT_PRESET_SCHEMA_VERSION,
    id: asString(input.id, createPresetId()),
    name: asString(input.name, DEFAULT_PRESET_NAME),
    description: typeof input.description === 'string' ? input.description : undefined,
    operations,
    appearance: asRecord(input.appearance) as WarpPreset['appearance'],
    animations: Array.isArray(input.animations) ? input.animations as WarpPreset['animations'] : undefined,
  };
}

export function migratePreset(input: unknown): WarpPreset {
  const raw = asRecord(input);
  if (!raw) {
    throw new Error('Preset must be an object.');
  }

  const schemaVersion = typeof raw.schemaVersion === 'number'
    ? raw.schemaVersion
    : (typeof raw.version === 'number' ? raw.version - 1 : 0);

  if (schemaVersion <= 0) {
    return migrateV0ToV1(raw);
  }

  if (schemaVersion === CURRENT_PRESET_SCHEMA_VERSION) {
    return migrateV0ToV1(raw);
  }

  throw new Error(`Unsupported preset schema version: ${schemaVersion}`);
}
