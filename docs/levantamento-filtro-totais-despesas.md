# Levantamento — Filtro (Conjunta / Individual) + totais por responsável

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `web-registros-financeiros` (UI principal) + eventual extensão leve em `api-registros-financeiros` (só se necessário).
>
> **Regra:** páginas, APIs, services e entidades já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** (filtros na toolbar, cálculos de resumo, opcionalmente query params) — **sem excluir** cadastro, FIXO 12 meses, responsável/escopo, convites nem outras telas.

---

## 1. Objetivo

Na tela de **Despesas**, além da lista do mês:

| Pedido | Resultado esperado |
|--------|--------------------|
| Filtrar a lista | Ver só despesas **Conjuntas**, só **Individuais**, ou todas |
| Resumo da competência | Mostrar totais que deixem claro o valor **por responsável** (e o que é conjunta) |

Escopo desta fase: **apenas levantamento** — sem implementação.

---

## 2. Situação atual (baseline)

### 2.1 Front (`DespesasPage`)

| Item | Estado |
|------|--------|
| Lista | Todas as despesas da competência (`ano`/`mes`) |
| Filtro por escopo / responsável | **Não existe** |
| Resumo | Um único “Total no mês” = soma de **todas** as linhas carregadas |
| Dados já disponíveis na lista | `escopo`, `responsavelUsuarioId`, `responsavelNome` |

### 2.2 API

`GET /api/v1/despesas?ano=&mes=`

- Filtra só por ambiente + competência
- **Sem** query `escopo` / `responsavelUsuarioId`
- Response já traz escopo e responsável (suficiente para filtrar no cliente)

### 2.3 Endpoint auxiliar

`GET /api/v1/ambientes/ativo/membros` — já existe (útil para labels e breakdown por pessoa).

---

## 3. Conceitos do filtro e do resumo

### 3.1 Escopo (já no domínio)

| Valor | Significado |
|-------|-------------|
| `INDIVIDUAL` | Despesa de um **responsável** (`responsavelUsuarioId` / nome) |
| `CONJUNTA` | Despesa do ambiente/casal — sem responsável |

### 3.2 Filtro da lista (proposta)

| Opção do filtro | Lista mostra |
|-----------------|--------------|
| **Todas** (default) | Individuais + conjuntas |
| **Conjuntas** | Só `escopo = CONJUNTA` |
| **Individuais** | Só `escopo = INDIVIDUAL` |
| **Por responsável** (recomendado no MVP) | Individuais daquele membro (select de membros) |

Combinações sugeridas na UI (simples):

```
[ Escopo: Todas | Individuais | Conjuntas ]   [ Responsável: Todos | Ana | Bruno | … ]
```

Regras:

- Se Escopo = **Conjuntas** → select Responsável desabilitado / ignorado  
- Se Escopo = **Individuais** ou **Todas** → Responsável pode restringir  
- Se Responsável = pessoa X e Escopo = Todas → mostra individuais de X (**sem** conjuntas), **ou** individuais de X + conjuntas (ver §6)

### 3.3 Resumo da competência (proposta)

Manter e enriquecer o card superior:

| Linha / bloco | Conteúdo |
|---------------|----------|
| Competência | Mês/ano (já existe) |
| **Total geral** | Soma de todas as despesas do mês (independente do filtro da lista, **ou** alinhado ao filtro — ver §6) |
| **Total conjuntas** | Soma `escopo = CONJUNTA` |
| **Por responsável** | Uma linha (ou chips) por membro: soma das individuais daquela pessoa |

Exemplo visual (texto):

```
Competência: Julho/2026
Total geral:        R$ 4.500,00
Conjuntas:          R$ 1.200,00
Ana:                R$ 2.000,00
Bruno:              R$ 1.300,00
```

Quando o usuário aplicar filtro na lista, o resumo pode:

- **Opção R1 (recomendada):** resumo **sempre completo do mês** (visão gerencial); filtro só afeta a tabela  
- **Opção R2:** resumo reflete o filtro (“Total filtrado”) + manter total geral em segundo plano  

---

## 4. Opções técnicas

| Opção | Onde filtra | Prós | Contras |
|-------|-------------|------|---------|
| **A (recomendada MVP)** | **Front** — carrega o mês e filtra/agrega em memória | Zero mudança de contrato API; tasks curtas; dados já vêm na response | Se a lista crescer muito, ainda ok por competência mensal |
| B | API com `?escopo=&responsavelUsuarioId=` | Menos payload | Mais código backend + testes; resumo por responsável exigiria outro endpoint ou response wrapper |
| C | Novo DTO de resumo no backend | Totais oficiais no servidor | Escopo maior; desnecessário para MVP |

**Sugestão:** Opção **A** no MVP. API (B/C) só se no futuro a listagem deixar de trazer o mês inteiro.

---

## 5. Proposta de UX (tela Despesas)

```
┌─────────────────────────────────────────────────────────────────┐
│ Competência: Julho/2026                              [Cadastrar]│
│ Total geral: R$ 4.500,00                                        │
│ Conjuntas: R$ 1.200,00 · Ana: R$ 2.000,00 · Bruno: R$ 1.300,00  │
├─────────────────────────────────────────────────────────────────┤
│ Escopo: [Todas ▾]   Responsável: [Todos ▾]                      │  ← filtros da lista
├─────────────────────────────────────────────────────────────────┤
│ (form nova despesa, se aberto)                                  │
├─────────────────────────────────────────────────────────────────┤
│ Tabela filtrada…                                                │
└─────────────────────────────────────────────────────────────────┘
```

Comportamentos:

| Ação | Efeito |
|------|--------|
| Trocar competência | Recarrega lista; filtros podem resetar ou persistir (sugerir **manter** filtros) |
| Alterar Escopo / Responsável | Só refiltra a tabela (sem novo fetch, na Opção A) |
| Lista vazia com filtro | Mensagem: “Nenhuma despesa para este filtro.” |

---

## 6. Decisões pendentes

| # | Pergunta | Sugestão |
|---|----------|----------|
| 1 | Filtro só no front (Opção A)? | **Sim** |
| 2 | Resumo completo do mês mesmo com filtro (R1)? | **Sim** |
| 3 | Filtro “Responsável = X” inclui conjuntas? | **Não** — só individuais da pessoa |
| 4 | Mostrar breakdown só dos membros que têm despesa no mês? | Mostrar **todos os membros** com R$ 0,00 se zerado **ou** só quem tem valor — sugerir **só quem tem valor > 0** + linha Conjuntas se > 0 |
| 5 | Filtro de responsável obrigatório no MVP? | **Sim** — senão “individuais” mistura várias pessoas |
| 6 | Persistência do filtro (sessionStorage)? | Fora do MVP |

---

## 7. Tasks de baixa complexidade

> Nenhuma task abaixo deve ser executada nesta fase de levantamento.

### Fase 0 — Fechamento

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T0.1 | Confirmar §6 (R1 vs R2; responsável + conjuntas) | Baixa | — | Decisões |
| T0.2 | Confirmar labels: “Todas / Individuais / Conjuntas”, “Todos” no responsável | Baixa | — | Copy |

### Fase 1 — Estado e helpers de filtro (front)

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T1.1 | Estado `filtroEscopo`: `'TODOS' \| 'INDIVIDUAL' \| 'CONJUNTA'` | Baixa | T0.1 | State |
| T1.2 | Estado `filtroResponsavelId`: `'' \| number` (vazio = todos) | Baixa | T0.1 | State |
| T1.3 | Helper `filtrarDespesas(lista, escopo, responsavelId)` | Baixa | T1.1–T1.2 | Função pura |
| T1.4 | `useMemo` da lista filtrada a partir de `despesas` | Baixa | T1.3 | Lista UI |
| T1.5 | Teste unitário leve do helper (casos §8) | Baixa | T1.3 | Teste |

### Fase 2 — Totais / resumo

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T2.1 | Helper `calcularResumoDespesas(despesas)` → `{ totalGeral, totalConjuntas, porResponsavel[] }` | Baixa | — | Função pura |
| T2.2 | `porResponsavel`: agrupar por `responsavelUsuarioId` + nome; somar valores | Baixa | T2.1 | Breakdown |
| T2.3 | `useMemo` do resumo sobre a lista **completa** do mês (R1) | Baixa | T2.1, T0.1 | Dados |
| T2.4 | Teste unitário do resumo (misto individual + conjunta) | Baixa | T2.1 | Teste |

### Fase 3 — UI filtros + resumo

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T3.1 | Carregar membros ao montar a página (não só ao abrir form) — para selects/resumo | Baixa | — | Membros |
| T3.2 | Selects de filtro na toolbar (acima da tabela / no card de competência) | Baixa | T1, T3.1 | UI |
| T3.3 | Desabilitar select Responsável quando Escopo = Conjuntas | Baixa | T3.2 | UX |
| T3.4 | Exibir no card: Total geral + Conjuntas + linhas/chips por responsável | Baixa | T2.3 | Resumo |
| T3.5 | Tabela usa `despesasFiltradas` + `emptyMessage` adequado | Baixa | T1.4 | Lista |
| T3.6 | Estilos mínimos em `pages.module.css` (resumo em grid/linha) | Baixa | T3.4 | CSS |
| T3.7 | **Não** alterar fluxo de cadastro / FIXO / form | — | — | Regra |

### Fase 4 — Verificação

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T4.1 | Mês com Ana, Bruno e 1 conjunta: resumo bate com a soma | Baixa | T3 | OK |
| T4.2 | Filtro Conjuntas: só linhas conjuntas; resumo geral inalterado (R1) | Baixa | T3 | OK |
| T4.3 | Filtro Individuais + Ana: só Ana | Baixa | T3 | OK |
| T4.4 | Troca de competência mantém ou reseta filtros (conforme §6) | Baixa | T3 | OK |
| T4.5 | Regressão: cadastrar despesa continua atualizando lista/resumo | Baixa | — | OK |

### Fase 5 — Depois (fora do MVP)

| ID | Task | Complexidade | Nota |
|----|------|--------------|------|
| T5.1 | Query params na API (`escopo`, `responsavelUsuarioId`) | Baixa/Média | Opção B |
| T5.2 | Endpoint/resumo agregado no backend | Média | Opção C |
| T5.3 | Total filtrado destacado além do total geral (R2) | Baixa | Polish |
| T5.4 | Mesmo padrão de filtro/resumo em Receitas (se fizer sentido) | Média | Outro domínio |

---

## 8. Cenários de teste (quando implementar)

| ID | Caso | Esperado |
|----|------|----------|
| C1 | Sem filtro | Lista completa; total geral = soma de tudo |
| C2 | Só Conjuntas | Lista só conjuntas; resumo ainda mostra gerais/por pessoa (R1) |
| C3 | Só Individuais | Sem linhas conjuntas |
| C4 | Responsável = Ana | Só individuais de Ana |
| C5 | Ana sem despesas no mês | Não aparece no breakdown (se §6.4) ou R$ 0,00 |
| C6 | Mês vazio | Totais R$ 0,00; tabela vazia |
| C7 | Helper unitário | Mistura 2 pessoas + conjunta → totais corretos |

---

## 9. Arquivos sugeridos (aditivos)

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DespesasPage.tsx` | Filtros, resumo, lista filtrada |
| `src/pages/pages.module.css` | Layout do resumo / barra de filtros |
| `src/utils/despesasFiltro.ts` (novo) | `filtrarDespesas` |
| `src/utils/despesasResumo.ts` (novo) | `calcularResumoDespesas` |
| `src/utils/despesasFiltro.test.ts` / `despesasResumo.test.ts` | Testes |
| `src/api/despesas.api.ts` | **Sem mudança** no MVP (Opção A) |

**API:** nenhuma mudança obrigatória no MVP.

---

## 10. Fora de escopo (esta fase)

- Implementação de qualquer task T0–T5  
- Alterar cadastro, FIXO 12 meses, ou modelo `EscopoDespesa`  
- Filtros em Receitas/Categorias  
- Remover colunas ou fluxos existentes  

---

## 11. Critérios de pronto do MVP

1. Usuário filtra lista por **Conjuntas** / **Individuais** / **Todas**  
2. Usuário filtra individuais por **responsável**  
3. Resumo do mês mostra **total geral**, **total conjuntas** e **total por responsável**  
4. Cadastro e listagem por competência continuam funcionando  
5. Nenhuma feature não relacionada removida  

---

## 12. Ordem sugerida de entrega

| PR | Conteúdo |
|----|----------|
| PR1 | Fases 1–2 (helpers + testes) |
| PR2 | Fase 3 (UI) + Fase 4 (checagem manual) |

---

## 13. Referências

| Item | Path |
|------|------|
| Página | `src/pages/DespesasPage.tsx` |
| Types | `src/types/despesa.types.ts` |
| Membros API | `src/api/ambientes.api.ts` |
| Listagem API | `ListarDespesasPorCompetenciaService.java` |
| Levantamento responsável | `docs/levantamento-responsavel-despesa.md` |

---

## 14. Próximo passo sugerido

1. Fechar decisões da **§6** (especialmente resumo R1 vs R2).  
2. Aprovar este plano.  
3. Só então autorizar **PR1** (helpers de filtro/resumo).

**Status atual:** MVP implementado (filtro no front + resumo R1 do mês completo).
