# Levantamento — Despesa única (apenas o mês)

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `api-registros-financeiros` + `web-registros-financeiros`.
>
> **Regra:** mudanças **aditivas**. Não alterar o comportamento atual de `FIXO` (12 meses) nem de `VARIAVEL` (parcelado). Não excluir código não relacionado.

---

## 1. Objetivo

Hoje o produto cobre dois casos:

| Tipo | Uso |
|------|-----|
| `FIXO` | Gasto que **repete** (ex.: aluguel) → gera 12 meses |
| `VARIAVEL` | Compra **parcelada** → divide o valor em N parcelas |

Falta o caso cotidiano: **despesa só daquele mês** (ex.: “tive a despesa X apenas este mês”).

| Requisito | Descrição |
|-----------|-----------|
| Novo tipo | Cadastrar despesa que gera **1 única** ocorrência na competência do vencimento |
| Valor | Valor integral informado (sem rateio, sem repetição) |
| Escopo | Levantamento + tasks; **sem implementação** nesta fase |

---

## 2. Situação atual (baseline)

### 2.1 Enum

`TipoDespesa` = `FIXO` | `VARIAVEL` apenas.

### 2.2 Workaround atual

É possível cadastrar `VARIAVEL` com `quantidadeParcelas = 1`, gerando 1 linha com valor integral. Problemas:

- Semântica errada na UI (“Variável (parcelado)” para algo que não é parcelado)
- Na edição, o campo vira “Valor total” como se fosse série parcelada
- Confunde o usuário que quer “só este mês”

### 2.3 Histórico

Antes da recorrência, `FIXO` significava “uma única despesa na competência”. Depois `FIXO` passou a gerar 12 meses (`levantamento-despesa-fixa-recorrente.md`). O caso pontual ficou sem tipo próprio.

---

## 3. Semântica desejada (produto)

| Tipo | Label sugerida (UI) | Ocorrências | Valor |
|------|---------------------|-------------|-------|
| **UNICA** | Única (só este mês) | **1** | Valor informado |
| **FIXO** | Fixo (repete 12 meses) | 12 | Mesmo valor em todas |
| **VARIAVEL** | Variável (parcelado) | N (1–24) | Rateado / N |

Nomes alternativos considerados: `PONTUAL`, `AVULSA`. Preferência: **`UNICA`** (clara e curta).

### 3.1 Regras

| Campo | UNICA |
|-------|-------|
| `quantidadeParcelas` | Ignorada / não enviada (como FIXO) |
| `numeroParcela` / `totalParcelas` | `1` / `1` |
| `grupoParcelamento` | UUID próprio da linha (ou null — ver §6) |
| Edição | Atualiza **só** aquela ocorrência (não há série para propagar descrição/valor como FIXO/VARIAVEL) |
| Coluna Parcela na tabela | Não exibir (`totalParcelas == 1`) |

### 3.2 Edição (MVP)

| Campo | Comportamento |
|-------|---------------|
| descrição, categoria, valor, escopo, responsável, pago, vencimento | Só na linha editada |
| Propagação de série | **Não aplica** (não há outras ocorrências do grupo, ou o grupo tem 1 item) |

Alinhado ao MVP de edição: se `grupoParcelamento` tiver 1 item, `AtualizarDespesaService` já naturalmente só atualiza aquela linha — desde que o branch de rateio/propagação de valor trate `UNICA` como “sem rateio / sem série”.

---

## 4. API — mudanças previstas

| Item | Mudança |
|------|---------|
| `TipoDespesa.java` | Incluir `UNICA` |
| `GeradorParcelasService` | `UNICA` → horizonte **1**; valor integral; `numeroParcela`/`totalParcelas` = 1/1 |
| `DespesaDTO` | Validação: `quantidadeParcelas` só obrigatória para `VARIAVEL` (já é o caso) |
| `AtualizarDespesaService` | `UNICA`: atualizar apenas a ocorrência (valor direto, sem `CalculadoraValorParcela`; sem esperar série) |
| Testes | Integração: cadastrar UNICA → 1 linha; listar competência; editar não cria/altera outros meses |

**Sem** migration de dados obrigatória no MVP: registros antigos `VARIAVEL` com 1 parcela podem permanecer como estão; novos cadastros pontuais usam `UNICA`.

---

## 5. Front — mudanças previstas

| Item | Mudança |
|------|---------|
| `despesa.types.ts` | `TipoDespesa` inclui `'UNICA'` |
| `DespesasPage` select Tipo | Opção **“Única (só este mês)”** |
| Campo parcelas | Continua só para `VARIAVEL` |
| Edição | Tipo readonly; label do valor permanece “Valor” (não “Valor total”) |
| Ordem sugerida no select | Única → Fixo → Variável (mais comum primeiro) |

---

## 6. Decisões abertas (para aprovação)

| # | Pergunta | Opção recomendada |
|---|----------|-------------------|
| D1 | Nome do enum | `UNICA` |
| D2 | Label UI | `Única (só este mês)` |
| D3 | `grupoParcelamento` em UNICA | Manter UUID (igual FIXO/VARIAVEL com 1 item) — menos exceção no código |
| D4 | Migrar VARIAVEL com 1 parcela existentes | **Não** no MVP |
| D5 | Ordem no select | Única, Fixo, Variável |

---

## 7. Tasks (após aprovação)

1. **API:** enum `UNICA` + geração 1 ocorrência + ajuste edição + testes
2. **Front:** tipo no union, option no form, labels de edição
3. **Validação manual:** cadastrar UNICA na competência atual; conferir que não aparece nos meses seguintes; editar valor/pago

---

## 8. Fora de escopo

- Excluir ou renomear `FIXO` / `VARIAVEL`
- Alterar horizonte de FIXO (12 meses)
- Migration em massa de dados antigos
- Novo campo na entity além do valor do enum
