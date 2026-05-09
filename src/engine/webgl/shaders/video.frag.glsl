#version 300 es
precision mediump float;

uniform sampler2D uVideoTexture;
const int MAX_OPERATIONS = 8;
const int MAX_POLYGON_POINTS = 6;
uniform vec2 uWarpCenters[MAX_OPERATIONS];
uniform float uWarpRadii[MAX_OPERATIONS];
uniform float uWarpStrengths[MAX_OPERATIONS];
uniform vec2 uWarpAxes[MAX_OPERATIONS];
uniform vec2 uWarpDirections[MAX_OPERATIONS];
uniform vec2 uLineStarts[MAX_OPERATIONS];
uniform vec2 uLineEnds[MAX_OPERATIONS];
uniform float uLineWidths[MAX_OPERATIONS];
uniform int uOperationTypes[MAX_OPERATIONS];
uniform int uFalloffTypes[MAX_OPERATIONS];
uniform int uEnabledOps[MAX_OPERATIONS];
uniform vec2 uPolygonPoints[MAX_OPERATIONS * MAX_POLYGON_POINTS];
uniform int uPolygonCounts[MAX_OPERATIONS];

in vec2 v_uv;
out vec4 outColor;

float getFalloff(float normalizedDistance, int falloffType) {
  float t = clamp(1.0 - normalizedDistance, 0.0, 1.0);
  if (falloffType == 0) return t;
  if (falloffType == 1) return t * t * (3.0 - 2.0 * t);
  float sigma = 0.35;
  return exp(-0.5 * pow(normalizedDistance / sigma, 2.0));
}

void main() {
  vec2 warpedUv = vec2(v_uv.x, 1.0 - v_uv.y);

  for (int i = 0; i < MAX_OPERATIONS; i++) {
    if (uEnabledOps[i] == 0) continue;

    float normalizedDistance = 2.0;
    vec2 delta = vec2(0.0);
    if (uOperationTypes[i] == 2) {
      vec2 a = uLineStarts[i];
      vec2 b = uLineEnds[i];
      vec2 ab = b - a;
      float denom = max(dot(ab, ab), 0.000001);
      float t = clamp(dot(warpedUv - a, ab) / denom, 0.0, 1.0);
      vec2 p = a + ab * t;
      float lineDistance = length(warpedUv - p);
      normalizedDistance = lineDistance / max(0.0001, uLineWidths[i]);
    } else if (uOperationTypes[i] == 3) {
      int count = uPolygonCounts[i];
      bool inside = true;
      float minDistance = 1000.0;
      for (int p = 0; p < MAX_POLYGON_POINTS; p++) {
        if (p >= count) break;
        vec2 a = uPolygonPoints[i * MAX_POLYGON_POINTS + p];
        vec2 b = uPolygonPoints[i * MAX_POLYGON_POINTS + ((p + 1) % count)];
        vec2 ab = b - a;
        float cross = ab.x * (warpedUv.y - a.y) - ab.y * (warpedUv.x - a.x);
        if (cross < -0.00001) inside = false;
        float denom = max(dot(ab, ab), 0.000001);
        float t = clamp(dot(warpedUv - a, ab) / denom, 0.0, 1.0);
        vec2 proj = a + ab * t;
        minDistance = min(minDistance, length(warpedUv - proj));
      }
      normalizedDistance = inside ? 0.0 : (minDistance / max(0.0001, uLineWidths[i]));
    } else {
      vec2 axis = max(uWarpAxes[i], vec2(0.0001));
      delta = warpedUv - uWarpCenters[i];
      vec2 scaled = vec2(delta.x / axis.x, delta.y / axis.y);
      float distance = length(scaled);
      if (uWarpRadii[i] > 0.0) {
        normalizedDistance = distance / uWarpRadii[i];
      }
    }

    if (normalizedDistance <= 1.0) {
      float influence = getFalloff(normalizedDistance, uFalloffTypes[i]);
      if (uOperationTypes[i] == 1 || uOperationTypes[i] == 2 || uOperationTypes[i] == 3) {
        warpedUv = clamp(warpedUv + uWarpDirections[i] * (uWarpStrengths[i] * influence), 0.0, 1.0);
      } else {
        vec2 displacement = delta * (uWarpStrengths[i] * influence);
        warpedUv = clamp(warpedUv - displacement, 0.0, 1.0);
      }
    }
  }

  outColor = texture(uVideoTexture, warpedUv);
}
