// DIGISOL — "Estúdio de luz" interactions.
// Everything here is progressive: without JS the pages are complete and readable.
(() => {
    const root = document.documentElement;
    root.classList.add('js');

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    /* ------------------------------------------------------------------ *
     * Smooth scroll (Lenis, loaded from CDN on pages that include it)
     * ------------------------------------------------------------------ */
    let lenis = null;
    if (!reduced && window.Lenis) {
        lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
        const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
    }

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (id.length < 2) return;
            const el = document.querySelector(id);
            if (!el) return;
            e.preventDefault();
            if (lenis) lenis.scrollTo(el, { offset: -20 });
            else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        });
    });

    /* ------------------------------------------------------------------ *
     * Header: scrolled state, hide on scroll down, mobile menu, clock
     * ------------------------------------------------------------------ */
    const body = document.body;
    let lastY = window.scrollY;

    const toggle = document.querySelector('.menu-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const open = body.classList.toggle('menu-open');
            toggle.setAttribute('aria-expanded', String(open));
            if (lenis) open ? lenis.stop() : lenis.start();
        });
        document.querySelectorAll('.site-nav a').forEach((a) => a.addEventListener('click', () => {
            body.classList.remove('menu-open');
            toggle.setAttribute('aria-expanded', 'false');
            if (lenis) lenis.start();
        }));
    }

    const clocks = document.querySelectorAll('[data-clock]');
    if (clocks.length) {
        const fmt = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit' });
        const tick = () => clocks.forEach((c) => { c.textContent = 'Porto ' + fmt.format(new Date()); });
        tick();
        setInterval(tick, 15000);
    }

    /* ------------------------------------------------------------------ *
     * Split text into masked words for line reveals
     * ------------------------------------------------------------------ */
    const splitWords = (el, wrapClass) => {
        let i = 0;
        const walk = (node) => {
            [...node.childNodes].forEach((child) => {
                if (child.nodeType === 3) {
                    const parts = child.textContent.split(/(\s+)/);
                    const frag = document.createDocumentFragment();
                    parts.forEach((part) => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                        const outer = document.createElement('span');
                        outer.className = wrapClass;
                        outer.style.setProperty('--i', i++);
                        if (wrapClass === 'w') {
                            const inner = document.createElement('span');
                            inner.textContent = part;
                            outer.appendChild(inner);
                        } else {
                            outer.textContent = part;
                        }
                        frag.appendChild(outer);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === 1 && child.tagName !== 'BR') {
                    walk(child);
                }
            });
        };
        walk(el);
        return i;
    };

    document.querySelectorAll('[data-split]').forEach((el) => { el.dataset.words = splitWords(el, 'w'); });

    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            el.classList.add('in');
            io.unobserve(el);
            // Once every word has landed, drop the masks so nothing can be clipped at rest.
            if (el.dataset.words) {
                const delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
                setTimeout(() => el.classList.add('done'), reduced ? 0 : 1200 + el.dataset.words * 45 + delay);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('[data-split], [data-fade]').forEach((el) => io.observe(el));

    /* ------------------------------------------------------------------ *
     * The sun — the logo's rayed sun, redrawn live on canvas
     * ------------------------------------------------------------------ */
    const pointer = { x: -9999, y: -9999, active: false };
    window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.active = false; });

    class Sun {
        constructor(host) {
            this.host = host;
            this.canvas = document.createElement('canvas');
            this.canvas.setAttribute('aria-hidden', 'true');
            host.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            this.rays = Number(host.dataset.rays || 132);
            this.seed = [...Array(this.rays)].map((_, i) => {
                const s = Math.sin(i * 12.9898) * 43758.5453;
                return s - Math.floor(s);
            });
            this.boost = new Float32Array(this.rays);
            this.rot = 0;
            this.visible = true;
            this.resize();
            new ResizeObserver(() => this.resize()).observe(host);
            new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(host);
            this.last = performance.now();
            if (reduced) this.draw(0);
            else requestAnimationFrame((t) => this.loop(t));
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = this.host.clientWidth;
            this.size = w;
            this.dpr = dpr;
            this.canvas.width = w * dpr;
            this.canvas.height = w * dpr;
            if (reduced) this.draw(0);
        }

        loop(t) {
            const dt = Math.min(64, t - this.last) / 1000;
            this.last = t;
            if (this.visible && !document.hidden) {
                this.rot += dt * 0.035;
                this.draw(t / 1000, dt);
            }
            requestAnimationFrame((n) => this.loop(n));
        }

        draw(time, dt = 0.016) {
            const { ctx, dpr, size } = this;
            const S = size * dpr;
            const c = S / 2;
            const R = S * 0.27;
            ctx.clearRect(0, 0, S, S);

            // Pointer in canvas space
            const rect = this.canvas.getBoundingClientRect();
            const px = (pointer.x - rect.left) * dpr - c;
            const py = (pointer.y - rect.top) * dpr - c;
            const pAng = Math.atan2(py, px);
            const pDist = Math.hypot(px, py);
            const near = pointer.active && !reduced ? clamp(1 - (pDist - R) / (S * 0.75), 0, 1) : 0;

            // Orbits
            ctx.lineWidth = 1 * dpr;
            ctx.strokeStyle = 'rgba(16,15,13,0.13)';
            ctx.beginPath(); ctx.arc(c, c, R * 1.88, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([2 * dpr, 7 * dpr]);
            ctx.beginPath(); ctx.arc(c, c, R * 1.62, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);

            // A small body travelling the outer orbit
            const oa = -this.rot * 2.6 + 0.8;
            ctx.fillStyle = '#100F0D';
            ctx.beginPath(); ctx.arc(c + Math.cos(oa) * R * 1.88, c + Math.sin(oa) * R * 1.88, 4.5 * dpr, 0, Math.PI * 2); ctx.fill();

            // Rays
            ctx.lineCap = 'round';
            for (let i = 0; i < this.rays; i++) {
                const a = (i / this.rays) * Math.PI * 2 + this.rot;
                const s = this.seed[i];
                const major = i % 6 === 0;
                let d = Math.abs(((a - pAng + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
                const target = near * Math.exp(-(d * d) / (2 * 0.2 * 0.2));
                this.boost[i] += (target - this.boost[i]) * Math.min(1, dt * 7);
                const breathe = reduced ? 0 : Math.sin(time * 0.9 + i * 0.35) * 0.025;
                const r1 = R * 1.1;
                const len = R * ((major ? 0.36 : 0.16 + s * 0.14) + breathe + this.boost[i] * 0.42);
                ctx.lineWidth = (major ? 3.2 : 1.3) * dpr;
                ctx.strokeStyle = `rgba(16,15,13,${major ? 0.92 : 0.55 + this.boost[i] * 0.4})`;
                const ca = Math.cos(a), sa = Math.sin(a);
                ctx.beginPath();
                ctx.moveTo(c + ca * r1, c + sa * r1);
                ctx.lineTo(c + ca * (r1 + len), c + sa * (r1 + len));
                ctx.stroke();
            }

            // Disc
            const g = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
            g.addColorStop(0, '#FFE85C');
            g.addColorStop(0.6, '#FEDC27');
            g.addColorStop(1, '#F6C515');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = 1.5 * dpr;
            ctx.strokeStyle = 'rgba(16,15,13,0.9)';
            ctx.stroke();
        }
    }

    document.querySelectorAll('[data-sun]').forEach((el) => new Sun(el));

    /* ------------------------------------------------------------------ *
     * Scroll-driven effects (one rAF loop)
     * ------------------------------------------------------------------ */
    const heroSun = document.querySelector('.hero-sun');
    const stackCards = [...document.querySelectorAll('.stack-card')];
    const manifesto = document.querySelector('.manifesto p');
    const ctaFinal = document.querySelector('.cta-final');
    let mWords = [];
    if (manifesto) { splitWords(manifesto, 'mw'); mWords = [...manifesto.querySelectorAll('.mw')]; }

    const onScroll = () => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        body.classList.toggle('scrolled', y > 8);
        if (!body.classList.contains('menu-open')) {
            body.classList.toggle('header-hidden', y > vh * 0.9 && y > lastY + 2);
            if (y < lastY - 2) body.classList.remove('header-hidden');
        }
        lastY = y;

        if (heroSun && !reduced) {
            const p = clamp(y / vh, 0, 1.2);
            heroSun.style.transform = `translate3d(0, ${p * 42}vh, 0) scale(${1 - p * 0.18})`;
        }

        if (stackCards.length && innerWidth > 760 && !reduced) {
            const top = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) + 10;
            stackCards.forEach((card, i) => {
                const next = stackCards[i + 1];
                if (!next) return;
                const nt = next.getBoundingClientRect().top;
                const p = clamp(1 - (nt - top) / (vh - top), 0, 1);
                card.style.transform = `scale(${1 - p * 0.06})`;
                card.style.setProperty('--dim', (p * 0.45).toFixed(3));
            });
        }

        if (mWords.length) {
            const r = manifesto.getBoundingClientRect();
            const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25), 0, 1);
            const lit = Math.round(p * mWords.length);
            mWords.forEach((w, i) => w.classList.toggle('lit', i < lit));
        }

        if (ctaFinal && !reduced) {
            const r = ctaFinal.getBoundingClientRect();
            const p = clamp(1 - r.top / vh, 0, 1);
            ctaFinal.style.setProperty('--rise', `${(1 - p) * 40}%`);
        }
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* ------------------------------------------------------------------ *
     * Cursor label + project preview that follows the pointer
     * ------------------------------------------------------------------ */
    if (finePointer && !reduced) {
        const cursor = document.createElement('div');
        cursor.className = 'cursor';
        cursor.setAttribute('aria-hidden', 'true');
        body.appendChild(cursor);

        const preview = document.createElement('div');
        preview.className = 'hover-preview';
        preview.setAttribute('aria-hidden', 'true');
        const pImg = document.createElement('img');
        pImg.alt = '';
        preview.appendChild(pImg);
        if (document.querySelector('[data-preview]')) body.appendChild(preview);

        let cx = -200, cy = -200, vx = -200, vy = -200;
        window.addEventListener('pointermove', (e) => { cx = e.clientX; cy = e.clientY; }, { passive: true });

        const follow = () => {
            vx += (cx - vx) * 0.18;
            vy += (cy - vy) * 0.18;
            cursor.style.setProperty('--x', `${cx}px`);
            cursor.style.setProperty('--y', `${cy}px`);
            preview.style.transform = `translate3d(calc(${vx}px - 50%), calc(${vy}px - 50%), 0)`;
            requestAnimationFrame(follow);
        };
        requestAnimationFrame(follow);

        document.querySelectorAll('[data-cursor]').forEach((el) => {
            el.addEventListener('pointerenter', () => { cursor.textContent = el.dataset.cursor; cursor.classList.add('on'); });
            el.addEventListener('pointerleave', () => cursor.classList.remove('on'));
        });

        document.querySelectorAll('[data-preview]').forEach((row) => {
            const src = row.dataset.preview;
            const warm = new Image(); warm.src = src;
            row.addEventListener('pointerenter', () => { pImg.src = src; preview.classList.add('on'); preview.style.scale = '1'; });
            row.addEventListener('pointerleave', () => { preview.classList.remove('on'); preview.style.scale = '0.6'; });
        });
    }

    /* ------------------------------------------------------------------ *
     * Portfolio filters
     * ------------------------------------------------------------------ */
    const filters = document.querySelectorAll('.filter');
    if (filters.length) {
        const works = document.querySelectorAll('.work[data-cat]');
        filters.forEach((btn) => btn.addEventListener('click', () => {
            const f = btn.dataset.filter;
            filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            works.forEach((w) => w.classList.toggle('is-hidden', f !== 'all' && !w.dataset.cat.split(' ').includes(f)));
            if (lenis) lenis.resize();
        }));
    }

    /* ------------------------------------------------------------------ *
     * Contact form: selected file name
     * ------------------------------------------------------------------ */
    const fileInput = document.getElementById('attachment');
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const out = document.querySelector('.file-name');
            if (out) out.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Nenhum ficheiro selecionado';
        });
    }

    /* ------------------------------------------------------------------ *
     * Page transitions — a sun-coloured wipe between internal pages
     * ------------------------------------------------------------------ */
    const curtain = document.querySelector('.curtain');
    const store = (fn) => { try { fn(); } catch (e) { /* storage blocked: transitions still work, just not across pages */ } };
    store(() => sessionStorage.removeItem('dg-t'));
    if (root.classList.contains('entering')) setTimeout(() => root.classList.remove('entering'), 900);

    if (curtain && !reduced) {

        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href]');
            if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (a.target === '_blank' || a.hasAttribute('download')) return;
            const url = new URL(a.href, location.href);
            if (url.origin !== location.origin || /^(mailto|tel):/.test(a.getAttribute('href'))) return;
            if (url.pathname === location.pathname && url.hash) return;
            e.preventDefault();
            store(() => sessionStorage.setItem('dg-t', '1'));
            root.classList.remove('entering');
            curtain.classList.add('cover');
            setTimeout(() => { location.href = url.href; }, 520);
        });

        // Back/forward cache restores the covered page — uncover it.
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) { curtain.classList.remove('cover'); root.classList.remove('entering'); }
        });
    }
})();
