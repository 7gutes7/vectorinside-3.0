/**
 * Official React Bits Topography Component
 * Living contour map with glowing, elevation-tinted lines & mouse interaction.
 * Registered globally as: window.Topography & window.initTopography
 */
(function (global) {
  const hexToRgb = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
  };

  const colorModeToFloat = mode => {
    if (mode === 'uniform') return 1.0;
    if (mode === 'alternating') return 2.0;
    return 0.0;
  };

  const vertex = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragment = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uMorphAmount;
    uniform float uBands;
    uniform float uThickness;
    uniform float uScale;
    uniform float uPixelSize;
    uniform float uGlow;
    uniform float uColorMode;
    uniform float uContrast;
    uniform float uBrightness;
    uniform float uFillBands;
    uniform float uOpacity;
    uniform float uLightMode;
    uniform vec3 uLow;
    uniform vec3 uMid;
    uniform vec3 uHigh;
    uniform vec2 uMouse;
    uniform float uMouseEnabled;
    uniform float uMouseRadius;
    uniform float uMouseStrength;
    uniform float uMouseActive;
    uniform float uGrain;
    uniform float uGrainIntensity;
    uniform vec4 uCtrlA;
    uniform vec4 uCtrlB;
    uniform vec4 uCtrlC;
    uniform vec4 uCtrlD;

    float bez(float t, vec4 c) {
      float w = 6.2831853 * t;
      return 0.5 * (c.x * sin(w) + c.y * cos(w) + c.z * sin(2.0 * w) + c.w * cos(2.0 * w));
    }

    float field(vec2 uv) {
      vec2 a = vec2(bez(uv.x, uCtrlA), bez(uv.x, uCtrlB));
      vec2 b = vec2(bez(uv.y, uCtrlC), bez(uv.y, uCtrlD));
      return distance(a, b);
    }

    vec3 elevationColor(float e) {
      vec3 c = mix(uLow, uMid, smoothstep(0.0, 0.5, e));
      c = mix(c, uHigh, smoothstep(0.5, 1.0, e));
      return c;
    }

    void main() {
      vec2 res = iResolution.xy;
      vec2 uv = gl_FragCoord.xy / res;

      vec2 suv = (uv - 0.5) / max(uScale, 0.001) + 0.5;

      vec2 sampleUv = suv;
      if (uPixelSize > 1.0) {
        vec2 px = res / uPixelSize;
        sampleUv = (floor(suv * px) + 0.5) / px;
      }

      float fv = field(sampleUv);

      if (uMouseEnabled > 0.5) {
        vec2 d = uv - uMouse;
        d.x *= res.x / max(res.y, 1.0);
        float r = max(uMouseRadius, 0.001);
        float bump = exp(-dot(d, d) / (r * r)) * uMouseStrength * uMouseActive;
        fv += bump;
      }

      float f = fv * uBands;
      float frac = fract(f);
      float lineDist = min(frac, 1.0 - frac);

      // Derivative anti-aliasing
      float aa = 0.0035;
      float mask = 1.0 - smoothstep(uThickness - aa, uThickness + aa, lineDist);

      float glowR = uThickness + uGlow * 0.5 + aa;
      float glow = (1.0 - smoothstep(uThickness, glowR, lineDist)) * step(0.0001, uGlow);

      float elev = clamp(fv / (uMorphAmount * 2.5 + 0.001), 0.0, 1.0);

      vec3 lineCol;
      if (uColorMode < 0.5) {
        lineCol = elevationColor(elev);
      } else if (uColorMode < 1.5) {
        lineCol = uMid;
      } else {
        float parity = mod(floor(f), 2.0);
        lineCol = mix(uMid, uHigh, parity);
      }

      float coverage = clamp(mask + glow * 0.55, 0.0, 1.0);
      coverage = pow(coverage, max(uContrast, 0.001));

      vec3 outColor = lineCol;
      float outAlpha = coverage;

      if (uFillBands > 0.5) {
        vec3 fillCol = elevationColor(elev);
        float fillA = 0.1 * elev;
        outColor = mix(fillCol, lineCol, coverage);
        outAlpha = clamp(coverage + fillA, 0.0, 1.0);
      }

      if (uGrain > 0.5) {
        float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
        outAlpha += (g - 0.5) * uGrainIntensity;
      }

      outColor *= uBrightness;
      outColor = clamp(outColor, 0.0, 1.0);

      float a = clamp(outAlpha, 0.0, 1.0) * uOpacity;
      if (uLightMode > 0.5) {
        float peak = max(outColor.r, max(outColor.g, outColor.b));
        vec3 chroma = pow(clamp(outColor / max(peak, 0.0001), 0.0, 1.0), vec3(1.18));
        gl_FragColor = vec4(mix(vec3(1.0), chroma, a * 0.94), 1.0);
      } else {
        gl_FragColor = vec4(outColor * a, a);
      }
    }
  `;

  const CTRL_INDICES = [
    [1, -2, 3, -4],
    [9, -8, 7, -6],
    [5, 2, 5, -5],
    [-1, -3, 8, 9]
  ];

  class Topography {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) return;

      this.options = Object.assign({
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
        mouseStrength: 0.4,
        lightMode: false
      }, options);

      this.currentMouse = [0.5, 0.5];
      this.targetMouse = [0.5, 0.5];
      this.mouseActive = 0;
      this.mouseActiveTarget = 0;
      this.raf = 0;
      this.disposed = false;
      this.t0 = performance.now();

      this.ctrlArrays = [
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([0, 0, 0, 0])
      ];

      this.init();
    }

    init() {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'topography-canvas';
      this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0;';
      this.container.appendChild(this.canvas);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;

      this.gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!this.gl) {
        console.warn('Topography: WebGL not supported');
        return;
      }

      const gl = this.gl;
      this.prog = this.createProgram(vertex, fragment);

      // Quad geometry
      this.posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  3, -1, -1,  3
      ]), gl.STATIC_DRAW);

      this.uniforms = {
        iResolution: gl.getUniformLocation(this.prog, 'iResolution'),
        iTime: gl.getUniformLocation(this.prog, 'iTime'),
        uMorphAmount: gl.getUniformLocation(this.prog, 'uMorphAmount'),
        uBands: gl.getUniformLocation(this.prog, 'uBands'),
        uThickness: gl.getUniformLocation(this.prog, 'uThickness'),
        uScale: gl.getUniformLocation(this.prog, 'uScale'),
        uPixelSize: gl.getUniformLocation(this.prog, 'uPixelSize'),
        uGlow: gl.getUniformLocation(this.prog, 'uGlow'),
        uColorMode: gl.getUniformLocation(this.prog, 'uColorMode'),
        uContrast: gl.getUniformLocation(this.prog, 'uContrast'),
        uBrightness: gl.getUniformLocation(this.prog, 'uBrightness'),
        uFillBands: gl.getUniformLocation(this.prog, 'uFillBands'),
        uOpacity: gl.getUniformLocation(this.prog, 'uOpacity'),
        uLightMode: gl.getUniformLocation(this.prog, 'uLightMode'),
        uGrain: gl.getUniformLocation(this.prog, 'uGrain'),
        uGrainIntensity: gl.getUniformLocation(this.prog, 'uGrainIntensity'),
        uLow: gl.getUniformLocation(this.prog, 'uLow'),
        uMid: gl.getUniformLocation(this.prog, 'uMid'),
        uHigh: gl.getUniformLocation(this.prog, 'uHigh'),
        uMouse: gl.getUniformLocation(this.prog, 'uMouse'),
        uMouseEnabled: gl.getUniformLocation(this.prog, 'uMouseEnabled'),
        uMouseRadius: gl.getUniformLocation(this.prog, 'uMouseRadius'),
        uMouseStrength: gl.getUniformLocation(this.prog, 'uMouseStrength'),
        uMouseActive: gl.getUniformLocation(this.prog, 'uMouseActive'),
        uCtrlA: gl.getUniformLocation(this.prog, 'uCtrlA'),
        uCtrlB: gl.getUniformLocation(this.prog, 'uCtrlB'),
        uCtrlC: gl.getUniformLocation(this.prog, 'uCtrlC'),
        uCtrlD: gl.getUniformLocation(this.prog, 'uCtrlD')
      };

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
        console.error('Topography shader error:', gl.getShaderInfoLog(s));
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
        console.error('Topography program link error:', gl.getProgramInfoLog(p));
      }
      return p;
    }

    bindEvents() {
      const onMove = e => {
        const rect = this.container.getBoundingClientRect();
        this.targetMouse[0] = (e.clientX - rect.left) / rect.width;
        this.targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
        this.mouseActiveTarget = 1;
      };

      const onLeave = () => {
        this.mouseActiveTarget = 0;
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    loop(t) {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(this.loop);

      const time = (t - this.t0) * 0.001;
      const ma = this.options.morphAmount;
      const sp = this.options.speed;
      const msp = this.options.morphSpeed;

      for (let g = 0; g < 4; g++) {
        const arr = this.ctrlArrays[g];
        const idx = CTRL_INDICES[g];
        for (let j = 0; j < 4; j++) {
          const i = idx[j];
          arr[j] = ma * Math.sin(time * sp * Math.sin(i * msp) + i);
        }
      }

      this.currentMouse[0] += 0.05 * (this.targetMouse[0] - this.currentMouse[0]);
      this.currentMouse[1] += 0.05 * (this.targetMouse[1] - this.currentMouse[1]);
      this.mouseActive += 0.05 * (this.mouseActiveTarget - this.mouseActive);

      this.render(time);
    }

    render(time) {
      const gl = this.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this.prog);

      gl.uniform2f(this.uniforms.iResolution, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.uniforms.iTime, time);
      gl.uniform1f(this.uniforms.uMorphAmount, this.options.morphAmount);
      gl.uniform1f(this.uniforms.uBands, this.options.bands);
      gl.uniform1f(this.uniforms.uThickness, this.options.thickness);
      gl.uniform1f(this.uniforms.uScale, this.options.scale);
      gl.uniform1f(this.uniforms.uPixelSize, this.options.pixelSize);
      gl.uniform1f(this.uniforms.uGlow, this.options.glow);
      gl.uniform1f(this.uniforms.uColorMode, colorModeToFloat(this.options.colorMode));
      gl.uniform1f(this.uniforms.uContrast, this.options.contrast);
      gl.uniform1f(this.uniforms.uBrightness, this.options.brightness);
      gl.uniform1f(this.uniforms.uFillBands, this.options.fillBands ? 1.0 : 0.0);
      gl.uniform1f(this.uniforms.uOpacity, this.options.opacity);
      gl.uniform1f(this.uniforms.uLightMode, this.options.lightMode ? 1.0 : 0.0);
      gl.uniform1f(this.uniforms.uGrain, this.options.grain ? 1.0 : 0.0);
      gl.uniform1f(this.uniforms.uGrainIntensity, this.options.grainIntensity);

      gl.uniform3fv(this.uniforms.uLow, hexToRgb(this.options.lowColor));
      gl.uniform3fv(this.uniforms.uMid, hexToRgb(this.options.midColor));
      gl.uniform3fv(this.uniforms.uHigh, hexToRgb(this.options.highColor));

      gl.uniform2fv(this.uniforms.uMouse, this.currentMouse);
      gl.uniform1f(this.uniforms.uMouseEnabled, this.options.mouseInteraction ? 1.0 : 0.0);
      gl.uniform1f(this.uniforms.uMouseRadius, this.options.mouseRadius);
      gl.uniform1f(this.uniforms.uMouseStrength, this.options.mouseStrength);
      gl.uniform1f(this.uniforms.uMouseActive, this.mouseActive);

      gl.uniform4fv(this.uniforms.uCtrlA, this.ctrlArrays[0]);
      gl.uniform4fv(this.uniforms.uCtrlB, this.ctrlArrays[1]);
      gl.uniform4fv(this.uniforms.uCtrlC, this.ctrlArrays[2]);
      gl.uniform4fv(this.uniforms.uCtrlD, this.ctrlArrays[3]);

      const aPos = gl.getAttribLocation(this.prog, 'position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

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

  global.Topography = Topography;
  global.initTopography = function (target, options) {
    return new Topography(target, options);
  };
})(typeof window !== 'undefined' ? window : this);
