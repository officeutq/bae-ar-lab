export type WarpPreset = {
  id: string;
  name: string;
  version: string;
  params: {
    intensity: number;
    smoothness: number;
    falloff: 'linear' | 'smoothstep';
  };
};
