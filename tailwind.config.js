module.exports = {
  content: [
    './index.html',
    './diagnostico/*.html',
    './ecosistema/*.html',
    './ejecucion/*.html',
    './evidencia/*.html',
    './manifiesto/*.html',
    './metodologia/*.html',
    './script.js',
    './AccordionGallery.js',
    './DepthCarousel.js',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'vector-black': '#080808',
        'vector-lime': '#c3f400',
        'operative-purple': '#9d4edd',
        'operative-purple-dark': '#6f00be',
        'cognitive-blue': '#433dae',
        'surface-dark': '#131313',
        'surface-high': '#201f1f',
        'text-muted': '#c4c9ac',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
