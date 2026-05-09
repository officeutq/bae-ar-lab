import fullscreenVertexShader from './shaders/fullscreen.vert.glsl?raw';
import videoFragmentShader from './shaders/video.frag.glsl?raw';
import { createShaderProgram } from './utils/createShaderProgram';
import { createTexture } from './utils/createTexture';
import type { WarpOperation } from '@app-types/preset';
import type { FaceGeometry } from '@engine/geometry/types';
import { getWarpTargetGeometry } from '@engine/render/getWarpTargetGeometry';

export type WebglRendererState = 'idle' | 'running' | 'stopped';

export type WebglRenderer = {
  start: () => void;
  stop: () => void;
  getState: () => WebglRendererState;
};

type CreateWebglRendererOptions = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  getOperations: () => WarpOperation[];
  getFaceGeometry: () => FaceGeometry | null;
};

const FALLBACK_SIZE = 0.05;
const MAX_OPERATIONS = 8;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getFalloffUniformValue(type: WarpOperation['falloff']['type']) {
  if (type === 'linear') return 0;
  if (type === 'smoothstep') return 1;
  return 2;
}

export function createWebglRenderer({ video, canvas, getOperations, getFaceGeometry }: CreateWebglRendererOptions): WebglRenderer {
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    throw new Error('WebGL2 context is not available.');
  }

  const program = createShaderProgram(gl, fullscreenVertexShader, videoFragmentShader);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const videoTextureLocation = gl.getUniformLocation(program, 'uVideoTexture');
  const warpCentersLocation = gl.getUniformLocation(program, 'uWarpCenters');
  const warpRadiiLocation = gl.getUniformLocation(program, 'uWarpRadii');
  const warpStrengthsLocation = gl.getUniformLocation(program, 'uWarpStrengths');
  const warpAxesLocation = gl.getUniformLocation(program, 'uWarpAxes');
  const falloffTypesLocation = gl.getUniformLocation(program, 'uFalloffTypes');
  const enabledOpsLocation = gl.getUniformLocation(program, 'uEnabledOps');

  if (positionLocation < 0 || !videoTextureLocation || !warpCentersLocation || !warpRadiiLocation || !warpStrengthsLocation || !warpAxesLocation || !falloffTypesLocation || !enabledOpsLocation) {
    gl.deleteProgram(program);
    throw new Error('Failed to resolve shader attributes or uniforms.');
  }

  const vao = gl.createVertexArray();
  const vertexBuffer = gl.createBuffer();

  if (!vao || !vertexBuffer) {
    gl.deleteProgram(program);
    throw new Error('Failed to allocate fullscreen quad buffers.');
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
  ]), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const videoTexture = createTexture(gl);

  let animationFrameId: number | null = null;
  let state: WebglRendererState = 'idle';

  const syncCanvasSize = () => {
    const { videoWidth, videoHeight } = video;

    if (videoWidth === 0 || videoHeight === 0) {
      return false;
    }

    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    return true;
  };

  const renderFrame = () => {
    if (state !== 'running') {
      return;
    }

    if (syncCanvasSize()) {
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

      const geometry = getFaceGeometry();
      const warpCenters = new Float32Array(MAX_OPERATIONS * 2);
      const warpRadii = new Float32Array(MAX_OPERATIONS);
      const warpStrengths = new Float32Array(MAX_OPERATIONS);
      const warpAxes = new Float32Array(MAX_OPERATIONS * 2);
      const falloffTypes = new Int32Array(MAX_OPERATIONS);
      const enabledOps = new Int32Array(MAX_OPERATIONS);

      for (let i = 0; i < MAX_OPERATIONS; i += 1) {
        warpAxes[i * 2] = 1;
        warpAxes[i * 2 + 1] = 1;
        falloffTypes[i] = 1;
      }

      if (geometry) {
        const operations = getOperations().filter((operation) => operation.enabled && operation.type === 'radial_warp').slice(0, MAX_OPERATIONS);

        operations.forEach((operation, index) => {
          const target = getWarpTargetGeometry(operation.target, geometry);
          const warpCenterX = clamp01(target.center.x);
          const warpCenterY = clamp01(target.center.y);
          const warpRadius = Math.max(FALLBACK_SIZE, target.baseSize) * operation.radius;
          const warpStrength = operation.strength;
          const warpAxisX = Math.max(0.0001, operation.axis.x);
          const warpAxisY = Math.max(0.0001, operation.axis.y);
          const falloffType = getFalloffUniformValue(operation.falloff.type);

          if (![warpCenterX, warpCenterY, warpRadius, warpStrength, warpAxisX, warpAxisY].every(Number.isFinite)) {
            return;
          }

          warpCenters[index * 2] = warpCenterX;
          warpCenters[index * 2 + 1] = warpCenterY;
          warpRadii[index] = warpRadius;
          warpStrengths[index] = warpStrength;
          warpAxes[index * 2] = warpAxisX;
          warpAxes[index * 2 + 1] = warpAxisY;
          falloffTypes[index] = falloffType;
          enabledOps[index] = 1;
        });
      }

      gl.uniform1i(videoTextureLocation, 0);
      gl.uniform2fv(warpCentersLocation, warpCenters);
      gl.uniform1fv(warpRadiiLocation, warpRadii);
      gl.uniform1fv(warpStrengthsLocation, warpStrengths);
      gl.uniform2fv(warpAxesLocation, warpAxes);
      gl.uniform1iv(falloffTypesLocation, falloffTypes);
      gl.uniform1iv(enabledOpsLocation, enabledOps);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
    }

    animationFrameId = window.requestAnimationFrame(renderFrame);
  };

  const start = () => {
    if (state === 'running') {
      return;
    }

    state = 'running';
    animationFrameId = window.requestAnimationFrame(renderFrame);
  };

  const stop = () => {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    state = 'stopped';
  };

  const getState = () => state;

  return { start, stop, getState };
}
