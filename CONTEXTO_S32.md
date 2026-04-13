# CONTEXTO_S32.md — CaçambaSP CRM
**Arquivos:** `index.html` · `mobile.html` · `tracking.html` · `cadastro.html`
**Deploy:** `cacambasp-crm.vercel.app`
**Supabase:** `ejfuqijtiberxsnvxdwm`
**Última atualização:** 2026-04-13 (S31 completo)

> Regra: ao iniciar nova sessão, carregar APENAS este arquivo + index.html + mobile.html como contexto.

---

## 📊 Contagem de linhas
| Arquivo | Linhas |
|---------|--------|
| `index.html`    | 9.502  |
| `mobile.html`   | 4.286  |
| `tracking.html` | 567    |
| `cadastro.html` | 670    |

---

## ✅ O que foi feito nesta sessão (S31)

### 1. Fix mobile — COBR_DIAS_CRITICO não definido
- Declaradas variáveis globais `let COBR_DIAS_ALERTA = 3` e `let COBR_DIAS_CRITICO = 7` — linha ~994
- Query de config expandida para incluir `cobr_dias_alerta` e `cobr_dias_critico` — linha ~1994
- Parser de config atualizado para sobrescrever as variáveis com valores do Supabase

### 2. Fix mobile — badge-alert ID duplicado
- Segundo `id="badge-alert"` renomeado para `id="badge-alert2"` no nav não-admin
- `_atualizarAlertasBadge()` atualiza ambos os IDs: `badge-alert` e `badge-alert2`

### 3. Fix mobile — renderAlertas portada para S30 (5 seções)
- Substituída versão antiga (2 seções) pela versão S30 completa com:
  1. 🚫 Inadimplentes
  2. 🚨 Críticos (COBR_DIAS_CRITICO)
  3. ⚠️ Atenção (COBR_DIAS_ALERTA)
  4. 📄 Orçamentos não lidos
  5. 🚚 Entregas aguardando confirmação
- Adicionado `alertasSubtitle` na view HTML — linha ~566
- Adicionado CSS completo das classes `.alerta-*` — linha ~442
- Helpers portados: `diasEmAberto()`, `foiCobradoHoje()`, `deveConfirmarEntrega()`, `badgeEntregaExpirado()`
- `_atualizarAlertasBadge()` nova substituindo `atualizarAlertBadge()` (mantido como alias)

### 4. Fix index — Conciliação: data "Último arquivo importado"
- `reader.onload` convertido para `async function` para suportar `await`
- `ultima_conciliacao` gravado no Supabase imediatamente ao processar XLS (antes só gravava ao confirmar)
- Label alterado: "Última importação" → "Último arquivo importado"
- Quando null: exibe "Nenhuma importação registrada" em vez de nada

### 5. Gerador de Orçamento PDF — novos campos (index + mobile)

**Index** — campos adicionados ao formulário:
- `orc_g_perm_rua` — Permanência na rua (dias úteis), padrão 3 — linha ~9011
- `orc_g_perm_canteiro` — Permanência no canteiro (dias úteis), padrão 5 — linha ~9012
- `orc_g_tel` — Telefone/WhatsApp (pré-preenchido de o.cel) — linha ~9007
- `orc_g_cpf` — CPF/CNPJ (pré-preenchido de o.cpf) — linha ~9009

**`_pdfDados()`** — novos campos no retorno: `permRua`, `permCant`, `tel`, `cpf`

**`gerarPDFOrcamento()`** — lê e salva `orc_perm_rua` e `orc_perm_canteiro` no Supabase

**Todos os 4 temas PDF (A/B/C/D)** — atualizados para exibir:
- Tel e CPF/CNPJ no card do cliente
- 3 boxes de condições: Perm. Rua / Perm. Canteiro / Prazo Total

**Mobile** — novo gerador completo:
- View `view-orc-mob` adicionada — linha ~571
- `abrirOrcMob(id)` — abre a view passando o ID da ordem
- `renderOrcMob()` — formulário com todos os campos + botões — linha ~4003
- `gerarOrcMobPDF()` — gera HTML do PDF em nova aba (Tema D bold) — linha ~4107
- `salvarEEnviarOrcMob()` — salva dados e envia mensagem WA formatada
- `_salvarDadosOrcMob()` — helper para persistência no Supabase
- Botão "📄 Gerar Orçamento PDF" no `renderDetalhe()` quando `col === 'orcamento'` — linha ~3726

### 6. Fix nextCrmId — ID nunca se repete (index + mobile)
**Problema:** `nextCrmId('LC')` buscava só `LC2026*`, ignorava ORC — gerava IDs que colid­iam numericamente com orçamentos existentes.

**Correção index** — linha ~1632:
- Query alterada para `crm_id=like.*2026*` — busca LC + ORC + GRP
- Extrai o número de qualquer prefixo e pega o maior
- Nunca repete número sequencial

**Correção mobile** — linha ~3538:
- Mesma lógica portada para o mobile

### 7. Fix converterOrcamento — gera crm_id no mobile
**Problema:** mobile não gerava novo crm_id ao converter orçamento — mantinha o ORC...

**Correção** — linha ~3627:
- `const novoCrmId = await nextCrmId()` chamado antes do PATCH
- Salva `crm_id: novoCrmId` no banco junto com a conversão

### 8. Fix coluna ao converter orçamento (index + mobile)
**Problema:** ao converter com fornecedor já atribuído, entrava em `contratar` em vez de `ag_entrega`.

**Correção:**
- `const colInicial = o.forn_id ? 'ag_entrega' : 'contratar'`
- Index linha ~8539 / mobile linha ~3629

### 9. Fix autoColFornNomeado — reforço com verificação forn_id
- Adicionada verificação `&& c.forn_id` antes de mover para `ag_entrega`
- Index linha ~1526 / mobile (inline) linha ~1256

### 10. Fix voltarOrcamentoDetail — renderKanban inexistente
**Problema:** `voltarOrcamentoDetail()` chamava `renderKanban()` que não existe — função travava silenciosamente.

**Correção** — linha ~3896:
- Substituído por `renderBoard(); renderStats(); _atualizarOrcBadge()`

### 11. Documentação gerada
- `doc_tecnico_programadores.pdf` — stack, tabelas, Kanban, comissões, protocolo de sessão
- `doc_manual_vendedores.pdf` — manual simples para a equipe
- `manual_vendedor_interativo.html` — versão web com tema escuro, busca, navegação lateral

---

## ⚠️ Pendências para S32

1. **Testar no celular** — verificar tela Alertas com 5 seções + badge no bottom nav
2. **Testar gerador PDF mobile** — verificar layout em diferentes tamanhos de tela
3. **Hospedar manual interativo** — subir `manual_vendedor_interativo.html` no Vercel
4. **Relatório view_financeiro** — investigar por que tem apenas 2% de acessos (pendente S30)
5. **Dashboard — gráfico evolução mensal** — gráfico de linha mês a mês (pendente S30)

---

## 🏗️ Stack
- Single-file HTML/JS/CSS (index.html + mobile.html)
- Auth: Supabase Auth REST
- API: REST Supabase direto (sem SDK)
- QRCode: cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
- SheetJS: cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
- Push: OneSignal Web SDK v16
- Pix EMV: buildPix() / emv() / crc16() local

## 🔐 Constantes
```
SUPA_URL = https://ejfuqijtiberxsnvxdwm.supabase.co
PIX_KEY  = cacambasp@gmail.com
PIX_NAME = Luciana Cristina Testa
PIX_CITY = SAO PAULO
LOGOS_BUCKET = https://ejfuqijtiberxsnvxdwm.supabase.co/storage/v1/object/public/logos/
```

*Gerado em 2026-04-13 · Próxima sessão: S32*
