#version 300 es
precision mediump float;

uniform sampler2D u_videoTexture;
in vec2 v_uv;
out vec4 outColor;

void main() {
  vec2 sampledUv = vec2(v_uv.x, 1.0 - v_uv.y);
  outColor = texture(u_videoTexture, sampledUv);
}
