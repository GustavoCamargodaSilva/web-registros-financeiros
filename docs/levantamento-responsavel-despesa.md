# Levantamento — Responsável da despesa (+ despesas conjuntas)

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `api-registros-financeiros` (domínio/API) + `web-registros-financeiros` (UI).
>
> **Regra:** classes, services, controllers, páginas e APIs já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** (novos campos, enums, endpoint de membros, coluna/select no form) — **sem excluir** auth, convites, categorias, receitas, FIXO/VARIAVEL nem o fluxo atual de parcelas.

---

## 1. Objetivo

Com vários membros no mesmo ambiente cadastrando despesas, é necessário saber **de quem é** cada despesa.

| Requisito | Descrição |
|-----------|-----------|
| Campo **Responsável** | Identifica o dono/responsável da despesa (membro do ambiente) |
| Despesas **conjuntas** | Marcar despesas do “casal/ambiente” (não de um único membro) |
| Visibilidade | Listagem e cadastro no front mostram o responsável (ou “Conjunta”) |
| Escopo | Levantamento + tasks; **sem implementação** nesta fase |

---

## 2. Situação atual (baseline)

### 2.1 API — `DespesaEntity`

| Campo | Papel hoje |
|-------|------------|
| `usuario` | Preenchido no create com o **usuário logado** (criador / auditoria) — **não é exposto** no response |
| `ambiente` | Ambiente ativo (`X-Ambiente-Id`) |
| `tipoDespesa` | Apenas `FIXO` \| `VARIAVEL` (recorrência/parcelas) |

Não existem: `responsavel`, flag/enum `CONJUNTA`, nem response com nome de quem “é dono” da despesa.

### 2.2 Contratos atuais

**POST** `/api/v1/despesas` — body (`DespesaDTO`):

`descricao`, `valor`, `vencimento`, `tipoDespesa`, `pago`, `categoriaId`, `quantidadeParcelas?`

**GET** `/api/v1/despesas?ano=&mes=` — response (`DespesaResponseDTO`):

campos financeiros + parcela; **sem** `usuarioId` / responsável.

Listagem filtra por `ambienteId` + competência (todos os membros veem todas as despesas do ambiente).

### 2.3 Front

| Tela | Estado |
|------|--------|
| Form nova despesa | Sem select de responsável |
| Tabela | Sem coluna responsável |
| Types / API client | Sem campos de responsável |

### 2.4 Lacuna de dados para o select

Existe `GET /api/v1/ambientes` (ambientes do usuário), mas **não há** endpoint para listar **membros** do ambiente ativo (id + nome) — necessário para o select “Responsável”.

### 2.5 Schema

`ddl-auto: create-drop` em desenvolvimento: campos novos na entity entram no recreate; em produção futura será preciso migration (fora do MVP local).

---

## 3. Conceitos (separar dimensões)

Hoje `TipoDespesa` = natureza de **parcelamento**. Não deve absorver “conjunta”.

| Dimensão | Valores | Significado |
|----------|---------|-------------|
| **Tipo (já existe)** | `FIXO`, `VARIAVEL` | Como a despesa se comporta no tempo / parcelas |
| **Escopo / propriedade (novo)** | `INDIVIDUAL`, `CONJUNTA` | De quem é a conta |
| **Responsável (novo)** | FK → usuário membro | Quem é o dono quando for individual |
| **Criador (já existe como `usuario`)** | Usuário logado no create | Quem registrou (auditoria) — pode ser ≠ responsável |

Exemplo: Ana registra uma despesa cujo responsável é Bruno → `usuario` = Ana, `responsavel` = Bruno, `escopo` = `INDIVIDUAL`.  
Despesa do casal → `escopo` = `CONJUNTA`, responsável nulo ou rótulo fixo “Conjunta”.

---

## 4. Opções de modelagem

| Opção | Ideia | Prós | Contras |
|-------|-------|------|---------|
| **A (recomendada)** | `escopo` (`INDIVIDUAL`/`CONJUNTA`) + `responsavel` (FK `Usuario`, nullable) | Separado de FIXO/VARIAVEL; valida membro do ambiente; criador permanece | Precisa endpoint de membros |
| B | FK para `MembroAmbiente` | Garante vínculo ambiente+user | Membership frágil se membro sair |
| C | Só acrescentar `CONJUNTA` em `TipoDespesa` | Rápido | Mistura dimensões; conflita com parcelas; não responde “quem” |
| D | Rateio N:N com % | Divisão real | Overkill se conjunta = só marcação |

**Sugestão deste levantamento: Opção A.**

### 4.1 Regras de negócio sugeridas (MVP)

| Regra | Detalhe |
|-------|---------|
| Default no create | `escopo = INDIVIDUAL`, `responsavel = usuário logado` (se omitido) |
| Individual | `responsavelUsuarioId` **obrigatório** e deve ser **membro** do ambiente ativo |
| Conjunta | `responsavel` **null**; UI mostra “Conjunta” |
| Parcelas | Todas as parcelas do grupo herdam o mesmo `escopo` + `responsavel` |
| Criador | Continua em `usuario` (não remover) |
| Edição / exclusão | Fora do MVP (não existem hoje na UI) |

---

## 5. Contratos propostos (API)

### 5.1 Create — campos novos em `DespesaDTO`

```json
{
  "descricao": "Mercado",
  "valor": 200.00,
  "vencimento": "2026-07-20",
  "tipoDespesa": "FIXO",
  "pago": false,
  "categoriaId": 1,
  "escopo": "INDIVIDUAL",
  "responsavelUsuarioId": 2
}
```

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| `escopo` | Sim (ou default server-side `INDIVIDUAL`) | Enum `INDIVIDUAL` \| `CONJUNTA` |
| `responsavelUsuarioId` | Se `INDIVIDUAL` | Long; validar membro do ambiente |

Conjunta:

```json
{
  "escopo": "CONJUNTA",
  "responsavelUsuarioId": null
}
```

### 5.2 Response — campos novos em `DespesaResponseDTO`

```json
{
  "id": 10,
  "descricao": "Mercado",
  "escopo": "INDIVIDUAL",
  "responsavelUsuarioId": 2,
  "responsavelNome": "Bruno",
  "...": "demais campos atuais"
}
```

Conjunta: `responsavelUsuarioId: null`, `responsavelNome: null` (front exibe “Conjunta”).

### 5.3 Novo endpoint — membros do ambiente

```http
GET /api/v1/ambientes/{ambienteId}/membros
Authorization: Bearer …
```

Ou, alinhado ao header atual:

```http
GET /api/v1/ambientes/ativos/membros
X-Ambiente-Id: …
```

Resposta sugerida:

```json
[
  { "usuarioId": 1, "nome": "Ana", "papel": "DONO" },
  { "usuarioId": 2, "nome": "Bruno", "papel": "EDITOR" }
]
```

Regra: só membros do ambiente ativo (ou do `ambienteId` se o caller for membro).

---

## 6. Front (`web-registros-financeiros`)

### 6.1 Form “Nova despesa”

| Campo UI | Comportamento |
|----------|----------------|
| **Escopo** (select) | Individual / Conjunta |
| **Responsável** (select) | Lista de membros; habilitado só se Individual; default = usuário logado |
| Demais campos | Permanecem (descrição, valor, vencimento, tipo FIXO/VARIAVEL, pago, categoria) |

### 6.2 Tabela

Nova coluna **Responsável**: nome do membro ou badge/texto “Conjunta”.

### 6.3 Arquivos (aditivos)

| Arquivo | Mudança |
|---------|---------|
| `src/types/despesa.types.ts` | `escopo`, `responsavelUsuarioId`, `responsavelNome` |
| `src/types/membro.types.ts` (novo) | Tipo do membro |
| `src/api/ambientes.api.ts` ou `membros.api.ts` (novo) | Listar membros |
| `src/pages/DespesasPage.tsx` | Select escopo/responsável + coluna |
| `src/context/AuthContext` / `me` | Já tem `usuario.id` para default do select |

**Não alterar** neste escopo: receitas, categorias, pagadores, aceite de convite (salvo reutilizar `X-Ambiente-Id`).

---

## 7. Decisões pendentes

| # | Pergunta | Sugestão |
|---|----------|----------|
| 1 | Opção A (escopo + responsável)? | **Sim** |
| 2 | Conjunta permite informar responsável mesmo assim? | **Não** no MVP — responsável null |
| 3 | Default responsável = logado? | **Sim** |
| 4 | Pode escolher outro membro como responsável? | **Sim** (desde que membro do ambiente) |
| 5 | Expor também o criador (`usuario`) na listagem? | Opcional / fase 2 |
| 6 | Path do endpoint de membros | Preferir `GET /api/v1/ambientes/ativo/membros` + `X-Ambiente-Id` |
| 7 | Backfill despesas antigas (H2 recreate) | Dev: recreate; prod futura: default `INDIVIDUAL` + responsável = criador |

---

## 8. Tasks de baixa complexidade

> Nenhuma task abaixo deve ser executada nesta fase de levantamento.

### Fase 0 — Fechamento

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T0.1 | Confirmar decisões §7 | Baixa | — | Decisões |
| T0.2 | Confirmar labels UI (“Responsável”, “Conjunta”, “Individual”) | Baixa | — | Copy |

### Fase 1 — Domínio API (modelo)

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T1.1 | Criar enum `EscopoDespesa` (`INDIVIDUAL`, `CONJUNTA`) | Baixa | T0.1 | Enum |
| T1.2 | Em `DespesaEntity`: campo `escopo` + FK `responsavel` (`UsuarioEntity`, nullable) | Baixa | T1.1 | Entity |
| T1.3 | Manter `usuario` (criador) sem remover | — | — | Regra |
| T1.4 | **Não** alterar significado de `TipoDespesa` FIXO/VARIAVEL | — | — | Regra |

### Fase 2 — DTOs + validação + create/list

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T2.1 | Estender `DespesaDTO` com `escopo` e `responsavelUsuarioId` | Baixa | T1.1 | Request |
| T2.2 | Validação: Individual ⇒ responsável obrigatório; Conjunta ⇒ responsável null | Baixa | T2.1 | Bean validation / service |
| T2.3 | Resolver responsável: default logado; validar `exists` em `MembroAmbiente` do ambiente ativo | Baixa | T2.2 | Service helper |
| T2.4 | Em `CadastrarDespesaService` / parcelas: setar `escopo` + `responsavel` em todas as parcelas | Baixa | T2.3 | Persistência |
| T2.5 | Estender `DespesaResponseDTO` + mapper com id/nome do responsável e escopo | Baixa | T1.2 | Response |
| T2.6 | Exception clara se responsável não for membro | Baixa | T2.3 | 400 |
| T2.7 | Testes de integração: individual default, conjunta, responsável inválido | Baixa | T2.4–T2.6 | Testes |

### Fase 3 — Endpoint de membros

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T3.1 | DTO `MembroAmbienteResponseDTO` (`usuarioId`, `nome`, `papel`) | Baixa | — | DTO |
| T3.2 | `ListarMembrosAmbienteService` (ambiente ativo ou path id) | Baixa | T3.1 | Service |
| T3.3 | Endpoint GET membros (controller) + segurança (só membro do ambiente) | Baixa | T3.2 | API |
| T3.4 | Teste: membro lista; não-membro 403 | Baixa | T3.3 | Teste |

### Fase 4 — Front types + API client

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T4.1 | Atualizar `despesa.types.ts` (escopo, responsável) | Baixa | T2.5 | Types |
| T4.2 | Criar types + `membros.api.ts` / `ambientes.api.ts` | Baixa | T3.3 | Client |
| T4.3 | **Não** quebrar campos existentes do `DespesaRequest` | — | — | Regra |

### Fase 5 — Front UI Despesas

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T5.1 | Carregar membros ao abrir form de cadastro | Baixa | T4.2 | Dados |
| T5.2 | Select **Escopo** (Individual / Conjunta) no form | Baixa | T5.1 | UI |
| T5.3 | Select **Responsável** (membros); desabilitar/ocultar se Conjunta | Baixa | T5.2 | UI |
| T5.4 | Default responsável = `usuario.id` do auth | Baixa | T5.3 | UX |
| T5.5 | Enviar `escopo` + `responsavelUsuarioId` no POST | Baixa | T5.3 | Integração |
| T5.6 | Coluna **Responsável** na tabela (nome ou “Conjunta”) | Baixa | T4.1 | Lista |
| T5.7 | Manter grade/toggle do form atuais; só acrescentar campos | Baixa | — | Regra |

### Fase 6 — Docs / verificação

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T6.1 | Atualizar guia Postman (create/list + membros) | Baixa | T2–T3 | Docs |
| T6.2 | Fluxo: dois membros, despesas individuais + uma conjunta | Baixa | T5 | E2E manual |
| T6.3 | Fluxo: responsável ≠ criador | Baixa | T5 | OK |

### Fase 7 — Depois do MVP (fora)

| ID | Task | Complexidade | Nota |
|----|------|--------------|------|
| T7.1 | Filtro por responsável na listagem | Baixa/Média | Query param |
| T7.2 | Exibir criador além do responsável | Baixa | Response |
| T7.3 | Totais por responsável no mês | Média | Dashboard |
| T7.4 | Rateio percentual (vários responsáveis) | Alta | Opção D |
| T7.5 | Migration formal (além do create-drop) | Média | Prod |

---

## 9. Cenários de teste (quando implementar)

| ID | Caso | Esperado |
|----|------|----------|
| C1 | Create sem responsável (individual) | Usa usuário logado |
| C2 | Create individual com outro membro | Persiste responsável informado |
| C3 | Create individual com user fora do ambiente | 400 |
| C4 | Create conjunta | `responsavel` null; lista mostra “Conjunta” |
| C5 | Create VARIAVEL com N parcelas | Todas com mesmo escopo/responsável |
| C6 | GET competência | Response inclui escopo + nome |
| C7 | Front: select membros + coluna | OK visual e funcional |
| C8 | Regressão: FIXO/VARIAVEL, pago, categoria | Intactos |

---

## 10. Fora de escopo (esta fase)

- Implementação de qualquer task T0–T7  
- Remover `usuario` (criador) da entity  
- Alterar receitas com o mesmo modelo (pode espelhar depois)  
- Rateio financeiro entre membros  
- Exclusão de classes de convite/auth não relacionadas  

---

## 11. Critérios de pronto do MVP

1. Despesa individual tem **responsável** (membro do ambiente)  
2. Despesa **conjunta** é distinguível na API e na UI  
3. Criador (`usuario`) continua existindo  
4. `TipoDespesa` FIXO/VARIAVEL inalterado em significado  
5. Front: select Escopo/Responsável + coluna na tabela  
6. Endpoint de membros disponível para o select  
7. Nenhuma feature não relacionada removida  

---

## 12. Ordem sugerida de entrega

| PR | Conteúdo |
|----|----------|
| PR1 | Fases 1–2 (modelo + create/list) + testes API |
| PR2 | Fase 3 (membros) |
| PR3 | Fases 4–5 (front) + Fase 6 (docs/manual) |

---

## 13. Referências

| Item | Path |
|------|------|
| Entity | `DespesaEntity.java` |
| DTOs | `DespesaDTO.java`, `DespesaResponseDTO.java` |
| Create | `CadastrarDespesaService.java`, `GeradorParcelasService.java` |
| List | `ListarDespesasPorCompetenciaService.java` |
| Membros | `MembroAmbienteEntity.java`, `MembroAmbienteRepository` |
| Front | `DespesasPage.tsx`, `despesa.types.ts`, `despesas.api.ts` |
| Ambiente | `AmbienteAtivoResolver`, header `X-Ambiente-Id` |

---

## 14. Próximo passo sugerido

1. Fechar decisões da **§7** (principalmente Opção A e regras de conjunta).  
2. Aprovar este plano.  
3. Só então autorizar **PR1** (API: escopo + responsável).

**Status atual:** levantamento concluído — **implementação não iniciada**.
