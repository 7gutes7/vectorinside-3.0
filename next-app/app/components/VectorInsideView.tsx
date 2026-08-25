import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import BackgroundVideo from './BackgroundVideo';

export default function VectorInsideView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Basic Three.js setup for 3D model canvas placeholder
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const light = new THREE.DirectionalLight(0xa4a1ff, 2);
    light.position.set(2, 2, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 1));

    // Simple glowing icosahedron fallback if GLTF model is loading
    const geometry = new THREE.IcosahedronGeometry(1.2, 1);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xa4a1ff,
      metalness: 0.75,
      roughness: 0.25,
      clearcoat: 1.0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      mesh.rotation.y += 0.005;
      mesh.rotation.x += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvas) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    // Contenedor principal con 'relative', 'bg-black' y 'overflow-hidden'
    <main className="relative bg-black h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black">
      
      {/* 2. El video de fondo (Capa base absoluta z-0) */}
      <BackgroundVideo />

      {/* 3. Tu barra de navegación (z-20 para estar por encima del video) */}
      <nav className="relative z-20 px-6 py-6 w-full">
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg tracking-wider">VECTOR INSIDE</span>
          </div>
        </div>
      </nav>

      {/* 4. Tu contenido central, textos y modelo 3D (z-10) */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto w-full gap-6">
        <p className="text-white/80 text-[10px] md:text-[11px] font-medium tracking-[0.2em] uppercase">
          ACELERACIÓN DIGITAL // DISEÑO DESDE EL NÚCLEO
        </p>

        <h1 
          style={{ fontFamily: "'Instrument Serif', serif" }}
          className="text-4xl md:text-[64px] font-medium tracking-[-0.01em] leading-[1.1] bg-gradient-to-b from-white via-white/95 to-white/70 bg-clip-text text-transparent max-w-4xl"
        >
          DISEÑAMOS INSTINTO.<br className="hidden md:block" />
          TU MARCA EL ÚNICO DESTINO.
        </h1>

        <p className="text-white/70 text-sm md:text-base max-w-xl font-light">
          Firma de arquitectura integral de crecimiento para empresas, líderes y proyectos creativos.
        </p>

        {/* Canvas del modelo 3D actual */}
        <div className="w-full max-w-md h-48 sm:h-56 relative flex items-center justify-center">
          <canvas ref={canvasRef} id="hero-3d-canvas" className="w-full h-full object-contain" />
        </div>
      </section>

    </main>
  );
}
