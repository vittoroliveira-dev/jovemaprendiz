// assets/js/modules/fab-avoid-footer.js
export function initFabAvoidFooter(){
  const html = document.documentElement;
  const isContato = html.classList.contains('page--contato');
  const mql = window.matchMedia('(max-width:640px)');

  const footer = document.querySelector('.c-footer__inner');
  const right  = document.querySelector('.c-footer__right');
  const social = document.querySelector('.c-footer__social');
  const fab    = document.querySelector('[data-js="fab-whatsapp"]');
  if(!footer) return;

  const clear = () => {
    footer?.style.removeProperty('padding-bottom');
    right?.style.removeProperty('padding-bottom');
    social?.style.removeProperty('padding-bottom'); // ← limpa o nav
  };

  const apply = () => {
    // Contato mobile: nunca injeta e limpa qualquer inline remanescente
    if(isContato && mql.matches){ clear(); return; }
    if(!fab) return;

    const h = fab.getBoundingClientRect().height;
    const safe = Math.ceil(h/2 + 12);
    // nunca use o nav como alvo
    const target = right ?? footer;
    target.style.paddingBottom = `${safe}px`;
    // garante que o nav permaneça zerado
    social?.style.removeProperty('padding-bottom');
  };

  apply();
  window.addEventListener('resize', apply);
  mql.addEventListener?.('change', apply);
  window.addEventListener('pagehide', () => {
    window.removeEventListener('resize', apply);
    mql.removeEventListener?.('change', apply);
  }, { once:true });
}
