// /assets/js/modules/pwa-init.js
(() => {
  const isPWA = matchMedia('(display-mode: standalone)').matches
             || window.navigator.standalone === true;
  if (!isPWA || sessionStorage.getItem('pwa_launch_fired')) return;

  document.documentElement.classList.add('is-pwa');
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'pwa_launch' });
  sessionStorage.setItem('pwa_launch_fired', '1');
})();
