// DIGISOL — "ALTA LUZ" interactions
document.documentElement.classList.add('js');

// Mobile menu
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('header nav ul');

if (mobileMenuToggle && navMenu) {
    const icon = mobileMenuToggle.querySelector('i');

    mobileMenuToggle.addEventListener('click', () => {
        const open = document.body.classList.toggle('menu-open');
        if (icon) {
            icon.classList.toggle('fa-bars', !open);
            icon.classList.toggle('fa-times', open);
        }
    });

    navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            document.body.classList.remove('menu-open');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    });
}

// Header shadow on scroll
const onScroll = () => {
    document.body.classList.toggle('scrolled', window.scrollY > 10);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Contact form: file input name display
const fileInput = document.getElementById('attachment');
if (fileInput) {
    fileInput.addEventListener('change', function () {
        const fileName = this.files[0] ? this.files[0].name : 'Nenhum ficheiro selecionado';
        const out = document.querySelector('.file-name');
        if (out) out.textContent = fileName;
    });
}

// Smooth scrolling for same-page anchors
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const target = this.getAttribute('href');
        if (!target || target === '#') return;
        const el = document.querySelector(target);
        if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Scroll reveals — explicit [data-reveal] plus legacy card classes.
// The "reveal-armed" class is added one frame after load so that static
// rasterizers (and no-JS browsers) always see the full content.
const revealTargets = document.querySelectorAll(
    '[data-reveal], .feature-item, .value-item, .related-item, .gallery-item, ' +
    '.tile, .why-cell, .work-row, .svc-row, .innovation-item'
);

if ('IntersectionObserver' in window && revealTargets.length) {
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
            // Arm hidden states only after the first delivery has marked
            // everything currently on screen — never blanks the viewport.
            document.documentElement.classList.add('reveal-armed');
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach((el, i) => {
        if (!el.hasAttribute('data-reveal')) {
            el.setAttribute('data-reveal', '');
            el.style.setProperty('--rd', `${(i % 4) * 0.08}s`);
        }
        io.observe(el);
    });
} else {
    revealTargets.forEach((el) => el.classList.add('in-view'));
}
