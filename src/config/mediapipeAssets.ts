export const MEDIAPIPE_TASKS_VISION_VERSION = '0.10.22';

export const MEDIAPIPE_WASM_BASE_URL =
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;

// NOTE:
// MediaPipe model CDN path includes an explicit numeric version segment (`.../float16/1/...`),
// so this URL is pinned and does not depend on `latest`.
export const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
