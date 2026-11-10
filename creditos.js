/* ══════════════════════════════════════════════════════════════
   CRÉDITOS DE CLIENTES — aviso automático
   Tabela clientes_credito (status ativo/usado/devolvido). Quando um cliente tem crédito
   (ex.: pagou e a caçamba não foi entregue), o CRM avisa:
     • no formulário de pedido novo, ao digitar o celular ou CPF/CNPJ;
     • com um selo 💰 no card das ordens desse cliente.
   Usado pelo index.html e pelo mobile2.html. Depende de SUPA_URL, SUPA_KEY, tok(), toast().
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const CR = { lista: [], ts: 0, carregando: null, avisouRender: false };
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
    '<div style="font-size:12px;margin-top:4px">Abata esse valor neste pedido. Depois de abater, marque como usado:</div>' +
    '<button type="button" onclick="Creditos.usar(\'' + x.id + '\',\'' + cfg.cel + '\',\'' + (cfg.nome || '') + '\')" style="margin-top:6px;background:#16a34a;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer">✅ Crédito usado neste pedido</button>'
  ).join('<hr style="border:none;border-top:1px solid rgba(34,197,94,.3);margin:8px 0">');
}

async function usar(id, campoCel, campoNome){
  const x = CR.lista.find(c => c.id === id); if (!x) return;
  if (!confirm('Marcar o crédito de ' + brl(x.valor) + ' como USADO (abatido neste pedido)?')) return;
  let quem = ''; try { quem = (typeof _perfil !== 'undefined' && _perfil && _perfil.nome) || ''; } catch(e) {}
  const nomePedido = (campoNome && document.getElementById(campoNome)?.value) || '';
  try {
    const r = await fetch(SUPA_URL + '/rest/v1/clientes_credito?id=eq.' + id, {
      method: 'PATCH',
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'usado', usado_em: new Date().toISOString(), usado_por: quem || null, usado_obs: 'Abatido no pedido novo' + (nomePedido ? ' de ' + nomePedido : '') })
    });
    if (!r.ok) throw new Error(await r.text());
    await carregar(true);
    const box = document.getElementById(campoCel + '_credito'); if (box) box.style.display = 'none';
    aviso('✅ Crédito marcado como usado');
  } catch(e) { aviso('Erro ao marcar crédito: ' + e.message, 'err'); }
}

window.Creditos = { carregar, doCliente, badge, avisar, usar };
})();
