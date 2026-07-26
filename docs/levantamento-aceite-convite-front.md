# Levantamento — Aceite de convite no front (`web-registros-financeiros`)

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Regra:** páginas, componentes, auth, API clients e rotas já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** — nova rota/página de aceite, client de convites e suporte a `returnUrl` — sem remover login, registro nem módulos financeiros.

---

## 1. Objetivo

Fazer o link do e-mail de convite funcionar de ponta a ponta no front:

```text
http://localhost:5174/convites/aceitar?token=<token>
```

| Requisito | Descrição |
|-----------|-----------|
| Quem usa o link | A pessoa que **recebeu o e-mail** |
| Cadastro | Com o **mesmo e-mail** do convite (se ainda não tiver conta) |
| Aceite | Após login/registro, chamar a API e virar membro (`EDITOR`) do ambiente |
| Escopo desta fase | Apenas levantamento e tasks; **sem implementação** |

---

## 2. Situação atual (baseline)

### 2.1 Front (`web-registros-financeiros`)

| Item | Estado |
|------|--------|
| Stack | React 19 + Vite + TypeScript + `react-router-dom` 7 |
| Rotas públicas | `/login`, `/registro` |
| Rotas protegidas | `/despesas`, `/receitas`, `/categorias`, `/pagadores` |
| Rota `/convites/aceitar` | **Não existe** |
| Token JWT | Memória + `sessionStorage` (`tokenStorage.ts`) |
| Proxy | Vite `/api` → `http://localhost:8090` |
| `returnUrl` após login | **Não existe** — `ProtectedRoute` manda só para `/login` |

### 2.2 API (`api-registros-financeiros`) — já pronta

| Endpoint | Auth | Função |
|----------|------|--------|
| `POST /api/v1/auth/registro` | Público | Cria usuário + ambiente próprio |
| `POST /api/v1/auth/login` | Público | Access token |
| `POST /api/v1/convites/{token}/aceitar` | Bearer | Aceita convite → membro `EDITOR` |
| `GET /api/v1/ambientes` | Bearer | Lista ambientes (pós-aceite) |

Regras do aceite na API (já implementadas):

- Token válido, status `PENDENTE`, não expirado
- E-mail do usuário logado **==** e-mail do convite
- Cria `MembroAmbiente` com papel `EDITOR`

### 2.3 E-mail

O link gerado aponta para `app.convite.aceite-base-url` (default `http://localhost:5174/convites/aceitar?token=...`).

---

## 3. Fluxo desejado (UX)

```
Convidado abre o link do e-mail
        │
        ▼
 /convites/aceitar?token=xxx
        │
        ├─ token ausente/ inválido na URL → mensagem de erro
        │
        ├─ NÃO autenticado
        │     → tela intermedia: "Entrar" ou "Criar conta"
        │     → /login?returnUrl=...  ou  /registro?returnUrl=...
        │     → após sucesso, volta para /convites/aceitar?token=xxx
        │
        └─ Autenticado
              → POST /api/v1/convites/{token}/aceitar
              → sucesso → mensagem + ir para /despesas
                 (e, se possível, lembrar ambiente aceito)
              → erro (e-mail diferente, expirado, etc.) → mensagem clara
```

### 3.1 Papéis no fluxo

| Papel | Ação |
|-------|------|
| Dono | Já enviou o convite (fluxo da API; fora deste levantamento de UI) |
| Convidado | Abre link → cadastra/loga com o e-mail convidado → aceita |

### 3.2 O que o cadastro **não** faz sozinho

`POST /registro` **não** aceita o convite automaticamente.  
Só cria a conta + ambiente pessoal. O vínculo com o ambiente do dono acontece **apenas** no `POST .../aceitar`.

---

## 4. Contrato com a API (consumo pelo front)

### 4.1 Aceitar

```http
POST /api/v1/convites/{token}/aceitar
Authorization: Bearer <accessToken>
```

Resposta sucesso (`200`):

```json
{
  "status": "accepted",
  "ambienteId": 1,
  "ambienteNome": "Meu ambiente",
  "papel": "EDITOR"
}
```

Erros típicos (`400` / `401`):

| Situação | Mensagem esperada (API) |
|----------|-------------------------|
| Token inválido | Convite não encontrado |
| Expirado | Convite expirado |
| Já aceito | Convite já foi aceito |
| E-mail diferente | O e-mail da conta logada não corresponde ao e-mail convidado |
| Sem login | 401 |

### 4.2 Registro / login (já usados)

Sem alteração de contrato. Apenas o front deve preservar `returnUrl` / `token` ao redirecionar.

---

## 5. Proposta de telas e rotas (aditivas)

### 5.1 Nova rota

| Path | Tipo | Componente |
|------|------|------------|
| `/convites/aceitar` | Pública | `AceitarConvitePage` |

Query: `?token=<string>`

### 5.2 Estados da página

| Estado | UI |
|--------|-----|
| Sem `token` | Erro: “Link de convite inválido” |
| Carregando aceite | Spinner / “Aceitando convite…” |
| Não autenticado | CTAs: “Já tenho conta” → login; “Criar conta” → registro (com returnUrl) |
| Sucesso | “Você entrou no ambiente X como EDITOR” + botão “Ir para despesas” |
| Erro API | Mensagem amigável + opção de tentar de novo / trocar conta |

### 5.3 Extensão de login/registro (aditiva)

| Arquivo | Mudança |
|---------|---------|
| `ProtectedRoute` | Opcional: se no futuro a rota de aceite for protegida; neste plano a página é pública |
| `LoginPage` | Ler `returnUrl` (query) e redirecionar após login |
| `RegistroPage` | Idem após registro+login automático |
| Links na `AceitarConvitePage` | Passar `returnUrl=/convites/aceitar?token=...` (URL-encoded) |

---

## 6. Arquivos sugeridos (sem apagar os atuais)

| Artefato | Path |
|----------|------|
| Página | `src/pages/AceitarConvitePage.tsx` |
| Estilos | Reusar `src/pages/auth.module.css` (+ classes mínimas se precisar) |
| API client | `src/api/convites.api.ts` |
| Types | `src/types/convite.types.ts` |
| Rota | `src/App.tsx` — adicionar rota pública |
| Login / Registro | Estender redirect com `returnUrl` |
| (Opcional MVP+) | Persistir `ambienteId` ativo em `sessionStorage` / context |

**Não alterar** neste escopo (salvo tasks explícitas): páginas de despesas/receitas/categorias/pagadores, layout, proxy Vite, fluxo de e-mail na API Go.

---

## 7. Ambiente ativo após aceite (decisão)

Após aceitar, o convidado precisa ver os dados do ambiente do dono. Hoje a API usa header `X-Ambiente-Id`.

| Opção | Descrição | MVP? |
|-------|-----------|------|
| A | Após aceite, salvar `ambienteId` e enviar `X-Ambiente-Id` no `api/client.ts` | Recomendado |
| B | Só redirecionar para `/despesas` sem trocar ambiente (vê o ambiente próprio vazio) | Insuficiente |
| C | Seletor de ambientes na UI | Pode ser fase seguinte |

**Sugestão deste levantamento:** Opção A no MVP (mínimo: guardar ambiente aceito e header no client); seletor completo depois.

---

## 8. Decisões pendentes

| # | Pergunta | Sugestão |
|---|----------|----------|
| 1 | Página de aceite pública ou protegida? | **Pública**, com CTAs de login/registro |
| 2 | Prefill do e-mail no registro? | Ideal, mas API não expõe e-mail do token sem auth — **não no MVP** (usuário digita o e-mail do convite) |
| 3 | Após aceite, ir para onde? | `/despesas` com ambiente do convite ativo |
| 4 | Se já autenticado com outro e-mail? | Mostrar erro + “Sair e entrar com o e-mail do convite” |
| 5 | Endpoint GET público para validar token (preview)? | Fora do MVP — aceite direto resolve |

---

## 9. Tasks de baixa complexidade

> Nenhuma task abaixo deve ser executada nesta fase de refinamento.

### Fase 0 — Fechamento

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T0.1 | Confirmar decisões §8 | Baixa | — | Decisões registradas |
| T0.2 | Confirmar URL do link (`5174` em dev) alinhada com `app.convite.aceite-base-url` | Baixa | — | Config ok |

### Fase 1 — Client API e types

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T1.1 | Criar `src/types/convite.types.ts` (response aceite) | Baixa | — | Types |
| T1.2 | Criar `src/api/convites.api.ts` → `aceitar(token)` | Baixa | T1.1 | Client |
| T1.3 | **Não alterar** `auth.api.ts` / módulos financeiros | — | — | Regra |

### Fase 2 — `returnUrl` no login/registro

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T2.1 | Util para ler/validar `returnUrl` (só paths internos) | Baixa | — | Helper seguro |
| T2.2 | `LoginPage`: após login, navegar para `returnUrl` se houver | Baixa | T2.1 | Redirect |
| T2.3 | `RegistroPage`: idem após registro+login | Baixa | T2.1 | Redirect |
| T2.4 | Manter redirect default `/despesas` se sem `returnUrl` | Baixa | T2.2, T2.3 | Compatível |

### Fase 3 — Página `/convites/aceitar`

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T3.1 | Criar `AceitarConvitePage` (ler `token` via `useSearchParams`) | Baixa | — | Página |
| T3.2 | Estado sem token → mensagem de erro | Baixa | T3.1 | UX |
| T3.3 | Estado não autenticado → CTAs login/registro com `returnUrl` | Baixa | T2.1, T3.1 | UX |
| T3.4 | Estado autenticado → chamar `convitesApi.aceitar` | Baixa | T1.2, T3.1 | Integração |
| T3.5 | Tratar sucesso / erros da API na UI | Baixa | T3.4 | Mensagens |
| T3.6 | Registrar rota pública em `App.tsx` | Baixa | T3.1 | Rota |

### Fase 4 — Ambiente ativo (mínimo)

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T4.1 | Storage simples do `ambienteId` ativo (`sessionStorage`) | Baixa | T0.1 | Persistência |
| T4.2 | Em `api/client.ts`, enviar header `X-Ambiente-Id` se houver | Baixa | T4.1 | Header |
| T4.3 | Após aceite com sucesso, setar `ambienteId` da resposta | Baixa | T3.4, T4.1 | Contexto |
| T4.4 | **Não** implementar seletor completo de ambientes nesta fase | — | — | Escopo |

### Fase 5 — Qualidade / verificação

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T5.1 | Fluxo manual: e-mail → link → registro → aceite → ver dados do dono | Baixa | T3–T4 | OK E2E |
| T5.2 | Fluxo: já logado com e-mail certo → abre link → aceita | Baixa | T3.4 | OK |
| T5.3 | Fluxo: logado com e-mail errado → erro claro | Baixa | T3.5 | OK |
| T5.4 | Atualizar `postman-ambiente-convites.md` com nota do front | Baixa | T3.6 | Docs |
| T5.5 | Teste unitário leve do helper `returnUrl` (opcional) | Baixa | T2.1 | Teste |

### Fase 6 — Depois do MVP (fora deste PR)

| ID | Task | Complexidade | Nota |
|----|------|--------------|------|
| T6.1 | Prefill de e-mail (exigiria endpoint público de preview do convite) | Média | API |
| T6.2 | Seletor de ambientes na UI | Média | UX |
| T6.3 | Tela do dono para enviar convite pelo front | Média | Novo form |

---

## 10. Cenários de teste (quando implementar)

| ID | Caso | Esperado |
|----|------|----------|
| C1 | Abrir `/convites/aceitar` sem token | Mensagem de link inválido |
| C2 | Abrir com token, sem login | CTAs Entrar / Criar conta |
| C3 | Criar conta com e-mail do convite → volta e aceita | Sucesso + membro |
| C4 | Login com e-mail do convite → aceita | Sucesso |
| C5 | Login com outro e-mail → aceita | Erro da API exibido |
| C6 | Token expirado / inválido | Erro amigável |
| C7 | Após aceite, listar categorias do ambiente do dono | Vê dados (via `X-Ambiente-Id`) |
| C8 | Login/registro sem `returnUrl` | Continuam indo para `/despesas` |

---

## 11. Fora de escopo (esta fase)

- Implementação de qualquer task T0–T6
- Remover/refatorar páginas financeiras existentes
- Alterar API de e-mail Go (salvo config de URL, se necessário)
- UI para o dono enviar convite pelo front
- GET público de detalhes do convite

---

## 12. Critérios de pronto do MVP

1. Link do e-mail abre `/convites/aceitar?token=...` no front  
2. Convidado consegue cadastrar ou logar e voltar para o aceite  
3. `POST /convites/{token}/aceitar` é chamado com Bearer  
4. Sucesso mostra ambiente + papel e leva ao app  
5. Erros da API são compreensíveis  
6. Após aceite, requests usam o `ambienteId` do convite (`X-Ambiente-Id`)  
7. Fluxos de login/registro existentes continuam funcionando sem `returnUrl`  

---

## 13. Ordem sugerida de entrega

| PR | Conteúdo |
|----|----------|
| PR1 | Fase 1 (client) + Fase 2 (`returnUrl`) |
| PR2 | Fase 3 (página + rota) |
| PR3 | Fase 4 (ambiente ativo mínimo) + Fase 5 (docs/teste manual) |

---

## 14. Referências

| Item | Path |
|------|------|
| Front rotas | `web-registros-financeiros/src/App.tsx` |
| Auth | `src/context/AuthContext.tsx`, `src/pages/LoginPage.tsx`, `src/pages/RegistroPage.tsx` |
| Client HTTP | `src/api/client.ts` |
| Aceite API | `AceitarConviteService`, `ConvitesController` |
| Guia Postman API | `api-registros-financeiros/docs/postman-ambiente-convites.md` |
| Ambiente Opção 2 | `api-registros-financeiros/docs/levantamento-ambiente-opcao-2.md` |

---

## 15. Próximo passo sugerido

1. Fechar decisões da **§8**.  
2. Aprovar este plano.  
3. Só então autorizar **PR1** (client + `returnUrl`).

**Status atual:** levantamento concluído — **implementação não iniciada**.
