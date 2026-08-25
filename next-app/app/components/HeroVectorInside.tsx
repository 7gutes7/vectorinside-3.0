import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

// 1. Componente del Video de Fondo HLS (Mux)
function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const videoSrc = '/background.mp4';

    video.muted = true;
    video.playsInline = true;
    video.src = videoSrc;
    video.play().catch((err) => console.log("Autoplay background.mp4:", err));

  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// 2. Vista Principal del Hero
export default function HeroVectorInside() {
  return (
    <main className="relative bg-black h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black">
      
      {/* El video de fondo como primera capa absoluta */}
      <BackgroundVideo />

      {/* Navbar (Capa superior z-20) */}
      <nav className="relative z-20 px-6 py-6 w-full">
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto border border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg tracking-wider">VECTOR INSIDE</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-white/80 text-sm font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>
        </div>
      </nav>

      {/* Contenido Central del Hero (Capa intermedia z-10) */}
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

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <button className="px-10 py-3 text-[14px] font-medium border border-white/10 rounded-full hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 text-white/90 backdrop-blur-sm cursor-pointer bg-white/10">
            SOLICITAR DIAGNÓSTICO VECTOR
          </button>
        </div>
      </section>

    </main>
  );
}
