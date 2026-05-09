import type { WarpPreset } from '@types/preset';

export type PipelineState = {
  status: 'idle' | 'ready';
  activePreset: WarpPreset;
};

export const createInitialPipelineState = (preset: WarpPreset): PipelineState => ({
  status: 'ready',
  activePreset: preset,
});
