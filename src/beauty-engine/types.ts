import type { WarpPreset } from '@app-types/preset';
import type { FaceFrameAnalysis } from './analysis';
import type { CurrentFaceSnapshot } from './face';
import type { FaceLandmarkerAdapter } from './mediapipe';

export type BeautyPreset = WarpPreset;

export type BeautyEngineLifecycleState = 'idle' | 'running' | 'stopped' | 'disposed';

export type BeautyEngineInputSource =
  | HTMLVideoElement
  | HTMLCanvasElement
  | ImageBitmap
  | OffscreenCanvas;

export type BeautyEngineOutputTarget = HTMLCanvasElement | OffscreenCanvas;

export type BeautyEngineInput = {
  source: BeautyEngineInputSource;
  output?: BeautyEngineOutputTarget;
};

export type BeautyEngineFrameInput = {
  video: HTMLVideoElement;
  timestamp: number;
};

export type BeautyEngineOptions = {
  initialPreset?: BeautyPreset;
  initialIdealFace?: IdealFace;
  initialCorrectionStrength?: number;
  clock?: () => number;
  faceLandmarkerAdapter?: FaceLandmarkerAdapter;
};

export type IdealFaceLandmark = {
  x: number;
  y: number;
  z?: number;
};

export type IdealFaceRegion =
  | 'face'
  | 'left_eye'
  | 'right_eye'
  | 'nose'
  | 'mouth'
  | 'jaw'
  | 'left_cheek'
  | 'right_cheek';

export type IdealFace = {
  schemaVersion: number;
  id: string;
  name: string;
  landmarks?: IdealFaceLandmark[];
  regions?: Partial<Record<IdealFaceRegion, IdealFaceLandmark[]>>;
};

export type BeautyEngineRuntimeSnapshot = {
  state: BeautyEngineLifecycleState;
  lifecycleState: BeautyEngineLifecycleState;
  hasInput: boolean;
  hasPreset: boolean;
  hasIdealFace: boolean;
  presetId: string | null;
  idealFaceId: string | null;
  correctionStrength: number;
  inputAttached: boolean;
  outputAttached: boolean;
  startedAtMs: number | null;
  stoppedAtMs: number | null;
  disposedAtMs: number | null;
  currentFace: CurrentFaceSnapshot;
  errors: string[];
};

export type BeautyEngine = {
  start(input: BeautyEngineInput): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  analyzeFrame(input: BeautyEngineFrameInput): Promise<FaceFrameAnalysis | null>;
  setPreset(preset: BeautyPreset): void;
  setIdealFace(idealFace: IdealFace): void;
  setCorrectionStrength(strength: number): void;
  getRuntimeSnapshot(): BeautyEngineRuntimeSnapshot;
};
