// /assets/js/app.js

import { initNav } from './modules/nav.js';

document.documentElement.classList.add('js');

// Anima entrada dos elementos com [data-animate]
function initInView() {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;


// Respeita "reduzir animações" com fallback seguro
const reduceMotion = !!(typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }

  // Fallback se não houver IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-in')); // <- padronizado
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in'); // <- padronizado
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  els.forEach(el => io.observe(el));
}

// Atualiza o ano do rodapé
function setCurrentYear() {
  const yearSpan = document.querySelector('[data-js="year"]');
  if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());
}

// PWA — registra o Service Worker e força verificação de updates
function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  // Recarrega uma única vez quando o novo SW assumir o controle
  let didRefresh = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (didRefresh) return;
    didRefresh = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        if (typeof reg.update === 'function') reg.update(); // check de update imediato
        reg.addEventListener?.('updatefound', () => {
          const installing = reg.installing;
          // Quando o SW novo ativar, o controllerchange acima fará o refresh
          installing?.addEventListener('statechange', () => {});
        });
      })
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// Bootstrap
function main() {
  initNav();
  initInView();
  setCurrentYear();
  registerSW();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
