# Levantamento — Barras e colunas harmonizadas (tabelas, filtros e formulários)

> **Status:** Implementação **revertida** em 05/08/2026 — alterações de alinhamento retiradas do código; documento mantido como referência.
> **Data:** 05/08/2026
> **Escopo:** Harmonizar larguras das “barras” horizontais do front (`web-registros-financeiros`): cabeçalhos de tabela, linhas de filtro e grades de formulário, com comportamento responsivo consistente em todas as telas.
> **Referência visual:** cabeçalho da tabela de Despesas com colunas desalinhadas (marcado em amarelo pelo usuário).

---

## 1. Regras de preservação (obrigatórias)

Estas regras valem para **todas** as tasks deste documento:

1. **Não excluir** classes CSS, componentes, hooks, utilitários, colunas de tabela ou testes existentes que não sejam objeto direto de uma task listada aqui.
2. **Não remover** implementações de responsividade já entregues (`DataTable` modo card, drawer, `formNarrow`, etc.) — apenas complementar ou ajustar.
3. **Não alterar** a camada `src/api/**`, `src/types/**` nem regras de negócio em `src/utils/**`.
4. **Não trocar** a stack de estilos (continua CSS Modules + tokens em `src/styles/tokens.css`).
5. **Aditivo por padrão:** preferir tokens/presets novos e props opcionais; defaults devem preservar o comportamento atual onde possível.
6. **Não alterar** contratos de rota, permissões nem a estrutura de dados das páginas.

---

## 2. Problema reportado

O usuário observou que as **barras horizontais** (cabeçalhos de tabela, filtros e campos de formulário) aparecem **desarmonizadas** entre si e entre telas: colunas com larguras visuais incoerentes, espaços vazios desproporcionais e campos que não ocupam a mesma largura na linha.

**Expectativa:**
- Todos os campos/colunas de uma mesma barra com **largura uniforme** (ou proporcional de forma previsível).
- Comportamento **responsivo** coerente em desktop, tablet e mobile.
- Mesma lógica visual replicada em **todas as telas** que usam tabela, filtros ou `formGrid`.

---

## 3. Situação atual

### 3.1 Inventário das “barras” afetadas

| Barra | Onde aparece | Mecanismo atual | Arquivos |
|---|---|---|---|
| **Cabeçalho de tabela** | Despesas, Receitas, Categorias, Cartões, Pagadores, Convites | `DataTable` + prop `width` por coluna em `<colgroup>` | `DataTable.tsx`, `DataTable.module.css`, páginas em `src/pages/*` |
| **Linha de filtros** | Despesas | `.filtrosRow` — grid 2 colunas com `minmax(180px, 260px)` | `pages.module.css`, `DespesasPage.tsx` |
| **Grade de formulário** | Despesas, Receitas | `.formGrid` — `repeat(3, minmax(0, 1fr))` | `pages.module.css`, `DespesasPage.tsx`, `ReceitasPage.tsx` |
| **Formulário estreito** | Categorias, Pagadores, Cartões, Convites | `.formNarrow` — `max-width: 480px` | `pages.module.css` |
| **Toolbar / resumo** | Despesas, Receitas | `.summaryGrid` — `auto-fit, minmax(160px, 1fr)` | `pages.module.css` |

> **Nota:** a imagem do usuário corresponde ao **cabeçalho da tabela de Despesas** (`DESCRIÇÃO`, `VALOR`, `VENCIMENTO`, etc.). Os demais tipos de barra entram no levantamento porque o pedido menciona “forms” e “todas as telas”.

### 3.2 Larguras de coluna hoje (desktop)

#### Despesas (`DespesasPage.tsx`)

| Coluna | `width` declarada | Unidade |
|---|---|---|
| Descrição | `160px` | fixa |
| Valor | `110px` | fixa |
| Vencimento | `110px` | fixa |
| Responsável | `18%` | percentual |
| Cartão | `110px` | fixa |
| Parcela | `90px` | fixa |
| Status | `14%` | percentual |
| Ações | `132px` | fixa |

**Soma aproximada:** ~712px fixos + 32% — **mistura px + %** na mesma tabela.

#### Receitas (`ReceitasPage.tsx`)

| Coluna | `width` |
|---|---|
| Pagador | `18%` |
| Responsável | `16%` |
| Valor | `14%` |
| Pagamento | `16%` |
| Status | `16%` |
| Ações | `132px` |

**Padrão diferente** de Despesas (só %, exceto ações).

#### Categorias / Cartões / Pagadores

| Coluna | `width` |
|---|---|
| ID | *(não declarada — divide espaço restante)* |
| Descrição/Nome | *(não declarada)* |
| Ações | *(não declarada)* |

#### Convites (`ConvitesPage.tsx`)

| Coluna | `width` |
|---|---|
| Nome | `40%` ou `50%` (conforme papel) |
| Papel | `35%` ou `50%` |
| Ações | `25%` |

### 3.3 CSS base da tabela

```css
/* DataTable.module.css */
.table {
  width: 100%;
  table-layout: fixed;
}
```

Com `table-layout: fixed`, o navegador distribui colunas conforme `<colgroup>`. Quando **px e % coexistem**, colunas fixas consomem espaço primeiro e as percentuais dividem o **restante** — gerando cabeçalhos visualmente desproporcionais (como na imagem).

### 3.4 Formulários e filtros

| Classe | Comportamento | Problema potencial |
|---|---|---|
| `.formGrid` | 3 colunas iguais (`1fr`) em desktop | Campos condicionais (ex.: “Responsável” só em escopo individual) deixam **buracos** na grade; última linha pode ter 1–2 campos estreitos |
| `.filtrosRow` | 2 colunas com teto de `260px` | Não ocupa 100% da largura do card; campos ficam **menores que o formGrid** ao lado |
| `.formNarrow` | Largura máx. 480px | Intencionalmente estreito — **fora do escopo** de “igualar barras”, salvo documentar como exceção |

### 3.5 O que já funciona (não regredir)

- **Mobile `< 900px`:** `DataTable` vira cartões — cabeçalho de tabela some; harmonização de colunas afeta **principalmente desktop/tablet ≥ 900px**.
- **Inputs/Selects:** já têm `width: 100%` dentro do campo — o desalinhamento vem do **container grid**, não do componente.
- **Responsividade geral:** entregue em `docs/levantamento-responsividade.md` (drawer, breakpoints, etc.).

---

## 4. Diagnóstico — causas raiz

| # | Causa | Impacto | Sev. |
|---|---|---|---|
| C01 | **Sem sistema único de larguras** — cada página define `width` ad hoc | Colunas inconsistentes entre telas e dentro da mesma tabela | **A** |
| C02 | **Mistura de `px` e `%`** na mesma tabela (Despesas) | Cabeçalhos desalinhados e espaços vazios irregulares | **A** |
| C03 | **Percentuais que não somam 100%** (Receitas: 18+16+14+16+16 = 80% + 132px) | Colunas “flutuam” conforme largura da viewport | **B** |
| C04 | **Colunas sem `width`** (Categorias, Pagadores, Cartões) | ID e descrição dividem espaço de forma imprevisível | **B** |
| C05 | **`.filtrosRow` com `max 260px`** vs `.formGrid` full width | Filtros visualmente menores que formulário na mesma página | **B** |
| C06 | **Campos condicionais no `formGrid`** | Linhas incompletas quebram ritmo visual de “campos iguais” | **B** |
| C07 | **Sem tokens de coluna** no design system | Cada ajuste futuro repete o problema | **C** |
| C08 | **Cabeçalho uppercase sem regra de alinhamento por tipo** (texto vs número vs ações) | Valor/Status parecem “flutuando” mesmo com largura correta | **C** |

---

## 5. Estratégia proposta

### 5.1 Princípio geral

Introduzir um **vocabulário único de larguras de coluna** (presets) e aplicá-lo em todas as páginas, em vez de valores soltos por tela.

### 5.2 Presets de coluna (proposta)

Centralizar em `src/constants/tableColumnWidths.ts` (ou bloco de tokens em `tokens.css`):

| Preset | Uso típico | Largura sugerida (desktop) |
|---|---|---|
| `textPrimary` | Descrição, pagador, nome | `minmax(140px, 2fr)` ou `22%` |
| `textSecondary` | Responsável, cartão, categoria | `minmax(100px, 1.5fr)` ou `16%` |
| `money` | Valor monetário | `110px` fixo + `align: right` |
| `date` | Vencimento, pagamento | `110px` fixo |
| `status` | Badge pago/pendente | `100px` fixo |
| `short` | Parcela, ID | `80px` fixo |
| `actions` | Botões icon | `132px` fixo |

**Regra:** dentro de uma mesma tabela, usar **ou** só percentuais/fr que somem 100% (descontando ações fixas), **ou** um mapa documentado — **nunca misturar px soltos com % sem cálculo**.

### 5.3 Abordagem por tipo de barra

| Tipo | Solução |
|---|---|
| Tabela desktop | Presets + helper opcional `buildColumnWidth(preset)`; revisar `<colgroup>` |
| Tabela mobile | Sem mudança estrutural (modo card já resolve) |
| Filtros | `.filtrosRow` → `grid-template-columns: repeat(2, minmax(0, 1fr))` ocupando 100% |
| FormGrid | Manter 3 colunas iguais; opcionalmente `grid-column: span 1` em placeholders ou reorganizar ordem dos campos para linhas completas |
| Form estreito | Manter `.formNarrow` como exceção documentada |

### 5.4 Breakpoints (reutilizar os existentes)

| Viewport | Tabela | FormGrid | Filtros |
|---|---|---|---|
| `≥ 900px` | Presets desktop aplicados | 3 colunas | 2 colunas iguais |
| `640–899px` | Modo card **ou** scroll (atual) | 2 colunas | 2 colunas (empilhar se necessário) |
| `< 640px` | Modo card | 1 coluna | 1 coluna |

---

## 6. Épicos e tasks

Legenda de complexidade: **PP** ≤ 30 min · **P** ≤ 1h30 · **M** 2–4 h.

Todas as tasks foram quebradas para **baixa complexidade** e mergeáveis isoladamente.

---

### E1 — Fundação: tokens e presets de largura

| ID | Task | Complexidade |
|---|---|---|
| **T1.1** | Documentar presets de coluna em `docs/design-system.md` (seção Tabela) | PP |
| **T1.2** | Criar `src/constants/tableColumnWidths.ts` exportando presets nomeados (`TABLE_COL = { textPrimary: '22%', ... }`) | PP |
| **T1.3** | Adicionar tokens CSS opcionais em `tokens.css` (`--table-col-money`, etc.) espelhando os presets TS | PP |
| **T1.4** | Helper leve `columnWidth(preset)` que retorna string para prop `width` do `DataTableColumn` | PP |

**Aceite E1:** nenhuma tela alterada visualmente; build e testes verdes.

---

### E2 — Harmonizar cabeçalhos de tabela (Despesas e Receitas)

| ID | Task | Complexidade |
|---|---|---|
| **T2.1** | Auditar soma de larguras da tabela de Despesas e definir mapa final (100% − coluna ações) | PP |
| **T2.2** | Substituir larguras ad hoc em `DespesasPage.tsx` pelos presets de T1.2 | P |
| **T2.3** | Alinhar colunas monetárias/data à direita via `align: 'right'` onde aplicável | PP |
| **T2.4** | Substituir larguras em `ReceitasPage.tsx` pelos mesmos presets (adaptando nomes de coluna) | P |
| **T2.5** | Validar visualmente Despesas e Receitas em 1024px, 1200px e 1440px | PP |

**Aceite E2:** cabeçalhos sem espaços desproporcionais; colunas de valor e data alinhadas; modo card mobile inalterado.

---

### E3 — Harmonizar tabelas simples (Cadastros e Convites)

| ID | Task | Complexidade |
|---|---|---|
| **T3.1** | Categorias: declarar `width` explícita (ID=`short`, Descrição=`textPrimary`, Ações=`actions`) | PP |
| **T3.2** | Pagadores: idem T3.1 | PP |
| **T3.3** | Cartões: idem T3.1 | PP |
| **T3.4** | Convites: padronizar soma 100% (ex.: 45% / 30% / 25% com ações) independente de `isDono` | P |
| **T3.5** | Smoke test visual das 4 páginas em desktop | PP |

**Aceite E3:** tabelas de cadastro seguem o mesmo vocabulário de larguras; nenhuma coluna removida.

---

### E4 — Ajustes no `DataTable` (opcional, aditivo)

| ID | Task | Complexidade |
|---|---|---|
| **T4.1** | Prop opcional `columnLayout?: 'auto' \| 'presets'` (default `'auto'`) — sem mudar comportamento atual | PP |
| **T4.2** | CSS: classe `.table th` com `overflow: hidden; text-overflow: ellipsis` para cabeçalhos longos | PP |
| **T4.3** | CSS: utilitário `.colMoney` / `.colDate` para alinhamento tabular em células (adicionar, não substituir estilos existentes) | PP |
| **T4.4** | Teste unitário: renderiza `<colgroup>` com larguras dos presets | P |

**Aceite E4:** API atual do `DataTable` intacta; melhorias são opt-in ou cosméticas.

---

### E5 — Harmonizar barras de filtro e formulário

| ID | Task | Complexidade |
|---|---|---|
| **T5.1** | `.filtrosRow`: trocar `minmax(180px, 260px)` por `repeat(2, minmax(0, 1fr))` em desktop | PP |
| **T5.2** | Garantir `.filtrosRow > * { min-width: 0 }` (mesmo padrão do `formGrid`) | PP |
| **T5.3** | Revisar ordem dos campos em `DespesasPage` para preferir linhas completas de 3 no `formGrid` (reordenar JSX, sem remover campos) | P |
| **T5.4** | Revisar ordem dos campos em `ReceitasPage` (mesma lógica) | P |
| **T5.5** | Documentar `.formNarrow` como exceção intencional no design system | PP |

**Aceite E5:** filtros ocupam mesma largura útil do formulário; campos de uma linha têm mesma largura; formulários estreitos inalterados.

---

### E6 — QA e documentação

| ID | Task | Complexidade |
|---|---|---|
| **T6.1** | Matriz visual: 8 rotas × viewports 900 / 1024 / 1200 / 1440 | P |
| **T6.2** | Atualizar checklist em `docs/design-system.md` (“colunas usam preset de largura”) | PP |
| **T6.3** | `npm run build` + `npm test -- --run` após cada épico | PP |

**Aceite E6:** zero regressão no modo card mobile; build e testes verdes.

---

## 7. Ordem de execução sugerida

| Fase | Épicos | Tasks | Entrega |
|---|---|---|---|
| **1 — Fundação** | E1 | T1.1 → T1.4 | Presets documentados, sem mudança visual |
| **2 — Tabelas principais** | E2 | T2.1 → T2.5 | Despesas + Receitas harmonizadas (resolve a imagem) |
| **3 — Tabelas secundárias** | E3 | T3.1 → T3.5 | Cadastros + Convites |
| **4 — DataTable (opcional)** | E4 | T4.1 → T4.4 | Robustez de cabeçalho e testes |
| **5 — Forms e filtros** | E5 | T5.1 → T5.5 | Barras de filtro/form alinhadas |
| **6 — QA** | E6 | T6.1 → T6.3 | Validação final |

**Total: 24 tasks · ~8–10 h estimadas.**

A fase 2 sozinha já endereça o problema mostrado na imagem. As fases 3–5 generalizam para “todas as telas”.

---

## 8. Mapa causa → task

| Causa | Tasks |
|---|---|
| C01 Sem sistema único | T1.2, T1.4, T2.2, T2.4, T3.x |
| C02 Mistura px + % | T2.1, T2.2 |
| C03 Percentuais incoerentes | T2.4, T3.4 |
| C04 Colunas sem width | T3.1–T3.3 |
| C05 Filtros estreitos | T5.1, T5.2 |
| C06 FormGrid com buracos | T5.3, T5.4 |
| C07 Sem tokens | T1.1, T1.3 |
| C08 Alinhamento cabeçalho | T2.3, T4.2, T4.3 |

---

## 9. Critérios de aceite globais

1. **Desktop (≥ 900px):** cabeçalhos de tabela com colunas proporcionais, sem faixas vazias irregulares entre rótulos.
2. **Mesma barra, mesma largura:** campos de filtro e campos adjacentes no `formGrid` ocupam colunas de largura igual na mesma viewport.
3. **Mobile (< 900px):** modo card das tabelas **inalterado**; formulários continuam 1 coluna em `< 640px`.
4. **Nenhuma coluna ou campo removido** — apenas larguras, ordem ou alinhamento ajustados.
5. **Presets reutilizáveis** documentados para colunas futuras.
6. `npm run build` e `npm test -- --run` verdes ao final.

---

## 10. Fora de escopo

- Virtualização de listas longas.
- Mudança de `table-layout` para CSS Grid (reescrita estrutural grande).
- Alterar conteúdo/copy dos cabeçalhos.
- Redesenhar cards de resumo (`.summaryGrid`) — cards **não** são “campos de form”; só entrarão se solicitado explicitamente.
- Bottom nav, PWA, tema escuro (já tratados em outros levantamentos).

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Ajustar larguras quebra truncamento de textos longos | Manter `truncate: true` e `title` tooltip; testar descrições de 30 caracteres |
| Reordenar campos do form confunde usuários habituados | Mudança só de ordem visual na grade, mesmos labels; validar com usuário se necessário |
| Presets rígidos em telas `< 1024px` antes do breakpoint card | Em `900–1024px`, preferir `minmax` ou ativar scroll (`mobileMode='scroll'`) se necessário |
| Regressão em testes de `DataTable` | T4.4 cobre colgroup; rodar suíte após cada épico |

---

## 12. Referências no código

| Artefato | Caminho |
|---|---|
| Componente de tabela | `src/components/ui/DataTable.tsx` |
| CSS da tabela | `src/components/ui/DataTable.module.css` |
| Estilos compartilhados de páginas | `src/pages/pages.module.css` |
| Colunas Despesas | `src/pages/DespesasPage.tsx` (~L341) |
| Colunas Receitas | `src/pages/ReceitasPage.tsx` (~L270) |
| Responsividade anterior | `docs/levantamento-responsividade.md` |
| Design system | `docs/design-system.md` § Tabela |

---

## 13. Decisão pendente (validar com usuário antes da fase 2)

1. **Despesas — coluna Descrição:** manter como coluna mais larga (~22%) ou igualar todas as colunas de texto?
2. **FormGrid — campos condicionais:** preferir **reordenar** campos para linhas cheias ou aceitar **placeholders invisíveis** (`visibility: hidden`) para manter grade fixa?
3. **Tablet 900–1024px:** manter tabela desktop harmonizada ou forçar modo card mais cedo?

> Recomendação padrão: Descrição/Pagador como coluna primária mais larga; reordenar campos (sem placeholder); tabela desktop até 900px (comportamento atual).
