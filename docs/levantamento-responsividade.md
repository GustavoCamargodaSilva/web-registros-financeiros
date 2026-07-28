# Levantamento — Responsividade Total do Front-End (Mobile + Web)

> **Status:** **Implementado** em 27/07/2026 (fases 1 a 6).
> **Escopo:** Tornar o front-end `web-registros-financeiros` plenamente utilizável em celulares, tablets e desktop, sem quebras de layout, sem scroll horizontal indesejado e com alvos de toque adequados.

## Status de implementação

| Fase | Situação | Observação |
|---|---|---|
| 1 — Fundação (E1, E2) | Concluída | Tokens, escala de breakpoints, `viewport-fit`, `100dvh`, correção do zoom no iOS, hooks `useMediaQuery`/`useBreakpoint` com testes |
| 2 — Navegação (E3) | Concluída | `Drawer` novo, hambúrguer no header, `AppShell` alternando sidebar fixa e drawer |
| 3 — DataTable (E4) | Concluída | Modo card abaixo de 900px, prioridades declaradas nas 5 páginas com tabela |
| 4 — Controles (E5, E6) | Concluída | Grade de meses, formulários, toolbar e padding de card |
| 5 — Overlays e auth (E7, E8) | Concluída | Modal como bottom sheet com foco preso, toast responsivo, telas de login |
| 6 — QA (E9) | Parcial | Testes automatizados e documentação feitos; **T9.2 (matriz manual) e T9.5 (Lighthouse) continuam pendentes** por exigirem execução em dispositivo/navegador |

### Desvios conscientes em relação ao plano original

1. **Escala de breakpoints (§4.1).** O plano propunha o corte mobile em `< 900px`, o que exigiria trocar as media queries existentes de `900px` para `899px`. Mantive **`<= 900px`** e alinhei `useBreakpoint()` ao mesmo valor. O ganho é que CSS e JS concordam no mesmo pixel sem churn em arquivos já existentes — em exatamente 900px, ambos dizem "mobile".
2. **T6.1 (`.form`/`.formGrid`).** A verificação pedida pelo próprio plano mostrou que `.form` **é** usada sem `.formGrid` em Categorias, Pagadores e Convites. A refatoração foi feita como previsto (nova classe `.formNarrow` aplicada nessas três páginas), e não virou task documental.
3. **Botão de fechar no drawer (não previsto).** Como o overlay cobre o header, o hambúrguer fica inacessível com o drawer aberto. Foi adicionado um botão de fechar explícito, além do fechamento por overlay, `Escape` e escolha de item.
4. **Nome do usuário no drawer (não previsto).** A T3.8 assumia que o nome já aparecia no drawer ao ocultá-lo do header abaixo de 480px. Não aparecia — o bloco "Conectado como" foi criado para não perder a informação.
5. **Tokens de camada.** Além de `--z-header` e `--z-drawer`, foram adicionados `--z-modal` e `--z-toast` para que a ordem de empilhamento fique legível em um lugar só.

---

## 1. Regras de Preservação (obrigatórias)

Estas regras valem para **todas** as tasks deste documento:

1. **Não excluir** classes CSS, componentes, hooks, utilitários ou testes existentes que não sejam objeto direto de uma task listada aqui.
2. **Não remover** `src/App.css` nem `src/index.css`. Eles são boilerplate do Vite e hoje **não são importados** por nenhum módulo (o `main.tsx` importa apenas `./styles/global.css`), logo **não afetam o runtime**. Ficam como estão.
3. **Não alterar** a camada `src/api/**`, `src/types/**` nem a lógica de negócio em `src/utils/**`. As mudanças são de apresentação/layout.
4. **Não trocar** a stack de estilos. Continua CSS Modules + tokens em `src/styles/tokens.css`. Nada de Tailwind, styled-components ou biblioteca de UI.
5. **Aditivo por padrão:** ao ajustar um componente, preferir adicionar regras/props opcionais a reescrever a API existente. Props novas devem ter default que preserva o comportamento atual.
6. **Não alterar** contratos de rota (`src/App.tsx`) nem regras de permissão (`useAmbientePermissoes`).

---

## 2. Situação Atual

### 2.1 Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | React | `^19.2.7` |
| Build | Vite | `^8.1.0` |
| Linguagem | TypeScript | `~6.0.2` |
| Roteamento | react-router | `^8.3.0` |
| Estado | Context API (`AuthContext`, `CompetenciaContext`, `ToastProvider`) | — |
| Estilo | CSS Modules + CSS Custom Properties | — |
| Testes | Vitest + Testing Library | `^4.1.9` / `^16.3.2` |

Sem Tailwind, sem SCSS, sem biblioteca de componentes. Design system próprio em `src/components/ui/`.

### 2.2 O que já existe de responsivo

| Item | Onde | Situação |
|---|---|---|
| Meta viewport | `index.html:6` | Presente (`width=device-width, initial-scale=1.0`), falta `viewport-fit=cover` |
| Breakpoint 900px | `AppShell.module.css:30`, `Sidebar.module.css:124`, `pages.module.css:159` | Shell vira coluna única; `formGrid` 3→2 colunas |
| Breakpoint 640px | `Header.module.css:66`, `PageHeader.module.css:27`, `pages.module.css:106,165` | Padding reduzido, título 24→20px, filtros e form 1 coluna, ações full-width |
| `prefers-reduced-motion` | `Button.module.css:87`, `Sidebar.module.css:118`, `CompetenciaSelector.module.css:105` | Presente |
| Scroll horizontal em tabela | `DataTable.module.css:1` (`overflow-x: auto`) | Presente, mas é o único recurso |
| Grid fluido de resumo | `pages.module.css:73` (`auto-fit, minmax(160px, 1fr)`) | Presente |
| `flex-wrap` | `pages.module.css:11`, `CompetenciaSelector.module.css:2,67` | Presente |

### 2.3 Tokens de layout hoje (`src/styles/tokens.css`)

```
--spacing-xs: 4px   --spacing-sm: 8px   --spacing-md: 16px
--spacing-lg: 24px  --spacing-xl: 32px
--radius-sm: 6px    --radius-md: 10px   --radius-pill: 999px
--header-height: 56px
--sidebar-width: 248px
```

Não há tokens de breakpoint, de alvo de toque nem de safe-area.

---

## 3. Diagnóstico — Problemas Encontrados

Severidade: **A** = quebra o uso em mobile · **B** = prejudica bastante · **C** = polimento.

| # | Problema | Arquivo / linha | Sev. |
|---|---|---|---|
| D01 | Sidebar **empilha acima do conteúdo** em ≤900px em vez de virar drawer. O usuário rola por todo o menu antes de chegar ao conteúdo. Não há hambúrguer, overlay nem bottom nav. | `AppShell.module.css:30-51`, `AppShell.tsx:13-15` | **A** |
| D02 | `DataTable` usa `table-layout: fixed` com `<colgroup>` de larguras fixas. Em `DespesasPage` são **7 colunas** somando ~600px + percentuais; em `ReceitasPage`, 6 colunas. Em telas de 360px isso é scroll horizontal permanente com colunas ilegíveis. Não existe modo card. | `DataTable.module.css:5-9`, `DataTable.tsx:44-48`, `DespesasPage.tsx:564-663`, `ReceitasPage.tsx:352-391` | **A** |
| D03 | Inputs e selects herdam `font-size: 14px` do body. **iOS Safari aplica zoom automático** ao focar campo com fonte < 16px, desalinhando o layout inteiro. | `global.css:19`, `Input.module.css:14-22`, `Select.module.css` | **A** |
| D04 | `min-height: 100vh` no shell e nas páginas de auth. Em navegadores mobile a barra de endereço faz `100vh` estourar a viewport, gerando scroll fantasma. Falta `100dvh`. | `AppShell.module.css:2`, `auth.module.css:2` | **A** |
| D05 | `.main` tem `overflow: auto`, criando contexto de scroll interno. No mobile isso impede o comportamento nativo de ocultar a barra de URL e atrapalha o *pull-to-refresh*. | `AppShell.module.css:27` | **B** |
| D06 | `CompetenciaSelector` renderiza 12 pills + navegação de ano com `flex-wrap`. Em 360px quebra em 4–5 linhas e empurra o conteúdo para baixo da dobra. Pills têm 32px de altura (abaixo do alvo de toque). | `CompetenciaSelector.module.css:65-86`, `PageHeader.module.css:23-25` | **B** |
| D07 | Botões `size="icon"` têm **36×36px**, abaixo dos 44×44px recomendados. Há 3 deles lado a lado numa coluna de 132px nas tabelas de Despesas e Receitas. | `Button.module.css:80-85`, `DespesasPage.tsx:618-658`, `ReceitasPage.tsx:391` | **B** |
| D08 | `Modal` não tem `max-height` nem scroll interno; mensagens longas (ex.: exclusão de série em `DespesasPage.tsx:279`) estouram a tela. Também não fecha com **ESC**, não tem *focus trap* e não bloqueia o scroll do fundo. | `Modal.module.css:12-19`, `Modal.tsx:30-53` | **B** |
| D09 | Toast tem `min-width: 280px` fixo e `right: 16px`. Em telas de 320px ocupa quase toda a largura sem margem de respiro; não há variação de posição para mobile. | `Toast.module.css:1-19` | **B** |
| D10 | **Nenhum hook de viewport** (`useMediaQuery` / `matchMedia`). Toda a responsividade é CSS-only, o que inviabiliza renderização condicional (ex.: tabela vs. cards, drawer vs. sidebar fixa). | `src/hooks/` | **B** |
| D11 | Breakpoints **hardcoded e não padronizados**: 640px e 900px espalhados por 5 arquivos, sem fonte única de verdade. Código morto ainda referencia 1024px. | vários `*.module.css` | **B** |
| D12 | Sem suporte a **safe-area** (`env(safe-area-inset-*)`). Em iPhone com notch/barra inferior, header e conteúdo ficam sob as áreas do sistema. | `index.html:6`, `global.css` | **B** |
| D13 | `.toolbar` é flex com `summaryGrid` (`minmax(160px, 1fr)`) ao lado do botão "Cadastrar". Em telas estreitas o botão quebra para baixo desalinhado e não ocupa largura total. | `pages.module.css:6-12,71-76`, `DespesasPage.tsx:327-362` | **B** |
| D14 | Header não tem espaço reservado para hambúrguer e o nome do usuário compete com o título. Altura fixa de 56px sem variação mobile. | `Header.tsx:8-26`, `Header.module.css:1-11` | **C** |
| D15 | `.form` define `max-width: 480px` e `.formGrid` sobrescreve com `max-width: none`. Acoplamento frágil que dificulta ajustes por breakpoint. | `pages.module.css:133-144` | **C** |
| D16 | Colunas `ID` em `CategoriasPage` e `PagadoresPage` gastam largura útil sem valor em mobile. | `CategoriasPage.tsx:83`, `PagadoresPage.tsx:83` | **C** |
| D17 | Sem `overflow-wrap`/`hyphens` global. Descrições longas sem espaço podem estourar containers. | `global.css` | **C** |
| D18 | Nenhum teste cobre comportamento responsivo. | `src/**/*.test.tsx` | **C** |
| D19 | O `docs/design-system.md` prevê sidebar como drawer e bottom nav, mas nada disso foi implementado — documentação divergente do código. | `docs/design-system.md` | **C** |

---

## 4. Estratégia

### 4.1 Escala de breakpoints (proposta)

Mantém os valores já usados (640 / 900) para **não gerar regressão**, e adiciona dois extremos:

| Nome | Largura | Alvo |
|---|---|---|
| `xs` | `< 480px` | Celular pequeno (iPhone SE, 360px) |
| `sm` | `480–639px` | Celular padrão |
| `md` | `640–899px` | Celular grande / tablet retrato |
| `lg` | `900–1199px` | Tablet paisagem / notebook pequeno |
| `xl` | `≥ 1200px` | Desktop |

**Corte principal mobile/desktop: 900px** (mesmo valor já em uso no `AppShell`).

> CSS Custom Properties **não funcionam** dentro de `@media`. A padronização será feita por (a) bloco de comentário canônico em `tokens.css` documentando os valores e (b) um módulo TS `src/constants/breakpoints.ts` para o lado JS. Não introduzir PostCSS custom-media nesta fase (custo de build desnecessário).

### 4.2 Abordagem

- **Progressive enhancement sobre o que existe**, não reescrita. Cada `.module.css` ganha blocos `@media` adicionais.
- **Renderização condicional apenas onde CSS não resolve** (drawer, tabela→cards), usando o hook novo.
- **Mobile-first apenas nos arquivos novos**; os existentes seguem desktop-first (`max-width`) para manter coerência com o código atual.
- **Alvo de toque mínimo: 44×44px** em viewports `< 900px` (WCAG 2.5.5 AAA).

---

## 5. Épicos e Tasks

Legenda de complexidade: **PP** ≤ 30min · **P** ≤ 1h30 · **M** 2–4h.
Todas as tasks foram dimensionadas para serem individualmente pequenas e mergeáveis.

---

### E1 — Fundação: tokens, viewport e reset

| ID | Task | Complexidade |
|---|---|---|
| **T1.1** | Documentar escala de breakpoints em `tokens.css` | PP |

- **Arquivos:** `src/styles/tokens.css`
- **Fazer:** adicionar bloco de comentário canônico no topo com a tabela de breakpoints da seção 4.1. Não altera nenhum valor existente.
- **Aceite:** comentário presente; nenhum token removido; build sem mudança visual.

| ID | Task | Complexidade |
|---|---|---|
| **T1.2** | Criar `src/constants/breakpoints.ts` | PP |

- **Arquivos:** novo `src/constants/breakpoints.ts`
- **Fazer:** exportar `export const BREAKPOINTS = { xs: 480, sm: 640, md: 900, lg: 1200 } as const` e as media query strings correspondentes (`MEDIA.mobile = '(max-width: 899px)'` etc.).
- **Aceite:** compila; sem import ainda (será usado em T2.x).
- **Depende de:** —

| ID | Task | Complexidade |
|---|---|---|
| **T1.3** | Adicionar `viewport-fit=cover` ao meta viewport | PP |

- **Arquivos:** `index.html:6`
- **Fazer:** `content="width=device-width, initial-scale=1.0, viewport-fit=cover"`.
- **Aceite:** `env(safe-area-inset-*)` passa a retornar valores reais em iOS.
- **Resolve:** D12 (parcial)

| ID | Task | Complexidade |
|---|---|---|
| **T1.4** | Adicionar tokens de responsividade em `tokens.css` | PP |

- **Arquivos:** `src/styles/tokens.css`
- **Fazer:** **adicionar** (sem remover nada):
  - `--tap-target-min: 44px;`
  - `--header-height-mobile: 56px;`
  - `--safe-top: env(safe-area-inset-top, 0px);` e equivalentes `--safe-bottom`, `--safe-left`, `--safe-right`
  - `--page-padding: var(--spacing-lg);` e, dentro de `@media (max-width: 640px)`, `--page-padding: var(--spacing-md);`
  - `--drawer-width: 280px;`
- **Aceite:** tokens disponíveis; layout inalterado (ainda não consumidos).
- **Depende de:** —

| ID | Task | Complexidade |
|---|---|---|
| **T1.5** | Ajustes de reset em `global.css` | P |

- **Arquivos:** `src/styles/global.css`
- **Fazer:**
  - `html { -webkit-text-size-adjust: 100%; }` (impede reescala do texto em rotação de tela no iOS)
  - `body { overflow-wrap: break-word; }`
  - `html, body, #root { min-height: 100%; }` → adicionar fallback progressivo `min-height: 100dvh;` logo abaixo
  - `img, svg { max-width: 100%; }`
- **Aceite:** sem regressão visual em desktop; texto longo não estoura container.
- **Resolve:** D04 (parcial), D17

| ID | Task | Complexidade |
|---|---|---|
| **T1.6** | Corrigir zoom automático de input no iOS | P |

- **Arquivos:** `src/components/ui/Input.module.css`, `src/components/ui/Select.module.css`
- **Fazer:** dentro de `@media (max-width: 899px)`, aplicar `font-size: 16px` e `min-height: var(--tap-target-min)` em `.input` e no select. Manter 14px no desktop.
- **Aceite:** em iPhone real/simulador, focar um campo **não** provoca zoom; campos têm ≥44px de altura no mobile.
- **Resolve:** D03
- **Depende de:** T1.4

| ID | Task | Complexidade |
|---|---|---|
| **T1.7** | Trocar `100vh` por `100dvh` com fallback | PP |

- **Arquivos:** `src/components/layout/AppShell.module.css:2`, `src/pages/auth.module.css:2`
- **Fazer:** manter `min-height: 100vh;` e adicionar `min-height: 100dvh;` na linha seguinte (fallback automático em navegadores antigos).
- **Aceite:** sem scroll fantasma ao mostrar/ocultar a barra de endereço no Chrome Android e Safari iOS.
- **Resolve:** D04

---

### E2 — Hooks de viewport

| ID | Task | Complexidade |
|---|---|---|
| **T2.1** | Criar `useMediaQuery` | P |

- **Arquivos:** novo `src/hooks/useMediaQuery.ts`
- **Fazer:** hook com `window.matchMedia`, usando `useSyncExternalStore` (React 19) para evitar *flash* na hidratação. Guarda para SSR/ambiente sem `window`.
- **Aceite:** retorna boolean reativo ao redimensionar.
- **Depende de:** —

| ID | Task | Complexidade |
|---|---|---|
| **T2.2** | Criar `useBreakpoint` | PP |

- **Arquivos:** novo `src/hooks/useBreakpoint.ts`
- **Fazer:** compõe `useMediaQuery` + `BREAKPOINTS` e retorna `{ isMobile, isTablet, isDesktop }` (`isMobile` = `< 900px`).
- **Aceite:** valores corretos nos três cortes.
- **Depende de:** T1.2, T2.1

| ID | Task | Complexidade |
|---|---|---|
| **T2.3** | Testes unitários dos hooks | P |

- **Arquivos:** novos `src/hooks/useMediaQuery.test.ts`, `src/hooks/useBreakpoint.test.ts`
- **Fazer:** mock de `window.matchMedia` no `src/test/setup.ts` (adicionar, não substituir o conteúdo atual) e testar troca de breakpoint.
- **Aceite:** `npm test` verde.
- **Depende de:** T2.1, T2.2

---

### E3 — Navegação mobile (drawer)

> Épico de maior valor. Resolve D01.

| ID | Task | Complexidade |
|---|---|---|
| **T3.1** | Criar componente `Drawer` genérico | M |

- **Arquivos:** novos `src/components/layout/Drawer.tsx`, `src/components/layout/Drawer.module.css`
- **Fazer:** painel lateral esquerdo com overlay escuro. Props: `open`, `onClose`, `children`, `ariaLabel`. Largura `var(--drawer-width)`, transição `transform: translateX()`, `position: fixed`, respeitando `--safe-top`/`--safe-bottom`. Incluir bloco `prefers-reduced-motion` (padrão do projeto).
- **Aceite:** abre/fecha suavemente; clique no overlay fecha; `role="dialog"` + `aria-modal="true"`.
- **Depende de:** T1.4

| ID | Task | Complexidade |
|---|---|---|
| **T3.2** | Acessibilidade do `Drawer`: ESC, focus trap e bloqueio de scroll | P |

- **Arquivos:** `src/components/layout/Drawer.tsx`, opcionalmente novo `src/hooks/useFocusTrap.ts`
- **Fazer:** fechar com `Escape`; prender o foco dentro do painel; `overflow: hidden` no `body` enquanto aberto; devolver o foco ao gatilho ao fechar.
- **Aceite:** navegação por teclado não escapa do drawer; fundo não rola.
- **Depende de:** T3.1

| ID | Task | Complexidade |
|---|---|---|
| **T3.3** | Botão hambúrguer no `Header` | P |

- **Arquivos:** `src/components/layout/Header.tsx`, `Header.module.css`, `src/components/layout/NavIcons.tsx`
- **Fazer:** adicionar `IconMenu` em `NavIcons.tsx` (**apenas adicionar**, não mexer nos ícones existentes). Header recebe props opcionais `onMenuClick?` e `menuOpen?`. Botão visível só em `< 900px` (`display: none` acima), 44×44px, com `aria-label="Abrir menu"` e `aria-expanded`.
- **Aceite:** botão invisível no desktop; acionável e rotulado no mobile; `Header` sem props continua renderizando como hoje.
- **Depende de:** T1.4

| ID | Task | Complexidade |
|---|---|---|
| **T3.4** | `Sidebar` aceita callback de navegação | PP |

- **Arquivos:** `src/components/layout/Sidebar.tsx`
- **Fazer:** prop opcional `onNavigate?: () => void`, chamada no `onClick` dos `NavLink` e após `navigate()` em `handleGroupClick`. Sem a prop, comportamento idêntico ao atual.
- **Aceite:** lógica de grupos abertos (`openGroups`) e permissões (`canManageMembros`) **intactas**.
- **Resolve:** parte de D01

| ID | Task | Complexidade |
|---|---|---|
| **T3.5** | `AppShell` orquestra sidebar fixa vs. drawer | M |

- **Arquivos:** `src/components/layout/AppShell.tsx`, `AppShell.module.css`
- **Fazer:** estado `drawerOpen`; usar `useBreakpoint()`. Em desktop, render atual (`<aside>` no grid). Em mobile, `<Sidebar>` dentro do `<Drawer>` e grid de 1 coluna sem a faixa da sidebar. Passar `onMenuClick` ao `Header` e `onNavigate={() => setDrawerOpen(false)}` à `Sidebar`.
- **Aceite:** em ≤899px o conteúdo começa imediatamente abaixo do header; em ≥900px nada muda visualmente.
- **Resolve:** D01
- **Depende de:** T2.2, T3.1, T3.3, T3.4

| ID | Task | Complexidade |
|---|---|---|
| **T3.6** | Fechar drawer em troca de rota e ao voltar para desktop | PP |

- **Arquivos:** `src/components/layout/AppShell.tsx`
- **Fazer:** `useEffect` em `useLocation().pathname` e em `isMobile` → `setDrawerOpen(false)`.
- **Aceite:** girar o tablet para paisagem não deixa overlay órfão.
- **Depende de:** T3.5

| ID | Task | Complexidade |
|---|---|---|
| **T3.7** | Ajustar scroll do `.main` | PP |

- **Arquivos:** `src/components/layout/AppShell.module.css:22-28`
- **Fazer:** em `@media (max-width: 899px)`, trocar `overflow: auto` por `overflow: visible` para devolver o scroll ao documento. Manter `overflow: auto` no desktop.
- **Aceite:** barra de URL do navegador mobile volta a se ocultar ao rolar.
- **Resolve:** D05

| ID | Task | Complexidade |
|---|---|---|
| **T3.8** | Header compacto no mobile | P |

- **Arquivos:** `src/components/layout/Header.module.css`, `Header.tsx`
- **Fazer:** em `< 480px`, ocultar `.user` ("Olá, {nome}") — que já aparece no drawer — e reduzir `.mark` para 32px. Botão "Sair" mantém o texto (é a única saída visível); apenas reduzir padding. **Não remover** nenhum elemento do DOM em desktop.
- **Aceite:** header sem quebra ou truncamento agressivo em 320px.
- **Resolve:** D14

---

### E4 — `DataTable` responsiva

> Segundo épico de maior valor. Resolve D02.

| ID | Task | Complexidade |
|---|---|---|
| **T4.1** | Estender `DataTableColumn` com metadados de responsividade | P |

- **Arquivos:** `src/components/ui/DataTable.tsx`
- **Fazer:** adicionar campos **opcionais** à interface: `priority?: 'primary' \| 'secondary' \| 'low'` (define destaque no card) e `hideOnMobile?: boolean`. Todos com default que preserva o comportamento atual.
- **Aceite:** todas as chamadas existentes seguem compilando sem alteração.

| ID | Task | Complexidade |
|---|---|---|
| **T4.2** | Modo card do `DataTable` em mobile | M |

- **Arquivos:** `src/components/ui/DataTable.tsx`, `DataTable.module.css`
- **Fazer:** com `useBreakpoint()`, em `< 900px` renderizar lista de cards — cada registro vira um bloco com `label: valor` empilhado, usando `column.header` como rótulo. Colunas `hideOnMobile` são omitidas; a coluna `actions` vai para o rodapé do card. Prop opcional `mobileMode?: 'cards' \| 'scroll'` com default `'cards'`.
- **Aceite:** zero scroll horizontal em 360px; `<table>` preservada integralmente no desktop; `emptyMessage` continua funcionando.
- **Resolve:** D02
- **Depende de:** T2.2, T4.1

| ID | Task | Complexidade |
|---|---|---|
| **T4.3** | Indicador visual de scroll horizontal (fallback) | P |

- **Arquivos:** `src/components/ui/DataTable.module.css`
- **Fazer:** sombra em gradiente na borda direita do `.wrapper` sinalizando conteúdo cortado, para quando `mobileMode='scroll'`. Adicionar `-webkit-overflow-scrolling: touch`.
- **Aceite:** afordância visível quando há corte.

| ID | Task | Complexidade |
|---|---|---|
| **T4.4** | Marcar prioridades nas colunas de Despesas | P |

- **Arquivos:** `src/pages/DespesasPage.tsx:564-663`
- **Fazer:** `descricao` e `valor` como `primary`; `vencimento`, `responsavel`, `pago` como `secondary`; `parcela` como `low`. Nenhuma coluna é removida — apenas classificada.
- **Aceite:** card mobile legível com descrição e valor em destaque.
- **Depende de:** T4.2

| ID | Task | Complexidade |
|---|---|---|
| **T4.5** | Marcar prioridades nas colunas de Receitas | P |

- **Arquivos:** `src/pages/ReceitasPage.tsx:352-391`
- **Fazer:** mesma classificação (`pagador`/`valor` primárias).
- **Depende de:** T4.2

| ID | Task | Complexidade |
|---|---|---|
| **T4.6** | Ajustar Categorias, Pagadores e Convites | P |

- **Arquivos:** `src/pages/CategoriasPage.tsx:83-89`, `src/pages/PagadoresPage.tsx:83-89`, `src/pages/ConvitesPage.tsx:190-207`
- **Fazer:** marcar a coluna `ID` com `hideOnMobile: true` (a coluna **permanece** no desktop). `descricao`/`nome` como `primary`.
- **Aceite:** cards mobile enxutos; tabela desktop inalterada.
- **Resolve:** D16
- **Depende de:** T4.2

| ID | Task | Complexidade |
|---|---|---|
| **T4.7** | Alvo de toque dos botões de ação | P |

- **Arquivos:** `src/components/ui/Button.module.css:80-85`
- **Fazer:** em `@media (max-width: 899px)`, `.icon { width: var(--tap-target-min); min-width: var(--tap-target-min); height: var(--tap-target-min); }`. Desktop permanece 36px.
- **Aceite:** botões de marcar-pago/editar/excluir com ≥44px no mobile.
- **Resolve:** D07
- **Depende de:** T1.4

| ID | Task | Complexidade |
|---|---|---|
| **T4.8** | Teste de renderização do modo card | P |

- **Arquivos:** novo `src/components/ui/DataTable.test.tsx`
- **Fazer:** com `matchMedia` mockado em mobile, verificar ausência de `<table>` e presença dos rótulos; em desktop, o inverso.
- **Depende de:** T2.3, T4.2

---

### E5 — `CompetenciaSelector`

| ID | Task | Complexidade |
|---|---|---|
| **T5.1** | Grade de meses em mobile | P |

- **Arquivos:** `src/components/ui/CompetenciaSelector.module.css`
- **Fazer:** em `< 640px`, trocar `.months` de `flex-wrap` para `display: grid; grid-template-columns: repeat(4, 1fr);` (3 linhas × 4 meses, previsível). Em `< 900px`, `repeat(6, 1fr)`.
- **Aceite:** altura estável, sem quebra irregular; nenhuma pill escondida.
- **Resolve:** D06 (parcial)

| ID | Task | Complexidade |
|---|---|---|
| **T5.2** | Alvo de toque das pills e setas de ano | PP |

- **Arquivos:** `src/components/ui/CompetenciaSelector.module.css:15-31,73-86`
- **Fazer:** em `< 900px`, `.pill { height: var(--tap-target-min); }` e `.yearArrow { width/height: var(--tap-target-min); }`. Desktop mantém 32/36px.
- **Resolve:** D06, D07
- **Depende de:** T1.4

| ID | Task | Complexidade |
|---|---|---|
| **T5.3** | Linha do ano ocupando largura total no mobile | PP |

- **Arquivos:** `src/components/ui/CompetenciaSelector.module.css:1-13`
- **Fazer:** em `< 640px`, `.wrap { flex-direction: column; align-items: stretch; }` e `.yearNav { justify-content: space-between; }`.
- **Aceite:** ano e meses em blocos claramente separados.

| ID | Task | Complexidade |
|---|---|---|
| **T5.4** | Reduzir espaçamento do `PageHeader` no mobile | PP |

- **Arquivos:** `src/components/layout/PageHeader.module.css`
- **Fazer:** em `< 640px`, `.pageHeader { gap: var(--spacing-sm); margin-bottom: var(--spacing-md); }` e `.titleBlock { flex-direction: column; align-items: flex-start; }`.
- **Aceite:** mais conteúdo acima da dobra.

---

### E6 — Formulários, filtros e toolbar

| ID | Task | Complexidade |
|---|---|---|
| **T6.1** | Desacoplar `.form` de `.formGrid` | PP |

- **Arquivos:** `src/pages/pages.module.css:133-144`
- **Fazer:** manter ambas as classes (usadas juntas em `DespesasPage.tsx:416` e `ReceitasPage`), apenas mover o `max-width: 480px` para uma nova classe `.formNarrow` e deixar `.form` neutro; aplicar `.formNarrow` onde `.form` é usada **sem** `.formGrid`. Verificar todos os usos antes de alterar.
- **Aceite:** nenhuma tela muda de largura no desktop.
- **Resolve:** D15

| ID | Task | Complexidade |
|---|---|---|
| **T6.2** | Breakpoint extra do `formGrid` | PP |

- **Arquivos:** `src/pages/pages.module.css:139-177`
- **Fazer:** manter 3 colunas (padrão), 2 em ≤900px, 1 em ≤640px — já existe. Adicionar apenas `min-width: 0` nos filhos do grid para impedir estouro de selects com opções longas (nomes de categoria).
- **Aceite:** select com texto longo não alarga a coluna.

| ID | Task | Complexidade |
|---|---|---|
| **T6.3** | Toolbar e botão "Cadastrar" no mobile | P |

- **Arquivos:** `src/pages/pages.module.css:6-12,71-76`
- **Fazer:** em `< 640px`, `.toolbar { flex-direction: column; align-items: stretch; }`, `.toolbar > button { width: 100%; }` e `.summaryGrid { grid-template-columns: repeat(2, 1fr); }` (dois cartões por linha em vez de `minmax(160px)`, que gera coluna única em 360px).
- **Aceite:** resumo em duas colunas e CTA de largura total em 360px.
- **Resolve:** D13

| ID | Task | Complexidade |
|---|---|---|
| **T6.4** | `formHeader` empilhado no mobile | PP |

- **Arquivos:** `src/pages/pages.module.css:112-118`
- **Fazer:** em `< 640px`, `flex-direction: column; align-items: flex-start;` e botão "Fechar" com largura total.
- **Aceite:** título do formulário não é comprimido.

| ID | Task | Complexidade |
|---|---|---|
| **T6.5** | Padding de `Card` no mobile | PP |

- **Arquivos:** `src/components/ui/Card.module.css`
- **Fazer:** em `< 640px`, `padding: var(--spacing-md)`. Ganha ~16px de largura útil por card.
- **Aceite:** conteúdo mais largo em telas pequenas, sem alterar desktop.

---

### E7 — Overlays: `Modal` e `Toast`

| ID | Task | Complexidade |
|---|---|---|
| **T7.1** | `Modal` com altura máxima e scroll interno | P |

- **Arquivos:** `src/components/ui/Modal.module.css`
- **Fazer:** `.dialog { max-height: calc(100dvh - 2 * var(--spacing-lg)); display: flex; flex-direction: column; }` e `.message { overflow-y: auto; }`.
- **Aceite:** mensagem longa de exclusão de série rola dentro do diálogo; botões sempre visíveis.
- **Resolve:** D08 (parcial)

| ID | Task | Complexidade |
|---|---|---|
| **T7.2** | `Modal` como bottom sheet no mobile | P |

- **Arquivos:** `src/components/ui/Modal.module.css`
- **Fazer:** em `< 640px`, `.overlay { align-items: flex-end; padding: 0; }` e `.dialog { max-width: 100%; border-radius: var(--radius-md) var(--radius-md) 0 0; padding-bottom: calc(var(--spacing-lg) + var(--safe-bottom)); }`. Botões empilhados em largura total.
- **Aceite:** ações ao alcance do polegar; respeita a barra inferior do iOS.
- **Depende de:** T1.4, T7.1

| ID | Task | Complexidade |
|---|---|---|
| **T7.3** | `Modal`: ESC, focus trap e bloqueio de scroll | P |

- **Arquivos:** `src/components/ui/Modal.tsx`
- **Fazer:** reaproveitar `useFocusTrap` de T3.2; fechar com `Escape`; travar scroll do body enquanto `open`. Manter a API de props atual intacta.
- **Aceite:** teclado não escapa; fundo não rola; fechar por overlay continua funcionando.
- **Resolve:** D08
- **Depende de:** T3.2

| ID | Task | Complexidade |
|---|---|---|
| **T7.4** | `Toast` responsivo | PP |

- **Arquivos:** `src/components/toast/Toast.module.css`
- **Fazer:** em `< 640px`, `.container { left: var(--spacing-sm); right: var(--spacing-sm); top: calc(var(--spacing-sm) + var(--safe-top)); }` e `.toast { min-width: 0; max-width: 100%; }`.
- **Aceite:** toast com margens iguais dos dois lados em 320px, sem transbordo.
- **Resolve:** D09
- **Depende de:** T1.4

---

### E8 — Páginas de autenticação

| ID | Task | Complexidade |
|---|---|---|
| **T8.1** | `auth.module.css` responsivo | P |

- **Arquivos:** `src/pages/auth.module.css`
- **Fazer:** `min-height: 100dvh` (T1.7); em `< 480px`, `padding: var(--spacing-md)` e `.card { max-width: 100% }`. Respeitar `--safe-top`/`--safe-bottom`.
- **Aceite:** Login, Registro e AceitarConvite sem corte em 320px.
- **Depende de:** T1.4, T1.7

| ID | Task | Complexidade |
|---|---|---|
| **T8.2** | Revisar `AceitarConvitePage` em mobile | P |

- **Arquivos:** `src/pages/AceitarConvitePage.tsx`, `auth.module.css`
- **Fazer:** `.actions` já é grid — validar que os botões ficam em largura total e legíveis; ajustar `.message` (line-height / quebra de e-mails longos com `overflow-wrap: anywhere`).
- **Aceite:** e-mail longo não estoura o card.

| ID | Task | Complexidade |
|---|---|---|
| **T8.3** | Revisar `ConvitesPage` em mobile | P |

- **Arquivos:** `src/pages/ConvitesPage.tsx`
- **Fazer:** validar o formulário de convite e a tabela de membros no modo card; coluna "Ações" (`width: '25%'`) no rodapé do card.
- **Depende de:** T4.2, T4.6

---

### E9 — QA, acessibilidade e documentação

| ID | Task | Complexidade |
|---|---|---|
| **T9.1** | Auditoria de alvos de toque | P |

- **Fazer:** varrer todos os elementos interativos (`Button`, `.pill`, `.yearArrow`, `.itemRow`, `.sublink`, `Select`, `Input`) e confirmar ≥44px em `< 900px`. `Sidebar.itemRow` tem 40px e `.sublink` 38px — ajustar dentro do drawer.
- **Arquivos:** `Sidebar.module.css:20-36,88-98` (+ demais conforme achados)
- **Aceite:** checklist preenchido; nenhum alvo abaixo de 44px no mobile.

| ID | Task | Complexidade |
|---|---|---|
| **T9.2** | Matriz de testes manuais | PP |

- **Fazer:** validar as 8 rotas nos viewports **320 / 360 / 390 / 414 / 768 / 900 / 1024 / 1440px**, retrato e paisagem. Registrar resultado no final deste arquivo.
- **Aceite:** zero scroll horizontal; nenhum texto cortado; todos os CTAs alcançáveis.

| ID | Task | Complexidade |
|---|---|---|
| **T9.3** | Teste de smoke do drawer | P |

- **Arquivos:** novo `src/components/layout/AppShell.test.tsx`
- **Fazer:** em viewport mobile mockado, clicar no hambúrguer abre o drawer; clicar num link fecha; ESC fecha.
- **Depende de:** T3.5, T2.3

| ID | Task | Complexidade |
|---|---|---|
| **T9.4** | Atualizar `docs/design-system.md` | PP |

- **Arquivos:** `docs/design-system.md`
- **Fazer:** alinhar a seção Mobile ao que foi de fato implementado (drawer entregue; bottom nav segue fora de escopo) e referenciar a escala de breakpoints da seção 4.1.
- **Resolve:** D19

| ID | Task | Complexidade |
|---|---|---|
| **T9.5** | Lighthouse mobile | PP |

- **Fazer:** rodar Lighthouse (perfil mobile) em `/despesas` e `/login`. Registrar as pontuações de Acessibilidade e Melhores Práticas.
- **Aceite:** Acessibilidade ≥ 90; nenhum aviso de "tap targets too small" ou "content wider than screen".

---

## 6. Ordem de Execução Sugerida

| Fase | Épicos | Tasks | Entrega | Esforço |
|---|---|---|---|---|
| **1 — Fundação** | E1, E2 | T1.1 → T2.3 (10) | Tokens, breakpoints, hooks e correções de base (zoom iOS, `100dvh`, safe-area). Baixo risco, alto retorno imediato. | ~6h |
| **2 — Navegação** | E3 | T3.1 → T3.8 (8) | Drawer mobile funcional. Maior ganho percebido. | ~9h |
| **3 — Dados** | E4 | T4.1 → T4.8 (8) | Tabelas utilizáveis em celular. | ~10h |
| **4 — Controles** | E5, E6 | T5.1 → T6.5 (9) | Competência, formulários e toolbars ajustados. | ~5h |
| **5 — Overlays e auth** | E7, E8 | T7.1 → T8.3 (7) | Modal, toast e telas de login. | ~5h |
| **6 — QA** | E9 | T9.1 → T9.5 (5) | Validação e documentação. | ~4h |

**Total: 47 tasks · ~39h.** As fases 1 e 2 já resolvem os problemas de severidade **A** de navegação; a fase 3 fecha o restante.

---

## 7. Mapa Problema → Task

| Problema | Sev. | Tasks |
|---|---|---|
| D01 Sidebar sem drawer | A | T3.1–T3.6 |
| D02 DataTable não responsiva | A | T4.1–T4.6 |
| D03 Zoom de input no iOS | A | T1.6 |
| D04 `100vh` | A | T1.5, T1.7 |
| D05 Scroll interno do `.main` | B | T3.7 |
| D06 CompetenciaSelector | B | T5.1–T5.3 |
| D07 Alvos de toque | B | T4.7, T5.2, T9.1 |
| D08 Modal | B | T7.1–T7.3 |
| D09 Toast | B | T7.4 |
| D10 Sem hook de viewport | B | T2.1, T2.2 |
| D11 Breakpoints dispersos | B | T1.1, T1.2 |
| D12 Safe-area | B | T1.3, T1.4 |
| D13 Toolbar | B | T6.3 |
| D14 Header | C | T3.8 |
| D15 `.form`/`.formGrid` | C | T6.1 |
| D16 Coluna ID | C | T4.6 |
| D17 Quebra de texto | C | T1.5 |
| D18 Sem testes | C | T2.3, T4.8, T9.3 |
| D19 Doc divergente | C | T9.4 |

---

## 8. Critérios de Aceite Globais

Ao final da implementação, em **todas** as 8 rotas:

1. **Zero scroll horizontal** entre 320px e 1920px.
2. **Nenhum elemento interativo** abaixo de 44×44px em viewports `< 900px`.
3. **Nenhum zoom automático** ao focar campos no iOS Safari.
4. **Todo CTA principal alcançável** sem scroll horizontal em 360×640.
5. **Navegação por teclado** funcional em drawer e modal (Tab, Shift+Tab, ESC).
6. **Suíte de testes verde** (`npm test`) e build limpo (`npm run build`).
7. **Nenhuma regressão visual em desktop ≥1200px** — o layout atual é a referência.
8. **Nenhuma classe, componente ou teste preexistente removido** (seção 1).

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Modo card do `DataTable` altera a semântica da tabela e pode afetar testes existentes | Médio | Prop `mobileMode` com default explícito; testes só rodam em viewport desktop salvo indicação contrária |
| `useMediaQuery` causa *flash* de layout na primeira renderização | Médio | `useSyncExternalStore` com `getServerSnapshot`; manter a estrutura CSS como fonte primária e o JS apenas para trocas estruturais |
| Ajustes em `pages.module.css` afetam 5 páginas ao mesmo tempo | Médio | Alterações só dentro de blocos `@media`; conferir cada página na matriz T9.2 |
| Refatorar `.form`/`.formGrid` (T6.1) pode alterar larguras no desktop | Baixo | Mapear todos os usos antes; se `.form` nunca aparece sem `.formGrid`, a task vira apenas documental |
| `100dvh` sem suporte em navegadores antigos | Baixo | Declaração dupla `100vh` + `100dvh` (fallback nativo do CSS) |
| Drawer conflita com o scroll lock do `Modal` | Baixo | Centralizar o bloqueio de scroll em um utilitário único com contador de referências |

---

## 10. Fora de Escopo

Registrado para decisão futura, **não** faz parte deste levantamento:

- Bottom navigation bar (mencionada como "futuro" em `docs/design-system.md`).
- Modo escuro (`prefers-color-scheme`) — existe apenas no `index.css` órfão.
- PWA / instalação / offline.
- Gestos de swipe para abrir o drawer.
- Virtualização de listas longas.
- Remoção de `src/App.css` e `src/index.css` (proibida pela seção 1).

---

## 11. Registro da Matriz de Testes (preencher em T9.2)

| Rota | 320 | 360 | 390 | 414 | 768 | 900 | 1024 | 1440 |
|---|---|---|---|---|---|---|---|---|
| `/login` | | | | | | | | |
| `/registro` | | | | | | | | |
| `/convites/aceitar` | | | | | | | | |
| `/despesas` | | | | | | | | |
| `/receitas` | | | | | | | | |
| `/categorias` | | | | | | | | |
| `/pagadores` | | | | | | | | |
| `/convites` | | | | | | | | |
