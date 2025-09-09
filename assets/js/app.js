// /assets/js/app.js

// Módulo de navegação
import { initNav } from './modules/nav.js';

function main() {
  initNav();

  // Atualiza o ano no rodapé (PE)
  const yearSpan = document.querySelector('[data-js="year"]');
  if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());

  // PWA — registro + ciclo de atualização enxuto
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // dispara verificação de update em background (quando suportado)
          if (typeof reg.update === 'function') reg.update();
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    });

    // Quando um SW novo assume o controle, recarrega UMA vez
    let didRefresh = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (didRefresh) return;
      didRefresh = true;
      window.location.reload();
    });
  }
}

// Garante DOM pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
