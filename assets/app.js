/**
 * APP.JS
 * Contém interações essenciais do site.
 * - Controle de navegação mobile.
 * - Atualização dinâmica do ano no rodapé.
 */

(function () {
  'use strict';

  /**
   * Módulo de Navegação Mobile
   * Controla a abertura e fechamento do menu em dispositivos móveis.
   */
  function initializeMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const primaryNav = document.querySelector('.primary-nav');
    const navLinks = document.querySelectorAll('.nav__link');

    // Checagem defensiva: se os elementos não existirem, não faz nada.
    if (!navToggle || !primaryNav) {
      console.warn('Elementos da navegação mobile não encontrados.');
      return;
    }

    const toggleNav = () => {
      const isVisible = primaryNav.getAttribute('data-visible') === 'true';
      primaryNav.setAttribute('data-visible', !isVisible);
      navToggle.setAttribute('aria-expanded', !isVisible);
      document.body.toggleAttribute('data-menu-open', !isVisible);
    };

    navToggle.addEventListener('click', toggleNav);
    
    // Fecha o menu ao clicar em um link (para navegação na mesma página)
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (primaryNav.getAttribute('data-visible') === 'true') {
          toggleNav();
        }
      });
    });
  }

  /**
   * Módulo de Atualização do Rodapé
   * Insere o ano atual no elemento com o ID #current-year.
   */
  function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    
    // Checagem defensiva
    if (!yearSpan) {
      return;
    }
    
    yearSpan.textContent = new Date().getFullYear();
  }

  /**
   * Inicializa todos os módulos quando o DOM estiver pronto.
   */
  document.addEventListener('DOMContentLoaded', () => {
    initializeMobileNav();
    updateFooterYear();
  });

})();
