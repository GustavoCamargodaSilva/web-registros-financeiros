# Levantamento — Convites no front (menu Usuário → Convites)

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `web-registros-financeiros` (UI principal) + referência a `api-registros-financeiros` / `api-envio-emails` (já existentes).
>
> **Regra:** classes, services, controllers, páginas e fluxos já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** — **sem excluir** aceite de convite (`/convites/aceitar`), login/`returnUrl`, despesas, receitas, categorias, pagadores nem a API de e-mail.

---

## 1. Objetivo

Expor no front a funcionalidade **já existente na API** de **convidar alguém para o ambiente** de despesas/receitas (membro `EDITOR`), com:

| Requisito | Descrição |
|-----------|-----------|
| Menu | Novo grupo **Usuário** no menu esquerdo, subitem **Convites** |
| Página | Tela autenticada para o **dono** enviar convite por e-mail |
| E-mail | Continua sendo enviado pela cadeia `api-registros` → `api-envio-emails` (tag `CONVITE_EDICAO_DESPESAS`) |
| Aceite | Fluxo do convidado **já implementado** — não refazer |
| Escopo | Levantamento + tasks; **sem implementação** nesta fase |

---

## 2. Situação atual (baseline)

### 2.1 API registros — convite (já pronto para enviar)

| Método | Path | Quem | Resultado |
|--------|------|------|-----------|
| `POST` | `/api/v1/convites/edicao-despesas` | Só **DONO** do ambiente ativo | Cria convite `PENDENTE`, envia e-mail, `202` |
| `POST` | `/api/v1/convites/{token}/aceitar` | Usuário logado com o **mesmo e-mail** | Vira membro `EDITOR` |

**Body do convidar:**

```json
{
  "tag": "CONVITE_EDICAO_DESPESAS",
  "to": ["pessoa@email.com"]
}
```

**Resposta (202):** `status`, `emailConvidado`, `tag`, `token`, `ambienteId`  
→ **Não exibir `token` na UI** (só uso interno/aceite por link).

**Regras relevantes:**

| Regra | Comportamento |
|-------|---------------|
| Ambiente | Header `X-Ambiente-Id` (já usado no front) ou fallback ambiente do DONO |
| Papel concedido | Sempre `EDITOR` |
| Self-invite | Bloqueado |
| TTL | `app.convite.ttl-dias` (default **7**) |
| Tag inválida | `400` |
| Não-dono | `403` |
| Falha no e-mail | `502` (+ rollback da transação) |

**Status no domínio:** `PENDENTE` \| `ACEITO` \| `EXPIRADO` \| `CANCELADO`  
→ `CANCELADO` e listagem de pendentes **existem no modelo**, mas **não há endpoint** de listar/cancelar hoje.

**Relacionado:**

| Método | Path | Uso |
|--------|------|-----|
| `GET` | `/api/v1/ambientes` | Lista ambientes do usuário com `id`, `nome`, **`papel`** |
| `GET` | `/api/v1/ambientes/ativo/membros` | Membros: `usuarioId`, `nome`, `papel` |

### 2.2 API e-mails (já pronta)

`api-registros` chama `POST /v1/emails/send-by-tag` com:

| Variable | Conteúdo |
|----------|----------|
| `nomeUsuarioLogado` | Nome de quem convida |
| `emailConvidado` | Destinatário |
| `linkAceite` | `{aceiteBaseUrl}?token=...` (default front `5174/convites/aceitar`) |

Template: `CONVITE_EDICAO_DESPESAS` / assunto “Convite para editar despesas financeiras”.

### 2.3 Front — o que já existe

| Item | Estado |
|------|--------|
| Aceite | `AceitarConvitePage` + rota `/convites/aceitar?token=` |
| Client | `convites.api.ts` → **só** `aceitar(token)` |
| Login/`returnUrl` | Já redireciona de volta ao aceite |
| Membros | `ambientesApi.listarMembrosAtivo()` usado em formulários — **sem** tela de gestão |
| `GET /ambientes` no client | **Não** está no `ambientes.api.ts` atual |
| Menu | Só **Despesas** e **Receitas** (grupos expansíveis) |
| Página de enviar convite | **Não existe** |

> Nota: o doc antigo `levantamento-aceite-convite-front.md` descrevia o aceite como futuro — **hoje o aceite já está implementado**. Este levantamento cobre a **gestão/envio** no app logado.

---

## 3. UX desejada (MVP)

### 3.1 Menu lateral

Mesmo padrão expansível (clique na linha do grupo):

```text
Usuário
  └── Convites     →  /convites
```

| Detalhe | Sugestão |
|---------|----------|
| Ícone do grupo | Reutilizar `IconUsers` ou criar `IconUser` |
| Ícone do subitem | Lista / envelope (novo se necessário) |
| Ordem | Após Receitas (ou no final do menu) |

### 3.2 Página `/convites` (autenticada, dentro do shell)

| Bloco | Conteúdo MVP |
|-------|----------------|
| Form “Convidar” | Campo **e-mail** + botão Enviar |
| Chamada | `POST /convites/edicao-despesas` com `tag` fixa + `to: [email]` |
| Sucesso | Toast (ex.: “Convite enviado para …”) — **sem** mostrar token |
| Erros | Mapear `400` / `403` / `502` com mensagens claras |
| Membros atuais | Lista via `GET .../ativo/membros` (nome + papel) — contexto do ambiente |
| Restrição | Só **DONO** envia; EDITOR vê aviso ou formulário desabilitado (ver D2) |

### 3.3 Fora do MVP (fase 2 — dependem de API nova)

| Item | Motivo |
|------|--------|
| Listar convites pendentes | Endpoint ainda não existe |
| Cancelar convite | Status `CANCELADO` sem writer/endpoint |
| Convidar múltiplos e-mails de uma vez | API aceita `to[]`, mas persiste só o 1º e-mail com um token — inconsistente |
| Escolher papel LEITOR | API sempre concede `EDITOR` |
| Tela “Membros” separada / remover membro | Não pedido |

---

## 4. Arquivos relevantes (não excluir)

### Front — estender / criar

| Path | Papel |
|------|-------|
| `src/components/layout/Sidebar.tsx` | Grupo **Usuário** + subitem **Convites** |
| `src/components/layout/NavIcons.tsx` | Ícone(s) se faltar |
| `src/App.tsx` | Rota protegida `/convites` |
| `src/pages/ConvitesPage.tsx` | **Nova** — form + membros |
| `src/api/convites.api.ts` | + `convidar({ tag, to })` |
| `src/types/convite.types.ts` | Types de request/response do convidar |
| `src/api/ambientes.api.ts` | + `listar()` → `GET /ambientes` (papel no ambiente) |

### Já existem — **não reescrever**

| Path | Motivo |
|------|--------|
| `AceitarConvitePage.tsx` | Aceite ok |
| Fluxo `returnUrl` / login / registro | Intactos |
| `ConvidarEdicaoDespesasService` / `api-envio-emails` | Intactos no MVP de UI |
| Despesas / Receitas / Categorias / Pagadores | Intactos |

### API — só se aprovarem fase 2

| Path | Papel |
|------|-------|
| `ConvitesController` + services | `GET` pendentes / cancelar |
| `ConviteRepository` | Já tem `existsByAmbienteIdAndEmailConvidadoAndStatus` (duplicata) — opcional reforçar no convidar |

---

## 5. Decisões abertas (para aprovação)

| # | Pergunta | Opção recomendada |
|---|----------|-------------------|
| D1 | MVP = só enviar + ver membros (sem listar/cancelar)? | **Sim** — API já cobre o envio |
| D2 | Como restringir ao DONO? | Front: descobrir papel via `GET /ambientes` + `ambienteId` ativo; desabilitar form se não for DONO. API continua com `403` |
| D3 | Rota da página | `/convites` (gestão); aceite permanece `/convites/aceitar` |
| D4 | Label do grupo | **Usuário** (pedido) — ou “Conta” / “Ambiente” se preferirem |
| D5 | Bloquear duplicata `PENDENTE` no back? | **Sim**, task API pequena opcional (método já no repo) |
| D6 | Fase 2 listar/cancelar no mesmo PR? | **Não** — outro levantamento/task após MVP |

---

## 6. Tasks (baixa complexidade) — após aprovação

### Menu e rota

1. **Sidebar** — grupo `Usuário` + child `Convites` → `/convites`.  
2. **Ícones** — reutilizar/criar ícone do grupo e do subitem.  
3. **App.tsx** — rota protegida `/convites` → `ConvitesPage` (pode começar stub).

### Client / types

4. **Types** — `ConviteEdicaoRequest` / `ConviteEdicaoResponse` (sem precisar tipar `token` na UI além do type).  
5. **`convitesApi.convidar`**.  
6. **`ambientesApi.listar`** + type `Ambiente` (`id`, `nome`, `papel`).

### Página Convites

7. **Form** — e-mail + submit; `tag` constante `CONVITE_EDICAO_DESPESAS`; `to: [email.trim()]`.  
8. **Feedback** — success/error via `useApiFeedback` (403 não-dono, 502 e-mail, 400 validação).  
9. **Membros** — card/lista com `listarMembrosAtivo` (primeiro nome + papel).  
10. **Gate DONO** — resolver papel do ambiente ativo; esconder/desabilitar envio se `EDITOR`/`LEITOR`.

### Opcional (API, se D5)

11. **Duplicata** — em `ConvidarEdicaoDespesasService`, rejeitar se já existir `PENDENTE` para o mesmo e-mail/ambiente.

### Validação manual

12. **Checklist**  
    - DONO envia → e-mail chega → link abre `/convites/aceitar` → membro aparece.  
    - EDITOR não consegue convidar (UI e/ou 403).  
    - Self-invite e e-mail inválido tratados.  
    - Menu Despesas/Receitas e aceite intactos.  
    - `api-envio-emails` e registros no ar (senão 502).

---

## 7. Riscos / cuidados

| Risco | Mitigação |
|-------|-----------|
| Confundir gestão (`/convites`) com aceite (`/convites/aceitar`) | Rotas e títulos distintos |
| Exibir token na tela | Nunca renderizar `token` da response |
| API e-mail fora do ar | Mensagem clara no 502; doc de run local |
| EDITOR vê botão e toma 403 | Gate por papel (D2) |
| `to[]` com vários e-mails | MVP: **um** e-mail por envio |
| Doc antigo de aceite desatualizado | Este doc é a referência para **envio**; aceite já feito |

---

## 8. Critérios de pronto

- [ ] Menu **Usuário → Convites** visível e navegável  
- [ ] DONO consegue enviar convite por e-mail pelo front  
- [ ] E-mail/link de aceite continua funcionando como hoje  
- [ ] Membros do ambiente ativo visíveis na página (MVP)  
- [ ] Cadastro financeiro e aceite existentes intactos  
- [ ] Sem implementação de listar/cancelar sem aprovação (D6)

---

## 9. Próximo passo

Aprovar **D1–D6** e autorizar início pela **Task 1** (menu Usuário → Convites + rota stub).
