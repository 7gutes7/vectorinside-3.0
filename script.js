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

  // 2. Initialize React Bits RippleDistortion on Hero Stage
  initHeroRippleDistortion();

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
  renderer.setClearColor(0x000000, 0);
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

  // Luz de rebote púrpura muy sutil en la parte inferior izquierda del modelo 3D Hero
  const lowerLeftPurpleLight = new THREE.DirectionalLight(0x7928ca, 0.75);
  lowerLeftPurpleLight.position.set(-4.5, -4.5, 3.5);
  scene.add(lowerLeftPurpleLight);

  // Luz de rebote rosa/rojo sutil en la parte superior derecha del modelo 3D Hero
  const upperRightPinkLight = new THREE.DirectionalLight(0xff1443, 0.95);
  upperRightPinkLight.position.set(4.5, 6.0, 3.5);
  scene.add(upperRightPinkLight);

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
      u_opacity: { value: 0.72 }
    },
    transparent: true,
    depthWrite: false
  });

  const topoMesh = new THREE.Mesh(topoGeo, topoMaterial);
  topoMesh.visible = false;

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

        // Grabado láser sutil del isotipo Vector Inside en la parte trasera del smartphone
        const logoCanvas = document.createElement('canvas');
        logoCanvas.width = 512;
        logoCanvas.height = 732;
        const ctx = logoCanvas.getContext('2d');
        const p = new Path2D("M288.16,247.33L345.68,0h-104.05l-44.02,191.85h18.56v21.49h-18.88v68.37h-12.98v68.09h-30.91v-46.52h-11.15v-89.94h-38.01v-21.49h43.83L104.05,0H0l102.41,440.35h36.89v21.49h-31.89l7.63,32.82h125.76v-85.31h40.18v-48.98h-22.25v-21.49h29.43v-91.55M169.02,191.85h-26.78v21.49h26.78v-21.49Z");
        ctx.save();
        ctx.scale(512 / 345.68, 732 / 494.65);
        ctx.fillStyle = '#cbd5e1'; // Gris plata / platino más claro para simular grabado láser brillante
        ctx.fill(p, 'evenodd');
        ctx.restore();

        const logoTexture = new THREE.CanvasTexture(logoCanvas);
        logoTexture.minFilter = THREE.LinearFilter;
        logoTexture.magFilter = THREE.LinearFilter;

        // Bounding box exacto del teléfono para centrado perfecto horizontal y vertical
        const groupLocalBox = new THREE.Box3().setFromObject(smartphoneGroup);
        const groupCenter = groupLocalBox.getCenter(new THREE.Vector3());
        const backZ = groupLocalBox.min.z;

        // Tamaño reducido un 40% (0.43 x 0.62)
        const logoGeo = new THREE.PlaneGeometry(0.43, 0.62);
        const logoMat = new THREE.MeshStandardMaterial({
          map: logoTexture,
          transparent: true,
          opacity: 0.92,
          roughness: 0.18,
          metalness: 0.88,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const logoMesh = new THREE.Mesh(logoGeo, logoMat);
        // Centrado exacto horizontal (X) y vertical (Y) anclado en la tapa trasera (-Z)
        logoMesh.position.set(groupCenter.x, groupCenter.y, backZ - 0.003);
        logoMesh.rotation.set(0, Math.PI, 0);
        logoMesh.renderOrder = 2;
        smartphoneGroup.add(logoMesh);
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

  // ==================== BIDIRECTIONAL SCROLL CONTROLLER FOR SECTION 3 (ECOSISTEMA) ====================
  let isUserInteractingSec3 = false;
  let sec3InteractionTimer = null;
  const sec3EcosystemElem = document.getElementById('seccion-3-ecosistema');
  const sec3ScrollContainerElem = document.getElementById('sec3-cards-scroll-container');

  if (sec3EcosystemElem) {
    // Forward wheel events inside ecosystem directly to window scroll for seamless global sync
    sec3EcosystemElem.addEventListener('wheel', (e) => {
      window.scrollBy({ top: e.deltaY, behavior: 'auto' });
      e.preventDefault();
    }, { passive: false });

    // Touch support for mobile touchscreens & trackpads
    let sec3TouchStartY = 0;
    sec3EcosystemElem.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        sec3TouchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    sec3EcosystemElem.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = sec3TouchStartY - currentY; // > 0 = drag up / scroll down, < 0 = drag down / scroll up
      sec3TouchStartY = currentY;
      window.scrollBy({ top: deltaY, behavior: 'auto' });
    }, { passive: true });
  }

  if (sec3ScrollContainerElem) {
    // If the user manually scrolls or drags the scrollbar of the cards container
    sec3ScrollContainerElem.addEventListener('scroll', () => {
      if (isUserInteractingSec3) {
        const maxInternalScroll = sec3ScrollContainerElem.scrollHeight - sec3ScrollContainerElem.clientHeight;
        if (maxInternalScroll > 0) {
          const ratio = Math.max(0, Math.min(1.0, sec3ScrollContainerElem.scrollTop / maxInternalScroll));
          const targetProgress = 0.725 + ratio * (0.81 - 0.725);
          const track = document.getElementById('hero-scroll-track');
          if (track) {
            const trackRect = track.getBoundingClientRect();
            const trackTop = window.scrollY + trackRect.top;
            const maxScroll = track.offsetHeight - window.innerHeight;
            window.scrollTo(0, trackTop + targetProgress * maxScroll);
          }
        }
      }
    }, { passive: true });

    sec3ScrollContainerElem.addEventListener('pointerdown', () => {
      isUserInteractingSec3 = true;
    });
    window.addEventListener('pointerup', () => {
      if (isUserInteractingSec3) {
        clearTimeout(sec3InteractionTimer);
        sec3InteractionTimer = setTimeout(() => {
          isUserInteractingSec3 = false;
        }, 150);
      }
    });
  }

  // ==================== BIDIRECTIONAL SCROLL CONTROLLER FOR SCROLL-EXPAND (03 EJECUCIÓN) ====================
  const scrollExpandWrapperElem = document.getElementById('sec-scroll-expand-wrapper');
  const secEjecucionScrollContainer = document.getElementById('sec-ejecucion-scroll-container');

  if (secEjecucionScrollContainer) {
    secEjecucionScrollContainer.addEventListener('wheel', (e) => {
      // If the section is not fully expanded yet (expansion in progress)
      if (currentScrollLerp < 0.95) {
        window.scrollBy({ top: e.deltaY, behavior: 'auto' });
        e.preventDefault();
        return;
      }

      // If fully expanded:
      // If user is at top of internal container (scrollTop <= 0) and scrolling UP (deltaY < 0), forward to window scroll
      if (secEjecucionScrollContainer.scrollTop <= 0 && e.deltaY < 0) {
        window.scrollBy({ top: e.deltaY, behavior: 'auto' });
        e.preventDefault();
      }
      // Otherwise allow standard internal scrolling of the 25-block matrix
    }, { passive: false });

    let expandTouchStartY = 0;
    secEjecucionScrollContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        expandTouchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    secEjecucionScrollContainer.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = expandTouchStartY - currentY;
      expandTouchStartY = currentY;

      if (currentScrollLerp < 0.95) {
        window.scrollBy({ top: deltaY, behavior: 'auto' });
        return;
      }

      if (secEjecucionScrollContainer.scrollTop <= 0 && deltaY < 0) {
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

    // 0. Update Hero Background Video (Silver Silk Cloth Billowing) Fade with Scroll
    const heroBgVideo = document.getElementById('hero-bg-video-wrapper');
    if (heroBgVideo) {
      const pBgFade = Math.max(0, (currentScrollLerp - 0.055) / 0.045);
      const bgOpacity = Math.max(0, 1.0 - Math.min(1.0, pBgFade));
      heroBgVideo.style.opacity = bgOpacity.toFixed(3);
      heroBgVideo.style.visibility = bgOpacity > 0.001 ? 'visible' : 'hidden';
    }

    // Update Hero RippleDistortion Fade with Scroll
    const heroRipple = document.getElementById('hero-ripple-distortion');
    if (heroRipple) {
      const pRipFade = Math.max(0, (currentScrollLerp - 0.055) / 0.045);
      const ripOpacity = Math.max(0, 1.0 - Math.min(1.0, pRipFade));
      heroRipple.style.opacity = ripOpacity.toFixed(3);
      heroRipple.style.visibility = ripOpacity > 0.001 ? 'visible' : 'hidden';
    }

    // Smoothly interpolate scroll progress for cinematic motion
    currentScrollLerp += (scrollProgress - currentScrollLerp) * 0.12;

    // =========================================================================
    // UNIFIED DETERMINISTIC SCROLL TIMELINE (0.0 to 1.0)
    // =========================================================================
    const T_HEAD_ZOOM_END = 0.10;       // 0% -> 10%: 3D Head zooms into eye
    const T_REVEAL_START = 0.08;        // 8% -> Laser dot appears
    const T_REVEAL_END = 0.16;          // 16% -> Section 2 curtains 100% open & flat
    const T_CONTENT_SCROLL_END = 0.28;  // 16% -> 28%: Section 2 content active
    const T_EXIT_START = 0.29;          // 29% -> Curtains start closing (Plano -> Línea)
    const T_PHONE_ZOOM_START = 0.34;    // 34% -> Vertical line is formed & Smartphone starts Zoom Out!
    const T_EXIT_END = 0.39;            // 39% -> Line collapses to center PUNTO
    const T_PHONE_ZOOM_END = 0.50;      // 50% -> Smartphone fully centered
    const T_SPIN_START = 0.50;          // 50% -> 360° rotation begins with scroll
    const T_SPIN_END = 0.65;            // 65% -> 360° spin completes
    // 65% -> 70%: Smartphone shifts upwards & Kinetic Text Background fades out
    // 70% -> 81%: Section 3 Ecosistema cards stream active
    // 81% -> 84%: ScrollExpand appears with blur effect
    // 84% -> 96%: ScrollExpand expands to full screen (44vw->100vw, 58vh->100vh, 24px->0px) & flanks retreat
    // 96% -> 100%: 03 // Ejecución full stage active

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

      lowerLeftPurpleLight.intensity = 0.75;
      upperRightPinkLight.color.set(0xff1443);
      upperRightPinkLight.intensity = 0.95;

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

      // 4. UI Layer Fade-out & Hero Curtain Right Dynamic Scale & Shift (+25px inicial -> 0px final con scroll)
      const curtainRight = document.getElementById('hero-curtain-right');
      if (curtainRight) {
        curtainRight.style.transformOrigin = 'right center';
        const pScale = Math.min(1.0, currentScrollLerp / 0.08);
        const pScaleEased = Math.sin((pScale * Math.PI) / 2);
        const currentScale = 0.85 + 0.15 * pScaleEased;
        const currentX = (1.0 - pScaleEased) * 25; // +25px a la derecha inicial -> 0px final
        curtainRight.style.transform = `translateX(${currentX.toFixed(1)}px) scale(${currentScale.toFixed(3)})`;
      }

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

      // Elevate 3D Canvas Layer: frente al fondo cinético (z-32), pero detrás de la línea y punto de cierre (z-35, z-36)
      const hero3dContainer = document.getElementById('hero-3d-container');
      if (hero3dContainer) {
        hero3dContainer.style.zIndex = '34';
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
      lowerLeftPurpleLight.intensity = 0.0;
      upperRightPinkLight.intensity = 0.0;
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
        // B.3 Desplazamiento hacia arriba con scroll y desvanecimiento en blur del fondo (0.65 -> 0.70)
        if (portalDot) portalDot.style.opacity = '0';
        if (hero3dCanvas) hero3dCanvas.style.filter = 'drop-shadow(0 0 60px rgba(82,39,255,0.45))';

        camera.position.set(0, 0, 8.5);
        camera.lookAt(0, 0, 0);

        const pUp = Math.min(1.0, (currentScrollLerp - T_SPIN_END) / 0.05);
        const pUpEased = Math.sin((pUp * Math.PI) / 2);

        // Smartphone se desplaza hacia arriba suavemente
        smartphoneGroup.scale.set(1.0, 1.0, 1.0);
        smartphoneGroup.position.set(0, pUpEased * 9.0, 0);
        smartphoneGroup.rotation.set(0, Math.PI * 2, 0); // Frontal
        // Desactivar renderizado 3D del smartphone una vez fuera del visor
        if (pUpEased > 0.85) {
          smartphoneGroup.visible = false;
        }

        // Fondo con letras se desvanece de forma limpia
        if (kineticBg) {
          if (pUpEased >= 0.85) {
            kineticBg.style.display = 'none';
            kineticBg.style.visibility = 'hidden';
            kineticBg.style.opacity = '0';
          } else {
            kineticBg.style.display = 'block';
            kineticBg.style.visibility = 'visible';
            kineticBg.style.opacity = Math.max(0, 1.0 - pUpEased * 1.5).toFixed(3);
          }
          kineticBg.style.filter = 'none';
        }
      }
    }

    // Section 3 Background Image (fondo ecosistema.jpeg) Transition
    const sec3BgWrapper = document.getElementById('sec3-bg-wrapper');
    if (sec3BgWrapper) {
      if (currentScrollLerp >= T_SPIN_END && currentScrollLerp < 0.81) {
        const pBgSec3 = Math.min(1.0, (currentScrollLerp - T_SPIN_END) / 0.035);
        const pBgEased = Math.sin((pBgSec3 * Math.PI) / 2);
        sec3BgWrapper.style.opacity = pBgEased.toFixed(3);
        sec3BgWrapper.style.filter = 'none';
      } else if (currentScrollLerp >= 0.81 && currentScrollLerp < 0.84) {
        // Desaparición en blur sincronizada con la aparición en blur de Ejecución (0.81 -> 0.84)
        const pBlurOut = (currentScrollLerp - 0.81) / 0.03;
        const pBlurOutEased = Math.sin((pBlurOut * Math.PI) / 2);
        sec3BgWrapper.style.opacity = Math.max(0, 1.0 - pBlurOutEased).toFixed(3);
        sec3BgWrapper.style.filter = `blur(${(pBlurOutEased * 20).toFixed(1)}px)`;
      } else if (currentScrollLerp >= 0.84) {
        sec3BgWrapper.style.opacity = '0';
        sec3BgWrapper.style.filter = 'blur(20px)';
      } else {
        sec3BgWrapper.style.opacity = '0';
        sec3BgWrapper.style.filter = 'none';
      }
    }

    // Flanking Assets Animation (Entrance 0.65->0.70, Rest 0.70->0.84, Retreat 0.84->0.96)
    const flankLeft = document.getElementById('sec3-flank-left');
    const flankRight = document.getElementById('sec3-flank-right');
    if (flankLeft && flankRight) {
      if (currentScrollLerp >= T_SPIN_END && currentScrollLerp < 0.84) {
        // Entrada de flancos: poligonal02 (-100% -> -50%), liquid01 (+100% -> +50%)
        const pFlank = Math.min(1.0, (currentScrollLerp - T_SPIN_END) / 0.035);
        const pFlankEased = Math.sin((pFlank * Math.PI) / 2);

        const leftX = -100 + (pFlankEased * 50);
        flankLeft.style.transform = `translate3d(${leftX.toFixed(2)}%, -50%, 0)`;
        flankLeft.style.opacity = pFlankEased.toFixed(3);

        const rightX = 100 - (pFlankEased * 50);
        flankRight.style.transform = `translate3d(${rightX.toFixed(2)}%, -50%, 0)`;
        flankRight.style.opacity = (pFlankEased * 0.80).toFixed(3);
      } else if (currentScrollLerp >= 0.84) {
        // Retirada de flancos hacia los lados conforme ScrollExpand se expande (al contrario como entraron)
        const pRetreat = Math.min(1.0, (currentScrollLerp - 0.84) / 0.10);
        const pRetreatEased = Math.sin((pRetreat * Math.PI) / 2);

        // poligonal02 se retira hacia la izquierda: -50% -> -100%
        const leftX = -50 - (pRetreatEased * 50);
        flankLeft.style.transform = `translate3d(${leftX.toFixed(2)}%, -50%, 0)`;
        flankLeft.style.opacity = Math.max(0, 1.0 - pRetreatEased).toFixed(3);

        // liquid01 se retira hacia la derecha: +50% -> +100%
        const rightX = 50 + (pRetreatEased * 50);
        flankRight.style.transform = `translate3d(${rightX.toFixed(2)}%, -50%, 0)`;
        flankRight.style.opacity = Math.max(0, (1.0 - pRetreatEased) * 0.80).toFixed(3);
      } else {
        flankLeft.style.opacity = '0';
        flankLeft.style.transform = 'translate3d(-100%, -50%, 0)';
        flankRight.style.opacity = '0';
        flankRight.style.transform = 'translate3d(100%, -50%, 0)';
      }
    }

    // Section 3 Ecosistema Container & Cards Stream
    const sec3Container = document.getElementById('seccion-3-ecosistema');
    const sec3ScrollContainer = document.getElementById('sec3-cards-scroll-container');
    if (sec3Container) {
      if (currentScrollLerp >= 0.70 && currentScrollLerp < 0.81) {
        sec3Container.style.opacity = '1';
        sec3Container.style.filter = 'none';
        sec3Container.style.pointerEvents = 'auto';

        // Escalonamiento secuencial ágil para la revelación de las 6 tarjetas
        const cardStarts = [0.700, 0.705, 0.710, 0.715, 0.720, 0.725];
        const cardDuration = 0.014;

        for (let k = 0; k < 6; k++) {
          const card = document.getElementById(`sec3-card-${k}`);
          if (card) {
            const start = cardStarts[k];
            if (currentScrollLerp < start) {
              card.style.opacity = '0';
              card.style.transform = 'translateY(80px)';
            } else {
              const pCard = Math.min(1.0, (currentScrollLerp - start) / cardDuration);
              const pCardEased = Math.sin((pCard * Math.PI) / 2);
              card.style.opacity = pCardEased.toFixed(3);
              card.style.transform = `translateY(${((1.0 - pCardEased) * 80).toFixed(1)}px)`;
            }
          }
        }

        // Sincronización continua e instantánea del scroll de tarjetas (0.725 -> 0.81)
        if (sec3ScrollContainer && !isUserInteractingSec3) {
          const maxInternalScroll = sec3ScrollContainer.scrollHeight - sec3ScrollContainer.clientHeight;
          if (maxInternalScroll > 0) {
            if (currentScrollLerp <= 0.725) {
              sec3ScrollContainer.scrollTop = 0;
            } else {
              const pScrollCards = Math.min(1.0, Math.max(0, (currentScrollLerp - 0.725) / (0.81 - 0.725)));
              sec3ScrollContainer.scrollTop = pScrollCards * maxInternalScroll;
            }
          }
        }
      } else if (currentScrollLerp >= 0.81 && currentScrollLerp < 0.84) {
        // Desaparición en blur de Ecosistema exactamente mientras Ejecución aparece en blur (0.81 -> 0.84)
        const pBlurOut = (currentScrollLerp - 0.81) / 0.03;
        const pBlurOutEased = Math.sin((pBlurOut * Math.PI) / 2);
        sec3Container.style.opacity = Math.max(0, 1.0 - pBlurOutEased).toFixed(3);
        sec3Container.style.filter = `blur(${(pBlurOutEased * 20).toFixed(1)}px)`;
        sec3Container.style.pointerEvents = pBlurOutEased > 0.4 ? 'none' : 'auto';

        if (sec3ScrollContainer && !isUserInteractingSec3) {
          const maxInternalScroll = sec3ScrollContainer.scrollHeight - sec3ScrollContainer.clientHeight;
          if (maxInternalScroll > 0) {
            sec3ScrollContainer.scrollTop = maxInternalScroll;
          }
        }
      } else if (currentScrollLerp >= 0.84) {
        sec3Container.style.opacity = '0';
        sec3Container.style.filter = 'blur(20px)';
        sec3Container.style.pointerEvents = 'none';
      } else {
        sec3Container.style.opacity = '0';
        sec3Container.style.filter = 'none';
        sec3Container.style.pointerEvents = 'none';

        if (sec3ScrollContainer && !isUserInteractingSec3) {
          sec3ScrollContainer.scrollTop = 0;
        }

        for (let k = 0; k < 6; k++) {
          const card = document.getElementById(`sec3-card-${k}`);
          if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(80px)';
          }
        }
      }
    }

    // ==================== LAYER 50: SCROLL EXPAND PORTAL ANIMATION (03 // EJECUCIÓN) ====================
    const expandWrapper = document.getElementById('sec-scroll-expand-wrapper');
    const expandFrame = document.getElementById('scroll-expand-frame');
    const expandVideo = document.getElementById('scroll-expand-video');
    const ejecucionScrollContainer = document.getElementById('sec-ejecucion-scroll-container');

    if (expandWrapper && expandFrame && expandVideo) {
      if (currentScrollLerp < 0.81) {
        expandWrapper.style.opacity = '0';
        expandWrapper.style.filter = 'blur(20px)';
        expandWrapper.style.pointerEvents = 'none';
        expandFrame.style.width = '44vw';
        expandFrame.style.height = '58vh';
        expandFrame.style.borderRadius = '24px';
        expandVideo.style.transform = 'scale(1.35)';
        if (ejecucionScrollContainer) ejecucionScrollContainer.scrollTop = 0;
      } else if (currentScrollLerp < 0.84) {
        // Aparición con efecto blur después de la última tarjeta (0.81 -> 0.84)
        const pEntry = (currentScrollLerp - 0.81) / 0.03;
        const pEntryEased = Math.sin((pEntry * Math.PI) / 2);
        expandWrapper.style.opacity = pEntryEased.toFixed(3);
        expandWrapper.style.filter = `blur(${((1.0 - pEntryEased) * 20).toFixed(1)}px)`;
        expandWrapper.style.pointerEvents = 'none';
        expandFrame.style.width = '44vw';
        expandFrame.style.height = '58vh';
        expandFrame.style.borderRadius = '24px';
        expandVideo.style.transform = 'scale(1.35)';
        if (ejecucionScrollContainer) ejecucionScrollContainer.scrollTop = 0;
      } else {
        // Expansión a pantalla completa (44vw->100vw, 58vh->100vh, 24px->0px, video 1.35x->1.0x) (0.84 -> 0.96)
        expandWrapper.style.opacity = '1';
        expandWrapper.style.filter = 'none';

        const pExp = Math.min(1.0, (currentScrollLerp - 0.84) / 0.12);
        const pExpEased = Math.sin((pExp * Math.PI) / 2);

        const curW = 44 + (pExpEased * 56);
        const curH = 58 + (pExpEased * 42);
        const curRad = (1.0 - pExpEased) * 24;
        const curZoom = 1.35 - (pExpEased * 0.35);

        expandFrame.style.width = `${curW.toFixed(2)}vw`;
        expandFrame.style.height = `${curH.toFixed(2)}vh`;
        expandFrame.style.borderRadius = `${curRad.toFixed(1)}px`;
        expandVideo.style.transform = `scale(${curZoom.toFixed(3)})`;

        expandWrapper.style.pointerEvents = pExpEased > 0.85 ? 'auto' : 'none';

        if (pExpEased < 0.95 && ejecucionScrollContainer) {
          ejecucionScrollContainer.scrollTop = 0;
        }
      }
    }

    // ==================== BOTTOM DOCK NAV SYNCHRONIZED FADE & ACTIVE STATE ====================
    if (bottomDock) {
      let dockOpacity = 0;
      if (currentScrollLerp < T_REVEAL_START) {
        dockOpacity = Math.max(0, 1.0 - currentScrollLerp * 8.0);
        updateActiveDockItem(null);
      } else if (currentScrollLerp < T_REVEAL_END) {
        const pOpen = (currentScrollLerp - T_REVEAL_START) / (T_REVEAL_END - T_REVEAL_START);
        dockOpacity = Math.min(1.0, Math.max(0, pOpen));
        updateActiveDockItem(0);
      } else if (currentScrollLerp < T_EXIT_START) {
        dockOpacity = 1.0;
        updateActiveDockItem(0);
      } else if (currentScrollLerp < T_EXIT_END) {
        const pClose = (currentScrollLerp - T_EXIT_START) / (T_EXIT_END - T_EXIT_START);
        dockOpacity = Math.max(0, 1.0 - pClose * 1.5);
        updateActiveDockItem(null);
      } else if (currentScrollLerp < 0.70) {
        // Mientras el smartphone está visible, emerge y gira en 3D (0.34 a 0.70), el contenedor fijo inferior se oculta por completo
        dockOpacity = 0;
        updateActiveDockItem(null);
      } else if (currentScrollLerp < 0.74) {
        // Ecosistema reaparece gradualmente cuando el smartphone sale hacia arriba (0.70 -> 0.74)
        const pDockEcosistema = (currentScrollLerp - 0.70) / 0.04;
        dockOpacity = Math.min(1.0, Math.max(0, pDockEcosistema));
        updateActiveDockItem(1);
      } else if (currentScrollLerp < 0.84) {
        // Ecosistema activo (flujo de tarjetas)
        dockOpacity = 1.0;
        updateActiveDockItem(1);
      } else {
        // 03 // Ejecución activa (ScrollExpand abierto)
        // Visible en la portada; se oculta conforme nos desplazamos hacia la galería flotante
        const internalScroll = document.getElementById('sec-ejecucion-scroll-container');
        if (internalScroll && internalScroll.scrollTop > 40) {
          const pGalleryFade = Math.min(1.0, (internalScroll.scrollTop - 40) / 220);
          dockOpacity = Math.max(0, 1.0 - pGalleryFade);
        } else {
          dockOpacity = 1.0;
        }
        updateActiveDockItem(2);
      }
      bottomDock.style.opacity = dockOpacity.toFixed(3);
      bottomDock.style.transform = `translate(-50%, ${(1.0 - dockOpacity) * 20}px)`;
      bottomDock.style.pointerEvents = dockOpacity > 0.4 ? 'auto' : 'none';
    }

    // ==================== DYNAMIC HEADER THEME (WHITE LIQUID GLASS VS TRANSPARENT FLOATING VS DARK CYBER GLASS) ====================
    const globalHeader = document.getElementById('main-global-header');
    if (globalHeader) {
      // Check if Section 05 Metodología is revealed in the execution container
      let isMetodologiaRevealed = false;
      const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');
      if (metodologiaWrapper && metodologiaWrapper.style.transform && !metodologiaWrapper.style.transform.includes('100%')) {
        const match = metodologiaWrapper.style.transform.match(/translate3d\(0,\s*([0-9.]+)%,\s*0\)/);
        if (match && parseFloat(match[1]) < 60) {
          isMetodologiaRevealed = true;
        } else if (metodologiaWrapper.style.transform.includes('0%')) {
          isMetodologiaRevealed = true;
        }
      }

      // White Liquid Glass Header in:
      // - 01 // Manifiesto (0.08 <= currentScrollLerp < 0.34)
      // - 02 // Ecosistema (0.70 <= currentScrollLerp < 0.84)
      // - 05 // Metodología (When curtain is revealed)
      const isWhiteHeaderPhase = (currentScrollLerp >= T_REVEAL_START && currentScrollLerp < T_PHONE_ZOOM_START) ||
                                 (currentScrollLerp >= 0.70 && currentScrollLerp < 0.84) ||
                                 isMetodologiaRevealed;
      
      // Transparent Floating Header during Smartphone Zoom & 360 Spin (0.34 <= currentScrollLerp < 0.70)
      const isSmartphoneSpinPhase = currentScrollLerp >= T_PHONE_ZOOM_START && currentScrollLerp < 0.70;

      if (isWhiteHeaderPhase) {
        if (!globalHeader.classList.contains('glass-nav-white-liquid')) {
          globalHeader.classList.add('glass-nav-white-liquid');
          globalHeader.classList.remove('glass-nav-dark', 'glass-nav-transparent');
        }
      } else if (isSmartphoneSpinPhase) {
        if (!globalHeader.classList.contains('glass-nav-transparent')) {
          globalHeader.classList.add('glass-nav-transparent');
          globalHeader.classList.remove('glass-nav-dark', 'glass-nav-white-liquid');
        }
      } else {
        // Dark Cyber Glass in Hero (0.0 - 0.08) and 03 // Ejecución / Galería (0.84 - 1.0)
        if (!globalHeader.classList.contains('glass-nav-dark')) {
          globalHeader.classList.add('glass-nav-dark');
          globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-transparent');
        }
      }
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
  const wipeRect2 = document.getElementById('stroke-wipe-rect-2');
  if (!strokePath || !wipeRect) return;

  // Initial states: blur & opacity entrance
  if (wrapper && typeof gsap !== 'undefined') {
    gsap.set(wrapper, { filter: "blur(18px)", opacity: 0, y: 15 });
  }
  strokePath.style.strokeDashoffset = '4500';
  strokePath.style.stroke = '#FFFFFF';
  wipeRect.setAttribute('width', '0%');
  wipeRect.setAttribute('height', '56');
  if (wipeRect2) {
    wipeRect2.setAttribute('width', '0%');
    wipeRect2.setAttribute('height', '66');
  }

  const animWipes = wipeRect2 ? [wipeRect, wipeRect2] : wipeRect;

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
      // 2. Smooth Wipe Fill Animation in White (#FFFFFF) (ambas líneas con corte brutalista invertido)
      .to(animWipes, {
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
      if (wipeRect2) {
        wipeRect2.style.transition = 'width 0.65s cubic-bezier(0.65, 0, 0.35, 1)';
        wipeRect2.setAttribute('width', '100%');
      }
      setTimeout(triggerCurtainRevealEffect, 450);
    }, 950);
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
      gsap.set(right, { opacity: 0 });
      tl.to(right, {
        opacity: 1,
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

// ==================== CINEMATIC SMOOTH SCROLL TO SECTION 2 (MANIFIESTO) ====================
function scrollToSection2() {
  const track = document.getElementById('hero-scroll-track');
  if (!track) return;
  const trackRect = track.getBoundingClientRect();
  const trackTop = window.scrollY + trackRect.top;
  const maxScroll = track.offsetHeight - window.innerHeight;
  const targetY = trackTop + maxScroll * 0.18;

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

// ==================== CINEMATIC SMOOTH SCROLL TO SECTION 3 (ECOSISTEMA) ====================
function scrollToSection3() {
  const track = document.getElementById('hero-scroll-track');
  if (!track) return;
  const trackRect = track.getBoundingClientRect();
  const trackTop = window.scrollY + trackRect.top;
  const maxScroll = track.offsetHeight - window.innerHeight;
  // Posición al 50% (0.50): Smartphone 3D centrado frontalmente con fondo cinético (Etapa Ecosistema)
  const targetY = trackTop + maxScroll * 0.50;

  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = 1800; // 1.8s smooth cinematic glide
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
window.scrollToSection3 = scrollToSection3;

// ==================== CINEMATIC SMOOTH SCROLL TO SECTION 03 (EJECUCIÓN) ====================
function scrollToSectionEjecucion() {
  const track = document.getElementById('hero-scroll-track');
  if (!track) return;
  const trackRect = track.getBoundingClientRect();
  const trackTop = window.scrollY + trackRect.top;
  const maxScroll = track.offsetHeight - window.innerHeight;
  // Posición al 96% (0.96): ScrollExpand completamente abierto a pantalla completa
  const targetY = trackTop + maxScroll * 0.96;

  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = 1800; // 1.8s smooth cinematic glide
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
window.scrollToSectionEjecucion = scrollToSectionEjecucion;

// ==================== INITIALIZE HERO RIPPLE DISTORTION (REACT BITS) ====================
function initHeroRippleDistortion() {
  const container = document.getElementById('hero-ripple-distortion');
  if (!container || typeof window.RippleDistortion === 'undefined') return;

  window.heroRippleInstance = new window.RippleDistortion(container, {
    src: null,
    brushSize: 70,
    strength: 0.2,
    swirl: 1,
    rings: 4,
    spread: 2,
    fade: 3,
    spacing: 15,
    dispersion: 0,
    glint: 0,
    tint: '#a855f7',
    tintAmount: 0.1,
    grayscale: true,
    highlightColor: '#ffffff',
    trigger: 'hover',
    clickStrength: 2,
    quality: 'low',
    enabled: true
  });
}
window.initHeroRippleDistortion = initHeroRippleDistortion;

// ==================== INITIALIZE SECTION 3 TOPOGRAPHY (REACT BITS) ====================
function initSec3Topography() {
  const container = document.getElementById('sec3-topography-bg');
  if (!container || typeof window.Topography === 'undefined') return;

  window.sec3TopographyInstance = new window.Topography(container, {
    lowColor: '#5227FF',
    midColor: '#FF9FFC',
    highColor: '#FFFFFF',
    speed: 0.2,
    morphAmount: 2.4,
    morphSpeed: 0.04,
    bands: 7,
    thickness: 0.22,
    scale: 2,
    pixelSize: 1,
    glow: 0.5,
    colorMode: 'elevation',
    contrast: 3,
    brightness: 1,
    fillBands: false,
    opacity: 1,
    grain: true,
    grainIntensity: 0.05,
    mouseInteraction: true,
    mouseRadius: 0.3,
    mouseStrength: 0.4
  });
}
window.initSec3Topography = initSec3Topography;

// ==================== MATRIZ MODAL (25 BLOQUES) LOGIC CON FOTOS Y DEGRADADO ARMÓNICO ====================
const matriz25Data = [
  // FILA 1: Espectro Verde Lima / Cyber Lime (Núcleo Operativo)
  {
    id: 1,
    code: 'BLK-01',
    category: 'operativo',
    file: 'imagotipoGreen.png',
    title: 'Vector Core Imagotype',
    desc: 'Núcleo de identidad e integración modular de alta velocidad para conversión y tracking activo.',
    kpi1: '+320% Impacto',
    kpi2: '5.2x ROI',
    kpi3: '1 Semana',
    color: '#c3f400',
    tint: 'rgba(195, 244, 0, 0.45)'
  },
  {
    id: 2,
    code: 'BLK-02',
    category: 'operativo',
    file: 'Vector Inside Isologo.png',
    title: 'Isologo Kinetic Engine',
    desc: 'Sincronizador vectorial reactivo para aceleración de funnel y retención de usuarios.',
    kpi1: '+290% Retención',
    kpi2: '4.9x ROI',
    kpi3: '2 Semanas',
    color: '#b0f000',
    tint: 'rgba(176, 240, 0, 0.45)'
  },
  {
    id: 3,
    code: 'BLK-03',
    category: 'operativo',
    file: 'lobo02.png',
    title: 'Cyber Wolf Vanguard',
    desc: 'Módulo de tracción táctica y posicionamiento de marca con telemetría predictiva.',
    kpi1: '+340% Conversión',
    kpi2: '5.4x ROI',
    kpi3: '2 Semanas',
    color: '#84e600',
    tint: 'rgba(132, 230, 0, 0.45)'
  },
  {
    id: 4,
    code: 'BLK-04',
    category: 'operativo',
    file: 'Circuit_board_and_data_flow_202608261320.jpeg',
    title: 'Neural Circuit Flow',
    desc: 'Topología de red de baja latencia para enrutamiento inteligente de datos de adquisición.',
    kpi1: '+380% Telemetría',
    kpi2: '6.1x ROI',
    kpi3: '3 Semanas',
    color: '#34d399',
    tint: 'rgba(52, 211, 153, 0.45)'
  },
  {
    id: 5,
    code: 'BLK-05',
    category: 'operativo',
    file: 'LOGO 4GUARD.jpeg',
    title: '4Guard Security Layer',
    desc: 'Blindaje perimetral y validación biométrica/criptográfica de eventos transaccionales.',
    kpi1: '99.99% Uptime',
    kpi2: '4.6x ROI',
    kpi3: '1 Semana',
    color: '#10b981',
    tint: 'rgba(16, 185, 129, 0.45)'
  },

  // FILA 2: Transición Verde a Cyan & Azul Eléctrico (Puente Operativo / Cognitivo)
  {
    id: 6,
    code: 'BLK-06',
    category: 'operativo',
    file: 'SyborX Logo White.svg',
    title: 'SyborX Cyber Mesh',
    desc: 'Conectores API para orquestación multi-canal con microservicios desacoplados.',
    kpi1: '+260% Sincronía',
    kpi2: '4.2x ROI',
    kpi3: '2 Semanas',
    color: '#06b6d4',
    tint: 'rgba(6, 182, 212, 0.45)'
  },
  {
    id: 7,
    code: 'BLK-07',
    category: 'cognitivo',
    file: 'Gemini_Generated_Image_b9fxdjb9fxdjb9fx.png',
    title: 'Quantum Interface Node',
    desc: 'Motor de renderizado y visualización tridimensional optimizado por aceleración GPU.',
    kpi1: '60 FPS Ultra',
    kpi2: '5.0x ROI',
    kpi3: '3 Semanas',
    color: '#0ea5e9',
    tint: 'rgba(14, 165, 233, 0.45)'
  },
  {
    id: 8,
    code: 'BLK-08',
    category: 'cognitivo',
    file: 'SmbtK1.svg',
    title: 'Smart Behavioral Kernel',
    desc: 'Segmentación psicográfica en tiempo real y personalización dinámica del viaje de usuario.',
    kpi1: '+310% Engagement',
    kpi2: '4.8x ROI',
    kpi3: '2 Semanas',
    color: '#38bdf8',
    tint: 'rgba(56, 189, 248, 0.45)'
  },
  {
    id: 9,
    code: 'BLK-09',
    category: 'cognitivo',
    file: 'Logo aida.png',
    title: 'AIDA Conversion Funnel',
    desc: 'Automatización holística de Atención, Interés, Deseo y Acción con disparadores inteligentes.',
    kpi1: '+275% Cierre',
    kpi2: '4.7x ROI',
    kpi3: '2 Semanas',
    color: '#3b82f6',
    tint: 'rgba(59, 130, 246, 0.45)'
  },
  {
    id: 10,
    code: 'BLK-10',
    category: 'cognitivo',
    file: 'integritus2.svg',
    title: 'Integritus Data Trust',
    desc: 'Capa de trazabilidad inmutable y conciliación continua de métricas financieras.',
    kpi1: '100% Precisión',
    kpi2: '5.1x ROI',
    kpi3: '3 Semanas',
    color: '#2563eb',
    tint: 'rgba(37, 99, 235, 0.45)'
  },

  // FILA 3: Azul Cognitivo Profundo -> Índigo -> Violeta (Núcleo Cognitivo)
  {
    id: 11,
    code: 'BLK-11',
    category: 'cognitivo',
    file: 'Gemini_Generated_Image_q0r58zq0r58zq0r5.jpeg',
    title: 'Cognitive Cloud Cluster',
    desc: 'Clúster de inferencia distribuida para analítica predictiva de alto rendimiento.',
    kpi1: '+410% Capacidad',
    kpi2: '5.8x ROI',
    kpi3: '3 Semanas',
    color: '#433dae',
    tint: 'rgba(67, 61, 174, 0.50)'
  },
  {
    id: 12,
    code: 'BLK-12',
    category: 'cognitivo',
    file: '52e4285a050dd168c90a3df236ebedfa.jpg',
    title: 'Predictive Pipeline Array',
    desc: 'Canalizaciones de scoring y lead routing automatizado para equipos de ventas estratégicas.',
    kpi1: '+350% Velocidad',
    kpi2: '5.3x ROI',
    kpi3: '2 Semanas',
    color: '#4f46e5',
    tint: 'rgba(79, 70, 229, 0.45)'
  },
  {
    id: 13,
    code: 'BLK-13',
    category: 'cognitivo',
    file: '8388d28c9479d74bc7172d828307dd08.jpg',
    title: 'Realtime Analytics Grid',
    desc: 'Matriz de tableros ejecutivos con visualización instantánea de ratios de tracción.',
    kpi1: '<10ms Latencia',
    kpi2: '4.5x ROI',
    kpi3: '2 Semanas',
    color: '#6366f1',
    tint: 'rgba(99, 102, 241, 0.45)'
  },
  {
    id: 14,
    code: 'BLK-14',
    category: 'cognitivo',
    file: 'd399b1a5bfab57de3bbba91441225b04.jpg',
    title: 'Deep Learning Synapse',
    desc: 'Algoritmos de ajuste dinámico de precios y ofertas personalizadas por intención de compra.',
    kpi1: '+295% Margen',
    kpi2: '5.6x ROI',
    kpi3: '3 Semanas',
    color: '#7c3aed',
    tint: 'rgba(124, 58, 237, 0.45)'
  },
  {
    id: 15,
    code: 'BLK-15',
    category: 'expansivo',
    file: 'karloz vazquez logo.svg',
    title: 'KV Strategic Architecture',
    desc: 'Dirección de diseño de sistemas exponenciales y consultoría de conversión premium.',
    kpi1: '+450% Escala',
    kpi2: '6.5x ROI',
    kpi3: '2 Semanas',
    color: '#8b5cf6',
    tint: 'rgba(139, 92, 246, 0.45)'
  },

  // FILA 4: Púrpura y Violeta Radiante (Núcleo Expansivo)
  {
    id: 16,
    code: 'BLK-16',
    category: 'expansivo',
    file: 'poligonal02.png',
    title: 'Polygonal 3D Matrix',
    desc: 'Infraestructura espacial de alto impacto visual para inmersión sensorial y branding de élite.',
    kpi1: '+380% Recordación',
    kpi2: '5.7x ROI',
    kpi3: '3 Semanas',
    color: '#9d4edd',
    tint: 'rgba(157, 78, 221, 0.45)'
  },
  {
    id: 17,
    code: 'BLK-17',
    category: 'expansivo',
    file: 'liquid01.png',
    title: 'Liquid Metal Dynamic Scale',
    desc: 'Arquitectura elástica adaptable a picos de tráfico masivo sin degradación de rendimiento.',
    kpi1: '10x Concurrencia',
    kpi2: '5.9x ROI',
    kpi3: '2 Semanas',
    color: '#a855f7',
    tint: 'rgba(168, 85, 247, 0.45)'
  },
  {
    id: 18,
    code: 'BLK-18',
    category: 'expansivo',
    file: 'Brevemente02.png',
    title: 'High-Speed Content Hub',
    desc: 'Distribución multiformato de micro-contenidos de alta conversión para adquisición orgánica.',
    kpi1: '+310% Tráfico',
    kpi2: '4.4x ROI',
    kpi3: '1 Semana',
    color: '#b235e6',
    tint: 'rgba(178, 53, 230, 0.45)'
  },
  {
    id: 19,
    code: 'BLK-19',
    category: 'expansivo',
    file: 'logo-diamonds.jpg',
    title: 'Diamonds Luxury Vault',
    desc: 'Ecosistema de monetización para productos de alto ticket con funnel de exclusividad.',
    kpi1: '+420% Ticket Prom.',
    kpi2: '6.2x ROI',
    kpi3: '3 Semanas',
    color: '#c026d3',
    tint: 'rgba(192, 38, 211, 0.45)'
  },
  {
    id: 20,
    code: 'BLK-20',
    category: 'expansivo',
    file: '0f9bae2c281d0acad623fe111ef13bc4.jpg',
    title: 'Omni-channel Router',
    desc: 'Sincronización multi-plataforma de inventario, prospectos y transacciones globales.',
    kpi1: '+285% Sincronía',
    kpi2: '4.8x ROI',
    kpi3: '2 Semanas',
    color: '#d946ef',
    tint: 'rgba(217, 70, 239, 0.45)'
  },

  // FILA 5: Magenta, Fucsia y Rosa Obsidian (Horizonte Expansivo)
  {
    id: 21,
    code: 'BLK-21',
    category: 'expansivo',
    file: '76c339f1cb04a378b73d3c2df9a91bcd.jpg',
    title: 'Multi-tier CDN Mesh',
    desc: 'Aceleración de entrega perimetral con servidores edge distribuidos en 45 regiones globales.',
    kpi1: '99.999% SLA',
    kpi2: '5.1x ROI',
    kpi3: '2 Semanas',
    color: '#e879f9',
    tint: 'rgba(232, 121, 249, 0.45)'
  },
  {
    id: 22,
    code: 'BLK-22',
    category: 'expansivo',
    file: 'images.jpeg',
    title: 'High-Volume Ledger',
    desc: 'Base de datos transaccional con procesamiento paralelo de miles de operaciones por segundo.',
    kpi1: '12k TPS',
    kpi2: '5.5x ROI',
    kpi3: '3 Semanas',
    color: '#f43f5e',
    tint: 'rgba(244, 63, 94, 0.45)'
  },
  {
    id: 23,
    code: 'BLK-23',
    category: 'expansivo',
    file: 'images (1).jpeg',
    title: 'Global Conversion Gateway',
    desc: 'Pasarela multi-divisa y procesador inteligente de pagos transfronterizos sin fricción.',
    kpi1: '+330% Checkout',
    kpi2: '5.8x ROI',
    kpi3: '2 Semanas',
    color: '#ec4899',
    tint: 'rgba(236, 72, 153, 0.45)'
  },
  {
    id: 24,
    code: 'BLK-24',
    category: 'expansivo',
    file: 'IMG_0828.JPG',
    title: 'Executive Mission Control',
    desc: 'Consola central de supervisión operativa y gobernanza de inteligencia de negocios.',
    kpi1: '100% Control',
    kpi2: '6.0x ROI',
    kpi3: '3 Semanas',
    color: '#db2777',
    tint: 'rgba(219, 39, 119, 0.45)'
  },
  {
    id: 25,
    code: 'BLK-25',
    category: 'expansivo',
    file: 'Captura de pantalla 2026-08-30 a la(s) 6.54.20 p.m..png',
    title: 'Vector Inside 3.0 Core OS',
    desc: 'Sistema operativo unificado de aceleración digital, diseño cinemático y tracción predecible.',
    kpi1: '+500% Expansión',
    kpi2: '7.2x ROI',
    kpi3: '3 Semanas',
    color: '#be185d',
    tint: 'rgba(190, 24, 93, 0.45)'
  }
];

// ==================== FLOATING GALLERY (25 BLOQUES) ENGINE ====================
class FloatingGallery {
  constructor(rootId, data) {
    this.root = document.getElementById(rootId);
    this.data = data;
    if (!this.root || !this.data || this.data.length === 0) return;

    this.speed = 36; // px/sec baseline downward drift
    this.reach = 280; // cursor repulsion radius
    this.force = 110; // cursor repulsion force
    this.zoomedIndex = null;
    this.filter = 'all';

    this.particles = [];
    this.nodes = [];
    this.pointer = { x: 0, y: 0, active: false };
    this.size = { w: 0, h: 0 };
    this.rafId = 0;
    this.lastTime = performance.now();

    this.initDOM();
    this.initEvents();
    this.measure();
    this.startLoop();
  }

  hash01(i) {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  initDOM() {
    this.root.innerHTML = '';
    this.nodes = [];

    const colX = [8, 28, 50, 72, 92];

    this.data.forEach((item, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const xPct = colX[col];
      const yPct = row * 58 + (col % 2 === 1 ? 29 : 0);

      const node = document.createElement('div');
      node.className = 'floating-gallery-card group absolute top-0 left-0 cursor-pointer select-none overflow-hidden rounded-2xl border will-change-transform';
      node.style.width = `220px`;
      node.style.height = `275px`;
      node.style.borderColor = `${item.color}55`;
      node.style.background = '#0b0b0d';
      node.style.boxShadow = `0 12px 35px rgba(0,0,0,0.65), 0 0 15px ${item.color}22`;
      node.style.transform = 'translate3d(-9999px, -9999px, 0)';

      const encodedFile = encodeURIComponent(item.file);

      node.innerHTML = `
        <!-- Background Image with adjusted framing -->
        <div class="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <img src="ejecucion/Matriz%2025/${encodedFile}" alt="${item.title}"
            class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500" />
          
          <!-- Color Tone Filter Overlay matching the block's exact color & category -->
          <div class="absolute inset-0 pointer-events-none"
            style="background: linear-gradient(135deg, ${item.color}35, ${item.color}85); mix-blend-mode: multiply;"></div>

          <!-- Dark Vignette Gradient for cyber readability -->
          <div class="absolute inset-0 bg-gradient-to-t from-vector-black/95 via-vector-black/35 to-vector-black/60 pointer-events-none"></div>
        </div>

        <!-- Top Code Badge & Glow Status Dot -->
        <div class="relative z-10 p-3 flex justify-between items-center pointer-events-none">
          <span class="font-mono text-[9px] sm:text-[10px] font-bold text-white bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded border border-white/15">
            ${item.code}
          </span>
          <div class="w-2.5 h-2.5 rounded-full border border-black/40 shadow-[0_0_10px_${item.color}]" style="background-color: ${item.color}"></div>
        </div>

        <!-- Center/Bottom Details (Title, Category, Description & KPIs on Zoom) -->
        <div class="relative z-10 p-3 sm:p-3.5 mt-auto flex flex-col justify-end pointer-events-none bg-gradient-to-t from-vector-black/95 via-vector-black/80 to-transparent">
          <span class="font-mono text-[8px] uppercase tracking-widest font-bold mb-0.5" style="color: ${item.color}">
            ${item.category}
          </span>
          <h4 class="font-display font-black text-xs sm:text-sm uppercase text-white leading-tight mb-1 group-hover:text-vector-lime transition-colors">
            ${item.title}
          </h4>

          <!-- Expanded Live HUD Details (Revealed smoothly on Center Zoom) -->
          <div class="floating-card-details opacity-0 max-h-0 overflow-hidden transition-all duration-300">
            <p class="font-body text-[11px] text-neutral-300 leading-snug my-2 border-t border-white/10 pt-2">
              ${item.desc}
            </p>
            <div class="grid grid-cols-3 gap-1.5 font-mono text-[10px] pt-1">
              <div class="bg-black/60 p-1.5 rounded border border-white/10 text-center">
                <span class="text-text-muted block text-[8px]">ACEL.</span>
                <span class="text-vector-lime font-bold">${item.kpi1}</span>
              </div>
              <div class="bg-black/60 p-1.5 rounded border border-white/10 text-center">
                <span class="text-text-muted block text-[8px]">ROI</span>
                <span class="text-white font-bold">${item.kpi2}</span>
              </div>
              <div class="bg-black/60 p-1.5 rounded border border-white/10 text-center">
                <span class="text-text-muted block text-[8px]">TIEMPO</span>
                <span class="text-white font-bold">${item.kpi3}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleZoom(i);
      });

      this.root.appendChild(node);
      this.nodes.push(node);
    });
  }

  initEvents() {
    this.root.addEventListener('pointermove', (e) => {
      const rect = this.root.getBoundingClientRect();
      this.pointer.x = e.clientX - rect.left;
      this.pointer.y = e.clientY - rect.top;
      this.pointer.active = true;
    });

    this.root.addEventListener('pointerleave', () => {
      this.pointer.active = false;
    });

    this.root.addEventListener('click', () => {
      if (this.zoomedIndex !== null) {
        this.toggleZoom(null);
      }
    });

    window.addEventListener('resize', () => this.measure());

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(this.root);
    }
  }

  measure() {
    const rect = this.root ? this.root.getBoundingClientRect() : {};
    const measuredW = rect.width || (this.root ? this.root.offsetWidth : 0) || window.innerWidth;
    const measuredH = rect.height || (this.root ? this.root.offsetHeight : 0) || (window.innerHeight - 100);
    this.size.w = measuredW > 0 ? measuredW : window.innerWidth;
    this.size.h = measuredH > 0 ? measuredH : (window.innerHeight - 100);
    this.seed();
  }

  seed() {
    const W = this.size.w || window.innerWidth || 1400;
    const H = this.size.h || (window.innerHeight - 100) || 700;
    this.size.w = W;
    this.size.h = H;

    // Organic non-grid scatter coordinates (% of container width & virtual height track)
    const scatterLayout = [
      { x: 12, y: 4,   w: 220, h: 280 },
      { x: 44, y: 16,  w: 250, h: 215 },
      { x: 78, y: 8,   w: 215, h: 275 },
      { x: 25, y: 42,  w: 240, h: 240 },
      { x: 90, y: 32,  w: 220, h: 290 },

      { x: 60, y: 48,  w: 255, h: 210 },
      { x: 7,  y: 68,  w: 230, h: 270 },
      { x: 38, y: 84,  w: 210, h: 260 },
      { x: 75, y: 74,  w: 245, h: 230 },
      { x: 92, y: 95,  w: 215, h: 280 },

      { x: 18, y: 114, w: 250, h: 210 },
      { x: 50, y: 122, w: 220, h: 285 },
      { x: 70, y: 138, w: 240, h: 240 },
      { x: 30, y: 152, w: 210, h: 270 },
      { x: 86, y: 158, w: 235, h: 250 },

      { x: 9,  y: 178, w: 220, h: 280 },
      { x: 46, y: 190, w: 255, h: 210 },
      { x: 78, y: 204, w: 210, h: 270 },
      { x: 22, y: 222, w: 240, h: 240 },
      { x: 93, y: 220, w: 220, h: 290 },

      { x: 58, y: 246, w: 250, h: 220 },
      { x: 14, y: 262, w: 230, h: 270 },
      { x: 42, y: 278, w: 210, h: 260 },
      { x: 82, y: 292, w: 245, h: 230 },
      { x: 89, y: 312, w: 215, h: 280 }
    ];

    // Responsive scaling factor for cards based on viewport
    const scaleFactor = Math.min(1.15, Math.max(0.85, W / 1400));

    this.particles = this.data.map((item, i) => {
      const slot = scatterLayout[i % scatterLayout.length];
      const cardW = Math.round(slot.w * scaleFactor);
      const cardH = Math.round(slot.h * scaleFactor);

      const node = this.nodes[i];
      if (node) {
        node.style.width = `${cardW}px`;
        node.style.height = `${cardH}px`;
      }

      const prev = this.particles[i];
      return {
        x: (slot.x / 100) * W - cardW / 2,
        y: prev ? prev.y : (slot.y / 100) * H - cardH / 2,
        dx: prev ? prev.dx : 0,
        dy: prev ? prev.dy : 0,
        z: prev ? prev.z : 0,
        targetZ: prev ? prev.targetZ : 0,
        w: cardW,
        h: cardH,
        // Individual organic pacing & multidirectional floating waves
        mult: 0.70 + this.hash01(i * 17) * 0.65,
        swaySpeed: 0.6 + this.hash01(i * 23) * 0.8,
        swayAmpX: 16 + this.hash01(i * 31) * 22,
        swayPhase: this.hash01(i * 37) * Math.PI * 2,
        rotAmp: (this.hash01(i * 41) - 0.5) * 5.5
      };
    });
  }

  toggleZoom(index) {
    if (this.zoomedIndex === index || index === null) {
      this.zoomedIndex = null;
    } else {
      this.zoomedIndex = index;
    }

    this.nodes.forEach((node, i) => {
      const details = node.querySelector('.floating-card-details');
      if (this.zoomedIndex === i) {
        node.classList.add('border-vector-lime', 'shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(195,244,0,0.35)]');
        if (details) {
          details.classList.remove('opacity-0', 'max-h-0');
          details.classList.add('opacity-100', 'max-h-96');
        }
      } else {
        node.classList.remove('border-vector-lime', 'shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(195,244,0,0.35)]');
        if (details) {
          details.classList.add('opacity-0', 'max-h-0');
          details.classList.remove('opacity-100', 'max-h-96');
        }
      }
    });
  }

  setFilter(filter) {
    this.filter = filter;
    this.data.forEach((item, i) => {
      const node = this.nodes[i];
      if (!node) return;
      if (this.filter === 'all' || item.category === this.filter) {
        node.style.opacity = '1';
        node.style.pointerEvents = 'auto';
      } else {
        node.style.opacity = '0.15';
        node.style.pointerEvents = 'none';
      }
    });
  }

  startLoop() {
    const loop = (now) => {
      this.rafId = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;

      // Real-time container width adaptation during expansion
      const rect = this.root ? this.root.getBoundingClientRect() : {};
      const curW = rect.width || (this.root ? this.root.offsetWidth : 0) || window.innerWidth;
      const curH = rect.height || (this.root ? this.root.offsetHeight : 0) || (window.innerHeight - 100);
      if (curW > 0 && Math.abs(curW - this.size.w) > 4) {
        this.size.w = curW;
        this.size.h = curH;
        this.seed();
      }

      const W = this.size.w || window.innerWidth;
      const H = this.size.h || (window.innerHeight - 100);
      if (!W || !H) return;

      const R = this.reach;
      const F = this.force;
      const drift = this.speed;
      const p = this.pointer;
      const zi = this.zoomedIndex;
      const kOut = 1 - Math.exp(-8 * dt);
      const totalSpan = H * 3.4;

      for (let i = 0; i < this.particles.length; i++) {
        const a = this.particles[i];
        const node = this.nodes[i];
        if (!node) continue;
        const frozen = zi === i;

        if (!frozen) {
          a.y += drift * a.mult * dt;
          if (a.y > H + 80) {
            a.y -= totalSpan;
          } else if (a.y < -totalSpan + H + 80) {
            a.y += totalSpan;
          }
        }

        let tx = 0;
        let ty = 0;
        if (p.active && !frozen && F > 0) {
          const cx = a.x + a.w / 2;
          const cy = a.y + a.h / 2;
          let vx = cx - p.x;
          let vy = cy - p.y;
          const d = Math.hypot(vx, vy);
          if (d < R && d > 0.001) {
            const inv = 1 / d;
            const fall = 1 - d / R;
            const push = F * fall * fall;
            tx = vx * inv * push;
            ty = vy * inv * push;
          }
        }
        a.dx += (tx - a.dx) * kOut;
        a.dy += (ty - a.dy) * kOut;

        const targetZ = frozen ? 1 : 0;
        a.z += (targetZ - a.z) * 0.14;

        // Multidirectional fluid floating motion (sinusoidal sway & micro-tilt)
        const timeSec = now * 0.001;
        const swayX = Math.sin(timeSec * a.swaySpeed + a.swayPhase) * a.swayAmpX;
        const swayY = Math.cos(timeSec * 0.8 * a.swaySpeed + a.swayPhase) * 9;
        const rotDeg = (1.0 - a.z) * a.rotAmp * Math.sin(timeSec * 0.7 * a.swaySpeed + a.swayPhase);

        const baseX = a.x + a.dx + (swayX * (1.0 - a.z));
        const baseY = a.y + a.dy + (swayY * (1.0 - a.z));
        const z = a.z;
        const px = baseX + ((W - a.w) / 2 - baseX) * z;
        const py = baseY + ((H - a.h) / 2 - baseY) * z;

        const fit = Math.min(1.85, (W * 0.85) / Math.max(1, a.w), (H * 0.82) / Math.max(1, a.h));
        const s = 1 + (fit - 1) * z;

        node.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0) scale(${s.toFixed(3)}) rotate(${rotDeg.toFixed(2)}deg)`;
        node.style.zIndex = z > 0.01 ? '999' : '10';
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }
}

// ==================== CINEMATIC SMOOTH SCROLL TO 04 // EVIDENCIA (GALERÍA FLOTANTE) ====================
function scrollToGaleriaFlotante() {
  const mainTrack = document.getElementById('hero-scroll-track');
  const container = document.getElementById('sec-ejecucion-scroll-container');
  const matrixTrack = document.getElementById('sec-matriz-25-track');
  const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');

  if (metodologiaWrapper) {
    metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
    metodologiaWrapper.style.pointerEvents = 'none';
  }

  const doInternalScroll = () => {
    if (container && matrixTrack) {
      const targetTop = matrixTrack.offsetTop;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
      updateActiveDockItem(3);
    }
  };

  if (mainTrack) {
    const maxScroll = mainTrack.offsetHeight - window.innerHeight;
    const targetY = maxScroll * 0.98;

    window.scrollTo({ top: targetY, behavior: 'smooth' });

    // Immediate execution + scheduled frame confirmation for 100% reliable 1st-click action
    doInternalScroll();
    setTimeout(doInternalScroll, 100);
    setTimeout(doInternalScroll, 300);
    setTimeout(doInternalScroll, 600);
  } else {
    doInternalScroll();
  }
}
window.scrollToGaleriaFlotante = scrollToGaleriaFlotante;
window.scrollToEjecucionMatriz = scrollToGaleriaFlotante;
window.triggerLaserEvidenciaTransition = scrollToGaleriaFlotante;

// ==================== CINEMATIC SMOOTH SCROLL TO 05 // METODOLOGÍA ====================
function scrollToMetodologia() {
  const mainTrack = document.getElementById('hero-scroll-track');
  const container = document.getElementById('sec-ejecucion-scroll-container');
  const matrixTrack = document.getElementById('sec-matriz-25-track');
  const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');

  const doInternalScroll = () => {
    if (container && matrixTrack) {
      const targetTop = matrixTrack.offsetTop + (matrixTrack.offsetHeight - container.clientHeight);
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
      if (metodologiaWrapper) {
        metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
        metodologiaWrapper.style.pointerEvents = 'auto';
      }
      updateActiveDockItem(4);
    }
  };

  if (mainTrack) {
    const maxScroll = mainTrack.offsetHeight - window.innerHeight;
    const targetY = maxScroll * 0.98;

    window.scrollTo({ top: targetY, behavior: 'smooth' });

    // Immediate execution + scheduled frame confirmation for 100% reliable 1st-click action
    doInternalScroll();
    setTimeout(doInternalScroll, 100);
    setTimeout(doInternalScroll, 300);
    setTimeout(doInternalScroll, 600);
  } else {
    doInternalScroll();
  }
}
window.scrollToMetodologia = scrollToMetodologia;
window.triggerLaserMetodologiaTransition = scrollToMetodologia;

// Synchronize Bottom Dock & Sticky Curtain Reveal (Gallery -> 05 Metodología)
function initExecutionInternalScrollListener() {
  const container = document.getElementById('sec-ejecucion-scroll-container');
  const track = document.getElementById('sec-matriz-25-track');
  const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');

  if (container && track && metodologiaWrapper) {
    const updateCurtain = () => {
      const scrollY = container.scrollTop;
      const trackTop = track.offsetTop;
      const scrollableDistance = track.offsetHeight - container.clientHeight;

      if (scrollY < trackTop - 100) {
        // In Section 03 Cover
        metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
        metodologiaWrapper.style.pointerEvents = 'none';
        updateActiveDockItem(2); // 03 // Ejecución
      } else if (scrollableDistance > 0 && scrollY >= trackTop) {
        const pTrack = Math.min(1.0, Math.max(0, (scrollY - trackTop) / scrollableDistance));

        // pTrack 0.0 -> 0.25: Floating Gallery pinned in full view
        // pTrack 0.25 -> 0.85: Section 05 curtain slides UP from 100% to 0%
        // pTrack 0.85 -> 1.0: Section 05 fully pinned & visible
        if (pTrack < 0.25) {
          metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
          metodologiaWrapper.style.pointerEvents = 'none';
          updateActiveDockItem(3); // 04 // Evidencia (Floating Gallery)
        } else if (pTrack < 0.85) {
          const pCurtain = (pTrack - 0.25) / (0.85 - 0.25);
          const yPct = (1.0 - pCurtain) * 100;
          metodologiaWrapper.style.transform = `translate3d(0, ${yPct.toFixed(2)}%, 0)`;
          metodologiaWrapper.style.pointerEvents = pCurtain > 0.6 ? 'auto' : 'none';
          updateActiveDockItem(pCurtain > 0.5 ? 4 : 3);
        } else {
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          updateActiveDockItem(4); // 05 // Metodología
        }
      } else {
        metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
        metodologiaWrapper.style.pointerEvents = 'none';
      }
    };

    container.addEventListener('scroll', updateCurtain, { passive: true });
    updateCurtain();
  }
}

// Initialize Floating Gallery Events & Instance
function initFloatingGallery() {
  window.floatingGalleryInstance = new FloatingGallery('floating-gallery-root', matriz25Data);

  const filterBtns = document.querySelectorAll('.matriz-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        if (b.dataset.filter === btn.dataset.filter) {
          b.classList.add('active', 'bg-vector-lime', 'text-vector-black', 'font-bold');
          b.classList.remove('bg-surface-dark', 'text-white');
        } else {
          b.classList.remove('active', 'bg-vector-lime', 'text-vector-black', 'font-bold');
          b.classList.add('bg-surface-dark', 'text-white');
        }
      });
      if (window.floatingGalleryInstance) {
        window.floatingGalleryInstance.setFilter(btn.dataset.filter);
      }
    });
  });

  initExecutionInternalScrollListener();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFloatingGallery);
} else {
  initFloatingGallery();
}




