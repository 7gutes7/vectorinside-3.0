import React from 'react';
import BackgroundVideo from './BackgroundVideo';

export default function VectorInsideHero() {
  return (
    <main className="relative bg-black h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black">
      
      {/* 1. Fondo de video (Capa base absoluta detrás de todo) */}
      <BackgroundVideo />

      {/* 2. Navbar (Encima del video con z-index superior) */}
      <nav className="relative z-20 px-6 py-6 w-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/headerlogo.png" alt="Vector Inside Logo" className="h-9 w-auto object-contain" />
        </div>
        <div className="hidden md:flex items-center space-x-8 font-mono text-xs tracking-widest text-white/80 uppercase">
          <a href="#ecosistema" className="hover:text-vector-lime transition-colors">Ecosistema</a>
          <a href="#evidencia-ejecucion" className="hover:text-vector-lime transition-colors">Ejecución</a>
          <a href="#friccion" className="hover:text-vector-lime transition-colors">Manifiesto</a>
          <a href="#evidencia" className="hover:text-vector-lime transition-colors">Evidencia</a>
          <a href="#metodologia" className="hover:text-vector-lime transition-colors">Metodología</a>
        </div>
        <button className="px-5 py-2.5 rounded-full border border-white/20 bg-white/10 text-white font-mono text-xs tracking-widest uppercase hover:bg-white/20 transition-all">
          Solicitar Diagnóstico
        </button>
      </nav>

      {/* 3. Contenido Central del Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto w-full gap-6">
        
        <p className="text-white/80 text-[10px] md:text-[11px] font-medium tracking-[0.2em] uppercase">
          ACELERACIÓN DIGITAL // DISEÑO DESDE EL NÚCLEO
        </p>

        <h1 
          className="text-4xl md:text-[64px] font-black tracking-tighter uppercase leading-[1.1] text-white max-w-4xl"
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
