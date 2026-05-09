import type { WarpPreset } from '@app-types/preset';
import { CURRENT_PRESET_SCHEMA_VERSION, type PresetCollection, type StoredPreset } from './types';
import { migratePreset } from './presetSchema';

const STORAGE_KEY = 'beauty-lab-presets';

const defaultCollection: PresetCollection = {
  presets: [],
  lastUsedPresetId: null,
};

function nowIso() { return new Date().toISOString(); }
function createId() { return `preset_${crypto.randomUUID()}`; }

function sanitizeCollection(value: unknown): PresetCollection {
  if (!value || typeof value !== 'object') return defaultCollection;
  const raw = value as Partial<PresetCollection>;
  const presets = Array.isArray(raw.presets)
    ? raw.presets.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const candidate = item as Partial<StoredPreset> & { preset?: unknown };
      if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || typeof candidate.createdAt !== 'string' || typeof candidate.updatedAt !== 'string' || typeof candidate.version !== 'number') {
        return [];
      }
      try {
        return [{ ...candidate, preset: migratePreset(candidate.preset) } as StoredPreset];
      } catch (error) {
        console.error('Failed to migrate stored preset:', error);
        return [];
      }
    })
    : [];
  const idSet = new Set(presets.map((item) => item.id));
  return {
    presets,
    lastUsedPresetId: typeof raw.lastUsedPresetId === 'string' && idSet.has(raw.lastUsedPresetId) ? raw.lastUsedPresetId : null,
  };
}

function readCollection(): PresetCollection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCollection;
    return sanitizeCollection(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to read preset collection:', error);
    return defaultCollection;
  }
}

function writeCollection(collection: PresetCollection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

export const listPresets = () => readCollection().presets;
export const loadPreset = (id: string) => readCollection().presets.find((item) => item.id === id) ?? null;
export const getLastUsedPresetId = () => readCollection().lastUsedPresetId;

export function setLastUsedPresetId(id: string | null) {
  const collection = readCollection();
  const idSet = new Set(collection.presets.map((item) => item.id));
  writeCollection({ ...collection, lastUsedPresetId: id && idSet.has(id) ? id : null });
}

export function savePreset(input: { id?: string; name: string; preset: WarpPreset }): StoredPreset {
  const collection = readCollection();
  const now = nowIso();
  const existing = input.id ? collection.presets.find((item) => item.id === input.id) : undefined;
  const migratedPreset = migratePreset({ ...input.preset, name: input.name });
  const next: StoredPreset = {
    id: existing?.id ?? createId(),
    name: input.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    version: CURRENT_PRESET_SCHEMA_VERSION,
    preset: migratedPreset,
  };
  const presets = existing ? collection.presets.map((item) => (item.id === existing.id ? next : item)) : [next, ...collection.presets];
  writeCollection({ presets, lastUsedPresetId: next.id });
  return next;
}

export function deletePreset(id: string) {
  const collection = readCollection();
  const presets = collection.presets.filter((item) => item.id !== id);
  writeCollection({ presets, lastUsedPresetId: collection.lastUsedPresetId === id ? null : collection.lastUsedPresetId });
}

export function renamePreset(id: string, name: string) {
  const collection = readCollection();
  const now = nowIso();
  writeCollection({
    ...collection,
    presets: collection.presets.map((item) => (item.id === id ? { ...item, name, updatedAt: now } : item)),
  });
}

export function parseImportedPreset(rawText: string): { ok: true; preset: WarpPreset } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawText) as unknown;
    return { ok: true, preset: migratePreset(parsed) };
  } catch (error) {
    console.error('Failed to import preset:', error);
    return { ok: false, error: 'Malformed or unsupported preset JSON.' };
  }
}

export const exportPresetJson = (preset: WarpPreset) => JSON.stringify({ ...migratePreset(preset), schemaVersion: CURRENT_PRESET_SCHEMA_VERSION }, null, 2);
