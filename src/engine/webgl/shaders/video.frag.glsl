#version 300 es
precision mediump float;

uniform sampler2D uVideoTexture;
uniform vec2 uWarpCenter;
uniform float uWarpRadius;
uniform float uWarpStrength;
uniform vec2 uWarpAxis;
uniform int uFalloffType;

in vec2 v_uv;
out vec4 outColor;

float getFalloff(float normalizedDistance, int falloffType) {
  float t = clamp(1.0 - normalizedDistance, 0.0, 1.0);

  if (falloffType == 0) {
    return t;
  }

  if (falloffType == 1) {
    return t * t * (3.0 - 2.0 * t);
  }

  float sigma = 0.35;
  return exp(-0.5 * pow(normalizedDistance / sigma, 2.0));
}

void main() {
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  vec2 axis = max(uWarpAxis, vec2(0.0001));
  vec2 delta = uv - uWarpCenter;
  vec2 scaled = vec2(delta.x / axis.x, delta.y / axis.y);
  float distance = length(scaled);

  vec2 warpedUv = uv;
  if (uWarpRadius > 0.0 && distance <= uWarpRadius) {
    float normalizedDistance = distance / uWarpRadius;
    float influence = getFalloff(normalizedDistance, uFalloffType);
    vec2 displacement = delta * (uWarpStrength * influence);
    warpedUv = clamp(uv - displacement, 0.0, 1.0);
  }

  outColor = texture(uVideoTexture, warpedUv);
}
