/*
 * MicroSlats — fondo animado de la sección 04 // METODOLOGÍA.
 * Port sin React ni OGL (WebGL2 directo) del componente "Micro Slats" de React Bits,
 * con la configuración del demo: preset Signal, color #d3ccda, glint #ffffff, fondo #120f17.
 *
 * Ahorro frente a la versión React:
 *  - No crea el contexto WebGL hasta que la sección aparece en pantalla.
 *  - Solo dibuja mientras la sección está visible (IntersectionObserver + pestaña activa).
 *  - En celular y tablet: sin simulación de fluido (la del cursor), máx. 1.5x de resolución y 30 fps.
 *  - Sin aceleración gráfica (WebGL por software): un solo cuadro estático.
 *  - Sin WebGL2: se queda el color de fondo sólido.
 */
(function () {
  'use strict';

  const SETTINGS = {
    color: [0xd3 / 255, 0xcc / 255, 0xda / 255],
    glintColor: [1, 1, 1],
    backgroundColor: [0x12 / 255, 0x0f / 255, 0x17 / 255, 1],
    slatWidth: 10, slatHeight: 25, gap: 3, roundness: 0.75,
    scale: 0.85, speed: 1.2, direction: 180, chop: 0.6, stretch: 0.85,
    glint: 0.25, contrast: 1.2, perspective: 0, fog: 0,
    cursorStrength: 1, cursorSize: 40, trail: 1.4, lean: 0,
    introDuration: 1.5
  };

  const FLUID_SIZE = 96;
  const PRESSURE_STEPS = 16;
  const SPLAT_FORCE = 6900;
  const SPLASH_JETS = 3;
  const PIXEL_BUDGET = 4.5e6;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  const passVertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const fluidVertex = `#version 300 es
in vec2 position;
uniform vec2 uTexel;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
void main() {
  vUv = position * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0); vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y); vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const fluidHead = `#version 300 es
precision highp float;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 fragColor;
`;

  const splatFragment = fluidHead + `
uniform sampler2D uTarget; uniform float uAspect; uniform vec2 uPoint; uniform vec3 uValue; uniform float uRadius;
void main() {
  vec2 offset = vUv - uPoint; offset.x *= uAspect;
  float falloff = exp(-dot(offset, offset) / uRadius);
  fragColor = vec4(texture(uTarget, vUv).xyz + uValue * falloff, 1.0);
}`;

  const divergenceFragment = fluidHead + `
uniform sampler2D uVelocity;
void main() {
  vec2 middle = texture(uVelocity, vUv).xy;
  float left = vL.x < 0.0 ? -middle.x : texture(uVelocity, vL).x;
  float right = vR.x > 1.0 ? -middle.x : texture(uVelocity, vR).x;
  float top = vT.y > 1.0 ? -middle.y : texture(uVelocity, vT).y;
  float bottom = vB.y < 0.0 ? -middle.y : texture(uVelocity, vB).y;
  fragColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
}`;

  const pressureFragment = fluidHead + `
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main() {
  float left = texture(uPressure, vL).x; float right = texture(uPressure, vR).x;
  float top = texture(uPressure, vT).x; float bottom = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((left + right + top + bottom - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

  const projectFragment = fluidHead + `
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main() {
  float left = texture(uPressure, vL).x; float right = texture(uPressure, vR).x;
  float top = texture(uPressure, vT).x; float bottom = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(right - left, top - bottom);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

  const advectFragment = fluidHead + `
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 uTexel; uniform float uDt; uniform float uFade;
void main() {
  vec2 from = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  fragColor = texture(uSource, from) / (1.0 + uFade * uDt);
}`;

  const scaleFragment = fluidHead + `
uniform sampler2D uSource; uniform float uValue;
void main() { fragColor = texture(uSource, vUv) * uValue; }`;

  const fieldFragment = `#version 300 es
precision highp float;
uniform vec2 uSize; uniform vec4 uGrid; uniform vec2 uOrigin; uniform vec2 uSlat;
uniform float uTime; uniform float uScale; uniform float uDirection; uniform float uChop; uniform float uStretch;
uniform float uGlint; uniform float uContrast; uniform float uPerspective; uniform float uFog; uniform float uIntro;
uniform sampler2D tVelocity; uniform sampler2D tInk; uniform vec2 uFluidTexel;
uniform float uFluid; uniform float uInk; uniform float uLean;
out vec4 fragColor;
const float TURN[4] = float[4](0.0, -0.95, 0.78, 1.62);
const float LENGTH[4] = float[4](2.6, 1.7, 1.12, 0.76);
const float HEIGHT[4] = float[4](1.0, 0.75, 0.5, 0.3);
const float SHIFT[4] = float[4](0.0, 2.3, 4.1, 1.1);
void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  float row = uGrid.y - 1.0 - cell.y;
  vec2 center = uOrigin + vec2(cell.x, row) * uGrid.zw + uSlat * 0.5;
  float v = clamp(center.y / uSize.y, 0.0, 1.0);
  vec2 flow = vec2(0.0); float ink = 0.0;
  if (uFluid > 0.5) {
    vec2 fluidUv = clamp(vec2(center.x / uSize.x, 1.0 - center.y / uSize.y), 0.0, 1.0);
    flow = texture(tVelocity, fluidUv).xy * uFluidTexel * uSize;
    ink = texture(tInk, fluidUv).x;
  }
  float horizon = mix(8.0, 0.5, uPerspective);
  float depth = (1.0 + horizon) / (v + horizon);
  vec2 world = vec2((center.x - uSize.x * 0.5) / uSize.y * depth, (depth - 1.0) * horizon * 2.2);
  world -= flow * 0.00018 * depth;
  world /= max(uScale, 0.05);
  float meander = 0.55 * sin(dot(world, vec2(0.23, 0.41)) * 0.9 + uTime * 0.13)
    + 0.3 * sin(dot(world, vec2(-0.37, 0.19)) * 1.4 - uTime * 0.09);
  float steep = uChop * 0.45; float height = 0.0; float total = 0.0;
  for (int i = 0; i < 4; i++) {
    float angle = uDirection + TURN[i];
    vec2 heading = vec2(cos(angle), sin(angle));
    float k = 6.2831853 / LENGTH[i];
    float omega = sqrt(9.81 * k) * 0.35;
    float theta = k * dot(world, heading) - omega * uTime + SHIFT[i] + meander * (0.6 + 0.3 * float(i));
    height += HEIGHT[i] * (cos(theta) + steep * cos(2.0 * theta));
    total += HEIGHT[i] * (1.0 + steep);
  }
  float level = clamp(0.5 + 0.5 * height / (total * 0.85), 0.0, 1.0);
  float crest = smoothstep(0.6, 1.0, level);
  float glint = crest * crest * uGlint;
  float haze = mix(1.0, 1.0 - uFog, pow(1.0 - v, 1.4));
  float light = (pow(level, uContrast) + glint * 0.8) * haze;
  float glow = 1.0 - exp(-max(ink, 0.0) * uInk * 1.6);
  light = 1.0 - (1.0 - clamp(light, 0.0, 1.0)) * (1.0 - glow);
  float front = uIntro * 1.35;
  float reveal = 1.0 - smoothstep(front - 0.35, front, v);
  float sweep = exp(-pow((v - front + 0.22) / 0.07, 2.0)) * (1.0 - uIntro);
  light = (light + sweep * 0.8) * reveal;
  light = max(light, 0.045 * reveal);
  float span = mix(1.0 - uStretch, 1.0, level) + glow * 0.3;
  span = clamp(span, 0.08, 1.0) * mix(0.1, 1.0, reveal);
  float tint = clamp(max(glint * 1.4, glow * 0.9) + sweep, 0.0, 1.0);
  float lean = clamp(flow.x / 1400.0, -1.0, 1.0) * uLean * reveal;
  fragColor = vec4(clamp(light, 0.0, 1.0), span, tint, 0.5 + 0.5 * lean);
}`;

  const slatFragment = `#version 300 es
precision highp float;
uniform sampler2D tField; uniform vec2 uSize; uniform float uDpr; uniform vec4 uGrid; uniform vec2 uOrigin;
uniform vec2 uSlat; uniform float uRound; uniform vec3 uColor; uniform vec3 uGlintColor; uniform vec4 uBackground;
out vec4 fragColor;
float pill(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 local = p - uOrigin;
  vec2 cell = floor(local / uGrid.zw);
  vec4 background = vec4(uBackground.rgb * uBackground.a, uBackground.a);
  vec4 slat = vec4(0.0);
  if (cell.x >= 0.0 && cell.y >= 0.0 && cell.x < uGrid.x && cell.y < uGrid.y) {
    vec4 field = texelFetch(tField, ivec2(int(cell.x), int(uGrid.y - 1.0 - cell.y)), 0);
    vec2 offset = local - cell * uGrid.zw - uSlat * 0.5;
    vec2 halfSize = vec2(uSlat.x * 0.5, uSlat.y * 0.5 * field.g);
    float radius = uRound * min(halfSize.x, halfSize.y);
    float alpha = clamp(0.5 - pill(offset, halfSize, radius) * uDpr, 0.0, 1.0) * field.r;
    slat = vec4(mix(uColor, uGlintColor, field.b) * alpha, alpha);
  }
  fragColor = slat + background * (1.0 - slat.a);
}`;

  function softwareGL() {
    try {
      const c = document.createElement('canvas').getContext('webgl');
      if (!c) return false;
      const ext = c.getExtension('WEBGL_debug_renderer_info');
      const name = String(c.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : c.RENDERER) || '');
      const lose = c.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
    } catch (e) { return false; }
  }

  function create(container) {
    const s = SETTINGS;
    const bg = s.backgroundColor;
    container.style.backgroundColor = `rgb(${bg[0] * 255},${bg[1] * 255},${bg[2] * 255})`;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return null;
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const SOFTWARE = softwareGL();
    const COARSE = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 1023px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STATIC = SOFTWARE || reducedMotion;
    const MAX_DPR = SOFTWARE ? 1 : (COARSE ? 1.5 : 2);
    const MIN_FRAME_MS = COARSE ? 1000 / 31 : 0;
    const floatTargets = !COARSE && !STATIC && !!gl.getExtension('EXT_color_buffer_float');

    // --- geometría: un triángulo que cubre la pantalla
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);

    function program(vs, fs) {
      const p = gl.createProgram();
      [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(([type, src]) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.warn('MicroSlats shader:', gl.getShaderInfoLog(sh));
        gl.attachShader(p, sh);
      });
      gl.bindAttribLocation(p, 0, 'position');
      gl.linkProgram(p);
      const info = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      let unit = 0;
      for (let i = 0; i < n; i++) {
        const u = gl.getActiveUniform(p, i);
        info[u.name] = { loc: gl.getUniformLocation(p, u.name), type: u.type, unit: u.type === gl.SAMPLER_2D ? unit++ : -1 };
      }
      return { p, info, values: {} };
    }

    function draw(prog, target, values, clear) {
      gl.useProgram(prog.p);
      if (target) { gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0, 0, target.w, target.h); }
      else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
      if (clear) gl.clear(gl.COLOR_BUFFER_BIT);
      for (const name in values) {
        const u = prog.info[name];
        if (!u) continue;
        const v = values[name];
        switch (u.type) {
          case gl.FLOAT: gl.uniform1f(u.loc, v); break;
          case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, v); break;
          case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, v); break;
          case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, v); break;
          case gl.SAMPLER_2D:
            gl.activeTexture(gl.TEXTURE0 + u.unit);
            gl.bindTexture(gl.TEXTURE_2D, v);
            gl.uniform1i(u.loc, u.unit);
            break;
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function makeTarget(w, h, float) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const filter = float ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fb, w, h };
    }
    const dispose = t => { if (t) { gl.deleteFramebuffer(t.fb); gl.deleteTexture(t.tex); } };

    const blank = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

    const fieldProg = program(passVertex, fieldFragment);
    const slatProg = program(passVertex, slatFragment);
    let splatProg, divergenceProg, pressureProg, projectProg, advectProg, scaleProg;
    if (floatTargets) {
      splatProg = program(fluidVertex, splatFragment);
      divergenceProg = program(fluidVertex, divergenceFragment);
      pressureProg = program(fluidVertex, pressureFragment);
      projectProg = program(fluidVertex, projectFragment);
      advectProg = program(fluidVertex, advectFragment);
      scaleProg = program(fluidVertex, scaleFragment);
    }

    let width = 1, height = 1, dpr = 1;
    let fieldTarget = null;
    let fluid = null, fluidTexel = [1, 1];
    let raf = 0, last = 0, lastDraw = 0, time = 0, introClock = 0;
    let visible = false, fluidUntil = 0, fluidDirty = false, splashTurn = 0;
    const splats = [];
    const pointer = { x: 0, y: 0, tracked: false };

    const pair = (w, h) => ({ read: makeTarget(w, h, true), write: makeTarget(w, h, true), swap() { const t = this.read; this.read = this.write; this.write = t; } });

    function buildFluid() {
      if (!floatTargets) return;
      const aspect = width / height;
      const w = Math.max(8, Math.round(aspect >= 1 ? FLUID_SIZE * aspect : FLUID_SIZE));
      const h = Math.max(8, Math.round(aspect >= 1 ? FLUID_SIZE : FLUID_SIZE / aspect));
      if (fluid && fluid.w === w && fluid.h === h) return;
      if (fluid) [fluid.velocity, fluid.ink, fluid.pressure].forEach(p => { dispose(p.read); dispose(p.write); });
      if (fluid) dispose(fluid.divergence);
      fluid = { w, h, velocity: pair(w, h), ink: pair(w, h), pressure: pair(w, h), divergence: makeTarget(w, h, true) };
      fluidTexel = [1 / w, 1 / h];
    }

    function resize() {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(PIXEL_BUDGET / (width * height)));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      buildFluid();
      start();
    }

    function layout() {
      const pitchX = s.slatWidth + s.gap, pitchY = s.slatHeight + s.gap;
      const cols = Math.min(2048, Math.ceil((width + s.gap) / pitchX) + 1);
      const rows = Math.min(2048, Math.ceil((height + s.gap) / pitchY) + 1);
      const origin = [(width - (cols * pitchX - s.gap)) / 2, (height - (rows * pitchY - s.gap)) / 2];
      if (!fieldTarget || fieldTarget.w !== cols || fieldTarget.h !== rows) {
        dispose(fieldTarget);
        fieldTarget = makeTarget(cols, rows, false);
      }
      return { grid: [cols, rows, pitchX, pitchY], origin };
    }

    function splat(p, point, value, radius) {
      draw(splatProg, p.write, { uTexel: fluidTexel, uTarget: p.read.tex, uAspect: width / height, uPoint: point, uValue: value, uRadius: radius });
      p.swap();
    }

    function stepFluid(f, dt) {
      draw(divergenceProg, f.divergence, { uTexel: fluidTexel, uVelocity: f.velocity.read.tex });
      draw(scaleProg, f.pressure.write, { uTexel: fluidTexel, uSource: f.pressure.read.tex, uValue: 0.8 });
      f.pressure.swap();
      for (let i = 0; i < PRESSURE_STEPS; i++) {
        draw(pressureProg, f.pressure.write, { uTexel: fluidTexel, uPressure: f.pressure.read.tex, uDivergence: f.divergence.tex });
        f.pressure.swap();
      }
      draw(projectProg, f.velocity.write, { uTexel: fluidTexel, uPressure: f.pressure.read.tex, uVelocity: f.velocity.read.tex });
      f.velocity.swap();
      const fade = 1 / clamp(s.trail, 0.1, 10);
      draw(advectProg, f.velocity.write, { uTexel: fluidTexel, uDt: dt, uVelocity: f.velocity.read.tex, uSource: f.velocity.read.tex, uFade: fade * 1.4 });
      f.velocity.swap();
      draw(advectProg, f.ink.write, { uTexel: fluidTexel, uDt: dt, uVelocity: f.velocity.read.tex, uSource: f.ink.read.tex, uFade: fade });
      f.ink.swap();
    }

    function clearFluid(f) {
      [f.velocity, f.ink, f.pressure].forEach(p => {
        draw(scaleProg, p.write, { uTexel: fluidTexel, uSource: p.read.tex, uValue: 0 });
        p.swap();
      });
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      // Celular: ~30 fps
      if (MIN_FRAME_MS && now - lastDraw < MIN_FRAME_MS) { raf = requestAnimationFrame(frame); return; }
      lastDraw = now;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      if (!STATIC) time += dt * s.speed;
      introClock = STATIC ? 1 : introClock + dt / Math.max(0.2, s.introDuration);
      const il = Math.min(introClock, 1);
      const introEase = il < 0.5 ? 4 * il * il * il : 1 - Math.pow(-2 * il + 2, 3) / 2;

      if (fluid && splats.length) {
        const radius = Math.pow(clamp(s.cursorSize, 4, 600) / height, 2) * 0.35;
        const aspect = width / height;
        for (const [u, v, du, dv, turn] of splats) {
          if (turn === null) {
            splat(fluid.velocity, [u, v], [du * SPLAT_FORCE, dv * SPLAT_FORCE, 0], radius);
            splat(fluid.ink, [u, v], [0.13, 0, 0], radius);
            continue;
          }
          const jet = radius * 0.55, reach = Math.sqrt(jet * 0.5) * 1.9, push = SPLAT_FORCE * 0.08;
          for (let i = 0; i < SPLASH_JETS; i++) {
            const angle = turn + (i / SPLASH_JETS) * Math.PI * 2;
            const dx = Math.cos(angle), dy = Math.sin(angle);
            const point = [u + (dx * reach) / aspect, v + dy * reach];
            splat(fluid.velocity, point, [(dx - dy) * Math.SQRT1_2 * push, (dy + dx) * Math.SQRT1_2 * push, 0], jet);
            splat(fluid.ink, point, [0.75, 0, 0], jet);
          }
          splat(fluid.ink, [u, v], [0.45, 0, 0], radius);
        }
        splats.length = 0;
        fluidDirty = true;
      }
      const fluidActive = fluid !== null && now < fluidUntil;
      if (fluid) {
        if (fluidActive) stepFluid(fluid, Math.min(Math.max(dt, 1 / 240), 1 / 30));
        else if (fluidDirty) { clearFluid(fluid); fluidDirty = false; }
      }

      const L = layout();
      draw(fieldProg, fieldTarget, {
        uSize: [width, height], uGrid: L.grid, uOrigin: L.origin, uSlat: [s.slatWidth, s.slatHeight],
        uTime: time, uScale: s.scale, uDirection: (s.direction * Math.PI) / 180, uChop: s.chop,
        uStretch: s.stretch, uGlint: s.glint, uContrast: s.contrast, uPerspective: s.perspective, uFog: s.fog,
        uIntro: introEase, uFluid: fluidActive ? 1 : 0,
        tVelocity: fluid ? fluid.velocity.read.tex : blank, tInk: fluid ? fluid.ink.read.tex : blank,
        uFluidTexel: fluidTexel, uInk: s.cursorStrength, uLean: s.lean
      }, true);
      draw(slatProg, null, {
        tField: fieldTarget.tex, uSize: [width, height], uDpr: dpr, uGrid: L.grid, uOrigin: L.origin,
        uSlat: [s.slatWidth, s.slatHeight], uRound: s.roundness, uColor: s.color, uGlintColor: s.glintColor,
        uBackground: bg
      }, true);

      if (!STATIC || fluidActive || fluidDirty) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    if (floatTargets) {
      const locate = e => {
        const r = container.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const w = Math.max(1, r.width), h = Math.max(1, r.height);
        return { x, y, u: x / w, v: 1 - y / h, h, inside: x >= 0 && y >= 0 && x <= w && y <= h };
      };
      const queue = (u, v, du, dv, turn) => {
        if (splats.length > 32) splats.shift();
        splats.push([u, v, du, dv, turn]);
        fluidUntil = performance.now() + Math.max(1.5, s.trail * 5) * 1000;
        start();
      };
      window.addEventListener('pointermove', e => {
        if (!visible) { pointer.tracked = false; return; }
        const spot = locate(e);
        if (!spot.inside) { pointer.tracked = false; return; }
        if (pointer.tracked && (spot.x !== pointer.x || spot.y !== pointer.y)) {
          queue(spot.u, spot.v, (spot.x - pointer.x) / spot.h, (pointer.y - spot.y) / spot.h, null);
        }
        pointer.x = spot.x; pointer.y = spot.y; pointer.tracked = true;
      }, { passive: true });
      window.addEventListener('pointerdown', e => {
        if (!visible) return;
        const spot = locate(e);
        if (!spot.inside) return;
        splashTurn += 2.39996;
        queue(spot.u, spot.v, 0, 0, splashTurn);
      }, { passive: true });
      window.addEventListener('blur', () => { pointer.tracked = false; });
    }

    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
    new ResizeObserver(resize).observe(container);
    resize();

    return {
      setVisible(v) {
        if (v === visible) return;
        visible = v;
        if (v) start();
      }
    };
  }

  // Arranque perezoso: el contexto WebGL se crea la primera vez que la sección entra en pantalla.
  window.initMicroSlats = function (container) {
    if (!container || container.__microSlats) return;
    container.__microSlats = true;
    let inst = null;
    const io = new IntersectionObserver(entries => {
      const on = entries.some(en => en.isIntersecting);
      if (on && !inst) inst = create(container) || { setVisible() {} };
      if (inst) inst.setVisible(on);
    });
    io.observe(container);
  };
})();
