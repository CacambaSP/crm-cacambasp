# CHECKUP_S32.md — CaçambaSP CRM
> Rodar no início da Sessão 32. Verificar cada item antes de avançar.

---

## 1. Contagem de linhas
```
index.html    → esperado: ~9.502
mobile.html   → esperado: ~4.286
tracking.html → esperado: ~567
cadastro.html → esperado: ~670
```
[ ] Confirmar com `wc -l`

---

## 2. Verificações index.html

| Item | Esperado | Linha |
|------|----------|-------|
| nextCrmId busca todos os anos | `like.*2026*` (não só LC2026) | ~1638 |
| autoColFornNomeado com forn_id | `c.col==='contratar' && c.forn_id` | ~1526 |
| reader.onload async | `reader.onload=async function(e)` | ~6235 |
| ultima_conciliacao no processarXLS | `await api('config?chave=eq.ultima_conciliacao','PATCH'` | ~6290 |
| voltarOrcamentoDetail sem renderKanban | `renderBoard(); renderStats(); _atualizarOrcBadge()` | ~3896 |
| colInicial no confirmarConverterOrc | `const colInicial = o.forn_id ? 'ag_entrega' : 'contratar'` | ~8539 |
| orc_g_perm_rua no formulário | `id="orc_g_perm_rua"` | ~9011 |
| orc_g_perm_canteiro no formulário | `id="orc_g_perm_canteiro"` | ~9012 |
| orc_g_tel no formulário | `id="orc_g_tel"` | ~9007 |
| orc_g_cpf no formulário | `id="orc_g_cpf"` | ~9009 |
| permRua no _pdfDados retorno | `permRua,permCant,obs,tel,cpf` no return | ~9154 |

---

## 3. Verificações mobile.html

| Item | Esperado | Linha |
|------|----------|-------|
| COBR_DIAS_ALERTA declarado | `let COBR_DIAS_ALERTA = 3` | ~994 |
| COBR_DIAS_CRITICO declarado | `let COBR_DIAS_CRITICO = 7` | ~995 |
| Config busca cobr_dias | `cobr_dias_alerta,cobr_dias_critico` na query | ~1994 |
| badge-alert sem duplicata | `grep -c 'id="badge-alert"'` → 1 | — |
| badge-alert2 existe | `id="badge-alert2"` no nav não-admin | ~2061 |
| _atualizarAlertasBadge nova | `function _atualizarAlertasBadge()` | ~2298 |
| atualizarAlertBadge como alias | `function atualizarAlertBadge(){ _atualizarAlertasBadge(); }` | ~2316 |
| alertasSubtitle na view | `id="alertasSubtitle"` | ~566 |
| renderAlertas S30 | `// ── RENDER ALERTAS ── (S30 — 5 seções)` | ~3239 |
| helpers diasEmAberto etc | `function diasEmAberto\|foiCobradoHoje\|deveConfirmarEntrega` | ~2274 |
| nextCrmId corrigido | `like.*${anoStr}*` (não só LC) | ~3543 |
| converterOrcamento gera crm_id | `const novoCrmId = await nextCrmId()` | ~3627 |
| colInicial no mobile | `const colInicial = o.forn_id ? 'ag_entrega' : 'contratar'` | ~3629 |
| autoColFornNomeado inline | `o.col==='contratar' && fornId` | ~1256 |
| view-orc-mob existe | `id="view-orc-mob"` | ~571 |
| abrirOrcMob existe | `function abrirOrcMob(id)` | ~3998 |
| renderOrcMob existe | `function renderOrcMob()` | ~4003 |
| gerarOrcMobPDF existe | `function gerarOrcMobPDF()` | ~4107 |
| botão PDF no renderDetalhe | `abrirOrcMob('${o.id}')` quando col=orcamento | ~3726 |

---

## 4. Debug rápido no console

```js
// Verificar COBR_DIAS no mobile
COBR_DIAS_ALERTA   // esperado: número (3 ou config)
COBR_DIAS_CRITICO  // esperado: número (7 ou config)

// Verificar badge-alert duplicado
document.querySelectorAll('[id="badge-alert"]').length  // esperado: 1

// Verificar nextCrmId (não gera ID repetido)
// Abrir orçamento → converter → verificar se LC gerado é maior que todos os existentes
```

---

## 5. Pendências S32 (do CONTEXTO)

1. Testar alertas no celular real (5 seções + badge)
2. Testar gerador PDF mobile em campo
3. Hospedar `manual_vendedor_interativo.html` no Vercel
4. Investigar view_financeiro (2% de acessos)
5. Dashboard — gráfico evolução mensal (linha)

---

## RESULTADO

Se todos os itens estiverem OK → **PODE AVANÇAR PARA AS PENDÊNCIAS**
Se algum falhar → corrigir antes de continuar
