# CaçambaSP Mobile — Contexto Completo (v1.0 — 30/03/2026)

> Sempre inicie anexando: `mobile.html` + `CONTEXTO_MOBILE.md`
> Este arquivo é independente do `index.html` — não misturar os dois contextos.

---

## Visão geral

Aplicativo mobile simplificado para operação em campo. Arquivo único `mobile.html`, mesmo Supabase e mesmo login do CRM desktop (`index.html`). **Nenhuma linha do `index.html` foi alterada.**

| Item | Valor |
|---|---|
| Arquivo | `mobile.html` |
| URL produção | `cacambasp-crm.vercel.app/mobile.html` |
| Repositório | `github.com/CacambaSP/crm-cacambasp` |
| Supabase | `ejfuqijtiberxsnvxdwm` (mesmo do CRM) |
| Versão | 1.0 |
| Linhas | ~1.515 |

---

## Stack

- HTML/CSS/JS puro — arquivo único
- Supabase REST API (mesmo projeto do CRM)
- QRCode.js via CDN (geração de Pix)
- Fonte: Plus Jakarta Sans + JetBrains Mono
- Deploy: Vercel (auto-deploy junto com o repositório principal)

---

## Perfis e telas

### Operador (Claudia · Ricardo · Sandra)
Nível `operador` no banco. Vê apenas as próprias ordens.

| # | Tela | Descrição |
|---|---|---|
| 1 | **Início** | Minhas ordens do dia, ordenadas por urgência (5+ dias → urgente) |
| 2 | **Nova ordem** | Formulário rápido com sugestão automática de fornecedor por bairro |
| 3 | **Avisos** | Cobranças pendentes (3+ dias) e ordens sem fornecedor |

Bottom nav: `🏠 Início` · `＋ Nova` · `🔔 Avisos`

---

### Admin (Douglas · Luciana)
Nível `admin` no banco. Vê todas as ordens da equipe.

| # | Tela | Descrição |
|---|---|---|
| 1 | **Início** | Switcher "Minhas ordens / Toda equipe" no topo |
| 2 | **Equipe** | Ordens agrupadas por vendedor com barra de progresso |
| 3 | **Nova ordem** | Igual ao operador + campo extra para atribuir a outro vendedor |
| 4 | **Financeiro** | KPIs do mês + a receber (urgentes primeiro) + a pagar fornecedores |
| 5 | **Alertas** | Cobranças de toda a equipe + ordens sem fornecedor |

Bottom nav: `🏠 Início` · `👥 Equipe` · `＋ Nova` · `💰 Financeiro` · `🔔 Alertas`

---

### Switcher (exclusivo do admin)
- Aparece só na tela **Início**
- **"Minhas ordens"** → lista as ordens do próprio admin, igual ao operador
- **"Toda equipe"** → KPIs do negócio + painel resumido por vendedor
- As ordens do próprio admin aparecem com chip laranja **"minha"** nas telas de equipe e financeiro
- Ambos Douglas e Luciana têm o switcher (ambos vendem)

---

## Decisões de design

### Tipografia
| Elemento | Tamanho |
|---|---|
| Nome do cliente no card | 15px |
| Endereço no card | 13px (via card-addr) |
| Chips (status, valor) | 11px |
| Botões de ação | 13px · min-height 38px |
| Label de seção | 11px uppercase |
| Título topbar | 16px |
| Bottom nav label | 10px |
| Ícones bottom nav | 22px |
| Nenhum texto de conteúdo abaixo de | **12px** |

### Kanban → seletor de coluna
O mobile não tem kanban drag-and-drop. No detalhe de cada ordem há uma seção **"Etapa no funil"** com 6 botões (um por coluna). A coluna atual fica destacada. Um toque move e salva no banco imediatamente.

Colunas disponíveis: `contratar` · `entrega` · `pagar` · `faltapg` · `baixar` · `inadimp`

### Acessibilidade
- Todos os alvos de toque têm mínimo 38px de altura
- Bottom nav com 64px de altura
- Safe area inset respeitado (`env(safe-area-inset-bottom)`)
- Swipe down para fechar qualquer modal
- `inputmode="decimal"` em campos numéricos
- `inputmode="numeric"` em CPF/CNPJ

---

## Formulário de Nova Ordem

Campos obrigatórios: **Nome**, **WhatsApp**, **Rua e número**, **Bairro**, **Nota Fiscal (sim/não)**

Campos opcionais: CPF/CNPJ, Cidade, Tipo, Data, Valor cobrado, Custo fornecedor, Observação, Fornecedor

### Sugestão automática de fornecedor
Ao digitar o bairro, o app busca nos `regioes` JSONB dos fornecedores o que tem cobertura exata. Se encontra, exibe um card laranja "Sugerido · bairro — toque para aplicar" com o preço. Ao tocar, preenche o campo fornecedor e o custo automaticamente.

### Campo CPF/CNPJ
Máscara automática: detecta pelo comprimento se é CPF (`000.000.000-00`) ou CNPJ (`00.000.000/0000-00`). Salvo no campo `cpf` da tabela `ordens`.

### NF obrigatória
Dois botões: **"🧾 Com NF"** e **"✅ Sem NF"**. Obrigatório antes de salvar. Se com NF, soma `_nfAcrescimo` (R$40, carregado de `config.nf_acrescimo`) ao valor `rec`.

### Geração do CRM ID
Consulta ao banco para encontrar o maior número atual com prefixo `LC{ano}`. Incrementa +1. Mesmo algoritmo do `index.html` (`nextCrmId`), adaptado sem async generator.

---

## Detalhe da Ordem

Acessado tocando em qualquer card. Exibe:

1. **Bloco de status** — pago (verde) · em aberto (laranja) · atrasado (vermelho) com botão de registrar pagamento
2. **Grid de ações 2×2** — WhatsApp cliente · Gerar Pix · WA Fornecedor · Tracking
3. **Dados do cliente** — Nome, WhatsApp, CPF/CNPJ (se houver)
4. **Dados do serviço** — Endereço, Tipo, Data, Fornecedor, Responsável, Obs
5. **Financeiro** (só admin) — Receita, Custo, Margem, Forn. pago?
6. **Etapa no funil** — 6 botões para mover coluna (não aparece se arquivado)
7. **Botões Duplicar + Arquivar** (ou "Voltar ao funil" se já arquivado)

---

## Funções principais

| Função | O que faz |
|---|---|
| `doLogin()` | Autentica via Supabase Auth, salva sessão no localStorage |
| `restoreSession()` | Tenta refresh token ao carregar o app |
| `loadApp()` | Carrega perfil, ordens, fornecedores, usuários e `nf_acrescimo` em paralelo |
| `initApp()` | Monta avatar, switcher, bottom nav e abre tela Início |
| `setView(v)` | Troca de tela com histórico de navegação (goBack funciona) |
| `renderInicio()` | Lista ordens priorizadas: urgentes → em aberto → pagas |
| `renderInicioAdmin()` | KPIs + painel da equipe com barra de progresso |
| `renderEquipe()` | Ordens agrupadas por vendedor |
| `renderNova()` | Gera o formulário de nova ordem dinamicamente |
| `buscarFornSugestao()` | Busca fornecedor por bairro nos JSONB `regioes` |
| `salvarNovaOrdem()` | Gera CRM ID, valida, salva no Supabase, atualiza lista local |
| `renderFinanceiro()` | KPIs + urgentes a receber + pendentes + a pagar fornecedores |
| `renderAlertas()` | Críticos (7+d) · Atenção (3-7d) · Sem fornecedor (admin) |
| `renderDetalhe()` | Tela completa de detalhes com ações e seletor de coluna |
| `moverColuna(id, colId)` | Atualiza coluna no banco e re-renderiza o detalhe |
| `duplicarOrdem(id)` | Cria nova ordem como Troca com os dados da original, zerando pagamentos |
| `desarquivarOrdem(id)` | Move ordem de `concluido` para `baixar` |
| `arquivarOrdem(id)` | Move para `concluido` com confirmação |
| `abrirPagarCli(id)` | Abre modal de registro de pagamento |
| `confirmarPagoCli()` | Salva pagamento, move coluna para `baixar` se necessário |
| `abrirPix(id)` | Gera payload EMV e QR Code via QRCode.js |
| `copiarPix()` | Copia payload para clipboard |
| `enviarPixWA()` | Monta mensagem com payload e abre WhatsApp |
| `enviarWA(id)` | Mensagem de cobrança (urgente ou normal) via WhatsApp |
| `enviarWAForn(id)` | Mensagem de OS para o fornecedor via WhatsApp |
| `enviarTracking(id)` | Envia link tracking.html para o cliente via WhatsApp |
| `buildBottomNav()` | Monta bottom nav com 3 botões (operador) ou 5 (admin) |
| `atualizarAlertBadge()` | Conta ordens sem pagamento com 3+ dias e atualiza badge |
| `setSwitcher(mode)` | Alterna entre 'mine' e 'all' no Início do admin |
| `diasAberto(o)` | Calcula dias desde `data` ou `criado_em` da ordem |
| `cardHTML(o, tipo, showMine)` | Gera HTML de um card de ordem com chips e botões |
| `alertCard(o, tipo)` | Gera HTML de um card de alerta com ação WA inline |

---

## Modais

| Modal | ID | Descrição |
|---|---|---|
| Pagar cliente | `pagarCliModal` | Valor, data e obs do recebimento |
| Pix | `pixModal` | QR Code + código copia-cola + botão enviar WA |
| Confirm | `confirmModal` | Confirmação genérica com ícone, título e corpo |

Todos os modais fecham com:
- Botão ✕
- Clique fora (no overlay)
- Swipe down (touch event no `.modal-box`)
- Tecla Escape

---

## Auto-refresh

Polling a cada 10 segundos via `setInterval`. Compara `id+pago+col` de cada ordem. Se houver diferença, atualiza `_ordens` e re-renderiza a view atual. Não usa Realtime WebSocket (simplicidade).

---

## Gestão de estado

```
_user          → sessão Supabase (access_token + user.id)
_perfil        → registro do perfil (nivel, nome)
_ordens        → todas as ordens do banco (admin) ou só as do usuário (operador)
_forns         → fornecedores com regioes JSONB
_usuarios      → todos os perfis (para painel de equipe)
_switcherMode  → 'mine' | 'all' (só admin)
_currentView   → view ativa no momento
_viewStack     → histórico de views para goBack()
_detalheId     → ID da ordem aberta no detalhe
_pixOrdemId    → ID da ordem com Pix aberto
_nfAcrescimo   → valor carregado de config.nf_acrescimo (padrão R$40)
_novaTemNF     → null | true | false (formulário nova ordem)
_novaFornSug   → objeto fornecedor sugerido pelo bairro
```

---

## Sessão

Salva em `localStorage` com chave `csm_session` (diferente do CRM desktop que usa `crm_session`). Restaurada via refresh token ao abrir o app.

---

## O que NÃO está no mobile (só no desktop)

- Kanban drag-and-drop
- Relatórios e dashboard completo
- Fechamento de comissões
- Conciliação bancária XLS
- Gestão de fornecedores e bairros
- Gestão de usuários
- Notas fiscais
- Gerador de PDF de orçamento
- Pagamento de fornecedor em lote
- Cobrança automática em lote
- Histórico completo de ordens
- Orçamentos (col=orcamento)

---

## Bugs corrigidos na v1.0

| Bug | Causa | Fix |
|---|---|---|
| Tela preta após login | `#appPage` não recebia `.show` em `initApp()` | Adicionado `appPage.classList.add('show')` |
| Login ficava invisível | `#loginPage` sem `.show` no CSS | Adicionado `#loginPage.show{display:flex}` |
| CPF/CNPJ ausente no formulário | Campo não existia no `renderNova()` | Campo adicionado com máscara automática |
| Não dava para trocar coluna | Sem kanban no mobile | Seletor de coluna adicionado no `renderDetalhe()` |
| Sem botão duplicar | Função não existia no mobile | `duplicarOrdem()` implementada com confirm |

---

## Como iniciar uma sessão de desenvolvimento

1. Anexar `mobile.html` + `CONTEXTO_MOBILE.md`
2. **Não anexar** `index.html` — são projetos independentes
3. Verificar qual perfil está sendo afetado (operador ou admin)
4. Lembrar: qualquer mudança de schema no Supabase afeta os dois (desktop e mobile)

---

## Deploy

Adicionar `mobile.html` no repositório `github.com/CacambaSP/crm-cacambasp`. O Vercel faz deploy automático. Acessível em `cacambasp-crm.vercel.app/mobile.html`.

Não é necessário nenhuma configuração extra no Vercel — o arquivo é estático e usa o mesmo Supabase.

---

## Regra de ouro

> O `mobile.html` é independente. Nunca edite o `index.html` para adicionar funcionalidades do mobile.
> Se uma função existe nos dois, cada arquivo tem sua própria implementação — não compartilham código.
> Ao final de TODA sessão: atualizar `CONTEXTO_MOBILE.md` e subir ambos no GitHub.
