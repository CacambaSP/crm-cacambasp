/* ══════════════════════════════════════════════════════════════
   PENDÊNCIAS DO CLIENTE — ordens em aberto (não pagas)
   Mostra o que o cliente deve, com destaque para o que está vencido há mais de 7 dias:
     • faixa vermelha nos cards ainda não pagos do cliente (só quando há ordem com +7 dias);
     • lista das outras ordens em aberto na janela de registrar pagamento;
     • detalhe "sendo N vencidas há +7 dias" nos avisos de pedido novo, duplicar e fornecedor.
   Valor = o que o cliente paga (com os R$ 40 da NF e o desconto de ISS retido, quando houver).
   Dias contados a partir da data da ordem (mesma regra do "Atrasado" do CRM).
   Em aberto = não paga, não cancelada, fora de Concluído e de Orçamento.
   Usado pelo index.html (lista `ordens`) e pelo mobile2.html (lista `_ordens`). Só leitura: não altera dados.
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const LIMITE = 7;
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dig = s => String(s || '').replace(/\D/g, '');
const normCel = s => { const d = dig(s); return (d.length >= 12 && d.startsWith('55')) ? d.slice(2) : d; };
const dataBR = d => { if (!d) return ''; const p = String(d).slice(0,10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; };

function todas(){
  try { if (typeof ordens !== 'undefined' && Array.isArray(ordens)) return ordens; } catch(e) {}
  try { if (typeof _ordens !== 'undefined' && Array.isArray(_ordens)) return _ordens; } catch(e) {}
  return [];
}
function dias(o){
  const dt = o.data ? new Date(String(o.data).slice(0,10) + 'T12:00:00') : (o.criado_em ? new Date(o.criado_em) : null);
  if (!dt || isNaN(dt.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - dt.getTime()) / 86400000));
}
const emAberto = o => o && !o.pago && !o.cancel_motivo && o.col !== 'concluido' && o.col !== 'orcamento';
/* Valor que o cliente paga: rec + acréscimo da NF (rec é gravado sem os R$ 40) e, se o cliente retém ISS,
   já com o desconto — igual à janela de registrar pagamento. Menos a entrada já recebida, se houver. */
function valor(o){
  let nf = 40; try { if (typeof _nfAcrescimo !== 'undefined' && _nfAcrescimo) nf = Number(_nfAcrescimo); } catch(e) {}
  let v = (parseFloat(o.rec) || 0) + (o.nf_num ? nf : 0);
  if (o.desconta_iss) { let f = 0.024; try { if (typeof _issFrac === 'function') f = _issFrac(o); } catch(e) {} v = v * (1 - f); }
  v = Math.round(v * 100) / 100;
  return Math.max(0, v - (parseFloat(o.pago_parcial_valor) || 0));
}

/* Índice por telefone, refeito a cada ciclo de tela (o funil desenha todos os cards de uma vez). */
let IDX = null;
function indice(){
  if (IDX) return IDX;
  IDX = new Map();
  for (const o of todas()) {
    if (!emAberto(o)) continue;
    const t = normCel(o.cel || o.wh); if (t.length < 8) continue;
    if (!IDX.has(t)) IDX.set(t, []);
    IDX.get(t).push(o);
  }
  setTimeout(() => { IDX = null; }, 0);
  return IDX;
}

/** Ordens em aberto do cliente (pelo telefone), mais antigas primeiro. */
function doCliente(cel, excluirId){
  const t = normCel(cel); if (t.length < 8) return [];
  return (indice().get(t) || []).filter(o => o.id !== excluirId).slice().sort((a, b) => dias(b) - dias(a));
}
function resumo(lista){
  const venc = lista.filter(o => dias(o) > LIMITE);
  return {
    count: lista.length, total: lista.reduce((s, o) => s + valor(o), 0),
    vencCount: venc.length, vencTotal: venc.reduce((s, o) => s + valor(o), 0)
  };
}

/** Faixa vermelha no card: só quando o cliente tem ordem em aberto há mais de 7 dias.
    Não aparece em ordem já paga (evita parecer que aquela ordem está devendo). */
function badge(o, mobile){
  if (!o || o.pago || o.cancel_motivo || o.col === 'orcamento' || o.col === 'concluido') return '';
  const r = resumo(doCliente(o.cel || o.wh, null));
  if (!r.vencCount) return '';
  const txt = '⚠️ CLIENTE DEVE ' + brl(r.vencTotal) + ' · ' + r.vencCount + (r.vencCount > 1 ? ' ordens' : ' ordem') + ' há +' + LIMITE + ' dias';
  return mobile
    ? '<div style="margin:4px 14px 0 28px;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:800;text-align:center;color:#ef4444;background:rgba(239,68,68,.13);border:1px solid rgba(239,68,68,.4)">' + txt + '</div>'
    : '<div style="font-size:9px;color:#fff;font-weight:800;margin-bottom:3px;background:#dc2626;padding:2px 6px;border-radius:4px;display:inline-block">' + txt + '</div>';
}

/** Texto extra para os avisos que já existem ("X ordens em aberto"). */
function detalhe(lista){
  const r = resumo(lista || []);
  if (!r.vencCount) return '';
  return ' — sendo <strong>' + r.vencCount + ' vencida' + (r.vencCount > 1 ? 's' : '') + ' há +' + LIMITE + ' dias (' + brl(r.vencTotal) + ')</strong>';
}

/** Lista das outras ordens em aberto na janela de registrar pagamento. */
function painelPagamento(o, campoValor){
  const elVal = document.getElementById(campoValor); if (!elVal) return;
  let box = document.getElementById('pend_pg_box');
  if (!box) {
    box = document.createElement('div'); box.id = 'pend_pg_box';
    box.style.cssText = 'display:none;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.35);border-radius:8px;padding:10px 12px;font-size:12px;color:#ef4444;margin:0 0 12px';
    const wrap = elVal.closest('.fi,.mfi') || elVal;
    wrap.insertAdjacentElement('beforebegin', box);
  }
  box.style.display = 'none'; box.innerHTML = '';
  if (!o) return;
  const lista = doCliente(o.cel || o.wh, o.id);
  if (!lista.length) return;
  const r = resumo(lista);
  const MAX = 8;
  const linhas = lista.slice(0, MAX).map(x => {
    const d = dias(x), venc = d > LIMITE;
    return '<div style="display:flex;justify-content:space-between;gap:8px;' + (venc ? 'font-weight:700' : 'color:var(--mut2,#94a3b8)') + '">' +
      '<span>' + esc(x.crm_id || '—') + ' · ' + dataBR(x.data) + ' · ' + d + ' dia' + (d === 1 ? '' : 's') + '</span><span style="font-family:var(--mono,monospace)">' + brl(valor(x)) + '</span></div>';
  }).join('');
  box.innerHTML =
    '<div style="font-weight:800;margin-bottom:5px">⚠️ Outras ordens em aberto: ' + r.count + ' · ' + brl(r.total) +
    (r.vencCount ? '<br><span style="font-weight:700">' + r.vencCount + ' vencida' + (r.vencCount > 1 ? 's' : '') + ' há +' + LIMITE + ' dias (' + brl(r.vencTotal) + ')</span>' : '') + '</div>' +
    linhas + (lista.length > MAX ? '<div style="margin-top:3px;opacity:.8">… e mais ' + (lista.length - MAX) + '</div>' : '');
  box.style.display = 'block';
}

const totalDe = lista => (lista || []).reduce((s, o) => s + valor(o), 0);
window.Pendencias = { doCliente, resumo, badge, detalhe, painelPagamento, dias, valor, totalDe, LIMITE };
})();
