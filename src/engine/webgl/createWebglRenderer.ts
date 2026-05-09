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
const MAX_POLYGON_POINTS = 6;

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
  const warpDirectionsLocation = gl.getUniformLocation(program, 'uWarpDirections');
  const lineStartsLocation = gl.getUniformLocation(program, 'uLineStarts');
  const lineEndsLocation = gl.getUniformLocation(program, 'uLineEnds');
  const lineWidthsLocation = gl.getUniformLocation(program, 'uLineWidths');
  const operationTypesLocation = gl.getUniformLocation(program, 'uOperationTypes');
  const falloffTypesLocation = gl.getUniformLocation(program, 'uFalloffTypes');
  const enabledOpsLocation = gl.getUniformLocation(program, 'uEnabledOps');
  const polygonPointsLocation = gl.getUniformLocation(program, 'uPolygonPoints');
  const polygonCountsLocation = gl.getUniformLocation(program, 'uPolygonCounts');
  const weightMapTypesLocation = gl.getUniformLocation(program, 'uWeightMapTypes');
  const weightMapCentersLocation = gl.getUniformLocation(program, 'uWeightMapCenters');
  const weightMapRadiiLocation = gl.getUniformLocation(program, 'uWeightMapRadii');

  if (positionLocation < 0 || !videoTextureLocation || !warpCentersLocation || !warpRadiiLocation || !warpStrengthsLocation || !warpAxesLocation || !warpDirectionsLocation || !lineStartsLocation || !lineEndsLocation || !lineWidthsLocation || !operationTypesLocation || !falloffTypesLocation || !enabledOpsLocation || !polygonPointsLocation || !polygonCountsLocation || !weightMapTypesLocation || !weightMapCentersLocation || !weightMapRadiiLocation) {
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
      const warpDirections = new Float32Array(MAX_OPERATIONS * 2);
      const operationTypes = new Int32Array(MAX_OPERATIONS);
      const falloffTypes = new Int32Array(MAX_OPERATIONS);
      const enabledOps = new Int32Array(MAX_OPERATIONS);
      const lineStarts = new Float32Array(MAX_OPERATIONS * 2);
      const lineEnds = new Float32Array(MAX_OPERATIONS * 2);
      const lineWidths = new Float32Array(MAX_OPERATIONS);
      const polygonPoints = new Float32Array(MAX_OPERATIONS * MAX_POLYGON_POINTS * 2);
      const polygonCounts = new Int32Array(MAX_OPERATIONS);
      const weightMapTypes = new Int32Array(MAX_OPERATIONS);
      const weightMapCenters = new Float32Array(MAX_OPERATIONS * 2);
      const weightMapRadii = new Float32Array(MAX_OPERATIONS);

      for (let i = 0; i < MAX_OPERATIONS; i += 1) {
        warpAxes[i * 2] = 1;
        warpAxes[i * 2 + 1] = 1;
        warpDirections[i * 2] = 0;
        warpDirections[i * 2 + 1] = 0;
        operationTypes[i] = 0;
        falloffTypes[i] = 1;
        lineWidths[i] = 0.0001;
        weightMapTypes[i] = 0;
        weightMapCenters[i * 2] = 0.5;
        weightMapCenters[i * 2 + 1] = 0.5;
        weightMapRadii[i] = 0.5;
      }

      if (geometry) {
        const operations = getOperations().filter((operation) => operation.enabled).slice(0, MAX_OPERATIONS);

        operations.forEach((operation, index) => {
          const target = getWarpTargetGeometry(operation.target, geometry);
          const warpCenterX = clamp01(target.center.x);
          const warpCenterY = clamp01(target.center.y);
          const warpRadius = Math.max(FALLBACK_SIZE, target.baseSize) * operation.radius;
          const warpStrength = operation.strength;
          const warpAxisX = Math.max(0.0001, operation.axis.x);
          const warpAxisY = Math.max(0.0001, operation.axis.y);
          const directionX = operation.direction.x;
          const directionY = operation.direction.y;
          const operationType = operation.type === 'directional_warp' ? 1 : operation.type === 'line_warp' ? 2 : operation.type === 'region_warp' ? 3 : 0;
          const falloffType = getFalloffUniformValue(operation.falloff.type);
          const weightMapType = operation.weightMap?.type === 'radial_gradient' ? 1 : 0;

          if (![warpCenterX, warpCenterY, warpRadius, warpStrength, warpAxisX, warpAxisY, directionX, directionY].every(Number.isFinite)) {
            return;
          }

          warpCenters[index * 2] = warpCenterX;
          warpCenters[index * 2 + 1] = warpCenterY;
          warpRadii[index] = warpRadius;
          warpStrengths[index] = warpStrength;
          warpAxes[index * 2] = warpAxisX;
          warpAxes[index * 2 + 1] = warpAxisY;
          warpDirections[index * 2] = directionX;
          warpDirections[index * 2 + 1] = directionY;
          operationTypes[index] = operationType;
          falloffTypes[index] = falloffType;
          enabledOps[index] = 1;
          lineStarts[index * 2] = clamp01(operation.lineStart.x);
          lineStarts[index * 2 + 1] = clamp01(operation.lineStart.y);
          lineEnds[index * 2] = clamp01(operation.lineEnd.x);
          lineEnds[index * 2 + 1] = clamp01(operation.lineEnd.y);
          lineWidths[index] = Math.max(0.0001, operation.width);
          const pointCount = Math.min(MAX_POLYGON_POINTS, operation.polygon.length);
          polygonCounts[index] = pointCount;
          weightMapTypes[index] = weightMapType;
          weightMapCenters[index * 2] = clamp01(operation.weightMap?.center.x ?? 0.5);
          weightMapCenters[index * 2 + 1] = clamp01(operation.weightMap?.center.y ?? 0.5);
          weightMapRadii[index] = Math.max(0.0001, operation.weightMap?.radius ?? 0.5);
          for (let p = 0; p < pointCount; p += 1) {
            const point = operation.polygon[p];
            const base = (index * MAX_POLYGON_POINTS + p) * 2;
            polygonPoints[base] = clamp01(point.x);
            polygonPoints[base + 1] = clamp01(point.y);
          }
        });
      }

      gl.uniform1i(videoTextureLocation, 0);
      gl.uniform2fv(warpCentersLocation, warpCenters);
      gl.uniform1fv(warpRadiiLocation, warpRadii);
      gl.uniform1fv(warpStrengthsLocation, warpStrengths);
      gl.uniform2fv(warpAxesLocation, warpAxes);
      gl.uniform2fv(warpDirectionsLocation, warpDirections);
      gl.uniform1iv(operationTypesLocation, operationTypes);
      gl.uniform1iv(falloffTypesLocation, falloffTypes);
      gl.uniform1iv(enabledOpsLocation, enabledOps);
      gl.uniform2fv(lineStartsLocation, lineStarts);
      gl.uniform2fv(lineEndsLocation, lineEnds);
      gl.uniform1fv(lineWidthsLocation, lineWidths);
      gl.uniform2fv(polygonPointsLocation, polygonPoints);
      gl.uniform1iv(polygonCountsLocation, polygonCounts);
      gl.uniform1iv(weightMapTypesLocation, weightMapTypes);
      gl.uniform2fv(weightMapCentersLocation, weightMapCenters);
      gl.uniform1fv(weightMapRadiiLocation, weightMapRadii);
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
