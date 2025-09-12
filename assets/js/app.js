// /assets/js/app.js

import './modules/header-over-hero.js';        // controla html.over-hero e .is-scrolled
import { initNav } from './modules/nav.js';
import { initContactForm } from './modules/contact.js';

const root = document.documentElement;
root.classList.remove('no-js');
root.classList.add('js');

/* ===== In-view animations ===== */
function initInViewAnimations() {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  els.forEach(el => io.observe(el));

  // encerra o observer ao sair/navegar (bfcache-friendly)
  const disconnectIO = () => io.disconnect();
  window.addEventListener('pagehide', disconnectIO, { once: true });
  window.addEventListener('beforeunload', disconnectIO, { once: true });
}

/* ===== Footer year ===== */
function setCurrentYear() {
  const y = document.querySelector('[data-js="year"]');
  if (y) y.textContent = String(new Date().getFullYear());
}

/* ===== Service Worker ===== */
function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (document.documentElement.dataset.swInit === '1') return;
  document.documentElement.dataset.swInit = '1';

  const showUpdateToast = (registration) => {
    const toast = document.querySelector('[data-js="update-toast"]');
    if (!toast) return;
    toast.hidden = false;
    toast.classList.add('is-visible');
    toast.querySelector('[data-js="update-cta"]')?.addEventListener('click', () => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    }, { once: true });
  };

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      registration.update();

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update();
      });

      window.addEventListener('pageshow', (e) => {
        if (e.persisted) navigator.serviceWorker.getRegistration()?.then(r => r?.update());
      });

      if (registration.waiting && navigator.serviceWorker.controller) showUpdateToast(registration);

      registration.addEventListener('updatefound', () => {
        const nw = registration.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateToast(registration);
        });
      });
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  }, { once: true });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

/* ===== Ripple nos pills ===== */
async function initNavPillEffect() {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !document.querySelector('.c-nav__link--pill')) return;
  try {
    const mod = await import('./modules/click-anim.js');
    if (typeof mod.initClickAnim === 'function') mod.initClickAnim('.c-nav__link--pill');
  } catch {}
}

/* ===== Main boot ===== */
function main() {
  initNav();
  initInViewAnimations?.();
  setCurrentYear?.();
  initServiceWorker?.();
  initNavPillEffect?.();

  const form = document.getElementById('contact-form');
  if (form && form.dataset.jsInit !== '1') {
    form.dataset.jsInit = '1';
    initContactForm();
  }
}

/* ===== Single-run guard ===== */
const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;

if (!isProd || !document.documentElement.dataset.appInit) {
  if (isProd) document.documentElement.dataset.appInit = '1';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main, { once: true });
  } else {
    main();
  }
}
