/* app.js — Interações básicas */
(function(){
  'use strict';
  const qs = (s,el=document)=>el.querySelector(s);
  const year = qs('#year'); if (year) year.textContent = String(new Date().getFullYear());

  // Calculadora de cotas
  const btn = qs('#btn-calcular');
  const out = qs('#calc-resultado');
  if (btn && out){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      const total = Number(qs('#empregados')?.value || 0);
      const isMeepp = qs('#is_meepp')?.checked || false;
      const isOscil = qs('#is_oscil')?.checked || false;
      const isPerigo = qs('#is_perigo')?.checked || false;
      const p = Number(qs('#percentual')?.value || 0);

      if (!Number.isFinite(total) || total <= 0){
        out.textContent = 'Informe o total de empregados (número positivo).';
        return;
      }

      const min = Math.floor(total * 0.05);
      const max = Math.ceil(total * 0.15);
      const obs = [];
      if (isMeepp) obs.push('ME/EPP: hipóteses de dispensa/parâmetros diferenciados.');
      if (isOscil) obs.push('Entidade sem fins lucrativos: regras específicas.');
      if (isPerigo) obs.push('Funções vedadas/periculosas: reavaliar base por CBO.');

      let alvo = '';
      if (p && p > 0 && p <= 100){
        const n = Math.round(total * (p/100));
        alvo = ` • Estimativa pelo percentual pretendido (${p}%): ${n} aprendiz(es).`;
      }
      out.textContent = `Faixa estimada: ${min} a ${max} aprendiz(es).${alvo}${obs.length? ' Observações: ' + obs.join(' '): ''}`;
    });
  }
})();