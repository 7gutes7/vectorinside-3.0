/**
 * DepthCarousel.js
 * 1:1 Implementation of React Bits DepthCarousel
 * https://reactbits.dev/components/depth-carousel
 * 
 * High-performance 3D perspective rail carousel with depth falloff,
 * angular tilt, blur layering, gesture drag, and cyber-brutalist telemetry.
 */

(function (global) {
  'use strict';

  class DepthCarousel {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.getElementById(container) : container;
      if (!this.container) {
        console.error('DepthCarousel: Container element not found.');
        return;
      }

      this.rawItems = options.items || [];
      this.filteredItems = [...this.rawItems];
      this.currentIndex = 0;

      // 1:1 React Bits Options Schema
      this.cfg = Object.assign(
        {
          depth: 220,
          spread: 90,
          tilt: 22,
          tiltDirection: 'right', // 'right' | 'left'
          perspective: 1400,
          visibleCards: 4,
          falloff: 0.2,
          blur: 6,
          autoplay: false,
          loop: true,
          cardWidth: 300,
          cardHeight: 380,
          radius: 18,
          tint: '#05060a',
          duration: 700,
          ease: 'cubic-bezier(0.215, 0.61, 0.355, 1)', // power3.out
          autoplayDelay: 3200,
          showControls: true,
          showIndicators: true,
          onCardClick: null,
          onChange: null
        },
        options
      );

      this.isDragging = false;
      this.startX = 0;
      this.currentDragX = 0;
      this.dragOffset = 0;
      this.autoplayTimer = null;

      this.initDOM();
      this.initEvents();
      this.update(true);

      if (this.cfg.autoplay) {
        this.startAutoplay();
      }
    }

    initDOM() {
      this.container.innerHTML = '';
      this.container.classList.add('reactbits-depth-carousel');
      this.container.style.position = 'relative';
      this.container.style.width = '100%';
      this.container.style.height = '100%';
      this.container.style.minHeight = `${this.cfg.cardHeight + 110}px`;
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'column';
      this.container.style.alignItems = 'center';
      this.container.style.justifyContent = 'center';
      this.container.style.overflow = 'hidden';
      this.container.style.userSelect = 'none';

      // 3D Perspective Stage
      this.stage = document.createElement('div');
      this.stage.className = 'depth-carousel-stage';
      this.stage.style.position = 'relative';
      this.stage.style.width = '100%';
      this.stage.style.height = `${this.cfg.cardHeight + 40}px`;
      this.stage.style.perspective = `${this.cfg.perspective}px`;
      this.stage.style.perspectiveOrigin = '50% 50%';
      this.stage.style.transformStyle = 'preserve-3d';
      this.stage.style.display = 'flex';
      this.stage.style.alignItems = 'center';
      this.stage.style.justifyContent = 'center';
      this.container.appendChild(this.stage);

      // Render Cards
      this.cardNodes = [];
      this.renderCards();

      // Controls (Arrows)
      if (this.cfg.showControls) {
        this.createControls();
      }

      // Indicators
      if (this.cfg.showIndicators) {
        this.createIndicators();
      }
    }

    renderCards() {
      this.stage.innerHTML = '';
      this.cardNodes = [];

      const screenW = window.innerWidth;
      const isMobile = screenW < 640;
      const cardW = isMobile ? Math.min(270, screenW * 0.75) : this.cfg.cardWidth;
      const cardH = isMobile ? Math.round(cardW * 1.28) : this.cfg.cardHeight;

      this.currentCardW = cardW;
      this.currentCardH = cardH;

      this.filteredItems.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'depth-carousel-card group cursor-pointer select-none';
        card.style.position = 'absolute';
        card.style.left = '50%';
        card.style.top = '50%';
        card.style.width = `${cardW}px`;
        card.style.height = `${cardH}px`;
        card.style.borderRadius = `${this.cfg.radius}px`;
        card.style.overflow = 'hidden';
        card.style.willChange = 'transform, opacity, filter';
        card.style.transition = `transform ${this.cfg.duration}ms ${this.cfg.ease}, opacity ${this.cfg.duration}ms ease, filter ${this.cfg.duration}ms ease, box-shadow ${this.cfg.duration}ms ease`;
        card.style.transformOrigin = '50% 50%';
        card.style.background = this.cfg.tint || '#05060a';
        card.style.border = `1px solid ${item.color ? item.color + '55' : 'rgba(255, 255, 255, 0.15)'}`;
        card.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.95), 0 0 20px rgba(0, 0, 0, 0.5)';
        card.setAttribute('data-index', i);

        const imageSrc = item.image || item.src || '';
        const title = item.title || item.alt || `Item ${i + 1}`;
        const code = item.code || '';
        const category = item.category || '';
        const color = item.color || '#c3f400';

        card.innerHTML = `
          <!-- Card Image -->
          <div class="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <img src="${imageSrc}" alt="${item.alt || title}" loading="lazy" decoding="async"
              class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
            
            <!-- React Bits Atmospheric Depth Tint Overlay -->
            <div class="depth-card-tint absolute inset-0 pointer-events-none transition-opacity duration-500"
              style="background-color: ${this.cfg.tint}; opacity: 0;"></div>

            <!-- Cyber Vignette Gradient -->
            <div class="absolute inset-0 bg-gradient-to-t from-vector-black/95 via-vector-black/35 to-vector-black/60 pointer-events-none"></div>
          </div>

          <!-- Top Badge & Glow Dot -->
          <div class="relative z-10 p-3.5 flex justify-between items-center pointer-events-none">
            ${code ? `<span class="font-mono text-[10px] font-bold text-white bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 shadow-sm">${code}</span>` : '<div></div>'}
            <div class="w-2.5 h-2.5 rounded-full border border-black/50 shadow-[0_0_12px_${color}]" style="background-color: ${color}"></div>
          </div>

          <!-- Bottom Content Info -->
          <div class="relative z-10 p-4 mt-auto flex flex-col justify-end pointer-events-none bg-gradient-to-t from-vector-black/95 via-vector-black/85 to-transparent">
            ${category ? `<span class="font-mono text-[9px] uppercase tracking-widest font-bold mb-1" style="color: ${color}">${category}</span>` : ''}
            <h4 class="font-display font-black text-sm sm:text-base uppercase text-white leading-snug group-hover:text-vector-lime transition-colors">
              ${title}
            </h4>

            ${item.desc ? `
              <p class="font-body text-[12px] text-neutral-200 leading-relaxed my-2 line-clamp-3 border-t border-white/10 pt-2">
                ${item.desc}
              </p>
            ` : ''}
          </div>
        `;

        card.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.isDragging) return;
          const idx = parseInt(card.getAttribute('data-index'), 10);
          if (idx === this.currentIndex) {
            if (typeof this.cfg.onCardClick === 'function') {
              this.cfg.onCardClick(item, idx);
            }
          } else {
            this.goTo(idx);
          }
        });

        this.stage.appendChild(card);
        this.cardNodes.push(card);
      });
    }

    createControls() {
      const controls = document.createElement('div');
      controls.className = 'depth-carousel-controls absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 sm:px-10 pointer-events-none z-50';

      const prevBtn = document.createElement('button');
      prevBtn.className = 'w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-vector-black/85 border border-white/20 hover:border-vector-lime text-white hover:text-vector-lime flex items-center justify-center pointer-events-auto transition-all backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.8)] active:scale-95 cursor-pointer';
      prevBtn.setAttribute('aria-label', 'Previous Slide');
      prevBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>`;
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prev();
      });

      const nextBtn = document.createElement('button');
      nextBtn.className = 'w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-vector-black/85 border border-white/20 hover:border-vector-lime text-white hover:text-vector-lime flex items-center justify-center pointer-events-auto transition-all backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.8)] active:scale-95 cursor-pointer';
      nextBtn.setAttribute('aria-label', 'Next Slide');
      nextBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>`;
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.next();
      });

      controls.appendChild(prevBtn);
      controls.appendChild(nextBtn);
      this.container.appendChild(controls);
    }

    createIndicators() {
      if (this.indicatorsWrapper) {
        this.indicatorsWrapper.remove();
      }

      this.indicatorsWrapper = document.createElement('div');
      this.indicatorsWrapper.className = 'depth-carousel-indicators flex items-center justify-center gap-2 pt-6 pb-2 z-40';

      const N = this.filteredItems.length;
      const maxDots = Math.min(N, 12);

      this.indicatorDots = [];
      for (let i = 0; i < maxDots; i++) {
        const dot = document.createElement('button');
        dot.className = `h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === 0 ? 'w-8 bg-vector-lime shadow-[0_0_10px_#c3f400]' : 'w-2 bg-white/20 hover:bg-white/50'}`;
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        const targetIdx = Math.round((i / (maxDots - 1 || 1)) * (N - 1));
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.goTo(targetIdx);
        });
        this.indicatorsWrapper.appendChild(dot);
        this.indicatorDots.push(dot);
      }

      this.container.appendChild(this.indicatorsWrapper);
    }

    initEvents() {
      // Swipe / Drag Gestures
      const onPointerDown = (e) => {
        this.isDragging = false;
        this.startX = e.touches ? e.touches[0].clientX : e.clientX;
        this.dragOffset = 0;
      };

      const onPointerMove = (e) => {
        if (!this.startX) return;
        const curX = e.touches ? e.touches[0].clientX : e.clientX;
        const diff = curX - this.startX;
        if (Math.abs(diff) > 8) {
          this.isDragging = true;
          this.dragOffset = diff;
        }
      };

      const onPointerUp = () => {
        if (this.isDragging && Math.abs(this.dragOffset) > 40) {
          if (this.dragOffset > 0) {
            this.prev();
          } else {
            this.next();
          }
        }
        this.startX = 0;
        this.dragOffset = 0;
        setTimeout(() => {
          this.isDragging = false;
        }, 60);
      };

      this.stage.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      this.stage.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);

      // Keyboard
      window.addEventListener('keydown', (e) => {
        const rect = this.container.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (e.key === 'ArrowLeft') this.prev();
          if (e.key === 'ArrowRight') this.next();
        }
      });

      // Resize
      window.addEventListener('resize', () => {
        this.renderCards();
        this.update(true);
      });
    }

    /**
     * 1:1 React Bits 3D Rail Positioning Algorithm
     */
    update(instant = false) {
      const N = this.filteredItems.length;
      if (N === 0) return;

      const { depth, spread, tilt, tiltDirection, visibleCards, falloff, blur } = this.cfg;
      const isTiltRight = tiltDirection === 'right';
      const tiltMultiplier = isTiltRight ? 1 : -1;

      const screenW = window.innerWidth;
      const isMobile = screenW < 640;
      const actualSpread = isMobile ? Math.min(60, spread * 0.65) : spread;
      const actualDepth = isMobile ? Math.min(160, depth * 0.75) : depth;

      // Base Rail Center X Offset so the stack is perfectly balanced in the viewport
      const railCenterOffsetX = isTiltRight ? -(visibleCards * actualSpread * 0.35) : (visibleCards * actualSpread * 0.35);

      this.cardNodes.forEach((card, i) => {
        let offset = i - this.currentIndex;

        if (this.cfg.loop && N > 1) {
          offset = (offset % N);
          if (offset > N / 2) offset -= N;
          if (offset < -N / 2) offset += N;
        }

        if (instant) {
          card.style.transition = 'none';
        } else {
          card.style.transition = `transform ${this.cfg.duration}ms ${this.cfg.ease}, opacity ${this.cfg.duration}ms ease, filter ${this.cfg.duration}ms ease, box-shadow ${this.cfg.duration}ms ease`;
        }

        // 1. Exiting card behind viewer (offset < 0)
        if (offset < 0) {
          const exitDist = Math.abs(offset);
          const xExit = railCenterOffsetX - (exitDist * actualSpread * 1.5 * tiltMultiplier);
          const zExit = exitDist * actualDepth * 0.7; // Towards camera
          const rotYExit = -tilt * tiltMultiplier * 1.2;
          const scaleExit = 1 + (exitDist * 0.08);

          card.style.transform = `translate3d(calc(-50% + ${xExit.toFixed(1)}px), -50%, ${zExit.toFixed(1)}px) rotateY(${rotYExit.toFixed(1)}deg) scale(${scaleExit.toFixed(3)})`;
          card.style.opacity = '0';
          card.style.filter = 'blur(10px)';
          card.style.pointerEvents = 'none';
          card.style.zIndex = '0';
          return;
        }

        // 2. Beyond Visible Range (offset > visibleCards)
        if (offset > visibleCards) {
          const farOffset = visibleCards + 1;
          const xFar = railCenterOffsetX + (farOffset * actualSpread * tiltMultiplier);
          const zFar = -farOffset * actualDepth;
          const rotYFar = tilt * tiltMultiplier;
          const scaleFar = Math.max(0.1, Math.pow(1 - falloff, farOffset));

          card.style.transform = `translate3d(calc(-50% + ${xFar.toFixed(1)}px), -50%, ${zFar.toFixed(1)}px) rotateY(${rotYFar.toFixed(1)}deg) scale(${scaleFar.toFixed(3)})`;
          card.style.opacity = '0';
          card.style.filter = `blur(${farOffset * blur}px)`;
          card.style.pointerEvents = 'none';
          card.style.zIndex = '0';
          return;
        }

        // 3. Active Visible Rail Cards (0 <= offset <= visibleCards)
        const xPos = railCenterOffsetX + (offset * actualSpread * tiltMultiplier);
        const zPos = -offset * actualDepth;
        const rotY = offset === 0 ? 0 : tilt * tiltMultiplier;
        const scale = Math.max(0.15, Math.pow(1 - falloff, offset));
        const blurVal = offset * blur;
        const opacity = offset === 0 ? 1 : Math.max(0.15, 1 - (offset / (visibleCards + 1)) * 0.75);
        const zIndex = 100 - offset * 10;

        card.style.transform = `translate3d(calc(-50% + ${xPos.toFixed(1)}px), -50%, ${zPos.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = blurVal > 0 ? `blur(${blurVal.toFixed(1)}px) brightness(${Math.max(0.4, 1 - offset * 0.14).toFixed(2)})` : 'none';
        card.style.zIndex = zIndex;
        card.style.pointerEvents = 'auto';

        // Atmospheric Depth Tint
        const tintEl = card.querySelector('.depth-card-tint');
        if (tintEl) {
          tintEl.style.opacity = (offset * 0.26).toFixed(2);
        }

        // Active Lead Card Highlight
        if (offset === 0) {
          card.classList.add('reactbits-card-active');
          card.style.borderColor = this.filteredItems[i]?.color || '#c3f400';
          card.style.boxShadow = `0 30px 80px rgba(0,0,0,0.95), 0 0 35px ${this.filteredItems[i]?.color || '#c3f400'}44`;
        } else {
          card.classList.remove('reactbits-card-active');
          card.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          card.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.75)';
        }
      });

      // Update Pagination Indicators
      if (this.indicatorDots && this.indicatorDots.length > 0) {
        const maxDots = this.indicatorDots.length;
        const activeDotIdx = Math.min(maxDots - 1, Math.round((this.currentIndex / (N - 1 || 1)) * (maxDots - 1)));
        this.indicatorDots.forEach((dot, dIdx) => {
          if (dIdx === activeDotIdx) {
            dot.className = 'h-1.5 w-8 rounded-full bg-vector-lime transition-all duration-300 cursor-pointer shadow-[0_0_10px_#c3f400]';
          } else {
            dot.className = 'h-1.5 w-2 rounded-full bg-white/20 hover:bg-white/50 transition-all duration-300 cursor-pointer';
          }
        });
      }

      if (typeof this.cfg.onChange === 'function') {
        this.cfg.onChange(this.filteredItems[this.currentIndex], this.currentIndex);
      }
    }

    next() {
      const N = this.filteredItems.length;
      if (N <= 1) return;
      this.currentIndex = (this.currentIndex + 1) % N;
      this.update();
      this.resetAutoplay();
    }

    prev() {
      const N = this.filteredItems.length;
      if (N <= 1) return;
      this.currentIndex = (this.currentIndex - 1 + N) % N;
      this.update();
      this.resetAutoplay();
    }

    goTo(index) {
      const N = this.filteredItems.length;
      if (index < 0 || index >= N || index === this.currentIndex) return;
      this.currentIndex = index;
      this.update();
      this.resetAutoplay();
    }

    setFilter(category) {
      if (!category || category === 'all') {
        this.filteredItems = [...this.rawItems];
      } else {
        this.filteredItems = this.rawItems.filter(item => (item.category || '').toLowerCase() === category.toLowerCase());
      }
      this.currentIndex = 0;
      this.renderCards();
      this.createIndicators();
      this.update(true);
    }

    startAutoplay() {
      this.stopAutoplay();
      this.autoplayTimer = setInterval(() => {
        this.next();
      }, this.cfg.autoplayDelay);
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }

    resetAutoplay() {
      if (this.cfg.autoplay) {
        this.startAutoplay();
      }
    }

    destroy() {
      this.stopAutoplay();
      this.container.innerHTML = '';
    }
  }

  global.DepthCarousel = DepthCarousel;

})(typeof window !== 'undefined' ? window : this);
