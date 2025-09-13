// puro JS, nada de <script>, <div>, templates etc.
(function () {
  const footer = document.querySelector('.c-footer');
  if (!footer || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries) => {
    const e = entries[0];
    document.body.classList.toggle('fab-avoid-footer', !!(e && e.isIntersecting));
  }, {
    threshold: 0,
    rootMargin: '0px 0px -20% 0px'
  });

  io.observe(footer);
})();