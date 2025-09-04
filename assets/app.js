/**
 * app.js — Interações e acessibilidade
 * - Navegação mobile (focus trap + Esc para fechar)
 * - Destaque da seção ativa (aria-current / .is-active)
 * - Atualização do ano no rodapé
 */
(function () {
  'use strict';

  const qs  = (s,el=document)=>el.querySelector(s);
  const qsa = (s,el=document)=>Array.from(el.querySelectorAll(s));

  // Atualiza ano no rodapé
  const yearEl = qs('#current-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Navegação Mobile (trap de foco + Esc)
  (function initMobileNav(){
    const navToggle = qs('.nav-toggle');
    const nav = qs('.primary-nav');
    if (!navToggle || !nav) return;

    let focusables = [];
    const FOCUS = 'a, button, [tabindex]:not([tabindex="-1"])';

    const setOpen = (open) => {
      nav.setAttribute('data-visible', String(open));
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.toggleAttribute('data-menu-open', open);

      if (open){
        focusables = qsa(FOCUS, nav);
        setTimeout(()=> focusables[0]?.focus(), 0);
        document.addEventListener('keydown', onKeydown);
      } else {
        document.removeEventListener('keydown', onKeydown);
        navToggle.focus();
      }
    };

    const onKeydown = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && focusables.length){
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
      }
    };

    navToggle.addEventListener('click', ()=> setOpen(nav.getAttribute('data-visible') !== 'true'));
    qsa('.nav__link', nav).forEach(a => a.addEventListener('click', ()=> setOpen(false)));
  })();

  // Destaque da seção ativa via IntersectionObserver
  (function highlightActive(){
    const links = qsa('.nav__link');
    if (!('IntersectionObserver' in window) || !links.length) return;

    const map = new Map();
    links.forEach(link => {
      const id = link.getAttribute('href')?.replace('#','');
      const sec = id ? qs('#'+CSS.escape(id)) : null;
      if (sec) map.set(sec, link);
    });
    if (!map.size) return;

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting){
          links.forEach(l => { l.removeAttribute('aria-current'); l.classList.remove('is-active'); });
          link.setAttribute('aria-current','page');
          link.classList.add('is-active');
        }
      });
    }, {rootMargin: '-45% 0px -50% 0px', threshold: 0});

    map.forEach((_, section) => io.observe(section));
  })();

})();
