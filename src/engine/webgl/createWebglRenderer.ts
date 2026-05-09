import fullscreenVertexShader from './shaders/fullscreen.vert.glsl?raw';
import videoFragmentShader from './shaders/video.frag.glsl?raw';
import { createShaderProgram } from './utils/createShaderProgram';
import { createTexture } from './utils/createTexture';

export type WebglRendererState = 'idle' | 'running' | 'stopped';

export type WebglRenderer = {
  start: () => void;
  stop: () => void;
  getState: () => WebglRendererState;
};

type CreateWebglRendererOptions = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
};

export function createWebglRenderer({ video, canvas }: CreateWebglRendererOptions): WebglRenderer {
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    throw new Error('WebGL2 context is not available.');
  }

  const program = createShaderProgram(gl, fullscreenVertexShader, videoFragmentShader);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const videoTextureLocation = gl.getUniformLocation(program, 'u_videoTexture');

  if (positionLocation < 0 || !videoTextureLocation) {
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
      gl.uniform1i(videoTextureLocation, 0);
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
