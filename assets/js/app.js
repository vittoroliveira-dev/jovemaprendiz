// Arquivo: /assets/js/app.js

// Módulo de navegação
import { initNav } from './modules/nav.js';

// Função principal para inicializar todos os módulos
function main() {
  initNav();

  // Atualiza o ano no rodapé
  const yearSpan = document.querySelector('[data-js="year"]');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear().toString();
  }

  // Registra o Service Worker para PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service Worker registration failed: ', err);
      });
    });
  }
}

// Garante que o DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
