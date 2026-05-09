export type CameraErrorCode = 'permission-denied' | 'no-camera-found' | 'unsupported-browser' | 'unknown';

export type CameraError = {
  code: CameraErrorCode;
  message: string;
};

export type CameraController = {
  start: (constraints?: MediaStreamConstraints) => Promise<MediaStream>;
  stop: () => void;
  getStream: () => MediaStream | null;
};

function toCameraError(error: unknown): CameraError {
  if (!(error instanceof Error)) {
    return { code: 'unknown', message: 'Unknown camera error.' };
  }

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return { code: 'permission-denied', message: 'Camera permission was denied.' };
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return { code: 'no-camera-found', message: 'No camera device was found.' };
  }

  return { code: 'unknown', message: error.message || 'Unknown camera error.' };
}

export function createCameraController(): CameraController {
  let stream: MediaStream | null = null;

  const stop = () => {
    if (!stream) {
      return;
    }

    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  };

  const start = async (constraints: MediaStreamConstraints = { video: true, audio: false }) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw {
        code: 'unsupported-browser',
        message: 'This browser does not support camera APIs.',
      } satisfies CameraError;
    }

    stop();

    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      throw toCameraError(error);
    }
  };

  const getStream = () => stream;

  return { start, stop, getStream };
}
