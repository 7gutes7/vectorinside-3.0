/**
 * Vector Inside 3.0 - High-Performance Interactive Logic
 */

// Force browser to disable scroll memory restoration so refreshes ALWAYS land on Hero
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {
  // Always reset scroll position to top (Hero section) on page load/refresh
  window.scrollTo(0, 0);

  // 0. Initialize Fullscreen Video Intro (INTRO.mp4)
  initPageVideoIntro();

  // 1. Initialize 3D Wolf Head Model & Native Hardware-Accelerated 3D Topography
  initHero3DModel();

  // 3. Setup Intersection Observer for Scroll Animations
  initScrollAnimations();

  // 4. Diagnostic Modal Logic
  initDiagnosticModal();

  // 5. Evidence Tab Switcher
  initEvidenceTabs();

  // 6. Mobile Menu Toggle
  initMobileMenu();

  // Fallback trigger if intro screen is disabled or absent
  const introScreen = document.getElementById('intro-screen');
  if (!introScreen || window.getComputedStyle(introScreen).display === 'none') {
    setTimeout(triggerStrokeTextEffect, 300);
  }
});

/**
 * Fullscreen Video Intro & Asset Preloader Controller
 * Loops intro until all videos in page are buffered and ready
 */
function initPageVideoIntro() {
  const introScreen = document.getElementById('intro-screen');
  const video = document.getElementById('intro-video');
  const skipBtn = document.getElementById('skip-intro-btn');
  const loaderText = document.querySelector('#intro-loader span:last-child');

  if (!introScreen || !video) return;

  let isDismissed = false;
  let isMediaReady = false;

  // Set intro to loop while assets preload
  video.loop = true;

  function dismissIntro() {
    if (isDismissed) return;
    isDismissed = true;
    introScreen.style.opacity = '0';
    setTimeout(() => {
      introScreen.style.display = 'none';
      // Trigger StrokeText effect on "Diseñamos instinto." right after intro finishes
      triggerStrokeTextEffect();
    }, 750);
  }

  // Preload all media videos in the document
  function preloadAllMedia() {
    const mediaVideos = Array.from(document.querySelectorAll('video:not(#intro-video)'));
    if (mediaVideos.length === 0) {
      isMediaReady = true;
      video.loop = false;
      return;
    }

    let loadedCount = 0;
    const checkAll = () => {
      loadedCount++;
      if (loadedCount >= mediaVideos.length) {
        isMediaReady = true;
        video.loop = false;
        if (loaderText) {
          loaderText.textContent = 'SYS_V.3.0 // VIDEOS PRECARGADOS • INICIANDO';
        }
      }
    };

    mediaVideos.forEach((v) => {
      v.preload = 'auto';
      if (v.readyState >= 3) {
        checkAll();
      } else {
        v.addEventListener('canplaythrough', checkAll, { once: true });
        v.addEventListener('loadeddata', checkAll, { once: true });
        v.addEventListener('error', checkAll, { once: true });
        v.load();
      }
    });

    // Safety timeout after 4.5s
    setTimeout(() => {
      isMediaReady = true;
      video.loop = false;
    }, 4500);
  }

  // Run preload concurrently with intro video playback
  preloadAllMedia();

  // When current iteration finishes and media is ready -> dismiss
  video.addEventListener('timeupdate', () => {
    if (isMediaReady && video.duration && (video.duration - video.currentTime < 0.15)) {
      dismissIntro();
    }
  });

  video.addEventListener('ended', () => {
    if (isMediaReady) {
      dismissIntro();
    }
  });

  // Skip intro when clicking on video or anywhere on the intro screen
  video.style.cursor = 'pointer';
  video.addEventListener('click', dismissIntro);
  introScreen.style.cursor = 'pointer';
  introScreen.addEventListener('click', (e) => {
    dismissIntro();
  });

  // Skip button click
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissIntro();
    });
  }

  // Escape key press to skip
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !isDismissed) {
      dismissIntro();
    }
  });
}

/**
 * Interactive 3D Topographical Terrain Shader (Aerial Forward Flight + Mouse Warp)
 * Based on high-altitude contour elevation models (Isolines / Curvas de Nivel)
 */
/**
 * High-Performance 3D Topographical Terrain Shader (Pure Aerial Forward Flight, No Cursor Reaction)
 * Based on high-altitude contour elevation models (Isolines / Curvas de Nivel)
 */
function initTopographicalTerrainShader() {
  const canvas = document.getElementById('hero-topo-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  function syncSize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  window.addEventListener('resize', syncSize);
  syncSize();

  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

  const vsSource = isWebGL2 ? `#version 300 es
    in vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  ` : `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fsSource = isWebGL2 ? `#version 300 es
    precision highp float;
    out vec4 fragColor;

    uniform vec2 u_resolution;
    uniform float u_time;

    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float total = 0.0;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      total += 0.55 * noise(p);
      p = m * p + vec2(12.5, 3.7);
      total += 0.28 * noise(p);
      p = m * p + vec2(8.3, 1.9);
      total += 0.14 * noise(p);
      return total;
    }

    float terrain(vec2 p) {
      float h = fbm(p * 0.16) * 2.1 + fbm(p * 0.38) * 0.6;
      return pow(max(0.0, h + 0.5), 1.35) * 1.2;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);

      // Fast, fluid forward flight
      float flightSpeed = 1.85;
      float flightZ = u_time * flightSpeed;
      vec3 ro = vec3(0.0, 3.6, flightZ);
      vec3 rd = normalize(vec3(uv.x * 1.3, uv.y - 0.42, 1.45));

      float t = 1.0;
      float maxDist = 30.0;
      vec3 p = ro;
      bool hit = false;

      for (int i = 0; i < 38; i++) {
        p = ro + rd * t;
        float h = terrain(p.xz);
        float diff = p.y - h;
        if (diff < 0.018) {
          hit = true;
          break;
        }
        t += max(0.09, diff * 0.45);
        if (t > maxDist) break;
      }

      if (!hit) {
        fragColor = vec4(0.04, 0.04, 0.05, 1.0);
        return;
      }

      vec2 eps = vec2(0.04, 0.0);
      float hCenter = terrain(p.xz);
      vec3 nor = normalize(vec3(
        terrain(p.xz - eps.xy) - terrain(p.xz + eps.xy),
        2.0 * eps.x,
        terrain(p.xz - eps.yx) - terrain(p.xz + eps.yx)
      ));

      vec3 lightDir = normalize(vec3(-0.6, 1.4, -0.4));
      float diff = max(0.0, dot(nor, lightDir));
      float amb = 0.65 + 0.35 * nor.y;

      // Topographical Contour Isolines
      float contourFrequency = 8.5;
      float elevation = hCenter * contourFrequency;
      float contourFract = fract(elevation);
      
      float lineDist = min(contourFract, 1.0 - contourFract);
      float fw = fwidth(elevation) * 1.2 + 0.03;
      float isLine = smoothstep(fw, 0.0, lineDist);

      float majorElevation = elevation / 5.0;
      float majorFract = fract(majorElevation);
      float majorDist = min(majorFract, 1.0 - majorFract);
      float majorFw = fwidth(majorElevation) * 1.5 + 0.02;
      float isMajorLine = smoothstep(majorFw, 0.0, majorDist);

      // Bright Ivory / Bone Titanium Palette matching reference image
      vec3 baseTone = vec3(0.92, 0.90, 0.87); // Luminous white-ivory plaster
      vec3 shadowTone = vec3(0.68, 0.66, 0.63); // Soft warm relief shadow
      vec3 terrainColor = mix(shadowTone, baseTone, diff * 0.65 + amb * 0.35);

      vec3 contourColor = vec3(0.12, 0.12, 0.14); // Crisp dark contour ink lines
      vec3 finalTerrain = mix(terrainColor, contourColor, isLine * 0.75 + isMajorLine * 0.25);

      float fog = smoothstep(10.0, maxDist - 1.0, t);
      vec3 bgColor = vec3(0.85, 0.83, 0.80);
      vec3 finalColor = mix(finalTerrain, bgColor, fog);

      fragColor = vec4(finalColor, 1.0);
    }
  ` : `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;

    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float total = 0.0;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      total += 0.55 * noise(p);
      p = m * p + vec2(12.5, 3.7);
      total += 0.28 * noise(p);
      p = m * p + vec2(8.3, 1.9);
      total += 0.14 * noise(p);
      return total;
    }

    float terrain(vec2 p) {
      float h = fbm(p * 0.16) * 2.1 + fbm(p * 0.38) * 0.6;
      return pow(max(0.0, h + 0.5), 1.35) * 1.2;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
      float flightSpeed = 1.85;
      float flightZ = u_time * flightSpeed;
      vec3 ro = vec3(0.0, 3.6, flightZ);
      vec3 rd = normalize(vec3(uv.x * 1.3, uv.y - 0.42, 1.45));

      float t = 1.0;
      float maxDist = 30.0;
      vec3 p = ro;
      bool hit = false;

      for (int i = 0; i < 38; i++) {
        p = ro + rd * t;
        float h = terrain(p.xz);
        float diff = p.y - h;
        if (diff < 0.018) {
          hit = true;
          break;
        }
        t += max(0.09, diff * 0.45);
        if (t > maxDist) break;
      }

      if (!hit) {
        gl_FragColor = vec4(0.85, 0.83, 0.80, 1.0);
        return;
      }

      vec2 eps = vec2(0.04, 0.0);
      float hCenter = terrain(p.xz);
      vec3 nor = normalize(vec3(
        terrain(p.xz - eps.xy) - terrain(p.xz + eps.xy),
        2.0 * eps.x,
        terrain(p.xz - eps.yx) - terrain(p.xz + eps.yx)
      ));

      vec3 lightDir = normalize(vec3(-0.6, 1.4, -0.4));
      float diff = max(0.0, dot(nor, lightDir));
      float amb = 0.65 + 0.35 * nor.y;

      float contourFrequency = 8.5;
      float elevation = hCenter * contourFrequency;
      float contourFract = fract(elevation);
      float lineDist = min(contourFract, 1.0 - contourFract);
      float isLine = smoothstep(0.08, 0.0, lineDist);

      vec3 baseTone = vec3(0.92, 0.90, 0.87);
      vec3 shadowTone = vec3(0.68, 0.66, 0.63);
      vec3 terrainColor = mix(shadowTone, baseTone, diff * 0.65 + amb * 0.35);
      vec3 contourColor = vec3(0.12, 0.12, 0.14);
      vec3 finalTerrain = mix(terrainColor, contourColor, isLine * 0.85);

      float fog = smoothstep(10.0, maxDist - 1.0, t);
      vec3 bgColor = vec3(0.85, 0.83, 0.80);
      vec3 finalColor = mix(finalTerrain, bgColor, fog);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  function compileShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Topo Shader Error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = compileShader(vsSource, gl.VERTEX_SHADER);
  const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Topo Program Link Error:", gl.getProgramInfoLog(program));
    return;
  }

  const uResolution = gl.getUniformLocation(program, "u_resolution");
  const uTime = gl.getUniformLocation(program, "u_time");
  const posAttr = gl.getAttribLocation(program, "position");

  const quad = new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

  let startTime = performance.now();

  function render() {
    syncSize();

    const elapsed = (performance.now() - startTime) * 0.001;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, elapsed);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/**
 * Official ReactBits GradientWaves WebGL 2.0 Engine
 */
function initGradientWavesShader() {
  const canvas = document.getElementById('gradient-waves-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  function syncSize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
  }

  window.addEventListener('resize', syncSize);
  syncSize();

  const vsSource = `#version 300 es
    in vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fsSource = `#version 300 es
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uSpeed;
    uniform float uAmplitude;
    uniform float uWaveScale;
    uniform float uWaveRatio;
    uniform float uSwell;
    uniform float uTurbulence;
    uniform float uTilt;
    uniform float uZoom;
    uniform float uHeight;
    uniform float uFogDepth;
    uniform float uSteps;
    uniform float uBrightness;
    uniform float uOpacity;
    uniform vec3 uHorizonColor;
    uniform vec3 uWaveColor;
    uniform vec3 uCrestColor;
    uniform vec2 uMouse;
    out vec4 fragColor;

    const float MAX_DIST = 20000.0;

    float plasma(vec3 r, vec2 freq, vec4 tc) {
      float mx = r.x + tc.x;
      mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
      float my = r.y - tc.z;
      my += uTurbulence * cos(r.x / 23.0 + tc.w);

      // Dynamic cursor wave deformation & ripple
      vec2 mUV = (uMouse - 0.5) * vec2(35.0, 20.0);
      float mDist = length(r.xy - mUV);
      float ripple = sin(mDist * 0.45 - tc.x * 2.5) * exp(-mDist * 0.1) * 7.5;

      return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight + ripple);
    }

    float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
      float dist = 0.0;
      for (int i = 0; i < 128; i++) {
        if (float(i) >= uSteps) break;
        float dscene = plasma(pos + dist * dir, freq, tc);
        if (abs(dscene) < 0.1) break;
        dist += 0.9 * dscene;
        if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
      }
      return dist;
    }

    void main() {
      float T = iTime * uSpeed;
      vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
      vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
      float c, s;
      float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
      vec3 cam = vec3(0.0, 0.0, 30.0);
      vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
      uv.x *= iResolution.x / iResolution.y;
      uv.y *= -1.0;

      vec3 dir = vec3(0.0, 0.0, -1.0);
      float ulen = length(uv);
      float xrot = vfov * ulen;
      c = cos(xrot); s = sin(xrot);
      dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
      vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
      c = nuv.x; s = nuv.y;
      dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
      c = cos(uTilt); s = sin(uTilt);
      dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

      float dist = raymarch(cam, dir, freq, tc);
      vec3 pos = cam + dist * dir;

      float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
      vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
      vec3 col = mix(uHorizonColor, body, t);
      col *= uBrightness;
      col = clamp(col, 0.0, 1.0);

      float alpha = clamp(t, 0.0, 1.0) * uOpacity;
      fragColor = vec4(col * alpha, alpha);
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vertShader || !fragShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    iTime: gl.getUniformLocation(program, 'iTime'),
    iResolution: gl.getUniformLocation(program, 'iResolution'),
    uSpeed: gl.getUniformLocation(program, 'uSpeed'),
    uAmplitude: gl.getUniformLocation(program, 'uAmplitude'),
    uWaveScale: gl.getUniformLocation(program, 'uWaveScale'),
    uWaveRatio: gl.getUniformLocation(program, 'uWaveRatio'),
    uSwell: gl.getUniformLocation(program, 'uSwell'),
    uTurbulence: gl.getUniformLocation(program, 'uTurbulence'),
    uTilt: gl.getUniformLocation(program, 'uTilt'),
    uZoom: gl.getUniformLocation(program, 'uZoom'),
    uHeight: gl.getUniformLocation(program, 'uHeight'),
    uFogDepth: gl.getUniformLocation(program, 'uFogDepth'),
    uSteps: gl.getUniformLocation(program, 'uSteps'),
    uBrightness: gl.getUniformLocation(program, 'uBrightness'),
    uOpacity: gl.getUniformLocation(program, 'uOpacity'),
    uHorizonColor: gl.getUniformLocation(program, 'uHorizonColor'),
    uWaveColor: gl.getUniformLocation(program, 'uWaveColor'),
    uCrestColor: gl.getUniformLocation(program, 'uCrestColor'),
    uMouse: gl.getUniformLocation(program, 'uMouse')
  };

  gl.useProgram(program);
  gl.uniform1f(uniforms.uSpeed, 0.4);
  gl.uniform1f(uniforms.uAmplitude, 3.6);
  gl.uniform1f(uniforms.uWaveScale, 1.0);
  gl.uniform1f(uniforms.uWaveRatio, 0.9);
  gl.uniform1f(uniforms.uSwell, 35.0);
  gl.uniform1f(uniforms.uTurbulence, 29.5);
  gl.uniform1f(uniforms.uTilt, 1.01);
  gl.uniform1f(uniforms.uZoom, 1.0);
  gl.uniform1f(uniforms.uHeight, 5.5);
  gl.uniform1f(uniforms.uFogDepth, 15.0);
  gl.uniform1f(uniforms.uSteps, 70.0);
  gl.uniform1f(uniforms.uBrightness, 1.0);
  gl.uniform1f(uniforms.uOpacity, 1.0);
  gl.uniform3f(uniforms.uHorizonColor, 0.3215, 0.1529, 1.0); // #5227FF
  gl.uniform3f(uniforms.uWaveColor, 1.0, 0.6235, 0.9882);    // #FF9FFC
  gl.uniform3f(uniforms.uCrestColor, 1.0, 1.0, 1.0);         // #FFFFFF
  gl.uniform2f(uniforms.uMouse, 0.5, 0.5);

  let currentMouse = { x: 0.5, y: 0.5 };
  let targetMouse = { x: 0.5, y: 0.5 };

  window.addEventListener('mousemove', (e) => {
    targetMouse.x = e.clientX / window.innerWidth;
    targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
  });

  let startTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    syncSize();

    currentMouse.x += (targetMouse.x - currentMouse.x) * 0.08;
    currentMouse.y += (targetMouse.y - currentMouse.y) * 0.08;

    gl.useProgram(program);
    gl.uniform1f(uniforms.iTime, (performance.now() - startTime) * 0.001);
    gl.uniform2f(uniforms.iResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(uniforms.uMouse, currentMouse.x, currentMouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  requestAnimationFrame(animate);
}



/**
 * Reveal-on-scroll animations
 */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

/**
 * Diagnostic Assessment Modal logic
 */
function initDiagnosticModal() {
  const modalBackdrop = document.getElementById('diagnostic-modal');
  const openBtns = document.querySelectorAll('.trigger-diagnostic-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const form = document.getElementById('diagnostic-form');
  const successState = document.getElementById('modal-success-state');

  if (!modalBackdrop) return;

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.display = 'none';
      if (successState) successState.style.display = 'block';
      setTimeout(() => {
        closeModal();
        setTimeout(() => {
          form.reset();
          form.style.display = 'block';
          if (successState) successState.style.display = 'none';
        }, 400);
      }, 2800);
    });
  }
}

/**
 * Evidence Tabs Switcher
 */
function initEvidenceTabs() {
  const tabs = document.querySelectorAll('.evidence-tab-btn');
  const panels = document.querySelectorAll('.evidence-panel');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      tabs.forEach(t => {
        t.classList.remove('bg-vector-lime', 'text-vector-black', 'font-bold');
        t.classList.add('text-on-surface-variant');
      });

      tab.classList.add('bg-vector-lime', 'text-vector-black', 'font-bold');
      tab.classList.remove('text-on-surface-variant');

      panels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.remove('hidden');
          panel.classList.add('block');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('block');
        }
      });
    });
  });
}

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (!menuBtn || !mobileNav) return;

  menuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
    });
  });
}

/**
 * High-Resolution Section 3 Live Mobile Screen CanvasTexture Generator (1024x2048)
 */
function createSection3ScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  // Dark cybernetic brutalist background
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, 1024, 2048);

  // Neon gradient ambient header glow
  const grad = ctx.createRadialGradient(512, 450, 40, 512, 450, 600);
  grad.addColorStop(0, 'rgba(195, 244, 0, 0.28)');
  grad.addColorStop(0.5, 'rgba(157, 78, 221, 0.16)');
  grad.addColorStop(1, 'rgba(8, 8, 10, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1100);

  // Status Bar
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.fillText('09:41', 70, 95);
  ctx.textAlign = 'right';
  ctx.fillText('VECTOR 5G  100%', 954, 95);
  ctx.textAlign = 'left';

  // Top Section Badge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(70, 150, 884, 90);
  ctx.strokeStyle = '#c3f400';
  ctx.lineWidth = 4;
  ctx.strokeRect(70, 150, 884, 90);

  ctx.fillStyle = '#c3f400';
  ctx.font = 'bold 36px "JetBrains Mono", monospace';
  ctx.fillText('SYS_V3.0 // 02 ECOSISTEMA NÚCLEO', 100, 208);

  // Main Screen Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px "Montserrat", sans-serif';
  ctx.fillText('ARQUITECTURA DE', 70, 340);
  ctx.fillStyle = '#c3f400';
  ctx.fillText('CONVERSIÓN TOTAL', 70, 420);

  // Metric Card 1: Pipeline Conversion
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(70, 500, 884, 370);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 500, 884, 370);

  ctx.fillStyle = '#9d4edd';
  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.fillText('FLUIDEZ ESTRUCTURAL // ACTIVO', 100, 560);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 88px "Montserrat", sans-serif';
  ctx.fillText('+340%', 100, 670);
  ctx.font = '28px "Inter", sans-serif';
  ctx.fillStyle = '#c4c9ac';
  ctx.fillText('Aceleración de conversión validada', 100, 740);

  // Metric Card 2: Neural Response Matrix
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(70, 910, 884, 370);
  ctx.strokeStyle = 'rgba(195, 244, 0, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 910, 884, 370);

  ctx.fillStyle = '#c3f400';
  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.fillText('LATENCIA EN RESPUESTA // CERO', 100, 970);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 88px "Montserrat", sans-serif';
  ctx.fillText('0.02s', 100, 1080);
  ctx.font = '28px "Inter", sans-serif';
  ctx.fillStyle = '#c4c9ac';
  ctx.fillText('Sincronización WhatsApp + CRM en tiempo real', 100, 1150);

  // Cybernetic Waveform Graph
  ctx.strokeStyle = '#c3f400';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = 70; x <= 954; x += 10) {
    const y = 1450 + Math.sin(x * 0.02) * 50 + Math.cos(x * 0.05) * 25;
    if (x === 70) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Bottom Action Button
  ctx.fillStyle = '#c3f400';
  ctx.fillRect(70, 1650, 884, 140);
  ctx.fillStyle = '#08080a';
  ctx.font = 'bold 44px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXPLORAR ECOSISTEMA →', 512, 1738);

  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/**
 * Interactive 3D Model Loader for poligonalFINAL.glb
 */
function initHero3DModel() {
  const container = document.getElementById('hero-3d-container');
  const canvas = document.getElementById('hero-3d-canvas');
  if (!canvas || !container) return;

  if (typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();

  function getContainerDimensions() {
    const w = container.clientWidth || container.offsetWidth || window.innerWidth;
    const h = container.clientHeight || container.offsetHeight || window.innerHeight || 400;
    return { width: Math.max(w, 1), height: Math.max(h, 1) };
  }

  const dim = getContainerDimensions();
  const camera = new THREE.PerspectiveCamera(45, dim.width / dim.height, 0.1, 1000);
  camera.position.set(0, 0, 10);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false
    });
  } catch (e) {
    console.warn('Fallback WebGLRenderer initialization:', e);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
  }

  renderer.setSize(dim.width, dim.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLightLime = new THREE.DirectionalLight(0xc3f400, 2.5);
  dirLightLime.position.set(5, 10, 7);
  scene.add(dirLightLime);

  const dirLightPurple = new THREE.DirectionalLight(0x64b5f6, 2.0);
  dirLightPurple.position.set(-5, -5, -5);
  scene.add(dirLightPurple);

  const pointLight = new THREE.PointLight(0xffffff, 2.0, 50);
  pointLight.position.set(0, 5, 5);
  scene.add(pointLight);

  const phoneFrontLight = new THREE.DirectionalLight(0xffffff, 0.35);
  phoneFrontLight.position.set(0, 2, 10);
  scene.add(phoneFrontLight);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const smartphoneGroup = new THREE.Group();
  scene.add(smartphoneGroup);
  smartphoneGroup.visible = false;

  // Smartphone screen state (declared at function scope so the render loop can read them)
  let phoneScreenMesh = null;
  let defaultScreenMap = null;
  let section3ScreenTexture = null;

  // ==================== 3D TOPOGRAPHICAL TERRAIN (HARDWARE ACCELERATED 60-120 FPS) ====================
  const topoGeo = new THREE.PlaneGeometry(80, 80, 110, 110);

  const topoVertexShader = `
    uniform float u_time;
    varying float vElevation;
    varying vec2 vUv;

    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float total = 0.0;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      total += 0.55 * noise(p);
      p = m * p + vec2(12.5, 3.7);
      total += 0.28 * noise(p);
      p = m * p + vec2(8.3, 1.9);
      total += 0.14 * noise(p);
      return total;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Dynamic forward flight travel along Y:
      vec2 sampleCoord = uv * 5.5 + vec2(0.0, u_time * 0.35);
      float h = fbm(sampleCoord) * 3.2;
      h = pow(max(0.0, h + 0.5), 1.35) * 2.4;
      
      pos.z += h;
      vElevation = h;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const topoFragmentShader = `
    uniform float u_opacity;
    varying float vElevation;
    varying vec2 vUv;

    void main() {
      // Contour Isolines matching reference image
      float contourFreq = 5.0;
      float elev = vElevation * contourFreq;
      float c = fract(elev);
      float lineDist = min(c, 1.0 - c);
      float fw = fwidth(elev) * 1.2 + 0.035;
      float isLine = smoothstep(fw, 0.0, lineDist);

      float majorElev = elev / 5.0;
      float majorC = fract(majorElev);
      float majorDist = min(majorC, 1.0 - majorC);
      float majorFw = fwidth(majorElev) * 1.5 + 0.025;
      float isMajorLine = smoothstep(majorFw, 0.0, majorDist);

      // Bright Bone / Ivory Plaster surface (#EAE6DE)
      vec3 baseTone = vec3(0.92, 0.90, 0.87);
      vec3 shadowTone = vec3(0.68, 0.66, 0.63);
      vec3 contourColor = vec3(0.12, 0.12, 0.14);

      vec3 terrainColor = mix(shadowTone, baseTone, clamp(vElevation * 0.35 + 0.25, 0.0, 1.0));
      vec3 finalTerrain = mix(terrainColor, contourColor, isLine * 0.75 + isMajorLine * 0.25);

      // Edge fade
      float edgeFade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.82, vUv.y) * smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);

      gl_FragColor = vec4(finalTerrain, edgeFade * u_opacity);
    }
  `;

  const topoMaterial = new THREE.ShaderMaterial({
    vertexShader: topoVertexShader,
    fragmentShader: topoFragmentShader,
    uniforms: {
      u_time: { value: 0 },
      u_opacity: { value: 0.90 }
    },
    transparent: true,
    depthWrite: false
  });

  const topoMesh = new THREE.Mesh(topoGeo, topoMaterial);
  topoMesh.rotation.x = -Math.PI / 2 + 0.38;
  topoMesh.position.set(0, -6.5, -6);
  scene.add(topoMesh);

  let targetRotY = 0;
  let targetRotX = 0;
  let currentRotY = 0;
  let currentRotX = 0;

  let isHoveredOverModel = false;
  let currentHoverLerp = 0; // 0.0 = Default Blender Blue, 1.0 = Iridescent Green + Eye Glow
  const detectedEyeMeshes = [];
  const detectedHeadMeshes = [];

  // Symmetrical Centered Rotation & Max responsive tilt angles
  const BASE_ROT_Y = 0; // Centered forward facing
  const MAX_ROT_Y = 24 * (Math.PI / 180);   // ±24° cursor range from base
  const MAX_ROT_X = 18 * (Math.PI / 180);   // ±18° vertical pitch range

  function updateHeroTracking(clientX, clientY) {
    if (!container || !camera) return;

    // Check if hero is visible in viewport
    const heroTrack = document.getElementById('hero-scroll-track');
    if (heroTrack) {
      const rect = heroTrack.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        resetModelToBasePosition();
        return;
      }
    }

    // Precise Nose Tip Pivot Calibration (Centered on screen):
    const noseScreenX = window.innerWidth * 0.50;
    const noseScreenY = window.innerHeight * 0.55;

    const spanX = Math.max(window.innerWidth * 0.48, 300);
    const spanY = Math.max(window.innerHeight * 0.48, 300);

    const normX = Math.max(-1.0, Math.min(1.0, (clientX - noseScreenX) / spanX));
    const normY = Math.max(-1.0, Math.min(1.0, (clientY - noseScreenY) / spanY));

    targetRotY = normX * MAX_ROT_Y;
    targetRotX = 0; // Movimiento vertical cancelado (fijo en horizontal)
  }

  function resetModelToBasePosition() {
    targetRotY = 0;
    targetRotX = 0;
  }

  // Mouse & Touch listeners for full Hero cursor tracking
  window.addEventListener('mousemove', (e) => {
    updateHeroTracking(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      updateHeroTracking(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', resetModelToBasePosition);

  // Configurar el decodificador de Draco con respaldo multicloud
  if (typeof THREE.GLTFLoader !== 'undefined') {
    const loader = new THREE.GLTFLoader();

    if (typeof THREE.DRACOLoader !== 'undefined') {
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dracoLoader);
    }

    // 3D Model: poligonal-30-08-26.glb
    const modelUrl = './poligonal-30-08-26.glb';
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("¡Modelo 3D (poligonal-30-08-26.glb) cargado con éxito!", gltf);
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        // Calibrated scale fitting the centered Hero composition cleanly
        const scale = 6.44 / maxDim;

        model.scale.set(scale, scale, scale);
        model.position.sub(center.multiplyScalar(scale));

        detectedEyeMeshes.length = 0;
        detectedHeadMeshes.length = 0;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Prevent premature culling during extreme close-ups
            if (child.material) {
              child.material = child.material.clone();
              child.material.transparent = true;
              child.material.opacity = 1.0;
              child.material.depthWrite = true;
              child.material.metalness = 0.75;
              child.material.roughness = 0.25;
              child.material.color.set(0x85AEE3); // Soft Sky / Pastel Blue Base Color (#85AEE3)
              child.material.needsUpdate = true;
            }

            const name = (child.name || '').trim();
            const matName = (child.material ? child.material.name || '' : '').trim();

            // Target 'Grid' as EYE sub-mesh and 'mesh_node' as HEAD sub-mesh
            if (name === 'Grid' || matName === 'Material' || name.toLowerCase().includes('grid')) {
              console.log("--> OJOS IDENTIFICADOS EXACTAMENTE:", name, matName);
              detectedEyeMeshes.push(child);
            } else {
              console.log("--> CABEZA IDENTIFICADA EXACTAMENTE:", name, matName);
              detectedHeadMeshes.push(child);
            }
          }
        });

        while (modelGroup.children.length > 0) {
          modelGroup.remove(modelGroup.children[0]);
        }

        modelGroup.add(model);
        // Center horizontally (X=0) and vertically (Y=0)
        modelGroup.position.set(0, 0, 0);
        modelGroup.rotation.set(0, 0, 0);
        modelGroup.updateMatrixWorld(true);

        // Calibrated exact Rhombus Eye Socket Target for poligonal-30-08-26.glb
        targetEyePos.set(0.85, 0.40, 1.05);
        console.log("--> PRECISE RHOMBUS EYE SOCKET TARGET:", targetEyePos);

        syncSize();
      },
      (xhr) => {
        if (xhr.total > 0) {
          const porcentaje = (xhr.loaded / xhr.total) * 100;
          console.log(`Progreso de descarga del modelo 3D: ${porcentaje.toFixed(2)}%`);
        }
      },
      (err) => {
        console.error("Error cargando poligonal-30-08-26.glb:", err);
      }
    );

    // 3D Model 2: smartphone2.glb (Section 3)
    // --- Live video texture for the smartphone screen (Abstract Liquid Glass) ---
    const screenVideo = document.createElement('video');
    screenVideo.src = './Abstract_liquid_glass_animation_1080p_202608301203.mp4';
    screenVideo.loop = true;
    screenVideo.muted = true;
    screenVideo.defaultMuted = true;
    screenVideo.autoplay = true;
    screenVideo.playsInline = true;
    screenVideo.setAttribute('muted', '');
    screenVideo.setAttribute('playsinline', '');
    screenVideo.setAttribute('webkit-playsinline', '');
    screenVideo.preload = 'auto';
    screenVideo.style.cssText = 'position:absolute;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none;';
    document.body.appendChild(screenVideo);

    section3ScreenTexture = new THREE.VideoTexture(screenVideo);
    if (THREE.sRGBEncoding !== undefined) section3ScreenTexture.encoding = THREE.sRGBEncoding;
    section3ScreenTexture.minFilter = THREE.LinearFilter;
    section3ScreenTexture.magFilter = THREE.LinearFilter;
    section3ScreenTexture.generateMipmaps = false;
    section3ScreenTexture.wrapS = THREE.ClampToEdgeWrapping;
    section3ScreenTexture.wrapT = THREE.ClampToEdgeWrapping;
    // El recorte "cover" real se calcula con la geometría de la pantalla al cargar el GLB.

    const playScreenVideo = () => {
      const p = screenVideo.play();
      if (p && p.catch) p.catch(() => {});
    };
    playScreenVideo();
    window.addEventListener('pointerdown', playScreenVideo, { once: true });
    window.addEventListener('touchstart', playScreenVideo, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) playScreenVideo();
    });

    const phoneUrl = './smartphone2.glb';
    loader.load(
      phoneUrl,
      (gltf) => {
        console.log("¡Modelo 3D (smartphone2.glb) cargado con éxito!", gltf);
        const phone = gltf.scene;

        const box = new THREE.Box3().setFromObject(phone);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        
        // Scale phone to look balanced, sharp and imposing
        const scale = 5.8 / maxDim;
        phone.scale.set(scale, scale, scale);
        phone.position.sub(center.clone().multiplyScalar(scale));

        phone.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;

            const matName = (child.material ? child.material.name || '' : '').trim();
            const meshName = (child.name || '').trim();

            if (matName === 'Lock_Screen' || meshName.includes('Object_0')) {
              // Pantalla Emisiva Nítida e Iluminada (video en vivo)
              phoneScreenMesh = child;
              child.visible = true;
              child.renderOrder = 1;

              // El GLB trae los UV de la pantalla en una isla del atlas ([0.08..0.87] x [0..0.99]),
              // por eso el video quedaba recortado a los costados. Regeneramos UV planares
              // a partir de la geometría para que el video cubra la pantalla de borde a borde.
              const geo = child.geometry;
              geo.computeBoundingBox();
              const bb = geo.boundingBox;
              const ext = new THREE.Vector3().subVectors(bb.max, bb.min);
              // La pantalla es un plano: sus dos ejes con mayor extensión son alto y ancho,
              // el tercero (grosor) es ~0. El eje más largo es el ALTO (pantalla vertical).
              const order = ['x', 'y', 'z'].sort((a, b) => ext[b] - ext[a]);
              const vAxis = order[0]; // alto de pantalla (eje más largo)
              const uAxis = order[1]; // ancho de pantalla
              const uKey = 'get' + uAxis.toUpperCase();
              const vKey = 'get' + vAxis.toUpperCase();
              const pos = geo.attributes.position;
              const uvArr = new Float32Array(pos.count * 2);
              for (let i = 0; i < pos.count; i++) {
                uvArr[i * 2] = (pos[uKey](i) - bb.min[uAxis]) / (ext[uAxis] || 1);
                uvArr[i * 2 + 1] = (pos[vKey](i) - bb.min[vAxis]) / (ext[vAxis] || 1);
              }
              geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));

              // Ajuste "cover": el video llena la pantalla y se recorta lo que sobra
              const screenAspect = (ext[uAxis] || 1) / (ext[vAxis] || 1);
              const videoAspect = 16 / 9;
              let rx = 1, ry = 1, ox = 0, oy = 0;
              if (videoAspect > screenAspect) {
                rx = screenAspect / videoAspect;
                ox = (1 - rx) / 2;
              } else {
                ry = videoAspect / screenAspect;
                oy = (1 - ry) / 2;
              }
              section3ScreenTexture.repeat.set(rx, ry);
              section3ScreenTexture.offset.set(ox, oy);
              section3ScreenTexture.needsUpdate = true;

              // La malla de la pantalla del GLB tiene las normales invertidas: con material
              // de una sola cara three.js la descarta y solo se ve una franja. DoubleSide la
              // renderiza completa.
              child.material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                map: section3ScreenTexture,
                toneMapped: false,
                transparent: false,
                opacity: 1.0,
                side: THREE.DoubleSide,
                depthWrite: true,
                depthTest: true
              });
            } else if (matName === 'Glass') {
              // Cristal frontal semitransparente: se oculta para que el video se vea nítido
              child.visible = false;
            } else if (matName === 'Camera_Lens' || meshName.includes('Object_11')) {
              child.visible = true;
              child.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0x0a0c10),
                roughness: 0.10,
                metalness: 0.95,
                transparent: false,
                opacity: 1.0,
                depthWrite: true,
                depthTest: true
              });
            } else {
              // Carcasa, biseles, marco de titanio y tapa trasera (Gris titanio sólido elegante)
              child.visible = true;
              child.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0x525660), // Gris titanio sólido elegante
                roughness: 0.32,
                metalness: 0.75,
                transparent: false,
                opacity: 1.0,
                depthWrite: true,
                depthTest: true,
                side: THREE.DoubleSide
              });
            }
          }
        });

        while (smartphoneGroup.children.length > 0) {
          smartphoneGroup.remove(smartphoneGroup.children[0]);
        }

        smartphoneGroup.add(phone);
        smartphoneGroup.position.set(0, 0, 0);
        smartphoneGroup.visible = false;
      },
      undefined,
      (err) => {
        console.error("Error cargando smartphone2.glb:", err);
      }
    );
  }

  function syncSize() {
    const d = getContainerDimensions();
    camera.aspect = d.width / d.height;
    camera.updateProjectionMatrix();
    renderer.setSize(d.width, d.height);
  }

  window.addEventListener('resize', syncSize);
  window.addEventListener('orientationchange', syncSize);

  // ResizeObserver for dynamic container visibility changes (e.g. after intro hide)
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => syncSize());
    ro.observe(container);
  }

  // Register ScrollTrigger if available
  let scrollProgress = 0;
  const heroUi = document.getElementById('hero-ui-content');
  const heroScrollHint = document.getElementById('hero-scroll-hint');

  if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: '#hero-scroll-track',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        scrollProgress = self.progress; // 0.0 -> 1.0
      }
    });
  }

  // Window scroll listener for instant bidirectional sync (scrolling up & down)
  function syncScrollProgress() {
    const track = document.getElementById('hero-scroll-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const maxScroll = track.offsetHeight - window.innerHeight;
    if (maxScroll > 0) {
      const current = -rect.top;
      scrollProgress = Math.max(0, Math.min(1.0, current / maxScroll));
    }
  }

  window.addEventListener('scroll', syncScrollProgress, { passive: true });

  // ==================== BIDIRECTIONAL SCROLL CONTROLLER FOR SECTION 2 ====================
  const secPortalElem = document.getElementById('seccion-portal-revelada');
  if (secPortalElem) {
    secPortalElem.addEventListener('wheel', (e) => {
      // If user is at top of Section 2 and scrolls UP -> scroll window back to Hero
      if (e.deltaY < 0 && secPortalElem.scrollTop <= 2) {
        window.scrollBy({ top: e.deltaY, behavior: 'auto' });
      }
      // If Section 2 isn't fully scrolled down in track -> forward scroll to window
      else if (e.deltaY > 0 && scrollProgress < 0.98) {
        window.scrollBy({ top: e.deltaY, behavior: 'auto' });
      }
    }, { passive: true });

    // Touch support for mobile trackpads & touchscreens
    let touchStartY = 0;
    secPortalElem.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    secPortalElem.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY; // > 0 = drag up / scroll down, < 0 = drag down / scroll up
      touchStartY = currentY;

      if (deltaY < 0 && secPortalElem.scrollTop <= 2) {
        window.scrollBy({ top: deltaY, behavior: 'auto' });
      }
    }, { passive: true });
  }

  // Smooth scroll tracking variables & Exact Deep Eye Cavity Target for poligonal-30-08-26.glb
  let currentScrollLerp = 0;
  const targetEyePos = new THREE.Vector3(0.85, 0.40, 1.05); // Calibrated exact target for poligonal-30-08-26.glb

  // Bottom dock items helper
  const bottomDock = document.getElementById('bottom-dock-nav');
  const dockLinks = bottomDock ? bottomDock.querySelectorAll('a') : [];

  function updateActiveDockItem(index) {
    dockLinks.forEach((link, i) => {
      if (index !== null && i === index) {
        link.classList.add('bg-vector-lime', 'text-vector-black', 'font-bold');
        link.classList.remove('text-white');
      } else {
        link.classList.remove('bg-vector-lime', 'text-vector-black', 'font-bold');
        link.classList.add('text-white');
      }
    });
  }

  // Render loop: Unified deterministic timeline for Section 1, Section 2 and Section 3 Smartphone
  function animate() {
    requestAnimationFrame(animate);

    // 0. Update Native 3D Topographical Terrain Animation (120 FPS hardware accelerated)
    if (topoMaterial && topoMaterial.uniforms) {
      topoMaterial.uniforms.u_time.value = performance.now() * 0.001;
      // Retrasado: El fondo se mantiene visible durante más tiempo en el zoom y se desvanece suavemente entre 0.065 y 0.10
      const pTopoFade = Math.max(0, (currentScrollLerp - 0.065) / 0.035);
      const topoOpacity = Math.max(0, 1.0 - Math.min(1.0, pTopoFade));
      topoMaterial.uniforms.u_opacity.value = topoOpacity;
      topoMesh.visible = topoOpacity > 0.001;
    }

    // Smoothly interpolate scroll progress for cinematic motion
    currentScrollLerp += (scrollProgress - currentScrollLerp) * 0.12;

    // =========================================================================
    // UNIFIED DETERMINISTIC SCROLL TIMELINE (0.0 to 1.0)
    // =========================================================================
    const T_HEAD_ZOOM_END = 0.12;       // 0% -> 12%: 3D Head zooms into eye
    const T_REVEAL_START = 0.10;        // 10% -> Laser dot appears
    const T_REVEAL_END = 0.20;          // 20% -> Section 2 curtains 100% open & flat
    const T_CONTENT_SCROLL_END = 0.34;  // 20% -> 34%: Section 2 content active
    const T_EXIT_START = 0.35;          // 35% -> Curtains start closing (Plano -> Línea)
    const T_PHONE_ZOOM_START = 0.40;    // 40% -> Vertical line is formed & Smartphone starts Zoom Out!
    const T_EXIT_END = 0.46;            // 46% -> Line collapses to center PUNTO
    const T_PHONE_ZOOM_END = 0.60;      // 60% -> Smartphone fully centered
    const T_SPIN_START = 0.60;          // 60% -> 360° rotation begins with scroll
    const T_SPIN_END = 0.80;            // 80% -> 360° spin completes
    // 80% -> 100%: Smartphone shifts upwards & Kinetic Text Background fades in blur!

    if (currentScrollLerp < T_PHONE_ZOOM_START) {
      // El modelo se mantiene 100% sólido durante todo el zoom y comienza a desvanecerse a partir de que aparece el punto
      let headOpacity = 1.0;
      if (currentScrollLerp >= T_REVEAL_START) {
        const pFade = (currentScrollLerp - T_REVEAL_START) / 0.03;
        headOpacity = Math.max(0, 1.0 - Math.min(1.0, pFade));
      }
      detectedHeadMeshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.opacity = headOpacity;
        }
      });
      detectedEyeMeshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.opacity = headOpacity;
        }
      });
      modelGroup.visible = headOpacity > 0.001;
      smartphoneGroup.visible = false;

      // Full Iconic Hero Lighting for Wolf Head (Vibrant Cyber-Lavender + Lime & Purple Specular Highlights)
      dirLightLime.color.set(0xc3f400);
      dirLightLime.position.set(5, 10, 7);
      dirLightLime.intensity = 2.5;

      dirLightPurple.color.set(0x64b5f6);
      dirLightPurple.position.set(-5, -5, -5);
      dirLightPurple.intensity = 2.0;

      pointLight.color.set(0xffffff);
      pointLight.position.set(0, 5, 5);
      pointLight.intensity = 2.0;

      ambientLight.color.set(0xffffff);
      ambientLight.intensity = 1.2;
      phoneFrontLight.position.set(0, 2, 10);
      phoneFrontLight.intensity = 0.0;

      const hero3dContainer = document.getElementById('hero-3d-container');
      if (hero3dContainer) {
        hero3dContainer.style.zIndex = '10';
      }

      const kineticBg = document.getElementById('kinetic-text-bg');
      if (kineticBg) {
        kineticBg.style.opacity = '0';
        kineticBg.style.filter = 'blur(0px)';
      }

      // 1. Head tilt follows mouse only when at top of hero, dampens to 0 as user scrolls
      const mouseDampen = Math.max(0, 1.0 - currentScrollLerp * 3.0);
      currentRotY += (targetRotY * mouseDampen - currentRotY) * 0.10;
      currentRotX += (targetRotX * mouseDampen - currentRotX) * 0.10;

      modelGroup.rotation.y = BASE_ROT_Y + Math.max(-MAX_ROT_Y, Math.min(MAX_ROT_Y, currentRotY));
      modelGroup.rotation.x = 0;
      modelGroup.rotation.z = 0;

      // 2. Camera Deep Eye Entry (0.0 to 0.12) - Centered in Hero, zooms into eye socket
      const pHead = Math.min(1.0, currentScrollLerp / T_HEAD_ZOOM_END);
      const baseCamPos = new THREE.Vector3(0, 0, 10);
      const targetCamPos = new THREE.Vector3(
        targetEyePos.x,
        targetEyePos.y,
        targetEyePos.z - 0.85
      );

      camera.position.lerpVectors(baseCamPos, targetCamPos, pHead);

      const baseLookAt = new THREE.Vector3(0, 0, 0);
      const targetLookAt = new THREE.Vector3(targetEyePos.x, targetEyePos.y, targetEyePos.z - 2.0);
      const currentLookAt = new THREE.Vector3().lerpVectors(baseLookAt, targetLookAt, pHead);
      camera.lookAt(currentLookAt);

      // 4. UI Layer Fade-out
      if (heroUi) {
        const uiOpacity = Math.max(0, 1.0 - currentScrollLerp * 8.0);
        heroUi.style.opacity = uiOpacity.toFixed(3);
        heroUi.style.transform = `translateY(${-currentScrollLerp * 80}px) scale(${1.0 + currentScrollLerp * 0.08})`;
        heroUi.style.pointerEvents = uiOpacity < 0.1 ? 'none' : 'auto';
      }

      if (heroScrollHint) {
        heroScrollHint.style.opacity = Math.max(0, 1.0 - currentScrollLerp * 10.0).toFixed(3);
      }

      // 5. Kinetic Section 2 Reveal & Exit Controller (Strict Sequence: Punto -> Línea -> Plano)
      const secPortal = document.getElementById('seccion-portal-revelada');
      const slitLeft = document.getElementById('portal-reveal-slit-left');
      const slitRight = document.getElementById('portal-reveal-slit-right');
      const portalDot = document.getElementById('portal-reveal-dot');

      if (secPortal) {
        if (currentScrollLerp < T_REVEAL_START) {
          // Pre-reveal
          secPortal.style.clipPath = 'inset(50% 50% 50% 50%)';
          secPortal.style.opacity = '0';
          secPortal.style.filter = 'blur(20px)';
          secPortal.style.pointerEvents = 'none';

          if (portalDot) portalDot.style.opacity = '0';
          if (slitLeft) slitLeft.style.opacity = '0';
          if (slitRight) slitRight.style.opacity = '0';

        } else if (currentScrollLerp < T_REVEAL_END) {
          // -------------------- ENTRANCE: PUNTO -> LÍNEA -> PLANO --------------------
          const pReveal = (currentScrollLerp - T_REVEAL_START) / (T_REVEAL_END - T_REVEAL_START);
          secPortal.scrollTop = 0;

          if (pReveal < 0.18) {
            // ETAPA 1: PRIMERO EL PUNTO (Center laser dot appears & pulses alone)
            const pDot = pReveal / 0.18;
            if (portalDot) {
              const dotScale = Math.min(1.4, pDot * 1.5);
              portalDot.style.top = '50%';
              portalDot.style.left = '50%';
              portalDot.style.transform = `translate(-50%, -50%) scale(${dotScale.toFixed(2)})`;
              portalDot.opacity = Math.min(1.0, pDot * 2.0).toFixed(3);
            }
            if (slitLeft) slitLeft.style.opacity = '0';
            if (slitRight) slitRight.style.opacity = '0';
            secPortal.style.opacity = '0';
            secPortal.style.clipPath = 'inset(50% 50% 50% 50%)';

          } else if (pReveal < 0.42) {
            // ETAPA 2: DESPUÉS LA LÍNEA (Vertical laser line shoots from center dot top & bottom)
            const v = (pReveal - 0.18) / 0.24;
            const beamHeight = v * 100;
            const beamTop = 50 - (v * 50);

            if (portalDot) {
              portalDot.style.top = '50%';
              portalDot.style.left = '50%';
              portalDot.style.transform = 'translate(-50%, -50%) scale(1.0)';
              portalDot.style.opacity = Math.max(0, 1.0 - v * 1.5).toFixed(3);
            }

            if (slitLeft) {
              slitLeft.style.left = '50%';
              slitLeft.style.top = beamTop.toFixed(2) + '%';
              slitLeft.style.height = beamHeight.toFixed(2) + '%';
              slitLeft.style.opacity = '1.0';
            }
            if (slitRight) slitRight.style.opacity = '0';

            secPortal.style.clipPath = `inset(${beamTop.toFixed(2)}% 49.9% ${beamTop.toFixed(2)}% 49.9%)`;
            secPortal.style.opacity = Math.min(v * 1.5, 1.0).toFixed(3);
            secPortal.style.filter = `blur(${((1.0 - v) * 15).toFixed(1)}px)`;
            secPortal.style.pointerEvents = 'none';

          } else {
            // ETAPA 3: DESPUÉS EL PLANO (Vertical Line splits and opens sideways like curtains)
            const h = (pReveal - 0.42) / 0.58;
            const hEased = Math.sin((h * Math.PI) / 2);
            if (portalDot) portalDot.style.opacity = '0';

            const insetX = (1.0 - hEased) * 50;
            const beamOpacity = Math.max(0, 1.0 - hEased * 1.3);

            if (slitLeft) {
              slitLeft.style.left = insetX.toFixed(2) + '%';
              slitLeft.style.top = '0%';
              slitLeft.style.height = '100%';
              slitLeft.style.opacity = beamOpacity.toFixed(3);
            }
            if (slitRight) {
              slitRight.style.left = (100 - insetX).toFixed(2) + '%';
              slitRight.style.top = '0%';
              slitRight.style.height = '100%';
              slitRight.style.opacity = beamOpacity.toFixed(3);
            }

            secPortal.style.clipPath = `inset(0% ${insetX.toFixed(2)}% 0% ${insetX.toFixed(2)}%)`;
            secPortal.style.opacity = '1.0';
            const blurVal = (1.0 - hEased) * 10;
            secPortal.style.filter = blurVal > 0.4 ? `blur(${blurVal.toFixed(1)}px)` : 'none';
            secPortal.style.pointerEvents = h > 0.8 ? 'auto' : 'none';

            const sec2Vid = document.getElementById('section2-manifesto-video');
            if (sec2Vid && sec2Vid.paused) {
              sec2Vid.play().catch(() => {});
            }
          }

        } else if (currentScrollLerp < T_EXIT_START) {
          // -------------------- Section 2 Fully Flat & Reading Mode with Internal Scroll --------------------
          secPortal.style.clipPath = 'none';
          secPortal.style.opacity = '1.0';
          secPortal.style.filter = 'none';
          secPortal.style.pointerEvents = 'auto';

          if (slitLeft) slitLeft.style.opacity = '0';
          if (slitRight) slitRight.style.opacity = '0';
          if (portalDot) portalDot.style.opacity = '0';

          const pContent = (currentScrollLerp - T_REVEAL_END) / (T_CONTENT_SCROLL_END - T_REVEAL_END);
          const maxScroll = secPortal.scrollHeight - secPortal.clientHeight;
          if (maxScroll > 0) {
            secPortal.scrollTop = pContent * maxScroll;
          }

        } else {
          // -------------------- SALIDA: PLANO -> LÍNEA (0.35 -> 0.40) --------------------
          const hExit = (currentScrollLerp - T_EXIT_START) / (T_PHONE_ZOOM_START - T_EXIT_START);
          const hExitEased = Math.sin((hExit * Math.PI) / 2);
          const insetX = hExitEased * 50;

          secPortal.style.clipPath = `inset(0% ${insetX.toFixed(2)}% 0% ${insetX.toFixed(2)}%)`;
          secPortal.style.opacity = '1.0';
          secPortal.style.filter = `blur(${(hExit * 10).toFixed(1)}px)`;
          secPortal.style.pointerEvents = 'none';

          if (slitLeft) {
            slitLeft.style.left = insetX.toFixed(2) + '%';
            slitLeft.style.top = '0%';
            slitLeft.style.height = '100%';
            slitLeft.style.opacity = Math.min(1.0, hExit * 1.5).toFixed(3);
          }
          if (slitRight) {
            slitRight.style.left = (100 - insetX).toFixed(2) + '%';
            slitRight.style.top = '0%';
            slitRight.style.height = '100%';
            slitRight.style.opacity = Math.min(1.0, hExit * 1.5).toFixed(3);
          }
          if (portalDot) portalDot.style.opacity = '0';
        }
      }
    } else {
      // --- Phase B: Section 3 Smartphone 3D Mode ---
      modelGroup.visible = false;
      smartphoneGroup.visible = true;

      // Elevate 3D Canvas Layer in front of all backgrounds and closed sections (z-index: 50)
      const hero3dContainer = document.getElementById('hero-3d-container');
      if (hero3dContainer) {
        hero3dContainer.style.zIndex = '50';
      }

      // Kinetic Text Background (Originkit) emerges behind the smartphone (z-index: 32)
      const kineticBg = document.getElementById('kinetic-text-bg');
      if (kineticBg && currentScrollLerp < T_SPIN_END) {
        const pKinetic = Math.min(1.0, (currentScrollLerp - T_PHONE_ZOOM_START) / 0.03);
        kineticBg.style.opacity = pKinetic.toFixed(3);
        kineticBg.style.filter = 'blur(0px)';
      }

      // Calibrated Soft Lighting for Smartphone (Crisp Text & Dark Rat-Gray Chassis Contrast)
      dirLightLime.color.set(0xffffff);
      dirLightPurple.color.set(0x64b5f6);
      pointLight.color.set(0xffffff);
      ambientLight.intensity = 1.0;
      dirLightLime.intensity = 0.8;
      dirLightPurple.intensity = 1.0;
      pointLight.intensity = 0.35;
      pointLight.position.set(-8.0, 3.0, 5.0);
      phoneFrontLight.intensity = 0.30;
      phoneFrontLight.position.set(-8.0, 2.0, 6.0);

      const secPortal = document.getElementById('seccion-portal-revelada');
      const portalDot = document.getElementById('portal-reveal-dot');
      const slitLeft = document.getElementById('portal-reveal-slit-left');
      const slitRight = document.getElementById('portal-reveal-slit-right');
      if (slitRight) slitRight.style.opacity = '0';

      // Section 2 Line -> Point collapse (0.40 -> 0.46)
      if (currentScrollLerp < T_EXIT_END) {
        const vExit = (currentScrollLerp - T_PHONE_ZOOM_START) / (T_EXIT_END - T_PHONE_ZOOM_START);
        const beamHeight = (1.0 - vExit) * 100;
        const beamTop = vExit * 50;

        if (secPortal) {
          secPortal.style.clipPath = `inset(${beamTop.toFixed(2)}% 49.9% ${beamTop.toFixed(2)}% 49.9%)`;
          secPortal.style.opacity = Math.max(0, 1.0 - vExit * 1.5).toFixed(3);
          secPortal.style.pointerEvents = 'none';
        }

        if (slitLeft) {
          slitLeft.style.left = '50%';
          slitLeft.style.top = beamTop.toFixed(2) + '%';
          slitLeft.style.height = beamHeight.toFixed(2) + '%';
          slitLeft.style.opacity = Math.max(0, 1.0 - vExit).toFixed(3);
        }

        if (portalDot) {
          portalDot.style.top = '50%';
          portalDot.style.left = '50%';
          portalDot.style.transform = 'translate(-50%, -50%) scale(1.0)';
          portalDot.style.opacity = Math.min(1.0, vExit * 1.8).toFixed(3);
        }
      } else {
        if (secPortal) {
          secPortal.style.opacity = '0';
          secPortal.style.pointerEvents = 'none';
        }
        if (slitLeft) slitLeft.style.opacity = '0';
      }

      camera.position.set(0, 0, 8.5);
      camera.lookAt(0, 0, 0);

      const hero3dCanvas = document.getElementById('hero-3d-canvas');

      if (currentScrollLerp < T_PHONE_ZOOM_END) {
        // B.1 Emergence & Continuous Zoom Out to Center (0.40 -> 0.60)
        const pZoom = (currentScrollLerp - T_PHONE_ZOOM_START) / (T_PHONE_ZOOM_END - T_PHONE_ZOOM_START);
        const pZoomEased = Math.sin((pZoom * Math.PI) / 2);

        // Center dot fades out as smartphone finishes expanding
        if (portalDot && currentScrollLerp >= T_EXIT_END) {
          const pDotFade = (currentScrollLerp - T_EXIT_END) / (T_PHONE_ZOOM_END - T_EXIT_END);
          portalDot.style.opacity = Math.max(0, 1.0 - pDotFade * 2.0).toFixed(3);
        }

        // Starts extra large (5.0x) covering beyond viewport, smoothly zooms out to center (1.0x)
        const phoneScale = 5.0 - (pZoomEased * 4.0);
        smartphoneGroup.scale.set(phoneScale, phoneScale, phoneScale);
        smartphoneGroup.position.set(0, 0, 0);
        smartphoneGroup.rotation.set(
          0.06 * (1.0 - pZoomEased),
          -0.12 * (1.0 - pZoomEased),
          0
        );

        if (hero3dCanvas) {
          hero3dCanvas.style.filter = 'drop-shadow(0 0 60px rgba(82,39,255,0.45))';
        }

      } else if (currentScrollLerp < T_SPIN_END) {
        // B.2 360° Horizontal Spin with Scroll (0.60 -> 0.80)
        if (portalDot) portalDot.style.opacity = '0';
        if (hero3dCanvas) hero3dCanvas.style.filter = 'drop-shadow(0 0 60px rgba(82,39,255,0.45))';

        camera.position.set(0, 0, 8.5);
        camera.lookAt(0, 0, 0);

        const pSpin = (currentScrollLerp - T_SPIN_START) / (T_SPIN_END - T_SPIN_START);
        smartphoneGroup.scale.set(1.0, 1.0, 1.0);
        smartphoneGroup.position.set(0, 0, 0);
        smartphoneGroup.rotation.set(0, pSpin * Math.PI * 2, 0); // Full 360° Spin!

      } else {
        // B.3 Desplazamiento hacia arriba con scroll y desvanecimiento en blur del fondo (0.80 -> 1.00)
        if (portalDot) portalDot.style.opacity = '0';
        if (hero3dCanvas) hero3dCanvas.style.filter = 'drop-shadow(0 0 60px rgba(82,39,255,0.45))';

        camera.position.set(0, 0, 8.5);
        camera.lookAt(0, 0, 0);

        const pUp = (currentScrollLerp - T_SPIN_END) / (1.0 - T_SPIN_END);
        const pUpEased = Math.sin((pUp * Math.PI) / 2);

        // Smartphone se desplaza hacia arriba suavemente
        smartphoneGroup.scale.set(1.0, 1.0, 1.0);
        smartphoneGroup.position.set(0, pUpEased * 9.0, 0);
        smartphoneGroup.rotation.set(0, Math.PI * 2, 0); // Frontal

        // Fondo con letras se desvanece en blur progresivo
        if (kineticBg) {
          const blurAmount = (pUpEased * 28).toFixed(1);
          const bgOpacity = Math.max(0, 1.0 - pUpEased * 1.3).toFixed(3);
          kineticBg.style.filter = `blur(${blurAmount}px)`;
          kineticBg.style.opacity = bgOpacity;
        }
      }
    }

    // ==================== SECTION 3 CASCADING DUAL-COLUMN STREAM ====================
    const sec3Container = document.getElementById('seccion-3-ecosistema');
    if (sec3Container) {
      if (currentScrollLerp >= T_SPIN_END) {
        sec3Container.style.opacity = '1';
        sec3Container.style.pointerEvents = 'auto';

        // Escalonamiento secuencial: Cada tarjeta (k+1) empieza a subir cuando la anterior (k) alcanza el 60% de visibilidad
        const cardStarts = [0.80, 0.84, 0.88, 0.92];
        const cardDuration = 0.07;

        for (let k = 0; k < 4; k++) {
          const card = document.getElementById(`sec3-card-${k}`);
          if (card) {
            const start = cardStarts[k];
            if (currentScrollLerp < start) {
              card.style.opacity = '0';
              card.style.transform = 'translateY(120px)';
            } else {
              const pCard = Math.min(1.0, (currentScrollLerp - start) / cardDuration);
              const pCardEased = Math.sin((pCard * Math.PI) / 2);
              card.style.opacity = pCardEased.toFixed(3);
              card.style.transform = `translateY(${((1.0 - pCardEased) * 120).toFixed(1)}px)`;
            }
          }
        }
      } else {
        sec3Container.style.opacity = '0';
        sec3Container.style.pointerEvents = 'none';
        for (let k = 0; k < 4; k++) {
          const card = document.getElementById(`sec3-card-${k}`);
          if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(120px)';
          }
        }
      }
    }

    // ==================== BOTTOM DOCK NAV SYNCHRONIZED FADE & ACTIVE STATE ====================
    if (bottomDock) {
      let dockOpacity = 0;
      if (currentScrollLerp < T_REVEAL_START) {
        // Hero: Se desvanece al mismo ritmo exacto que los textos del Hero
        dockOpacity = Math.max(0, 1.0 - currentScrollLerp * 8.0);
        updateActiveDockItem(null);
      } else if (currentScrollLerp < T_REVEAL_END) {
        // Apertura Sección 2: Vuelve a aparecer suavemente conforme se abre el plano
        const pOpen = (currentScrollLerp - T_REVEAL_START) / (T_REVEAL_END - T_REVEAL_START);
        dockOpacity = Math.min(1.0, Math.max(0, pOpen));
        updateActiveDockItem(0);
      } else if (currentScrollLerp < T_EXIT_START) {
        // Sección 2 Abierta: 100% visible con 01 // Manifiesto activo
        dockOpacity = 1.0;
        updateActiveDockItem(0);
      } else if (currentScrollLerp < T_EXIT_END) {
        // Cierre Sección 2: Se desvanece junto con el cierre de la cortina
        const pClose = (currentScrollLerp - T_EXIT_START) / (T_EXIT_END - T_EXIT_START);
        dockOpacity = Math.max(0, 1.0 - pClose * 1.5);
        updateActiveDockItem(null);
      } else if (currentScrollLerp < T_SPIN_END) {
        // Transición Smartphone 3D (Zoom out y giro)
        dockOpacity = 0;
        updateActiveDockItem(null);
      } else {
        // Sección 3 Desplegada: Vuelve a aparecer con 02 // Ecosistema activo
        const pSec3 = (currentScrollLerp - T_SPIN_END) / (1.0 - T_SPIN_END);
        dockOpacity = Math.min(1.0, pSec3 * 2.0);
        updateActiveDockItem(1);
      }
      bottomDock.style.opacity = dockOpacity.toFixed(3);
      bottomDock.style.transform = `translate(-50%, ${(1.0 - dockOpacity) * 20}px)`;
      bottomDock.style.pointerEvents = dockOpacity > 0.4 ? 'auto' : 'none';
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);

  // Handle WebGL context restoration for low-memory mobile devices
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.warn('WebGL Context Lost. Retrying context restoration...');
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    console.log('WebGL Context Restored.');
    syncSize();
  }, false);
}

/**
 * StrokeText Effect Component logic for "Diseñamos \n instinto."
 * High-Speed responsive execution:
 * strokeColor="#A78BFA", fillColor="#F8FAFC", drawDuration=0.85s, fillDelay=0.1s, fillMode="wipe", ease="power2.out"
 */
function triggerStrokeTextEffect() {
  const wrapper = document.getElementById('stroke-text-wrapper');
  const strokePath = document.querySelector('.stroke-draw-path');
  const wipeRect = document.getElementById('stroke-wipe-rect');
  if (!strokePath || !wipeRect) return;

  // Initial states: blur & opacity entrance
  if (wrapper && typeof gsap !== 'undefined') {
    gsap.set(wrapper, { filter: "blur(18px)", opacity: 0, y: 15 });
  }
  strokePath.style.strokeDashoffset = '4500';
  strokePath.style.stroke = '#FFFFFF';
  wipeRect.setAttribute('width', '0%');

  if (typeof gsap !== 'undefined') {
    const tl = gsap.timeline();

    // 1. Smooth Blur & Fade-in Entrance + Stroke Drawing (duration: 0.9s, ease: power3.out)
    if (wrapper) {
      tl.to(wrapper, {
        filter: "blur(0px)",
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out"
      }, 0);
    }

    tl.to(strokePath, {
      strokeDashoffset: 0,
      duration: 0.9,
      ease: "power3.out"
    }, 0)
      // 2. Smooth Wipe Fill Animation in White (#FFFFFF) (duration: 0.65s)
      .to(wipeRect, {
        attr: { width: "100%" },
        duration: 0.65,
        ease: "power2.inOut"
      }, "+=0.10")
      // 3. EXACTLY AFTER wipe fill completes, trigger the Green Curtain Reveal:
      .add(() => {
        triggerCurtainRevealEffect();
      }, "+=0.05");
  } else {
    // CSS Fallback
    if (wrapper) {
      wrapper.style.transition = 'filter 0.9s ease-out, opacity 0.9s ease-out, transform 0.9s ease-out';
      wrapper.style.filter = 'blur(0px)';
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'translateY(0px)';
    }
    strokePath.style.transition = 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
    strokePath.style.strokeDashoffset = '0';
    setTimeout(() => {
      wipeRect.style.transition = 'width 0.65s cubic-bezier(0.65, 0, 0.35, 1)';
      wipeRect.setAttribute('width', '100%');
      setTimeout(triggerCurtainRevealEffect, 680);
    }, 1000);
  }
}

/**
 * Symmetrical Flank Reveal Effect for LA MARCA (Left) & EL DESTINO (Right)
 */
function triggerCurtainRevealEffect() {
  const left = document.getElementById('hero-curtain-left');
  const right = document.getElementById('hero-curtain-right');
  if (!left && !right) return;

  if (typeof gsap !== 'undefined') {
    const tl = gsap.timeline();
    if (left) {
      gsap.set(left, { opacity: 0, y: 15 });
      tl.to(left, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out"
      }, 0);
    }
    if (right) {
      gsap.set(right, { opacity: 0, y: 15 });
      tl.to(right, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out"
      }, 0.12);
    }
  } else {
    if (left) left.style.opacity = '1';
    if (right) right.style.opacity = '1';
  }
}

// ==================== REACT BITS PILLNAV MAGNETIC HOVER EFFECT ====================
document.addEventListener('DOMContentLoaded', () => {
  const pillBtn = document.getElementById('header-pill-nav-btn');
  if (!pillBtn) return;

  pillBtn.addEventListener('mousemove', (e) => {
    const rect = pillBtn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    if (typeof gsap !== 'undefined') {
      gsap.to(pillBtn, {
        x: x * 0.28,
        y: y * 0.28,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  });

  pillBtn.addEventListener('mouseleave', () => {
    if (typeof gsap !== 'undefined') {
      gsap.to(pillBtn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.4)"
      });
    }
  });

  // ==================== FLOATING CHATBOT CONTROLLER ====================
  const chatTrigger = document.getElementById('chatbot-trigger-btn');
  const chatWindow = document.getElementById('chatbot-window');
  const chatClose = document.getElementById('chatbot-close-btn');
  const chatForm = document.getElementById('chatbot-form');
  const chatInput = document.getElementById('chatbot-input');
  const chatMessages = document.getElementById('chatbot-messages');

  if (chatTrigger && chatWindow) {
    let isOpen = false;

    const toggleChat = (forceState) => {
      isOpen = forceState !== undefined ? forceState : !isOpen;
      if (isOpen) {
        chatWindow.classList.remove('hidden');
        setTimeout(() => {
          chatWindow.classList.remove('opacity-0', 'translate-y-4');
          chatWindow.classList.add('opacity-100', 'translate-y-0');
        }, 10);
        if (chatInput) chatInput.focus();
      } else {
        chatWindow.classList.remove('opacity-100', 'translate-y-0');
        chatWindow.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => {
          chatWindow.classList.add('hidden');
        }, 300);
      }
    };

    chatTrigger.addEventListener('click', () => toggleChat());
    if (chatClose) chatClose.addEventListener('click', () => toggleChat(false));

    const appendMessage = (text, isUser = false) => {
      if (!chatMessages) return;
      const msgDiv = document.createElement('div');
      msgDiv.className = `flex gap-2.5 items-start ${isUser ? 'justify-end' : ''}`;
      
      if (isUser) {
        msgDiv.innerHTML = `
          <div class="bg-vector-lime text-vector-black font-semibold rounded-2xl rounded-tr-none p-3 max-w-[80%] leading-relaxed shadow-sm">
            <p class="font-sans text-xs">${text}</p>
          </div>
        `;
      } else {
        msgDiv.innerHTML = `
          <div class="w-6 h-6 rounded-full overflow-hidden border border-vector-lime/30 shrink-0 bg-vector-black">
            <img src="chatbot-icon.png" alt="AI" class="w-full h-full object-cover" />
          </div>
          <div class="bg-white/10 border border-white/10 rounded-2xl rounded-tl-none p-3 text-white/90 leading-relaxed shadow-sm max-w-[85%]">
            <p class="font-sans text-xs">${text}</p>
          </div>
        `;
      }
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleBotResponse = (query) => {
      setTimeout(() => {
        let answer = "Excelente pregunta. En Vector Inside 3.0 rediseñamos la arquitectura de conversión para eliminar la fricción estructural y escalar tus resultados comerciales de forma predecible.";
        const q = query.toLowerCase();
        if (q.includes('diagnóstico') || q.includes('diagnostico')) {
          answer = "El <strong>Diagnóstico Nuclear</strong> evalúa en tiempo real tus 3 vectores críticos: Adquisición, Conversión y Retención, identificando las fugas exactas de capital en tu funnel.";
        } else if (q.includes('arquitectura') || q.includes('conversión') || q.includes('conversion')) {
          answer = "Nuestra <strong>Arquitectura de Conversión</strong> sustituye los parches aislados por una matriz modular de 40 bloques estratégicos de tracción predecible.";
        } else if (q.includes('agendar') || q.includes('sesión') || q.includes('contacto') || q.includes('cita')) {
          answer = "Puedes reservar directamente una sesión de diagnóstico estratégico con nuestros arquitectos en nuestro módulo de diagnóstico o escribiéndonos a <strong>contacto@vectorinside.com</strong>.";
        }
        appendMessage(answer, false);
      }, 700);
    };

    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        appendMessage(text, true);
        chatInput.value = '';
        handleBotResponse(text);
      });
    }

    document.querySelectorAll('.chatbot-quick-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-msg') || btn.textContent.trim();
        appendMessage(query, true);
        handleBotResponse(query);
      });
    });
  }
});

// ==================== CINEMATIC SMOOTH SCROLL TO SECTION 2 ====================
function scrollToSection2() {
  const track = document.getElementById('hero-scroll-track');
  if (!track) return;
  const trackRect = track.getBoundingClientRect();
  const trackTop = window.scrollY + trackRect.top;
  const maxScroll = track.offsetHeight - window.innerHeight;
  const targetY = trackTop + maxScroll * 0.22;

  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = 1600; // 1.6s smooth cinematic glide
  let startTime = null;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    const easeProgress = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * easeProgress);

    if (progress < 1.0) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}
window.scrollToSection2 = scrollToSection2;
