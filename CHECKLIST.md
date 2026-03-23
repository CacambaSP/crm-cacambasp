# CaçambaSP CRM — Checklist de Integridade (atualizado 23/03/2026 — Sessão 4)

> **Como usar:**
> No início de TODA sessão, antes de qualquer código, rode o script abaixo.
> Se qualquer item falhar → NÃO avançar. Corrigir primeiro.

---

## Script de verificação (rodar no início de cada sessão)

```python
# Salve como check.py na pasta do projeto e rode: python3 check.py
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
  # NOTA: </script> count == 3 é NORMAL (linha 14 = QRCode, linha 397 = OneSignal SDK, + principal)
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
  # ── ORCAMENTOS Bloco 3 ──
  ("renderOrc",                         "function renderOrc(" in idx),
  ("renderOrcPend",                     "function renderOrcPend(" in idx),
  ("setOrcTab",                         "function setOrcTab(" in idx),
  ("_atualizarOrcBadge",               "function _atualizarOrcBadge(" in idx),
  ("debounceOrc",                       "function debounceOrc(" in idx),
  ("abrirOrcGerador",                   "function abrirOrcGerador(" in idx),
  ("renderOrcGerador",                  "function renderOrcGerador(" in idx),
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
  # ── RELATORIOS / NF / STATS ──
  ("renderStats",                       "function renderStats(" in idx),
  ("renderHist",                        "function renderHist(" in idx),
  ("renderFinanceiro",                  "function renderFinanceiro(" in idx),
  ("renderNF",                          "function renderNF(" in idx),
  ("renderRel",                         "function renderRel(" in idx),
  ("renderCobr",                        "function renderCobr(" in idx),
  ("renderComissao",                    "function renderComissao(" in idx),
  # ── COMISSOES Bloco 7 ──
  ("renderComissaoView",                "function renderComissaoView(" in idx),
  ("setComTab",                         "function setComTab(" in idx),
  ("_renderFechamento",                 "function _renderFechamento(" in idx),
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
  ("comissaoFechamento div",            "id=\"comissaoFechamento\"" in idx),
  ("comissaoHist div",                  "id=\"comissaoHist\"" in idx),
  ("comTab_fechamento",                 "id=\"comTab_fechamento\"" in idx),
  ("comTab_hist",                       "id=\"comTab_hist\"" in idx),
  # ── UTILITARIOS ──
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

---

## Funções por arquivo — referência rápida

### index.html (~5.877 linhas) — atualizado Bloco 7

| Bloco | Funções principais |
|---|---|
| Base | doLogin, tok, renderBoard, oDrop, salvarOrdem, arquivarOrdem, openDetail |
| Sessão 2 | fmt() declarada; renderCobr(), renderComissao() aliases; polling 8s |
| Bloco 3 | renderOrcPend, renderOrcHist, confirmarConverterOrc, confirmarArquivarOrc |
| Bloco 4+5 | _pdfTemaA/B/C/D, _abrirPDFPorTema, gerarPDFOrcamento, enviarWaOrc |
| Bloco 6 | renderForns, addBairroSelecionado, filtrarBairrosAC, _renderFornSugestao |
| Bloco 7 | renderComissaoView, _calcFechamento, calcularFechamento, salvarFechamento, _renderHistComissao, marcarComissaoPaga, _modeloComissao |

### cadastro.html (~612 linhas)

| Bloco | Funções principais |
|---|---|
| Base | carregarMarca, aplicarMarca, maskTel, maskCep, buscaCep |
| Bloco 3 | getNextCrmId (corrigida — filtra prefixo ORC/LC) |
| Base | enviarCadastro, escolherNFCad, escolherTipoSol, notificarEquipe |

---

## Notas importantes

- `_modeloComissao(u)` identifica vendedor por primeiro nome normalizado (sem acento, lowercase)
- Cálculo usa `pago_em` (data do pagamento) — não `data` da ordem
- Upsert por `(mes, usuario_id)` — pode recalcular e salvar novamente sem duplicar
- Taxa adm padrão: R$10/ordem — editável na aba Modelos
- Claudia recebe extra do fechamento da Sandra (30% do restante da Sandra)
- Douglas não aparece como card no fechamento — valor dele é mostrado no header
- `</script>` count = 2 é NORMAL (linha 14 = biblioteca QRCode externa) — checklist já corrigido para aceitar 2

---

## Regra de ouro

> **Nenhuma linha de código é escrita antes do checklist passar 100% nos dois arquivos.**
> Se falhar, o primeiro trabalho da sessão é restaurar o que está faltando.
> Só depois avançar para o bloco novo.
>
> **Ao final de TODA sessão:** gerar CONTEXTO.md e CHECKLIST.md atualizados como arquivos para download.
