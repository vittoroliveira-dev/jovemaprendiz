// /assets/js/modules/nav.js

/**
 * Inicializa a funcionalidade de navegação principal, incluindo menu mobile e dropdowns.
 * Gerencia a abertura/fechamento do menu, foco, acessibilidade e responsividade.
 */
export function initNav() {
  // --- Seletores e Constantes Iniciais ---
  const toggleButton = document.querySelector('[data-js="nav-toggle"]');
  const navigationMenu = document.querySelector('[data-js="nav"]');
  const bodyElement = document.body;
  const mainContent = document.querySelector('main') || document.getElementById('conteudo-principal');

  if (!toggleButton || !navigationMenu) {
    console.warn('Elementos de navegação (toggle ou menu) não encontrados.');
    return;
  }

  const CLASS_NAV_OPEN = 'is-open'; // Apenas para o painel principal do menu
  const CLASS_BODY_LOCK = 'has-nav-open';
  const DESKTOP_MQ = window.matchMedia('(min-width: 769px)'); // ou '(min-width: 48.001em)'
  const focusableElementsSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let lastFocusedElement = null;

  // --- Funções Auxiliares ---
  const isDesktopView = () => DESKTOP_MQ.matches;

  const getFocusableElements = (element = navigationMenu) =>
    Array.from(element.querySelectorAll(focusableElementsSelector)).filter(
      (el) => el.getClientRects().length > 0
    );

/**
 * Define ou remove os atributos 'inert' e 'aria-hidden' do conteúdo principal.
 * @param {boolean} shouldBeInert - True para tornar o conteúdo inerte, false para reativá-lo.
 */
const setMainContentInert = (shouldBeInert) => {
  if (!mainContent) return;

  // toggleAttribute(name, force) adiciona o atributo se force=true e remove se force=false.
  // É a forma ideal e mais limpa para atributos booleanos.
  mainContent.toggleAttribute('inert', shouldBeInert);
  mainContent.toggleAttribute('aria-hidden', shouldBeInert);
};

  // --- Itens com dropdown ---
  const dropdownItems = [...navigationMenu.querySelectorAll('.c-nav__item--has-dropdown')];

  /**
   * Fecha todos os dropdowns abertos, exceto o do gatilho passado.
   */
  const closeAllDropdowns = (exceptTrigger = null) => {
    dropdownItems.forEach((item) => {
      const trigger = item.querySelector('[aria-controls]');
      if (trigger === exceptTrigger) return;

      const panelId = trigger?.getAttribute('aria-controls');
      if (!panelId) return;

      const panel = document.getElementById(panelId);
      if (panel && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  };

  /**
   * Configura um único dropdown baseado em [hidden] + aria-expanded.
   */
  function setupDropdown(dropdownItem) {
    const trigger = dropdownItem.querySelector('[aria-controls]');
    const panelId = trigger?.getAttribute('aria-controls');
    if (!trigger || !panelId) return;

    const panel = document.getElementById(panelId);
    if (!panel) return;

    // Estado inicial coerente com CSS
    trigger.setAttribute('aria-expanded', 'false');
    panel.setAttribute('hidden', '');

    // Alterna abertura
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Fecha outros antes de abrir
      closeAllDropdowns(trigger);

      trigger.setAttribute('aria-expanded', String(!isExpanded));
      panel.toggleAttribute('hidden');
    });

    // Fecha com Escape
    dropdownItem.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllDropdowns();
        trigger.focus();
      }
    });

    // Fecha ao perder foco do componente
    dropdownItem.addEventListener('focusout', (e) => {
      if (!dropdownItem.contains(e.relatedTarget)) {
        closeAllDropdowns();
      }
    });
  }

  // Inicializa dropdowns
  dropdownItems.forEach(setupDropdown);

  // --- Menu Mobile Principal (abrir/fechar, foco e travas) ---
  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  }

  function onGlobalKeyDown(event) {
    if (event.key === 'Escape') {
      closeNavigationMenu();
    }
    trapFocus(event);
  }

  function onDocumentPointerDown(event) {
    if (!navigationMenu.contains(event.target) && !toggleButton.contains(event.target)) {
      closeNavigationMenu();
    }
  }

  function openNavigationMenu() {
    if (navigationMenu.classList.contains(CLASS_NAV_OPEN)) return;
    lastFocusedElement = document.activeElement;
    navigationMenu.classList.add(CLASS_NAV_OPEN);
    toggleButton.setAttribute('aria-expanded', 'true');
    bodyElement.classList.add(CLASS_BODY_LOCK);
    setMainContentInert(true);
    getFocusableElements()[0]?.focus();
    document.addEventListener('keydown', onGlobalKeyDown);
    document.addEventListener('pointerdown', onDocumentPointerDown);
  }

  function closeNavigationMenu({ skipFocusRestore = false } = {}) {
    if (!navigationMenu.classList.contains(CLASS_NAV_OPEN)) return;
    navigationMenu.classList.remove(CLASS_NAV_OPEN);
    toggleButton.setAttribute('aria-expanded', 'false');
    bodyElement.classList.remove(CLASS_BODY_LOCK);
    setMainContentInert(false);
    document.removeEventListener('keydown', onGlobalKeyDown);
    document.removeEventListener('pointerdown', onDocumentPointerDown);
    if (!skipFocusRestore && lastFocusedElement?.focus) {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
    // Fecha dropdowns abertos ao fechar o menu
    closeAllDropdowns();
  }

  // Eventos principais
  toggleButton.addEventListener('click', () => {
    const isNavOpen = navigationMenu.classList.contains(CLASS_NAV_OPEN);
    isNavOpen ? closeNavigationMenu() : openNavigationMenu();
  });

  // Fecha o menu mobile ao clicar em um link comum
  navigationMenu.addEventListener('click', (e) => {
    const clickedLink = e.target.closest('a[href]:not([aria-controls])');
    if (clickedLink && !isDesktopView()) {
      closeNavigationMenu();
    }
  });

  // Responsividade: ao entrar no desktop, garante tudo fechado
  const handleMediaQueryChange = () => {
    if (isDesktopView()) {
      closeNavigationMenu({ skipFocusRestore: true });
      closeAllDropdowns();
    }
  };

  DESKTOP_MQ.addEventListener('change', handleMediaQueryChange);
  handleMediaQueryChange(); // Chamada inicial
}
