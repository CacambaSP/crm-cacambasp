# CaçambaSP CRM — Contexto Completo (atualizado 23/03/2026 — Sessão 5 / Bloco Tracking + Push)

> **Como usar este arquivo:**
> Sempre inicie uma nova sessão anexando TODOS os 4 arquivos:
> `index.html` + `cadastro.html` + `CONTEXTO.md` + `CHECKLIST.md`
>
> **Primeira coisa de cada sessão:** pedir ao Claude para rodar o CHECKLIST.
> Só avançar para código novo após **PODE AVANÇAR** nos dois arquivos.
>
> **Regra de ouro:** sempre perguntar se é para rodar o código ou só sugerir/planejar. O usuário valida antes de avançar.
>
> **Regra de fim de sessão:** ao final de TODA sessão, Claude deve gerar CONTEXTO.md e CHECKLIST.md atualizados como arquivos para download, refletindo tudo que foi feito.

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

## Supabase — Projeto ATIVO

```
Project ID : ejfuqijtiberxsnvxdwm
URL        : https://ejfuqijtiberxsnvxdwm.supabase.co
ANON KEY   : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZnVxaWp0aWJlcnhzbnZ4ZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTMyMzYsImV4cCI6MjA4OTE4OTIzNn0.14Ba8klx6YkPT5UrZ2eB5cYWdSKcBOCl4mdEgfmXqaU
Região     : sa-east-1 (São Paulo)
CNPJ       : 44.538.708/0001-76
```

Edge Functions ativas:
- `criar-usuario` (POST=criar, PATCH=senha, DELETE=excluir)
- `notificar-push` (POST — dispara push OneSignal) ← NOVA Sessão 5

---

## Credenciais e configurações

```
URL CRM  : cacambasp-crm.vercel.app
Email    : cacambasp@gmail.com
Senha    : CacambaSP123
CNPJ     : 44.538.708/0001-76
```

| Usuário | Nível | Senha |
|---|---|---|
| Luciana | admin | CacambaSP123 |
| Douglas | admin | teste123 |
| Claudia | operador | teste123 |
| Ricardo | operador | teste123 |
| Sandra  | operador | teste123 |

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

## OneSignal — Push Notifications

```
App ID   : c2dbdd20-6f19-433f-8106-f45d3e37714d
REST Key : os_v2_app_yln52idpdfbt7aig6rot4n3rjxvninjm5hiueg4gosxgw3cenxwybzz4ki7s3wszgqnsg4hctpuxvfoy3ca25dwancydpu6gi2uzdmi
App Name : CaçambaSP App
Org      : CaçambaSP
```

---

## Tabelas Supabase

| Tabela | Descrição |
|---|---|
| `ordens` | Ordens de serviço — 35+ colunas |
| `perfis` | Usuários do CRM — inclui `onesignal_id` para roteamento de push |
| `fornecedores` | id, nome, tel, pix, obs, color, regioes jsonb, preco_padrao numeric |
| `ordens_log` | Log de ações por ordem |
| `config` | Configurações globais (chave/valor) |
| `comissoes_fechamento` | Fechamentos mensais de comissão por vendedor |

### Coluna nova em `perfis` — Sessão 5
```
onesignal_id  text   <- external_id do usuário no OneSignal (vinculado após login)
```

> **IMPORTANTE:** adicionar a coluna `onesignal_id` na tabela `perfis` no Supabase:
> ```sql
> ALTER TABLE perfis ADD COLUMN IF NOT EXISTS onesignal_id text;
> ```

---

## Arquivos do projeto

| Arquivo | Linhas | Descrição |
|---|---|---|
| `index.html` | ~5.890 | CRM completo — arquivo único |
| `cadastro.html` | ~625 | Formulário público v4.0 — dispara push ao criar ordem |
| `tracking.html` | ~350 | Página pública de rastreamento para o cliente ← NOVO Sessão 5 |
| `sw.js` | ~60 | Service Worker v2.0 — integrado com OneSignal ← ATUALIZADO Sessão 5 |
| `notificar-push/index.ts` | ~90 | Edge Function Supabase — dispara push via OneSignal ← NOVO Sessão 5 |
| `CONTEXTO.md` | — | Este arquivo — anexar em toda sessão |
| `CHECKLIST.md` | — | Script de verificação de integridade |
| `manifest.json` | — | PWA manifest |

---

## Bloco Tracking — Sessão 5 — HOMOLOGADO

### tracking.html
- Página pública, sem login, mobile-first
- URL: `cacambasp-crm.vercel.app/tracking?id=CRM-0001`
- Busca ordem no Supabase pelo `crm_id`
- Aplica identidade visual do vendedor (logo, cor, nome, slogan da marca)
- Status traduzido em linguagem do cliente com barra de progresso 5 etapas
- Exibe endereço, data, tipo de serviço, tamanho da caçamba
- Botão "Falar com atendente" no WhatsApp do vendedor (`marca_tel`)
- Mapeamento de status:

| col interno | Cliente vê |
|---|---|
| contratar | ⏳ Pedido confirmado — agendando entrega |
| entrega | 🚛 Caçamba a caminho |
| pagar / faltapg | ✅ Caçamba entregue |
| baixar / inadimp | 🔄 Retirada agendada |
| concluido | 🏁 Serviço concluído |
| orcamento | 📋 Orçamento em análise |

### index.html — alterações
- Botão **📍 Tracking** adicionado na área de ações do modal de detalhe
- Função `enviarTracking(id)` — abre WhatsApp com link do tracking

---

## Bloco Push OneSignal — Sessão 5 — HOMOLOGADO

### Fluxo completo
```
cadastro.html → cria ordem → chama notificar-push (Edge Function)
                                        ↓
                              OneSignal REST API
                                        ↓
                         dispositivos dos usuários (push)
```

### sw.js v2.0
- `importScripts` do OneSignal SDK no topo
- Mantém todos os listeners anteriores (fallback)

### index.html — alterações
- Script OneSignal SDK adicionado no `<head>` (linha 397)
- `initOneSignal()` chamada no `loadApp()` após `startAutoRefresh()`
- `_renderBtnNotif()` atualizado para usar `OneSignal.Notifications.requestPermission()`
- Usuário vinculado como `external_id` via `OneSignal.login(uid)` após login

### cadastro.html — alterações
- Após criar ordem/orçamento com sucesso: dispara `fetch` para `/functions/v1/notificar-push`
- Fire-and-forget — não bloqueia a tela de sucesso

### Edge Function notificar-push
- POST com `{ tipo, crm_id, nome_cliente, bairro, usuario_id }`
- Busca perfis ativos no Supabase
- Admins recebem todas as notificações
- Operador dono da ordem também recebe
- Filtra por `onesignal_id` cadastrado
- Dispara via OneSignal REST API com `include_aliases: { external_id: [...] }`

### Deploy da Edge Function
```bash
supabase functions deploy notificar-push
```

### SQL necessário antes de usar push
```sql
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS onesignal_id text;
```

---

## Notas importantes

- `</script>` count = **3** é NORMAL no index.html (linha 14 = QRCode, linha 397 = OneSignal SDK, + principal)
- O `onesignal_id` é preenchido automaticamente pelo OneSignal via `OneSignal.login(uid)` — não precisa inserir manualmente
- O push só funciona em HTTPS (produção no Vercel) — não funciona em localhost sem flag especial

---

## Pendente — próximas sessões

| Item | Prioridade | Status |
|---|---|---|
| Bloco 7B — Detalhe de ordens por fechamento | Média | Plano fechado — pronto para desenvolver |
| Operar com pedidos reais da Uliana | Alta | Pendente |
| Bloco 8 — Cadastrar bairros Grupo FRS e Grupo Renato | Média | Aguarda CRM estável |
| Migração site para WordPress/Hostinger | Alta | Aguarda CRM estável |
| Pix dinâmico com baixa automática | Baixa | Pendente |
