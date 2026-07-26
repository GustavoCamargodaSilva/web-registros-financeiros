# Levantamento — Percentual de receita por pessoa no total geral

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projeto:** `web-registros-financeiros` (cálculo e exibição no front).
>
> **Regra:** classes, utils, páginas e APIs já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** — **sem excluir** total geral em R$, totais por pessoa, cadastro/edição/exclusão de receita, pagadores, despesas nem o resumo atual.

---

## 1. Objetivo

Complementar a exibição do resumo de receitas por pessoa mostrando **quanto % do total geral** cada responsável representa.

| Requisito | Descrição |
|-----------|-----------|
| Conta | `percentual = (total da pessoa ÷ total geral) × 100` |
| Exemplo | Pessoa1 = R$ 100, total geral = R$ 200 → **50%**; Pessoa2 = R$ 100 → **50%** |
| Onde | Card de resumo da `ReceitasPage` (junto do valor em R$ já existente) |
| Escopo | Levantamento + tasks; **sem implementação** nesta fase |

---

## 2. Situação atual (baseline)

### 2.1 Front — `calcularResumoReceitas` (`src/utils/receitasResumo.ts`)

Já calcula, por competência carregada:

| Campo | Conteúdo |
|-------|----------|
| `totalGeral` | Soma de todos os `valor` das receitas do mês |
| `porResponsavel[]` | `usuarioId`, `nome` (primeiro nome), `total` (soma por responsável) |

**Não** calcula percentual.

### 2.2 Front — UI (`ReceitasPage`)

No toolbar/resumo:

- Bloco **Total geral** + competência
- Um bloco por responsável: **nome** + **valor** (`formatCurrency`)

Não há indicação de participação percentual.

### 2.3 API

`GET /api/v1/receitas?ano=&mes=` já devolve `valorTotal` e a lista com `valor` + `responsavelUsuarioId` / `responsavelNome`.

**Não é necessário** novo endpoint nem alteração de contrato para o MVP: o % pode ser derivado no front a partir dos dados já usados pelo resumo.

### 2.4 Testes existentes

`receitasResumo.test.ts` cobre total geral e totais por responsável — **sem** asserções de %.

---

## 3. Comportamento desejado (MVP)

### 3.1 Fórmula

Para cada item em `porResponsavel`:

```text
percentual = totalGeral > 0
  ? (item.total / totalGeral) * 100
  : 0
```

| Entrada | Pessoa1 | Pessoa2 | Total | % P1 | % P2 |
|---------|---------|---------|-------|------|------|
| Exemplo do pedido | 100 | 100 | 200 | 50 | 50 |
| Desproporcional | 1500 | 300 | 1800 | 83,33… | 16,66… |

### 3.2 Exibição (aditiva)

Manter valor em R$. Acrescentar o % ao lado (ou abaixo) do valor da pessoa, por exemplo:

- Label: `Ana`
- Valor: `R$ 1.500,00 · 83%`  
  *(formato exato a fechar em D2)*

Total geral **não** precisa de % (é a base 100%).

### 3.3 Casos de borda

| Caso | Comportamento sugerido |
|------|------------------------|
| `totalGeral === 0` | Lista vazia ou totais 0 → não mostrar % (ou `0%`) |
| Uma pessoa só | Mostrar `100%` |
| Arredondamento | Preferir **1 casa decimal** ou **inteiro**; soma dos % pode não fechar 100% por arredondamento — aceitável no MVP |
| Receita sem `responsavelUsuarioId` | Já ignorada no agrupamento atual; continua fora do % (e do total por pessoa); o valor **entra** no `totalGeral` — ver risco na seção 7 |

### 3.4 Fora de escopo (MVP)

| Item | Motivo |
|------|--------|
| Percentual em despesas | Pedido é só receita |
| Gráfico / pizza | Não pedido |
| % no backend / novo campo no DTO | Front já tem dados |
| % por pagador (origem) | Pedido é por **pessoa/responsável** |
| Alterar regra de quem entra no total | Manter `calcularResumoReceitas` como está, só estender |

---

## 4. Arquivos relevantes (não excluir)

### Estender (aditivo)

| Path | Papel |
|------|-------|
| `src/utils/receitasResumo.ts` | Incluir `percentual` em `TotalPorResponsavelReceita` (ou campo calculado no return) |
| `src/utils/receitasResumo.test.ts` | Casos 50/50, desproporcional, total zero |
| `src/pages/ReceitasPage.tsx` | Exibir `%` no `summaryItem` de cada responsável |

### Opcional (só se necessário para formatação)

| Path | Papel |
|------|-------|
| `src/utils/format.ts` | Helper `formatPercent(value)` se ainda não existir — **criar só se** não houver equivalente |

### Não alterar neste escopo

| Path | Motivo |
|------|--------|
| API (`ReceitasController`, services, DTOs) | Cálculo no front |
| `despesasResumo.ts` / `DespesasPage` | Feature de receita |
| Cadastro/edição/exclusão de receita | Intactos |
| `ReceitaCompetenciaResponse` | Intactos |

---

## 5. Decisões abertas (para aprovação)

| # | Pergunta | Opção recomendada |
|---|----------|-------------------|
| D1 | Onde calcular o %? | **Front** em `calcularResumoReceitas` |
| D2 | Formato visual | Valor + percentual no mesmo bloco (ex.: `R$ 100,00 (50%)`) |
| D3 | Casas decimais | **Inteiro** se ≥ 1 pessoa com valores “redondos”; senão **1 casa** (`83,3%`) — ou sempre 1 casa para consistência |
| D4 | Total geral mostra %? | **Não** |
| D5 | Receitas sem responsável no denominador | Manter como hoje: entram no `totalGeral`; pessoas só somam as delas → % pode somar &lt; 100% se houver órfãs — **ok** ou filtrar (ver risco) |

---

## 6. Tasks (baixa complexidade) — após aprovação

### Util / cálculo

1. **Estender tipo** — em `TotalPorResponsavelReceita`, adicionar `percentual: number` (0–100).  
2. **Calcular no resumo** — após montar `porResponsavel` e `totalGeral`, preencher `percentual` com a fórmula da seção 3.1.  
3. **Testes unitários** — 50/50; 1500/300 → ~83,33 e ~16,67; lista vazia (`percentual` ausente ou array vazio); uma pessoa → 100.

### UI

4. **Formatação** — decidir helper (`formatPercent`) ou inline (`${n}%` / `toLocaleString('pt-BR')`).  
5. **`ReceitasPage`** — no map de `porResponsavel`, exibir o % junto do valor em R$ (sem remover o valor atual).  
6. **Checklist manual** — duas pessoas iguais → 50%/50%; alterar receita e ver % atualizar; total geral e cadastro/edição intactos.

---

## 7. Riscos / cuidados

| Risco | Mitigação |
|-------|-----------|
| Soma dos % ≠ 100 por arredondamento | Documentar; usar 1 casa ou arredondar só na exibição |
| Receitas sem responsável no `totalGeral` | Hoje já entram no total e não no por pessoa; % das pessoas soma &lt; 100%. Se indesejado, task futura: excluir órfãs do denominador **ou** forçar responsável (já obrigatório no form) |
| Confundir com % de despesa | Não tocar `despesasResumo` neste escopo |
| Refator grande do card de resumo | Só acrescentar texto/estilo mínimo; não redesenhar o toolbar |

---

## 8. Critérios de pronto

- [ ] Cada responsável no resumo mostra valor **e** % do total geral  
- [ ] Exemplo 100 + 100 em 200 → 50% e 50%  
- [ ] Total geral em R$ permanece  
- [ ] Cadastro, edição, exclusão e lista de receitas intactos  
- [ ] Testes de `calcularResumoReceitas` cobrindo o percentual  
- [ ] Nenhuma alteração obrigatória na API

---

## 9. Próximo passo

Aprovar **D1–D5** e autorizar início pela **Task 1** (estender tipo + cálculo em `receitasResumo.ts`).
