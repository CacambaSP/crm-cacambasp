/* ══════════════════════════════════════════════════════════════
   BOLETOS — Contas a pagar da empresa (Douglas + quem tiver perfis.acesso_contas)
   Usado pelo index.html (Comissões → Caixa) e pelo mobile2.html (Financeiro).
   Depende dos globais já existentes nos dois arquivos: SUPA_URL, SUPA_KEY, tok(), toast().
   Tabela: contas_pagar (RLS contas_pode_acessar). Arquivos: bucket anexos, pasta boletos/.
   Ao marcar pago → RPC conta_pagar_pagar lança a saída no caixa_empresa (origem 'boleto').
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const CATEGORIAS = ['Impostos','Energia','Água','Telefone/Internet','Aluguel','Contabilidade','Fornecedor','Marketing/Anúncios','Sistemas/Assinaturas','Cartão de crédito','Funcionários','Outros'];
const ST = { lista: [], carregado: false, hostId: null, opts: {}, verPagos: false };

// ── utilitários ──
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
const hoje = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0,10); };
const diasAte = iso => Math.round((new Date(iso + 'T12:00:00Z') - new Date(hoje() + 'T12:00:00Z')) / 86400000);
const dtBR = iso => iso ? iso.slice(8,10) + '/' + iso.slice(5,7) + '/' + iso.slice(0,4) : '—';
const soDig = s => String(s || '').replace(/\D/g, '');
const aviso = (m, t) => { try { toast(m, t || 'ok'); } catch(e) { console.log(m); } };
const token = () => { try { return tok(); } catch(e) { return null; } };

// Quem pode usar as Contas a pagar: o Douglas e quem tiver perfis.acesso_contas = true (ex.: Leticia).
// O saldo do Caixa da empresa continua só do Douglas (isso é controlado no index.html / caixa_eh_dono).
function ehDono(){
  try { const p = (typeof _perfil !== 'undefined' && _perfil) || null; return !!(p && (p.acesso_contas === true || /^douglas/i.test(p.nome || ''))); }
  catch(e) { return false; }
}

async function rest(path, method = 'GET', body = null, prefer = null){
  const h = {'Content-Type':'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + (token() || SUPA_KEY)};
  if (prefer) h['Prefer'] = prefer; else if (method === 'POST') h['Prefer'] = 'return=representation';
  const r = await fetch(SUPA_URL + '/rest/v1/' + path, {method, headers: h, body: body ? JSON.stringify(body) : null});
  const t = await r.text();
  if (!r.ok) {
    let msg = t; try { const j = JSON.parse(t); msg = j.message || t; } catch(e) {}
    if (/contas_pagar_linha_uniq/.test(msg)) msg = 'Esse boleto já está cadastrado (mesma linha digitável).';
    throw new Error(msg);
  }
  return t ? JSON.parse(t) : null;
}

// ══════════════════════════════════════════════════════════════
// VALIDAÇÃO DA LINHA DIGITÁVEL (FEBRABAN) — não depende da IA
// ══════════════════════════════════════════════════════════════
function mod10(num){
  let soma = 0, peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    let p = parseInt(num[i], 10) * peso;
    if (p > 9) p = Math.floor(p / 10) + (p % 10);
    soma += p; peso = peso === 2 ? 1 : 2;
  }
  return (10 - (soma % 10)) % 10;
}
function mod11Bancario(num){
  let soma = 0, peso = 2;
  for (let i = num.length - 1; i >= 0; i--) { soma += parseInt(num[i], 10) * peso; peso = peso === 9 ? 2 : peso + 1; }
  const dv = 11 - (soma % 11);
  return (dv === 0 || dv === 10 || dv === 11) ? 1 : dv;
}
function mod11Arrecadacao(num){
  let soma = 0, peso = 2;
  for (let i = num.length - 1; i >= 0; i--) { soma += parseInt(num[i], 10) * peso; peso = peso === 9 ? 2 : peso + 1; }
  const r = soma % 11;
  return (r === 0 || r === 1) ? 0 : 11 - r;
}
function fatorParaData(fator){
  if (!fator) return null;
  const base = (iso, n) => somaDias(iso, n);
  const antiga = base('1997-10-07', fator);
  if (fator < 1000) return antiga;
  const nova = base('2025-02-22', fator - 1000);   // fator reiniciou em 22/02/2025
  return Math.abs(diasAte(nova)) <= Math.abs(diasAte(antiga)) ? nova : antiga;
}
/** Analisa linha digitável (47/48 dígitos) ou código de barras (44). */
function analisarLinha(entrada){
  const d = soDig(entrada);
  const r = { ok: false, tipo: null, erro: '', valor: null, vencimento: null, linha: d, barras: null };
  if (!d) { r.erro = 'vazia'; return r; }
  if (d.length === 47) {
    r.tipo = 'bancario';
    const c1 = d.slice(0,9), c2 = d.slice(10,20), c3 = d.slice(21,31);
    if (mod10(c1) !== +d[9] || mod10(c2) !== +d[20] || mod10(c3) !== +d[31]) { r.erro = 'Algum número da linha digitável está errado (os dígitos de conferência não batem).'; return r; }
    const barras = d.slice(0,4) + d[32] + d.slice(33,47) + d.slice(4,9) + d.slice(10,20) + d.slice(21,31);
    if (mod11Bancario(barras.slice(0,4) + barras.slice(5)) !== +barras[4]) { r.erro = 'Dígito geral do boleto não confere.'; return r; }
    r.barras = barras;
  } else if (d.length === 48) {
    r.tipo = 'arrecadacao';
    if (d[0] !== '8') { r.erro = 'Linha de 48 dígitos deveria começar com 8.'; return r; }
    const ref = d[2], fn = (ref === '6' || ref === '7') ? mod10 : mod11Arrecadacao;
    let barras = '';
    for (let i = 0; i < 4; i++) {
      const bloco = d.slice(i*12, i*12 + 11), dv = +d[i*12 + 11];
      if (fn(bloco) !== dv) { r.erro = 'O bloco ' + (i+1) + ' da linha digitável está com algum número errado.'; return r; }
      barras += bloco;
    }
    r.barras = barras;
  } else if (d.length === 44) {
    r.barras = d; r.tipo = d[0] === '8' ? 'arrecadacao' : 'bancario';
    if (r.tipo === 'bancario' && mod11Bancario(d.slice(0,4) + d.slice(5)) !== +d[4]) { r.erro = 'Código de barras com dígito errado.'; return r; }
  } else {
    r.erro = 'A linha digitável tem ' + d.length + ' números (o certo é 47 ou 48).'; return r;
  }
  const b = r.barras;
  if (r.tipo === 'bancario') {
    const v = parseInt(b.slice(9,19), 10) / 100; if (v > 0) r.valor = v;
    r.vencimento = fatorParaData(parseInt(b.slice(5,9), 10));
  } else {
    if (b[2] === '6' || b[2] === '8') { const v = parseInt(b.slice(4,15), 10) / 100; if (v > 0) r.valor = v; }
  }
  r.ok = true;
  return r;
}
function formatarLinha(d){
  d = soDig(d);
  if (d.length === 47) return d.slice(0,5)+'.'+d.slice(5,10)+' '+d.slice(10,15)+'.'+d.slice(15,21)+' '+d.slice(21,26)+'.'+d.slice(26,32)+' '+d[32]+' '+d.slice(33);
  if (d.length === 48) return [0,12,24,36].map(i => d.slice(i,i+11)+'-'+d[i+11]).join(' ');
  return d;
}

// ── Pix copia e cola: CRC16 + leitura de valor/nome ──
function crc16(str){
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function analisarPix(p){
  const s = String(p || '').trim();
  const r = { ok: false, valor: null, nome: null, erro: '' };
  if (!s) return r;
  if (!s.startsWith('000201') || s.length < 30) { r.erro = 'Não parece um Pix copia e cola.'; return r; }
  const i = s.lastIndexOf('6304');
  if (i < 0 || s.length !== i + 8 || crc16(s.slice(0, i + 4)) !== s.slice(i + 4).toUpperCase()) { r.erro = 'Código Pix incompleto ou com erro.'; return r; }
  let k = 0;
  while (k + 4 <= s.length) {
    const tag = s.slice(k, k+2), len = parseInt(s.slice(k+2, k+4), 10); if (isNaN(len)) break;
    const val = s.slice(k+4, k+4+len);
    if (tag === '54') r.valor = parseFloat(val);
    if (tag === '59') r.nome = val;
    k += 4 + len;
  }
  r.ok = true; return r;
}

// ══════════════════════════════════════════════════════════════
// LEITURA PELA IA (usa o /api/chat que já existe no CRM)
// ══════════════════════════════════════════════════════════════
function lerArquivoBase64(blob){
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
}
async function reduzirImagem(file){
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const max = 2000, esc_ = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * esc_); c.height = Math.round(img.height * esc_);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.85));
  } finally { URL.revokeObjectURL(url); }
}
const PROMPT_SISTEMA = 'Você extrai dados de boletos e cobranças brasileiras (boleto bancário, guia de arrecadação/concessionária, DAS, DARF, fatura com Pix). Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois, sem markdown.';
const PROMPT_USUARIO = 'Leia este documento e devolva exatamente este JSON (use null quando não encontrar):\n' +
  '{"beneficiario":"quem recebe o pagamento (nome curto, ex: Enel, Vivo, Receita Federal)",' +
  '"cnpj_beneficiario":"só números ou null","pagador":"nome do pagador ou null",' +
  '"descricao":"descrição curta da cobrança, ex: Energia out/2026, DAS competência 10/2026",' +
  '"categoria":"uma destas: ' + CATEGORIAS.join(', ') + '",' +
  '"valor":número em reais (ex 189.9),"vencimento":"AAAA-MM-DD",' +
  '"linha_digitavel":"a linha digitável completa, só números (47 ou 48 dígitos), copiada com máximo cuidado dígito por dígito",' +
  '"pix_copia_cola":"o código Pix copia e cola completo (começa com 000201) ou null",' +
  '"observacoes":"multa/juros/desconto ou algo importante, ou null"}';

async function lerComIA(file){
  let blob = file, tipo = file.type || '';
  const ehPdf = /pdf/i.test(tipo) || /\.pdf$/i.test(file.name || '');
  if (!ehPdf) { blob = await reduzirImagem(file); tipo = 'image/jpeg'; }
  if (blob.size > 3.2 * 1024 * 1024) throw new Error('Arquivo grande demais (máx. 3 MB). Tire um print só da parte do boleto.');
  const b64 = await lerArquivoBase64(blob);
  const bloco = ehPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
    : { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } };
  const res = await fetch('/api/chat', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ system: PROMPT_SISTEMA, max_tokens: 1500, messages: [{ role: 'user', content: [bloco, { type: 'text', text: PROMPT_USUARIO }] }] })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error('A IA não conseguiu ler: ' + (data.error?.message || data.error || res.status));
  const txt = (data.content || []).map(c => c.text || '').join('').trim();
  const ini = txt.indexOf('{'), fim = txt.lastIndexOf('}');
  if (ini < 0 || fim < 0) throw new Error('A IA não devolveu os dados do boleto.');
  return { dados: JSON.parse(txt.slice(ini, fim + 1)), blob, tipo, ehPdf };
}

// ══════════════════════════════════════════════════════════════
// DADOS
// ══════════════════════════════════════════════════════════════
async function carregar(){
  const desde = somaDias(hoje(), -60);
  ST.lista = await rest('contas_pagar?select=*&or=(status.in.(pendente,agendado),and(status.eq.pago,data_pagamento.gte.' + desde + '))&order=vencimento.asc') || [];
  ST.carregado = true; ST.ts = Date.now();
  return ST.lista;
}
function situacao(c){
  if (c.status === 'pago') return { cor: 'var(--g)', fundo: 'var(--g2)', txt: 'Pago ' + dtBR(c.data_pagamento).slice(0,5) };
  if (c.status === 'agendado') return { cor: 'var(--b)', fundo: 'var(--b2)', txt: 'Agendado ' + dtBR(c.data_agendada || c.vencimento).slice(0,5) };
  const n = diasAte(c.vencimento);
  if (n < 0) return { cor: 'var(--r)', fundo: 'var(--r2)', txt: 'Vencido ' + dtBR(c.vencimento).slice(0,5) };
  if (n === 0) return { cor: 'var(--r)', fundo: 'var(--r2)', txt: 'Vence hoje' };
  if (n <= 7) return { cor: 'var(--acc)', fundo: 'var(--acc2)', txt: (n === 1 ? 'Vence amanhã' : 'Vence ' + dtBR(c.vencimento).slice(0,5)) };
  return { cor: 'var(--mut2)', fundo: 'var(--sur)', txt: 'Vence ' + dtBR(c.vencimento).slice(0,5) };
}

// ══════════════════════════════════════════════════════════════
// TELA PRINCIPAL (seção "Contas a pagar")
// ══════════════════════════════════════════════════════════════
function css(){
  if (document.getElementById('bolCSS')) return;
  const s = document.createElement('style'); s.id = 'bolCSS';
  s.textContent = `
.bol-wrap{background:var(--sur);border:1px solid var(--bor);border-radius:var(--rad2);padding:14px;margin-bottom:16px}
.bol-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.bol-tit{font-size:11px;font-weight:700;color:var(--mut2);text-transform:uppercase;letter-spacing:.5px;flex:1;min-width:120px}
.bol-btn{background:var(--card);border:1px solid var(--bor2,var(--bor));color:var(--txt);border-radius:var(--rad3);padding:7px 11px;font-size:12px;font-weight:600;font-family:var(--font);cursor:pointer;white-space:nowrap}
.bol-btn:active{transform:scale(.97)}
.bol-btn.acc{background:var(--acc);color:#111;border-color:var(--acc)}
.bol-btn.g{color:var(--g);border-color:var(--g3,var(--g))}
.bol-btn.r{color:var(--r);border-color:var(--r3,var(--r))}
.bol-chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:12px}
.bol-chip{background:var(--card);border:1px solid var(--bor);border-radius:var(--rad3);padding:8px 10px}
.bol-chip b{display:block;font-family:var(--mono);font-size:15px}
.bol-chip span{font-size:10px;color:var(--mut2);text-transform:uppercase;letter-spacing:.4px}
.bol-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 0;border-top:1px solid var(--bor)}
.bol-st{font-size:11px;font-weight:700;border-radius:6px;padding:3px 8px;white-space:nowrap}
.bol-info{flex:1;min-width:150px}
.bol-info .n{font-size:13px;font-weight:600}
.bol-info .d{font-size:11px;color:var(--mut2)}
.bol-val{font-family:var(--mono);font-weight:700;font-size:13px;white-space:nowrap}
.bol-acts{display:flex;gap:6px;flex-wrap:wrap}
.bol-ov{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px}
.bol-box{background:var(--sur);border:1px solid var(--bor2,var(--bor));border-radius:var(--rad2);width:100%;max-width:560px;max-height:92vh;overflow:auto;padding:16px;color:var(--txt);font-family:var(--font)}
.bol-box h3{font-size:15px;margin:0 0 10px}
.bol-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bol-f{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--mut2);font-weight:600}
.bol-f.full{grid-column:1/-1}
.bol-box *,.bol-wrap *{box-sizing:border-box}
.bol-f input,.bol-f select,.bol-f textarea{background:var(--card);border:1px solid var(--bor);border-radius:var(--rad3);padding:9px 10px;color:var(--txt);font-family:var(--font);font-size:14px;outline:none;width:100%}
.bol-f textarea{font-family:var(--mono);font-size:12px;resize:vertical;min-height:58px}
.bol-msg{font-size:12px;border-radius:var(--rad3);padding:8px 10px;margin:8px 0}
.bol-msg.ok{background:var(--g2);color:var(--g)} .bol-msg.err{background:var(--r2);color:var(--r)} .bol-msg.warn{background:var(--acc2);color:var(--acc)}
.bol-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}
@media(max-width:560px){.bol-grid{grid-template-columns:1fr}.bol-ov{align-items:flex-end;padding:0}.bol-box{border-radius:var(--rad2) var(--rad2) 0 0;max-height:94vh;padding-bottom:calc(16px + env(safe-area-inset-bottom))}}
`;
  document.head.appendChild(s);
}

async function render(hostId, opts){
  ST.hostId = hostId; ST.opts = opts || {};
  const el = document.getElementById(hostId); if (!el) return;
  if (!ehDono()) { el.innerHTML = ''; return; }
  css();
  if (!ST.carregado) el.innerHTML = '<div class="bol-wrap" style="color:var(--mut2);text-align:center">⏳ Carregando contas a pagar...</div>';
  else desenhar();   // mostra o que já tem
  // as telas do CRM se redesenham sozinhas a cada poucos segundos: só busca de novo se os dados tiverem mais de 60s
  if (ST.carregado && Date.now() - (ST.ts || 0) < 60000) return;
  try { await carregar(); }
  catch(e) { el.innerHTML = '<div class="bol-wrap" style="color:var(--r)">Erro ao carregar contas a pagar: ' + esc(e.message) + '</div>'; return; }
  desenhar();
}
function desenhar(){
  const el = document.getElementById(ST.hostId); if (!el) return;
  const abertas = ST.lista.filter(c => c.status === 'pendente' || c.status === 'agendado');
  const pagas = ST.lista.filter(c => c.status === 'pago').sort((a,b) => (b.data_pagamento||'').localeCompare(a.data_pagamento||''));
  const pend = abertas.filter(c => c.status === 'pendente');
  const venc = pend.filter(c => diasAte(c.vencimento) < 0);
  const prox = pend.filter(c => { const n = diasAte(c.vencimento); return n >= 0 && n <= 7; });
  const agend = abertas.filter(c => c.status === 'agendado');
  const mes = hoje().slice(0,7), pagasMes = pagas.filter(c => (c.data_pagamento||'').startsWith(mes));
  const soma = a => a.reduce((s,c) => s + Number(c.valor||0), 0);
  const chip = (lbl, arr, cor) => '<div class="bol-chip"><span>' + lbl + ' (' + arr.length + ')</span><b style="color:' + cor + '">' + brl(soma(arr)) + '</b></div>';

  let h = '<div class="bol-wrap">';
  h += '<div class="bol-top"><div class="bol-tit">📄 Contas a pagar</div>'
     + '<button class="bol-btn" onclick="Boletos.novoManual()">⌨️ Digitar</button>'
     + '<button class="bol-btn acc" onclick="Boletos.escolherArquivo()">📤 Enviar boleto</button>'
     + '<input type="file" id="bolFile" accept="application/pdf,image/*" style="display:none" onchange="Boletos.arquivoEscolhido(this)"></div>';
  h += '<div class="bol-chips">' + chip('Vencidos', venc, 'var(--r)') + chip('Próx. 7 dias', prox, 'var(--acc)') + chip('Agendados', agend, 'var(--b)') + chip('Pagos no mês', pagasMes, 'var(--g)') + '</div>';
  if (!abertas.length) h += '<div style="padding:18px;text-align:center;color:var(--mut2);font-size:13px;border:1px dashed var(--bor);border-radius:var(--rad3)">Nenhuma conta em aberto. Toque em <b>Enviar boleto</b> e mande o PDF ou a foto: a IA preenche tudo.</div>';
  abertas.forEach(c => { h += linha(c); });
  if (pagas.length) {
    h += '<div style="margin-top:8px"><button class="bol-btn" style="width:100%" onclick="Boletos.togglePagos()">' + (ST.verPagos ? '▲ Esconder' : '▼ Ver') + ' pagas recentes (' + pagas.length + ')</button></div>';
    if (ST.verPagos) pagas.forEach(c => { h += linha(c); });
  }
  h += '</div>';
  el.innerHTML = h;
}
function linha(c){
  const s = situacao(c), pago = c.status === 'pago';
  let acts = '';
  if (!pago) {
    if (c.linha_digitavel) acts += '<button class="bol-btn" onclick="Boletos.copiar(\'' + c.id + '\',\'linha\')">📋 Linha</button>';
    if (c.pix_copia_cola) acts += '<button class="bol-btn" onclick="Boletos.copiar(\'' + c.id + '\',\'pix\')">📋 Pix</button>';
    acts += c.status === 'agendado'
      ? '<button class="bol-btn" onclick="Boletos.desagendar(\'' + c.id + '\')">↩️ Desagendar</button>'
      : '<button class="bol-btn" onclick="Boletos.agendar(\'' + c.id + '\')">📅 Agendar</button>';
    acts += '<button class="bol-btn g" onclick="Boletos.pagar(\'' + c.id + '\')">✅ Pago</button>';
  } else {
    acts += '<button class="bol-btn" onclick="Boletos.desfazer(\'' + c.id + '\')">↩️ Desfazer</button>';
  }
  if (c.arquivo_path) acts += '<button class="bol-btn" title="Ver arquivo" onclick="Boletos.verArquivo(\'' + c.id + '\')">📎</button>';
  if (!pago) acts += '<button class="bol-btn" title="Editar" onclick="Boletos.editar(\'' + c.id + '\')">✏️</button>';
  return '<div class="bol-row"><span class="bol-st" style="color:' + s.cor + ';background:' + s.fundo + '">' + s.txt + '</span>'
    + '<div class="bol-info"><div class="n">' + esc(c.beneficiario || 'Sem beneficiário') + '</div><div class="d">' + esc([c.descricao, c.categoria].filter(Boolean).join(' · ')) + (pago ? '' : ' · venc. ' + dtBR(c.vencimento)) + '</div></div>'
    + '<div class="bol-val" style="' + (pago ? 'color:var(--mut2);text-decoration:line-through' : '') + '">' + brl(c.valor) + '</div>'
    + '<div class="bol-acts">' + acts + '</div></div>';
}

// ══════════════════════════════════════════════════════════════
// MODAIS
// ══════════════════════════════════════════════════════════════
function abrirModal(html){
  fecharModal();
  const ov = document.createElement('div'); ov.className = 'bol-ov'; ov.id = 'bolModal';
  ov.innerHTML = '<div class="bol-box">' + html + '</div>';
  ov.addEventListener('click', e => { if (e.target === ov) fecharModal(); });
  document.body.appendChild(ov);
  return ov;
}
function fecharModal(){ document.getElementById('bolModal')?.remove(); }

let _arquivoAtual = null;   // {blob, tipo, ehPdf, nome}
function escolherArquivo(){ document.getElementById('bolFile')?.click(); }
async function arquivoEscolhido(inp){
  const file = inp.files && inp.files[0]; inp.value = '';
  if (!file) return;
  abrirModal('<h3>🤖 Lendo o boleto...</h3><div style="color:var(--mut2);font-size:13px">A IA está lendo <b>' + esc(file.name || 'arquivo') + '</b>. Leva uns 10 a 20 segundos.</div>');
  try {
    const r = await lerComIA(file);
    _arquivoAtual = { blob: r.blob, tipo: r.tipo, ehPdf: r.ehPdf, nome: file.name || (r.ehPdf ? 'boleto.pdf' : 'boleto.jpg') };
    const d = r.dados || {};
    formulario({
      beneficiario: d.beneficiario || '', cnpj: soDig(d.cnpj_beneficiario) || '', descricao: d.descricao || '',
      categoria: CATEGORIAS.includes(d.categoria) ? d.categoria : 'Outros',
      valor: d.valor != null ? Number(d.valor) : '', vencimento: /^\d{4}-\d{2}-\d{2}$/.test(d.vencimento || '') ? d.vencimento : '',
      linha_digitavel: soDig(d.linha_digitavel), pix_copia_cola: (d.pix_copia_cola || '').trim(), observacoes: d.observacoes || ''
    }, { ia: d, titulo: '🤖 Lido pela IA — confira antes de salvar' });
  } catch(e) {
    _arquivoAtual = null;
    abrirModal('<h3>Não deu para ler</h3><div class="bol-msg err">' + esc(e.message) + '</div><div style="font-size:13px;color:var(--mut2)">Você pode tentar outra foto (mais nítida, só o boleto) ou digitar os dados.</div>'
      + '<div class="bol-foot"><button class="bol-btn" onclick="Boletos.fechar()">Fechar</button><button class="bol-btn acc" onclick="Boletos.novoManual()">⌨️ Digitar</button></div>');
  }
}
function novoManual(){ _arquivoAtual = null; formulario({ categoria: 'Outros' }, { titulo: '⌨️ Nova conta a pagar' }); }
function editar(id){
  const c = ST.lista.find(x => x.id === id); if (!c) return;
  _arquivoAtual = null;
  formulario({ ...c, cnpj: c.cnpj || '' }, { titulo: '✏️ Editar conta', id });
}

function formulario(v, o){
  const cats = CATEGORIAS.map(c => '<option' + (c === v.categoria ? ' selected' : '') + '>' + esc(c) + '</option>').join('');
  let h = '<h3>' + esc(o.titulo) + '</h3><div id="bolChecks"></div>'
    + '<div class="bol-grid">'
    + '<label class="bol-f">Beneficiário (quem recebe)<input id="bf_benef" value="' + esc(v.beneficiario) + '" placeholder="Ex.: Enel"></label>'
    + '<label class="bol-f">Categoria<select id="bf_cat">' + cats + '</select></label>'
    + '<label class="bol-f full">Descrição<input id="bf_desc" value="' + esc(v.descricao) + '" placeholder="Ex.: Energia out/2026"></label>'
    + '<label class="bol-f">Valor (R$)<input id="bf_valor" type="number" step="0.01" min="0" inputmode="decimal" value="' + (v.valor !== '' && v.valor != null ? Number(v.valor).toFixed(2) : '') + '"></label>'
    + '<label class="bol-f">Vencimento<input id="bf_venc" type="date" value="' + esc(v.vencimento || '') + '"></label>'
    + '<label class="bol-f full">Linha digitável / código de barras<textarea id="bf_linha" rows="2" placeholder="Cole aqui (só números ou com pontos)" oninput="Boletos.checar()">' + esc(v.linha_digitavel ? formatarLinha(v.linha_digitavel) : '') + '</textarea></label>'
    + '<label class="bol-f full">Pix copia e cola (se tiver)<textarea id="bf_pix" rows="2" placeholder="00020126..." oninput="Boletos.checar()">' + esc(v.pix_copia_cola || '') + '</textarea></label>'
    + '<label class="bol-f">CNPJ do beneficiário<input id="bf_cnpj" inputmode="numeric" value="' + esc(v.cnpj || '') + '"></label>'
    + '<label class="bol-f">Avisar no celular<select id="bf_avisar"><option value="1"' + (v.avisar === false ? '' : ' selected') + '>Sim (1 dia antes e no dia)</option><option value="0"' + (v.avisar === false ? ' selected' : '') + '>Não</option></select></label>'
    + '</div>';
  if (v.observacoes) h += '<div class="bol-msg warn">📝 ' + esc(v.observacoes) + '</div>';
  if (_arquivoAtual) h += '<div style="font-size:11px;color:var(--mut2);margin-top:8px">📎 ' + esc(_arquivoAtual.nome) + ' será guardado junto.</div>';
  h += '<div class="bol-foot">'
    + (o.id ? '<button class="bol-btn r" style="margin-right:auto" onclick="Boletos.excluir(\'' + o.id + '\')">🗑 Excluir</button>' : '')
    + '<button class="bol-btn" onclick="Boletos.fechar()">Cancelar</button>'
    + '<button class="bol-btn acc" id="bf_salvar" onclick="Boletos.salvar(' + (o.id ? '\'' + o.id + '\'' : 'null') + ')">💾 Salvar conta</button></div>';
  abrirModal(h);
  ST._ia = o.ia || null;
  checar(true);
}

/** Confere linha digitável e Pix, e completa valor/vencimento a partir da linha. */
function checar(primeira){
  const box = document.getElementById('bolChecks'); if (!box) return;
  const msgs = [];
  const linha = document.getElementById('bf_linha').value, pix = document.getElementById('bf_pix').value;
  const elV = document.getElementById('bf_valor'), elD = document.getElementById('bf_venc');
  if (soDig(linha)) {
    const a = analisarLinha(linha);
    if (!a.ok) msgs.push(['err', '❌ ' + a.erro + ' Confira com o papel antes de pagar.']);
    else {
      msgs.push(['ok', '✅ Linha digitável conferida (os números batem).']);
      if (a.valor) {
        const atual = parseFloat(elV.value);
        if (!atual) elV.value = a.valor.toFixed(2);
        else if (Math.abs(atual - a.valor) > 0.009) { msgs.push(['warn', '⚠️ Pela linha digitável o valor é ' + brl(a.valor) + ' (estava ' + brl(atual) + '). Corrigi.']); elV.value = a.valor.toFixed(2); }
      }
      if (a.vencimento) {
        if (!elD.value) elD.value = a.vencimento;
        else if (elD.value !== a.vencimento && primeira) msgs.push(['warn', '⚠️ Pela linha digitável o vencimento seria ' + dtBR(a.vencimento) + '. Confira (alguns boletos têm data diferente impressa).']);
      }
    }
  }
  if (pix.trim()) {
    const p = analisarPix(pix);
    if (!p.ok) msgs.push(['err', '❌ Pix: ' + p.erro]);
    else {
      msgs.push(['ok', '✅ Pix copia e cola válido' + (p.nome ? ' — ' + esc(p.nome) : '') + '.']);
      if (p.valor && !parseFloat(elV.value)) elV.value = p.valor.toFixed(2);
    }
  }
  if (!soDig(linha) && !pix.trim()) msgs.push(['warn', 'Sem linha digitável nem Pix: a conta fica só como lembrete.']);
  box.innerHTML = msgs.map(m => '<div class="bol-msg ' + m[0] + '">' + m[1] + '</div>').join('');
}

async function salvar(id){
  const g = k => document.getElementById(k);
  const linhaD = soDig(g('bf_linha').value), pix = g('bf_pix').value.trim();
  const valor = parseFloat(g('bf_valor').value), venc = g('bf_venc').value;
  if (!(valor > 0)) { aviso('Informe o valor', 'warn'); return; }
  if (!venc) { aviso('Informe o vencimento', 'warn'); return; }
  if (linhaD && !analisarLinha(linhaD).ok && !confirm('A linha digitável não passou na conferência. Salvar assim mesmo?')) return;
  if (pix && !analisarPix(pix).ok && !confirm('O Pix copia e cola parece ter erro. Salvar assim mesmo?')) return;
  const btn = g('bf_salvar'); if (btn) { btn.disabled = true; btn.textContent = '⏳ Salvando...'; }
  const corpo = {
    beneficiario: g('bf_benef').value.trim() || null, categoria: g('bf_cat').value, descricao: g('bf_desc').value.trim() || null,
    valor: Math.round(valor * 100) / 100, vencimento: venc, linha_digitavel: linhaD || null, pix_copia_cola: pix || null,
    cnpj: soDig(g('bf_cnpj').value) || null, avisar: g('bf_avisar').value === '1'
  };
  try {
    if (_arquivoAtual) {
      const ext = _arquivoAtual.ehPdf ? 'pdf' : 'jpg';
      const path = 'boletos/' + venc.slice(0,7) + '/' + (crypto.randomUUID ? crypto.randomUUID() : Date.now()) + '.' + ext;
      const up = await fetch(SUPA_URL + '/storage/v1/object/anexos/' + path, {
        method: 'POST', headers: {'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + token(), 'Content-Type': _arquivoAtual.tipo || 'application/octet-stream', 'x-upsert': 'true'}, body: _arquivoAtual.blob });
      if (!up.ok) throw new Error('Falha ao guardar o arquivo: ' + (await up.text()));
      corpo.arquivo_path = path; corpo.arquivo_nome = _arquivoAtual.nome;
    }
    if (id) await rest('contas_pagar?id=eq.' + id, 'PATCH', corpo, 'return=minimal');
    else { if (ST._ia) corpo.ia_bruto = ST._ia; await rest('contas_pagar', 'POST', corpo); }
    fecharModal(); _arquivoAtual = null;
    aviso(id ? '✅ Conta atualizada' : '✅ Conta salva — vou te avisar do vencimento');
    await atualizar();
  } catch(e) {
    aviso('Erro ao salvar: ' + e.message, 'err');
    if (btn) { btn.disabled = false; btn.textContent = '💾 Salvar conta'; }
  }
}
async function excluir(id){
  const c = ST.lista.find(x => x.id === id); if (!c) return;
  if (!confirm('Excluir a conta "' + (c.beneficiario || '') + '" de ' + brl(c.valor) + '?')) return;
  try {
    await rest('contas_pagar?id=eq.' + id, 'DELETE', null, 'return=minimal');
    if (c.arquivo_path) fetch(SUPA_URL + '/storage/v1/object/anexos/' + c.arquivo_path, { method: 'DELETE', headers: {'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + token()} }).catch(() => {});
    fecharModal(); aviso('Conta excluída'); await atualizar();
  } catch(e) { aviso('Erro ao excluir: ' + e.message, 'err'); }
}

// ── ações da lista ──
async function copiar(id, qual){
  const c = ST.lista.find(x => x.id === id); if (!c) return;
  const txt = qual === 'pix' ? c.pix_copia_cola : soDig(c.linha_digitavel);
  try { await navigator.clipboard.writeText(txt); aviso(qual === 'pix' ? '📋 Pix copiado — cole no app do banco' : '📋 Linha digitável copiada — cole no app do banco'); }
  catch(e) { prompt('Copie:', txt); }
}
function pedirData(titulo, texto, padrao, rotulo, acao){
  abrirModal('<h3>' + titulo + '</h3><div style="font-size:13px;color:var(--mut2);margin-bottom:10px">' + texto + '</div>'
    + '<label class="bol-f">' + rotulo + '<input type="date" id="bf_data" value="' + padrao + '"></label>'
    + '<div class="bol-foot"><button class="bol-btn" onclick="Boletos.fechar()">Cancelar</button><button class="bol-btn acc" id="bf_ok">Confirmar</button></div>');
  document.getElementById('bf_ok').onclick = async () => {
    const d = document.getElementById('bf_data').value; if (!d) { aviso('Informe a data', 'warn'); return; }
    const b = document.getElementById('bf_ok'); b.disabled = true; b.textContent = '⏳...';
    try { await acao(d); fecharModal(); await atualizar(); }
    catch(e) { aviso('Erro: ' + e.message, 'err'); b.disabled = false; b.textContent = 'Confirmar'; }
  };
}
function agendar(id){
  const c = ST.lista.find(x => x.id === id); if (!c) return;
  pedirData('📅 Agendar pagamento', 'Agende no app do Itaú e marque aqui a data. Enquanto estiver agendada, não te aviso do vencimento.<br><b>' + esc(c.beneficiario || '') + '</b> · ' + brl(c.valor),
    c.vencimento < hoje() ? hoje() : c.vencimento, 'Data agendada no banco',
    async d => { await rest('contas_pagar?id=eq.' + id, 'PATCH', { status: 'agendado', data_agendada: d }, 'return=minimal'); aviso('📅 Marcada como agendada'); });
}
async function desagendar(id){
  try { await rest('contas_pagar?id=eq.' + id, 'PATCH', { status: 'pendente', data_agendada: null }, 'return=minimal'); aviso('Agendamento removido'); await atualizar(); }
  catch(e) { aviso('Erro: ' + e.message, 'err'); }
}
function pagar(id){
  const c = ST.lista.find(x => x.id === id); if (!c) return;
  pedirData('✅ Marcar como pago', '<b>' + esc(c.beneficiario || '') + '</b> · ' + brl(c.valor) + '<br>Vai entrar como <b>saída</b> no Caixa da empresa.',
    (c.status === 'agendado' && c.data_agendada) ? c.data_agendada : hoje(), 'Data do pagamento',
    async d => { await rest('rpc/conta_pagar_pagar', 'POST', { p_id: id, p_data: d }, 'return=minimal'); aviso('✅ Pago e lançado no Caixa'); });
}
async function desfazer(id){
  const c = ST.lista.find(x => x.id === id); if (!c) return;
  if (!confirm('Desfazer o pagamento de "' + (c.beneficiario || '') + '"? A saída de ' + brl(c.valor) + ' sai do Caixa da empresa.')) return;
  try { await rest('rpc/conta_pagar_desfazer', 'POST', { p_id: id }, 'return=minimal'); aviso('Pagamento desfeito'); await atualizar(); }
  catch(e) { aviso('Erro: ' + e.message, 'err'); }
}
async function verArquivo(id){
  const c = ST.lista.find(x => x.id === id); if (!c || !c.arquivo_path) return;
  const w = window.open('', '_blank');
  try {
    const r = await fetch(SUPA_URL + '/storage/v1/object/anexos/' + c.arquivo_path, { headers: {'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + token()} });
    if (!r.ok) throw new Error('não foi possível abrir');
    const url = URL.createObjectURL(await r.blob());
    if (w) w.location = url; else window.open(url, '_blank');
  } catch(e) { if (w) w.close(); aviso('Erro ao abrir arquivo: ' + e.message, 'err'); }
}
function togglePagos(){ ST.verPagos = !ST.verPagos; desenhar(); }
async function atualizar(){
  ST.ts = 0;   // força buscar de novo
  if (typeof ST.opts.aoMudar === 'function') { try { await ST.opts.aoMudar(); return; } catch(e) {} }
  await render(ST.hostId, ST.opts);
}

// ══════════════════════════════════════════════════════════════
// CARD NA ABA ALERTAS
// ══════════════════════════════════════════════════════════════
async function alerta(hostId, irPara){
  const el = document.getElementById(hostId); if (!el) return;
  if (!ehDono()) { el.innerHTML = ''; return; }
  css();
  try { if (!ST.carregado || Date.now() - (ST.ts || 0) > 60000) await carregar(); } catch(e) { el.innerHTML = ''; return; }
  const lim = somaDias(hoje(), 3);
  const lst = ST.lista.filter(c => c.status === 'pendente' && c.vencimento <= lim).sort((a,b) => a.vencimento.localeCompare(b.vencimento));
  if (!lst.length) { el.innerHTML = ''; return; }
  const total = lst.reduce((s,c) => s + Number(c.valor||0), 0);
  let h = '<div class="bol-wrap" style="border-color:var(--r3,var(--r));margin:0 0 14px">'
    + '<div class="bol-top" style="margin-bottom:4px"><div class="bol-tit" style="color:var(--r)">💸 Contas a pagar — ' + lst.length + ' · ' + brl(total) + '</div>'
    + (irPara ? '<button class="bol-btn" onclick="' + irPara + '">Abrir contas</button>' : '') + '</div>';
  lst.slice(0, 6).forEach(c => {
    const s = situacao(c);
    h += '<div class="bol-row"><span class="bol-st" style="color:' + s.cor + ';background:' + s.fundo + '">' + s.txt + '</span><div class="bol-info"><div class="n">' + esc(c.beneficiario || '') + '</div><div class="d">' + esc(c.descricao || '') + '</div></div><div class="bol-val">' + brl(c.valor) + '</div>'
      + '<div class="bol-acts">' + (c.linha_digitavel ? '<button class="bol-btn" onclick="Boletos.copiar(\'' + c.id + '\',\'linha\')">📋 Linha</button>' : '') + (c.pix_copia_cola ? '<button class="bol-btn" onclick="Boletos.copiar(\'' + c.id + '\',\'pix\')">📋 Pix</button>' : '') + '</div></div>';
  });
  el.innerHTML = h + '</div>';
}

window.Boletos = {
  ehDono, render, alerta, escolherArquivo, arquivoEscolhido, novoManual, editar, salvar, excluir, checar,
  copiar, agendar, desagendar, pagar, desfazer, verArquivo, togglePagos, fechar: fecharModal,
  _teste: { analisarLinha, analisarPix, fatorParaData, formatarLinha, crc16 }
};
})();
