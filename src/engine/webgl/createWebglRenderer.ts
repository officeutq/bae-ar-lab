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
  getActiveOperation: () => WarpOperation | null;
  getFaceGeometry: () => FaceGeometry | null;
};

const FALLBACK_SIZE = 0.05;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getFalloffUniformValue(type: WarpOperation['falloff']['type']) {
  if (type === 'linear') return 0;
  if (type === 'smoothstep') return 1;
  return 2;
}

export function createWebglRenderer({ video, canvas, getActiveOperation, getFaceGeometry }: CreateWebglRendererOptions): WebglRenderer {
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    throw new Error('WebGL2 context is not available.');
  }

  const program = createShaderProgram(gl, fullscreenVertexShader, videoFragmentShader);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const videoTextureLocation = gl.getUniformLocation(program, 'uVideoTexture');
  const warpCenterLocation = gl.getUniformLocation(program, 'uWarpCenter');
  const warpRadiusLocation = gl.getUniformLocation(program, 'uWarpRadius');
  const warpStrengthLocation = gl.getUniformLocation(program, 'uWarpStrength');
  const warpAxisLocation = gl.getUniformLocation(program, 'uWarpAxis');
  const falloffTypeLocation = gl.getUniformLocation(program, 'uFalloffType');

  if (positionLocation < 0 || !videoTextureLocation || !warpCenterLocation || !warpRadiusLocation || !warpStrengthLocation || !warpAxisLocation || !falloffTypeLocation) {
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

      const operation = getActiveOperation();
      const geometry = getFaceGeometry();
      const target = operation?.enabled && geometry ? getWarpTargetGeometry(operation.target, geometry) : null;
      const warpCenterX = target ? clamp01(target.center.x) : 0.5;
      const warpCenterY = target ? clamp01(target.center.y) : 0.5;
      const warpRadius = target && operation ? Math.max(FALLBACK_SIZE, target.baseSize) * operation.radius : 0;
      const warpStrength = operation?.enabled ? operation.strength : 0;
      const warpAxisX = operation?.enabled ? Math.max(0.0001, operation.axis.x) : 1;
      const warpAxisY = operation?.enabled ? Math.max(0.0001, operation.axis.y) : 1;
      const falloffType = operation?.enabled ? getFalloffUniformValue(operation.falloff.type) : 1;

      if (![warpCenterX, warpCenterY, warpRadius, warpStrength, warpAxisX, warpAxisY].every(Number.isFinite)) {
        throw new Error('Invalid warp uniform values detected.');
      }

      gl.uniform1i(videoTextureLocation, 0);
      gl.uniform2f(warpCenterLocation, warpCenterX, warpCenterY);
      gl.uniform1f(warpRadiusLocation, warpRadius);
      gl.uniform1f(warpStrengthLocation, warpStrength);
      gl.uniform2f(warpAxisLocation, warpAxisX, warpAxisY);
      gl.uniform1i(falloffTypeLocation, falloffType);
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
