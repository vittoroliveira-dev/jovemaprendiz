// /assets/js/modules/contact.js

// /assets/js/modules/contact.js
export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) {
    if (location.hostname === 'localhost') {
      console.warn("Formulário com ID 'contact-form' não encontrado.");
    }
    return () => {};
  }

  // cria/pega status
  const statusEl =
    form.querySelector('[data-js="status"]') ||
    (() => {
      const el = document.createElement('p');
      el.className = 'c-form__status';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.setAttribute('aria-relevant', 'additions text');
      el.setAttribute('data-js', 'status');
      el.setAttribute('tabindex', '-1'); // foco programático após mensagens
      (form.querySelector('.c-form__actions') || form).appendChild(el);
      return el;
    })();

  // id único
  if (!statusEl.id) {
    const baseId = `${form.id || 'form'}-status`;
    let uniqueId = baseId, i = 1;
    while (document.getElementById(uniqueId)) uniqueId = `${baseId}-${i++}`;
    statusEl.id = uniqueId;
  }

  // botão
  const submitBtn =
    form.querySelector('[data-js="submit"]') ||
    form.querySelector('button[type="submit"]') ||
    null;
  const originalBtnText = submitBtn?.textContent;

  // aria-describedby
  const linkStatusTo = (el) => {
    if (!el) return;
    const cur = (el.getAttribute('aria-describedby') || '').trim().split(/\s+/).filter(Boolean);
    if (!cur.includes(statusEl.id)) el.setAttribute('aria-describedby', [...cur, statusEl.id].join(' '));
  };
  
form.querySelectorAll(':where(input, select, textarea):not([type="hidden"]):not([name="_gotcha"]):not([hidden]):not(:disabled)')
  .forEach(linkStatusTo);
linkStatusTo(submitBtn);

// controle de requisição
let ctrl = null;
let timeoutId = null;

  // envio
const onSubmit = async (e) => {
  e.preventDefault();

    // honeypot
    const honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) {
      if (location.hostname === 'localhost') console.warn('Honeypot ativado. Possível spam.');
      return;
    }

    // validação
    if (!form.checkValidity()) {
      form.reportValidity();
      form.querySelector(':invalid')?.focus();
      form.dataset.state = 'error';
      statusEl.textContent = 'Por favor, preencha todos os campos obrigatórios.';
      statusEl.setAttribute('aria-live', 'assertive');
      setTimeout(() => statusEl.setAttribute('aria-live', 'polite'), 500);
      return;
    }

    if (form.dataset.state === 'loading') return;

    // loading
    form.dataset.state = 'loading';
    form.setAttribute('aria-busy', 'true');
    statusEl.textContent = 'Enviando sua mensagem...';
    statusEl.setAttribute('aria-live', 'polite');
    if (submitBtn) {
      submitBtn.setAttribute('disabled', '');
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.setAttribute('aria-disabled', 'true');
      submitBtn.textContent = 'Enviando...';
    }

    try {
    ctrl = new AbortController();
    timeoutId = setTimeout(() => ctrl?.abort(), 15000); // usa ?. e guarda id
      
	    const res = await fetch(form.action, {
  method: 'POST',
  headers: { Accept: 'application/json' }, // para receber JSON
  body: new FormData(form),                // não defina Content-Type manualmente
  signal: ctrl.signal,
  credentials: 'omit',
});

if (res.ok) {
      form.reset();
      form.dataset.state = 'success';
      statusEl.textContent = 'Mensagem enviada com sucesso! Retornaremos em breve.';
      statusEl.setAttribute('aria-live', 'assertive');
      requestAnimationFrame(() => statusEl.focus());
      form.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
      setTimeout(() => statusEl.setAttribute('aria-live', 'polite'), 500);
    } else {
      const data = await res.json().catch(() => ({}));
      form.dataset.state = 'error';
      statusEl.textContent = data?.errors?.[0]?.message || 'Não foi possível enviar sua mensagem. Por favor, tente novamente.';
      statusEl.setAttribute('aria-live', 'assertive');
      setTimeout(() => statusEl.setAttribute('aria-live', 'polite'), 500);
    }
  } catch (err) {
    if (err.name === 'AbortError') return; // navegação/timeout: não sinaliza erro
    console.error('Erro de rede ou na requisição:', err);
    form.dataset.state = 'error';
    statusEl.textContent = 'Falha na conexão. Verifique sua internet e tente novamente.';
    statusEl.setAttribute('aria-live', 'assertive');
    setTimeout(() => statusEl.setAttribute('aria-live', 'polite'), 500);
  } finally {
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    ctrl = null;
    if (submitBtn) {
      submitBtn.removeAttribute('disabled');
      submitBtn.removeAttribute('aria-busy');
      submitBtn.removeAttribute('aria-disabled');
      submitBtn.textContent = originalBtnText ?? 'Quero falar com um especialista';
    }
    form.removeAttribute('aria-busy');
    if (form.dataset.state === 'loading') delete form.dataset.state;
  }
};

// feedback de erro por campo
const onInvalid = (ev) => {
  const el = ev.target;
  if (el instanceof HTMLElement) el.setAttribute('aria-invalid', 'true');
};

const onFieldChange = (ev) => {
  const el = ev.target;
  if (el instanceof HTMLElement) el.removeAttribute('aria-invalid');
  if (form.dataset.state === 'error') {
    statusEl?.setAttribute('aria-live', 'polite');
    // statusEl.textContent = '';
  }
};

form.addEventListener('invalid', onInvalid, true);
form.addEventListener('input', onFieldChange, true);
form.addEventListener('change', onFieldChange, true);
form.addEventListener('submit', onSubmit);

// aborta requisição se sair da página
const onPageHide = () => ctrl?.abort();
window.addEventListener('pagehide', onPageHide, { once: true });
window.addEventListener('beforeunload', onPageHide, { once: true });

// cleanup (sem return no topo do módulo)
const cleanup = () => {
  form.removeEventListener('submit', onSubmit);
  form.removeEventListener('invalid', onInvalid, true);
  form.removeEventListener('input', onFieldChange, true);
  form.removeEventListener('change', onFieldChange, true);
  window.removeEventListener('pagehide', onPageHide);
  window.removeEventListener('beforeunload', onPageHide);
};

return () => {}; // opcional: cleanup
}

// opcional: tornar acessível
// export { cleanup as cleanupContactForm };
// ou: form.cleanup = cleanup;