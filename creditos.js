/* ══════════════════════════════════════════════════════════════
   CRÉDITOS DE CLIENTES — aviso automático
   Tabela clientes_credito (status ativo/usado/devolvido). Quando um cliente tem crédito
   (ex.: pagou e a caçamba não foi entregue), o CRM avisa:
     • no formulário de pedido novo, ao digitar o celular ou CPF/CNPJ;
     • com um selo 💰 no card das ordens desse cliente;
     • na janela de registrar pagamento (opção "Pagar com o crédito", abate só o valor da ordem);
     • ao duplicar uma ordem desse cliente.
   O crédito pode ser usado aos poucos: o valor diminui a cada uso e o histórico fica em usado_obs.
   Quando chega a zero, vira status 'usado' e some dos avisos.
   Usado pelo index.html e pelo mobile2.html. Depende de SUPA_URL, SUPA_KEY, tok(), toast().
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const CR = { lista: [], ts: 0, carregando: null, avisouRender: false, cfgs: {} };
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dig = s => String(s || '').replace(/\D/g, '');
const normCel = s => { const d = dig(s); return (d.length >= 12 && d.startsWith('55')) ? d.slice(2) : d; };
const token = () => { try { return tok(); } catch(e) { return null; } };
const aviso = (m, t) => { try { toast(m, t || 'ok'); } catch(e) { console.log(m); } };

async function carregar(forcar){
  if (!forcar && CR.ts && Date.now() - CR.ts < 60000) return CR.lista;
  if (!token()) return CR.lista;                 // ainda não logou
  if (CR.carregando) return CR.carregando;
  CR.carregando = (async () => {
    try {
      const r = await fetch(SUPA_URL + '/rest/v1/clientes_credito?status=eq.ativo&select=*', { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + token() } });
      if (r.ok) {
        const primeira = !CR.ts;
        CR.lista = await r.json(); CR.ts = Date.now();
        // primeira carga: redesenha a tela para os selos aparecerem nos cards
        if (primeira && CR.lista.length) {
          try { if (typeof renderBoard === 'function') renderBoard(); } catch(e) {}
          try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch(e) {}
        }
      }
    } catch(e) {}
    finally { CR.carregando = null; }
    return CR.lista;
  })();
  return CR.carregando;
}

/** Créditos ativos que batem com o celular ou o CPF/CNPJ. */
function doCliente(cel, cpf){
  const c = normCel(cel), d = dig(cpf);
  return CR.lista.filter(x => (c.length >= 8 && x.cel_normalizado === c) || (d.length >= 11 && x.cpf_normalizado === d));
}

/** Selo para o card da ordem (sincrono; usa o que já foi carregado). */
function badge(o, mobile){
  if (!CR.ts) { carregar(); return ''; }
  if (Date.now() - CR.ts > 60000) carregar();
  if (!o || o.cancel_motivo) return '';
  const l = doCliente(o.cel || o.wh, o.cpf);
  if (!l.length) return '';
  const total = l.reduce((s, x) => s + Number(x.valor || 0), 0);
  const txt = '💰 CLIENTE TEM CRÉDITO DE ' + brl(total) + ' — abater no pedido';
  return mobile
    ? '<div style="margin:4px 14px 0 28px;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:800;text-align:center;color:#22c55e;background:rgba(34,197,94,.13);border:1px solid rgba(34,197,94,.4)">' + txt + '</div>'
    : '<div style="font-size:9px;color:#fff;font-weight:800;margin-bottom:3px;background:#16a34a;padding:2px 6px;border-radius:4px;display:inline-block">' + txt + '</div>';
}

/**
 * Aviso no formulário de pedido novo.
 * cfg = { cel:'id do campo celular', cpf:'id do campo CPF', ancora:'id do elemento depois do qual o aviso aparece', nome:'id do campo nome', margem:'css opcional' }
 */
async function avisar(cfg){
  const elCel = document.getElementById(cfg.cel); if (!elCel) return;
  CR.cfgs[cfg.cel] = cfg;
  const elCpf = cfg.cpf && document.getElementById(cfg.cpf);
  if (elCpf && !elCpf.dataset.credOk) { elCpf.dataset.credOk = '1'; elCpf.addEventListener('input', () => avisar(cfg)); }
  const boxId = cfg.cel + '_credito';
  let box = document.getElementById(boxId);
  if (!box) {
    box = document.createElement('div'); box.id = boxId;
    box.style.cssText = 'display:none;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--g);margin:4px 0 10px';
    const anc = (cfg.ancora && document.getElementById(cfg.ancora)) || elCel;
    anc.insertAdjacentElement('afterend', box);
  }
  if (cfg.margem) box.style.margin = cfg.margem;
  const cel = elCel.value, cpf = elCpf ? elCpf.value : '';
  if (normCel(cel).length < 8 && dig(cpf).length < 11) { box.style.display = 'none'; return; }
  await carregar();
  const l = doCliente(cel, cpf);
  if (!l.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = l.map(x =>
    '💰 <b>Este cliente tem ' + brl(x.valor) + ' de crédito</b>' + (x.ordem_origem ? ' (' + esc(x.ordem_origem) + ')' : '') +
    (x.motivo ? '<div style="font-size:12px;opacity:.85;margin-top:2px">' + esc(x.motivo) + '</div>' : '') +
    '<div style="font-size:12px;margin-top:4px">Abata do crédito o valor usado neste pedido:</div>' +
    '<div style="display:flex;gap:6px;align-items:center;margin-top:6px"><span style="font-size:12px">R$</span>' +
    '<input type="number" step="0.01" inputmode="decimal" id="' + boxId + '_v_' + x.id + '" value="' + Number(x.valor || 0).toFixed(2) + '" style="width:110px;padding:5px 8px;border-radius:6px;border:1px solid rgba(34,197,94,.5);background:transparent;color:inherit;font-size:13px">' +
    '<button type="button" onclick="Creditos.usar(\'' + x.id + '\',\'' + cfg.cel + '\',\'' + (cfg.nome || '') + '\')" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer">✅ Abater do crédito</button></div>'
  ).join('<hr style="border:none;border-top:1px solid rgba(34,197,94,.3);margin:8px 0">');
}

/** Abate `valor` do crédito `id` (lendo o saldo atual do banco). Retorna quanto abateu de fato. */
async function abater(id, valor, onde){
  valor = Math.round(Number(valor || 0) * 100) / 100;
  if (!(valor > 0)) return 0;
  const h = { apikey: SUPA_KEY, Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' };
  const r0 = await fetch(SUPA_URL + '/rest/v1/clientes_credito?id=eq.' + id + '&select=valor,status,usado_obs', { headers: h });
  if (!r0.ok) throw new Error(await r0.text());
  const atual = (await r0.json())[0];
  if (!atual || atual.status !== 'ativo') return 0;
  const saldoAnt = Number(atual.valor || 0);
  const usado = Math.min(valor, saldoAnt);
  const saldo = Math.round((saldoAnt - usado) * 100) / 100;
  let quem = ''; try { quem = (typeof _perfil !== 'undefined' && _perfil && _perfil.nome) || ''; } catch(e) {}
  const hoje = new Date().toLocaleDateString('pt-BR');
  const linha = hoje + ': ' + brl(usado) + (onde ? ' em ' + onde : '') + (quem ? ' (' + quem + ')' : '') + ' — saldo ' + brl(saldo);
  const body = { valor: saldo, usado_obs: (atual.usado_obs ? atual.usado_obs + ' | ' : '') + linha };
  if (saldo <= 0.009) Object.assign(body, { status: 'usado', usado_em: new Date().toISOString(), usado_por: quem || null });
  const r = await fetch(SUPA_URL + '/rest/v1/clientes_credito?id=eq.' + id, {
    method: 'PATCH', headers: Object.assign({ Prefer: 'return=minimal' }, h), body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return usado;
}

/** Botão do aviso no pedido novo: abate o valor digitado (pode ser só uma parte). */
async function usar(id, campoCel, campoNome){
  const x = CR.lista.find(c => c.id === id); if (!x) return;
  const inp = document.getElementById(campoCel + '_credito_v_' + id);
  const v = inp ? parseFloat(inp.value) : Number(x.valor);
  if (!(v > 0)) { aviso('Informe o valor a abater', 'err'); return; }
  if (v > Number(x.valor) + 0.009) { aviso('O crédito é de só ' + brl(x.valor), 'err'); return; }
  const sobra = Number(x.valor) - v;
  if (!confirm('Abater ' + brl(v) + ' do crédito deste cliente?' + (sobra > 0.009 ? '\nSobra ' + brl(sobra) + ' de crédito.' : '\nO crédito será zerado.'))) return;
  const nomePedido = (campoNome && document.getElementById(campoNome)?.value) || '';
  try {
    const usado = await abater(id, v, 'pedido novo' + (nomePedido ? ' de ' + nomePedido : ''));
    await carregar(true);
    aviso('✅ ' + brl(usado) + ' abatidos do crédito');
    avisar(CR.cfgs[campoCel] || { cel: campoCel, nome: campoNome });
  } catch(e) { aviso('Erro ao abater crédito: ' + e.message, 'err'); }
}

/* ── Janela de registrar pagamento ──
   painelPagamento(o, {val:'id do campo valor', obs:'id do campo observação'}) mostra a caixa verde
   acima do campo de valor quando o cliente tem crédito. A opção vem desmarcada.
   aplicarPagamento(o, valor) deve ser chamado depois que o pagamento foi salvo. */
const PG = { ordemId: null, cfg: null, total: 0 };
function _pgAtualiza(){
  const box = document.getElementById('cred_pg_box'); if (!box || !PG.cfg) return;
  const chk = document.getElementById('cred_pg_chk');
  const v = parseFloat(document.getElementById(PG.cfg.val)?.value) || 0;
  const usa = Math.min(v, PG.total), sobra = PG.total - usa;
  const info = document.getElementById('cred_pg_info');
  if (info) info.textContent = chk.checked
    ? 'Abate ' + brl(usa) + ' · sobra ' + brl(sobra) + ' de crédito' + (v > PG.total + 0.009 ? ' (o crédito não cobre tudo)' : '')
    : 'O crédito continua em ' + brl(PG.total);
  const obs = document.getElementById(PG.cfg.obs);
  if (obs) {
    const auto = obs.dataset.credAuto || '';
    const txt = chk.checked ? 'Pago com crédito do cliente — saldo ' + brl(sobra) : '';
    if (!obs.value || obs.value === auto) obs.value = txt;
    obs.dataset.credAuto = txt;
  }
}
async function painelPagamento(o, cfg){
  PG.ordemId = null; PG.cfg = cfg; PG.total = 0;
  const elVal = document.getElementById(cfg.val); if (!elVal) return;
  let box = document.getElementById('cred_pg_box');
  if (!box) {
    box = document.createElement('div'); box.id = 'cred_pg_box';
    box.style.cssText = 'display:none;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.4);border-radius:8px;padding:10px 12px;font-size:13px;color:#22c55e;margin:0 0 12px';
    const wrap = elVal.closest('.fi,.mfi') || elVal;
    wrap.insertAdjacentElement('beforebegin', box);
  }
  box.style.display = 'none'; box.innerHTML = '';
  const elObs = document.getElementById(cfg.obs); if (elObs) elObs.dataset.credAuto = '';
  if (!o || o.cancel_motivo) return;
  await carregar(true);
  const l = doCliente(o.cel || o.wh, o.cpf);
  if (!l.length) return;
  PG.ordemId = o.id;
  PG.total = Math.round(l.reduce((s, x) => s + Number(x.valor || 0), 0) * 100) / 100;
  box.innerHTML =
    '<div style="font-weight:800">💰 Cliente tem ' + brl(PG.total) + ' de crédito</div>' +
    '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:8px;cursor:pointer;font-weight:700">' +
    '<input type="checkbox" id="cred_pg_chk" style="margin-top:3px;width:16px;height:16px;flex:0 0 auto">' +
    '<span>Pagar com o crédito<br><span id="cred_pg_info" style="font-weight:400;font-size:12px;opacity:.9"></span></span></label>';
  box.style.display = 'block';
  document.getElementById('cred_pg_chk').addEventListener('change', _pgAtualiza);
  if (!elVal.dataset.credPg) { elVal.dataset.credPg = '1'; elVal.addEventListener('input', _pgAtualiza); }
  _pgAtualiza();
}
/** Chamar depois de salvar o pagamento. Se "Pagar com o crédito" estava marcado, abate o valor. */
async function aplicarPagamento(o, valor){
  const chk = document.getElementById('cred_pg_chk');
  const box = document.getElementById('cred_pg_box');
  const marcado = !!(chk && chk.checked && o && PG.ordemId === o.id);
  if (chk) chk.checked = false;
  if (box) box.style.display = 'none';
  PG.ordemId = null;
  if (!marcado) return 0;
  let falta = Math.round(Number(valor || 0) * 100) / 100, total = 0;
  try {
    await carregar(true);
    const l = doCliente(o.cel || o.wh, o.cpf).slice().sort((a, b) => String(a.criado_em).localeCompare(String(b.criado_em)));
    for (const x of l) {
      if (falta <= 0.009) break;
      const u = await abater(x.id, falta, o.crm_id || 'ordem');
      total += u; falta = Math.round((falta - u) * 100) / 100;
    }
    await carregar(true);
    const saldo = doCliente(o.cel || o.wh, o.cpf).reduce((s, x) => s + Number(x.valor || 0), 0);
    try { if (typeof addLog === 'function') addLog(o.id, 'Crédito usado', brl(total) + ' abatidos do crédito do cliente — saldo ' + brl(saldo)); } catch(e) {}
    aviso('💰 ' + brl(total) + ' abatidos do crédito · saldo ' + brl(saldo));
    try { if (typeof renderBoard === 'function') renderBoard(); } catch(e) {}
    try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch(e) {}
  } catch(e) { aviso('Pagamento salvo, mas houve erro ao abater o crédito: ' + e.message, 'err'); }
  return total;
}

/** Aviso em HTML (ex.: janela de duplicar). Usa o que já foi carregado. */
function avisoHTML(o){
  if (!o) return '';
  const l = doCliente(o.cel || o.wh, o.cpf); if (!l.length) return '';
  const total = l.reduce((s, x) => s + Number(x.valor || 0), 0);
  return '<div style="padding:9px 12px;border-radius:8px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.4);color:#22c55e;font-size:12px;font-weight:700;text-align:left">💰 Cliente tem ' + brl(total) + ' de crédito. Ao registrar o pagamento das novas ordens, marque "Pagar com o crédito".</div>';
}

window.Creditos = { carregar, doCliente, badge, avisar, usar, abater, painelPagamento, aplicarPagamento, avisoHTML };
})();
