import { useEffect, useRef } from 'react';

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// A fragment shader painted over the whole of a canvas, fed the two uniforms the
// immersive backgrounds read: `u_res` (drawing-buffer size) and `u_time`
// (seconds). Raw WebGL — no libraries. Returns the ref for the <canvas>.
//
// `scale` is how much of the CSS resolution is actually rendered: everything
// drawn with this is soft, and a soft image loses nothing to the browser's
// upscale. `fps` caps how often a frame is drawn — a background that moves a
// few pixels a second looks the same at 30 frames as at 120.
export default function useFragmentShader(frag, { scale = 0.75, fps = 60, label = 'shader' } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    // no WebGL: the CSS gradient behind the canvas stays visible instead
    if (!gl) return undefined;

    // An opaque canvas that never draws is not guaranteed to be see-through, so
    // a shader that fails takes the canvas out rather than leaving it over the
    // CSS fallback.
    const fail = (what, log) => {
      console.error(`[${label}] ${what}:`, log);
      canvas.style.display = 'none';
    };

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        fail('shader failed', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = vs && compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return undefined;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      fail('link failed', gl.getProgramInfoLog(prog));
      return undefined;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    // With reduced motion the background is one still frame, always the same one.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    const draw = (now) => {
      gl.uniform1f(uTime, reduced ? 0 : (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const resize = () => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      // Resizing clears the drawing buffer, and with reduced motion there is no
      // next frame coming to repaint it.
      draw(performance.now());
    };
    resize();
    window.addEventListener('resize', resize);

    const interval = 1000 / fps;
    let last = -Infinity;
    let raf;
    const frame = (now) => {
      // rAF timestamps land a little either side of the vsync; without the slack
      // a 30 fps cap on a 60 Hz screen would skip frames it should draw
      if (now - last >= interval - 2) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(frame);
    };
    if (!reduced) raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      // Deliberately not calling loseContext(): getContext() hands back the same
      // context object on a remount, so killing it here left StrictMode's second
      // mount with a dead context on which no shader can compile.
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [frag, scale, fps, label]);

  return ref;
}
