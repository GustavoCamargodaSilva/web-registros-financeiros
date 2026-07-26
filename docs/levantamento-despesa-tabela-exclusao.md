# Levantamento — Alinhamento da tabela de despesas + exclusão (com série)

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `web-registros-financeiros` + `api-registros-financeiros`.
>
> **Regra:** classes, services, controllers e páginas já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** — **sem excluir** cadastro, edição com propagação de série, filtros, totais, receitas, categorias, pagadores nem ícones de ação já existentes.

---

## 1. Objetivo

Dois pedidos no mesmo pacote de planejamento:

| # | Pedido | Resultado esperado |
|---|--------|--------------------|
| A | Espaçamento **torto** entre **Descrição → Valor → Vencimento → Responsável** | Aplicar a **mesma lógica de larguras** já usada na tabela de **receitas** (proporções em `%`, colunas estáveis) |
| B | Poder **excluir** uma despesa | Se for **FIXO** ou **VARIAVEL** (parcelada), excluir **também as outras recorrências/parcelas** da mesma conta (`grupoParcelamento`) |

Escopo desta fase: **apenas levantamento** — sem implementação.

---

## 2. Situação atual (baseline)

### 2.1 Tabela de despesas vs receitas (pedido A)

**Receitas** (já ajustado): larguras em `%` proporcionais; valor sem `align: 'right'` forçado; coluna Ações estreita (`96px`).

| Coluna | Largura (Receitas) |
|--------|--------------------|
| Pagador | `18%` |
| Responsável | `16%` |
| Valor | `14%` |
| Pagamento | `16%` |
| Status | `16%` |
| Ações | `96px` |

**Despesas** (hoje — misturado `%` + `px`):

| Coluna | Largura atual | Observação |
|--------|---------------|------------|
| Descrição | `20%` | |
| Valor | `120px` + `align: 'right'` | Quebra o ritmo visual vs descrição/`%` |
| Vencimento | `120px` | |
| Responsável | `112px` | |
| Parcela | `90px` | |
| Status | `110px` | |
| Ações | `72px` | Só Editar; falta Excluir |

Misturar `%` e `px` fixos faz o espaço entre **Descrição → Valor → Vencimento → Responsável** parecer irregular (principalmente ao redimensionar).

> **Nota:** o formulário de cadastro/edição de despesas já usa `form` + `formGrid` (mesmas classes das receitas). Campos condicionais (parcelas, responsável) podem abrir “buracos” na grade — **fora do foco principal** deste pedido se o problema for a **lista**. Se após alinhar a tabela ainda houver queixa no form, tratar em task opcional (A3).

### 2.2 Exclusão de despesa (pedido B)

| Capacidade | Estado |
|------------|--------|
| `DELETE /api/v1/despesas/{id}` | **Não existe** |
| `DeletarDespesaService` | **Não existe** |
| Front `despesasApi.excluir` | **Não existe** |
| UI Excluir na tabela de despesas | **Não existe** (só ícone Editar) |
| `DELETE` receita (referência) | Existe — 1 linha, sem série |

### 2.3 Séries já existentes (reutilizar)

| Tipo | Create | Update (já MVP) | Delete desejado |
|------|--------|-----------------|-----------------|
| `UNICA` | 1 linha, UUID próprio | Só aquela | Só aquela |
| `FIXO` | N meses, mesmo `grupoParcelamento` | Propaga campos de série | **Toda a série** |
| `VARIAVEL` | N parcelas, mesmo grupo | Propaga + re-rateia | **Toda a série** |

Já disponível: `DespesaRepository.findByAmbienteIdAndGrupoParcelamento` (usado em `AtualizarDespesaService.resolverSerie`).

Documentos anteriores citavam exclusão como **fase futura** (`levantamento-edicao-despesa.md` T7.3 / §9).

---

## 3. Comportamento desejado (MVP)

### 3.1 Pedido A — larguras da tabela

Espelhar o padrão de receitas:

1. Converter colunas principais para **`%`** coerentes (soma ~100% com Ações em `px` ou `%` estreito).
2. **Valor** alinhado como em receitas (esquerda / padrão da tabela), mantendo cor `moneyExpense`.
3. Incluir espaço para **dois** ícones (Editar + Excluir) na coluna Ações (~`96px`), sem apertar Descrição/Responsável.

Sugestão inicial de proporções (ajustável na implementação):

| Coluna | Largura sugerida |
|--------|------------------|
| Descrição | `22%` |
| Valor | `12%` |
| Vencimento | `14%` |
| Responsável | `14%` |
| Parcela | `10%` |
| Status | `12%` |
| Ações | `96px` |

### 3.2 Pedido B — exclusão

#### API — `DELETE /api/v1/despesas/{id}`

1. Resolver ambiente ativo.
2. `findByIdAndAmbienteId` → 404 se não achar (`DespesaNaoEncontradaException`).
3. Resolver série (mesmo espírito do update):
   - Sem `grupoParcelamento` → apaga só o `id`.
   - Com grupo → `findByAmbienteIdAndGrupoParcelamento` → **`deleteAll`** da lista.
4. Resposta: `204 No Content` (igual receita).

| Tipo | Efeito |
|------|--------|
| `UNICA` | Remove 1 linha |
| `FIXO` | Remove todas as competências do grupo |
| `VARIAVEL` | Remove todas as parcelas do grupo |

#### Front

| Item | Detalhe |
|------|---------|
| Ícone | `IconTrash` (já usado em receitas/categorias/pagadores) ao lado de Editar |
| Modal | Confirmação; se `tipoDespesa !== 'UNICA'`, texto avisando que **todas as ocorrências da série** serão removidas |
| Após sucesso | Toast + `loadData`; se estava editando o mesmo id/série, fechar form |

### 3.3 Fora de escopo (MVP)

| Item | Motivo |
|------|--------|
| Opção “excluir só esta ocorrência” (FIXO) | Pedido pede série inteira; fase 2 |
| “Desta competência em diante” | Fase 2 |
| Excluir uma parcela VARIAVEL com re-rateio | Complexo; pedido pede as outras também |
| Soft-delete / histórico | Não usado no restante do app |
| Alterar `GeradorParcelasService` / regras de create | Intactos |
| Redesign completo do form de despesas | Só se A3 for aprovado |

---

## 4. Arquivos relevantes (não excluir)

### Pedido A (front)

| Path | Papel |
|------|-------|
| `src/pages/DespesasPage.tsx` | Ajustar `width` / `align` das colunas do `DataTable` |
| `DataTable.tsx` / CSS | Só se faltar suporte genérico (hoje já tem `width`) |

Referência (ler, não quebrar): `ReceitasPage.tsx` colunas.

### Pedido B — API (criar / estender)

| Path | Papel |
|------|-------|
| **Novo** `DeletarDespesaService.java` | Load + resolver série + delete |
| `DespesasController.java` | Adicionar `DELETE /{id}` |
| `DespesaRepository` | Já tem find por grupo; opcional `delete` em lote nativo |
| Testes de integração despesas | UNICA / FIXO / VARIAVEL / 404 |

Reutilizar: `DespesaNaoEncontradaException`, `AmbienteAtivoResolver`, padrão de `AtualizarDespesaService.resolverSerie`, espelho de `DeletarReceitaService`.

### Pedido B — Front

| Path | Papel |
|------|-------|
| `src/api/despesas.api.ts` | + `excluir(id)` |
| `src/pages/DespesasPage.tsx` | `deleteTarget`, Modal, `IconTrash`, largura Ações |
| `NavIcons.tsx` / `Modal` / `Button` | Já existem — só consumir |

### Não alterar neste escopo

| Path / área | Motivo |
|-------------|--------|
| `CadastrarDespesaService` / `GeradorParcelasService` | Create intacto |
| `AtualizarDespesaService` | Só espelhar lógica de série no delete |
| Receitas, categorias, pagadores, auth, convites | Fora do pedido |
| Entity `TipoDespesa` / migration | Não necessário |

---

## 5. Decisões abertas (para aprovação)

| # | Pergunta | Opção recomendada |
|---|----------|-------------------|
| D1 | Larguras da tabela: copiar ideia de `%` das receitas? | **Sim** (proposta §3.1) |
| D2 | Valor à esquerda (como receita) ou manter à direita? | **Esquerda** (paridade visual com receita) |
| D3 | FIXO/VARIAVEL: sempre série inteira no DELETE? | **Sim** (pedido explícito) |
| D4 | Modal diferencia UNICA vs série? | **Sim** (copy clara) |
| D5 | Contagem “N ocorrências” no modal | Client: filtrar lista atual pelo mesmo `grupoParcelamento` **ou** texto genérico sem número |
| D6 | Ajustar grade do **formulário** de despesas agora? | **Não no MVP** deste doc, salvo confirmação de que o “torto” é o form e não a tabela |

---

## 6. Tasks (baixa complexidade) — após aprovação

### Fase A — Tabela

1. **Mapear colunas** — substituir `px` misturados por `%` (e Ações em `px`/`%` estreito) em `DespesasPage`.  
2. **Alinhar valor** — remover `align: 'right'` do valor se D2 confirmado; manter `moneyExpense`.  
3. *(Opcional)* **Form grid** — só se D6 = sim: `align-items: start` / estabilizar slots condicionais.

### Fase B — API exclusão

4. **`DeletarDespesaService`** — find por id+ambiente; resolver série por `grupoParcelamento`; `deleteAll`.  
5. **Controller** — `DELETE /api/v1/despesas/{id}` → `204`.  
6. **Testes** — UNICA remove 1; FIXO remove todas do grupo; VARIAVEL remove N; id inexistente → 404; outro ambiente → 404.

### Fase B — Front exclusão

7. **`despesasApi.excluir`**.  
8. **Estado + Modal** — padrão Receitas; mensagem de série se `tipoDespesa` for FIXO/VARIAVEL.  
9. **Ícone trash** na coluna Ações (junto do Editar); ajustar width da coluna se necessário.  
10. **Pós-exclusão** — toast, reload, fechar edição se afetada.

### Validação manual

11. **Checklist**  
    - Tabela: colunas Descrição/Valor/Vencimento/Responsável visualmente estáveis em desktop e janela estreita.  
    - Excluir UNICA → some só aquele mês.  
    - Excluir FIXO → some nas demais competências do grupo.  
    - Excluir VARIAVEL → some todas as parcelas.  
    - Editar, filtros e totais continuam ok.  
    - Cadastro intacto.

---

## 7. Riscos / cuidados

| Risco | Mitigação |
|-------|-----------|
| Apagar série “sem querer” | Modal com aviso explícito para FIXO/VARIAVEL |
| Orfãos se delete só 1 parcela VARIAVEL | MVP sempre apaga o grupo inteiro |
| Contagem N errada se lista filtrada | Preferir texto genérico ou buscar pelo `grupoParcelamento` na lista completa (`despesas`, não só `despesasFiltradas`) |
| Quebrar edição | Não alterar `AtualizarDespesaService` |
| Larguras `%` + colunas demais | Validar visualmente; iterar proporções sem mudar DataTable genérico se possível |

---

## 8. Critérios de pronto

- [ ] Colunas Descrição → Valor → Vencimento → Responsável com espaçamento estável (lógica `%` como receitas)  
- [ ] `DELETE /api/v1/despesas/{id}` remove UNICA (1) ou série completa (FIXO/VARIAVEL)  
- [ ] Front: ícone excluir + modal + reload  
- [ ] Cadastro e edição de despesa intactos  
- [ ] Testes de integração cobrindo série e 404  
- [ ] Nenhuma exclusão de código não relacionado

---

## 9. Próximo passo

Aprovar **D1–D6** e autorizar início pela **Task 1** (larguras da tabela) **ou** pela **Task 4** (`DeletarDespesaService`), conforme prioridade.
