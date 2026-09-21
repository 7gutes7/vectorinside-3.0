/**
 * Vector Inside 3.0 - High-Performance Interactive Logic
 */

// Preserve scroll position across page refreshes (manual restoration via sessionStorage)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function saveCurrentScrollPosition() {
  try {
    sessionStorage.setItem('vectorinside_scroll_pos', String(window.scrollY || window.pageYOffset || 0));
  } catch (e) {}
}

function restoreCurrentScrollPosition() {
  try {
    const savedScroll = sessionStorage.getItem('vectorinside_scroll_pos');
    if (savedScroll !== null) {
      const y = parseFloat(savedScroll);
      if (!isNaN(y) && y > 0) {
        window.scrollTo(0, y);
      }
    }
  } catch (e) {}
}

// Restore immediately on script execution
restoreCurrentScrollPosition();

let _isHeroUiEnsured = false;
function ensureHeroUiVisible(force = false) {
  const heroUi = document.getElementById('hero-ui-content');
  if (heroUi) {
    heroUi.style.display = 'flex';
    heroUi.style.opacity = '1';
    heroUi.style.visibility = 'visible';
    heroUi.style.pointerEvents = 'auto';
  }

  // Left Flank: DISEÑO DE MARCA
  const strokeTextWrapper = document.getElementById('stroke-text-wrapper');
  if (strokeTextWrapper) {
    strokeTextWrapper.style.filter = 'none';
    strokeTextWrapper.style.opacity = '1';
    strokeTextWrapper.style.visibility = 'visible';
  }
  const strokePath = document.querySelector('.stroke-draw-path');
  if (strokePath) {
    strokePath.style.strokeDashoffset = '0';
    strokePath.style.stroke = '#FFFFFF';
    strokePath.style.opacity = '1';
  }
  const wipeRect = document.getElementById('stroke-wipe-rect');
  if (wipeRect) {
    wipeRect.setAttribute('width', '100%');
    wipeRect.setAttribute('height', '56');
    wipeRect.style.width = '100%';
  }
  const wipeRect2 = document.getElementById('stroke-wipe-rect-2');
  if (wipeRect2) {
    wipeRect2.setAttribute('width', '100%');
    wipeRect2.setAttribute('height', '66');
    wipeRect2.style.width = '100%';
  }

  // Right Flank: INSTINTO PARA DOMINAR EL MERCADO
  const curtainRight = document.getElementById('hero-curtain-right');
  if (curtainRight) {
    curtainRight.classList.remove('opacity-0');
    curtainRight.style.opacity = '1';
    curtainRight.style.visibility = 'visible';
    curtainRight.style.filter = 'none';
  }
  const curtainRect = document.getElementById('hero-curtain-rect');
  if (curtainRect) {
    curtainRect.setAttribute('y', '0');
    curtainRect.setAttribute('height', '270');
  }
  const microCta = document.getElementById('hero-micro-cta');
  if (microCta) {
    microCta.style.opacity = '1';
    microCta.style.visibility = 'visible';
    microCta.style.clipPath = 'none';
    microCta.style.webkitClipPath = 'none';
    microCta.style.pointerEvents = 'auto';
  }

  // 3D Wolf Model Canvas
  const canvas = document.getElementById('hero-3d-canvas');
  if (canvas) {
    canvas.style.opacity = '1';
    canvas.style.clipPath = 'none';
    canvas.style.webkitClipPath = 'none';
    canvas.style.visibility = 'visible';
  }
  if (typeof isHero3DRevealed !== 'undefined') isHero3DRevealed = true;

  // Background Video
  const heroBgVideo = document.getElementById('hero-bg-video');
  if (heroBgVideo && heroBgVideo.paused) {
    heroBgVideo.play().catch(() => {});
  }

  if (force || !_isHeroUiEnsured) {
    _isHeroUiEnsured = true;
    if (typeof alignHeroDigitalText === 'function') alignHeroDigitalText();
    if (typeof alignHeroRightText === 'function') alignHeroRightText();
  }
}
window.ensureHeroUiVisible = ensureHeroUiVisible;

// Si al cargar o refrescar no estamos en el Hero, ocultar inmediatamente los textos del Hero
if ((window.scrollY || window.pageYOffset || 0) > 80) {
  const earlyHeroUi = document.getElementById('hero-ui-content');
  if (earlyHeroUi) {
    earlyHeroUi.style.display = 'none';
    earlyHeroUi.style.opacity = '0';
    earlyHeroUi.style.visibility = 'hidden';
    earlyHeroUi.style.pointerEvents = 'none';
  }
  ensureHeroUiVisible();
}

// Persist scroll position continuously and on pagehide/unload
window.addEventListener('scroll', saveCurrentScrollPosition, { passive: true });
window.addEventListener('beforeunload', saveCurrentScrollPosition);
window.addEventListener('pagehide', saveCurrentScrollPosition);

document.addEventListener('DOMContentLoaded', () => {
  // Restore scroll without resetting to Hero and align Hero SVG text
  restoreCurrentScrollPosition();
  if ((window.scrollY || window.pageYOffset || 0) > 80) {
    const earlyHeroUi = document.getElementById('hero-ui-content');
    if (earlyHeroUi) {
      earlyHeroUi.style.display = 'none';
      earlyHeroUi.style.opacity = '0';
      earlyHeroUi.style.visibility = 'hidden';
      earlyHeroUi.style.pointerEvents = 'none';
    }
  }
  alignHeroDigitalText();

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

  // 7. Lazy-load below-the-fold background videos (fetch + play only when visible)
  initLazyVideos();

  // 8. Persistent Bottom-Left Scroll Indicator (Curtain animation + 20s idle timeout)
  initPersistentScrollIndicator();

  // Fallback trigger if intro screen is disabled or absent
  const introScreen = document.getElementById('intro-screen');
  if (!introScreen || window.getComputedStyle(introScreen).display === 'none') {
    setTimeout(triggerStrokeTextEffect, 300);
  }
});

/**
 * Fullscreen Video Intro & Asset Preloader Controller
 */
function initPageVideoIntro() {
  const introScreen = document.getElementById('intro-screen');
  const video = document.getElementById('intro-video');
  const skipBtn = document.getElementById('skip-intro-btn');

  if (!introScreen || !video) {
    setTimeout(triggerStrokeTextEffect, 200);
    return;
  }

  // Si el usuario refresca la página estando ya en una sección inferior, omitir intro
  const currentY = window.scrollY || window.pageYOffset || 0;
  if (currentY > 120) {
    introScreen.style.display = 'none';
    introScreen.style.opacity = '0';
    introScreen.style.pointerEvents = 'none';
    try { video.pause(); } catch (e) {}
    return;
  }

  let isDismissed = false;
  let rafId = null;

  function dismissIntro() {
    if (isDismissed) return;
    isDismissed = true;
    if (rafId) cancelAnimationFrame(rafId);

    introScreen.style.transition = 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    introScreen.style.opacity = '0';
    introScreen.style.pointerEvents = 'none';

    // Iniciar de inmediato la animación del hero
    triggerStrokeTextEffect();

    setTimeout(() => {
      introScreen.style.display = 'none';
      try { video.pause(); } catch (e) {}
    }, 350);
  }

  // Reproducir video intro de inmediato (silenciado y con soporte autoplay)
  video.currentTime = 0;
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Autoplay intro video blocked or delayed:', err);
    });
  }

  // Monitoreo de alta precisión con requestAnimationFrame para ocultar justo antes del frame estático final
  function checkProgress() {
    if (isDismissed) return;
    if (video.duration && video.duration > 0) {
      if (video.duration - video.currentTime <= 0.2) {
        dismissIntro();
        return;
      }
    }
    rafId = requestAnimationFrame(checkProgress);
  }
  rafId = requestAnimationFrame(checkProgress);

  // Transición al finalizar el video
  video.addEventListener('ended', dismissIntro);
  video.addEventListener('timeupdate', () => {
    if (video.duration && (video.duration - video.currentTime < 0.25)) {
      dismissIntro();
    }
  });

  // Temporizador de seguridad (video dura 5s)
  setTimeout(() => {
    if (!isDismissed) dismissIntro();
  }, 5200);

  // Clic en video o pantalla para omitir
  video.style.cursor = 'pointer';
  video.addEventListener('click', dismissIntro);
  introScreen.addEventListener('click', (e) => {
    if (e.target !== skipBtn) dismissIntro();
  });

  // Botón Saltar Intro
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissIntro();
    });
  }

  // Tecla ESC para omitir
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
    -1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    1.0, 1.0,
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
 * Lazy-load below-the-fold background videos.
 * These carry `data-lazy-src` (on the <video> or a child <source>) instead of `src`,
 * so the browser never fetches them until they actually scroll into view — and we
 * pause (not unload) them when they scroll back out, to save CPU/battery without
 * re-buffering every time the user scrolls past.
 */
function initLazyVideos() {
  const videoEls = new Set();
  document.querySelectorAll('video[data-lazy-src]').forEach((v) => videoEls.add(v));
  document.querySelectorAll('source[data-lazy-src]').forEach((source) => {
    const parentVideo = source.closest('video');
    if (parentVideo) videoEls.add(parentVideo);
  });
  if (videoEls.size === 0) return;

  const startVideo = (video) => {
    if (!video.dataset.lazyLoaded) {
      if (video.dataset.lazySrc) {
        video.src = video.dataset.lazySrc;
      } else {
        const source = video.querySelector('source[data-lazy-src]');
        if (source) source.src = source.dataset.lazySrc;
      }
      video.load();
      video.dataset.lazyLoaded = 'true';
    }
    const p = video.play();
    if (p && p.catch) p.catch(() => { });
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startVideo(entry.target);
      } else if (entry.target.dataset.lazyLoaded) {
        entry.target.pause();
      }
    });
  }, { threshold: 0.1, rootMargin: '200px 0px' });

  videoEls.forEach((video) => io.observe(video));
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
  if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

  // ==================== ENVIRONMENT MAP (IBL) — reflejos reales sobre el material del hero ====================
  // Archivo studio.exr en la raíz del proyecto (junto a index.html)
  if (typeof THREE.EXRLoader !== 'undefined') {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    new THREE.EXRLoader().load(
      './studio.exr',
      (hdrTexture) => {
        const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
        scene.environment = envMap;
        hdrTexture.dispose();
        pmremGenerator.dispose();
        console.log('EXR de entorno cargado — reflejos activos en el material del hero.');
      },
      undefined,
      (err) => {
        console.warn('No se encontró studio.exr en la raíz del proyecto; el modelo seguirá sin reflejos de entorno hasta que lo agregues ahí.', err);
      }
    );
  } else {
    console.warn('THREE.EXRLoader no está cargado — revisa el <script> de EXRLoader.js en index.html.');
  }

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
  let currentEyeGlowLerp = 0; // 0.0 = Base Blue, 1.0 = Project Yellow/Lime

  const detectedEyeMeshes = [];
  const detectedHeadMeshes = [];
  const eyePointLights = [];

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
    const noseScreenY = window.innerHeight * 0.52;

    const spanX = Math.max(window.innerWidth * 0.48, 300);
    const spanY = Math.max(window.innerHeight * 0.48, 300);

    const normX = Math.max(-1.0, Math.min(1.0, (clientX - noseScreenX) / spanX));
    const normY = Math.max(-1.0, Math.min(1.0, (clientY - noseScreenY) / spanY));

    targetRotY = normX * MAX_ROT_Y;
    targetRotX = normY * MAX_ROT_X; // Movimiento vertical fluido según cursor (inclinación arriba/abajo)

    // Instant zero-lag hover detection over the 3D wolf head (0 CPU overhead)
    const hoverSpanX = Math.max(window.innerWidth * 0.18, 140);
    const hoverSpanY = Math.max(window.innerHeight * 0.22, 170);
    const dx = (clientX - noseScreenX) / hoverSpanX;
    const dy = (clientY - noseScreenY) / hoverSpanY;
    isHoveredOverModel = (dx * dx + dy * dy) <= 1.0;
  }

  function resetModelToBasePosition() {
    targetRotY = 0;
    targetRotX = 0;
    isHoveredOverModel = false;
    if (typeof resetDisenoHoverGlitch === 'function') resetDisenoHoverGlitch();
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
            const srcMat = child.material;
            const physMat = new THREE.MeshPhysicalMaterial({
              color: 0x433DAE, // Azul de marca (--cognitive-blue en style.css / Tailwind)
              transparent: true,
              opacity: 1.0,
              depthWrite: true,
              metalness: 0.18,        // plástico = mayormente dieléctrico
              roughness: 0.36,
              clearcoat: 0.35,        // menos barniz blanco encima
              clearcoatRoughness: 0.18,
              envMapIntensity: 0.22,  // HDR balanceado
            });
            if (srcMat) {
              if (srcMat.map) physMat.map = srcMat.map;
              if (srcMat.normalMap) {
                physMat.normalMap = srcMat.normalMap;
                if (srcMat.normalScale) physMat.normalScale = srcMat.normalScale.clone();
              }
              if (srcMat.roughnessMap) physMat.roughnessMap = srcMat.roughnessMap;
              if (srcMat.aoMap) {
                physMat.aoMap = srcMat.aoMap;
                physMat.aoMapIntensity = srcMat.aoMapIntensity ?? 1;
              }
            }
            physMat.needsUpdate = true;
            child.material = physMat;

            const name = (child.name || '').trim();
            const matName = (child.material ? child.material.name || '' : '').trim();

            // Identificar 'Sphere'/'Sphere.001' (ojos en poligonal-30-08-26.glb) o 'Grid'
            const isEye = name.toLowerCase().includes('sphere') ||
              name.toLowerCase().includes('grid') ||
              name.toLowerCase().includes('eye') ||
              matName.toLowerCase().includes('eye');

            if (isEye) {
              console.log("--> OJO IDENTIFICADO EXACTAMENTE:", name, matName);
              const eyePhysMat = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0x0055ff),     // Azul eléctrico puro saturado
                emissive: new THREE.Color(0x0066ff),  // Emisivo azul
                emissiveIntensity: 0.85,              // Calibrado para resplandor azul visible sin saturar a blanco
                roughness: 0.25,
                metalness: 0.10,
                clearcoat: 0.10,
                clearcoatRoughness: 0.10,
                transparent: true,
                opacity: 1.0,
                depthWrite: true,
              });
              child.material = eyePhysMat;
              detectedEyeMeshes.push(child);

              // Attach real physical point light emitting directly from the eye pupil:
              const eyeLight = new THREE.PointLight(0x0055ff, 0.35, 3.5, 1.2);
              eyeLight.position.set(0, 0, 0.35);
              child.add(eyeLight);
              eyePointLights.push(eyeLight);
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
        isHero3DModelLoaded = true;
        triggerHero3DReveal();
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
    // --- Live video texture for the smartphone screen ---
    const screenVideo = document.createElement('video');
    screenVideo.src = 'Abstract_animation_marketing_web_1080p.mp4';
    screenVideo.onerror = () => {
      screenVideo.src = encodeURI('Abstract_animation_marketing_web…_1080p_20260921004014.mp4');
    };
    screenVideo.loop = true;
    screenVideo.muted = true;
    screenVideo.defaultMuted = true;
    screenVideo.autoplay = true;
    screenVideo.playsInline = true;
    screenVideo.setAttribute('muted', '');
    screenVideo.setAttribute('playsinline', '');
    screenVideo.setAttribute('webkit-playsinline', '');
    screenVideo.preload = 'auto';
    screenVideo.style.cssText = 'position:fixed;left:0;top:0;width:32px;height:32px;opacity:0.01;pointer-events:none;z-index:-9999;';
    document.body.appendChild(screenVideo);

    section3ScreenTexture = new THREE.VideoTexture(screenVideo);
    if (THREE.sRGBEncoding !== undefined) section3ScreenTexture.encoding = THREE.sRGBEncoding;
    section3ScreenTexture.minFilter = THREE.LinearFilter;
    section3ScreenTexture.magFilter = THREE.LinearFilter;
    section3ScreenTexture.generateMipmaps = false;
    section3ScreenTexture.wrapS = THREE.ClampToEdgeWrapping;
    section3ScreenTexture.wrapT = THREE.ClampToEdgeWrapping;

    const updateScreenAspect = () => {
      if (!phoneScreenMesh || !phoneScreenMesh.geometry) return;
      const geo = phoneScreenMesh.geometry;
      const bb = geo.boundingBox;
      if (!bb) return;
      const ext = new THREE.Vector3().subVectors(bb.max, bb.min);
      const order = ['x', 'y', 'z'].sort((a, b) => ext[b] - ext[a]);
      const vAxis = order[0];
      const uAxis = order[1];
      const screenAspect = (ext[uAxis] || 1) / (ext[vAxis] || 1);
      const vW = screenVideo.videoWidth || 1080;
      const vH = screenVideo.videoHeight || 1920;
      const videoAspect = vW / vH;
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
    };
    screenVideo.addEventListener('loadedmetadata', updateScreenAspect);

    const playScreenVideo = () => {
      if (screenVideo.paused) {
        const p = screenVideo.play();
        if (p && p.catch) p.catch(() => { });
      }
    };
    screenVideo.addEventListener('loadeddata', playScreenVideo);
    playScreenVideo();
    window.addEventListener('scroll', playScreenVideo, { passive: true, once: true });
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

        // Scale phone to look balanced, sharp and imposing with vertical safety margin
        const scale = 5.2 / maxDim;
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
              const vW = screenVideo.videoWidth || 1080;
              const vH = screenVideo.videoHeight || 1920;
              const videoAspect = vW / vH;
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

  // ==================== NON-LINEAR SCROLL SPEED MAPPING ====================
  // Preserves 100% of Hero & Section 1/2 speed, and reduces speed by 75% (4x physical distance)
  // exclusively from Smartphone emergence / Ecosistema downwards.
  function mapHeroToSection2Scroll(raw) {
    if (raw <= 0) return 0;
    if (raw >= 1) return 1;

    // Phase 1: Hero and Manifiesto (PRESERVED 100% UNTOUCHED in physical speed and distance)
    // Physical distance of 388.5vh out of 1320vh (raw: 0.0 -> 0.2943)
    if (raw < 0.2254) {
      // Hero to Manifiesto opening (p: 0 -> 0.22)
      const u = raw / 0.2254;
      return (u * 0.85 + u * u * 0.15) * 0.22;
    } else if (raw < 0.2943) {
      // Manifiesto reading to line collapse (p: 0.22 -> 0.44)
      const u = (raw - 0.2254) / (0.2943 - 0.2254);
      return 0.22 + u * 0.22;
    }

    // Phase 2: FROM SMARTPHONE / ECOSISTEMA DOWNWARDS (-75% velocity, 4x physical scroll distance)
    if (raw < 0.4458) {
      // Smartphone Zoom Out (p: 0.44 -> 0.60)
      const u = (raw - 0.2943) / (0.4458 - 0.2943);
      return 0.44 + u * (0.60 - 0.44);
    } else if (raw < 0.6125) {
      // Smartphone 360° Spin (p: 0.60 -> 0.75)
      const u = (raw - 0.4458) / (0.6125 - 0.4458);
      return 0.60 + u * (0.75 - 0.60);
    } else if (raw < 0.6504) {
      // Smartphone Upward Exit & Transition (p: 0.75 -> 0.77)
      const u = (raw - 0.6125) / (0.6504 - 0.6125);
      return 0.75 + u * (0.77 - 0.75);
    } else if (raw < 0.8171) {
      // Section 02 // Ecosistema Cards Stream (p: 0.77 -> 0.885)
      const u = (raw - 0.6504) / (0.8171 - 0.6504);
      return 0.77 + u * (0.885 - 0.77);
    } else {
      // Section 03 // Ejecución ScrollExpand (p: 0.885 -> 1.00)
      const u = (raw - 0.8171) / (1.0 - 0.8171);
      return 0.885 + u * (1.0 - 0.885);
    }
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
        scrollProgress = mapHeroToSection2Scroll(self.progress);
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
      const raw = Math.max(0, Math.min(1.0, current / maxScroll));
      scrollProgress = mapHeroToSection2Scroll(raw);
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
          const targetRaw = 0.7156 + ratio * (0.7881 - 0.7156);
          const track = document.getElementById('hero-scroll-track');
          if (track) {
            const trackRect = track.getBoundingClientRect();
            const trackTop = window.scrollY + trackRect.top;
            const maxScroll = track.offsetHeight - window.innerHeight;
            window.scrollTo(0, trackTop + targetRaw * maxScroll);
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
  let isSec3BodyRevealed = false;

  if (secEjecucionScrollContainer) {
    secEjecucionScrollContainer.addEventListener('wheel', (e) => {
      // If the section is not fully expanded yet (expansion in progress before 0.940)
      if (currentScrollLerp < 0.940) {
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
      // Otherwise allow standard internal scrolling to see photos below
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

      if (currentScrollLerp < 0.940) {
        window.scrollBy({ top: deltaY, behavior: 'auto' });
        return;
      }

      if (secEjecucionScrollContainer.scrollTop <= 0 && deltaY < 0) {
        window.scrollBy({ top: deltaY, behavior: 'auto' });
      }
    }, { passive: true });
  }

  // Smooth scroll tracking variables & Exact Deep Eye Cavity Target for poligonal-30-08-26.glb
  restoreCurrentScrollPosition();
  syncScrollProgress();
  let currentScrollLerp = scrollProgress;
  let initialSnapFrames = 5; // Snap directly on startup/refresh without lerping from Hero

  // Re-sync after initial layout/fonts settle
  setTimeout(() => {
    restoreCurrentScrollPosition();
    syncScrollProgress();
    currentScrollLerp = scrollProgress;
  }, 60);

  // Video scrubbing state & queue — persistent across render frames for Section 01 Identidad (Animar_imagen_720.mp4)
  const sec2Vid = document.getElementById('section2-manifesto-video');
  let _sec2VidSeeking = false;
  let _sec2VidPendingTime = null;

  function seekSec2Video(targetTime) {
    if (!sec2Vid) return;
    if (sec2Vid.readyState < 1) {
      _sec2VidPendingTime = targetTime;
      return;
    }
    if (_sec2VidSeeking || sec2Vid.seeking) {
      _sec2VidPendingTime = targetTime;
      return;
    }
    _sec2VidSeeking = true;
    _sec2VidPendingTime = null;

    if ('fastSeek' in sec2Vid) {
      try {
        sec2Vid.fastSeek(targetTime);
      } catch (e) {
        sec2Vid.currentTime = targetTime;
      }
    } else {
      sec2Vid.currentTime = targetTime;
    }
  }

  if (sec2Vid) {
    sec2Vid.muted = true;
    sec2Vid.playsInline = true;
    sec2Vid.setAttribute('muted', '');
    sec2Vid.setAttribute('playsinline', '');
    sec2Vid.setAttribute('webkit-playsinline', '');
    try { sec2Vid.load(); } catch (e) {}

    sec2Vid.addEventListener('seeked', () => {
      _sec2VidSeeking = false;
      if (_sec2VidPendingTime !== null) {
        const nextTime = _sec2VidPendingTime;
        _sec2VidPendingTime = null;
        if (Math.abs(nextTime - sec2Vid.currentTime) > 0.025) {
          seekSec2Video(nextTime);
        }
      }
    });

    sec2Vid.addEventListener('canplay', () => {
      if (_sec2VidPendingTime !== null) {
        const nextTime = _sec2VidPendingTime;
        _sec2VidPendingTime = null;
        seekSec2Video(nextTime);
      }
    });
  }

  let _vidTargetTime = 0;  // Target time calculated from scroll position

  // Video scrubbing state & queue for Section 03 Evidencia (Glowing_particles_floating_in_space_720.mp4)
  const sec3Vid = document.getElementById('scroll-expand-video');
  let _sec3VidSeeking = false;
  let _sec3VidPendingTime = null;

  function seekSec3Video(targetTime) {
    if (!sec3Vid) return;
    if (sec3Vid.readyState < 1) {
      _sec3VidPendingTime = targetTime;
      return;
    }
    if (_sec3VidSeeking || sec3Vid.seeking) {
      _sec3VidPendingTime = targetTime;
      return;
    }
    _sec3VidSeeking = true;
    _sec3VidPendingTime = null;

    if ('fastSeek' in sec3Vid) {
      try {
        sec3Vid.fastSeek(targetTime);
      } catch (e) {
        sec3Vid.currentTime = targetTime;
      }
    } else {
      sec3Vid.currentTime = targetTime;
    }
  }

  if (sec3Vid) {
    sec3Vid.muted = true;
    sec3Vid.playsInline = true;
    sec3Vid.setAttribute('muted', '');
    sec3Vid.setAttribute('playsinline', '');
    sec3Vid.setAttribute('webkit-playsinline', '');
    try {
      sec3Vid.pause();
      sec3Vid.load();
    } catch (e) {}

    sec3Vid.addEventListener('seeked', () => {
      _sec3VidSeeking = false;
      if (_sec3VidPendingTime !== null) {
        const nextTime = _sec3VidPendingTime;
        _sec3VidPendingTime = null;
        if (Math.abs(nextTime - sec3Vid.currentTime) > 0.025) {
          seekSec3Video(nextTime);
        }
      }
    });

    sec3Vid.addEventListener('canplay', () => {
      if (_sec3VidPendingTime !== null) {
        const nextTime = _sec3VidPendingTime;
        _sec3VidPendingTime = null;
        seekSec3Video(nextTime);
      }
    });
  }
  const targetEyePos = new THREE.Vector3(0.85, 0.40, 1.05); // Calibrated exact target for poligonal-30-08-26.glb

  // Bottom dock items helper
  const bottomDock = document.getElementById('bottom-dock-nav');
  const dockLinks = bottomDock ? bottomDock.querySelectorAll('a') : [];

  // Use the global updateActiveDockItem so there's only one source of truth
  function updateActiveDockItem(index) {
    if (typeof window._updateActiveDockItem === 'function') {
      window._updateActiveDockItem(index);
    } else {
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


    // Bottom-dock jump override (05 // Metodología, 06 // Diagnóstico): while a dock
    // button drives the page to the end of the timeline we SNAP progress instead of
    // easing it, so this loop stops zeroing / shrinking the 03 portal mid-catch-up.
    if (window.__forceTimelineProgress != null) {
      if (performance.now() < window.__forceTimelineUntil) {
        scrollProgress = window.__forceTimelineProgress;
        currentScrollLerp = window.__forceTimelineProgress;
      } else {
        window.__forceTimelineProgress = null;
      }
    }

    // Smoothly interpolate scroll progress for cinematic motion
    if (initialSnapFrames > 0) {
      initialSnapFrames--;
      syncScrollProgress();
      currentScrollLerp = scrollProgress;
    } else {
      currentScrollLerp += (scrollProgress - currentScrollLerp) * 0.12;
    }

    // =========================================================================
    // UNIFIED DETERMINISTIC SCROLL TIMELINE (0.0 to 1.0)
    // =========================================================================
    const T_HEAD_ZOOM_END = 0.10;       // 0% -> 10%: 3D Head zooms into eye
    const T_REVEAL_START = 0.08;        // 8% -> Laser dot appears
    const T_REVEAL_END = 0.16;          // 16% -> Section 2 curtains 100% open & flat
    const T_CONTENT_SCROLL_END = 0.36;  // 16% -> 36%: Section 2 content active & full video scrub
    const T_EXIT_START = 0.36;          // 36% -> Curtains start closing only AFTER video finishes
    const T_PHONE_ZOOM_START = 0.48;    // 48% -> Vertical line formed & Smartphone starts Zoom Out!
    const T_EXIT_END = 0.58;            // 58% -> Line collapses to center PUNTO
    const T_PHONE_ZOOM_END = 0.62;      // 62% -> Smartphone fully centered
    const T_SPIN_START = 0.62;          // 62% -> 360° rotation begins with scroll
    const T_SPIN_END = 0.76;            // 76% -> 360° spin completes
    // 76% -> 80%: Smartphone shifts upwards & Kinetic Text Background fades out
    // 77% -> 86.5%: Section 3 Ecosistema cards stream active
    // 86.5% -> 88.5%: ScrollExpand appears with blur effect
    // 88.5% -> 94%: ScrollExpand expands to full screen & flanks retreat
    // 94% -> 100%: 03 // Ejecución full stage active

    if (currentScrollLerp < T_PHONE_ZOOM_START) {
      // 2. Camera Deep Eye Entry (0.0 to 0.10) - Centered in Hero, zooms into eye socket
      const pHead = Math.min(1.0, currentScrollLerp / T_HEAD_ZOOM_END);

      // El modelo de la cabeza se mantiene sólido y comienza a desvanecerse al aparecer el punto
      let headOpacity = 1.0;
      if (currentScrollLerp >= T_REVEAL_START) {
        const pFade = (currentScrollLerp - T_REVEAL_START) / 0.03;
        headOpacity = Math.max(0, 1.0 - Math.min(1.0, pFade));
      }

      // Los OJOS se desvanecen cuando el recorrido hacia el ojo ha avanzado un 60% (pHead >= 0.60)
      let eyeOpacity = headOpacity;
      if (pHead >= 0.60) {
        // Desvanecimiento suave desde el 60% hasta el 78% del recorrido
        const pEyeFade = Math.min(1.0, Math.max(0, (pHead - 0.60) / 0.18));
        const eyeFadeProgress = 0.5 * (1.0 + Math.cos(pEyeFade * Math.PI)); // 1.0 -> 0.0 suave
        eyeOpacity = Math.min(headOpacity, eyeFadeProgress);
      }

      detectedHeadMeshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.opacity = headOpacity;
          mesh.material.transparent = true;
        }
      });
      detectedEyeMeshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.opacity = eyeOpacity;
          mesh.material.transparent = true;
          mesh.material.depthWrite = eyeOpacity > 0.5;
        }
        mesh.visible = eyeOpacity > 0.001;
      });
      modelGroup.visible = (headOpacity > 0.001 || eyeOpacity > 0.001);
      smartphoneGroup.visible = false;

      // Full Iconic Hero Lighting for Wolf Head (Vibrant Cyber-Lavender + Lime & Purple Specular Highlights)
      // NOTA: intensidades reducidas vs. el original — con metalness bajo (material tipo plástico)
      // la respuesta difusa es mucho mayor que con el metalness:0.75 anterior, así que estos mismos
      // valores ahora sobreexponían el modelo (se veía casi blanco puro).
      dirLightLime.color.set(0xc3f400);
      dirLightLime.position.set(5, 10, 7);
      dirLightLime.intensity = 1.1;

      dirLightPurple.color.set(0x64b5f6);
      dirLightPurple.position.set(-5, -5, -5);
      dirLightPurple.intensity = 0.9;

      pointLight.color.set(0xffffff);
      pointLight.position.set(0, 5, 5);
      pointLight.intensity = 0.9;

      lowerLeftPurpleLight.intensity = 0.35;
      upperRightPinkLight.color.set(0xff1443);
      upperRightPinkLight.intensity = 0.45;

      ambientLight.color.set(0xffffff);
      ambientLight.intensity = 0.25;
      phoneFrontLight.position.set(0, 2, 10);
      phoneFrontLight.intensity = 0.0;

      const hero3dContainer = document.getElementById('hero-3d-container');
      if (hero3dContainer) {
        hero3dContainer.style.zIndex = '10';
        hero3dContainer.style.transform = 'none';
      }

      // Asegurar que el canvas esté visible únicamente en Hero y totalmente oculto en Sección 2 (Manifiesto)
      const hero3dCanvas = document.getElementById('hero-3d-canvas');
      if (hero3dCanvas) {
        if (currentScrollLerp < 0.11) {
          hero3dCanvas.style.opacity = Math.max(0, headOpacity).toFixed(3);
          hero3dCanvas.style.filter = 'drop-shadow(0 0 60px rgba(82,39,255,0.45))';
          hero3dCanvas.style.pointerEvents = headOpacity > 0.05 ? 'auto' : 'none';
        } else {
          hero3dCanvas.style.opacity = '0';
          hero3dCanvas.style.filter = 'none';
          hero3dCanvas.style.pointerEvents = 'none';
        }
      }

      const kineticBg = document.getElementById('kinetic-text-bg');
      if (kineticBg) {
        kineticBg.style.opacity = '0';
        kineticBg.style.filter = 'blur(20px)';
        kineticBg.style.display = 'none';
      }

      // Eye Glow Controller, MERCADO Word Glow & INSTINTO Glitch Controller: Base = azul neón saturado (0x0055FF). Hover = azul brillante intenso (0x00D5FF).
      const targetGlow = (isHoveredOverModel && currentScrollLerp < 0.05) ? 1.0 : 0.0;
      currentEyeGlowLerp += (targetGlow - currentEyeGlowLerp) * 0.20;

      const mercadoWord = document.getElementById('hero-word-mercado') || document.getElementById('hero-word-nucleo');
      if (mercadoWord) {
        if (targetGlow > 0.5) {
          mercadoWord.classList.add('nucleo-glow-active');
        } else {
          mercadoWord.classList.remove('nucleo-glow-active');
        }
      }

      if (targetGlow > 0.5) {
        if (typeof triggerDisenoHoverGlitch === 'function') triggerDisenoHoverGlitch();
      } else {
        if (typeof resetDisenoHoverGlitch === 'function') resetDisenoHoverGlitch();
      }

      const baseNeonBlue = new THREE.Color(0x0055ff);
      const baseEmissiveBlue = new THREE.Color(0x0066ff);
      const brightGlowBlue = new THREE.Color(0x0099ff);
      const brightEmissiveBlue = new THREE.Color(0x00d5ff); // Azul cian hiper-brillante

      const currentColor = new THREE.Color().lerpColors(baseNeonBlue, brightGlowBlue, currentEyeGlowLerp);
      const currentEmissive = new THREE.Color().lerpColors(baseEmissiveBlue, brightEmissiveBlue, currentEyeGlowLerp);
      const currentIntensity = THREE.MathUtils.lerp(0.85, 3.2, currentEyeGlowLerp);

      detectedEyeMeshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.color.copy(currentColor);
          mesh.material.emissive.copy(currentEmissive);
          mesh.material.emissiveIntensity = currentIntensity;
          mesh.material.roughness = THREE.MathUtils.lerp(0.25, 0.02, currentEyeGlowLerp);
        }
      });

      // Emisión de luz física real en la escena 3D desde las pupilas (azul brillante intenso):
      const lightInt = THREE.MathUtils.lerp(0.35, 5.0, currentEyeGlowLerp);
      eyePointLights.forEach(light => {
        light.color.copy(currentEmissive);
        light.intensity = lightInt;
        light.distance = THREE.MathUtils.lerp(3.5, 6.0, currentEyeGlowLerp);
      });

      // 1. Head tilt follows mouse only when at top of hero, dampens to 0 as user scrolls
      const mouseDampen = Math.max(0, 1.0 - currentScrollLerp * 3.0);
      currentRotY += (targetRotY * mouseDampen - currentRotY) * 0.20;
      currentRotX += (targetRotX * mouseDampen - currentRotX) * 0.20;

      modelGroup.rotation.y = BASE_ROT_Y + Math.max(-MAX_ROT_Y, Math.min(MAX_ROT_Y, currentRotY));
      modelGroup.rotation.x = Math.max(-MAX_ROT_X, Math.min(MAX_ROT_X, currentRotX));
      modelGroup.rotation.z = 0;

      // 2. Camera Deep Eye Entry (0.0 to 0.10) - Centered in Hero, zooms into eye socket
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

      // 4. Symmetrical Flank Inward Motion & Dynamic Scale on Scroll (Towards 3D Wolf Center)
      const curtainRight = document.getElementById('hero-curtain-right');
      const strokeTextWrapper = document.getElementById('stroke-text-wrapper');

      const pScale = Math.min(1.0, currentScrollLerp / 0.08);
      const pScaleEased = Math.sin((pScale * Math.PI) / 2);
      const currentScale = 1.0 + 0.04 * pScaleEased;
      const shiftDistance = pScaleEased * 45; // Exact same symmetrical inward distance (45px)

      if (curtainRight) {
        curtainRight.style.transformOrigin = 'right center';
        curtainRight.style.transform = `translateX(${-shiftDistance.toFixed(1)}px) scale(${currentScale.toFixed(3)})`;
      }

      if (strokeTextWrapper) {
        strokeTextWrapper.style.transformOrigin = 'left center';
        strokeTextWrapper.style.transform = `translateX(${shiftDistance.toFixed(1)}px) scale(${currentScale.toFixed(3)})`;
      }

      // ==================== STRICT HERO UI VISIBILITY ====================
      // "LOS TEXTOS EN EL HERO DEBEN ESTAR VISIBLES EN TODO MOMENTO DURANTE EL HERO"
      // Se mantienen al 100% de opacidad y visibilidad durante todo el Hero (0.0 -> T_REVEAL_START)
      if (heroUi) {
        if (currentScrollLerp < T_REVEAL_START) {
          heroUi.style.display = 'flex';
          heroUi.style.opacity = '1.0';
          heroUi.style.visibility = 'visible';
          heroUi.style.transform = `translateY(${-currentScrollLerp * 30}px)`;
          heroUi.style.pointerEvents = 'auto';
          ensureHeroUiVisible();
        } else if (currentScrollLerp < T_REVEAL_START + 0.02) {
          _isHeroUiEnsured = false;
          // Desvanecimiento suave justo cuando el punto láser emerge hacia Sección 01 (0.08 -> 0.10)
          const pFade = (currentScrollLerp - T_REVEAL_START) / 0.02;
          const uiOpacity = Math.max(0, 1.0 - pFade);
          heroUi.style.display = uiOpacity > 0.01 ? 'flex' : 'none';
          heroUi.style.opacity = uiOpacity.toFixed(3);
          heroUi.style.visibility = uiOpacity > 0.01 ? 'visible' : 'hidden';
          heroUi.style.transform = `translateY(${-currentScrollLerp * 30}px)`;
          heroUi.style.pointerEvents = uiOpacity < 0.1 ? 'none' : 'auto';
        } else {
          _isHeroUiEnsured = false;
          heroUi.style.display = 'none';
          heroUi.style.opacity = '0';
          heroUi.style.visibility = 'hidden';
          heroUi.style.pointerEvents = 'none';
        }
      }

      if (heroScrollHint) {
        if (currentScrollLerp < T_REVEAL_START) {
          heroScrollHint.style.display = 'block';
          heroScrollHint.style.opacity = '1.0';
        } else if (currentScrollLerp < T_REVEAL_START + 0.02) {
          const pFade = (currentScrollLerp - T_REVEAL_START) / 0.02;
          heroScrollHint.style.opacity = Math.max(0, 1.0 - pFade).toFixed(3);
        } else {
          heroScrollHint.style.display = 'none';
          heroScrollHint.style.opacity = '0';
        }
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

        // =========================================================================
        // CONTROL DE VIDEO DE FONDO SECCIÓN 01 IDENTIDAD: SCRUBBING FLUIDO CON SCROLL
        // Inicia solo cuando la sección se ha desplegado totalmente (T_REVEAL_END = 0.16)
        // y se reproduce en su totalidad a lo largo de la lectura hasta T_VID_END = 0.36
        // =========================================================================
        if (sec2Vid) {
          if (!sec2Vid.paused) sec2Vid.pause();
          const vidDur = (sec2Vid.duration && !isNaN(sec2Vid.duration) && sec2Vid.duration > 0)
            ? sec2Vid.duration : 10.0;

          const T_VID_START = T_REVEAL_END;   // 0.16 (inicia hasta que la sección se despliega totalmente)
          const T_VID_END = T_EXIT_START;     // 0.36 (se reproduce totalmente antes de comenzar la salida)

          if (currentScrollLerp < T_VID_START) {
            _vidTargetTime = 0;
          } else if (currentScrollLerp <= T_VID_END) {
            const pVid = (currentScrollLerp - T_VID_START) / (T_VID_END - T_VID_START);
            _vidTargetTime = Math.max(0, Math.min(1.0, pVid)) * vidDur;
          } else {
            _vidTargetTime = vidDur;
          }

          const delta = Math.abs(_vidTargetTime - sec2Vid.currentTime);
          if (delta > 0.025) {
            seekSec2Video(_vidTargetTime);
          }
        }
      }
    } else {
      // --- Phase B: Section 3 Smartphone 3D Mode & Posteriores ---
      // Los textos del Hero nunca deben aparecer fuera del Hero
      if (heroUi) {
        heroUi.style.display = 'none';
        heroUi.style.opacity = '0';
        heroUi.style.visibility = 'hidden';
        heroUi.style.pointerEvents = 'none';
      }
      modelGroup.visible = false;
      smartphoneGroup.visible = true;

      // Elevate 3D Canvas Layer: frente al fondo cinético (z-32) y capas de Ecosistema (z-38 a z-40)
      const hero3dContainer = document.getElementById('hero-3d-container');
      if (hero3dContainer) {
        hero3dContainer.style.zIndex = '45';
        hero3dContainer.style.transform = 'none';
      }

      // Aparición y desaparición en blur + fade del Smartphone
      // Al hacer scroll hacia adelante aparece con blur(20px) -> blur(0px) y opacity 0 -> 1
      // Al regresar con scroll hacia atrás se desvanece en blur(0px) -> blur(20px) y se oculta totalmente
      const hero3dCanvas = document.getElementById('hero-3d-canvas');
      const pPhoneEntry = Math.max(0, Math.min(1.0, (currentScrollLerp - T_PHONE_ZOOM_START) / 0.05));
      const pPhoneEntryEased = Math.sin((pPhoneEntry * Math.PI) / 2);
      const phoneBlur = ((1.0 - pPhoneEntryEased) * 20).toFixed(1);

      if (hero3dCanvas) {
        hero3dCanvas.style.clipPath = 'none';
        hero3dCanvas.style.webkitClipPath = 'none';
        hero3dCanvas.style.opacity = pPhoneEntryEased.toFixed(3);
        hero3dCanvas.style.filter = phoneBlur > 0.2
          ? `blur(${phoneBlur}px) drop-shadow(0 0 60px rgba(82,39,255,0.45))`
          : 'drop-shadow(0 0 60px rgba(82,39,255,0.45))';
        hero3dCanvas.style.pointerEvents = pPhoneEntryEased > 0.1 ? 'auto' : 'none';
      }

      // Kinetic Text Background (Originkit) emerges behind the smartphone with blur
      const kineticBg = document.getElementById('kinetic-text-bg');
      if (kineticBg && currentScrollLerp < T_SPIN_END) {
        kineticBg.style.display = 'block';
        kineticBg.style.visibility = 'visible';
        const pKinetic = Math.max(0, Math.min(1.0, (currentScrollLerp - T_PHONE_ZOOM_START) / 0.04));
        const pKineticEased = Math.sin((pKinetic * Math.PI) / 2);
        const kBlur = ((1.0 - pKineticEased) * 20).toFixed(1);
        kineticBg.style.opacity = pKineticEased.toFixed(3);
        kineticBg.style.filter = kBlur > 0.2 ? `blur(${kBlur}px)` : 'none';
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

        const pUp = Math.min(1.0, (currentScrollLerp - T_SPIN_END) / 0.04);
        const pUpEased = Math.sin((pUp * Math.PI) / 2);

        // La cámara acompaña ligeramente el ascenso para evitar cualquier corte horizontal en el borde superior
        camera.position.set(0, pUpEased * 3.0, 8.5);
        camera.lookAt(0, pUpEased * 3.0, 0);

        // Smartphone se desplaza hacia arriba suavemente
        smartphoneGroup.scale.set(1.0, 1.0, 1.0);
        smartphoneGroup.position.set(0, pUpEased * 10.0, 0);
        smartphoneGroup.rotation.set(0, Math.PI * 2, 0); // Frontal

        // Desvanecimiento suave en el tramo final del ascenso para una salida totalmente limpia sin recortes
        if (pUpEased > 0.40 && hero3dCanvas) {
          const pExitFade = Math.max(0, 1.0 - (pUpEased - 0.40) / 0.45);
          hero3dCanvas.style.opacity = pExitFade.toFixed(3);
        }

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
      if (currentScrollLerp >= T_SPIN_END && currentScrollLerp < 0.865) {
        const pBgSec3 = Math.min(1.0, (currentScrollLerp - T_SPIN_END) / 0.025);
        const pBgEased = Math.sin((pBgSec3 * Math.PI) / 2);
        sec3BgWrapper.style.opacity = pBgEased.toFixed(3);
        sec3BgWrapper.style.filter = 'none';
      } else if (currentScrollLerp >= 0.865 && currentScrollLerp < 0.885) {
        // Desaparición en blur sincronizada con la aparición en blur de Ejecución
        const pBlurOut = (currentScrollLerp - 0.865) / 0.02;
        const pBlurOutEased = Math.sin((pBlurOut * Math.PI) / 2);
        sec3BgWrapper.style.opacity = Math.max(0, 1.0 - pBlurOutEased).toFixed(3);
        sec3BgWrapper.style.filter = `blur(${(pBlurOutEased * 20).toFixed(1)}px)`;
      } else if (currentScrollLerp >= 0.885) {
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
      if (currentScrollLerp >= T_SPIN_END && currentScrollLerp < 0.885) {
        // Entrada de flancos: poligonal02 (-100% -> -50%), liquid01 (+100% -> +50%)
        const pFlank = Math.min(1.0, (currentScrollLerp - T_SPIN_END) / 0.025);
        const pFlankEased = Math.sin((pFlank * Math.PI) / 2);

        const leftX = -100 + (pFlankEased * 50);
        flankLeft.style.transform = `translate3d(${leftX.toFixed(2)}%, -50%, 0)`;
        flankLeft.style.opacity = pFlankEased.toFixed(3);

        const rightX = 100 - (pFlankEased * 50);
        flankRight.style.transform = `translate3d(${rightX.toFixed(2)}%, -50%, 0)`;
        flankRight.style.opacity = (pFlankEased * 0.80).toFixed(3);
      } else if (currentScrollLerp >= 0.885) {
        // Retirada de flancos hacia los lados conforme ScrollExpand se expande
        const pRetreat = Math.min(1.0, (currentScrollLerp - 0.885) / 0.085);
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
      if (currentScrollLerp >= 0.77 && currentScrollLerp < 0.865) {
        // Entrada sutil y progresiva del contenedor de Ecosistema
        const pContainerIn = Math.min(1.0, Math.max(0, (currentScrollLerp - 0.77) / 0.025));
        const pContainerInEased = 0.5 * (1.0 - Math.cos(pContainerIn * Math.PI));
        sec3Container.style.opacity = pContainerInEased.toFixed(3);
        sec3Container.style.filter = 'none';
        sec3Container.style.pointerEvents = pContainerInEased > 0.6 ? 'auto' : 'none';

        // Escalonamiento secuencial suave para las 6 tarjetas
        const cardStarts = [0.78, 0.785, 0.79, 0.795, 0.80, 0.81];
        const cardDuration = 0.018;

        for (let k = 0; k < 6; k++) {
          const card = document.getElementById(`sec3-card-${k}`);
          if (card) {
            const start = cardStarts[k];
            if (currentScrollLerp < start) {
              card.style.opacity = '0';
              card.style.transform = 'translateY(28px) scale(0.98)';
            } else {
              const pCard = Math.min(1.0, (currentScrollLerp - start) / cardDuration);
              const pCardEased = 0.5 * (1.0 - Math.cos(pCard * Math.PI));
              const yOffset = ((1.0 - pCardEased) * 28).toFixed(1);
              const scaleVal = (0.98 + 0.02 * pCardEased).toFixed(3);
              card.style.opacity = pCardEased.toFixed(3);
              card.style.transform = `translateY(${yOffset}px) scale(${scaleVal})`;
            }
          }
        }

        // Sincronización continua y fluida del scroll de tarjetas
        if (sec3ScrollContainer && !isUserInteractingSec3) {
          const maxInternalScroll = sec3ScrollContainer.scrollHeight - sec3ScrollContainer.clientHeight;
          if (maxInternalScroll > 0) {
            if (currentScrollLerp <= 0.815) {
              sec3ScrollContainer.scrollTop = 0;
            } else {
              const pScrollCards = Math.min(1.0, Math.max(0, (currentScrollLerp - 0.815) / (0.865 - 0.815)));
              sec3ScrollContainer.scrollTop = pScrollCards * maxInternalScroll;
            }
          }
        }
      } else if (currentScrollLerp >= 0.865 && currentScrollLerp < 0.885) {
        // Desaparición en blur de Ecosistema mientras Ejecución aparece en blur
        const pBlurOut = (currentScrollLerp - 0.865) / 0.02;
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
      } else if (currentScrollLerp >= 0.885) {
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
            card.style.transform = 'translateY(28px) scale(0.98)';
          }
        }
      }
    }

    // ==================== LAYER 50: SCROLL EXPAND PORTAL ANIMATION (03 // EJECUCIÓN) ====================
    const expandWrapper = document.getElementById('sec-scroll-expand-wrapper');
    const expandFrame = document.getElementById('scroll-expand-frame');
    const expandVideo = document.getElementById('scroll-expand-video');
    const expandBody = document.getElementById('scroll-expand-body');
    const ejecucionScrollContainer = document.getElementById('sec-ejecucion-scroll-container');

    if (expandWrapper && expandFrame && expandVideo) {
      // Sincronización de reproducción del video con el scroll:
      // Comienza desde el momento que la ventana pequeña aparece (0.865)
      // y termina hasta reproducirse totalmente en pantalla completa (0.940)
      const T_SEC3_VID_START = 0.865;
      const T_SEC3_VID_END = 0.940;
      const vid3Dur = (expandVideo.duration && !isNaN(expandVideo.duration) && expandVideo.duration > 0)
        ? expandVideo.duration : 10.0;
      let sec3VidTarget = 0;

      if (currentScrollLerp < T_SEC3_VID_START) {
        sec3VidTarget = 0;
      } else if (currentScrollLerp <= T_SEC3_VID_END) {
        const pVid3 = (currentScrollLerp - T_SEC3_VID_START) / (T_SEC3_VID_END - T_SEC3_VID_START);
        sec3VidTarget = Math.max(0, Math.min(1.0, pVid3)) * vid3Dur;
      } else {
        sec3VidTarget = vid3Dur;
      }

      if (!expandVideo.paused) {
        try { expandVideo.pause(); } catch(e) {}
      }

      const deltaVid3 = Math.abs(sec3VidTarget - expandVideo.currentTime);
      if (deltaVid3 > 0.025) {
        seekSec3Video(sec3VidTarget);
      }

      if (currentScrollLerp < 0.865) {
        expandWrapper.style.opacity = '0';
        expandWrapper.style.filter = 'blur(20px)';
        expandWrapper.style.pointerEvents = 'none';
        expandFrame.style.width = '44vw';
        expandFrame.style.height = '58vh';
        expandFrame.style.borderRadius = '24px';
        expandVideo.style.transform = 'scale(1.35)';
        if (expandBody) {
          expandBody.style.clipPath = 'inset(0% 0% 100% 0%)';
          expandBody.style.webkitClipPath = 'inset(0% 0% 100% 0%)';
          expandBody.style.opacity = '0';
          expandBody.style.pointerEvents = 'none';
          expandBody.style.visibility = 'hidden';
          expandBody.style.transform = 'translateY(-20px)';
        }
        isSec3BodyRevealed = false;
        if (ejecucionScrollContainer) ejecucionScrollContainer.scrollTop = 0;
      } else if (currentScrollLerp < 0.885) {
        // Aparición con efecto blur después de la última tarjeta
        const pEntry = (currentScrollLerp - 0.865) / 0.02;
        const pEntryEased = Math.sin((pEntry * Math.PI) / 2);
        expandWrapper.style.opacity = pEntryEased.toFixed(3);
        expandWrapper.style.filter = `blur(${((1.0 - pEntryEased) * 20).toFixed(1)}px)`;
        expandWrapper.style.pointerEvents = 'none';
        expandFrame.style.width = '44vw';
        expandFrame.style.height = '58vh';
        expandFrame.style.borderRadius = '24px';
        expandVideo.style.transform = 'scale(1.35)';
        if (expandBody) {
          expandBody.style.clipPath = 'inset(0% 0% 100% 0%)';
          expandBody.style.webkitClipPath = 'inset(0% 0% 100% 0%)';
          expandBody.style.opacity = '0';
          expandBody.style.pointerEvents = 'none';
          expandBody.style.visibility = 'hidden';
          expandBody.style.transform = 'translateY(-20px)';
        }
        isSec3BodyRevealed = false;
        if (ejecucionScrollContainer) ejecucionScrollContainer.scrollTop = 0;
      } else {
        // Expansión a pantalla completa (44vw->100vw, 58vh->100vh, 24px->0px, video 1.35x->1.0x)
        expandWrapper.style.opacity = '1';
        expandWrapper.style.filter = 'none';

        const pExp = Math.min(1.0, (currentScrollLerp - 0.885) / 0.055);
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

        if (pExpEased < 0.99) {
          // Fase 1: El video debe ocupar toda la ventana ANTES de que los textos aparezcan
          if (ejecucionScrollContainer) {
            ejecucionScrollContainer.scrollTop = 0;
          }
          if (isSec3BodyRevealed) {
            isSec3BodyRevealed = false;
            if (expandBody) {
              if (window.gsap) {
                gsap.to(expandBody, {
                  clipPath: 'inset(0% 0% 100% 0%)',
                  webkitClipPath: 'inset(0% 0% 100% 0%)',
                  opacity: 0,
                  y: -20,
                  duration: 0.35,
                  overwrite: 'auto',
                  onComplete: () => {
                    if (!isSec3BodyRevealed) expandBody.style.visibility = 'hidden';
                  }
                });
              } else {
                expandBody.style.clipPath = 'inset(0% 0% 100% 0%)';
                expandBody.style.webkitClipPath = 'inset(0% 0% 100% 0%)';
                expandBody.style.opacity = '0';
                expandBody.style.visibility = 'hidden';
              }
            }
          }
        } else {
          // Fase 2: Una vez se despliega toda la sección a pantalla completa (100vw, 100vh),
          // los textos aparecen con efecto cortina de arriba hacia abajo
          if (!isSec3BodyRevealed && expandBody) {
            isSec3BodyRevealed = true;
            expandBody.style.visibility = 'visible';
            expandBody.style.pointerEvents = 'auto';
            if (window.gsap) {
              gsap.fromTo(expandBody,
                {
                  clipPath: 'inset(0% 0% 100% 0%)',
                  webkitClipPath: 'inset(0% 0% 100% 0%)',
                  opacity: 0,
                  y: -25
                },
                {
                  clipPath: 'inset(0% 0% 0% 0%)',
                  webkitClipPath: 'inset(0% 0% 0% 0%)',
                  opacity: 1,
                  y: 0,
                  duration: 1.1,
                  ease: 'power3.out',
                  overwrite: 'auto'
                }
              );
            } else {
              expandBody.style.clipPath = 'inset(0% 0% 0% 0%)';
              expandBody.style.webkitClipPath = 'inset(0% 0% 0% 0%)';
              expandBody.style.opacity = '1';
              expandBody.style.transform = 'translateY(0)';
            }
          }
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
      } else if (currentScrollLerp < 0.785) {
        // Mientras el smartphone está visible, emerge y gira en 3D, el contenedor fijo inferior se oculta
        dockOpacity = 0;
        updateActiveDockItem(null);
      } else if (currentScrollLerp < 0.815) {
        // Ecosistema reaparece gradualmente cuando el smartphone sale hacia arriba
        const pDockEcosistema = (currentScrollLerp - 0.785) / 0.03;
        dockOpacity = Math.min(1.0, Math.max(0, pDockEcosistema));
        updateActiveDockItem(1);
      } else if (currentScrollLerp < 0.865) {
        // Ecosistema activo (flujo de tarjetas)
        dockOpacity = 1.0;
        updateActiveDockItem(1);
      } else if (currentScrollLerp < 0.885) {
        // Al entrar la Sección 03 (ScrollExpand portal entra con blur), el índice inferior se desvanece
        const pDockFadeSec3 = (currentScrollLerp - 0.865) / 0.02;
        dockOpacity = Math.max(0, 1.0 - pDockFadeSec3);
        updateActiveDockItem(null);
      } else {
        // Durante toda la Sección 03 (03 // EJECUCIÓN Y EVIDENCIA - portada y portal):
        // El índice inferior se mantiene completamente desvanecido (opacity = 0).
        // Al hacer scroll interno hacia la Galería Flotante (Sección 04 // EVIDENCIA),
        // Metodología (05) y Diagnóstico (06), el índice reaparece suavemente.
        const internalScroll = document.getElementById('sec-ejecucion-scroll-container');
        const matrixTrack = document.getElementById('sec-matriz-25-track');
        if (internalScroll && matrixTrack) {
          const trackTop = matrixTrack.offsetTop;
          const scrollableDistance = matrixTrack.offsetHeight - internalScroll.clientHeight;
          const pInternalTrack = scrollableDistance > 0 ? (internalScroll.scrollTop - trackTop) / scrollableDistance : 0;

          if (pInternalTrack >= 0.86) {
            // Durante la última sección (Cierre y Footer), el índice fijo se oculta por completo
            const pFadeOut = Math.min(1.0, (pInternalTrack - 0.86) / 0.04);
            dockOpacity = Math.max(0, 1.0 - pFadeOut);
            updateActiveDockItem(null);
          } else if (internalScroll.scrollTop >= trackTop - 150) {
            // Reaparece al entrar a Sección 04 (Galería Flotante), Metodología y Diagnóstico
            const pReappear = Math.min(1.0, Math.max(0, (internalScroll.scrollTop - (trackTop - 150)) / 150));
            dockOpacity = pReappear;
          } else {
            // Durante toda la portada de Sección 03 está desvanecido
            dockOpacity = 0;
            updateActiveDockItem(null);
          }
        } else {
          dockOpacity = 0;
          updateActiveDockItem(null);
        }
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

      // Hero Phase (0.0 <= currentScrollLerp < T_REVEAL_START): Header completely transparent without background
      const isHeroPhase = currentScrollLerp < T_REVEAL_START;

      // White Liquid Glass Header in:
      // - 01 // Manifiesto (0.08 <= currentScrollLerp < T_PHONE_ZOOM_START)
      // - 02 // Ecosistema (0.785 <= currentScrollLerp < 0.885)
      // - 05 // Metodología (When curtain is revealed)
      const isWhiteHeaderPhase = (currentScrollLerp >= T_REVEAL_START && currentScrollLerp < T_PHONE_ZOOM_START) ||
        (currentScrollLerp >= 0.785 && currentScrollLerp < 0.885) ||
        isMetodologiaRevealed;

      // Transparent Floating Header during Smartphone Zoom & 360 Spin
      const isSmartphoneSpinPhase = currentScrollLerp >= T_PHONE_ZOOM_START && currentScrollLerp < 0.785;

      if (window._isDiagnosticoActive) {
        if (!globalHeader.classList.contains('glass-nav-transparent-section05')) {
          globalHeader.classList.add('glass-nav-transparent-section05');
          globalHeader.classList.remove('glass-nav-dark', 'glass-nav-white-liquid', 'glass-nav-transparent', 'glass-nav-hero-transparent');
        }
      } else if (isHeroPhase) {
        if (!globalHeader.classList.contains('glass-nav-hero-transparent')) {
          globalHeader.classList.add('glass-nav-hero-transparent');
          globalHeader.classList.remove('glass-nav-dark', 'glass-nav-white-liquid', 'glass-nav-transparent', 'glass-nav-transparent-section05');
        }
      } else if (isWhiteHeaderPhase) {
        if (!globalHeader.classList.contains('glass-nav-white-liquid')) {
          globalHeader.classList.add('glass-nav-white-liquid');
          globalHeader.classList.remove('glass-nav-dark', 'glass-nav-transparent', 'glass-nav-hero-transparent', 'glass-nav-transparent-section05');
        }
      } else if (isSmartphoneSpinPhase) {
        if (!globalHeader.classList.contains('glass-nav-transparent')) {
          globalHeader.classList.add('glass-nav-transparent');
          globalHeader.classList.remove('glass-nav-dark', 'glass-nav-white-liquid', 'glass-nav-hero-transparent', 'glass-nav-transparent-section05');
        }
      } else {
        // Dark Cyber Glass in 03 // Ejecución / Galería (0.84 - 1.0)
        if (!globalHeader.classList.contains('glass-nav-dark')) {
          globalHeader.classList.add('glass-nav-dark');
          globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-transparent', 'glass-nav-hero-transparent', 'glass-nav-transparent-section05');
        }
      }

      const persistentIndicator = document.getElementById('persistent-scroll-indicator');
      if (persistentIndicator) {
        persistentIndicator.classList.toggle('theme-dark', isWhiteHeaderPhase);
      }
    }

    // GPU Optimization: Only render 3D WebGL scene when either 3D Wolf Head or Smartphone are active & in view
    const is3DActive = (modelGroup && modelGroup.visible) || (smartphoneGroup && smartphoneGroup.visible);
    if (is3DActive) {
      try {
        renderer.render(scene, camera);
      } catch (err) {
        console.error('WebGL render error:', err);
      }
    } else {
      renderer.clear();
    }
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
function alignHeroDigitalText() {
  const strokePath = document.querySelector('.stroke-draw-path');
  if (!strokePath) return;
  const firstTspan = strokePath.querySelector('tspan:first-child');
  const lastTspan = strokePath.querySelector('tspan:last-child');
  if (!firstTspan) return;

  try {
    const w1 = firstTspan.getComputedTextLength();
    const w2 = lastTspan ? lastTspan.getComputedTextLength() : 0;
    const maxW = Math.max(w1, w2, 450);
    const targetX = Math.ceil(maxW).toString();
    document.querySelectorAll('.stroke-draw-path tspan:last-child, .stroke-fill-path tspan:last-child').forEach(el => {
      el.setAttribute('x', targetX);
      el.setAttribute('text-anchor', 'end');
    });
    const svg = strokePath.closest('svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${Math.ceil(maxW + 15)} 180`);
    }
  } catch (e) {}
}

/**
 * Interactive Glitch & Cyber Glyph Scramble Effect for the word "IMPACTO" on 3D Model Hover
 * Glitch burst duration: strictly 1000 ms (1.0s) per hover event
 */
let impactoGlitchInterval = null;
let impactoGlitchTimeout = null;
let isImpactoGlitching = false;
let hasImpactoGlitchRunForCurrentHover = false;
const ORIGINAL_IMPACTO_TEXT = 'DISEÑO';
const GLITCH_GLYPHS = ['D', 'I', 'S', 'E', 'Ñ', 'O', '4', 'C', 'T', '0', '1', '§', 'Σ', '#', '!', '?', 'Ø', 'Ξ', '¥', '3', 'Z', '9', '░', '▒', '▓', '<', '>', '/', '_'];

function triggerDisenoHoverGlitch() {
  triggerImpactoHoverGlitch();
}

function resetDisenoHoverGlitch() {
  resetImpactoHoverGlitch();
}

function triggerImpactoHoverGlitch() {
  if (hasImpactoGlitchRunForCurrentHover) return;
  hasImpactoGlitchRunForCurrentHover = true;

  startImpactoGlitch();

  if (impactoGlitchTimeout) clearTimeout(impactoGlitchTimeout);
  impactoGlitchTimeout = setTimeout(() => {
    stopImpactoGlitch();
  }, 1000);
}

function resetImpactoHoverGlitch() {
  hasImpactoGlitchRunForCurrentHover = false;
  if (impactoGlitchTimeout) {
    clearTimeout(impactoGlitchTimeout);
    impactoGlitchTimeout = null;
  }
  stopImpactoGlitch();
}

function startImpactoGlitch() {
  if (isImpactoGlitching) return;
  isImpactoGlitching = true;

  const impactoStroke = document.getElementById('hero-word-impacto-stroke');
  const impactoFill = document.getElementById('hero-word-impacto-fill');
  const cyanClone = document.getElementById('hero-impacto-glitch-cyan');
  const magentaClone = document.getElementById('hero-impacto-glitch-magenta');
  const limeClone = document.getElementById('hero-impacto-glitch-lime');

  if (impactoStroke) impactoStroke.classList.add('impacto-glitch-active');
  if (impactoFill) impactoFill.classList.add('impacto-glitch-active');
  if (cyanClone) cyanClone.classList.add('impacto-glitch-active');
  if (magentaClone) magentaClone.classList.add('impacto-glitch-active');
  if (limeClone) limeClone.classList.add('impacto-glitch-active');

  let frameCount = 0;
  if (impactoGlitchInterval) clearInterval(impactoGlitchInterval);

  impactoGlitchInterval = setInterval(() => {
    frameCount++;
    const shouldScramble = (frameCount % 6 !== 0);
    
    let scrambled = ORIGINAL_IMPACTO_TEXT;
    if (shouldScramble) {
      scrambled = ORIGINAL_IMPACTO_TEXT.split('').map((char) => {
        if (Math.random() < 0.45) {
          return GLITCH_GLYPHS[Math.floor(Math.random() * GLITCH_GLYPHS.length)];
        }
        return char;
      }).join('');
    }

    if (impactoStroke) impactoStroke.textContent = scrambled;
    if (impactoFill) impactoFill.textContent = scrambled;
    if (cyanClone) cyanClone.textContent = scrambled;
    if (magentaClone) magentaClone.textContent = scrambled;
    if (limeClone) limeClone.textContent = scrambled;
  }, 45);
}

function stopImpactoGlitch() {
  isImpactoGlitching = false;

  if (impactoGlitchInterval) {
    clearInterval(impactoGlitchInterval);
    impactoGlitchInterval = null;
  }

  const impactoStroke = document.getElementById('hero-word-impacto-stroke');
  const impactoFill = document.getElementById('hero-word-impacto-fill');
  const cyanClone = document.getElementById('hero-impacto-glitch-cyan');
  const magentaClone = document.getElementById('hero-impacto-glitch-magenta');
  const limeClone = document.getElementById('hero-impacto-glitch-lime');

  if (impactoStroke) {
    impactoStroke.classList.remove('impacto-glitch-active');
    impactoStroke.textContent = ORIGINAL_IMPACTO_TEXT;
  }
  if (impactoFill) {
    impactoFill.classList.remove('impacto-glitch-active');
    impactoFill.textContent = ORIGINAL_IMPACTO_TEXT;
  }
  if (cyanClone) {
    cyanClone.classList.remove('impacto-glitch-active');
    cyanClone.textContent = ORIGINAL_IMPACTO_TEXT;
  }
  if (magentaClone) {
    magentaClone.classList.remove('impacto-glitch-active');
    magentaClone.textContent = ORIGINAL_IMPACTO_TEXT;
  }
  if (limeClone) {
    limeClone.classList.remove('impacto-glitch-active');
    limeClone.textContent = ORIGINAL_IMPACTO_TEXT;
  }
}

function alignHeroRightText() {
  const rightEl = document.getElementById('hero-curtain-right');
  if (!rightEl) return;
  const svg = rightEl.querySelector('svg');
  const textEl = rightEl.querySelector('text');
  if (!svg || !textEl) return;

  try {
    let line1W = 0;
    let line2W = 0;
    let line3W = 0;
    const tspans = textEl.querySelectorAll('tspan');
    const tspanLine1 = document.getElementById('hero-word-instinto') || tspans[0];
    const tspanLine2 = tspans[1];
    const tspanLine3Intro = tspans[2];
    const tspanLine3Key = document.getElementById('hero-word-mercado') || tspans[3];

    if (tspanLine1) line1W = tspanLine1.getComputedTextLength();
    if (tspanLine2) line2W = tspanLine2.getComputedTextLength();
    if (tspanLine3Intro) line3W += tspanLine3Intro.getComputedTextLength();
    if (tspanLine3Key) line3W += tspanLine3Key.getComputedTextLength();

    const maxW = Math.max(line1W, line2W, line3W, 600);
    const finalW = Math.ceil(maxW + 25);
    svg.setAttribute('viewBox', `0 0 ${finalW} 270`);
    const curtainRect = document.getElementById('hero-curtain-rect');
    if (curtainRect) {
      curtainRect.setAttribute('width', `${finalW}`);
    }
  } catch (e) {}
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    alignHeroDigitalText();
    alignHeroRightText();
  });
}
window.addEventListener('resize', () => {
  alignHeroDigitalText();
  alignHeroRightText();
});

function triggerStrokeTextEffect() {
  // Si no estamos en el Hero (ej. refresh en otra sección), NUNCA ejecutar ni mostrar textos del Hero
  const currentY = window.scrollY || window.pageYOffset || 0;
  if (currentY > 80 || (typeof currentScrollLerp !== 'undefined' && currentScrollLerp > 0.06)) {
    const heroUi = document.getElementById('hero-ui-content');
    if (heroUi) {
      heroUi.style.display = 'none';
      heroUi.style.opacity = '0';
      heroUi.style.visibility = 'hidden';
      heroUi.style.pointerEvents = 'none';
    }
    const canvas = document.getElementById('hero-3d-canvas');
    if (canvas) {
      canvas.style.clipPath = 'none';
      canvas.style.webkitClipPath = 'none';
    }
    isHero3DRevealed = true;
    return;
  }

  const wrapper = document.getElementById('stroke-text-wrapper');
  const strokePath = document.querySelector('.stroke-draw-path');
  const wipeRect = document.getElementById('stroke-wipe-rect');
  const wipeRect2 = document.getElementById('stroke-wipe-rect-2');

  // Trigger horizontal curtain reveal on 3D Wolf model
  triggerHero3DReveal();

  if (!strokePath || !wipeRect) return;

  // Auto-align COMERCIAL flush with the right boundary of IMPACTO
  alignHeroDigitalText();
  alignHeroRightText();

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
 * Horizontal Split Curtain Reveal for Hero 3D Model
 * Opens smoothly from the center vertical line outwards to left and right simultaneously
 */
let isHero3DRevealed = false;
let isHero3DModelLoaded = false;

function triggerHero3DReveal() {
  if (isHero3DRevealed || !isHero3DModelLoaded) return;
  const canvas = document.getElementById('hero-3d-canvas');
  if (!canvas) return;

  const introScreen = document.getElementById('intro-screen');
  if (introScreen && window.getComputedStyle(introScreen).display !== 'none' && introScreen.style.opacity !== '0') {
    return;
  }

  isHero3DRevealed = true;
  canvas.style.opacity = '1';

  if (typeof gsap !== 'undefined') {
    const clipProgress = { val: 50 };
    gsap.fromTo(clipProgress,
      { val: 50 },
      {
        val: 0,
        duration: 1.5,
        ease: 'power3.inOut',
        onUpdate: () => {
          const p = clipProgress.val.toFixed(2);
          const clip = `inset(0% ${p}% 0% ${p}%)`;
          canvas.style.clipPath = clip;
          canvas.style.webkitClipPath = clip;
        },
        onComplete: () => {
          canvas.style.clipPath = 'none';
          canvas.style.webkitClipPath = 'none';
        }
      }
    );
  } else {
    canvas.style.clipPath = 'none';
    canvas.style.webkitClipPath = 'none';
  }
}

/**
 * Symmetrical Flank Reveal Effect for INSTINTO / PARA DOMINAR / EL MERCADO
 * Vertical curtain reveal opening from the center line simultaneously upwards and downwards
 */
function triggerCurtainRevealEffect() {
  const left = document.getElementById('hero-curtain-left');
  const right = document.getElementById('hero-curtain-right');
  const curtainRect = document.getElementById('hero-curtain-rect');
  const microCta = document.getElementById('hero-micro-cta');
  if (!right) return;

  alignHeroRightText();

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
      gsap.set(right, { opacity: 1 });
      if (curtainRect) {
        curtainRect.setAttribute('y', '135');
        curtainRect.setAttribute('height', '0');
        tl.to(curtainRect, {
          attr: { y: 0, height: 270 },
          duration: 0.9,
          ease: "power3.inOut"
        }, 0.05);
      } else {
        gsap.fromTo(right,
          { opacity: 1, clipPath: 'inset(50% 0% 50% 0%)', webkitClipPath: 'inset(50% 0% 50% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', webkitClipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.9, ease: "power3.inOut" }
        );
      }
    }
    if (microCta) {
      const ctaProgress = { bottom: 100, y: -8, opacity: 0 };
      gsap.set(microCta, {
        opacity: 0,
        y: -8,
        clipPath: 'inset(0% 0% 100% 0%)',
        webkitClipPath: 'inset(0% 0% 100% 0%)'
      });
      tl.to(ctaProgress, {
        bottom: 0,
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        onUpdate: () => {
          const b = ctaProgress.bottom.toFixed(2);
          const clip = `inset(0% 0% ${b}% 0%)`;
          microCta.style.clipPath = clip;
          microCta.style.webkitClipPath = clip;
          microCta.style.opacity = ctaProgress.opacity;
          microCta.style.transform = `translateY(${ctaProgress.y}px)`;
        },
        onComplete: () => {
          microCta.style.clipPath = 'none';
          microCta.style.webkitClipPath = 'none';
          microCta.style.opacity = '1';
          microCta.style.transform = '';
        }
      }, 0.95);
    }
  } else {
    if (left) left.style.opacity = '1';
    if (right) {
      right.style.opacity = '1';
      if (curtainRect) {
        curtainRect.setAttribute('y', '0');
        curtainRect.setAttribute('height', '270');
      }
    }
    if (microCta) {
      microCta.style.opacity = '1';
      microCta.style.clipPath = 'none';
      microCta.style.webkitClipPath = 'none';
    }
  }
}

// ==================== REACT BITS PILLNAV MAGNETIC HOVER EFFECT & HERO CTA ====================
document.addEventListener('DOMContentLoaded', () => {
  const heroCta = document.getElementById('hero-micro-cta');
  if (heroCta) {
    heroCta.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollToSection2();
    });
  }

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

  // ==================== FLOATING CHATBOT & AUDITORÍA NUCLEAR CONTROLLER ====================
  const chatTrigger = document.getElementById('chatbot-trigger-btn');
  const chatWindow = document.getElementById('chatbot-window');
  const chatClose = document.getElementById('chatbot-close-btn');
  const chatForm = document.getElementById('chatbot-form');
  const chatInput = document.getElementById('chatbot-input');
  const chatMessages = document.getElementById('chatbot-messages');

  // Estado del flujo de Auditoría Nuclear guiado
  let auditState = {
    active: false,
    step: 0,
    name: '',
    services: [],
    email: '',
    phone: '',
    challenge: ''
  };

  const toggleChat = (forceState) => {
    if (!chatWindow) return;
    const isCurrentlyHidden = chatWindow.classList.contains('hidden');
    const willOpen = forceState !== undefined ? forceState : isCurrentlyHidden;

    if (willOpen) {
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

  const scrollToBottom = () => {
    if (!chatMessages) return;
    requestAnimationFrame(() => {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight + 1000,
        behavior: 'smooth'
      });
    });
    setTimeout(() => {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight + 1000;
    }, 80);
    setTimeout(() => {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight + 1000;
    }, 250);
  };

  const appendMessage = (htmlContent, isUser = false) => {
    if (!chatMessages) return null;
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex gap-2.5 items-start ${isUser ? 'justify-end' : ''} animate-fade-in w-full`;

    if (isUser) {
      msgDiv.innerHTML = `
        <div class="ml-auto bg-vector-lime text-vector-black font-semibold rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[85%] leading-relaxed shadow-sm">
          <p class="font-sans text-xs">${htmlContent}</p>
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="w-full bg-white/10 border border-white/15 rounded-2xl p-3.5 text-white/95 leading-relaxed shadow-sm text-xs font-sans">
          ${htmlContent}
        </div>
      `;
    }
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
    return msgDiv;
  };

  // Iniciar el flujo interactivo de Auditoría Nuclear
  const startNuclearAuditFlow = () => {
    toggleChat(true);
    auditState = {
      active: true,
      step: 1,
      name: '',
      services: [],
      email: '',
      phone: '',
      challenge: ''
    };

    if (chatMessages) {
      chatMessages.innerHTML = '';
    }

    setTimeout(() => {
      appendMessage(`
        <div class="space-y-1.5">
          <p class="font-mono text-[10px] text-vector-lime font-bold uppercase tracking-widest">// AUDITORÍA NUCLEAR 3.0</p>
          <p class="font-bold text-sm text-white">Hola, soy Vector.</p>
          <p class="text-neutral-200 text-xs">1. ¿Cuál es tu nombre?</p>
        </div>
      `);

      if (chatInput) {
        chatInput.placeholder = 'Escribe tu nombre aquí...';
        chatInput.focus();
      }
      scrollToBottom();
    }, 150);
  };
  window.startNuclearAuditFlow = startNuclearAuditFlow;
  window.openNuclearModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    startNuclearAuditFlow();
  };

  // Paso 2: Selección de Servicios de Vector Inside con Tarjetas de Alta Visibilidad
  const proceedToStep2 = () => {
    auditState.step = 2;
    setTimeout(() => {
      const msg = appendMessage(`
        <div class="space-y-2.5">
          <p class="text-neutral-200">Mucho gusto <strong class="text-white">${auditState.name}</strong>, bienvenido a la experiencia <strong class="text-vector-lime">VI</strong>.</p>
          <p class="font-bold text-white text-xs">2. Vector Inside está diseñado para:</p>
          
          <div id="audit-cards-container" class="space-y-1.5 font-mono text-xs">
            
            <div class="audit-card-option flex items-center justify-between p-2.5 rounded-xl border-2 border-white/20 bg-black/75 hover:border-vector-lime cursor-pointer transition-all select-none" data-value="Diseñar o rediseñar tu página web">
              <div class="flex items-center gap-2">
                <span class="text-vector-lime font-bold text-xs">01 //</span>
                <span class="text-white font-medium text-xs">Diseñar o rediseñar tu página web</span>
              </div>
              <span class="chk-box w-5 h-5 rounded-md border-2 border-white/40 flex items-center justify-center text-vector-black font-bold text-xs shrink-0 transition-all"></span>
            </div>

            <div class="audit-card-option flex items-center justify-between p-2.5 rounded-xl border-2 border-white/20 bg-black/75 hover:border-vector-lime cursor-pointer transition-all select-none" data-value="Branding o rebrandeo de marca">
              <div class="flex items-center gap-2">
                <span class="text-vector-lime font-bold text-xs">02 //</span>
                <span class="text-white font-medium text-xs">Branding o rebrandeo de marca</span>
              </div>
              <span class="chk-box w-5 h-5 rounded-md border-2 border-white/40 flex items-center justify-center text-vector-black font-bold text-xs shrink-0 transition-all"></span>
            </div>

            <div class="audit-card-option flex items-center justify-between p-2.5 rounded-xl border-2 border-white/20 bg-black/75 hover:border-vector-lime cursor-pointer transition-all select-none" data-value="Automatización de sistema de ventas">
              <div class="flex items-center gap-2">
                <span class="text-vector-lime font-bold text-xs">03 //</span>
                <span class="text-white font-medium text-xs">Automatización de sistema de ventas</span>
              </div>
              <span class="chk-box w-5 h-5 rounded-md border-2 border-white/40 flex items-center justify-center text-vector-black font-bold text-xs shrink-0 transition-all"></span>
            </div>

            <div class="audit-card-option flex items-center justify-between p-2.5 rounded-xl border-2 border-white/20 bg-black/75 hover:border-vector-lime cursor-pointer transition-all select-none" data-value="Campañas de marketing">
              <div class="flex items-center gap-2">
                <span class="text-vector-lime font-bold text-xs">04 //</span>
                <span class="text-white font-medium text-xs">Campañas de marketing</span>
              </div>
              <span class="chk-box w-5 h-5 rounded-md border-2 border-white/40 flex items-center justify-center text-vector-black font-bold text-xs shrink-0 transition-all"></span>
            </div>

          </div>
          <p class="text-[10px] text-text-muted italic">(selecciona 1 o más opciones)</p>

          <button type="button" id="audit-step2-btn" class="w-full btn-vector-primary py-2.5 text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-[0_0_20px_rgba(195,244,0,0.3)] mt-1">
            <span>CONTINUAR</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      `);

      if (msg) {
        const cards = msg.querySelectorAll('.audit-card-option');
        const selectedValues = new Set();

        cards.forEach(card => {
          card.addEventListener('click', () => {
            const val = card.getAttribute('data-value');
            const chkBox = card.querySelector('.chk-box');
            
            if (selectedValues.has(val)) {
              selectedValues.delete(val);
              card.classList.remove('border-vector-lime', 'bg-vector-lime/15', 'shadow-[0_0_15px_rgba(195,244,0,0.25)]');
              card.classList.add('border-white/20', 'bg-black/75');
              if (chkBox) {
                chkBox.classList.remove('bg-vector-lime', 'border-vector-lime');
                chkBox.classList.add('border-white/40');
                chkBox.textContent = '';
              }
            } else {
              selectedValues.add(val);
              card.classList.remove('border-white/20', 'bg-black/75');
              card.classList.add('border-vector-lime', 'bg-vector-lime/15', 'shadow-[0_0_15px_rgba(195,244,0,0.25)]');
              if (chkBox) {
                chkBox.classList.remove('border-white/40');
                chkBox.classList.add('bg-vector-lime', 'border-vector-lime');
                chkBox.textContent = '✓';
              }
            }
          });
        });

        const btn = msg.querySelector('#audit-step2-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            const selected = Array.from(selectedValues);
            if (selected.length === 0) {
              alert('Por favor selecciona al menos 1 opción para continuar.');
              return;
            }
            btn.disabled = true;
            btn.classList.add('opacity-50');
            auditState.services = selected;
            appendMessage(`Servicios seleccionados: <strong>${selected.join(', ')}</strong>`, true);
            proceedToStep3();
          });
        }
      }
      if (chatInput) {
        chatInput.placeholder = 'Selecciona las opciones arriba o escribe aquí...';
      }
      scrollToBottom();
    }, 250);
  };

  // Paso 3: Captura de Correo y WhatsApp
  const proceedToStep3 = () => {
    auditState.step = 3;
    setTimeout(() => {
      const msg = appendMessage(`
        <div class="space-y-3">
          <p class="font-bold text-vector-lime text-xs uppercase tracking-wider">PERFECTO</p>
          <p class="text-neutral-200">Dime a dónde te podemos contactar:</p>
          
          <div class="space-y-2.5 pt-1 font-mono text-xs">
            <div>
              <label class="block text-[11px] text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-xs text-vector-lime">mail</span>
                <span>Correo electrónico:</span>
              </label>
              <input type="email" id="audit-chat-email" placeholder="tu@empresa.com" class="w-full bg-black/80 border-2 border-white/20 focus:border-vector-lime rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none transition-colors">
            </div>
            <div>
              <label class="block text-[11px] text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-xs text-vector-lime">chat</span>
                <span>WhatsApp / Teléfono:</span>
              </label>
              <input type="tel" id="audit-chat-phone" placeholder="+52 55 1234 5678" class="w-full bg-black/80 border-2 border-white/20 focus:border-vector-lime rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none transition-colors">
            </div>
          </div>

          <button type="button" id="audit-step3-btn" class="w-full btn-vector-primary py-2.5 text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-[0_0_20px_rgba(195,244,0,0.3)]">
            <span>CONFIRMAR DATOS</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      `);

      if (msg) {
        const emailInput = msg.querySelector('#audit-chat-email');
        const phoneInput = msg.querySelector('#audit-chat-phone');
        const btn = msg.querySelector('#audit-step3-btn');

        if (btn) {
          btn.addEventListener('click', () => {
            const em = emailInput ? emailInput.value.trim() : '';
            const ph = phoneInput ? phoneInput.value.trim() : '';
            if (!em || !ph) {
              alert('Por favor ingresa tanto tu correo como tu WhatsApp para poder contactarte.');
              return;
            }
            btn.disabled = true;
            btn.classList.add('opacity-50');
            auditState.email = em;
            auditState.phone = ph;
            appendMessage(`📧 ${em} | 📱 ${ph}`, true);
            proceedToStep4();
          });
        }
        if (emailInput) emailInput.focus();
      }
      scrollToBottom();
    }, 250);
  };

  // Paso 4: Desafío Principal
  const proceedToStep4 = () => {
    auditState.step = 4;
    setTimeout(() => {
      const servicesStr = auditState.services.length > 0 ? auditState.services.join(', ') : 'tus objetivos comerciales';
      appendMessage(`
        <div class="space-y-1.5">
          <p class="text-neutral-300">3. Con base en <strong class="text-vector-lime">${servicesStr}</strong>:</p>
          <p class="font-bold text-white text-xs">¿Cuál es el principal desafío que enfrenta tu empresa / negocio actualmente?</p>
        </div>
      `);
      if (chatInput) {
        chatInput.placeholder = 'Describe brevemente tu principal desafío aquí...';
        chatInput.focus();
      }
      scrollToBottom();
    }, 250);
  };

  // Paso 5: Finalización y Envío de Alertas
  const proceedToStep5 = () => {
    auditState.step = 5;
    auditState.active = false;

    // Generar enlaces directos de respaldo
    const waText = encodeURIComponent(
      `⚡ *SOLICITUD AUDITORÍA NUCLEAR // VECTOR INSIDE*\n\n` +
      `*Nombre:* ${auditState.name}\n` +
      `*Servicios de interés:* ${auditState.services.join(', ')}\n` +
      `*Correo:* ${auditState.email}\n` +
      `*WhatsApp:* ${auditState.phone}\n` +
      `*Desafío actual:* ${auditState.challenge}`
    );
    const waUrl = `https://wa.me/527203323957?text=${waText}`;

    const subject = encodeURIComponent(`Auditoría Nuclear - ${auditState.name}`);
    const bodyText = encodeURIComponent(
      `Solicitud de Auditoría Nuclear recibida desde el Chatbot:\n\n` +
      `• Nombre: ${auditState.name}\n` +
      `• Correo: ${auditState.email}\n` +
      `• WhatsApp: ${auditState.phone}\n` +
      `• Enfoque: ${auditState.services.join(', ')}\n` +
      `• Desafío: ${auditState.challenge}\n`
    );
    const mailtoUrl = `mailto:contactovectorinside@gmail.com?subject=${subject}&body=${bodyText}`;

    // Envío en segundo plano al Micro-Backend de Google Apps Script (Registra en Sheets + Alerta a Gmail + Auto-respuesta)
    const APPS_SCRIPT_WEBHOOK = 'https://script.google.com/macros/s/AKfycbw3vZ2dQYYfXf9QMOTFnGUj2CKl61R_iJEEt_kyvaudXT2WRq3BDLZKTfu2rVDRzGVsBQ/exec';
    try {
      fetch(APPS_SCRIPT_WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          name: auditState.name,
          services: auditState.services,
          email: auditState.email,
          phone: auditState.phone,
          challenge: auditState.challenge
        })
      }).catch(err => console.warn('Google Apps Script dispatch:', err));
    } catch (e) {
      console.warn('Webhook error:', e);
    }

    setTimeout(() => {
      appendMessage(`
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-vector-lime">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            <span class="font-bold text-xs uppercase tracking-wider">SOLICITUD REGISTRADA</span>
          </div>
          <p class="leading-relaxed text-neutral-200">
            Te acabo de enviar un mensaje a <strong>${auditState.phone}</strong> y a tu correo <strong>${auditState.email}</strong>. Sigamos conversando por cualquiera de esas dos vías.
          </p>
          <div class="pt-2 flex flex-col gap-2">
            <a href="${waUrl}" target="_blank" class="btn-vector-primary py-2.5 px-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 text-center rounded-xl shadow-[0_0_20px_rgba(195,244,0,0.3)]">
              <span class="material-symbols-outlined text-sm">chat</span>
              <span>CONTINUAR EN WHATSAPP</span>
            </a>
            <a href="${mailtoUrl}" class="btn-vector-outline py-2 px-3 text-xs font-mono tracking-wider flex items-center justify-center gap-2 text-center rounded-xl text-neutral-300 hover:text-white">
              <span class="material-symbols-outlined text-sm">mail</span>
              <span>NOTIFICAR A contactovectorinside@gmail.com</span>
            </a>
          </div>
        </div>
      `);
      if (chatInput) {
        chatInput.placeholder = 'Escribe tu consulta o pide otra auditoría...';
      }
      scrollToBottom();
    }, 350);
  };

  // Manejo de respuestas generales fuera del flujo
  const handleBotResponse = (query) => {
    setTimeout(() => {
      let answer = "Excelente pregunta. En Vector Inside 3.0 rediseñamos la arquitectura de conversión para eliminar la fricción estructural y escalar tus resultados comerciales de forma predecible.";
      const q = query.toLowerCase();
      if (q.includes('diagnóstico') || q.includes('diagnostico') || q.includes('auditoría') || q.includes('auditoria') || q.includes('nuclear')) {
        startNuclearAuditFlow();
        return;
      } else if (q.includes('arquitectura') || q.includes('conversión') || q.includes('conversion')) {
        answer = "Nuestra <strong>Arquitectura de Conversión</strong> sustituye los parches aislados por una matriz modular de 40 bloques estratégicos de tracción predecible.";
      } else if (q.includes('agendar') || q.includes('sesión') || q.includes('sesion') || q.includes('contacto') || q.includes('cita') || q.includes('correo') || q.includes('email') || q.includes('mail')) {
        startNuclearAuditFlow();
        return;
      }
      appendMessage(answer, false);
    }, 500);
  };

  if (chatTrigger) {
    chatTrigger.addEventListener('click', () => {
      const isCurrentlyHidden = chatWindow.classList.contains('hidden');
      if (isCurrentlyHidden || !auditState.active) {
        startNuclearAuditFlow();
      } else {
        toggleChat(false);
      }
    });
  }
  if (chatClose) chatClose.addEventListener('click', () => toggleChat(false));

  // ==================== AISLAMIENTO DE SCROLL INTERNO ====================
  // Cuando el cursor esté dentro del chatbot, solo scrollea los mensajes sin mover la web de fondo
  if (chatWindow && chatMessages) {
    // Detener la propagación de eventos de rueda y táctiles hacia el fondo
    chatWindow.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });

    chatMessages.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });

    // En móviles / trackpads táctiles
    chatWindow.addEventListener('touchmove', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      // Si estamos en un paso activo del flujo guiado
      if (auditState.active) {
        if (auditState.step === 1) {
          auditState.name = text;
          appendMessage(text, true);
          chatInput.value = '';
          proceedToStep2();
          return;
        } else if (auditState.step === 4) {
          auditState.challenge = text;
          appendMessage(text, true);
          chatInput.value = '';
          proceedToStep5();
          return;
        }
      }

      appendMessage(text, true);
      chatInput.value = '';
      handleBotResponse(text);
    });
  }

  document.querySelectorAll('.chatbot-quick-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-msg') || btn.textContent.trim();
      if (query.includes('Diagnóstico') || query.includes('Agendar') || query.includes('sesión')) {
        startNuclearAuditFlow();
      } else {
        appendMessage(query, true);
        handleBotResponse(query);
      }
    });
  });
});

// ==================== LOGO CLICK: SCROLL TO HERO (NO INTRO VIDEO) ====================
/**
 * Al hacer clic en el logo del header, siempre ir al Hero sin reproducir el video intro.
 * - Si estamos en index.html: previene recarga, registra cooldown en localStorage para
 *   saltarse el intro, y hace smooth scroll al top.
 * - Si estamos en otra página: navega a index.html con el flag de skip en localStorage.
 */
function handleLogoClick(event) {
  if (event && typeof event.preventDefault === 'function') event.preventDefault();

  // 1. Registrar cooldown del intro para omitirlo siempre al volver al Hero
  try {
    localStorage.setItem('vectorinside_intro_last_played', String(Date.now()));
    sessionStorage.setItem('vectorinside_scroll_pos', '0');
    sessionStorage.setItem('vectorinside_inner_scroll_pos', '0');
  } catch (e) {}

  // 2. Si no estamos en index.html: navegar a index con cooldown registrado
  const isOnIndex = window.location.pathname.endsWith('index.html') ||
                    window.location.pathname.endsWith('/') ||
                    window.location.pathname === '';
  if (!isOnIndex) {
    window.location.href = 'index.html';
    return;
  }

  const jumpId = (window.__activeNavJumpId = (window.__activeNavJumpId || 0) + 1);

  // 3. Ocultar intro inmediatamente si existiera
  const introScreen = document.getElementById('intro-screen');
  if (introScreen) {
    introScreen.style.display = 'none';
    introScreen.style.opacity = '0';
    introScreen.style.pointerEvents = 'none';
  }

  // 4. Resetear capas inferiores (Portales, Curtains, Scroll Containers)
  window._isDiagnosticoActive = false;
  window.__forceTimelineProgress = 0;
  window.__forceTimelineUntil = performance.now() + 1200;
  setTimeout(() => {
    if (window.__activeNavJumpId === jumpId) window.__forceTimelineProgress = null;
  }, 1400);

  const container = document.getElementById('sec-ejecucion-scroll-container');
  if (container) container.scrollTop = 0;

  const secPortal = document.getElementById('seccion-portal-revelada');
  if (secPortal) {
    secPortal.scrollTop = 0;
    secPortal.style.opacity = '0';
    secPortal.style.filter = 'blur(20px)';
    secPortal.style.clipPath = 'inset(50% 50% 50% 50%)';
    secPortal.style.pointerEvents = 'none';
  }

  const expandWrapper = document.getElementById('sec-scroll-expand-wrapper');
  if (expandWrapper) {
    expandWrapper.style.opacity = '0';
    expandWrapper.style.filter = 'blur(20px)';
    expandWrapper.style.pointerEvents = 'none';
  }

  const expandBody = document.getElementById('scroll-expand-body');
  if (expandBody) {
    expandBody.style.opacity = '0';
    expandBody.style.visibility = 'hidden';
    expandBody.style.pointerEvents = 'none';
  }
  if (typeof isSec3BodyRevealed !== 'undefined') isSec3BodyRevealed = false;

  const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');
  if (metodologiaWrapper) {
    metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
    metodologiaWrapper.style.pointerEvents = 'none';
  }

  const diagSec = document.getElementById('sec-06-diagnostico');
  if (diagSec) {
    diagSec.style.opacity = '0';
    diagSec.style.pointerEvents = 'none';
  }

  const globalHeader = document.getElementById('main-global-header');
  if (globalHeader) {
    globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-dark', 'glass-nav-transparent-section05');
    globalHeader.classList.add('glass-nav-hero-transparent');
  }

  if (typeof updateActiveDockItem === 'function') updateActiveDockItem(null);

  // 5. Garantizar textos y elementos del Hero visibles
  ensureHeroUiVisible(true);

  // 6. Posicionar la ventana en 0 y fijar por frames
  window.scrollTo(0, 0);

  const apply = () => {
    if (window.__activeNavJumpId !== jumpId) return;
    window.scrollTo(0, 0);
    ensureHeroUiVisible(true);
  };

  const deadline = performance.now() + 1200;
  const pin = () => {
    if (window.__activeNavJumpId !== jumpId) return;
    apply();
    if (performance.now() < deadline) requestAnimationFrame(pin);
  };
  requestAnimationFrame(pin);
  [0, 50, 100, 200, 350, 600, 900, 1200].forEach((t) => setTimeout(apply, t));
}
window.handleLogoClick = handleLogoClick;

// ==================== CINEMATIC SMOOTH SCROLL TO SECTION 2 (MANIFIESTO) ====================
function scrollToSection2() {
  const track = document.getElementById('hero-scroll-track');
  if (!track) return;
  const trackRect = track.getBoundingClientRect();
  const trackTop = window.scrollY + trackRect.top;
  const maxScroll = track.offsetHeight - window.innerHeight;
  const targetY = trackTop + maxScroll * 0.17; // T_REVEAL_END = 0.16 → sección 100% abierta, inicio del video scrub

  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = 2600; // 2.6s smooth cinematic glide
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
  // Posición al 62%: T_PHONE_ZOOM_END — Smartphone 3D completamente centrado y frontal
  // con el kinetic text "Vector Inside /" visible de fondo (imagen de referencia)
  const targetY = trackTop + maxScroll * 0.62;

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

// ==================== CINEMATIC JUMP TO 03 // EVIDENCIA (PORTADA / EXPAND COVER) ====================
function scrollToSectionEjecucion(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  window.__activeNavJumpId = (window.__activeNavJumpId || 0) + 1;
  const jumpId = window.__activeNavJumpId;
  const mainTrack = document.getElementById('hero-scroll-track');
  const container = document.getElementById('sec-ejecucion-scroll-container');
  const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');
  const stage = document.getElementById('sec-metodologia-stage');
  const diagSec = document.getElementById('sec-06-diagnostico');
  const diagDot = document.getElementById('diag-reveal-dot');
  const diagLine = document.getElementById('diag-reveal-line');
  const cierreSec = document.getElementById('sec-07-cierre-footer');
  const globalHeader = document.getElementById('main-global-header');
  const sec3Wrapper = document.getElementById('sec-matriz-25-wrapper');
  const expandWrapper = document.getElementById('sec-scroll-expand-wrapper');
  const expandFrame = document.getElementById('scroll-expand-frame');
  const expandVideo = document.getElementById('scroll-expand-video');
  const expandBody = document.getElementById('scroll-expand-body');

  window._isDiagnosticoActive = false;
  window.__forceTimelineProgress = 0.96;
  window.__forceTimelineUntil = performance.now() + 1400;
  setTimeout(() => {
    if (window.__activeNavJumpId === jumpId) {
      window.__forceTimelineProgress = null;
    }
  }, 1600);

  const resetToEvidenciaCover = () => {
    // 1. Reset inner scroll of execution container to top (Stage 1 cover)
    if (container) {
      container.scrollTop = 0;
    }
    try {
      sessionStorage.setItem('vectorinside_inner_scroll_pos', '0');
    } catch (err) {}

    // 2. Hide Section 04 Metodología curtain completely
    if (metodologiaWrapper) {
      metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
      metodologiaWrapper.style.pointerEvents = 'none';
    }
    if (stage) {
      stage.style.opacity = '0';
      stage.style.pointerEvents = 'none';
    }

    // 3. Hide Diagnóstico & Cierre
    if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
    if (diagDot) diagDot.style.opacity = '0';
    if (diagLine) diagLine.style.opacity = '0';
    if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }

    // 4. Section 03 Matrix wrapper
    if (sec3Wrapper) {
      sec3Wrapper.style.opacity = '1';
      sec3Wrapper.style.transform = 'none';
      sec3Wrapper.style.pointerEvents = 'auto';
    }

    // 5. Expand portal full screen & reveal cover
    if (expandWrapper) {
      expandWrapper.style.opacity = '1';
      expandWrapper.style.filter = 'none';
      expandWrapper.style.pointerEvents = 'auto';
    }
    if (expandFrame) {
      expandFrame.style.width = '100vw';
      expandFrame.style.height = '100vh';
      expandFrame.style.borderRadius = '0px';
    }
    if (expandVideo) {
      expandVideo.style.transform = 'scale(1)';
      if (expandVideo.paused) {
        expandVideo.play().catch(() => {});
      }
    }
    if (expandBody) {
      expandBody.style.clipPath = 'inset(0% 0% 0% 0%)';
      expandBody.style.webkitClipPath = 'inset(0% 0% 0% 0%)';
      expandBody.style.opacity = '1';
      expandBody.style.visibility = 'visible';
      expandBody.style.pointerEvents = 'auto';
      expandBody.style.transform = 'translateY(0)';
      isSec3BodyRevealed = true;
    }

    // 6. Set header to dark cyberpunk glass
    if (globalHeader) {
      globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-transparent-section05', 'glass-nav-hero-transparent');
      globalHeader.classList.add('glass-nav-dark');
    }

    // 7. Update dock active item (03 // EVIDENCIA)
    if (typeof updateActiveDockItem === 'function') {
      updateActiveDockItem(2);
    }
  };

  if (!mainTrack) {
    resetToEvidenciaCover();
    return false;
  }

  const maxScroll = mainTrack.offsetHeight - window.innerHeight;
  const targetY = Math.round(maxScroll * 0.96);

  window.scrollTo(0, targetY);

  const apply = () => {
    if (window.__activeNavJumpId !== jumpId) return;
    window.scrollTo(0, targetY);
    resetToEvidenciaCover();
  };

  const deadline = performance.now() + 1500;
  const pin = () => {
    if (window.__activeNavJumpId !== jumpId) return;
    apply();
    if (performance.now() < deadline) requestAnimationFrame(pin);
  };
  requestAnimationFrame(pin);
  [0, 50, 100, 200, 350, 600, 1000, 1400].forEach((t) => setTimeout(apply, t));
  return false;
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
    grainIntensity: 0.05
  });
}
window.initSec3Topography = initSec3Topography;

// ==================== MATRIZ MODAL (25 BLOQUES) LOGIC CON FOTOS Y DEGRADADO ARMÓNICO ====================
const matrizData = [
  // ==================== 01 SYBORX ====================
  {
    id: 1,
    code: 'BLK-01',
    category: 'operativo',
    file: 'SyborX Logo White.svg',
    title: 'SyborX',
    desc: 'Desarrollo de software a medida, ciberseguridad e integración de automatización inteligente.',
    link: 'www.syborx.com',
    kpi1: '14.2% Capital',
    kpi2: 'Anomalías: <0.4%',
    kpi3: 'Adopción: 96h',
    color: '#a3e635',
    tint: 'rgba(163, 230, 53, 0.45)'
  },

  // ==================== 02 VALOR MÁXIMO ====================
  {
    id: 2,
    code: 'BLK-02',
    category: 'operativo',
    file: 'imagotipo valor Green.png',
    title: 'Valor Máximo',
    desc: 'Plataforma de match inmobiliario y conexión estratégica de espacios comerciales con empresarios y emprendedores.',
    link: 'www.valor-maximo.com',
    kpi1: '24.1% Margen',
    kpi2: 'Error Residual: 0.4%',
    kpi3: 'Estabiliz: 28d',
    color: '#10b981',
    tint: 'rgba(16, 185, 129, 0.45)'
  },

  // ==================== 03 SIMBIOTIK ====================
  {
    id: 3,
    code: 'BLK-03',
    category: 'cognitivo',
    file: 'SmbtK1.svg',
    title: 'SimbiotiK',
    desc: 'Banda de rock alternativo conceptual con experiencia interactiva 3D y WebGL inmersivo.',
    link: 'www.simbiotikrockband.com',
    color: '#06b6d4',
    tint: 'rgba(6, 182, 212, 0.45)'
  },

  // ==================== 04 LEALTIX ====================
  {
    id: 4,
    code: 'BLK-04',
    category: 'operativo',
    file: 'Imagotipo2.ai.png',
    title: 'Lealtix',
    desc: 'Plataforma de lealtad digital y retención de clientes para la industria HORECA mediante pases en Apple & Google Wallet sin necesidad de apps.',
    link: 'www.lealtix.com.mx',
    kpi1: '+38.5% Recurrencia',
    kpi2: 'Retención: +28.4%',
    kpi3: 'Adopción: 72h',
    color: '#006a61',
    tint: 'rgba(0, 106, 97, 0.45)'
  },

  // ==================== 05 INTEGRITUS ====================
  {
    id: 5,
    code: 'BLK-05',
    category: 'cognitivo',
    file: 'IntegritUS imagotipo COLOR.png',
    title: 'IntegritUS',
    desc: 'Plataforma inteligente de cumplimiento normativo y blindaje fiscal que detecta alertas SAT, monitorea actividades vulnerables PLD y dictamina actas con IA.',
    link: 'www.integritusmx.com',
    color: '#0ea5e9',
    tint: 'rgba(14, 165, 233, 0.45)'
  },

  // ==================== OCULTAS TEMPORALMENTE ====================
  // {
  //   id: 6, code: 'BLK-06', category: 'operativo',
  //   file: 'Vector Inside Isologo.png', title: 'Vector Inside',
  //   desc: 'Firma de arquitectura de crecimiento, diseño cinemático y aceleración digital para marcas de alto impacto.',
  //   kpi1: '72h → 14.5h', kpi2: 'Desv: 0.8%', kpi3: 'Estabiliz: 28d',
  //   color: '#c3f400', tint: 'rgba(195, 244, 0, 0.45)'
  // },
  // {
  //   id: 7, code: 'BLK-07', category: 'operativo',
  //   file: 'Logo aida.png', title: 'AIDA',
  //   desc: 'Framework estratégico de adquisición y conversión comercial estructurado en 4 etapas: Atención, Interés, Deseo y Acción.',
  //   kpi1: '96h → 18.5h', kpi2: 'Desv: 0.7%', kpi3: 'Estabiliz: 35d',
  //   color: '#34d399', tint: 'rgba(52, 211, 153, 0.45)'
  // },
  // {
  //   id: 8, code: 'BLK-08', category: 'expansivo',
  //   file: 'LOGO 4GUARD.jpeg', title: '4Guard',
  //   desc: 'Firma de seguridad privada integral, blindaje perimetral y custodia de activos corporativos.',
  //   color: '#8b5cf6', tint: 'rgba(139, 92, 246, 0.45)'
  // },
  // {
  //   id: 9, code: 'BLK-09', category: 'expansivo',
  //   file: 'karloz vazquez logo.svg', title: 'Karloz Vázquez',
  //   desc: 'Estudio de dirección de arte brutalista, diseño conceptual y consultoría de identidad visual.',
  //   color: '#9d4edd', tint: 'rgba(157, 78, 221, 0.45)'
  // },
  // {
  //   id: 10, code: 'BLK-10', category: 'expansivo',
  //   file: 'Brevemente02.png', title: 'BreveMente',
  //   desc: 'Software de documentación clínica y asistente inteligente (Brifi) para Terapia Breve Estratégica.',
  //   color: '#a855f7', tint: 'rgba(168, 85, 247, 0.45)'
  // },
];
const matriz25Data = matrizData;
// ==================== 04 EVIDENCIA // 3D DEPTH CAROUSEL ====================
// DepthCarousel is loaded from DepthCarousel.js and initialized in initFloatingGallery() below.

// Bottom dock active-item helper (global — shared by the top-level scroll handlers below).
// Previously this only existed nested inside initHero3DModel, so scrollToGaleriaFlotante,
// scrollToMetodologia and initExecutionInternalScrollListener threw a ReferenceError when
// they called it — which aborted initFloatingGallery() before it could run initRubikCube().
function updateActiveDockItem(index) {
  const bottomDock = document.getElementById('bottom-dock-nav');
  const dockLinks = bottomDock ? bottomDock.querySelectorAll('a') : [];
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
window._updateActiveDockItem = updateActiveDockItem;

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

  const sec3Wrapper = document.getElementById('sec-matriz-25-wrapper');
  if (sec3Wrapper) {
    sec3Wrapper.style.opacity = '1';
    sec3Wrapper.style.transform = 'none';
    sec3Wrapper.style.pointerEvents = 'auto';
  }

  const doInternalScroll = () => {
    if (container && matrixTrack) {
      const targetTop = matrixTrack.offsetTop;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
      updateActiveDockItem(2); // 03 // Ejecución y Evidencia
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

// ==================== JUMP TO 05 // METODOLOGÍA ====================
// The 05 curtain is a sticky element inside the internal scroll of
// #sec-ejecucion-scroll-container. Two things broke the dock button:
//  1) a smooth window scroll lost the race with the master render loop, which
//     zeroes that container while the timeline eases -> landed on 03.
//  2) scrolling the container to scrollHeight overscrolls past the sticky zone,
//     detaching the curtain -> banner shows, everything below is black.
// Fix: jump the window instantly, freeze the timeline, force the 03 portal to its
// final full-screen size, and pin the internal scroll INSIDE the sticky range.
function scrollToMetodologia(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  window.__activeNavJumpId = (window.__activeNavJumpId || 0) + 1;
  const jumpId = window.__activeNavJumpId;
  const mainTrack = document.getElementById('hero-scroll-track');
  const container = document.getElementById('sec-ejecucion-scroll-container');
  const matrixTrack = document.getElementById('sec-matriz-25-track');
  const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');
  const globalHeader = document.getElementById('main-global-header');
  const expandWrapper = document.getElementById('sec-scroll-expand-wrapper');
  const expandFrame = document.getElementById('scroll-expand-frame');
  const expandVideo = document.getElementById('scroll-expand-video');

  const forceFullScreenFrame = () => {
    if (expandWrapper) {
      expandWrapper.style.opacity = '1';
      expandWrapper.style.filter = 'none';
      expandWrapper.style.pointerEvents = 'auto';
    }
    if (expandFrame) {
      expandFrame.style.width = '100vw';
      expandFrame.style.height = '100vh';
      expandFrame.style.borderRadius = '0px';
    }
    if (expandVideo) {
      expandVideo.style.transform = 'scale(1)';
      expandVideo.currentTime = (expandVideo.duration && !isNaN(expandVideo.duration)) ? expandVideo.duration : 10.0;
    }
    const expandBody = document.getElementById('scroll-expand-body');
    if (expandBody) {
      expandBody.style.clipPath = 'inset(0% 0% 0% 0%)';
      expandBody.style.webkitClipPath = 'inset(0% 0% 0% 0%)';
      expandBody.style.opacity = '1';
      expandBody.style.visibility = 'visible';
      expandBody.style.pointerEvents = 'auto';
      expandBody.style.transform = 'translateY(0)';
      isSec3BodyRevealed = true;
    }
  };

  const revealCurtain = () => {
    window._isDiagnosticoActive = false;
    if (metodologiaWrapper) {
      metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
      metodologiaWrapper.style.backgroundColor = '#ffffff';
      metodologiaWrapper.style.pointerEvents = 'auto';
    }
    const stage = document.getElementById('sec-metodologia-stage');
    if (stage) {
      stage.style.opacity = '1';
      stage.style.transform = 'none';
      stage.style.pointerEvents = 'auto';
    }
    const videoBg = document.getElementById('ejecucion-liquid-flow-video');
    if (videoBg && videoBg.parentElement) videoBg.parentElement.style.opacity = '1';
    const diagSec = document.getElementById('sec-06-diagnostico');
    if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
    const diagDot = document.getElementById('diag-reveal-dot');
    if (diagDot) diagDot.style.opacity = '0';
    const diagLine = document.getElementById('diag-reveal-line');
    if (diagLine) diagLine.style.opacity = '0';
    if (globalHeader) {
      globalHeader.classList.add('glass-nav-white-liquid');
      globalHeader.classList.remove('glass-nav-dark', 'glass-nav-transparent', 'glass-nav-transparent-section05');
    }
    updateActiveDockItem(3); // 04 // Metodología
  };

  if (!container) { revealCurtain(); return false; }

  const internalTarget = () => {
    // La curtain de Metodología es sticky top-0 z-20 dentro de sec-ejecucion-scroll-container.
    // Para verla limpiamente desde arriba, el scrollTop del container debe ser igual
    // al offsetTop del sec-metodologia-wrapper relativo al container de ejecución.
    const metodWrapper = document.getElementById('sec-metodologia-wrapper');
    if (metodWrapper && container) {
      // Calcula el offsetTop relativo al container de ejecución
      let el = metodWrapper;
      let offsetTop = 0;
      while (el && el !== container) {
        offsetTop += el.offsetTop;
        el = el.offsetParent;
      }
      if (offsetTop > 0) return offsetTop;
    }
    // Fallback: el track tiene ~520vh; metodología empieza después de la galería (1 pantalla)
    if (!matrixTrack) return window.innerHeight * 2;
    return Math.max(0, matrixTrack.offsetTop + window.innerHeight);
  };

  if (mainTrack) {
    const maxScroll = mainTrack.offsetHeight - window.innerHeight;
    const targetY = Math.round(maxScroll * 0.995);

    window.__forceTimelineProgress = 0.995;
    window.__forceTimelineUntil = performance.now() + 1400;
    setTimeout(() => {
      if (window.__activeNavJumpId === jumpId) window.__forceTimelineProgress = null;
    }, 1600);

    window.scrollTo(0, targetY); // instant — smooth loses the race here

    const apply = () => {
      if (window.__activeNavJumpId !== jumpId) return;
      window.scrollTo(0, targetY);
      forceFullScreenFrame();
      container.scrollTop = internalTarget();
      revealCurtain();
    };
    const deadline = performance.now() + 1500;
    const pin = () => {
      if (window.__activeNavJumpId !== jumpId) return;
      apply();
      if (performance.now() < deadline) requestAnimationFrame(pin);
    };
    requestAnimationFrame(pin);
    [0, 60, 150, 300, 550, 900, 1400].forEach((t) => setTimeout(() => {
      if (window.__activeNavJumpId === jumpId) apply();
    }, t));
  } else {
    forceFullScreenFrame();
    container.scrollTop = internalTarget();
    revealCurtain();
  }
  return false;
}
window.scrollToMetodologia = scrollToMetodologia;
window.triggerLaserMetodologiaTransition = scrollToMetodologia;

// Synchronize Bottom Dock & Sticky Curtain Reveal (Gallery -> 05 Metodología)
// Synchronize Bottom Dock & Sticky Curtain Reveal (Gallery -> 05 Metodología) + Isotipo 3D Zoom
function initExecutionInternalScrollListener() {
  if (window.__sec04ScrollListenerInit) return;
  window.__sec04ScrollListenerInit = true;

  const container = document.getElementById('sec-ejecucion-scroll-container');
  const track = document.getElementById('sec-matriz-25-track');
  const sec3Wrapper = document.getElementById('sec-matriz-25-wrapper');
  const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');
  const stage = document.getElementById('sec-metodologia-stage');
  const videoBg = document.getElementById('ejecucion-liquid-flow-video');
  if (videoBg) {
    videoBg.play().catch(() => {});
  }
  const videoWrapper = videoBg ? videoBg.parentElement : null;
  const diagSec = document.getElementById('sec-06-diagnostico');
  const diagDot = document.getElementById('diag-reveal-dot');
  const diagLine = document.getElementById('diag-reveal-line');
  const diagStage = document.getElementById('diag-content-stage');
  const cierreSec = document.getElementById('sec-07-cierre-footer');
  const globalHeader = document.getElementById('main-global-header');

  if (container && track && metodologiaWrapper) {
    try {
      const savedInner = sessionStorage.getItem('vectorinside_inner_scroll_pos');
      if (savedInner !== null) {
        const y = parseFloat(savedInner);
        if (!isNaN(y) && y > 0) {
          container.scrollTop = y;
        }
      }
    } catch (e) {}

    let _saveScrollTimeout = null;
    const saveInnerScroll = (pos) => {
      clearTimeout(_saveScrollTimeout);
      _saveScrollTimeout = setTimeout(() => {
        try {
          sessionStorage.setItem('vectorinside_inner_scroll_pos', String(pos));
        } catch (e) {}
      }, 250);
    };

    const updateCurtain = () => {
      const scrollY = container.scrollTop;
      saveInnerScroll(scrollY);
      const trackTop = track.offsetTop;
      const scrollableDistance = track.offsetHeight - container.clientHeight;

      if (scrollY < trackTop - 100) {
        // En Sección 03 Cover (el índice inferior se mantiene desvanecido durante toda la Sección 03)
        window._isDiagnosticoActive = false;
        if (sec3Wrapper) {
          sec3Wrapper.style.opacity = '1';
          sec3Wrapper.style.transform = 'none';
          sec3Wrapper.style.pointerEvents = 'auto';
        }
        metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
        metodologiaWrapper.style.pointerEvents = 'none';
        window.__vectorIsotipoVisible = false;
        window.__vectorIsotipoProgress = 0;
        if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
        if (diagDot) diagDot.style.opacity = '0';
        if (diagLine) diagLine.style.opacity = '0';
        if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
        if (globalHeader) {
          globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-transparent-section05');
          globalHeader.classList.add('glass-nav-dark');
        }
        updateActiveDockItem(null);
      } else if (scrollableDistance > 0 && scrollY >= trackTop - 100 && scrollY < trackTop) {
        // Transición a Sección 03 // Evidencia (Galería)
        window._isDiagnosticoActive = false;
        if (sec3Wrapper) {
          sec3Wrapper.style.opacity = '1';
          sec3Wrapper.style.transform = 'none';
          sec3Wrapper.style.pointerEvents = 'auto';
        }
        metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
        metodologiaWrapper.style.pointerEvents = 'none';
        window.__vectorIsotipoVisible = false;
        window.__vectorIsotipoProgress = 0;
        if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
        if (diagDot) diagDot.style.opacity = '0';
        if (diagLine) diagLine.style.opacity = '0';
        if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
        if (globalHeader) {
          globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-transparent-section05');
          globalHeader.classList.add('glass-nav-dark');
        }
        updateActiveDockItem(2); // 03 // Evidencia (Galería)
      } else if (scrollableDistance > 0 && scrollY >= trackTop) {
        const pTrack = Math.min(1.0, Math.max(0, (scrollY - trackTop) / scrollableDistance));

        if (pTrack < 0.03) {
          // Fase 1: Sección 03 // Evidencia (Galería visible al 100%)
          window._isDiagnosticoActive = false;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '1';
            sec3Wrapper.style.transform = 'none';
            sec3Wrapper.style.pointerEvents = 'auto';
          }
          metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
          metodologiaWrapper.style.pointerEvents = 'none';
          if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
          if (diagDot) diagDot.style.opacity = '0';
          if (diagLine) diagLine.style.opacity = '0';
          if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-transparent-section05');
            globalHeader.classList.add('glass-nav-dark');
          }
          updateActiveDockItem(2); // 03 // Evidencia
        } else if (pTrack < 0.12) {
          // Fase 2: Cortina Blanca Sección 04 Metodología entra deslizándose
          // Y todo el contenido y fichas de Sección 03 se desvanecen fluidamente hacia arriba
          window._isDiagnosticoActive = false;
          const pCurtain = (pTrack - 0.03) / (0.12 - 0.03);
          const yPct = (1.0 - pCurtain) * 100;
          metodologiaWrapper.style.transform = `translate3d(0, ${yPct.toFixed(2)}%, 0)`;
          metodologiaWrapper.style.pointerEvents = pCurtain > 0.6 ? 'auto' : 'none';
          metodologiaWrapper.style.backgroundColor = '#ffffff';

          // Desvanecimiento suave y desplazamiento cinemático de Sección 03
          const sec3Fade = Math.max(0, 1.0 - pCurtain);
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = sec3Fade.toFixed(3);
            sec3Wrapper.style.transform = `scale(${(0.96 + 0.04 * sec3Fade).toFixed(4)}) translateY(${(-25 * (1.0 - sec3Fade)).toFixed(1)}px)`;
            sec3Wrapper.style.pointerEvents = sec3Fade > 0.4 ? 'auto' : 'none';
          }

          if (stage) {
            stage.style.opacity = '1';
            stage.style.transform = 'none';
            stage.style.pointerEvents = 'auto';
          }
          if (videoWrapper) videoWrapper.style.opacity = '1';
          if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
          if (diagDot) diagDot.style.opacity = '0';
          if (diagLine) diagLine.style.opacity = '0';
          if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-transparent-section05');
            if (pCurtain > 0.5) {
              globalHeader.classList.add('glass-nav-white-liquid');
              globalHeader.classList.remove('glass-nav-dark');
            } else {
              globalHeader.classList.remove('glass-nav-white-liquid');
              globalHeader.classList.add('glass-nav-dark');
            }
          }
          updateActiveDockItem(pCurtain > 0.4 ? 3 : 2);
        } else if (pTrack < 0.36) {
          // Fase 3: Sección 04 Metodología Activa, Blanca, Nítida y Confortable
          window._isDiagnosticoActive = false;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '0';
            sec3Wrapper.style.pointerEvents = 'none';
          }
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          metodologiaWrapper.style.backgroundColor = '#ffffff';
          if (stage) {
            stage.style.opacity = '1';
            stage.style.transform = 'none';
            stage.style.pointerEvents = 'auto';
          }
          if (videoWrapper) videoWrapper.style.opacity = '1';
          if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
          if (diagDot) diagDot.style.opacity = '0';
          if (diagLine) diagLine.style.opacity = '0';
          if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-transparent-section05', 'glass-nav-dark');
            globalHeader.classList.add('glass-nav-white-liquid');
          }
          updateActiveDockItem(3); // 04 // Metodología
        } else if (pTrack < 0.44) {
          // Fase 4: Desvanecimiento suave de Metodología hacia Negro (sin cortes bruscos)
          window._isDiagnosticoActive = false;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '0';
            sec3Wrapper.style.pointerEvents = 'none';
          }
          const pFade = (pTrack - 0.36) / (0.44 - 0.36);
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          const bgVal = Math.round(255 - pFade * (255 - 8));
          metodologiaWrapper.style.backgroundColor = `rgb(${bgVal}, ${bgVal}, ${bgVal})`;
          if (stage) {
            stage.style.opacity = (1.0 - pFade).toFixed(3);
            stage.style.transform = `translateY(${(-20 * pFade).toFixed(1)}px)`;
            stage.style.pointerEvents = pFade > 0.5 ? 'none' : 'auto';
          }
          if (videoWrapper) videoWrapper.style.opacity = (1.0 - pFade).toFixed(3);
          if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
          if (diagDot) diagDot.style.opacity = '0';
          if (diagLine) diagLine.style.opacity = '0';
          if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
          if (globalHeader) {
            if (pFade > 0.5) {
              globalHeader.classList.remove('glass-nav-white-liquid');
              globalHeader.classList.add('glass-nav-transparent-section05');
            } else {
              globalHeader.classList.add('glass-nav-white-liquid');
              globalHeader.classList.remove('glass-nav-transparent-section05');
            }
          }
          updateActiveDockItem(pFade > 0.6 ? 4 : 3);
        } else if (pTrack < 0.54) {
          // ==================== CINEMATIC LASER: 1. EL PUNTO ====================
          window._isDiagnosticoActive = true;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '0';
            sec3Wrapper.style.pointerEvents = 'none';
          }
          const pDot = (pTrack - 0.44) / (0.54 - 0.44);
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          metodologiaWrapper.style.backgroundColor = '#080808';
          if (stage) {
            stage.style.opacity = '0';
            stage.style.pointerEvents = 'none';
          }
          if (videoWrapper) videoWrapper.style.opacity = '0';
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-dark');
            globalHeader.classList.add('glass-nav-transparent-section05');
          }
          if (diagSec) {
            diagSec.style.opacity = '1';
            diagSec.style.clipPath = 'inset(50% 0 50% 0)';
            diagSec.style.transform = 'none';
            diagSec.style.pointerEvents = 'none';
          }
          if (diagDot) {
            diagDot.style.opacity = Math.min(1.0, pDot * 1.6).toFixed(3);
            diagDot.style.transform = `scale(${(0.4 + 1.6 * pDot).toFixed(2)})`;
          }
          if (diagLine) {
            diagLine.style.opacity = '0';
            diagLine.style.transform = 'scaleX(0)';
          }
          if (diagStage) {
            diagStage.style.opacity = '0';
            diagStage.style.transform = 'scale(0.96)';
          }
          if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
          updateActiveDockItem(4); // 05 // Diagnóstico
        } else if (pTrack < 0.66) {
          // ==================== CINEMATIC LASER: 2. LA LÍNEA HORIZONTAL ====================
          window._isDiagnosticoActive = true;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '0';
            sec3Wrapper.style.pointerEvents = 'none';
          }
          const pLine = (pTrack - 0.54) / (0.66 - 0.54);
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          metodologiaWrapper.style.backgroundColor = '#080808';
          if (stage) {
            stage.style.opacity = '0';
            stage.style.pointerEvents = 'none';
          }
          if (videoWrapper) videoWrapper.style.opacity = '0';
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-dark');
            globalHeader.classList.add('glass-nav-transparent-section05');
          }
          if (diagSec) {
            diagSec.style.opacity = '1';
            diagSec.style.clipPath = 'inset(50% 0 50% 0)';
            diagSec.style.transform = 'none';
            diagSec.style.pointerEvents = 'none';
          }
          if (diagDot) {
            diagDot.style.opacity = Math.max(0, 1.0 - pLine * 2.0).toFixed(3);
            diagDot.style.transform = `scale(${Math.max(0, 2.0 - pLine).toFixed(2)})`;
          }
          if (diagLine) {
            diagLine.style.opacity = '1';
            diagLine.style.transform = `scaleX(${pLine.toFixed(3)})`;
          }
          if (diagStage) {
            diagStage.style.opacity = (pLine * 0.25).toFixed(3);
            diagStage.style.transform = `scale(${(0.96 + 0.02 * pLine).toFixed(3)})`;
          }
          if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
          updateActiveDockItem(4);
        } else if (pTrack < 0.76) {
          // ==================== CINEMATIC LASER: 3. EL PLANO VERTICAL ====================
          window._isDiagnosticoActive = true;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '0';
            sec3Wrapper.style.pointerEvents = 'none';
          }
          const pPlane = Math.min(1.0, (pTrack - 0.66) / (0.76 - 0.66));
          const insetY = Math.max(0, (1.0 - pPlane) * 50).toFixed(1);
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          metodologiaWrapper.style.backgroundColor = '#080808';
          if (stage) {
            stage.style.opacity = '0';
            stage.style.pointerEvents = 'none';
          }
          if (videoWrapper) videoWrapper.style.opacity = '0';
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-dark');
            globalHeader.classList.add('glass-nav-transparent-section05');
          }
          if (diagSec) {
            diagSec.style.opacity = '1';
            diagSec.style.clipPath = `inset(${insetY}% 0 ${insetY}% 0)`;
            diagSec.style.transform = 'none';
            diagSec.style.pointerEvents = pPlane > 0.7 ? 'auto' : 'none';
          }
          if (diagDot) diagDot.style.opacity = '0';
          if (diagLine) {
            diagLine.style.opacity = Math.max(0, 1.0 - pPlane * 1.5).toFixed(3);
            diagLine.style.transform = 'scaleX(1)';
          }
          if (diagStage) {
            diagStage.style.opacity = (0.25 + 0.75 * pPlane).toFixed(3);
            diagStage.style.transform = `scale(${(0.98 + 0.02 * pPlane).toFixed(3)})`;
          }
          if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
          updateActiveDockItem(4);
        } else if (pTrack < 0.86) {
          // ==================== SECCIÓN 05 // DIAGNÓSTICO ACTIVA ====================
          window._isDiagnosticoActive = true;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '0';
            sec3Wrapper.style.pointerEvents = 'none';
          }
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          metodologiaWrapper.style.backgroundColor = '#080808';
          if (stage) {
            stage.style.opacity = '0';
            stage.style.pointerEvents = 'none';
          }
          if (videoWrapper) videoWrapper.style.opacity = '0';
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-dark');
            globalHeader.classList.add('glass-nav-transparent-section05');
          }
          if (diagSec) {
            diagSec.style.opacity = '1';
            diagSec.style.clipPath = 'none';
            diagSec.style.transform = 'none';
            diagSec.style.overflowY = 'hidden';
            diagSec.style.pointerEvents = 'auto';
          }
          if (diagDot) diagDot.style.opacity = '0';
          if (diagLine) diagLine.style.opacity = '0';
          if (diagStage) {
            diagStage.style.clipPath = 'none';
            diagStage.style.opacity = '1';
            diagStage.style.transform = 'none';
          }
          if (cierreSec) {
            cierreSec.style.opacity = '0';
            cierreSec.style.transform = 'translateY(25px)';
            cierreSec.style.pointerEvents = 'none';
          }
          updateActiveDockItem(4); // 05 // Diagnóstico
        } else if (pTrack < 0.94) {
          // ==================== TRANSICIÓN: SECCIÓN 05 SE DESVANECE -> SECCIÓN FINAL & FOOTER ENTRA ====================
          window._isDiagnosticoActive = true;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '0';
            sec3Wrapper.style.pointerEvents = 'none';
          }
          const pCierre = (pTrack - 0.86) / (0.94 - 0.86);
          const pCierreEased = 0.5 * (1.0 - Math.cos(pCierre * Math.PI));
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          metodologiaWrapper.style.backgroundColor = '#080808';
          if (stage) {
            stage.style.opacity = '0';
            stage.style.pointerEvents = 'none';
          }
          if (videoWrapper) videoWrapper.style.opacity = '0';
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-dark');
            globalHeader.classList.add('glass-nav-transparent-section05');
          }
          if (diagSec) {
            diagSec.style.opacity = Math.max(0, 1.0 - pCierre * 1.3).toFixed(3);
            diagSec.style.transform = `translateY(${(-30 * pCierreEased).toFixed(1)}px) scale(${(1.0 - 0.03 * pCierreEased).toFixed(3)})`;
            diagSec.style.pointerEvents = pCierre > 0.4 ? 'none' : 'auto';
          }
          if (diagDot) diagDot.style.opacity = '0';
          if (diagLine) diagLine.style.opacity = '0';
          if (cierreSec) {
            cierreSec.style.opacity = pCierreEased.toFixed(3);
            cierreSec.style.transform = `translateY(${((1.0 - pCierreEased) * 30).toFixed(1)}px)`;
            cierreSec.style.pointerEvents = pCierre > 0.6 ? 'auto' : 'none';
          }
          const bottomDock = document.getElementById('bottom-dock-nav');
          if (bottomDock) {
            const dockFade = Math.max(0, 1.0 - pCierre * 2.0);
            bottomDock.style.opacity = dockFade.toFixed(3);
            bottomDock.style.pointerEvents = dockFade > 0.4 ? 'auto' : 'none';
          }
          updateActiveDockItem(pCierre > 0.5 ? null : 4);
        } else {
          // ==================== SECCIÓN 07 // CIERRE & FOOTER 100% ACTIVA ====================
          window._isDiagnosticoActive = true;
          if (sec3Wrapper) {
            sec3Wrapper.style.opacity = '0';
            sec3Wrapper.style.pointerEvents = 'none';
          }
          metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
          metodologiaWrapper.style.pointerEvents = 'auto';
          metodologiaWrapper.style.backgroundColor = '#080808';
          if (stage) {
            stage.style.opacity = '0';
            stage.style.pointerEvents = 'none';
          }
          if (videoWrapper) videoWrapper.style.opacity = '0';
          if (globalHeader) {
            globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-dark');
            globalHeader.classList.add('glass-nav-transparent-section05');
          }
          if (diagSec) {
            diagSec.style.opacity = '0';
            diagSec.style.pointerEvents = 'none';
          }
          if (diagDot) diagDot.style.opacity = '0';
          if (diagLine) diagLine.style.opacity = '0';
          if (cierreSec) {
            cierreSec.style.opacity = '1';
            cierreSec.style.transform = 'none';
            cierreSec.style.pointerEvents = 'auto';
          }
          const bottomDock = document.getElementById('bottom-dock-nav');
          if (bottomDock) {
            bottomDock.style.opacity = '0';
            bottomDock.style.pointerEvents = 'none';
          }
          updateActiveDockItem(null); // Keep index clean and unobstructed over footer
        }
      } else {
        window._isDiagnosticoActive = false;
        if (sec3Wrapper) {
          sec3Wrapper.style.opacity = '1';
          sec3Wrapper.style.transform = 'none';
          sec3Wrapper.style.pointerEvents = 'auto';
        }
        metodologiaWrapper.style.transform = 'translate3d(0, 100%, 0)';
        metodologiaWrapper.style.pointerEvents = 'none';
        if (diagSec) { diagSec.style.opacity = '0'; diagSec.style.pointerEvents = 'none'; }
        if (diagDot) diagDot.style.opacity = '0';
        if (diagLine) diagLine.style.opacity = '0';
        if (cierreSec) { cierreSec.style.opacity = '0'; cierreSec.style.pointerEvents = 'none'; }
        if (globalHeader) globalHeader.classList.remove('glass-nav-transparent-section05');
      }
    };

    let isTicking = false;
    const onScroll = () => {
      if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(() => {
          updateCurtain();
          isTicking = false;
        });
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    window._updateCurtain = updateCurtain;
    updateCurtain();
  }
}

// ==================== 3D VECTOR ISOTIPO (SECTION 05 // METODOLOGÍA) ====================
function initVectorIsotipo() {
  // Modelo 3D eliminado según requerimiento
}

/** Live maturity score and radio handler for 06 // Diagnóstico test. */
function initDiagnosticoTest() {
  if (window.__diagnosticoTestInit) return;
  window.__diagnosticoTestInit = true;

  const sec = document.getElementById('sec-06-diagnostico');
  if (!sec) return;
  const radios = sec.querySelectorAll('.diag-radio');
  const scoreNum = document.getElementById('score-number');
  const scoreStatus = document.getElementById('score-status');
  const scoreExp = document.getElementById('score-explanation');
  const whatsappLink = document.getElementById('whatsapp-cta-link');

  function calculateScore() {
    let total = 0;
    radios.forEach((rr) => { if (rr.checked) total += parseInt(rr.value, 10) || 0; });
    if (scoreNum) scoreNum.textContent = total + ' / 120';

    let statusText = 'NIVEL: FRICCIÓN OPERATIVA MODERADA';
    if (total <= 45) {
      statusText = 'NIVEL: IMPROVISACIÓN CRÍTICA';
      if (scoreStatus) {
        scoreStatus.textContent = statusText;
        scoreStatus.className = 'font-mono text-[11px] uppercase text-red-400 font-bold';
      }
      if (scoreExp) scoreExp.textContent = 'Tu operación presenta alta fricción y pérdida de capital por procesos manuales desconectados.';
    } else if (total <= 85) {
      statusText = 'NIVEL: FRICCIÓN OPERATIVA MODERADA';
      if (scoreStatus) {
        scoreStatus.textContent = statusText;
        scoreStatus.className = 'font-mono text-[11px] uppercase text-yellow-400 font-bold';
      }
      if (scoreExp) scoreExp.textContent = 'Cuentas con herramientas básicas, pero careces de integración y automatización con IA.';
    } else {
      statusText = 'NIVEL: LISTO PARA ACELERACIÓN';
      if (scoreStatus) {
        scoreStatus.textContent = statusText;
        scoreStatus.className = 'font-mono text-[11px] uppercase text-vector-lime font-bold';
      }
      if (scoreExp) scoreExp.textContent = 'Tu negocio cuenta con bases sólidas y está en la posición ideal para escalar.';
    }

    if (whatsappLink) {
      const msg = encodeURIComponent('Hola Vector Inside, realicé el Test de Madurez Digital (Puntaje: ' + total + '/120 - ' + statusText + ') y me gustaría agendar la sesión estratégica.');
      whatsappLink.href = 'https://wa.me/527203323957?text=' + msg;
    }
  }

  radios.forEach((rr) => rr.addEventListener('change', calculateScore));
  calculateScore();
}

/** Dock link handler: jump straight to the 06 // Diagnóstico test (no page nav). */
function scrollToDiagnostico(e) {
  if (e && e.preventDefault) e.preventDefault();
  window.__activeNavJumpId = (window.__activeNavJumpId || 0) + 1;
  const jumpId = window.__activeNavJumpId;
  const mainTrack = document.getElementById('hero-scroll-track');
  const container = document.getElementById('sec-ejecucion-scroll-container');
  const matrixTrack = document.getElementById('sec-matriz-25-track');
  const expandWrapper = document.getElementById('sec-scroll-expand-wrapper');
  const expandFrame = document.getElementById('scroll-expand-frame');

  const forceFullScreenFrame = () => {
    if (expandWrapper) {
      expandWrapper.style.opacity = '1';
      expandWrapper.style.filter = 'none';
      expandWrapper.style.pointerEvents = 'auto';
    }
    if (expandFrame) {
      expandFrame.style.width = '100vw';
      expandFrame.style.height = '100vh';
      expandFrame.style.borderRadius = '0px';
    }
    const expandVideo = document.getElementById('scroll-expand-video');
    if (expandVideo) {
      expandVideo.style.transform = 'scale(1)';
      expandVideo.currentTime = (expandVideo.duration && !isNaN(expandVideo.duration)) ? expandVideo.duration : 10.0;
    }
    const expandBody = document.getElementById('scroll-expand-body');
    if (expandBody) {
      expandBody.style.clipPath = 'inset(0% 0% 0% 0%)';
      expandBody.style.webkitClipPath = 'inset(0% 0% 0% 0%)';
      expandBody.style.opacity = '1';
      expandBody.style.visibility = 'visible';
      expandBody.style.pointerEvents = 'auto';
      expandBody.style.transform = 'translateY(0)';
      isSec3BodyRevealed = true;
    }
  };

  const revealDiag = () => {
    window._isDiagnosticoActive = true;
    const metodologiaWrapper = document.getElementById('sec-metodologia-wrapper');
    if (metodologiaWrapper) {
      metodologiaWrapper.style.transform = 'translate3d(0, 0%, 0)';
      metodologiaWrapper.style.backgroundColor = '#080808';
      metodologiaWrapper.style.pointerEvents = 'auto';
    }
    const stage = document.getElementById('sec-metodologia-stage');
    if (stage) {
      stage.style.opacity = '0';
      stage.style.pointerEvents = 'none';
    }
    const videoBg = document.getElementById('ejecucion-liquid-flow-video');
    if (videoBg && videoBg.parentElement) videoBg.parentElement.style.opacity = '0';
    const diagSec = document.getElementById('sec-06-diagnostico');
    if (diagSec) {
      diagSec.style.opacity = '1';
      diagSec.style.clipPath = 'none';
      diagSec.style.pointerEvents = 'auto';
    }
    const diagDot = document.getElementById('diag-reveal-dot');
    const diagLine = document.getElementById('diag-reveal-line');
    const diagStage = document.getElementById('diag-content-stage');
    const cierreSec = document.getElementById('sec-07-cierre-footer');
    if (diagDot) diagDot.style.opacity = '0';
    if (diagLine) diagLine.style.opacity = '0';
    if (diagStage) {
      diagStage.style.opacity = '1';
      diagStage.style.transform = 'none';
    }
    if (cierreSec) {
      cierreSec.style.opacity = '0';
      cierreSec.style.pointerEvents = 'none';
    }
    const globalHeader = document.getElementById('main-global-header');
    if (globalHeader) {
      globalHeader.classList.remove('glass-nav-white-liquid', 'glass-nav-dark');
      globalHeader.classList.add('glass-nav-transparent-section05');
    }
    updateActiveDockItem(4);
  };

  const internalTarget = () => {
    if (!matrixTrack || !container) return 5000;
    const scrollable = matrixTrack.offsetHeight - container.clientHeight;
    return Math.round(matrixTrack.offsetTop + Math.max(0, scrollable) * 0.80);
  };

  if (mainTrack) {
    const maxScroll = mainTrack.offsetHeight - window.innerHeight;
    const targetY = Math.round(maxScroll * 0.995);

    window.__forceTimelineProgress = 0.995;
    window.__forceTimelineUntil = performance.now() + 1400;
    setTimeout(() => {
      if (window.__activeNavJumpId === jumpId) window.__forceTimelineProgress = null;
    }, 1600);

    window.scrollTo(0, targetY);

    const apply = () => {
      if (window.__activeNavJumpId !== jumpId) return;
      window.scrollTo(0, targetY);
      forceFullScreenFrame();
      if (container) container.scrollTop = internalTarget();
      revealDiag();
    };
    const deadline = performance.now() + 1500;
    const pin = () => {
      if (window.__activeNavJumpId !== jumpId) return;
      apply();
      if (performance.now() < deadline) requestAnimationFrame(pin);
    };
    requestAnimationFrame(pin);
    [0, 60, 150, 300, 550, 900, 1400].forEach((t) => setTimeout(() => {
      if (window.__activeNavJumpId === jumpId) apply();
    }, t));
  } else {
    forceFullScreenFrame();
    if (container) container.scrollTop = internalTarget();
    revealDiag();
  }
  return false;
}
window.scrollToDiagnostico = scrollToDiagnostico;

// Initialize Floating Gallery Events & Instance
// Initialize AccordionGallery for Section 04 // Evidencia
function initFloatingGallery() {
  const root = document.getElementById('floating-gallery-root');
  if (!root || typeof AccordionGallery === 'undefined') return;

  const items = matriz25Data.map(item => ({
    image: `ejecucion/Matriz 25/${encodeURIComponent(item.file)}`,
    label: item.title,
    title: item.title,
    alt: item.title,
    code: item.code,
    category: item.category,
    color: item.color,
    desc: item.desc,
    kpi1: item.kpi1,
    kpi2: item.kpi2,
    kpi3: item.kpi3,
    link: item.link || '#'
  }));

  window.accordionGalleryInstance = new AccordionGallery('floating-gallery-root', {
    items: items,
    defaultIndex: 2,
    pageSize: 5,
    expandRatio: 0.52,
    trigger: 'hover',
    accentColor: '#c3f400',
    overlayColor: 'rgba(6, 0, 16, 0.35)',
    textColor: '#ffffff',
    grayscale: false,
    showLabels: true,
    duration: 0.6,
    ease: 'power3.out',
    parallax: 0.5,
    tilt: 8,
    stagger: 0.06,
    height: 480,
    gap: 12,
    radius: 16,
    showPagination: true
  });

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
      if (window.accordionGalleryInstance) {
        window.accordionGalleryInstance.setFilter(btn.dataset.filter);
      }
    });
  });

  initExecutionInternalScrollListener();
  initVectorIsotipo();
  initDiagnosticoTest();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initFloatingGallery();
    initVectorIsotipo();
    initDiagnosticoTest();
    initPersistentScrollIndicator();
  });
} else {
  initFloatingGallery();
  initVectorIsotipo();
  initDiagnosticoTest();
  initPersistentScrollIndicator();
}

// ==================== PERSISTENT BOTTOM-LEFT SCROLL INDICATOR ====================
/**
 * Icono indicador de scroll persistente en la esquina inferior izquierda.
 * - Animación de cortina de arriba hacia abajo cada 3 segundos.
 * - Desaparece inmediatamente al hacer scroll.
 * - Reaparece tras 20 segundos de inactividad.
 */
function initPersistentScrollIndicator() {
  const indicator = document.getElementById('persistent-scroll-indicator');
  if (!indicator || indicator.__isInitialized) return;
  indicator.__isInitialized = true;

  let idleScrollTimer = null;
  const IDLE_DURATION = 20000; // 20 segundos de inactividad

  function show() {
    indicator.classList.remove('is-hidden');
    indicator.classList.add('is-visible');
  }

  function hide() {
    indicator.classList.remove('is-visible');
    indicator.classList.add('is-hidden');
  }

  function handleScrollActivity() {
    // 1. Desaparece de inmediato al hacer scroll
    hide();

    // 2. Reiniciar temporizador de 20 segundos de inactividad
    if (idleScrollTimer) {
      clearTimeout(idleScrollTimer);
    }
    idleScrollTimer = setTimeout(show, IDLE_DURATION);
  }

  // Escuchar eventos de scroll en la ventana y contenedores internos
  window.addEventListener('scroll', handleScrollActivity, { passive: true });
  window.addEventListener('wheel', handleScrollActivity, { passive: true });
  window.addEventListener('touchmove', handleScrollActivity, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space'].includes(e.code)) {
      handleScrollActivity();
    }
  }, { passive: true });

  const ejecucionContainer = document.getElementById('sec-ejecucion-scroll-container');
  if (ejecucionContainer) {
    ejecucionContainer.addEventListener('scroll', handleScrollActivity, { passive: true });
  }

  const secPortal = document.getElementById('seccion-portal-revelada');
  if (secPortal) {
    secPortal.addEventListener('scroll', handleScrollActivity, { passive: true });
  }

  // Inicialmente visible, y al primer scroll se oculta e inicia el ciclo de 20s
  show();
}
window.initPersistentScrollIndicator = initPersistentScrollIndicator;
