precision mediump float;

uniform sampler2D tex;
uniform vec2 resolution;
uniform float time;
uniform float amount;
uniform float size;

varying vec2 vTexCoord;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// FBM lento: mappa di intensità — zone calde/fredde di interferenza
float intensityMap(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vTexCoord;
  vec4 color = texture2D(tex, uv);

  // Mappa di intensità: si muove lentamente, scala grande = patch larghe
  float mapScale = 4.5; // più piccolo = zone più larghe — CAMBIA QUI
  float mapSpeed = 0.05; // velocità evoluzione nel tempo
  float localIntensity = intensityMap(uv * mapScale + time * mapSpeed);

  // Rimappa 0..1 → 0..1 con contrasto per avere zone chiare e scure nette
  localIntensity = smoothstep(0.3, 0.7, localIntensity);

  // Grana fine: cella piccola, animata velocemente
  vec2 cell = uv * resolution / size;
  float grain = hash(cell + time);
  float noise_val = (grain - 0.5) * amount * localIntensity;

  gl_FragColor = vec4(clamp(color.rgb + noise_val, 0.0, 1.0), color.a);
}
