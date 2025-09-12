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

  const SWV = 'v32';                   // igual ao sw.js
  const SW_URL = `/sw.js?v=${SWV}`;    // cache-busting
  const UPDATE_EVERY = 12 * 60 * 60 * 1000; // 12h

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
      reg.update();

      // verificação periódica
      let timerId = setInterval(() => reg.update(), UPDATE_EVERY);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          clearInterval(timerId);
        } else {
          reg.update();
          timerId = setInterval(() => reg.update(), UPDATE_EVERY);
        }
      });
      window.addEventListener('pagehide', () => clearInterval(timerId), { once: true });

      // ativa imediatamente se houver SW em espera
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

      // ativa assim que um novo SW instalar
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // recarrega quando o controlador troca
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());

      // checa updates em retornos de aba/BCache
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update();
      });
      window.addEventListener('pageshow', (e) => {
        if (e.persisted) navigator.serviceWorker.getRegistration()?.then(r => r?.update());
      });
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  }, { once: true });
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
