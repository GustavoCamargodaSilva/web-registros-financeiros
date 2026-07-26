# Levantamento — Ação rápida “Marcar como pago” (só a competência)

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `api-registros-financeiros` + `web-registros-financeiros`.
>
> **Regra:** classes, services, controllers e páginas já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** — **sem excluir** cadastro, edição com propagação de série, exclusão de série, filtros, totais, ícones Editar/Excluir nem o fluxo completo de PUT.

---

## 1. Objetivo

Incluir um botão na coluna **Ações** da lista de despesas que, ao ser acionado, marque **apenas aquela ocorrência** (daquele mês/competência) como **pago** — mesmo que a despesa seja **FIXO** (recorrente) ou **VARIAVEL** (parcelada).

| Requisito | Descrição |
|-----------|-----------|
| Escopo do efeito | **Só a linha** clicada (`id` + competência atual) |
| Séries | **Não** alterar `pago` das demais ocorrências do `grupoParcelamento` |
| UX | Ação rápida — **sem** abrir o formulário de edição |
| Escopo deste doc | Levantamento + tasks; **sem implementação** nesta fase |

---

## 2. Situação atual (baseline)

### 2.1 API — update completo

`PUT /api/v1/despesas/{id}` (`AtualizarDespesaService`):

| Campo | Comportamento na série |
|-------|------------------------|
| descrição, categoria, escopo, responsável, valor | Propaga para **todo** o `grupoParcelamento` |
| **`pago`** | Já é aplicado **somente** na ocorrência editada |
| vencimento | Só na ocorrência editada |

Ou seja: a regra de negócio pedida para `pago` **já existe** no PUT — o que falta é uma **ação rápida** na UI (e, de preferência, um endpoint leve que não reenvie/reprocesse a série inteira só para mudar status).

### 2.2 Front — `DespesasPage`

| Item | Estado |
|------|--------|
| Coluna Status | `Badge` Pago / Pendente (somente leitura) |
| Ações | Ícones **Editar** + **Excluir** |
| Marcar pago | Só via form de edição (select Pago + Salvar) |
| Hint no form | Já informa: “O status pago vale só para esta competência.” |

### 2.3 Tipos

`UNICA` | `FIXO` | `VARIAVEL` — todos têm `pago` por linha; série ligada por `grupoParcelamento`.

---

## 3. Comportamento desejado (MVP)

### 3.1 UX

| Ação | Detalhe |
|------|---------|
| Botão/ícone novo | Na coluna Ações (ex.: check / “Marcar como pago”) |
| Clique | Atualiza `pago = true` **só** daquela linha |
| Feedback | Toast de sucesso + reload da lista (badge vira “Pago”) |
| Já está paga? | Ver D2 (ocultar, desabilitar ou alternar para pendente) |

Sem modal obrigatório no MVP (ação reversível via edição ou toggle, se D2 permitir).

### 3.2 API — opção recomendada

**Endpoint dedicado (aditivo):**

```http
PATCH /api/v1/despesas/{id}/pago
Content-Type: application/json

{ "pago": true }
```

| Passo | Regra |
|-------|-------|
| 1 | `findByIdAndAmbienteId` → 404 se não achar |
| 2 | `despesa.setPago(dto.getPago())` |
| 3 | `save` **apenas** essa entity — **não** carregar/alterar a série |
| 4 | Resposta `200` + `DespesaResponseDTO` (ou `204`) |

**Alternativa descartada no MVP (mas válida):** reutilizar `PUT` com o body completo da linha e `pago: true`. Funciona para o status, porém o service atual ainda propaga outros campos na série (mesmo com valores iguais) — mais pesado e mais fácil de errar no client.

### 3.3 Escopo por tipo

| Tipo | Efeito do botão |
|------|-----------------|
| `UNICA` | Marca só aquela linha |
| `FIXO` | Marca só o mês clicado; demais meses da recorrência inalterados |
| `VARIAVEL` | Marca só aquela parcela; demais parcelas inalteradas |

### 3.4 Fora de escopo (MVP)

| Item | Motivo |
|------|--------|
| Marcar série inteira como paga | Contraria o pedido |
| Alterar valor/descrição na ação rápida | Só status |
| Clique no Badge em vez de botão em Ações | Pedido pede botão em ações (pode ser fase 2) |
| Refatorar `AtualizarDespesaService` | Intactos; novo service/endpoint aditivo |
| Mesma ação em receitas | Não pedido |

---

## 4. Arquivos relevantes (não excluir)

### API (criar / estender)

| Path | Papel |
|------|-------|
| **Novo** `DespesaPagoUpdateDTO.java` | Body `{ pago: boolean }` |
| **Novo** `AtualizarPagamentoDespesaService.java` (ou nome similar) | Load + setPago + save da ocorrência |
| `DespesasController.java` | Adicionar `PATCH /{id}/pago` |
| Testes de integração | FIXO/VARIAVEL: só a linha muda; 404 |

Reutilizar: `DespesaNaoEncontradaException`, `DespesaMapper`, `AmbienteAtivoResolver`, `DespesaRepository.findByIdAndAmbienteId`.

### Front

| Path | Papel |
|------|-------|
| `src/api/despesas.api.ts` | + `atualizarPago(id, pago)` |
| `src/pages/DespesasPage.tsx` | Botão/ícone + handler; largura da coluna Ações se precisar |
| `NavIcons.tsx` | **Novo** ícone (ex.: `IconCheck` / `IconCircleCheck`) — mesmo traço dos atuais |

### Não alterar neste escopo

| Área | Motivo |
|------|--------|
| `AtualizarDespesaService` (PUT série) | Continua para edição completa |
| `DeletarDespesaService` / exclusão de série | Intactos |
| Create / gerador de parcelas | Intactos |
| Receitas / categorias / pagadores | Fora do pedido |

---

## 5. Decisões abertas (para aprovação)

| # | Pergunta | Opção recomendada |
|---|----------|-------------------|
| D1 | Endpoint dedicado `PATCH .../pago` vs reutilizar `PUT`? | **PATCH dedicado** (só toca a linha) |
| D2 | Se já está `pago=true`? | **Toggle** (pago ↔ pendente) **ou** ocultar/desabilitar o botão quando já paga — recomendado: **toggle** com ícone/título dinâmico |
| D3 | Confirmar com modal? | **Não** no MVP (1 clique) |
| D4 | Ícone | Check outline; título `Marcar como pago` / `Marcar como pendente` |
| D5 | Largura da coluna Ações | Ampliar de `96px` → ~`132px` (3 ícones) |

---

## 6. Tasks (baixa complexidade) — após aprovação

### API

1. **`DespesaPagoUpdateDTO`** — `@NotNull Boolean pago`.  
2. **`AtualizarPagamentoDespesaService`** — find por id+ambiente; setPago; save; return response.  
3. **Controller** — `PATCH /api/v1/despesas/{id}/pago`.  
4. **Testes** — marcar pago em FIXO não altera outra competência do grupo; idem VARIAVEL; UNICA ok; 404.

### Front

5. **Ícone** — `IconCheck` (ou similar) em `NavIcons`.  
6. **`despesasApi.atualizarPago(id, pago)`**.  
7. **Handler** — `marcarPago(row)` → chama API com `pago: !row.pago` (se D2=toggle) ou `true`; toast + `loadData`.  
8. **Coluna Ações** — botão entre Editar e Excluir (ou após Editar); `aria-label`/`title` claros; ajustar width.

### Validação manual

9. **Checklist**  
    - Pendente → clique → badge “Pago” naquele mês.  
    - FIXO: junho pago, julho continua pendente.  
    - VARIAVEL: parcela 1 paga, parcela 2 inalterada.  
    - Editar completo e Excluir série continuam ok.

---

## 7. Riscos / cuidados

| Risco | Mitigação |
|-------|-----------|
| Usar PUT e propagar valor/descrição sem querer | Preferir PATCH só de `pago` |
| Usuário achar que pagou a série toda | Tooltip/title: “Marcar este mês como pago” |
| Coluna Ações apertada com 3 ícones | Aumentar width; manter `tableActions` com gap |
| Duplo clique / loading | Desabilitar botão enquanto request em voo (opcional, estado `loadingId`) |

---

## 8. Critérios de pronto

- [ ] Botão em Ações marca/atualiza `pago` **somente** da ocorrência daquele mês  
- [ ] FIXO e VARIAVEL: demais recorrências/parcelas **não** mudam de status  
- [ ] Cadastro, edição (PUT série) e exclusão intactos  
- [ ] Testes cobrindo isolamento por ocorrência  
- [ ] Nenhuma exclusão de código não relacionado

---

## 9. Próximo passo

Aprovar **D1–D5** e autorizar início pela **Task 1** (`DespesaPagoUpdateDTO`) ou, se preferir só front reutilizando PUT, declarar D1 explicitamente como PUT (não recomendado).
