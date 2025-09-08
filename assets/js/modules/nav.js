// Arquivo: /assets/js/modules/nav.js

export function initNav() {
  const toggleButton = document.querySelector('[data-js="nav-toggle"]');
  const navElement = document.querySelector('[data-js="nav"]');
  const body = document.body;

  if (!toggleButton || !navElement) {
    return;
  }

  toggleButton.addEventListener('click', () => {
    const isOpen = navElement.classList.toggle('is-open');
    toggleButton.setAttribute('aria-expanded', isOpen.toString());

    // Bloqueia o scroll do body quando o menu está aberto
    body.dataset.menuOpen = isOpen.toString();
  });
}
