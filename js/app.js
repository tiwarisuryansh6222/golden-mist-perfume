// app.js — Main site logic: animations, products rendering, interactions
import {
  getProducts,
  getSettings,
  seedDefaults,
  CATEGORY_LABELS,
  getWhatsAppLink,
} from './data.js';

seedDefaults();

// ==========================================
// Hero Particle Canvas — gold mist effect
// ==========================================
class MistCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.resize();
    this.init();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    const count = Math.min(80, Math.floor(window.innerWidth / 15));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.15 - 0.1,
        opacity: Math.random() * 0.5 + 0.1,
        golden: Math.random() > 0.3,
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      // Subtle mouse influence
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        p.x -= dx * 0.001;
        p.y -= dy * 0.001;
      }

      p.x += p.speedX;
      p.y += p.speedY;
      p.opacity += (Math.random() - 0.5) * 0.01;
      p.opacity = Math.max(0.05, Math.min(0.6, p.opacity));

      // Wrap around
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;

      this.ctx.beginPath();
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      if (p.golden) {
        gradient.addColorStop(0, `rgba(201, 165, 103, ${p.opacity})`);
        gradient.addColorStop(1, `rgba(201, 165, 103, 0)`);
      } else {
        gradient.addColorStop(0, `rgba(245, 241, 232, ${p.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(245, 241, 232, 0)`);
      }
      this.ctx.fillStyle = gradient;
      this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// Header scroll behavior
// ==========================================
function initHeader() {
  const header = document.getElementById('siteHeader');
  const announcementBar = document.getElementById('announcementBar');
  const announcementClose = document.getElementById('announcementClose');
  const settings = getSettings();

  // Set announcement text from settings
  const announcementText = document.getElementById('announcementText');
  if (announcementText && settings.announcementText) {
    announcementText.textContent = settings.announcementText;
  }

  // Show/hide announcement
  if (!settings.comingSoon || sessionStorage.getItem('gm_announcement_dismissed')) {
    announcementBar.classList.add('hidden');
  }

  announcementClose?.addEventListener('click', () => {
    announcementBar.classList.add('hidden');
    sessionStorage.setItem('gm_announcement_dismissed', 'true');
  });

  // Scroll handler
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  });
}

// ==========================================
// Mobile menu
// ==========================================
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu.querySelectorAll('a');

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileMenu.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });
}

// ==========================================
// Smooth scroll for anchor links
// ==========================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const y = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });

        // If this nav link has a data-filter, apply it
        const filter = link.dataset.filter;
        if (filter) {
          setTimeout(() => {
            setActiveFilter(filter);
          }, 600);
        }
      }
    });
  });
}

// ==========================================
// Products rendering
// ==========================================
let currentFilter = 'all';

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const products = getProducts();
  const filtered = currentFilter === 'all'
    ? products
    : products.filter(p => p.category === currentFilter);

  grid.innerHTML = '';

  filtered.forEach((product, index) => {
    const card = document.createElement('article');
    card.className = 'product-card reveal-on-scroll';
    card.style.setProperty('--accent', product.accentColor || '#C9A567');
    card.style.setProperty('--reveal-delay', `${index * 0.1}s`);

    const tagLabel = CATEGORY_LABELS[product.category] || '';
    const tagClass = product.category || '';
    const whatsappLink = getWhatsAppLink(product.name);

    const stockBadge = product.stockStatus === 'out-of-stock'
      ? '<span class="stock-badge out-of-stock">Out of Stock</span>'
      : product.stockStatus === 'discontinued'
        ? '<span class="stock-badge discontinued">Discontinued</span>'
        : '';

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${product.image}" alt="${product.name} perfume by Golden Mist" loading="lazy" class="product-image" />
        ${tagLabel ? `<span class="product-tag ${tagClass}">${tagLabel}</span>` : ''}
        ${stockBadge}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <span class="product-price">₹${product.price.toLocaleString('en-IN')}</span>
          <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="btn btn-order-card">
            <svg class="wa-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Order
          </a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // Re-observe new cards
  observeElements();
}

function setActiveFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(pill => {
    const isActive = pill.dataset.filter === filter;
    pill.classList.toggle('active', isActive);
    pill.setAttribute('aria-selected', isActive);
  });
  renderProducts();
}

function initFilters() {
  const pillsContainer = document.getElementById('filterPills');
  if (!pillsContainer) return;

  pillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    setActiveFilter(pill.dataset.filter);
  });
}

// ==========================================
// Intersection Observer — reveal on scroll
// ==========================================
let observer;

function observeElements() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  });

  document.querySelectorAll('.reveal-on-scroll:not(.revealed)').forEach(el => {
    observer.observe(el);
  });
}

// ==========================================
// Coming Soon text animation
// ==========================================
function initComingSoonAnimation() {
  const letters = document.querySelectorAll('.cs-letter');
  letters.forEach((letter, i) => {
    letter.style.animationDelay = `${i * 0.1 + 0.5}s`;
  });
}

// ==========================================
// Init everything
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Init particle canvas
  const canvas = document.getElementById('heroParticles');
  if (canvas) new MistCanvas(canvas);

  initHeader();
  initMobileMenu();
  initSmoothScroll();
  initFilters();
  renderProducts();
  initComingSoonAnimation();
  observeElements();
});
