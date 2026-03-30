# CaçambaSP CRM — Contexto Completo (atualizado 27/03/2026 — Sessão 12 finalizada)

> Sempre inicie anexando: `index.html` + `cadastro.html` + `CONTEXTO.md` + `CHECKLIST.md`
> Primeira coisa: rodar o CHECKLIST. Só avançar após PODE AVANÇAR.

---

## Regra de fluxo de deploy (adotada Sessão 8)

> **Acumular mudanças** antes de subir no GitHub. Claude avisa quando tiver lote relevante.
> Não subir a cada correção pontual — só quando houver conjunto significativo de alterações.

---

## Stack

| Componente | Tecnologia |
|---|---|
| Frontend | HTML/CSS/JS puro — arquivo único `index.html` |
| Backend | Supabase (PostgreSQL) |
| Deploy | Vercel (auto-deploy via GitHub) |
| Repositório | github.com/CacambaSP/crm-cacambasp |
| URL produção | cacambasp-crm.vercel.app |

---

## Supabase

```
Project ID : ejfuqijtiberxsnvxdwm
URL        : https://ejfuqijtiberxsnvxdwm.supabase.co
ANON KEY   : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZnVxaWp0aWJlcnhzbnZ4ZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTMyMzYsImV4cCI6MjA4OTE4OTIzNn0.14Ba8klx6YkPT5UrZ2eB5cYWdSKcBOCl4mdEgfmXqaU
```

### Colunas adicionadas
```sql
-- Sessão 8
ALTER TABLE ordens ADD COLUMN IF NOT EXISTS forn_pg_ref text;

-- Sessão 10
ALTER TABLE ordens ADD COLUMN IF NOT EXISTS cobrado_em timestamptz DEFAULT NULL;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS preco_cli_padrao numeric DEFAULT 0;
```

### JSONB regioes (fornecedores) — estrutura atual
```json
{ "bairro": "Bela Vista", "regiao": "Bela Vista", "preco": 310, "preco_cli": 450, "turno": "diurno" }
```
- `preco` = custo do fornecedor
- `preco_cli` = valor cobrado do cliente (usado na cotação automática do cadastro.html)

### Tabela config — chaves ativas
| Chave | Valor padrão | Descrição |
|---|---|---|
| `nf_taxa` | 11 | Taxa NF em % |
| `nf_acrescimo` | 40 | Acréscimo fixo R$ no valor ao cliente quando tem NF — **alterar aqui para mudar para R$50** |
| `crm_comissoes` | JSON | Config comissões por vendedor |
| `cobr_dias_alerta` | 3 | Dias para atenção (amarelo) |
| `cobr_dias_critico` | 7 | Dias para crítico (vermelho) |

Edge Functions ativas:
- `criar-usuario`
- `notificar-push` v5 — usa `include_subscription_ids`

### RLS — políticas da tabela `ordens`
| Policy | Cmd | Quem |
|---|---|---|
| ordens_select_auth | SELECT | autenticados (CRM) |
| ordens_select_anon | SELECT | anônimos (tracking público) |
| ordens_insert_anon | INSERT | anônimos (cadastro.html) |
| ordens_update_auth | UPDATE | autenticados |
| ordens_delete_auth | DELETE | autenticados |

---

## Credenciais

```
URL CRM  : cacambasp-crm.vercel.app
Email    : cacambasp@gmail.com
Senha    : CacambaSP123
```

| Usuário | Nível | Senha | OneSignal ID |
|---|---|---|---|
| Luciana | admin | CacambaSP123 | null |
| Douglas | admin | teste123 | 8995e30d-a687-49a6-8b91-21cf08d06d68 |
| Leticia | admin | — | 22d397e2-50b5-41da-ab09-87471e1e9a32 |
| Claudia | operador | teste123 | null |
| Ricardo | operador | teste123 | null |
| Sandra  | operador | teste123 | null |

```
Pix      : cacambasp@gmail.com / Luciana Cristina Testa / SAO PAULO
WA equipe: 551142378757
Caçambas : todas são de 4m³
```

```
Vercel Team ID   : team_j1IjiOAEU50KpvGz5XNyayt1
Vercel Project ID: prj_PrGed6Fi63ZNUVYWBc42ulS4arzF
```

---

## OneSignal

```
App ID   : c2dbdd20-6f19-433f-8106-f45d3e37714d
REST Key : os_v2_app_yln52idpdfbt7aig6rot4n3rjxvninjm5hiueg4gosxgw3cenxwybzz4ki7s3wszgqnsg4hctpuxvfoy3ca25dwancydpu6gi2uzdmi
```

**Status push:**
- ✅ PC (Chrome desktop): chegando normalmente
- ❌ Mobile: não chegando — pendente Sessão 13
- Fix Sessão 8: `window._oneSignalInited` evita dupla inicialização

---

## Arquivos do projeto

| Arquivo | Descrição |
|---|---|
| `index.html` | CRM completo — Blocos 1-7B + todas correções até Sessão 12 |
| `cadastro.html` | Formulário público de cadastro + cotação automática por bairro |
| `tracking.html` | Rastreamento público v6 — pagamento individual por ordem + NF |
| `sw.js` | Service Worker v2.0 com OneSignal |
| `notificar-push.ts` | Edge Function v5 |
| `crm-test-runner.html` | Test runner 33 testes |
| `CONTEXTO.md` | Este arquivo |
| `CHECKLIST.md` | Script de integridade |

---

## Sessão 12 — O que foi feito

### ✅ Importação de fornecedores via planilha
- Planilha `fornecedor_por_bairro_final.xlsx` com 52 fornecedores e 379 bairros
- 3 fornecedores existentes atualizados (Uliana, FRS–Tatiane, Renatec–Renato)
- 49 fornecedores novos criados no Supabase com seus bairros
- Bairros inseridos com `preco=0` e `preco_cli=0` — preencher com botão 💰 Lote
- Importação feita via Edge Function temporária (neutralizada após uso)

### ✅ Limpeza do banco de dados de teste
- Tabelas limpas: `ordens` (14), `ordens_log` (77), `comissoes_fechamento` (2)
- Preservados: `fornecedores`, `perfis`, `config`
- Banco pronto para uso em produção

### ✅ Acréscimo NF no valor ao cliente (index.html + cadastro.html + tracking.html)
- Nova chave `nf_acrescimo = 40` na tabela `config`
- cadastro.html: soma R$40 ao `preco_cli` na mensagem WA ao cliente quando tem NF
- tracking.html: valor do Pix exibido já inclui o acréscimo NF
- Modal Cobrança Pix (index.html): abre com `rec + nf_acrescimo` quando tem NF
- Resumo financeiro: exibe `recCliente = rec + acréscimo`, linha "Acréscimo NF + R$X"
- `rec` salvo na ordem não muda — acréscimo é só no valor exibido/cobrado ao cliente
- Para mudar para R$50: alterar só `config.nf_acrescimo` no Supabase

### ✅ Resumo financeiro redesenhado (index.html)
- Layout espaçado com separadores entre linhas — muito mais legível
- Fonte maior (13px linhas, 15px total)
- Nova linha "Acréscimo NF" em verde quando tem NF
- Receita exibe valor real cobrado do cliente (rec + acréscimo)

### ✅ Tracking v6 — pagamento individual por ordem
- Cliente com múltiplas ordens vê cada uma com seu próprio botão "💳 Pagar esta"
- Badge laranja mostra o nº da NF quando houver (`🧾 NF 2525`)
- Valor de cada ordem já inclui acréscimo NF quando aplicável
- Botão "💳 Pagar tudo junto" aparece quando há 2+ pendentes
- Ao clicar em "Pagar esta": QR Code gerado só para aquela ordem, com identificação no topo
- Ao clicar em "Pagar tudo junto": QR Code do total (comportamento anterior)
- Ordem já paga aparece com ✅ sem botão

---

## Comportamento cotação automática (cadastro.html)

| Tipo | preco_cli > 0 | preco_cli = 0 |
|---|---|---|
| **Pedido Confirmado** | Abre WA cliente com valor + link tracking | Mensagem genérica |
| **Orçamento** | Só equipe recebe (com valor na msg interna) | Só equipe recebe |

**Com NF:** `precoCliAuto = preco_cli + _nfAcrescimo` (R$40 hoje, configurável no banco)

---

## Pendente — Sessão 13

| Item | Prioridade | Detalhe |
|---|---|---|
| **Push mobile** | Alta | Douglas precisa logar no Chrome mobile para registrar onesignal_id |
| **Cadastrar preco_cli nos bairros** | Alta | Usar botão 💰 Lote — 49 fornecedores novos com preco_cli=0 |
| **Migração site WordPress/Hostinger** | Alta | Pendente há várias sessões |

---

## Lógica de negócio — regras importantes

- **Prazo de pagamento:** entregou → pagou (antes da retirada)
- **Inadimplente:** definido manualmente — move card para `inadimp`. NÃO é automático por dias.
- **Cobrança:** assim que entra em `entrega` ou `pagar` já pode cobrar
- **Template padrão WA cobrança:** `cobranca` para todos; `inadimp` para col=inadimp
- **Cobrado hoje:** não conta no badge nem nos contadores de atenção/crítico
- **Total em aberto:** soma todos os não pagos (independente de ter sido cobrado hoje)
- **Cotação automática:** busca fornecedor com bairro exato e `preco_cli > 0`
- **Pedido confirmado + preco_cli:** abre WA para cliente com valor + link tracking
- **Com NF:** valor ao cliente = `preco_cli + nf_acrescimo` (R$40, configurável no banco)
- **tracking.html v6:** cada ordem tem botão "Pagar esta" com QR Code individual; badge NF laranja com nº da nota
- **Modal Cobrança Pix:** abre com `rec + nf_acrescimo` quando `nf_num` preenchido
- **Resumo financeiro:** receita = `rec + acréscimo`; linha "Acréscimo NF" em verde; margem sobre recCliente
- **Orçamento:** só equipe recebe — cliente espera contato manual
- **Dois preços no fornecedor:** `preco` = custo fornecedor / `preco_cli` = valor para cliente
- **Lote preços:** botão 💰 Lote no card do fornecedor — campo padrão + ajuste individual
- **Agrupamento cobranças:** 1 msg por celular; usa tracking link (não chave Pix)
- **XLS banco:** usar sempre `Teste_QR_CODE1.xls` (extrato QR Codes) — não o extrato geral de PIX

---

## Links de cadastro por vendedor

| Vendedor | Link |
|---|---|
| Luciana | `cacambasp-crm.vercel.app/cadastro.html?v=30fb5300-c90d-4dcc-8a8c-16e0b66412c9` |
| Douglas | `cacambasp-crm.vercel.app/cadastro.html?v=6b691e8b-b9e8-4fe7-959a-ee04f04f0803` |
| Claudia | `cacambasp-crm.vercel.app/cadastro.html?v=188457ac-4397-47ad-bb22-8d8a27594b78` |
| Ricardo | `cacambasp-crm.vercel.app/cadastro.html?v=f6e62214-307e-48d4-af53-badf60c0a289` |
| Sandra  | `cacambasp-crm.vercel.app/cadastro.html?v=d2dfdfdb-d204-4d5d-9f26-6c61a9e6517b` |

---

## Notas importantes

- `</script>` count = **3** no index.html (QRCode + OneSignal SDK + principal)
- `onesignal_id` no Supabase = subscription ID do browser — salvo automaticamente no login
- `nextCrmId` é **async** — todos os pontos de uso têm `await`
- `openPixDoDetail` é **async function**
- Templates `cobranca` e `inadimp` enviam link do tracking (não chave Pix)
- `confirmarDeletar` e `selDeletarLote` têm bloqueio de segurança por código para não-admin
- tracking.html v6 busca ordens pelo celular com `nf_num` e `nf_taxa` incluídos
- QR Code agrupado usa txid: `CACAMBA` + últimos 8 dígitos do celular
- `pagarOrdemIndividual(o, valCli)` — gera QR Code individual para uma ordem específica
- `btn-pagar-tudo` — aparece só quando há 2+ ordens pendentes; paga total agrupado
- `badge-nf` — badge laranja com nº da NF exibido na lista de ordens do tracking
- `pix-ord-info` — div que identifica qual ordem está sendo paga no QR Code individual
- `quickPagarCard()` — pago rápido pelo card, aparece em `entrega/pagar/faltapg`
- `_nfAcrescimo` — acréscimo fixo R$ carregado de `config.nf_acrescimo`; usado em cadastro.html, tracking.html e index.html
- `dm_acr_wrap` / `dm_acr` — linha "Acréscimo NF" no resumo financeiro do detail
- `_recPix` — variável no modal Cobrança Pix que soma rec + acréscimo NF
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
