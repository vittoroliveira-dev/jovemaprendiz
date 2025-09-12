// Transparência quando o header está sobre o 1º bloco da página (geralmente o hero).
(() => {
  const header = document.querySelector('.c-header');
  if (!header) return;

  // alvo: [data-hero] OU o 1º irmão depois do header
  const hero =
    document.querySelector('[data-hero]') ||
    header.nextElementSibling;
  if (!hero) return;

  const getH = () =>
    parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height')) || header.offsetHeight || 64;

  let H = 0, topAbs = 0, bottomAbs = 0, ticking = false;

  const measure = () => {
    H = getH();
    const r = hero.getBoundingClientRect();
    const y = window.scrollY || window.pageYOffset;
    topAbs = r.top + y;
    bottomAbs = r.bottom + y;
    apply();
  };

  const apply = () => {
    ticking = false;
    const y = window.scrollY || window.pageYOffset;
    const overHero = (y + H) > topAbs && y < (bottomAbs - 1);
    document.documentElement.classList.toggle('over-hero', overHero);
    header.classList.toggle('is-scrolled', y > 0);
  };

  const onScroll = () => { if (!ticking){ ticking = true; requestAnimationFrame(apply); } };

  // medir em resize e quando o conteúdo do alvo mudar
  new ResizeObserver(measure).observe(hero);
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', measure, { once: true, passive: true });
  document.addEventListener('DOMContentLoaded', measure);

  measure();
})();
