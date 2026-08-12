/**
 * Vector Inside 3.0 - High-Performance Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Initialize Fullscreen Video Intro (INTRO.mp4)
  initPageVideoIntro();

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

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
  });

  // 1. Configurar el decodificador de Draco (indispensable para compresión Draco)
  if (typeof THREE.GLTFLoader !== 'undefined') {
    const loader = new THREE.GLTFLoader();

    if (typeof THREE.DRACOLoader !== 'undefined') {
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dracoLoader);
    }

    // 2. Modelo 3D optimizado (5.0 MB - Cache-Busting Version v3.0.1)
    const modelUrl = 'poligonalFINAL-optimized.glb?v=3.0.1';

    console.log("Iniciando la carga del modelo 3D optimizado...");

    // 3. Ejecutar la carga con el Log Test completo y progreso
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("¡Modelo cargado con éxito!", gltf);
        const model = gltf.scene;

        // Scale model keeping exact Blender pivot point (orange dot between eyes)
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 7.66 / maxDim; // Increased size scale
        model.scale.set(scale, scale, scale);

        model.traverse((child) => {
          if (child.isMesh) {
            child.position.set(0, 0, 0);
            if (child.material) {
              child.material.roughness = 0.25;
              child.material.metalness = 0.75;
            }
          }
        });

        modelGroup.add(model);
        modelGroup.position.set(0, 0, 0); // Exact alignment using Blender pivot point
      },
      (xhr) => {
        if (xhr.total > 0) {
          const porcentaje = (xhr.loaded / xhr.total) * 100;
          console.log(`Progreso de descarga del modelo 3D: ${porcentaje.toFixed(2)}%`);
        } else {
          console.log(`Bytes descargados del modelo 3D: ${xhr.loaded}`);
        }
      },
      (error) => {
        console.error("¡ERROR crítico al cargar el modelo desde Cloudinary!", error);
      }
    );
  }

  function syncSize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', syncSize);

  let targetRotY = 0;
  let targetRotX = 0;
  let currentRotY = 0;
  let currentRotX = 0;

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    targetRotY = x * 0.45; // Dynamic horizontal look-at
    targetRotX = y * 0.32; // Dynamic vertical look-at
  });

  function animate() {
    requestAnimationFrame(animate);

    if (modelGroup) {
      // Responsive, smooth lerp tracking cursor
      currentRotY += (targetRotY - currentRotY) * 0.06;
      currentRotX += (targetRotX - currentRotX) * 0.06;

      modelGroup.rotation.y = currentRotY;
      modelGroup.rotation.x = currentRotX;
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
}
