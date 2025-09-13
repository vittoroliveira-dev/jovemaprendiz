// header-over-hero.js — versão com opt-in e kill para contato
(() => {
  const header = document.querySelector('.c-header');
  if (!header) return;

  // não aplicar no contato
  if (header.classList.contains('c-header--contato')) return;

  // só roda se existir um herói explícito
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const getH = () =>
    parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height')) || header.offsetHeight || 64;

  let H = 0, topAbs = 0, bottomAbs = 0, ticking = false;

  const measure = () => {
    H = getH();
    const r = hero.getBoundingClientRect();
    const y = scrollY;
    topAbs = r.top + y;
    bottomAbs = r.bottom + y;
    apply();
  };

  const apply = () => {
    ticking = false;
    const y = scrollY;
    const overHero = (y + H) > topAbs && y < (bottomAbs - 1);
    document.documentElement.classList.toggle('over-hero', overHero);
    header.classList.toggle('is-scrolled', y > 0);
  };

  new ResizeObserver(measure).observe(hero);
  addEventListener('resize', measure, { passive: true });
  addEventListener('scroll', () => {
    if (!ticking){ ticking = true; requestAnimationFrame(apply); }
  }, { passive: true });
  addEventListener('load', measure, { once: true, passive: true });
  document.addEventListener('DOMContentLoaded', measure);

  measure();
})();
