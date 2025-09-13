// Esconde o item "Contato" no header desta página
(() => {
  const header = document.querySelector('.c-header.c-header--contato');
  if (!header) return;
  const item = header
    .querySelector('.c-nav__item > a[href$="/contato.html"][aria-current="page"]')
    ?.closest('.c-nav__item');
  if (item) item.hidden = true;
})();
