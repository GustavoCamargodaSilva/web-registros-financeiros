# Levantamento Técnico

## Objetivo

Alterar a Home do front web (`web-registros-financeiros`) para:

1. Substituir o card **Renda e gastos** (barras horizontais comparativas) por um **gráfico de rosca** que destaque o percentual dos gastos em relação à renda, com legenda/valores de **Gastos** e **Disponível**.
2. Remover da Home os cards **Gastos individuais**, **Ranking categorias** e **Gastos em conjunto**.

Referência visual pedida (exemplo):

- Centro / destaque: `8,49%` + texto `da renda`
- Lateral ou abaixo: `Gastos` → `R$ 4.243` e `Disponível` → `R$ 45.757`

Escopo: somente front web. Sem mudança de API. Sem alteração no app Android neste levantamento.

## Contexto Atual

- Home em `/home` (`HomePage.tsx`), lazy em `App.tsx`.
- Dados: `useDespesasCompetenciaQuery`, `useReceitasCompetenciaQuery`, `useCategoriasQuery` (competência via `CompetenciaContext`).
- Balanço: `calcularBalancoMes` em `homeBalanco.ts` devolve só `totalEntradas` e `totalSaidas` (somas via `calcularResumoReceitas` / `calcularResumoDespesas`).
- Card **Renda e gastos**: duas barras CSS (`barRow` / `barFill`) proporcionais ao `max(entradas, saídas)`.
- Card **Gastos em conjunto**: valor + `% do total de gastos` a partir de `calcularResumoDespesas` (`totalConjuntas` / `totalGeral`).
- Card **Despesas por categoria**: componente `HomeDespesasPorCategoria` — **já usa rosca** (`PieChart` / `Pie` do Recharts `^3.10.1`) com centro em moeda e legenda.
- Card **Ranking categorias**: `HomeRankingCategorias` + CSS próprio; usa `calcularGastosPorCategoria` e `CATEGORY_COLORS`.
- Card **Gastos individuais**: `BarChart` vertical Recharts com `resumoDespesas.porResponsavel`.
- Utilitário `formatPercent` em `format.ts` formata com **até 1 casa** decimal; o mock do usuário usa **2 casas** (`8,49%`).
- Testes unitários existentes: `homeBalanco.test.ts` (só entradas/saídas); não há teste de `HomePage`.
- Docs `features.md` / `architecture.md` não detalham o layout atual dos cinco cards da Home.

## Fluxo Atual

1. Usuário autenticado abre `/home`.
2. Três queries carregam despesas, receitas e categorias da competência.
3. Skeleton exibe placeholders dos cinco cards.
4. Com dados: `calcularBalancoMes`, `calcularGastosPorCategoria`, `calcularResumoDespesas`.
5. Render: Renda e gastos (barras) | Gastos em conjunto | Despesas por categoria (rosca) | Ranking | Gastos individuais (barras).
6. Refresh de competência mantém conteúdo com hint “Atualizando competência…”.

## Fluxo Proposto

1. Mesmas queries (categorias continuam necessárias para **Despesas por categoria**).
2. Estender o cálculo de balanço (ou utilitário dedicado) para:
   - `gastos` = total de despesas do mês (já `totalSaidas`)
   - `renda` = total de receitas (já `totalEntradas`)
   - `disponivel` = `renda - gastos`
   - `percentualDaRenda` = se `renda > 0`, `(gastos / renda) * 100`; senão regra de borda (ver Pendências)
3. Card **Renda e gastos** passa a rosca de **duas fatias** (Gastos × Disponível) quando `renda > 0` e os valores forem representáveis; centro com percentual + “da renda”; ao lado/abaixo labels Gastos e Disponível com `formatCurrency`.
4. Remover da árvore da Home: card conjunto, `HomeRankingCategorias`, card individuais (e imports Recharts de barra só usados ali).
5. Manter **Despesas por categoria**.
6. Ajustar skeleton da Home ao novo conjunto de cards (2 cards relevantes + possível layout).

Semântica verificada no exemplo: `4243 / (4243 + 45757) = 4243 / 50000 = 8,486%` ≈ **8,49%** — o percentual é **gastos ÷ renda**, e **disponível = renda − gastos**.

## Arquivos Envolvidos

| Arquivo | Motivo | Impacto | Responsabilidade | Dependências |
|---------|--------|---------|------------------|--------------|
| `src/pages/HomePage.tsx` | Troca visual do balanço; remover 3 cards; limpar memos/imports | Alto | Orquestra Home | hooks, utils, filhos |
| `src/pages/home.module.css` | Remover estilos só de barras/highlight/individuais se órfãos; estilos da nova rosca (ou módulo do filho) | Médio | Layout Home | tokens CSS |
| `src/utils/homeBalanco.ts` | Estender modelo com disponível + percentual | Alto | Cálculo puro | resumos receita/despesa |
| `src/utils/homeBalanco.test.ts` | Cobrir novas métricas e bordas | Médio | Testes | vitest |
| `src/utils/format.ts` | `formatPercent` hoje ≤1 casa; mock pede 2 | Baixo–médio | Formatação | — |
| Novo componente opcional (ex. sob `pages/` ou `components/`) | Isolar rosca renda/gastos (espelhar padrão do donut de categorias) | Médio | UI do card | Recharts, Card, format |
| `src/pages/HomeDespesasPorCategoria.tsx` (+ `.module.css`) | Referência de padrão donut; **permanece** | Baixo (leitura) | Donut categorias | Recharts |
| `src/pages/HomeRankingCategorias.tsx` (+ `.module.css`) | Remoção do uso na Home; exclusão do módulo se não houver outro import | Alto (remoção) | Ranking | cores, gastos por categoria |
| `src/utils/homeCategoryColors.ts` | Continua usado pelo donut de categorias | Baixo | Paleta | HomeDespesasPorCategoria |
| `src/utils/homeGastosPorCategoria.ts` (+ test) | Continua para categorias | Baixo | Agregação | — |
| `src/utils/despesasResumo.ts` | Hoje alimenta conjunto/individuais na Home; após remoção pode deixar de ser importado em `HomePage` (ainda usado em outras telas — verificar) | Baixo–médio | Resumo despesas | — |
| `src/hooks/queries/useFinanceQueries.ts` | Sem mudança de contrato | Nenhum | Queries | — |
| `docs/features.md` | Opcional: atualizar descrição da Home após implementação | Baixo | Docs | — |
| `PERFORMANCE_FRONTEND_REPORT.md` | Menciona `individuaisData` / barras Home — fica desatualizado (não bloqueia) | Documental | Relatório antigo | — |

## Classes Envolvidas

No front não há classes OOP; unidades relevantes:

| Unidade | Responsabilidade | Dependências | Acoplamento | Impactos | Alteração |
|---------|------------------|--------------|-------------|----------|-----------|
| `HomePage` | Layout e wiring da Home | Queries, balanço, filhos | Alto na página | Principal ponto de mudança | **Sim** |
| `calcularBalancoMes` | Totais renda/gastos | Resumos | Baixo | Base do percentual/disponível | **Sim** (estender retorno) |
| `HomeDespesasPorCategoria` | Rosca por categoria | Recharts, cores | Médio | Mantido; padrão visual a reutilizar | **Não** (salvo alinhamento visual opcional) |
| `HomeRankingCategorias` | Ranking | itens categoria | Baixo | Deixa de ser usado na Home | **Remover uso**; arquivo deletável se órfão |
| `calcularResumoDespesas` | Conjuntas / por responsável | Despesas | Médio | Home deixa de consumir para os cards removidos | **Não** alterar a função |
| `formatCurrency` / `formatPercent` | Exibição | Intl | Baixo | Casas do % | Avaliar `formatPercent` ou formatador local do card |
| `Card` | Container visual | — | Baixo | Continua | **Não** |

## Dependências

- **Já existentes:** React, Recharts (`Pie`/`PieChart` já no projeto), Vitest, CSS modules, tokens (`--color-success`, `--color-danger`, etc.).
- **Não** introduzir biblioteca nova de gráficos.
- API inalterada: totais continuam derivados no cliente a partir das listagens da competência (mesmo padrão atual da Home).

## Impactos

- UX: Home mais enxuta (foco em % da renda comprometida + categorias).
- Perde-se na Home a visão rápida de gastos conjuntos, ranking e gastos por responsável (ainda acessíveis indiretamente via listagem de despesas/filtros).
- Possível redução de bundle da rota Home (menos `BarChart` / menos componente ranking), se o tree-shaking de Recharts permitir.
- Skeleton e grid `gridTwo` precisam reavaliar ocupação (2 cards vs 5).
- Documentação de performance antiga cita código que deixará de existir.

## Riscos

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Renda = 0 com gastos > 0 | Alta | Definir UI: empty, “sem renda”, ou só valor de gastos sem % |
| Gastos > renda (disponível negativo / % > 100) | Alta | Fatia única ou clamp visual + texto explícito; não inventar renda |
| Duas casas no % vs `formatPercent` de 1 casa | Baixa | Acordo de produto; formatar no card |
| Confundir “% da renda” com “% do donut de categorias” | Média | Título/centro claros (“da renda”) |
| Remover arquivos ranking e quebrar import residual | Baixa | Busca de referências antes de deletar |
| Acessibilidade do centro absoluto da rosca | Média | Texto acessível (`aria`) além de `aria-hidden` no overlay, se houver |
| Layout mobile da rosca + legenda | Baixa | Reusar padrão responsivo de `HomeDespesasPorCategoria` |

## Performance

- Cálculo O(n) já feito nos resumos; acrescentar duas operações aritméticas é irrelevante.
- Remover 2 charts (ranking/barras) e 1 card reduz trabalho de render na Home.
- Manter `useMemo` no balanço estendido.
- Sem N+1 novo: mesmas três queries.
- Evitar recriar `contentStyle` do Tooltip a cada render (já notado no relatório de performance; seguir padrão existente ou estabilizar).

## Arquitetura

- Manter cálculo puro em `homeBalanco` (testável) e UI no componente da Home/filho — alinhado ao padrão atual (`calcularGastosPorCategoria` + `HomeDespesasPorCategoria`).
- SRP: não misturar agregação de categorias com balanço renda/gastos.
- Não mover regra para a API neste escopo.
- Remoção dos três cards não exige refactor amplo; apenas enxugar `HomePage` e arquivos órfãos.
- Reutilizar padrão de rosca já consolidado (Recharts + centro overlay + legenda) em vez de CSS-only donut paralelo, salvo decisão explícita em contrário.

## Design Patterns

| Pattern | Aplicação | Benefício | Impacto |
|---------|-----------|-----------|---------|
| **Mapper / função pura de domínio de UI** | Estender `calcularBalancoMes` (ou renomear semanticamente o retorno) | Testes unitários do % e disponível | Baixo |
| **Composition** | Card filho dedicado à rosca renda/gastos | Espelha `HomeDespesasPorCategoria`; `HomePage` mais legível | Médio (arquivo novo opcional) |

Não há ganho real de Strategy/Factory/etc. para este UI change.

## Segurança

- Sem novos endpoints, tokens ou PII.
- Valores monetários já exibidos na Home; mascaramento em log N/A (front sem SLF4J).
- Validar divisão por zero na camada de cálculo para não gerar `Infinity`/`NaN` na UI.
- Autorização inalterada (mesmas queries autenticadas por ambiente).

## Logs (SLF4J)

**Conflito com o skill:** o skill pede SLF4J; este repositório é Vite/React e **não usa SLF4J**. Não introduzir SLF4J.

Esta feature é de apresentação: **sem logs de runtime necessários**. Erros de query já fluem pelos hooks existentes.

## Estratégia TDD

Ordem sugerida:

1. **Red/green** em `homeBalanco` (ou util derivado):  
   - Positivo: renda 50000, gastos 4243 → disponível 45757, percentual ≈ 8,486…  
   - Zero lançamentos → zeros / percentual nulo  
   - Renda 0, gastos > 0 → comportamento acordado  
   - Gastos > renda → disponível negativo e % > 100 (ou regra acordada)  
   - Mocks: nenhum (funções puras + fixtures de `Receita`/`Despesa` como no teste atual)

2. Formatação do percentual (se extrair helper com 2 casas): casos `8.486` → `8,49%`.

3. UI: sem teste de componente obrigatório no padrão atual da Home; verificação manual (Critérios de Aceite). Opcional: smoke RTL se o time quiser.

Não gerar suíte E2E nova neste levantamento.

## Quebra em Tasks

### Task 1 — Fechar regras de cálculo e bordas

- **Objetivo:** Definir fórmulas e casos extremos antes da UI.
- **Descrição:** Confirmar `disponivel = renda - gastos`, `% = gastos/renda*100`, casas decimais (2 vs 1), comportamento renda zero e gastos > renda.
- **Arquivos:** apenas este levantamento / resposta de produto.
- **Critério de aceite:** Pendências 1–3 resolvidas por escrito.
- **Dependências:** Nenhuma.
- **Complexidade:** Baixa.
- **Riscos:** Implementar UI sem regra de borda.
- **TDD:** Casos de teste listados na Estratégia TDD.
- **Observações:** Bloqueia Tasks 2–3 de forma segura.

### Task 2 — Estender `calcularBalancoMes` + testes

- **Objetivo:** Expor disponível e percentual de forma testável.
- **Descrição:** Ampliar `BalancoMes` (campos novos) sem quebrar callers; atualizar `homeBalanco.test.ts`.
- **Arquivos:** `homeBalanco.ts`, `homeBalanco.test.ts`.
- **Critério de aceite:** Testes cobrindo exemplo do usuário e bordas acordadas; `./` vitest verde no arquivo.
- **Dependências:** Task 1.
- **Complexidade:** Baixa.
- **Riscos:** Quebrar tipagem se outros imports esperarem só 2 campos (hoje só `HomePage`).
- **TDD:** Unitários primeiro.

### Task 3 — UI da rosca “Renda e gastos”

- **Objetivo:** Substituir barras pelo donut + labels Gastos/Disponível + centro “% da renda”.
- **Descrição:** Implementar no `HomePage` ou componente filho, reutilizando padrão Recharts de `HomeDespesasPorCategoria` (inner/outer radius, centro overlay). Duas fatias: gastos e disponível (quando aplicável). Cores alinhadas a `--color-danger` / `--color-success` ou tokens existentes.
- **Arquivos:** `HomePage.tsx`, `home.module.css` e/ou novo módulo CSS/componente.
- **Critério de aceite:** Visual coerente com o mock; empty state quando sem lançamentos; hard refresh ok.
- **Dependências:** Task 2.
- **Complexidade:** Baixa–média.
- **Riscos:** Overlay do centro desalinhado; tooltip confuso.
- **TDD:** Cálculo já coberto; UI manual.
- **Observações:** Não alterar o donut de categorias nesta task.

### Task 4 — Remover Gastos em conjunto, Ranking e Gastos individuais

- **Objetivo:** Tirar os três blocos da Home.
- **Descrição:** Remover JSX, memos (`individuaisData`, uso de `resumoDespesas` se só servia a esses cards), imports `Bar`/`BarChart`/`HomeRankingCategorias`. Remover arquivos `HomeRankingCategorias.tsx` / `.module.css` se ficarem órfãos. Limpar CSS morto em `home.module.css` (barras antigas, highlight de conjunto, `chartWrap` se só individuais).
- **Arquivos:** `HomePage.tsx`, `home.module.css`, `HomeRankingCategorias.*`.
- **Critério de aceite:** Home não exibe os três títulos; busca no repo sem imports quebrados; build/typecheck ok.
- **Dependências:** Pode paralelizar com Task 3 após Task 2, mas ideal após ou junto da 3 para um único estado de skeleton.
- **Complexidade:** Baixa.
- **Riscos:** Deletar util ainda usado em outro lugar (validar `despesasResumo`, `homeCategoryColors`).
- **TDD:** N/A além de garantir testes de utils não quebrados.

### Task 5 — Skeleton, grid e revisão visual

- **Objetivo:** Loading e layout coerentes com 2 cards principais (+ categorias).
- **Descrição:** Atualizar `HomeSkeleton`; revisar `gridTwo` (categorias pode ocupar largura total ou segunda coluna). Checagem mobile/desktop.
- **Arquivos:** `HomePage.tsx`, `home.module.css`.
- **Critério de aceite:** Skeleton não menciona cards removidos; layout sem buracos óbvios.
- **Dependências:** Tasks 3–4.
- **Complexidade:** Baixa.
- **Riscos:** Densidade visual desigual vs donut de categorias.
- **TDD:** Manual.

### Task 6 — Docs leves (opcional)

- **Objetivo:** Alinhar `docs/features.md` se descrever a Home.
- **Descrição:** Uma frase sobre cards atuais.
- **Arquivos:** `docs/features.md`.
- **Critério de aceite:** Texto não cita ranking/individuais/conjunto na Home.
- **Dependências:** 3–4.
- **Complexidade:** Baixa.
- **Riscos:** Nenhum.
- **TDD:** N/A.

## Critérios Gerais de Aceite

1. Card **Renda e gastos** mostra rosca com destaque percentual **da renda** e valores de **Gastos** e **Disponível**.
2. Exemplo equivalente ao mock: renda 50.000 / gastos 4.243 → disponível 45.757 e ~8,49% (conforme casas acordadas).
3. Cards **Gastos individuais**, **Ranking categorias** e **Gastos em conjunto** não aparecem na Home.
4. **Despesas por categoria** permanece.
5. Sem alteração de API / contratos HTTP.
6. Testes de `homeBalanco` cobrem o novo cálculo.
7. Estados vazios e bordas (renda zero / estouro) tratados conforme Task 1.
8. Nenhuma introdução de SLF4J ou lib de chart nova.

## Pendências

1. Casas decimais do percentual: **2** (mock `8,49%`) ou manter `formatPercent` (1 casa)?
2. Renda = 0 e gastos > 0: qual UI?
3. Gastos > renda: mostrar disponível negativo e fatia >100%, ou mensagem “gastos acima da renda”?
4. Título do card permanece “Renda e gastos” ou muda (ex. “Comprometimento da renda”)?
5. Ordem das fatias/cores: gastos em vermelho (`--color-danger`) e disponível em verde (`--color-success`)?
6. Remover fisicamente `HomeRankingCategorias.*` ou só desconectar da Home?
7. App Android tem cards equivalentes — **fora deste escopo**; alinhar depois se desejado.

## Dúvidas Técnicas

1. O percentual no centro deve usar exatamente **duas casas** pt-BR?
2. Com renda zero, ocultamos a rosca ou mostramos só gastos?
3. Disponível negativo deve aparecer em vermelho e/ou com rótulo diferente (“Excedente”)?
4. A legenda Gastos/Disponível fica **ao lado** da rosca (como categorias) ou **abaixo** em duas linhas como no mock textual?
5. Devemos exibir também o valor total da **renda** em algum lugar do card, ou só gastos + disponível + %?

## Approach

### Como se chegou às conclusões

Leitura direta do front web, sem alterar código:

- `HomePage.tsx` (cinco cards, skeleton, memos)
- `home.module.css`
- `homeBalanco.ts` + `homeBalanco.test.ts`
- `HomeDespesasPorCategoria.tsx` + CSS (padrão donut Recharts)
- `HomeRankingCategorias.tsx`
- `format.ts` (`formatCurrency`, `formatPercent`)
- `package.json` (Recharts)
- Busca por referências Home/ranking/individuais/conjunto
- Amostra de `docs/features.md`

Confirmação: não há endpoint de dashboard; tudo é agregação cliente — o novo %/disponível segue o mesmo modelo.

### Decisões

- Alvo: **somente** `web-registros-financeiros`.
- Saída: `docs/levantamento-grafico-renda-gastos.md` (nome específico; evita colidir com outros levantamentos e deixa claro o tema).
- Reutilizar Recharts/`Pie` já usado na Home; não propor lib nova.
- Estender `homeBalanco` em vez de recalcular inline na UI.
- Remover ranking/conjunto/individuais da Home; manter donut de categorias.
- Registrar conflito skill SLF4J × stack React.

### Alternativas descartadas

- Recriar o card só com CSS conic-gradient sem Recharts (possível, mas diverge do padrão já estabelecido na mesma página).
- Pedir `GET /dashboard` na API (fora do pedido; Home já agrega localmente).
- Alterar app Android em paralelo (usuário pediu front).
- Manter ranking “escondido” sem deletar uso — pedido é tirar os gráficos.

### Riscos residuais

Principal risco de produto: **bordas renda zero / gastos > renda** sem regra clara. Principal risco técnico: desalinhamento visual entre a nova rosca e a de categorias se não reutilizar o mesmo padrão de layout.
