# Deploy — CRM CaçambaSP (crm-cacambasp)

Este documento explica como publicar alterações neste repositório com segurança,
evitando perda de commits quando várias sessões/pessoas trabalham no projeto
ao mesmo tempo.

## Como funciona o deploy

- **Branch:** `main` (única branch usada em produção)
- **Deploy automático:** o Vercel faz redeploy sozinho a cada push no `main`
  (projeto `cacambasp-crm`, time `cacambasp-5439's projects`)
- **Não é preciso mexer no Vercel manualmente** — só dar push no `main`

## ⚠️ Regra mais importante: NUNCA subir sem antes atualizar

Antes de aplicar qualquer patch, editar ou commitar `index.html` ou
`mobile2.html` usando **git local** (clone na sua máquina, Claude Code, etc.):

```bash
git pull origin main
```

**Por quê:** vários agentes/pessoas podem estar trabalhando neste repo em
paralelo (sessões diferentes de Claude, desenvolvedores, etc). Se o `main`
remoto tiver avançado desde a última vez que você clonou/atualizou, um
`git push` normal será **recusado** ("non-fast-forward" / "não pode subir").
Isso é o Git te protegendo de sobrescrever o trabalho de outra pessoa por
cima sem querer.

### O que fazer quando o push for recusado

1. Rode `git pull origin main` (ou `git fetch` + `git rebase origin/main`)
2. Se der conflito, resolva manualmente olhando as duas versões
3. Só então dê `git push` de novo

### ❌ NUNCA fazer isto sem confirmar antes com o Douglas

```bash
git push --force
```

Isso **apaga** os commits que estavam no remoto e que seu clone local não
tinha — pode literalmente sumir com correções feitas por outra sessão,
mesmo que já estivessem em produção. Se realmente for necessário forçar
(ex: reverter algo), pare e confirme com o Douglas antes.

## Fluxo alternativo: deploy via API do GitHub (usado pelo Claude/assistente)

Quando o deploy é feito diretamente pela API do GitHub (em vez de git local),
esse problema de "não pode subir" **não acontece**, porque o fluxo sempre
busca a versão (SHA) mais recente do arquivo antes de editar:

1. `GET /repos/CacambaSP/crm-cacambasp/contents/{arquivo}?ref=main` → pega
   conteúdo atual + SHA (para arquivos grandes como `index.html`, usar a rota
   de blob: `/git/trees/main?recursive=1` → achar o SHA → `/git/blobs/{sha}`)
2. Editar o conteúdo localmente
3. Validar a sintaxe do JavaScript antes de publicar (extrair os blocos
   `<script>` e rodar `node -c`)
4. `PUT /repos/CacambaSP/crm-cacambasp/contents/{arquivo}` com o conteúdo
   novo em base64 + o SHA obtido no passo 1 (isso garante que só publica se
   ninguém mudou o arquivo nesse meio tempo — equivalente ao "pull antes de
   push" do git local)
5. Aguardar ~25s e confirmar o deploy como `READY` no Vercel

## Checklist rápido antes de qualquer deploy

- [ ] Atualizei minha cópia local (`git pull` ou peguei o SHA mais recente via API)?
- [ ] Validei a sintaxe do JavaScript antes de publicar?
- [ ] Expliquei em português simples o que vai mudar e o que isso afeta,
      antes de aplicar em produção?
- [ ] Confirmei o deploy como `READY` no Vercel depois de publicar?
