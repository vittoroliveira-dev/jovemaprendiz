/**
 * app.js v2 — Interações e acessibilidade
 * - Ano do rodapé
 * - Skip-link e foco ao navegar por hash
 * - Navegação mobile com trap de foco, close on outside, Esc e travamento de scroll sem "pulo"
 * - Destaque da seção ativa com margem dinâmica pelo header
 */
(function () {
  'use strict';

  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const hasInert = 'inert' in (HTMLElement.prototype || {});

  /* 1) Ano no rodapé */
  const yearEl = $('#current-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* 2) Skip-link + foco ao navegar por hash */
  (function initSkipAndHashFocus() {
    const skip = $('.skip-link');
    const main = $('main');

    if (skip && main) {
      skip.addEventListener('click', (e) => {
        e.preventDefault();
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
        main.scrollIntoView({ block: 'start' });
        setTimeout(() => main.removeAttribute('tabindex'), 200);
      });
    }

    if (location.hash) {
      const tgt = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (tgt) {
        tgt.setAttribute('tabindex', '-1');
        tgt.focus({ preventScroll: true });
        setTimeout(() => tgt.removeAttribute('tabindex'), 200);
      }
    }
  })();

  /* 3) Navegação mobile aprimorada */
  (function mobileNav() {
    const toggle = $('.nav-toggle');
    const nav    = $('.primary-nav');
    const main   = $('main');
    const footer = $('footer');

    if (!toggle || !nav) return;

    let isOpen = false;
    let prevActive = null;
    let focusables = [];
    const FOCUS = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const setSiblingsInert = (yes) => {
      [main, footer].forEach((el) => {
        if (!el) return;
        if (hasInert) { try { el.inert = yes; } catch (_) {} }
        if (yes) el.setAttribute('aria-hidden', 'true');
        else el.removeAttribute('aria-hidden');
      });
    };

    // Travamento de scroll sem "pulo" (iOS safe)
    const lockScroll = (yes) => {
      const b = document.body;
      if (yes) {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        b.dataset.scrollY = String(y);
        b.style.position = 'fixed';
        b.style.top = `-${y}px`;
        b.style.left = '0';
        b.style.right = '0';
        b.style.width = '100%';
      } else {
        const y = Number(b.dataset.scrollY || 0);
        b.style.position = '';
        b.style.top = '';
        b.style.left = '';
        b.style.right = '';
        b.style.width = '';
        delete b.dataset.scrollY;
        window.scrollTo(0, y);
      }
    };

    const setOpen = (next) => {
      if (isOpen === next) return;

      isOpen = next;
      nav.dataset.visible = String(isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.toggleAttribute('data-menu-open', isOpen);
      setSiblingsInert(isOpen);
      lockScroll(isOpen);

      if (isOpen) {
        prevActive = document.activeElement;
        focusables = $$(FOCUS, nav);
        (focusables[0] || nav).focus();
        document.addEventListener('keydown', onKeydown);
        document.addEventListener('pointerdown', onOutsideClick);
      } else {
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('pointerdown', onOutsideClick);
        if (prevActive) prevActive.focus();
      }
    };

    const onKeydown = (e) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'Tab' && focusables.length) {
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    };

    const onOutsideClick = (e) => {
      if (!isOpen) return;
      if (!nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    };

    toggle.addEventListener('click', () => setOpen(nav.dataset.visible !== 'true'));
    $$('.nav__link', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  })();

  /* 4) Destaque da seção ativa (margem baseada no header) */
  (function activeSection() {
    const links = $$('.nav__link');
    if (!('IntersectionObserver' in window) || !links.length) return;

    const header  = $('.site-header');
    const headerH = header ? header.offsetHeight : 0;

    const setActive = (link) => {
      links.forEach((x) => { x.removeAttribute('aria-current'); x.classList.remove('is-active'); });
      if (link) { link.setAttribute('aria-current', 'page'); link.classList.add('is-active'); }
    };

    const map = new Map();
    links.forEach((l) => {
      const id = l.getAttribute('href')?.replace('#', '');
      const sec = id ? document.getElementById(id) : null;
      if (sec) map.set(sec, l);
    });
    if (!map.size) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const link = map.get(en.target);
        if (en.isIntersecting) setActive(link);
      });
    }, {
      root: null,
      rootMargin: `-${headerH + 12}px 0px -55% 0px`,
      threshold: 0.1
    });

    map.forEach((_, sec) => io.observe(sec));

    // Estado inicial se a página abre com hash
    if (location.hash) {
      const initial = links.find((a) => a.getAttribute('href') === location.hash);
      if (initial) setActive(initial);
    }
  })();

})();