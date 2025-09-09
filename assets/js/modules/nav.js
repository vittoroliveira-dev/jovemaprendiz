// /assets/js/modules/nav.js

export function initNav() {
  const toggle = document.querySelector('[data-js="nav-toggle"]');
  const nav = document.querySelector('[data-js="nav"]');
  const body = document.body;

  if (!toggle || !nav) return;

  const OPEN_CLASS = 'is-open';
  const BODY_LOCK_CLASS = 'has-nav-open';
  let lastFocus = null;

  const focusablesSelector =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

  const pageMain = document.querySelector('main') || document.getElementById('conteudo-principal');

  function setInertBehind(isInert) {
    if (!pageMain) return;
    if (isInert) {
      // Fallback seguro sem polyfill
      pageMain.setAttribute('aria-hidden', 'true');
      pageMain.setAttribute('inert', '');
    } else {
      pageMain.removeAttribute('aria-hidden');
      pageMain.removeAttribute('inert');
    }
  }

  function getFocusables() {
    return Array.from(nav.querySelectorAll(focusablesSelector))
      .filter(el => el.getClientRects().length > 0 || el === document.activeElement);
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const nodes = getFocusables();
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const isShift = e.shiftKey;

    if (!isShift && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (isShift && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeNav();
    } else {
      trapFocus(e);
    }
  }

  function onDocPointerDown(e) {
    const t = e.target;
    if (!nav.contains(t) && !toggle.contains(t)) {
      closeNav();
    }
  }

  function openNav() {
    if (nav.classList.contains(OPEN_CLASS)) return;
    lastFocus = document.activeElement;

    nav.classList.add(OPEN_CLASS);
    toggle.setAttribute('aria-expanded', 'true');
    body.classList.add(BODY_LOCK_CLASS);
    setInertBehind(true);

    // foco no primeiro link do menu, se existir
    const first = getFocusables()[0];
    if (first) first.focus();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onDocPointerDown, { capture: true });
  }

  function closeNav({ skipFocusRestore = false } = {}) {
    if (!nav.classList.contains(OPEN_CLASS)) return;

    nav.classList.remove(OPEN_CLASS);
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove(BODY_LOCK_CLASS);
    setInertBehind(false);

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointerdown', onDocPointerDown, { capture: true });

    if (!skipFocusRestore && lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  // Toggle click
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.contains(OPEN_CLASS);
    if (isOpen) closeNav(); else openNav();
  });

  // Fecha ao clicar em um link do menu (melhor UX no mobile)
  nav.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    // Só fecha se o menu está em modo "off-canvas" (toggle visível)
    const toggleHidden = window.getComputedStyle(toggle).display === 'none';
    if (!toggleHidden) closeNav();
  });

  // Reset saudável ao mudar para desktop (quando o toggle some via CSS)
  const mq = window.matchMedia('(min-width: 64em)'); // alinhe com seu breakpoint de desktop
  const handleMQ = () => {
    const toggleHidden = window.getComputedStyle(toggle).display === 'none';
    if (toggleHidden) closeNav({ skipFocusRestore: true });
  };
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', handleMQ);
  } else if (typeof mq.addListener === 'function') {
    // fallback para navegadores antigos
    mq.addListener(handleMQ);
  } else {
    window.addEventListener('resize', handleMQ);
  }
  handleMQ(); // estado inicial
}
