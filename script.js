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

  // 0b. Initialize Hero Background HLS Video Component
  initHeroHlsVideo();

  // 1. Initialize Three.js Gradient Waves Background Shader
  initGradientWavesShader();

  // 2. Initialize 3D Model poligonalFINAL-optimized.glb
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
 * Fullscreen Video Intro & Preloader Controller (INTRO.mp4)
 */
function initPageVideoIntro() {
  const introScreen = document.getElementById('intro-screen');
  const video = document.getElementById('intro-video');
  const skipBtn = document.getElementById('skip-intro-btn');
  const soundBtn = document.getElementById('toggle-sound-btn');
  const soundText = document.getElementById('sound-btn-text');

  if (!introScreen || !video) return;

  let isDismissed = false;

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

  // Auto-dismiss when INTRO.mp4 finishes playing
  video.addEventListener('ended', dismissIntro);

  // Fallback timeout in case video stutters or fails
  setTimeout(() => {
    if (!isDismissed) dismissIntro();
  }, 15000);

  // Skip button click
  if (skipBtn) {
    skipBtn.addEventListener('click', dismissIntro);
  }

  // Escape key press to skip
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !isDismissed) {
      dismissIntro();
    }
  });
}

/**
 * BackgroundVideo Component Logic for Hero Background
 */
function initHeroHlsVideo() {
  const video = document.getElementById('hero-bg-video');
  if (!video) return;

  const videoSrc = 'background.mp4';

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.src = videoSrc;
  video.play().catch((err) => console.log("Autoplay background.mp4:", err));
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
  // Near plane set to 0.001 to prevent geometry clipping/fading when camera gets inches from the mesh
  const camera = new THREE.PerspectiveCamera(45, dim.width / dim.height, 0.001, 1000);
  camera.position.set(0, 0, 10);

  // WebGLRenderer configured for maximum multi-device & mobile compatibility
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

  // Ambient & Accent Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLightLime = new THREE.DirectionalLight(0xc3f400, 2.5); // Lime accent light
  dirLightLime.position.set(5, 10, 7);
  scene.add(dirLightLime);

  const dirLightPurple = new THREE.DirectionalLight(0x9d4edd, 2.0); // Purple accent light
  dirLightPurple.position.set(-5, -5, -5);
  scene.add(dirLightPurple);

  const pointLight = new THREE.PointLight(0xffffff, 2, 50);
  pointLight.position.set(0, 5, 5);
  scene.add(pointLight);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  let targetRotY = 0;
  let targetRotX = 0;
  let currentRotY = 0;
  let currentRotX = 0;

  let isHoveredOverModel = false;
  let currentHoverLerp = 0; // 0.0 = Default Blender Blue, 1.0 = Iridescent Green + Eye Glow
  const detectedEyeMeshes = [];
  const detectedHeadMeshes = [];

  // Max subtle tilt when cursor moves across Hero section (24° = ~0.418 rad)
  const SUBTLE_MAX_RAD = 24 * (Math.PI / 180);

  // Authoritative Hero section element for full-hero tracking
  const targetElement = container.closest('section') || document.querySelector('section') || container.closest('main') || document.body;

  function updateHeroTracking(clientX, clientY) {
    if (!targetElement || !container) return;
    const heroRect = targetElement.getBoundingClientRect();
    const modelRect = container.getBoundingClientRect();

    // 1. Check if cursor is strictly within the Hero section boundaries
    const isInsideHero = (
      clientX >= heroRect.left &&
      clientX <= heroRect.right &&
      clientY >= heroRect.top &&
      clientY <= heroRect.bottom
    );

    if (isInsideHero) {
      const relX = ((clientX - heroRect.left) / heroRect.width) - 0.5; // [-0.5, +0.5]
      const relY = ((clientY - heroRect.top) / heroRect.height) - 0.5;  // [-0.5, +0.5]

      // Rotate to follow cursor continuously across Hero section
      targetRotY = relX * (2 * SUBTLE_MAX_RAD);
      targetRotX = relY * (2 * SUBTLE_MAX_RAD);

      // 2. Change color ONLY when cursor is directly OVER the 3D model container
      const isDirectlyOverModel = (
        clientX >= modelRect.left &&
        clientX <= modelRect.right &&
        clientY >= modelRect.top &&
        clientY <= modelRect.bottom
      );

      isHoveredOverModel = isDirectlyOverModel;
    } else {
      resetModelToBasePosition();
    }
  }

  function resetModelToBasePosition() {
    isHoveredOverModel = false;
    // Smoothly return 3D model to base frontal position (0, 0)
    targetRotY = 0;
    targetRotX = 0;
  }

  // Mouse & Touch listeners for full Hero cursor tracking
  document.addEventListener('mousemove', (e) => {
    updateHeroTracking(e.clientX, e.clientY);
  });

  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      updateHeroTracking(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', resetModelToBasePosition);
  document.addEventListener('mouseleave', resetModelToBasePosition);

  // Configurar el decodificador de Draco con respaldo multicloud
  if (typeof THREE.GLTFLoader !== 'undefined') {
    const loader = new THREE.GLTFLoader();

    if (typeof THREE.DRACOLoader !== 'undefined') {
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dracoLoader);
    }

    // Single Authoritative Model at all times: Cloudinary CDN (5.2MB optimized)
    const modelUrl = 'https://res.cloudinary.com/cci1klwx/image/upload/v1786507830/poligonalFINAL-optimized.glb';
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("¡Modelo 3D (Cloudinary CDN) cargado con éxito!", gltf);
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        // Perfect scale fitting full wolf head & ears without any top/bottom clipping
        const scale = 7.80 / maxDim;

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
              child.material.side = THREE.DoubleSide; // Render both interior & exterior polygon faces
              child.material.depthWrite = true;
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
        // Center vertically with slight Y offset (-0.15) so ears fit 100% inside viewport
        modelGroup.position.set(0, -0.15, 0);
        modelGroup.rotation.set(0, 0, 0);
        modelGroup.updateMatrixWorld(true);

        // Compute exact eye world coordinates from detected eye mesh
        if (detectedEyeMeshes.length > 0) {
          const eyeMesh = detectedEyeMeshes[0];
          eyeMesh.updateMatrixWorld(true);
          const eyeBox = new THREE.Box3().setFromObject(eyeMesh);
          const eyeCenter = eyeBox.getCenter(new THREE.Vector3());

          // If mesh spans both eyes (symmetric X), focus on the right eye
          if (eyeBox.max.x > 0.08 && eyeBox.min.x < -0.08) {
            targetEyePos.set(eyeBox.max.x * 0.65, eyeCenter.y, eyeCenter.z);
          } else {
            targetEyePos.copy(eyeCenter);
          }
          console.log("--> EXACT EYE WORLD TARGET COMPUTED:", targetEyePos);
        }

        syncSize();
      },
      (xhr) => {
        if (xhr.total > 0) {
          const porcentaje = (xhr.loaded / xhr.total) * 100;
          console.log(`Progreso de descarga del modelo 3D: ${porcentaje.toFixed(2)}%`);
        }
      },
      (err) => {
        console.error("Error cargando poligonalFINAL-optimized.glb:", err);
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
  const portalOverlay = document.getElementById('eye-portal-overlay');
  const portalRing = document.getElementById('eye-portal-ring');

  if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: '#hero-scroll-track',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (self) => {
        scrollProgress = self.progress; // 0.0 -> 1.0
      }
    });
  }

  // Smooth scroll tracking variables & Eye Target (Right eye of wolf)
  let currentScrollLerp = 0;
  const targetEyePos = new THREE.Vector3(0.38, 0.22, 1.15); // Fallback right eye coordinate

  // Render loop: Smooth transition between Blender Blue (default) & Iridescent Green + Scroll Eye-Zoom
  function animate() {
    requestAnimationFrame(animate);

    // Smoothly interpolate scroll progress for cinematic motion
    currentScrollLerp += (scrollProgress - currentScrollLerp) * 0.12;

    if (modelGroup) {
      // 1. Head tilt follows mouse only when at top of hero, dampens to 0 as user scrolls
      const mouseDampen = Math.max(0, 1.0 - currentScrollLerp * 3.0);
      currentRotY += (targetRotY * mouseDampen - currentRotY) * 0.10;
      currentRotX += (targetRotX * mouseDampen - currentRotX) * 0.10;

      modelGroup.rotation.y = Math.max(-SUBTLE_MAX_RAD, Math.min(SUBTLE_MAX_RAD, currentRotY));
      modelGroup.rotation.x = Math.max(-SUBTLE_MAX_RAD, Math.min(SUBTLE_MAX_RAD, currentRotX));
      modelGroup.rotation.z = 0;

      // 2. Camera Eye Zoom: Trajectory penetrates straight through the eye socket into the interior
      const baseCamPos = new THREE.Vector3(0, 0, 10);
      const targetCamPos = new THREE.Vector3(
        targetEyePos.x,
        targetEyePos.y,
        targetEyePos.z - 0.70 // Penetrates deep through the front shell of the head
      );

      // Camera position interpolation
      camera.position.lerpVectors(baseCamPos, targetCamPos, Math.min(currentScrollLerp * 1.15, 1.0));
      
      // Camera lookAt interpolation locked straight ahead along the zoom trajectory
      const baseLookAt = new THREE.Vector3(0, 0, 0);
      const targetLookAt = new THREE.Vector3(targetEyePos.x, targetEyePos.y, targetEyePos.z - 1.5);
      const currentLookAt = new THREE.Vector3().lerpVectors(baseLookAt, targetLookAt, currentScrollLerp);
      camera.lookAt(currentLookAt);

      // 4. UI Layer Fade-out & Translation
      if (heroUi) {
        const uiOpacity = Math.max(0, 1.0 - currentScrollLerp * 3.0);
        heroUi.style.opacity = uiOpacity.toFixed(3);
        heroUi.style.transform = `translateY(${-currentScrollLerp * 80}px) scale(${1.0 + currentScrollLerp * 0.08})`;
        heroUi.style.pointerEvents = uiOpacity < 0.1 ? 'none' : 'auto';
      }

      if (heroScrollHint) {
        heroScrollHint.style.opacity = Math.max(0, 1.0 - currentScrollLerp * 4.0).toFixed(3);
      }

      // 5. Portal Iris Ring Flash (Triggers right at the shell threshold: 75% to 95% scroll)
      if (portalOverlay && portalRing) {
        if (currentScrollLerp > 0.75 && currentScrollLerp < 0.98) {
          const pIris = Math.min((currentScrollLerp - 0.75) / 0.18, 1.0);
          portalOverlay.style.opacity = Math.min(pIris * 1.6, 1.0).toFixed(3);
          const scale = Math.pow(pIris, 3.2) * 90;
          portalRing.style.transform = `scale(${scale.toFixed(2)})`;
        } else {
          portalOverlay.style.opacity = '0';
          portalRing.style.transform = 'scale(0)';
        }
      }

      // 5b. Section 2 Delayed In-Place Blur-to-Focus Reveal (Only AFTER crossing front shell at >80% scroll)
      const secPortal = document.getElementById('seccion-portal-revelada');
      if (secPortal) {
        if (currentScrollLerp > 0.80) {
          const pFocus = Math.min((currentScrollLerp - 0.80) / 0.18, 1.0);
          const blurAmount = (1.0 - pFocus) * 35; // 35px -> 0px crisp focus
          const opacityAmount = Math.pow(pFocus, 2.0); // Fast clean reveal once inside
          secPortal.style.filter = `blur(${blurAmount.toFixed(1)}px)`;
          secPortal.style.opacity = opacityAmount.toFixed(3);
          secPortal.style.pointerEvents = pFocus > 0.85 ? 'auto' : 'none';
        } else {
          secPortal.style.filter = 'blur(35px)';
          secPortal.style.opacity = '0';
          secPortal.style.pointerEvents = 'none';
        }
      }

      // 6. Materials & Eye Glow Shader Animation
      const targetHoverLerp = isHoveredOverModel ? 1.0 : 0.0;
      currentHoverLerp += (targetHoverLerp - currentHoverLerp) * 0.10;

      // Head mesh material
      detectedHeadMeshes.forEach((headMesh) => {
        if (headMesh.material) {
          headMesh.material.metalness = THREE.MathUtils.lerp(0.75, 0.35, currentHoverLerp);
          headMesh.material.roughness = THREE.MathUtils.lerp(0.25, 0.55, currentHoverLerp);

          const defaultColor = new THREE.Color(0xA4A1FF);
          const hoverColor = new THREE.Color(0x3897cd);
          headMesh.material.color.copy(defaultColor).lerp(hoverColor, currentHoverLerp);

          if (headMesh.material.emissive) {
            headMesh.material.emissiveIntensity = 0;
          }
          headMesh.material.needsUpdate = true;
        }
      });

      // Eye mesh material: Intense Neon Iris Glow on Zoom
      detectedEyeMeshes.forEach((eyeMesh) => {
        if (eyeMesh.material) {
          const eyeNormal = new THREE.Color(0xA4A1FF);
          const eyeHover = new THREE.Color(0xc3f400); // Neon Lime on scroll zoom
          const currentEyeColor = eyeNormal.clone().lerp(eyeHover, Math.max(currentHoverLerp, currentScrollLerp));

          if (!eyeMesh.material.emissive) {
            eyeMesh.material.emissive = currentEyeColor;
          } else {
            eyeMesh.material.emissive.copy(currentEyeColor);
          }
          // Emissive intensity explodes as you get closer to the eye
          const zoomIntensity = THREE.MathUtils.lerp(3.5, 30.0, currentScrollLerp);
          eyeMesh.material.emissiveIntensity = zoomIntensity;
          eyeMesh.material.needsUpdate = true;
        }
      });
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
  strokePath.style.strokeDashoffset = '1800';
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
      }, "+=0.15")
      // 3. Trigger Curtain Reveal for "Tu marca el único destino." as wipe fill completes
      .add(() => {
        triggerCurtainRevealEffect();
      }, "-=0.2");
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
      setTimeout(triggerCurtainRevealEffect, 500);
    }, 1000);
  }
}

/**
 * High-Speed Left-to-Right Green Curtain Reveal Effect for "Tu marca el único destino."
 */
function triggerCurtainRevealEffect() {
  const curtainOverlay = document.getElementById('hero-curtain-overlay');
  const curtainText = document.getElementById('hero-curtain-text');
  if (!curtainOverlay || !curtainText) return;

  // Ensure text has transparent fill and green stroke outline
  curtainText.style.color = 'transparent';
  curtainText.style.webkitTextStroke = '1.5px #c3f400';

  if (typeof gsap !== 'undefined') {
    const tl = gsap.timeline();

    // 1. Reset
    gsap.set(curtainOverlay, { scaleX: 0, transformOrigin: "left center" });
    gsap.set(curtainText, { opacity: 0 });

    // 2. Fast Curtain sweep across from Left to Right (scaleX 0 -> 1 in 0.28s)
    tl.to(curtainOverlay, {
      scaleX: 1,
      duration: 0.28,
      ease: "power3.in"
    })
    // 3. Reveal text inside curtain
    .set(curtainText, { opacity: 1 })
    // 4. Fast Un-curtain to Right (scaleX 1 -> 0 in 0.32s)
    .set(curtainOverlay, { transformOrigin: "right center" })
    .to(curtainOverlay, {
      scaleX: 0,
      duration: 0.32,
      ease: "power3.out"
    });
  } else {
    // CSS Fallback
    curtainOverlay.style.transition = 'transform 0.28s cubic-bezier(0.7, 0, 0.3, 1)';
    curtainOverlay.style.transformOrigin = 'left';
    curtainOverlay.style.transform = 'scaleX(1)';

    setTimeout(() => {
      curtainText.style.opacity = '1';
      curtainOverlay.style.transformOrigin = 'right';
      curtainOverlay.style.transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)';
      curtainOverlay.style.transform = 'scaleX(0)';
    }, 290);
  }
}
