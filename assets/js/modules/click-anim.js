// /assets/js/modules/click-anim.js
export function initClickAnim(selector = '.c-nav__link--pill'){
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  els.forEach(el => {
    const triggerRipple = () => {
      el.classList.remove('is-rippling');
      void el.offsetWidth;
      el.classList.add('is-rippling');
    };

    // Ripple por mouse/touch
    el.addEventListener('pointerdown', triggerRipple);

    // Ripple por teclado (Enter/Espaço)
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') triggerRipple();
    });

    // Atraso curto para o efeito antes da navegação
    el.addEventListener('click', e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (el.target === '_blank') return;

      const href = el.getAttribute('href');
      if (!href) return;

      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return; // só same-origin
      if (reduce) return;                         // sem atraso em RM

      e.preventDefault();
      setTimeout(() => { location.href = url.href; }, 160);
    });
  });
}
