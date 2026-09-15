import useFragmentShader from './useFragmentShader';

// Behind the AI conversation: a few pools of the clouds' own colours drifting on
// long, slow orbits over the same pale sky. Calmer than the clouds on purpose —
// nothing in it has an edge or a shape the eye can follow, so it stays out of
// the way of someone reading, and thinking about their mother.
//
// The clouds are kept in CloudBackground; `?bg=clouds` swaps them back in.
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

// the cloud shader's sky and cloud colours, so the two read as one family
const vec3 CREAM    = vec3(1.000, 0.918, 0.820);
const vec3 ROSE     = vec3(0.929, 0.859, 0.859);
const vec3 POWDER   = vec3(0.706, 0.788, 0.906);
const vec3 PEACH    = vec3(1.000, 0.835, 0.690);
const vec3 LAVENDER = vec3(0.835, 0.815, 0.905);
const vec3 LIGHT    = vec3(1.000, 0.984, 0.965);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Where a pool is at time t: an ellipse around its home, each axis on its own
// period, so no two pools ever fall into step and the loop is never noticed.
vec2 orbit(vec2 home, vec2 reach, vec2 speed, float phase, float t) {
  return home + reach * vec2(sin(t * speed.x + phase), cos(t * speed.y + phase * 1.7));
}

// A soft pool of colour: full strength at its centre, gone long before it has
// an edge anyone could trace.
vec3 pool(vec3 base, vec2 p, vec2 centre, float radius, vec3 colour, float strength) {
  vec2 d = p - centre;
  return mix(base, colour, exp(-dot(d, d) / (radius * radius)) * strength);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time;

  // the sky the clouds sat in: warm cream low down, powder blue up top
  vec3 col = mix(CREAM, ROSE, smoothstep(0.0, 0.55, uv.y));
  col = mix(col, POWDER, smoothstep(0.5, 1.1, uv.y));

  // a slow warp, so the pools swell and lean instead of sliding about as circles
  vec2 q = p + 0.26 * (vec2(
    noise(p * 0.9 + vec2(t * 0.045, 1.3)),
    noise(p * 0.9 + vec2(5.2, -t * 0.037))
  ) - 0.5);

  col = pool(col, q, orbit(vec2(0.74 * aspect, 0.26), vec2(0.26, 0.14), vec2(0.105, 0.078), 0.0, t), 0.58, PEACH, 0.80);
  col = pool(col, q, orbit(vec2(0.18 * aspect, 0.82), vec2(0.24, 0.12), vec2(0.090, 0.122), 2.1, t), 0.64, POWDER, 0.75);
  col = pool(col, q, orbit(vec2(0.22 * aspect, 0.30), vec2(0.20, 0.16), vec2(0.128, 0.086), 4.0, t), 0.52, ROSE, 0.70);
  col = pool(col, q, orbit(vec2(0.84 * aspect, 0.78), vec2(0.20, 0.12), vec2(0.074, 0.110), 1.2, t), 0.56, LAVENDER, 0.70);
  // the middle is where she reads, so it is the one place kept lightest
  col = pool(col, q, orbit(vec2(0.50 * aspect, 0.55), vec2(0.14, 0.08), vec2(0.061, 0.097), 3.3, t), 0.46, LIGHT, 0.35);

  // pale like the sky: the conversation's text and glass were tuned against it
  col = mix(col, vec3(1.0), 0.02);

  // Eight bits of pastel across a whole screen band visibly. A fixed half-step
  // of noise breaks the bands up, and being fixed it never shimmers.
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function GradientBackground() {
  // No detail anywhere, so half resolution loses nothing, and motion this slow
  // needs no more than 30 frames.
  const ref = useFragmentShader(FRAG, { scale: 0.5, fps: 30, label: 'gradient' });
  return <canvas ref={ref} className="imm-canvas" aria-hidden="true" />;
}
