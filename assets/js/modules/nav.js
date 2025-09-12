// /assets/js/modules/nav.js

/**
 * Inicializa a funcionalidade de navegação principal, incluindo menu mobile e dropdowns.
 * Gerencia a abertura/fechamento do menu, foco, acessibilidade e responsividade.
 */
 
export function initNav() {
  // Seletores
  const toggleButton = document.querySelector('[data-js="nav-toggle"]');
  const navigationMenu = document.querySelector('[data-js="nav"]');
  const bodyElement = document.body;
  const mainContent = document.querySelector('main') || document.getElementById('conteudo-principal');

  // Sai da função se os elementos essenciais não forem encontrados
  if (!toggleButton || !navigationMenu) {
    console.warn('Elementos de navegação (toggle ou menu) não encontrados.');
    return; // Retorna sem inicializar a navegação
  }
  
  
   // A11y: estado inicial do toggle
if (!toggleButton.hasAttribute('aria-expanded')) {
  toggleButton.setAttribute('aria-expanded', 'false');
}

// Suporte teclado se o toggle não for <button>
if (toggleButton.tagName !== 'BUTTON') {
  toggleButton.setAttribute('role', 'button');
  if (toggleButton.tabIndex < 0) toggleButton.tabIndex = 0;
  toggleButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigationMenu.classList.contains(CLASS_OPEN)
        ? closeNavigationMenu()
        : openNavigationMenu();
    }
  });
}

  // Classes CSS para controle de estado
  const CLASS_OPEN = 'is-open';
  const CLASS_BODY_LOCK = 'has-nav-open';

  let lastFocusedElement = null; // Armazena o último elemento focado antes de abrir o menu


  /**
   * Verifica se o botão de toggle do menu mobile está visível (indicando modo mobile).
   * @returns {boolean} True se o toggle estiver visível, false caso contrário.
   */
   
  const isToggleButtonVisible = () => getComputedStyle(toggleButton).display !== 'none';

  // Focáveis dentro do menu
  const focusableElementsSelector =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

  /**
   * Obtém uma lista de todos os elementos focáveis dentro do menu de navegação.
   * Filtra elementos que não estão visíveis (e.g., dentro de dropdowns fechados).
   * @returns {HTMLElement[]} Array de elementos focáveis.
   */
   
  const getFocusableElements = () =>
    Array.from(navigationMenu.querySelectorAll(focusableElementsSelector)).filter(
      (el) => el.getClientRects().length > 0 || el === document.activeElement
    );


  /**
   * Define o estado 'inert' e 'aria-hidden' para o conteúdo principal da página.
   * Isso impede que usuários de teclado e leitores de tela interajam com o conteúdo atrás do menu aberto.
   * @param {boolean} isInert - True para tornar o conteúdo inerte, false para remover.
   */
   
  const setInertBehindMainContent = (isInert) => {
    if (!mainContent) return;
    if (isInert) {
      mainContent.setAttribute('aria-hidden', 'true');
      mainContent.setAttribute('inert', '');
    } else {
      mainContent.removeAttribute('aria-hidden');
      mainContent.removeAttribute('inert');
    }
  };

  // --- Dropdowns Genéricos ---

  /**
   * Gera um ID único para elementos (e.g., painéis de dropdown).
   * @param {string} prefix - Prefixo para o ID (padrão: 'dd-').
   * @returns {string} Um ID único.
   */
   
  const generateUniqueId = (prefix = 'dd-') => prefix + Math.random().toString(36).slice(2, 9);

  function setupDropdown(dropdownItem) {
    const trigger =
      dropdownItem.querySelector('button.c-nav__link, .c-nav__link[role="button"]') ||
      dropdownItem.querySelector('.c-nav__link');
    const panel = dropdownItem.querySelector('.c-nav__dropdown');
    if (!trigger || !panel) return null; // Sai se o gatilho ou o painel não forem encontrados

// Garante que o painel tenha um ID para acessibilidade
    if (!panel.id) panel.id = generateUniqueId();
	    // Configura atributos ARIA para o gatilho
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'menu');
    panel.hidden = true;

    /**
     * Verifica se o dropdown está aberto.
     * @returns {boolean} True se o dropdown estiver aberto, false caso contrário.
     */
	 
    const isDropdownOpen = () => dropdownItem.classList.contains(CLASS_OPEN);

    /** Abre o dropdown. */
    const openDropdown = () => {
      dropdownItem.classList.add(CLASS_OPEN);
      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      if (document.activeElement === trigger) {
        const firstFocusable = panel.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        firstFocusable?.focus();
      }
    };
	
    /** Fecha o dropdown. */
    const closeDropdown = () => {
      dropdownItem.classList.remove(CLASS_OPEN);
      trigger.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
	        // Remove o foco do gatilho para evitar o estado :focus-within no item pai
      if (document.activeElement === trigger) trigger.blur();
    };

    // Event Listeners para o gatilho do dropdown
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      isDropdownOpen() ? closeDropdown() : openDropdown();
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isDropdownOpen() ? closeDropdown() : openDropdown();
      } else if (e.key === 'Escape') {
        closeDropdown();
        trigger.focus(); // Retorna o foco para o gatilho
      }
    });

    // Fecha o dropdown se o foco sair do item pai do dropdown
    dropdownItem.addEventListener('focusout', (e) => {
      if (!dropdownItem.contains(e.relatedTarget)) closeDropdown();
    });

    return { isOpen: isDropdownOpen, close: closeDropdown };
  }

  // Inicializa todos os dropdowns e armazena suas APIs
  const dropdownAPIs = Array.from(navigationMenu.querySelectorAll('.c-nav__item--has-dropdown'))
    .map(setupDropdown)
    .filter(Boolean);

  /**
   * Verifica se algum dropdown está aberto.
   * @returns {boolean} True se pelo menos um dropdown estiver aberto, false caso contrário.
   */
   
  const isAnyDropdownOpen = () => dropdownAPIs.some((d) => d.isOpen());
  
    /** Fecha todos os dropdowns abertos. */
	
  const closeAllDropdowns = () => dropdownAPIs.forEach((d) => d.close());

  // --- Gerenciamento de Foco e Teclado para o Menu Mobile ---

  /**
   * Implementa a armadilha de foco (focus trap) para o menu mobile.
   * Garante que o foco do teclado permaneça dentro do menu quando ele está aberto.
   * @param {KeyboardEvent} event - O evento de teclado.
   */
   
  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const focusableElements = getFocusableElements();
    if (!focusableElements.length) return;
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (!event.shiftKey && document.activeElement === last) {
		      // Se Tab for pressionado no último elemento, move o foco para o primeiro
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
		 // Se Shift+Tab for pressionado no primeiro elemento, move o foco para o último
      event.preventDefault();
      last.focus();
    }
  }


  /**
   * Manipulador global de eventos de teclado quando o menu mobile está aberto.
   * @param {KeyboardEvent} event - O evento de teclado.
   */
   
  function onGlobalKeyDown(event) {
    if (event.key === 'Escape') {
      isAnyDropdownOpen() ? closeAllDropdowns() : closeNavigationMenu();
      return;
    }
    trapFocus(event); // Aplica a armadilha de foco
  }

  /**
   * Manipulador global de eventos de clique/pointerdown para fechar o menu mobile.
   * Fecha o menu se o clique ocorrer fora do menu ou do botão de toggle.
   * @param {PointerEvent} event - O evento de pointerdown.
   */
   
  function onDocumentPointerDown(event) {
    if (!navigationMenu.contains(event.target) && !toggleButton.contains(event.target)) {
      closeNavigationMenu();
    }
  }

  // --- Menu Mobile Principal ---

  /** Abre o menu de navegação mobile. */
  
  function openNavigationMenu() {
    if (navigationMenu.classList.contains(CLASS_OPEN)) return; // Sai se já estiver aberto
    lastFocusedElement = document.activeElement; // Salva o elemento focado antes de abrir

    navigationMenu.classList.add(CLASS_OPEN);
    toggleButton.setAttribute('aria-expanded', 'true');
    bodyElement.classList.add(CLASS_BODY_LOCK);
    setInertBehindMainContent(true); // Torna o conteúdo principal inerte

    // Move o foco para o primeiro elemento focável dentro do menu
    getFocusableElements()[0]?.focus();

    // Adiciona listeners globais para gerenciamento de foco e fechamento
    document.addEventListener('keydown', onGlobalKeyDown);
    document.addEventListener('pointerdown', onDocumentPointerDown, { capture: true });
  }

  /**
   * Fecha o menu de navegação mobile.
   * @param {object} [options] - Opções para o fechamento.
   * @param {boolean} [options.skipFocusRestore=false] - Se true, não restaura o foco para o elemento anterior.
   */
   
  function closeNavigationMenu({ skipFocusRestore = false } = {}) {
    if (!navigationMenu.classList.contains(CLASS_OPEN)) return; // Sai se já estiver fechado

    closeAllDropdowns(); // Fecha quaisquer dropdowns abertos dentro do menu

    navigationMenu.classList.remove(CLASS_OPEN);
    toggleButton.setAttribute('aria-expanded', 'false');
    bodyElement.classList.remove(CLASS_BODY_LOCK);
    setInertBehindMainContent(false); // Remove o estado inerte do conteúdo principal

    // Remove listeners globais
    document.removeEventListener('keydown', onGlobalKeyDown);
    document.removeEventListener('pointerdown', onDocumentPointerDown, { capture: true });

    // Restaura o foco para o elemento que estava focado antes de abrir o menu
    if (!skipFocusRestore && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null; // Limpa a referência
  }

  // --- Eventos Principais ---

  // Listener para o botão de toggle do menu mobile
  
  toggleButton.addEventListener('click', () =>
    navigationMenu.classList.contains(CLASS_OPEN) ? closeNavigationMenu() : openNavigationMenu()
  );

  // Fecha o menu mobile ao clicar em um link dentro dele (se o toggle estiver visível)
  navigationMenu.addEventListener('click', (e) => {
    const clickedLink = e.target.closest('a[href]');
    if (clickedLink && isToggleButtonVisible()) closeNavigationMenu();
  });

  // --- Responsividade e Reset de Estado ---

  // Media Query para detectar transição entre mobile e desktop
  
  const mediaQuery = window.matchMedia('(min-width: 64em)'); // 64em = 1024px (se 1em=16px)

  /**
   * Manipulador para mudanças na media query (redimensionamento da janela).
   * Fecha o menu mobile e dropdowns quando a tela é redimensionada para desktop.
   */
   
  const handleMediaQueryChange = () => {
    if (!isToggleButtonVisible()) {
		      // Se o toggle não está visível, estamos em desktop
      closeNavigationMenu({ skipFocusRestore: true }); // Fecha o menu sem restaurar foco
      closeAllDropdowns(); // Fecha todos os dropdowns
    }
  };

  mediaQuery.addEventListener?.('change', handleMediaQueryChange);
  mediaQuery.addListener?.(handleMediaQueryChange); // fallback
  window.addEventListener('resize', handleMediaQueryChange);
  // Chama o manipulador uma vez na inicialização para definir o estado inicial
  handleMediaQueryChange();
}