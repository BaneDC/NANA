import useFragmentShader from './useFragmentShader';

// Fullscreen fragment-shader clouds: domain-warped fbm noise drifting very slowly
// through a pale golden-hour sky. Raw WebGL — no libraries.
//
// Kept, not retired: the AI conversation moved to GradientBackground, but the
// immersive questionnaire still sits in these clouds, and `?bg=clouds` puts them
// back behind the conversation too.
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

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

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time * 0.015;

  // pale golden-hour sky: warm cream at the horizon, powder blue up top
  vec3 zenith  = vec3(0.706, 0.788, 0.906);
  vec3 midtone = vec3(0.929, 0.859, 0.859);
  vec3 horizon = vec3(1.000, 0.918, 0.820);
  vec3 sky = mix(horizon, midtone, smoothstep(0.0, 0.45, uv.y));
  sky = mix(sky, zenith, smoothstep(0.4, 1.0, uv.y));

  // a low, soft sun — a glow, not a disc
  vec2 sunP = vec2(aspect * 0.62, 0.22);
  float d = distance(p, sunP);
  sky += vec3(1.0, 0.86, 0.66) * exp(-d * d * 3.5) * 0.22;
  sky += vec3(1.0, 0.80, 0.55) * exp(-d * d * 22.0) * 0.16;

  // two cloud layers, domain-warped so they billow instead of scroll
  vec2 drift = vec2(t, t * 0.15);
  vec2 q = vec2(
    fbm(p * 1.6 + drift * 0.7),
    fbm(p * 1.6 + vec2(4.7, 2.3) - drift * 0.4)
  );
  float f1 = fbm(p * 2.1 + q * 0.85 + drift);
  float f2 = fbm(p * 3.4 - q * 0.5 + drift * 1.6 + vec2(8.1, 3.7));
  float cl = smoothstep(0.40, 0.72, f1 * 0.72 + f2 * 0.38);

  vec3 cloudLit  = vec3(1.000, 0.984, 0.965);
  vec3 cloudCore = vec3(0.851, 0.831, 0.867);
  vec3 cloud = mix(cloudLit, cloudCore, smoothstep(0.48, 0.92, f1));
  cloud += vec3(0.12, 0.065, 0.02) * exp(-d * d * 2.6); // warm kiss near the sun

  vec3 col = mix(sky, cloud, cl * 0.92);

  // keep everything pale: lift toward white, vignette only barely
  col = mix(col, vec3(1.0), 0.03);
  float vig = smoothstep(1.35, 0.55, length(uv - 0.5));
  col *= mix(0.96, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function CloudBackground() {
  // clouds are soft — render at reduced resolution, the browser upscales
  const ref = useFragmentShader(FRAG, { scale: 0.75, label: 'clouds' });
  return <canvas ref={ref} className="imm-canvas" aria-hidden="true" />;
}
