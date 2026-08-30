'use client';

import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Geometry, Triangle, Texture, RenderTarget } from 'ogl';

const MAX_WAVES = 100;
const QUALITY_SCALE = { low: 0.4, medium: 0.7, high: 1 };
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

const hexToRGB = (hex: string) => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map(c => c + c)
          .join('')
      : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export interface RippleDistortionProps {
  src?: string;
  brushSize?: number;
  strength?: number;
  swirl?: number;
  rings?: number;
  spread?: number;
  fade?: number;
  spacing?: number;
  dispersion?: number;
  glint?: number;
  tint?: string;
  tintAmount?: number;
  grayscale?: boolean;
  highlightColor?: string;
  trigger?: 'hover' | 'click';
  clickStrength?: number;
  quality?: 'low' | 'medium' | 'high';
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function RippleDistortion({
  src = 'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=3416&auto=format&fit=crop',
  brushSize = 150,
  strength = 0.2,
  swirl = 1,
  rings = 4,
  spread = 5,
  fade = 3,
  spacing = 15,
  dispersion = 0,
  glint = 0,
  tint = '#a855f7',
  tintAmount = 0.1,
  grayscale = true,
  highlightColor = '#ffffff',
  trigger = 'hover',
  clickStrength = 2,
  quality = 'low',
  enabled = true,
  className = '',
  style
}: RippleDistortionProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<any>({});
  const uniformsRef = useRef<any>(null);

  configRef.current = { brushSize, spread, fade, spacing, clickStrength, trigger, enabled };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new Renderer({
      alpha: false,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    mount.appendChild(canvas);

    const imageTexture = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });

    let disposed = false;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (disposed) return;
      imageTexture.image = image;
      compositeUniforms.uTextureSize.value = [image.naturalWidth || 1, image.naturalHeight || 1];
    };
    image.src = src;

    const offsets = new Float32Array(MAX_WAVES * 2);
    const scales = new Float32Array(MAX_WAVES * 2);
    const opacities = new Float32Array(MAX_WAVES);

    const waves = Array.from({ length: MAX_WAVES }, () => ({
      x: 0,
      y: 0,
      scale: START_SCALE,
      target: START_SCALE,
      size: 1,
      opacity: 0
    }));
    let current = 0;

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]) },
      uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
      iOffset: { instanced: 1, size: 2, data: offsets },
      iScale: { instanced: 1, size: 2, data: scales },
      iOpacity: { instanced: 1, size: 1, data: opacities }
    });

    const waveUniforms = { uRings: { value: rings } };
    const waveProgram = new Program(gl, {
      vertex: waveVertex,
      fragment: waveFragment,
      uniforms: waveUniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false
    });
    waveProgram.setBlendFunc(gl.ONE, gl.ONE);
    const waveMesh = new Mesh(gl, { geometry, program: waveProgram, frustumCulled: false });

    const displacementTarget = new RenderTarget(gl, {
      width: 2,
      height: 2,
      depth: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });

    const compositeUniforms = {
      uTexture: { value: imageTexture },
      uDisplacement: { value: displacementTarget.texture },
      uResolution: { value: [1, 1] },
      uTextureSize: { value: [1, 1] },
      uTexel: { value: [1, 1] },
      uTint: { value: hexToRGB(tint) },
      uHighlight: { value: hexToRGB(highlightColor) },
      uStrength: { value: strength },
      uSwirl: { value: swirl },
      uDispersion: { value: dispersion },
      uGlint: { value: glint },
      uTintAmount: { value: tintAmount },
      uGrayscale: { value: grayscale ? 1 : 0 }
    };

    const compositeMesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {\n        vertex: screenVertex,\n        fragment: compositeFragment,\n        uniforms: compositeUniforms,\n        depthTest: false,\n        depthWrite: false\n      })\n    });\n\n    uniformsRef.current = { wave: waveUniforms, composite: compositeUniforms };\n\n    let width = 1;\n    let height = 1;\n\n    const resize = () => {\n      width = Math.max(1, mount.clientWidth);\n      height = Math.max(1, mount.clientHeight);\n      renderer.setSize(width, height);\n      compositeUniforms.uResolution.value = [width, height];\n\n      const scale = QUALITY_SCALE[quality] || QUALITY_SCALE.high;\n      const fieldW = Math.max(2, Math.round(width * scale));\n      const fieldH = Math.max(2, Math.round(height * scale));\n      displacementTarget.setSize(fieldW, fieldH);\n      compositeUniforms.uTexel.value = [1 / fieldW, 1 / fieldH];\n    };\n\n    const ro = new ResizeObserver(resize);\n    ro.observe(mount);\n    resize();\n\n    const setNewWave = (x: number, y: number, power: number) => {\n      const cfg = configRef.current;\n      const wave = waves[current];\n      current = (current + 1) % MAX_WAVES;\n      wave.x = x;\n      wave.y = y;\n      wave.scale = START_SCALE * power;\n      wave.target = START_SCALE * Math.max(1, cfg.spread) * power;\n      wave.size = Math.max(1, cfg.brushSize);\n      wave.opacity = 1;\n    };\n\n    const localPoint = (clientX: number, clientY: number) => {\n      const rect = mount.getBoundingClientRect();\n      if (rect.width === 0 || rect.height === 0) return null;\n      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {\n        return null;\n      }\n      return [clientX - rect.left, rect.height - (clientY - rect.top)];\n    };\n\n    let previousX = 0;\n    let previousY = 0;\n\n    const onMove = (event: PointerEvent) => {\n      const cfg = configRef.current;\n      if (!cfg.enabled || cfg.trigger === 'click') return;\n      const point = localPoint(event.clientX, event.clientY);\n      if (!point) return;\n      const step = Math.max(1, cfg.spacing);\n      if (Math.abs(point[0] - previousX) > step || Math.abs(point[1] - previousY) > step) {\n        setNewWave(point[0], point[1], 1);\n        previousX = point[0];\n        previousY = point[1];\n      }\n    };\n\n    const onDown = (event: PointerEvent) => {\n      const cfg = configRef.current;\n      if (!cfg.enabled || cfg.trigger === 'hover') return;\n      const point = localPoint(event.clientX, event.clientY);\n      if (!point) return;\n      setNewWave(point[0], point[1], Math.max(1, cfg.clickStrength));\n    };\n\n    window.addEventListener('pointermove', onMove, { passive: true });\n    window.addEventListener('pointerdown', onDown, { passive: true });\n\n    let raf = 0;\n    let previousTime = 0;\n\n    const loop = (now: number) => {\n      raf = requestAnimationFrame(loop);\n      const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0;\n      previousTime = now;\n      const cfg = configRef.current;\n\n      const growth = 1 - Math.exp(-delta * 1.09);\n      const decay = Math.exp((-delta * LIFE_CONSTANT) / Math.max(0.15, cfg.fade));\n\n      for (let i = 0; i < MAX_WAVES; i += 1) {\n        const wave = waves[i];\n        if (wave.opacity <= 0) {\n          opacities[i] = 0;\n          continue;\n        }\n\n        wave.opacity *= decay;\n        wave.scale += (wave.target - wave.scale) * growth;\n\n        if (wave.opacity < 0.002) {\n          wave.opacity = 0;\n          opacities[i] = 0;\n          continue;\n        }\n\n        const half = (wave.scale * wave.size) / 2;\n        offsets[i * 2] = (wave.x / width) * 2 - 1;\n        offsets[i * 2 + 1] = (wave.y / height) * 2 - 1;\n        scales[i * 2] = (half / width) * 2;\n        scales[i * 2 + 1] = (half / height) * 2;\n        opacities[i] = wave.opacity;\n      }\n\n      geometry.attributes.iOffset.needsUpdate = true;\n      geometry.attributes.iScale.needsUpdate = true;\n      geometry.attributes.iOpacity.needsUpdate = true;\n\n      renderer.render({ scene: waveMesh, target: displacementTarget, clear: true });\n      renderer.render({ scene: compositeMesh });\n    };\n    raf = requestAnimationFrame(loop);\n\n    return () => {\n      disposed = true;\n      cancelAnimationFrame(raf);\n      ro.disconnect();\n      window.removeEventListener('pointermove', onMove);\n      window.removeEventListener('pointerdown', onDown);\n      uniformsRef.current = null;\n      if (canvas.parentNode === mount) mount.removeChild(canvas);\n      const ext = gl.getExtension('WEBGL_lose_context');\n      if (ext) ext.loseContext();\n    };\n  }, [src, quality]);\n\n  return <div ref={mountRef} className={`relative w-full h-full overflow-hidden ${className}`.trim()} style={style} />;\n}\n
