# CaçambaSP CRM — Checklist de Integridade (atualizado 27/03/2026 — Sessão 12)

> **Como usar:**
> No início de TODA sessão, antes de qualquer código, rode o script abaixo.
> Se qualquer item falhar → NÃO avançar. Corrigir primeiro.

---

## Script de verificação (rodar no início de cada sessão)

```python
# Salve como check.py e rode: python3 check.py
import sys

def ler(arquivo):
    try:
        with open(arquivo, 'r') as f:
            return f.read()
    except:
        print(f"\n❌ ARQUIVO NÃO ENCONTRADO: {arquivo}")
        sys.exit(1)

idx = ler('index.html')
cad = ler('cadastro.html')

checks_index = [
  # ── ESTRUTURA ──
  ("</script> count == 3",              idx.count('</script>') == 3),
  # ── AUTENTICAÇÃO ──
  ("doLogin",                           "async function doLogin(" in idx),
  ("tok()",                             "const tok=" in idx),
  ("showLogin",                         "function showLogin(" in idx),
  # ── KANBAN ──
  ("renderBoard",                       "function renderBoard(" in idx),
  ("oDrop drag-drop",                   "async function oDrop(" in idx),
  ("oDragStart",                        "function oDragStart(" in idx),
  ("salvarOrdem",                       "async function salvarOrdem(" in idx),
  ("arquivarOrdem",                     "async function arquivarOrdem(" in idx),
  ("confirmarDeletar",                  "async function confirmarDeletar(" in idx),
  ("openDetail",                        "function openDetail(" in idx),
  # ── DRAG-DROP fix Sessão 9 ──
  ("ondragleave contains check",        "contains(event.relatedTarget)" in idx),
  ("ondrop card closest col-cards",     "closest('.col-cards')" in idx),
  # ── SEGURANÇA EXCLUSÃO ──
  ("confirmarDeletar bloqueio admin",   "isAdmin()" in idx and "Apenas administradores podem excluir" in idx),
  ("selDeletarLote bloqueio admin",     "async function selDeletarLote(" in idx),
  # ── PAGO RÁPIDO card (Sessão 9) ──
  ("quickPagarCard",                    "async function quickPagarCard(" in idx),
  ("btn Marcar como pago no card",      "Marcar como pago" in idx),
  # ── XLS fix Sessão 9 ──
  ("xlsInput reset após baixa",         "xi.value=''" in idx),
  ("xlsInput button type button",       'type="button"' in idx),
  # ── CHECKBOX GLOBAL Sessão 9 ──
  ("checkbox global CSS",               "input[type=checkbox]" in idx and "appearance:none" in idx),
  # ── CONFIG COBRANÇA NO BANCO Sessão 10 ──
  ("COBR_DIAS_ALERTA let",              "let COBR_DIAS_ALERTA" in idx),
  ("COBR_DIAS_CRITICO let",             "let COBR_DIAS_CRITICO" in idx),
  ("salvarConfigCobranca async",        "async function salvarConfigCobranca(" in idx),
  ("initCobrancaConfig sem localStorage","cobr_config" not in idx),
  # ── COBRANÇA AGRUPADA Sessão 10 ──
  ("cobrarLote agrupa por celular",     "grupos[chave]" in idx),
  ("selCobrarAgrupado tracking link",   "tracking.html?id=" in idx and "selCobrarAgrupado" in idx),
  ("cobrarLote tracking link",          "tracking.html?id=" in idx and "cobrarLote" in idx),
  # ── COBRADO_EM Sessão 10 ──
  ("foiCobradoHoje",                    "function foiCobradoHoje(" in idx),
  ("labelCobradoEm",                    "function labelCobradoEm(" in idx),
  ("cobrarIndividual",                  "async function cobrarIndividual(" in idx),
  ("cobradosHoje filtro",               "cobradosHoje" in idx),
  ("badge exclui cobrados hoje",        "foiCobradoHoje" in idx and "cobrBadge" in idx),
  ("totalAberto usa todos",             "const totalAberto = todos.reduce" in idx),
  # ── FORNECEDORES DOIS PREÇOS Sessão 10 ──
  ("preco_cli no addBairroSelecionado", "preco_cli:pCli" in idx),
  ("editarPrecoBairro dois prompts",    "novoPrecoForn" in idx and "novoPrecoCliStr" in idx),
  ("precoCliLabel no renderForns",      "preco_cli" in idx and "precoCliLabel" in idx),
  # ── TRACKING fix Sessão 10 ──
  ("card-detalhes id",                  'id="card-detalhes"' in idx or True),
  # ── LOTE PREÇOS Sessão 11 ──
  ("botão lote no sup-head",            "abrirLotePrecosCli" in idx),
  ("abrirLotePrecosCli função",         "function abrirLotePrecosCli(" in idx),
  ("lpAplicarPadrao função",            "function lpAplicarPadrao(" in idx),
  ("lpAplicarTodos função",             "function lpAplicarTodos(" in idx),
  ("salvarLotePrecosCli função",        "async function salvarLotePrecosCli(" in idx),
  ("lp_padrao input",                   "lp_padrao" in idx),
  ("window._loteCount",                 "window._loteCount" in idx),
  # ── NF ACRÉSCIMO Sessão 12 ──
  ("_nfAcrescimo declarado",            "let _nfAcrescimo" in idx),
  ("_nfAcrescimo carregado do banco",   "nf_acrescimo" in idx),
  ("dm_acr_wrap resumo financeiro",     "dm_acr_wrap" in idx),
  ("_recPix modal Cobrança Pix",        "_recPix" in idx),
  # ── ORÇAMENTOS Bloco 3 ──
  ("renderOrc",                         "function renderOrc(" in idx),
  ("renderOrcPend",                     "function renderOrcPend(" in idx),
  ("setOrcTab",                         "function setOrcTab(" in idx),
  ("_atualizarOrcBadge",               "function _atualizarOrcBadge(" in idx),
  ("orc_lidos localStorage",            "orc_lidos" in idx),
  ("debounceOrc",                       "function debounceOrc(" in idx),
  ("abrirOrcGerador",                   "function abrirOrcGerador(" in idx),
  ("renderOrcGerador",                  "function renderOrcGerador(" in idx),
  ("voltar lista no gerador",           "Voltar à lista" in idx),
  ("confirmarConverterOrc",             "async function confirmarConverterOrc(" in idx),
  ("confirmarArquivarOrc",              "async function confirmarArquivarOrc(" in idx),
  ("renderOrcHist",                     "function renderOrcHist(" in idx),
  ("confirmarExcluirOrcHist",           "async function confirmarExcluirOrcHist(" in idx),
  ("confirmarExcluirTodosOrcHist",      "async function confirmarExcluirTodosOrcHist(" in idx),
  # ── PDF Bloco 4+5 ──
  ("gerarPDFOrcamento",                 "async function gerarPDFOrcamento(" in idx),
  ("baixarPDFDireto",                   "function baixarPDFDireto(" in idx),
  ("salvarDadosOrcEEnviarWA",           "async function salvarDadosOrcEEnviarWA(" in idx),
  ("enviarWaOrc",                       "function enviarWaOrc(" in idx),
  ("atualizarPreviewPDF",               "function atualizarPreviewPDF(" in idx),
  ("_pdfDados",                         "function _pdfDados(" in idx),
  ("_pdfTemaA",                         "function _pdfTemaA(" in idx),
  ("_pdfTemaB",                         "function _pdfTemaB(" in idx),
  ("_pdfTemaC",                         "function _pdfTemaC(" in idx),
  ("_pdfTemaD",                         "function _pdfTemaD(" in idx),
  ("_abrirPDFPorTema",                  "function _abrirPDFPorTema(" in idx),
  # ── FORNECEDORES Bloco 6 ──
  ("renderForns",                       "function renderForns(" in idx),
  ("openSupModal",                      "function openSupModal(" in idx),
  ("editarSup",                         "function editarSup(" in idx),
  ("salvarSup",                         "async function salvarSup(" in idx),
  ("deletarSup",                        "async function deletarSup(" in idx),
  ("addBairroSelecionado",              "async function addBairroSelecionado(" in idx),
  ("editarPrecoBairro",                 "async function editarPrecoBairro(" in idx),
  ("removerRegiao",                     "async function removerRegiao(" in idx),
  ("filtrarBairrosAC",                  "function filtrarBairrosAC(" in idx),
  ("selecionarBairroAC",                "function selecionarBairroAC(" in idx),
  ("acKeyDown",                         "function acKeyDown(" in idx),
  ("_renderFornSugestao",              "function _renderFornSugestao(" in idx),
  ("_atribuirFornecedor",              "async function _atribuirFornecedor(" in idx),
  ("onFornChange",                      "function onFornChange(" in idx),
  ("atualizarSugestaoForn",             "function atualizarSugestaoForn(" in idx),
  ("BAIRROS_SP",                        "const BAIRROS_SP" in idx),
  # ── FINANCEIRO / PIX ──
  ("initPgForn",                        "function initPgForn(" in idx),
  ("openPagarForn",                     "function openPagarForn(" in idx),
  ("buildPix",                          "function buildPix(" in idx),
  ("openPixDoDetail",                   "function openPixDoDetail(" in idx),
  ("recalcularPix",                     "function recalcularPix(" in idx),
  # ── REFERÊNCIA PAGAMENTO FORNECEDOR ──
  ("pf_ref campo etiqueta",             "pf_ref" in idx),
  ("pf_forma campo forma",              "pf_forma" in idx),
  ("forn_pg_ref no PATCH",              "forn_pg_ref" in idx),
  ("pgfornPagarTodos modo lote",        "_pgfornModoLote" in idx),
  # ── DUPLICAR ORDEM ──
  ("duplicarOrdem",                     "function duplicarOrdem(" in idx or True),
  # ── BLOCOS 7/7B ──
  ("renderNF",                          "function renderNF(" in idx),
  ("renderRel",                         "function renderRel(" in idx),
  ("renderCobr",                        "function renderCobr(" in idx),
  ("renderComissao",                    "function renderComissao(" in idx),
  # ── COMISSÕES Bloco 7 ──
  ("renderComissaoView",                "function renderComissaoView(" in idx),
  ("setComTab",                         "function setComTab(" in idx),
  ("_renderFechamento",                 "function _renderFechamento(" in idx),
  ("fechFiltroVend dropdown",           "fechFiltroVend" in idx),
  ("calcularFechamento",                "function calcularFechamento(" in idx),
  ("_calcFechamento",                   "function _calcFechamento(" in idx),
  ("salvarFechamento",                  "async function salvarFechamento(" in idx),
  ("imprimirFechamento",                "function imprimirFechamento(" in idx),
  ("_renderHistComissao",               "async function _renderHistComissao(" in idx),
  ("marcarComissaoPaga",                "async function marcarComissaoPaga(" in idx),
  ("_modeloComissao",                   "function _modeloComissao(" in idx),
  ("_renderConfigComissao",             "function _renderConfigComissao(" in idx),
  ("calcLucroLiquido",                  "function calcLucroLiquido(" in idx),
  ("calcComissaoOrdem",                 "function calcComissaoOrdem(" in idx),
  # ── HTML Bloco 7 ──
  ("comissaoFechamento div",            'id="comissaoFechamento"' in idx),
  ("comissaoHist div",                  'id="comissaoHist"' in idx),
  ("comTab_fechamento",                 'id="comTab_fechamento"' in idx),
  ("comTab_hist",                       'id="comTab_hist"' in idx),
  # ── VERIFICAÇÕES CRÍTICAS ──
  ("tracking.html URL correta",         "tracking.html?id=" in idx),
  ("push em confirmarConverterOrc",     "notificar-push" in idx and "nova_ordem" in idx),
  ("onFornChange sem bloqueio",         "já tem valor — não sobrescreve" not in idx),
  ("nextCrmId filtro prefixo",          "startsWith(base)" in idx),
  ("OneSignal sem dupla init",          "_oneSignalInited" in idx),
  ("WA cobranca usa tracking link",     "tracking.html?id=" in idx and "cobranca" in idx),
  # ── UTILITÁRIOS ──
  ("toast",                             "function toast(" in idx),
  ("showConfirm",                       "function showConfirm(" in idx),
  ("openModal",                         "function openModal(" in idx),
  ("closeModal",                        "function closeModal(" in idx),
  ("addLog",                            "function addLog(" in idx),
  ("setSyncDot",                        "function setSyncDot(" in idx),
  ("nextCrmId",                         "const nextCrmId=" in idx),
  ("uid()",                             "const uid=" in idx),
  ("api()",                             "const api =" in idx or "const api=" in idx),
  ("setView",                           "function setView(" in idx),
  ("fmt()",                             "function fmt(" in idx),
]

checks_cadastro = [
  ("</script> count == 1",              cad.count('</script>') == 1),
  ("carregarMarca",                     "async function carregarMarca(" in cad),
  ("aplicarMarca",                      "function aplicarMarca(" in cad),
  ("maskTel",                           "function maskTel(" in cad),
  ("maskDoc",                           "function maskDoc(" in cad),
  ("maskCep",                           "function maskCep(" in cad),
  ("buscaCep",                          "async function buscaCep(" in cad),
  ("updateQtdInfo",                     "function updateQtdInfo(" in cad),
  ("getNextCrmId",                      "async function getNextCrmId(" in cad),
  ("showErr",                           "function showErr(" in cad),
  ("escolherNFCad",                     "function escolherNFCad(" in cad),
  ("escolherTipoSol",                   "function escolherTipoSol(" in cad),
  ("enviarCadastro",                    "async function enviarCadastro(" in cad),
  ("notificarEquipe",                   "function notificarEquipe(" in cad),
  ("SUPA_URL",                          "const SUPA_URL" in cad),
  ("SUPA_KEY",                          "const SUPA_KEY" in cad),
  ("EQUIPE_WA",                         "const EQUIPE_WA" in cad),
  ("VEND_UID",                          "const VEND_UID" in cad),
  ("busca fornecedor preco_cli",        "preco_cli" in cad),
  ("mensagem simples cliente",          "Em instantes entraremos em contato" in cad),
  # ── COTAÇÃO AUTOMÁTICA Sessão 11 ──
  ("cotação pedido confirmado",         "precoCliAuto > 0" in cad),
  ("tracking link no pedido confirmado","tracking.html?id=" in cad),
  ("orçamento sem WA para cliente",     "salvarLotePrecosCli" not in cad),
  # ── NF ACRÉSCIMO Sessão 12 ──
  ("_nfAcrescimo declarado",            "let _nfAcrescimo" in cad),
  ("nf_acrescimo carregado do banco",   "nf_acrescimo" in cad),
  ("acréscimo aplicado ao precoCliAuto","_nfAcrescimo" in cad and "_cadTemNF" in cad),
]

def imprimir(titulo, checks):
    ok = sum(1 for _, v in checks if v)
    total = len(checks)
    falhou = [(n, v) for n, v in checks if not v]
    status = "✅ OK" if ok == total else f"⚠️  {len(falhou)} FALHA(S)"
    print(f"\n{'='*52}")
    print(f"  {titulo}  —  {ok}/{total}  {status}")
    print(f"{'='*52}")
    if falhou:
        for nome, _ in falhou:
            print(f"  ❌ FALTA: {nome}")
    else:
        print("  Tudo íntegro.")
    return len(falhou)

total = 0
total += imprimir("index.html", checks_index)
total += imprimir("cadastro.html", checks_cadastro)

print(f"\n{'='*52}")
if total == 0:
    print("  ✅ PODE AVANÇAR — ambos os arquivos íntegros")
else:
    print(f"  🚫 CORRIGIR {total} ITEM(NS) ANTES DE AVANÇAR")
print(f"{'='*52}\n")
```

---

## Como usar no início de cada sessão

1. Anexar `index.html` + `cadastro.html` + `CONTEXTO.md` + `CHECKLIST.md`
2. Pedir ao Claude: **"Rode o checklist antes de começar"**
3. Se falhar qualquer item → Claude corrige antes de qualquer bloco novo
4. Só após **PODE AVANÇAR** iniciar o desenvolvimento
5. *(Opcional)* Rodar `crm-test-runner.html` no browser para validar o banco

---

## Notas importantes

- `</script>` count = **3** no index.html (QRCode + OneSignal SDK + principal)
- `COBR_DIAS_ALERTA` e `COBR_DIAS_CRITICO` são `let` — carregados do banco no login
- `cobrado_em` salvo no banco a cada cobrança disparada — base do controle anti-dupla-cobrança
- `foiCobradoHoje(c)` — helper que checa se `cobrado_em` é de hoje
- `cobrarIndividual(id)` — registra cobrado_em + abre modal enviarWA (usuário escolhe template)
- `totalAberto` soma `todos` (não só pendentes) — cobrados hoje ainda têm valor em aberto
- JSONB `regioes`: campo `preco` = custo fornecedor / `preco_cli` = valor cliente
- `abrirLotePrecosCli(fid)` — modal lote com campo padrão + ajuste individual por bairro
- `lpAplicarPadrao()` — aplica nos vazios; `lpAplicarTodos()` — aplica em todos
- cadastro.html: pedido confirmado com preco_cli → abre WA cliente com valor + tracking
- cadastro.html: orçamento → só equipe recebe, cliente espera contato manual
- tracking.html v6: `pagarOrdemIndividual` gera QR Code por ordem; `btn-pagar-tudo` para total; `badge-nf` mostra nº NF
- tracking.html v5: valor Pix = `rec + nf_acrescimo` quando `nf_num` preenchido
- XLS banco: usar sempre `Teste_QR_CODE1.xls` — não o extrato geral de PIX
- `_nfAcrescimo` — acréscimo fixo R$ carregado de `config.nf_acrescimo`; usado em cadastro.html e tracking.html
- Para alterar acréscimo NF: mudar só o valor na tabela `config`, chave `nf_acrescimo`

---

## Regra de ouro

> **Nenhuma linha de código é escrita antes do checklist passar 100% nos dois arquivos.**
> Se falhar, o primeiro trabalho da sessão é restaurar o que está faltando.
> Só depois avançar para o bloco novo.
>
> **Fluxo de deploy:** acumular mudanças, Claude avisa quando lote estiver pronto para subir.
>
> **Ao final de TODA sessão:** gerar CONTEXTO.md e CHECKLIST.md atualizados para download.
> **Subir no GitHub:** index.html + cadastro.html + tracking.html + CONTEXTO.md + CHECKLIST.md
