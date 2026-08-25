import React from 'react';
import BackgroundVideo from './BackgroundVideo';

export default function HeroSection() {
  return (
    <main className="relative bg-black h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black">
      
      {/* 1. Fondo de video (Capa base absoluta detrás de todo) */}
      <BackgroundVideo />

      {/* 2. Navbar (Encima del video con z-index superior) */}
      <nav className="relative z-20 px-6 py-6 w-full">
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
          {/* Contenido de tu Navbar */}
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg tracking-wider">VECTOR INSIDE</span>
          </div>
        </div>
      </nav>

      {/* 3. Contenido Central del Hero (Alineado a 100vh sin paddings que provoquen scroll) */}
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
          Firma de arquitectura integral de crecimiento para empresas, líderes y proyectos creativos que buscan dejar de operar desde la improvisación.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <button className="px-10 py-3 text-[14px] font-medium border border-white/10 rounded-full hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 text-white/90 backdrop-blur-sm cursor-pointer bg-white/10">
            SOLICITAR DIAGNÓSTICO VECTOR
          </button>
          <button className="px-8 py-3 text-[14px] font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
            EXPLORAR ECOSISTEMA
          </button>
        </div>

      </section>
    </main>
  );
}
