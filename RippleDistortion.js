/**
 * Official React Bits RippleDistortion Implementation
 * Supports both:
 * 1. Standalone image distortion (when src is provided)
 * 2. Transparent fluid water-lens overlay in front of 3D Canvas / Hero UI
 */
(function (global) {
  const MAX_WAVES = 100;
  const QUALITY_SCALE = { low: 0.4, medium: 0.7, high: 1.0 };
  const START_SCALE = 1.5;
  const LIFE_CONSTANT = Math.log(500);

  const waveVertex = `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    attribute vec2 iOffset;
    attribute vec2 iScale;
    attribute float iOpacity;
    varying vec2 vUv;
    varying float vOpacity;
    void main() {
      vUv = uv;
      vOpacity = iOpacity;
      gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0);
    }
  `;

  const waveFragment = `
    precision highp float;
    varying vec2 vUv;
    varying float vOpacity;
    uniform float uRings;
    const float PI = 3.141592653589793;
    const float EDGE = 0.006737947;
    void main() {
      vec2 p = vUv * 2.0 - 1.0;
      float r = dot(p, p);
      if (r > 1.0) discard;
      float brush = (exp(-r * 5.0) - EDGE) / (1.0 - EDGE);
      brush *= 0.55 + 0.45 * cos(sqrt(r) * PI * 2.0 * uRings);
      gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
    }
  `;

  const screenVertex = `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const compositeFragment = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform sampler2D uDisplacement;
    uniform vec2 uResolution;
    uniform vec2 uTextureSize;
    uniform vec2 uTexel;
    uniform vec3 uTint;
    uniform vec3 uHighlight;
    uniform float uStrength;
    uniform float uSwirl;
    uniform float uDispersion;
    uniform float uGlint;
    uniform float uTintAmount;
    uniform float uGrayscale;
    uniform bool uHasTexture;
    const float TAU = 6.283185307179586;

    vec2 coverUV(vec2 uv) {
      vec2 safe = max(uTextureSize, vec2(1.0));
      vec2 s = uResolution / safe;
      vec2 scaledSize = safe * max(s.x, s.y);
      vec2 offset = (uResolution - scaledSize) * 0.5;
      return (uv * uResolution - offset) / scaledSize;
    }

    void main() {
      float amount = texture2D(uDisplacement, vUv).r;

      if (!uHasTexture) {
        // Transparent Overlay Mode for Hero / 3D Canvas
        if (amount < 0.0005) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }

        float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
        float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;
        vec3 normal = normalize(vec3(-ex * 28.0, -ey * 28.0, 1.0));
        vec3 light = normalize(vec3(-0.35, 0.55, 1.0));
        float raw = pow(max(dot(normal, light), 0.0), 22.0);
        float flatSpec = pow(max(light.z, 0.0), 22.0);
        float spec = clamp((raw - flatSpec) / max(1.0 - flatSpec, 0.0001), 0.0, 1.0);

        // Concentric fluid wave color with purple tint & glint highlight
        vec3 waveColor = mix(uTint, uHighlight, spec * 0.85);
        float alpha = clamp(amount * 2.5 * max(uTintAmount, 0.18) + spec * 0.65, 0.0, 0.85);

        gl_FragColor = vec4(waveColor, alpha);
        return;
      }

      // Standalone Image Distortion Mode
      vec2 base = coverUV(vUv);
      float theta = amount * uSwirl * TAU;
      vec2 dir = vec2(sin(theta), cos(theta));
      vec2 push = dir * amount * uStrength;

      vec3 color;
      if (uDispersion > 0.001) {
        float split = uDispersion * 0.25;
        color.r = texture2D(uTexture, base + push * (1.0 + split)).r;
        color.g = texture2D(uTexture, base + push).g;
        color.b = texture2D(uTexture, base + push * (1.0 - split)).b;
      } else {
        color = texture2D(uTexture, base + push).rgb;
      }

      if (uGrayscale > 0.001) {
        color = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), uGrayscale);
      }

      if (uTintAmount > 0.001) {
        color = mix(color, color * uTint * 1.9, clamp(amount * 1.6, 0.0, 1.0) * uTintAmount);
      }

      if (uGlint > 0.001) {
        float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
        float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;
        vec3 normal = normalize(vec3(-ex * 26.0, -ey * 26.0, 1.0));
        vec3 light = normalize(vec3(-0.35, 0.55, 1.0));
        float raw = pow(max(dot(normal, light), 0.0), 22.0);
        float flatSpec = pow(max(light.z, 0.0), 22.0);
        color += uHighlight * clamp((raw - flatSpec) / max(1.0 - flatSpec, 0.0001), 0.0, 1.0) * uGlint;
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function hexToRGB(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return [1, 1, 1];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  class RippleDistortion {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) return;

      this.options = Object.assign({
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
      }, options);

      this.waves = Array.from({ length: MAX_WAVES }, () => ({
        x: 0,
        y: 0,
        scale: START_SCALE,
        target: START_SCALE,
        size: 1,
        opacity: 0
      }));
      this.currentWave = 0;
      this.previousX = 0;
      this.previousY = 0;
      this.previousTime = 0;
      this.raf = 0;
      this.disposed = false;
      this.hasTexture = false;

      this.init();
    }

    init() {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ripple-distortion-canvas';
      this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:25;';
      this.container.appendChild(this.canvas);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;

      // Transparent context for seamless Hero integration
      this.gl = this.canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false }) ||
                this.canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });

      if (!this.gl) {
        console.warn('RippleDistortion: WebGL not available');
        return;
      }

      const gl = this.gl;
      this.isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      this.extInstancing = this.isWebGL2 ? null : gl.getExtension('ANGLE_instanced_arrays');

      this.initWavePass();
      this.initCompositePass();
      if (this.options.src) {
        this.initTexture();
      }

      this.bindEvents();
      this.resize();

      this.loop = this.loop.bind(this);
      this.raf = requestAnimationFrame(this.loop);
    }

    compileShader(type, src) {
      const gl = this.gl;
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
      }
      return s;
    }

    createProgram(vsSrc, fsSrc) {
      const gl = this.gl;
      const vs = this.compileShader(gl.VERTEX_SHADER, vsSrc);
      const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(p));
      }
      return p;
    }

    initWavePass() {
      const gl = this.gl;
      this.waveProgram = this.createProgram(waveVertex, waveFragment);

      this.wavePosBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.wavePosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1, -1,  1,
        -1,  1,  1, -1,  1,  1
      ]), gl.STATIC_DRAW);

      this.waveUvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.waveUvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,  1, 0,  0, 1,
        0, 1,  1, 0,  1, 1
      ]), gl.STATIC_DRAW);

      this.offsets = new Float32Array(MAX_WAVES * 2);
      this.scales = new Float32Array(MAX_WAVES * 2);
      this.opacities = new Float32Array(MAX_WAVES);

      this.offsetBuffer = gl.createBuffer();
      this.scaleBuffer = gl.createBuffer();
      this.opacityBuffer = gl.createBuffer();

      this.uWaveRings = gl.getUniformLocation(this.waveProgram, 'uRings');

      this.fbo = gl.createFramebuffer();
      this.dispTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.dispTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.dispTexture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    initCompositePass() {
      const gl = this.gl;
      this.compProgram = this.createProgram(screenVertex, compositeFragment);

      this.screenBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.screenBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  3, -1, -1,  3
      ]), gl.STATIC_DRAW);

      this.screenUvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.screenUvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,  2, 0,  0, 2
      ]), gl.STATIC_DRAW);

      this.compUniforms = {
        uTexture: gl.getUniformLocation(this.compProgram, 'uTexture'),
        uDisplacement: gl.getUniformLocation(this.compProgram, 'uDisplacement'),
        uResolution: gl.getUniformLocation(this.compProgram, 'uResolution'),
        uTextureSize: gl.getUniformLocation(this.compProgram, 'uTextureSize'),
        uTexel: gl.getUniformLocation(this.compProgram, 'uTexel'),
        uTint: gl.getUniformLocation(this.compProgram, 'uTint'),
        uHighlight: gl.getUniformLocation(this.compProgram, 'uHighlight'),
        uStrength: gl.getUniformLocation(this.compProgram, 'uStrength'),
        uSwirl: gl.getUniformLocation(this.compProgram, 'uSwirl'),
        uDispersion: gl.getUniformLocation(this.compProgram, 'uDispersion'),
        uGlint: gl.getUniformLocation(this.compProgram, 'uGlint'),
        uTintAmount: gl.getUniformLocation(this.compProgram, 'uTintAmount'),
        uGrayscale: gl.getUniformLocation(this.compProgram, 'uGrayscale'),
        uHasTexture: gl.getUniformLocation(this.compProgram, 'uHasTexture')
      };
    }

    initTexture() {
      const gl = this.gl;
      this.imageTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      this.textureSize = [1, 1];
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => {
        if (this.disposed) return;
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        this.textureSize = [img.naturalWidth || 1, img.naturalHeight || 1];
        this.hasTexture = true;
      };
      img.src = this.options.src;
    }

    setNewWave(x, y, power = 1.0) {
      const wave = this.waves[this.currentWave];
      this.currentWave = (this.currentWave + 1) % MAX_WAVES;
      wave.x = x;
      wave.y = y;
      wave.scale = START_SCALE * power;
      wave.target = START_SCALE * Math.max(1, this.options.spread) * power;
      wave.size = Math.max(1, this.options.brushSize);
      wave.opacity = 1;
    }

    localPoint(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        return null;
      }
      return [clientX - rect.left, rect.height - (clientY - rect.top)];
    }

    bindEvents() {
      const onMove = (e) => {
        if (!this.options.enabled || this.options.trigger === 'click') return;
        const pt = this.localPoint(e.clientX, e.clientY);
        if (!pt) return;
        const step = Math.max(1, this.options.spacing);
        if (Math.abs(pt[0] - this.previousX) > step || Math.abs(pt[1] - this.previousY) > step) {
          this.setNewWave(pt[0], pt[1], 1.0);
          this.previousX = pt[0];
          this.previousY = pt[1];
        }
      };

      const onDown = (e) => {
        if (!this.options.enabled || this.options.trigger === 'hover') return;
        const pt = this.localPoint(e.clientX, e.clientY);
        if (!pt) return;
        this.setNewWave(pt[0], pt[1], Math.max(1, this.options.clickStrength));
      };

      // Listen on window so mouse moves anywhere in Hero trigger ripples without blocking clicks
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      this.width = w;
      this.height = h;
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);

      const scale = QUALITY_SCALE[this.options.quality] || QUALITY_SCALE.low;
      this.fieldW = Math.max(2, Math.round(w * scale));
      this.fieldH = Math.max(2, Math.round(h * scale));

      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.dispTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.fieldW, this.fieldH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    loop(now) {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(this.loop);

      const delta = this.previousTime ? Math.min(0.05, (now - this.previousTime) / 1000) : 0;
      this.previousTime = now;

      const growth = 1 - Math.exp(-delta * 1.09);
      const decay = Math.exp((-delta * LIFE_CONSTANT) / Math.max(0.15, this.options.fade));

      for (let i = 0; i < MAX_WAVES; i++) {
        const wave = this.waves[i];
        if (wave.opacity <= 0) {
          this.opacities[i] = 0;
          continue;
        }

        wave.opacity *= decay;
        wave.scale += (wave.target - wave.scale) * growth;

        if (wave.opacity < 0.002) {
          wave.opacity = 0;
          this.opacities[i] = 0;
          continue;
        }

        const half = (wave.scale * wave.size) / 2;
        this.offsets[i * 2] = (wave.x / this.width) * 2 - 1;
        this.offsets[i * 2 + 1] = (wave.y / this.height) * 2 - 1;
        this.scales[i * 2] = (half / this.width) * 2;
        this.scales[i * 2 + 1] = (half / this.height) * 2;
        this.opacities[i] = wave.opacity;
      }

      this.render();
    }

    render() {
      const gl = this.gl;

      // ==================== PASS 1: RENDER WAVES TO DISPLACEMENT FBO ====================
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, this.fieldW, this.fieldH);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);

      gl.useProgram(this.waveProgram);
      gl.uniform1f(this.uWaveRings, this.options.rings);

      const aPos = gl.getAttribLocation(this.waveProgram, 'position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.wavePosBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const aUv = gl.getAttribLocation(this.waveProgram, 'uv');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.waveUvBuffer);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

      const aOffset = gl.getAttribLocation(this.waveProgram, 'iOffset');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.offsets, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aOffset);
      gl.vertexAttribPointer(aOffset, 2, gl.FLOAT, false, 0, 0);
      if (this.isWebGL2) gl.vertexAttribDivisor(aOffset, 1);
      else if (this.extInstancing) this.extInstancing.vertexAttribDivisorANGLE(aOffset, 1);

      const aScale = gl.getAttribLocation(this.waveProgram, 'iScale');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.scaleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.scales, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aScale);
      gl.vertexAttribPointer(aScale, 2, gl.FLOAT, false, 0, 0);
      if (this.isWebGL2) gl.vertexAttribDivisor(aScale, 1);
      else if (this.extInstancing) this.extInstancing.vertexAttribDivisorANGLE(aScale, 1);

      const aOpacity = gl.getAttribLocation(this.waveProgram, 'iOpacity');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.opacityBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.opacities, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aOpacity);
      gl.vertexAttribPointer(aOpacity, 1, gl.FLOAT, false, 0, 0);
      if (this.isWebGL2) gl.vertexAttribDivisor(aOpacity, 1);
      else if (this.extInstancing) this.extInstancing.vertexAttribDivisorANGLE(aOpacity, 1);

      if (this.isWebGL2) {
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, MAX_WAVES);
      } else if (this.extInstancing) {
        this.extInstancing.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, MAX_WAVES);
      }

      if (this.isWebGL2) {
        gl.vertexAttribDivisor(aOffset, 0);
        gl.vertexAttribDivisor(aScale, 0);
        gl.vertexAttribDivisor(aOpacity, 0);
      } else if (this.extInstancing) {
        this.extInstancing.vertexAttribDivisorANGLE(aOffset, 0);
        this.extInstancing.vertexAttribDivisorANGLE(aScale, 0);
        this.extInstancing.vertexAttribDivisorANGLE(aOpacity, 0);
      }

      gl.disable(gl.BLEND);

      // ==================== PASS 2: COMPOSITE WITH TRANSPARENCY ====================
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this.compProgram);

      if (this.hasTexture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
        gl.uniform1i(this.compUniforms.uTexture, 0);
      }

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.dispTexture);
      gl.uniform1i(this.compUniforms.uDisplacement, 1);

      gl.uniform2f(this.compUniforms.uResolution, this.width, this.height);
      gl.uniform2f(this.compUniforms.uTextureSize, this.textureSize ? this.textureSize[0] : 1, this.textureSize ? this.textureSize[1] : 1);
      gl.uniform2f(this.compUniforms.uTexel, 1 / this.fieldW, 1 / this.fieldH);
      gl.uniform3fv(this.compUniforms.uTint, hexToRGB(this.options.tint));
      gl.uniform3fv(this.compUniforms.uHighlight, hexToRGB(this.options.highlightColor));
      gl.uniform1f(this.compUniforms.uStrength, this.options.strength);
      gl.uniform1f(this.compUniforms.uSwirl, this.options.swirl);
      gl.uniform1f(this.compUniforms.uDispersion, this.options.dispersion);
      gl.uniform1f(this.compUniforms.uGlint, this.options.glint);
      gl.uniform1f(this.compUniforms.uTintAmount, this.options.tintAmount);
      gl.uniform1f(this.compUniforms.uGrayscale, this.options.grayscale ? 1.0 : 0.0);
      gl.uniform1i(this.compUniforms.uHasTexture, this.hasTexture ? 1 : 0);

      const sPos = gl.getAttribLocation(this.compProgram, 'position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.screenBuffer);
      gl.enableVertexAttribArray(sPos);
      gl.vertexAttribPointer(sPos, 2, gl.FLOAT, false, 0, 0);

      const sUv = gl.getAttribLocation(this.compProgram, 'uv');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.screenUvBuffer);
      gl.enableVertexAttribArray(sUv);
      gl.vertexAttribPointer(sUv, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    stop() {
      this.disposed = true;
      if (this.raf) cancelAnimationFrame(this.raf);
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }
  }

  global.RippleDistortion = RippleDistortion;
  global.initRippleDistortion = function (target, options) {
    return new RippleDistortion(target, options);
  };
})(typeof window !== 'undefined' ? window : this);
