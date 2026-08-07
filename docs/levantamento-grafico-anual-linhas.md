# Levantamento Técnico

## Objetivo

Incluir na Home do front web (`web-registros-financeiros`), **abaixo** das duas representações já existentes (**Renda e gastos** e **Despesas por categoria**), um bloco de **largura total** com:

1. Gráfico de **linha** dos valores **recebidos** (receitas) ao longo do ano.
2. Abaixo, outro gráfico de **linha** das **despesas** ao longo do ano.
3. Permitir visualizar se as despesas **subiram ou baixaram** no recorte anual (variação temporal).

Escopo deste levantamento: análise para implementação. Sem alteração de código neste turno.

## Contexto Atual

- Home (`HomePage.tsx`): grid `gridTwo` com `HomeRendaGastos` + `HomeDespesasPorCategoria`; skeleton espelha só esses dois cards.
- Dados da Home hoje: **apenas a competência selecionada** (`ano`, `mes` via `CompetenciaContext`) — `useDespesasCompetenciaQuery(ano, mes)` e `useReceitasCompetenciaQuery(ano, mes)`.
- API (verificado em controllers e clients):
  - `GET /api/v1/despesas?ano=&mes=` — **obrigatórios** ano e mês; lista do mês.
  - `GET /api/v1/receitas?ano=&mes=` — idem; resposta com lista + totais do mês.
  - Repositórios JPA: `findByAmbienteIdAndAnoAndMes` — **não** há listagem “só por ano” no código atual.
- Front: `despesasApi.listarPorCompetencia` / `receitasApi.listarPorCompetencia`; React Query keys por `(ano, mes)`.
- Gráficos: Recharts `^3.10.1` já usado (`PieChart` na Home). **Não** há `LineChart` em uso no `src/` hoje.
- Formatação útil já existente: `formatCurrency`, `formatEixoCompacto` (eixos sem moeda).
- `ANO_BASE = 2026` no seletor de competência.
- Não existe endpoint de dashboard/série temporal anual.

## Fluxo Atual

1. Usuário em `/home` com competência `(ano, mes)`.
2. Três queries: despesas do mês, receitas do mês, categorias.
3. Cards superiores agregam só aquele mês.
4. Não há série mensal no cliente além do mês corrente da Home.

## Fluxo Proposto

1. Manter os dois cards superiores (mês atual).
2. Abaixo, seção full-width (ex.: `grid-column: 1 / -1`) com dois line charts empilhados:
   - superior: totais de **receitas** por mês (1…12) do **ano de referência**;
   - inferior: totais de **despesas** por mês (1…12) do mesmo ano.
3. Obter 12 competências do ano (e, se a variação “anual” exigir comparação YoY, também o ano anterior — ver Pendências).
4. Agregar totais mensais com as mesmas funções de resumo já usadas (`calcularResumoReceitas` / `calcularResumoDespesas` ou equivalente sobre listas).
5. Exibir variação das despesas (MoM e/ou YoY / delta absoluto e %), conforme decisão de produto.
6. Loading/empty: skeleton full-width; meses sem lançamento = zero na série (não omitir o mês, para o eixo anual ficar contínuo), salvo decisão contrária.

**Bloqueio estrutural:** com a API atual, uma série de 12 meses exige **12 GETs de despesas + 12 GETs de receitas** (24 chamadas) por ano carregado — ou evolução da API para listar/agregar por ano.

## Arquivos Envolvidos

| Arquivo | Motivo | Impacto | Responsabilidade | Dependências |
|---------|--------|---------|------------------|--------------|
| `src/pages/HomePage.tsx` | Inserir bloco full-width; wiring de dados anuais; skeleton | Alto | Orquestra Home | hooks, filhos |
| `src/pages/home.module.css` | Classe full-width sob `gridTwo` | Médio | Layout | tokens |
| Novo componente Home (ex. série anual) + CSS module | Dois `LineChart` empilhados + rótulos de variação | Alto | UI | Recharts, format |
| `src/utils/homeBalanco.ts` / resumos | Reuso de totais; possível util `serieMensalAno` | Médio | Agregação pura | tipos Despesa/Receita |
| Novo util + testes (série / variação) | Pontos `{ mes, total }` e deltas | Alto | Domínio de UI | vitest |
| `src/hooks/queries/useFinanceQueries.ts` | Hook(s) para buscar N competências (ex. `useQueries`) | Alto | Data fetching | React Query, APIs |
| `src/hooks/queries/queryKeys.ts` | Keys por mês já existem; possível key agregada `ano` | Médio | Cache | — |
| `src/api/despesas.api.ts` / `receitas.api.ts` | Sem mudança se reusar listagem mensal; mudança se novo contrato anual | Condicional | HTTP | client |
| `src/context/CompetenciaContext.tsx` | Ano da série = `ano` da competência (leitura) | Baixo | Estado global mês/ano | — |
| `src/utils/format.ts` | Eixo e tooltips | Baixo | Formatação | — |
| **API** `DespesasController` / `ReceitasController` + services + repositories | **Opcional** se produto exigir `GET` por ano (agregado ou lista anual) | Alto se escolhido | Backend | JPA |
| `docs/levantamento-grafico-renda-gastos.md` | Contexto da Home atual (2 cards) | Leitura | Docs | — |

## Classes Envolvidas

Front sem classes OOP; unidades:

| Unidade | Responsabilidade | Dependências | Acoplamento | Impactos | Alteração |
|---------|------------------|--------------|-------------|----------|-----------|
| `HomePage` | Layout Home | Queries mês + futura série | Alto | Adiciona seção anual | **Sim** |
| `HomeRendaGastos` / `HomeDespesasPorCategoria` | Cards mês | Balanço / categorias | Médio | Permanecem acima | **Não** (salvo layout) |
| `useDespesasCompetenciaQuery` / `useReceitasCompetenciaQuery` | 1 mês | APIs | Médio | Base para N meses | **Estender** ou novo hook |
| `despesasApi` / `receitasApi` | HTTP competência | `apiRequest` | Baixo | Reuso ou novo método | Condicional |
| `calcularResumoDespesas` / `calcularResumoReceitas` | Totais do mês | Listas | Baixo | Alimentam pontos da linha | **Reuso** |
| `ListarDespesasPorCompetenciaService` / `ListarReceitasPorCompetenciaService` | Backend mês | Repos | Médio | Limite atual ano+mês | **Só se** novo endpoint |
| Controllers despesas/receitas | Expõem GET | Services | Baixo | Contrato HTTP | **Só se** API anual |

## Dependências

- **Existentes:** React 19, React Query 5, Recharts 3 (`LineChart` / `Line` / `XAxis` / `YAxis` / `Tooltip` / `ResponsiveContainer` — componentes da lib já instalada, ainda não usados no projeto).
- **Não** há lib de chart alternativa no `package.json`.
- Backend atual **não** entrega série anual pronta.

## Impactos

- Home passa a depender de dados de **até 12 (ou 24) competências**, não só do mês aberto.
- Carga de rede e cache React Query crescem; invalidação ao mudar lançamentos precisa cobrir o ano (hoje `invalidate.despesas(ano, mes)` é pontual).
- UX: visão de tendência anual alinhada ao `ano` do seletor; troca de mês não deveria refazer o ano inteiro se o ano for o mesmo (cache).
- Se API anual for criada: muda `api-registros-financeiros` + client web (dois repos / dois PRs).

## Riscos

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| 24 requests paralelas (12×2) por abertura da Home | Alta | `useQueries` + staleTime; ou endpoint anual agregado |
| Ambiguidade “variação anual” (MoM vs YoY vs total ano) | Alta | Fechar em Pendências antes de UI |
| Meses futuros do ano corrente vazios distorcem leitura | Média | Cortar série até mês atual **ou** marcar projeção; decidir |
| Invalidação incompleta após CRUD | Média | Invalidar prefixo `['despesas', ano]` / `['receitas', ano]` |
| Escala Y diferente entre receitas e despesas | Baixa | Dois charts separados (pedido) já isolam escalas |
| `ANO_BASE` 2026 limita histórico | Baixa | Série só a partir do ano permitido pelo produto |
| Inventar endpoint sem alinhamento API | Alta | Escolher explicitamente estratégia A (só front) ou B (API) |

## Performance

- **Consultas:** pior caso 24 GETs; com cache React Query, remount reutiliza. Preferir paralelismo controlado (`useQueries`), não waterfall.
- **Agregação:** 12× O(n_mês) no cliente — aceitável se payloads mensais forem pequenos (padrão atual da Home).
- **N+1 HTTP:** exatamente o risco da estratégia só-front; API agregada por ano elimina N+1 de competências.
- **Render:** dois `LineChart` full-width; memoizar array de pontos; evitar inline objects instáveis no Tooltip se já for preocupação no projeto.
- **Alternativa API:** um ou dois GETs (`?ano=`) com soma server-side — melhor para mobile futuro / Home pesada.

## Arquitetura

- Separar: (1) obtenção de dados anuais, (2) agregação pura testável, (3) apresentação Recharts.
- Cards mensais não devem recalcular a série; série depende do **ano**, não do mês (mês só para “até onde desenhar” se essa regra for adotada).
- Open/Closed: novo componente sob a Home sem reescrever os donuts.
- Decisão API vs multi-fetch é o ponto arquitetural central — não misturar os dois no mesmo PR sem necessidade.

### Estratégias de dados (sem inventar contrato)

**A — Só front (API atual)**  
`useQueries` para `mes = 1..12` com `listarPorCompetencia(ano, mes)` em despesas e receitas. Reusa cache das keys existentes quando o usuário já visitou um mês.

**B — Evolução API (recomendável se a Home crescer)**  
Novo contrato explícito (ex. listar/agregar por `ano` sem `mes`, ou DTO de totais mensais). Exige implementação e testes no repo `api-registros-financeiros`. **Não existe hoje** — seria feature nova, não método inventado.

## Design Patterns

| Pattern | Por quê | Benefício | Impacto |
|---------|---------|-----------|---------|
| **Mapper / função pura** | Lista mensal → pontos do gráfico + variação | TDD sem Recharts | Novo util |
| **Composition** | Seção anual como filho da Home | SRP vs `HomePage` inchada | Componente novo |
| **Facade (hook)** | Encapsular 12/24 queries | Home não conhece o fan-out | Hook novo |

Não há ganho real de Strategy salvo duas fontes de dados (A vs B) no futuro.

## Segurança

- Mesma autenticação / `X-Ambiente-Id` das listagens atuais.
- Sem PII nova nos gráficos (só totais monetários já visíveis na Home).
- Não logar payloads completos no console em produção.
- Divisão por zero na variação percentual (mês anterior = 0) precisa de regra explícita.

## Logs (SLF4J)

**Conflito com o skill:** front React **não usa SLF4J**. Não introduzir.

Se a estratégia B tocar a API Java: aí sim SLF4J nos services (INFO de competência/ano, ERROR em falha, sem dados pessoais). Na estratégia A (só web): sem logs novos obrigatórios; erros seguem `useApiFeedback` / hooks atuais.

## Estratégia TDD

1. **Util de série mensal (unitário)**  
   - Positivo: 12 meses com totais conhecidos.  
   - Zeros em meses vazios.  
   - Variação MoM: sobe / desce / estável.  
   - Borda: mês 1 sem anterior; divisão por zero.  
   - Mocks: fixtures Despesa/Receita (padrão `homeBalanco.test.ts`).

2. **Hook de fetch (integração leve / mock MSW ou mock de API)** — opcional no padrão do repo (hoje poucos testes de hooks).

3. **UI:** verificação manual (Critérios); sem obrigação de RTL para chart Recharts.

Não gerar E2E neste levantamento.

## Quebra em Tasks

### Task 1 — Fechar escopo de variação e ano

- **Objetivo:** Definir métrica “subiu/baixou” e ano de referência.
- **Descrição:** Escolher MoM, YoY por mês, e/ou delta total ano vs ano anterior; se série corta em meses futuros; se ano = `CompetenciaContext.ano`.
- **Arquivos:** só decisão / este doc.
- **Critério de aceite:** Pendências 1–4 respondidas.
- **Dependências:** Nenhuma.
- **Complexidade:** Baixa.
- **Riscos:** UI ambígua.
- **TDD:** casos derivados da decisão.
- **Observações:** Bloqueia Tasks 3–5.

### Task 2 — Escolher estratégia de dados (A ou B)

- **Objetivo:** Multi-fetch front vs novo endpoint API.
- **Descrição:** Registrar escolha; se B, abrir escopo no repo API (controllers/services/repos/testes).
- **Arquivos:** decisão; se B, arquivos da API listados acima.
- **Critério de aceite:** Uma estratégia documentada e alinhada.
- **Dependências:** Task 1 (parcialmente independente).
- **Complexidade:** Baixa (decisão) / Alta (se B implementar API).
- **Riscos:** 24 requests sem aceite de performance.
- **Observações:** MVP pode ser A; B como melhoria.

### Task 3 — Util puro: série + variação

- **Objetivo:** Funções testáveis `{ mes, totalReceitas, totalDespesas, variacaoDespesas? }`.
- **Descrição:** Agregar a partir de mapas mês→listas ou totais; calcular deltas conforme Task 1.
- **Arquivos:** novo util + `*.test.ts` em `src/utils/`.
- **Critério de aceite:** Vitest verde com casos positivos/borda.
- **Dependências:** Task 1.
- **Complexidade:** Baixa.
- **Riscos:** Formato de rótulo de mês inconsistente.
- **TDD:** primeiro (red/green).

### Task 4 — Hook de carregamento anual

- **Objetivo:** Buscar dados do ano sem bloquear os cards mensais indevidamente.
- **Descrição:** `useQueries` (estratégia A) ou client do novo GET (B); estados loading/error parciais; reutilizar `queryKeys` mensais.
- **Arquivos:** `useFinanceQueries.ts`, `queryKeys.ts`, APIs se B.
- **Critério de aceite:** Trocar só o mês não refetcha os 12 se cache hit do mesmo ano; troca de ano refetcha.
- **Dependências:** Task 2–3.
- **Complexidade:** Média.
- **Riscos:** Waterfall; error em 1 mês derruba tudo — decidir fail parcial.
- **TDD:** mock de API se houver padrão; senão manual.

### Task 5 — UI dois LineCharts full-width

- **Objetivo:** Representação pedida abaixo dos dois cards.
- **Descrição:** Componente com título(s), linha de receitas, linha de despesas abaixo, tooltip/`formatCurrency`, eixo com `formatEixoCompacto` ou ticks 1–12; indicador visual de alta/baixa das despesas (cor/texto).
- **Arquivos:** novo componente + CSS; `HomePage.tsx`; `home.module.css` (`grid-column: 1 / -1`).
- **Critério de aceite:** Largura total no desktop; empilhamento correto; mobile legível.
- **Dependências:** Task 3–4.
- **Complexidade:** Média.
- **Riscos:** Densidade visual; acessibilidade do SVG.
- **TDD:** manual.

### Task 6 — Skeleton, empty e invalidação

- **Objetivo:** Loading coerente e cache correto pós-CRUD.
- **Descrição:** Skeleton full-width; empty ano sem dados; ao salvar despesa/receita, invalidar queries do ano afetado (além do mês).
- **Arquivos:** `HomePage`, `useInvalidateFinanceQueries.ts`.
- **Critério de aceite:** Após cadastrar despesa no mês X, a linha anual reflete o novo total sem hard refresh (ou após invalidate explícito).
- **Dependências:** Task 4–5.
- **Complexidade:** Baixa–média.
- **Riscos:** Stale chart.
- **TDD:** manual + unitário do invalidate se extrair helper.

### Task 7 — (Opcional) Endpoint anual na API

- **Objetivo:** Só se Task 2 = B.
- **Descrição:** Contrato, service, query JPA por `ambienteId + ano`, testes, docs API.
- **Arquivos:** controllers/services/repos/DTOs em `api-registros-financeiros`.
- **Critério de aceite:** Um GET (ou dois) substitui o fan-out de 12.
- **Dependências:** Task 2 = B.
- **Complexidade:** Média–alta.
- **Riscos:** Paginação/tamanho se devolver todas as linhas do ano sem agregar.
- **Observações:** Preferir DTO de **totais mensais** se o gráfico só precisa de soma.
- **Logs:** SLF4J INFO/ERROR no service, sem PII.

## Critérios Gerais de Aceite

1. Abaixo dos dois cards atuais, bloco full-width com **duas** séries em linha: receitas e despesas (despesas abaixo).
2. Eixo temporal cobre o ano de referência (12 meses ou regra cortada acordada).
3. Usuário consegue perceber alta/baixa das despesas conforme métrica acordada.
4. Cards mensais existentes continuam corretos para a competência selecionada.
5. Sem lib de chart nova (Recharts).
6. Testes unitários da agregação/variação.
7. Estratégia de dados (A ou B) documentada e implementada de ponta a ponta.
8. Sem SLF4J no front; API só se B.

## Pendências

1. Ano da série = sempre o `ano` do seletor de competência?
2. Variação desejada: **mês a mês (MoM)**, **mesmo mês vs ano anterior (YoY)**, **total do ano vs ano anterior**, ou combinação?
3. Meses futuros do ano corrente: mostrar zero, ocultar, ou cortar a linha no mês atual?
4. Estratégia de dados: **A (24 GETs)** no MVP ou já **B (API anual)**?
5. Um card com dois charts empilhados ou dois cards full-width separados?
6. Exibir valores absolutos nos pontos / só tooltip?
7. Alinhar depois no app Android? (fora deste escopo web)

## Dúvidas Técnicas

1. “Anualmente” refere-se à visão dos **12 meses do ano** ou à comparação **entre anos**?
2. Aceita-se o custo de até 24 requests no MVP web?
3. Em falha de um mês na série, a UI mostra buraco, zero, ou erro global?
4. Cores: receitas = `--color-success`, despesas = `--color-danger` (como na rosca)?
5. Precisa de seletor de ano próprio no bloco, independente da competência?

## Approach

### Como se chegou às conclusões

Análise somente leitura:

- `HomePage.tsx` (layout atual pós-rosca)
- `useFinanceQueries.ts`, `queryKeys.ts`
- `despesas.api.ts`, `receitas.api.ts`
- `CompetenciaContext.tsx`, `constants/competencia.ts`
- Controllers e services de listagem por competência na API
- Repositórios `findByAmbienteIdAndAnoAndMes`
- `package.json` (Recharts presente; sem LineChart no código ainda)
- Utilitários de resumo/format já usados na Home

Confirmado: **não há** API de série anual; a Home hoje é estritamente mensal.

### Decisões

- Repo alvo: `web-registros-financeiros` (e API **somente** se estratégia B).
- Saída: `docs/levantamento-grafico-anual-linhas.md` (nome específico; não sobrescrever outros levantamentos).
- Dois charts empilhados full-width, conforme pedido.
- Destacar o bloqueio de dados e as duas estratégias reais (multi-fetch vs novo endpoint).
- Conflito skill SLF4J × front React registrado.

### Alternativas descartadas

- Um único `LineChart` com duas linhas no mesmo eixo — contradiz “abaixo outra representação”.
- Inventar `GET` anual sem flag de produto/API.
- Usar só o mês atual para fingir série anual.

### Riscos residuais

Principal: **ambiguidade da variação “anual”** + **custo/contrato de dados**. Sem Task 1–2 fechadas, a UI pode ser construída sobre a métrica errada ou com fan-out HTTP inaceitável.
