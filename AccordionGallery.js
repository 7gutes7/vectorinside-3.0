/**
 * AccordionGallery.js
 * Vanilla JavaScript + GSAP implementation of React Bits <AccordionGallery />
 * https://reactbits.dev/components/accordion-gallery
 * 
 * Features:
 * - 3D Perspective Accordion Panels with smooth GSAP animations
 * - 5-by-5 Pagination ("de 5 en 5") with arrows and indicators
 * - Parallax internal image drift & dynamic grayscale to full color transitions
 * - Category filter integration and cyber-brutalist telemetry HUD
 */

(function (global) {
  'use strict';

  class AccordionGallery {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.getElementById(container) : container;
      if (!this.container) {
        console.error('AccordionGallery: Container element not found.');
        return;
      }

      this.allItems = options.items || [];
      this.filteredItems = [...this.allItems];
      this.pageSize = options.pageSize || 5; // "ver de 5 en 5"
      this.currentPage = 0;
      this.activePanelIndex = options.defaultIndex !== undefined ? options.defaultIndex : 2;

      // React Bits Options
      this.cfg = Object.assign(
        {
          defaultIndex: 2,
          accentColor: '#c3f400',
          overlayColor: '#060010',
          textColor: '#ffffff',
          height: 460,
          gap: 12,
          radius: 16,
          expandRatio: 0.52,
          orientation: 'horizontal',
          duration: 0.6,
          ease: 'power3.out',
          parallax: 0.5,
          tilt: 8,
          stagger: 0.06,
          trigger: 'hover', // 'hover' | 'click'
          showLabels: true,
          grayscale: true,
          showPagination: true,
          onCardClick: null
        },
        options
      );

      this.tl = null;
      this.firstRun = true;
      this.mediaSize = 420;

      this.initDOM();
      this.initEvents();
      this.updatePage(0, false);
    }

    getCurrentPageItems() {
      const start = this.currentPage * this.pageSize;
      return this.filteredItems.slice(start, start + this.pageSize);
    }

    getTotalPages() {
      return Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
    }

    initDOM() {
      this.container.innerHTML = '';
      this.container.classList.add('accordion-gallery-wrapper');

      // 1. Accordion Row
      this.galleryEl = document.createElement('div');
      this.galleryEl.className = `accordion-gallery${this.cfg.orientation === 'vertical' ? ' accordion-gallery--vertical' : ''}`;
      this.galleryEl.style.setProperty('--ag-accent', this.cfg.accentColor);
      this.galleryEl.style.setProperty('--ag-overlay', this.cfg.overlayColor);
      this.galleryEl.style.setProperty('--ag-text', this.cfg.textColor);
      this.galleryEl.style.setProperty('--ag-gap', `${this.cfg.gap}px`);
      this.galleryEl.style.setProperty('--ag-radius', `${this.cfg.radius}px`);
      this.galleryEl.style.height = `${this.cfg.height}px`;
      this.galleryEl.setAttribute('role', 'list');
      this.galleryEl.setAttribute('aria-label', 'Accordion gallery');

      this.container.appendChild(this.galleryEl);

      // 2. Navigation Bar (Flechas para ver de 5 en 5 e indicadores)
      if (this.cfg.showPagination) {
        this.createPaginationBar();
      }
    }

    createPaginationBar() {
      this.navBar = document.createElement('div');
      this.navBar.className = 'accordion-nav-bar flex flex-col items-center justify-center gap-2.5 w-full max-w-7xl mx-auto pt-3 pb-1 select-none z-30 relative';

      // Center Cluster: [ Prev Arrow ] [ Indicators Dots ] [ Next Arrow ] centered directly under the middle card
      const centerCluster = document.createElement('div');
      centerCluster.className = 'flex items-center gap-4 bg-[#0a0713]/90 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-[0_12px_35px_rgba(0,0,0,0.85)]';

      this.prevBtn = document.createElement('button');
      this.prevBtn.className = 'accordion-nav-btn';
      this.prevBtn.setAttribute('aria-label', 'Página anterior (5 anteriores)');
      this.prevBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>`;
      this.prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prevPage();
      });

      // Center: Dots
      this.dotsContainer = document.createElement('div');
      this.dotsContainer.className = 'accordion-page-indicator flex items-center gap-2 px-2';

      this.nextBtn = document.createElement('button');
      this.nextBtn.className = 'accordion-nav-btn';
      this.nextBtn.setAttribute('aria-label', 'Página siguiente (5 siguientes)');
      this.nextBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>`;
      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.nextPage();
      });

      centerCluster.appendChild(this.prevBtn);
      centerCluster.appendChild(this.dotsContainer);
      centerCluster.appendChild(this.nextBtn);

      // Module Counter Text
      this.counterEl = document.createElement('div');
      this.counterEl.className = 'font-mono text-[11px] text-text-muted font-bold tracking-wider text-center';
      this.updateCounterText();

      this.navBar.appendChild(centerCluster);
      this.navBar.appendChild(this.counterEl);

      this.container.appendChild(this.navBar);
    }

    updateCounterText() {
      if (!this.counterEl) return;
      const totalPages = this.getTotalPages();
      const currentItems = this.getCurrentPageItems();
      const startIdx = this.currentPage * this.pageSize + 1;
      const endIdx = this.currentPage * this.pageSize + currentItems.length;
      const totalCount = this.filteredItems.length;

      this.counterEl.innerHTML = `
        <span class="text-vector-lime font-bold">BLOQUES ${startIdx} – ${endIdx}</span>
        <span class="text-neutral-500">// TOTAL: ${totalCount} MÓDULOS (PÁG. ${this.currentPage + 1}/${totalPages})</span>
      `;
    }

    updateDots() {
      if (!this.dotsContainer) return;
      this.dotsContainer.innerHTML = '';
      const totalPages = this.getTotalPages();

      for (let p = 0; p < totalPages; p++) {
        const dot = document.createElement('button');
        dot.className = `accordion-dot ${p === this.currentPage ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Ir a página ${p + 1}`);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.goToPage(p);
        });
        this.dotsContainer.appendChild(dot);
      }

      if (this.prevBtn) this.prevBtn.disabled = this.currentPage === 0;
      if (this.nextBtn) this.nextBtn.disabled = this.currentPage >= totalPages - 1;
    }

    renderCurrentPagePanels() {
      this.galleryEl.innerHTML = '';
      this.panelRefs = [];
      this.mediaRefs = [];
      this.barRefs = [];
      this.textRefs = [];

      const pageItems = this.getCurrentPageItems();
      const count = pageItems.length;
      if (this.activePanelIndex >= count) {
        this.activePanelIndex = Math.floor(count / 2);
      }

      pageItems.forEach((item, i) => {
        const isActive = i === this.activePanelIndex;
        const panel = document.createElement('div');
        panel.className = `ag-panel${isActive ? ' ag-panel--active' : ''}`;
        panel.style.borderRadius = `${this.cfg.radius}px`;
        panel.setAttribute('role', 'listitem');
        panel.setAttribute('tabindex', '0');
        panel.setAttribute('data-index', i);
        if (isActive) panel.setAttribute('aria-current', 'true');

        const imageSrc = item.image || item.src || '';
        const label = item.label || item.title || `Item ${i + 1}`;
        const code = item.code || '';
        const category = item.category || '';
        const color = item.color || '#c3f400';

        panel.innerHTML = `
          <span class="ag-panel__frame">
            <span class="ag-panel__media">
              <img src="${imageSrc}" alt="${item.alt || label}" draggable="false" loading="lazy" decoding="async" />
            </span>
            <span class="ag-panel__overlay" aria-hidden="true"></span>
          </span>

          <!-- Top Code & Category Badges -->
          <div class="ag-panel__badge flex items-center gap-2">
            ${code ? `<span class="font-mono text-[10px] font-bold text-white bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 shadow-sm">${code}</span>` : ''}
            <div class="w-2.5 h-2.5 rounded-full border border-black/50 shadow-[0_0_10px_${color}]" style="background-color: ${color}"></div>
          </div>

          ${this.cfg.showLabels ? `
            <span class="ag-panel__label" aria-hidden="true">
              <div class="ag-panel__label-header">
                <span class="ag-panel__bar" style="background-color: ${color}"></span>
                <span class="ag-panel__text">${label}</span>
              </div>

              <!-- Expanded Details (Revealed smoothly on expanded panel) -->
              <div class="ag-panel__details">
                ${category ? `<span class="font-mono text-[9px] uppercase tracking-widest font-bold block mb-1" style="color: ${color}">// ${category}</span>` : ''}
                ${item.desc ? `<p class="font-body text-[11px] text-neutral-300 leading-snug line-clamp-2">${item.desc}</p>` : ''}
                ${item.kpi1 ? `
                  <div class="grid grid-cols-3 gap-1.5 font-mono text-[9px] pt-2 mt-1 border-t border-white/10">
                    <div class="bg-black/70 p-1 rounded border border-white/10 text-center">
                      <span class="text-text-muted block text-[8px]">ACEL.</span>
                      <span class="text-vector-lime font-bold">${item.kpi1}</span>
                    </div>
                    <div class="bg-black/70 p-1 rounded border border-white/10 text-center">
                      <span class="text-text-muted block text-[8px]">ROI</span>
                      <span class="text-white font-bold">${item.kpi2 || '-'}</span>
                    </div>
                    <div class="bg-black/70 p-1 rounded border border-white/10 text-center">
                      <span class="text-text-muted block text-[8px]">TIEMPO</span>
                      <span class="text-white font-bold">${item.kpi3 || '-'}</span>
                    </div>
                  </div>
                ` : ''}
              </div>
            </span>
          ` : ''}
        `;

        const media = panel.querySelector('.ag-panel__media');
        const bar = panel.querySelector('.ag-panel__bar');
        const text = panel.querySelector('.ag-panel__text');

        this.panelRefs.push(panel);
        this.mediaRefs.push(media);
        this.barRefs.push(bar);
        this.textRefs.push(text);

        // Interaction Handlers
        panel.addEventListener('mouseenter', () => {
          if (this.cfg.trigger === 'hover') {
            this.setActive(i);
          }
        });

        panel.addEventListener('click', (e) => {
          if (this.activePanelIndex !== i) {
            e.preventDefault();
            this.setActive(i);
          } else if (typeof this.cfg.onCardClick === 'function') {
            this.cfg.onCardClick(item, i);
          }
        });

        panel.addEventListener('focus', () => this.setActive(i));

        this.galleryEl.appendChild(panel);
      });
    }

    measure() {
      if (!this.galleryEl) return;
      const rect = this.galleryEl.getBoundingClientRect();
      const vertical = this.cfg.orientation === 'vertical';
      const total = vertical ? rect.height : rect.width;
      const count = this.getCurrentPageItems().length;
      const usable = Math.max(total - this.cfg.gap * (count - 1), 120);
      const r = Math.min(Math.max(this.cfg.expandRatio, 0.2), 0.9);
      const size = Math.max(140, usable * r * 1.22);
      this.mediaSize = size;
      this.galleryEl.style.setProperty('--ag-media-size', `${size}px`);
      this.applyLayout(!this.firstRun);
    }

    applyLayout(animate = true) {
      if (!this.panelRefs || !this.panelRefs.length) return;
      const count = this.panelRefs.length;
      const active = this.activePanelIndex;
      const vertical = this.cfg.orientation === 'vertical';
      const r = Math.min(Math.max(this.cfg.expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      const mediaSize = this.mediaSize;

      const prefersReduced =
        typeof window !== 'undefined' && window.matchMedia
          ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
          : false;

      if (this.tl) this.tl.kill();
      const dur = animate && !prefersReduced ? this.cfg.duration : 0;
      const tl = typeof gsap !== 'undefined' ? gsap.timeline() : null;

      this.panelRefs.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const media = this.mediaRefs[i];
        const bar = this.barRefs[i];
        const text = this.textRefs[i];

        if (isActive) {
          panel.classList.add('ag-panel--active');
          panel.setAttribute('aria-current', 'true');
        } else {
          panel.classList.remove('ag-panel--active');
          panel.removeAttribute('aria-current');
        }

        const rot = isActive ? 0 : i < active ? this.cfg.tilt : -this.cfg.tilt;
        const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot };

        if (tl) {
          tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease: this.cfg.ease }, 0);

          if (media) {
            const drift = Math.max(-1.5, Math.min(1.5, active - i));
            const shift = drift * this.cfg.parallax * mediaSize * 0.06;
            const gray = this.cfg.grayscale ? (isActive ? 0 : 1) : 0;
            tl.to(
              media,
              {
                xPercent: -50,
                yPercent: -50,
                x: vertical ? 0 : isActive ? 0 : shift,
                y: vertical ? (isActive ? 0 : shift) : 0,
                '--ag-gray': gray,
                '--ag-dim': isActive ? 0 : 0.35,
                duration: dur,
                ease: this.cfg.ease
              },
              0
            );
          }

          if (this.cfg.showLabels && bar && text) {
            if (isActive) {
              tl.to([bar, text], { opacity: 1, x: 0, duration: dur, ease: this.cfg.ease, stagger: prefersReduced ? 0 : this.cfg.stagger }, 0);
            } else {
              tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease: this.cfg.ease }, 0);
            }
          }
        } else {
          panel.style.flexGrow = isActive ? grow : 1;
          panel.style.transform = `rotateY(${rot}deg)`;
          if (media) {
            media.style.filter = `grayscale(${isActive ? 0 : 1})`;
          }
          if (bar && text) {
            bar.style.opacity = isActive ? '1' : '0';
            text.style.opacity = isActive ? '1' : '0';
          }
        }
      });

      this.tl = tl;
    }

    setActive(index) {
      if (index === this.activePanelIndex) return;
      this.activePanelIndex = index;
      this.applyLayout(true);
    }

    updatePage(pageIndex, animate = true) {
      const totalPages = this.getTotalPages();
      this.currentPage = Math.max(0, Math.min(pageIndex, totalPages - 1));
      this.activePanelIndex = Math.min(this.cfg.defaultIndex, this.pageSize - 1);

      this.renderCurrentPagePanels();
      this.updateCounterText();
      this.updateDots();
      this.measure();
    }

    nextPage() {
      if (this.currentPage < this.getTotalPages() - 1) {
        this.updatePage(this.currentPage + 1, true);
      }
    }

    prevPage() {
      if (this.currentPage > 0) {
        this.updatePage(this.currentPage - 1, true);
      }
    }

    goToPage(page) {
      this.updatePage(page, true);
    }

    setFilter(category) {
      if (!category || category === 'all') {
        this.filteredItems = [...this.allItems];
      } else {
        this.filteredItems = this.allItems.filter(item => (item.category || '').toLowerCase() === category.toLowerCase());
      }
      this.currentPage = 0;
      this.updatePage(0, true);
    }

    initEvents() {
      window.addEventListener('resize', () => this.measure());

      if (window.ResizeObserver && this.galleryEl) {
        this.ro = new ResizeObserver(() => this.measure());
        this.ro.observe(this.galleryEl);
      }

      // Keyboard navigation for panels
      window.addEventListener('keydown', (e) => {
        const rect = this.container.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const count = this.getCurrentPageItems().length;
          if (e.key === 'ArrowRight') {
            if (this.activePanelIndex < count - 1) {
              this.setActive(this.activePanelIndex + 1);
            } else {
              this.nextPage();
            }
          } else if (e.key === 'ArrowLeft') {
            if (this.activePanelIndex > 0) {
              this.setActive(this.activePanelIndex - 1);
            } else {
              this.prevPage();
            }
          }
        }
      });
    }

    destroy() {
      if (this.tl) this.tl.kill();
      if (this.ro) this.ro.disconnect();
      this.container.innerHTML = '';
    }
  }

  global.AccordionGallery = AccordionGallery;

})(typeof window !== 'undefined' ? window : this);
