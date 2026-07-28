# Levantamento — Botão de Alternância Tema Claro / Escuro

> **Status:** Implementado. Pendente apenas a validação automatizada (`npm run build`, `npm run test:run`) e a auditoria visual de contraste em navegador real — ver seção 9.
> **Data:** 27/07/2026
> **Escopo:** Adicionar um controle na interface que permita ao usuário alternar entre tema claro e escuro, com preferência persistida entre sessões e sem piscar de tela no carregamento.

---

## 1. Regras de Preservação (obrigatórias)

Valem para **todas** as tasks deste documento:

1. **Não excluir** classes CSS, componentes, hooks, utilitários ou testes existentes.
2. **Não remover nem reaproveitar** `src/index.css`. Ele contém um bloco `@media (prefers-color-scheme: dark)` (linhas 34–46) que é **boilerplate órfão do Vite** — não é importado por nenhum módulo e usa uma paleta roxa (`--accent: #aa3bff`) totalmente alheia ao produto. Não serve de base para o tema escuro e permanece intocado. O mesmo vale para `src/App.css`.
3. **Nenhum token existente em `src/styles/tokens.css` pode ser removido ou ter seu valor alterado no tema claro.** O tema claro atual é a referência: ao final, ele deve renderizar pixel a pixel como hoje.
4. **Não alterar** `src/api/**` (exceto pela criação de um novo `themeStorage.ts`), `src/types/**` nem a lógica de negócio em `src/utils/**`.
5. **Não trocar** a stack de estilos. Continua CSS Modules + CSS Custom Properties.
6. **Aditivo por padrão:** props novas em componentes existentes devem ser opcionais, com default que preserva o comportamento atual.

### 1.1 Coordenação com o levantamento de responsividade

O documento `docs/levantamento-responsividade.md` também prevê alterações em `src/components/layout/Header.tsx`, `src/components/layout/NavIcons.tsx` e `src/styles/tokens.css`. **Os dois levantamentos são independentes e podem ser executados em qualquer ordem**, mas convém evitar que rodem em paralelo nesses três arquivos para não gerar conflito de merge. A task T4.4 deste documento é a única com dependência real do outro (drawer mobile) e está marcada como opcional.

---

## 2. Situação Atual

### 2.1 Como as cores funcionam hoje

Toda a paleta vive em `src/styles/tokens.css`, num único bloco `:root` com 15 tokens de cor:

```
Marca      --color-brand #0b5cad · --color-brand-hover #094a8f
           --color-primary #0b5cad · --color-primary-hover #094a8f
Dinheiro   --color-income #28a745 · --color-expense #e74c3c
Feedback   --color-success #28a745 · --color-warning #f0ad4e
           --color-danger #e74c3c · --color-secondary #00a896
Superfície --color-background #eef1f6 · --color-sidebar #f4f6f9
           --color-surface #ffffff · --color-border #e1e6ee
Texto      --color-text #2d3748 · --color-text-muted #718096
           --color-header-text #ffffff
Elevação   --shadow-sm / --shadow-md (rgba(15, 23, 42, ...))
```

Essa base é sólida — é o que torna o tema escuro viável sem reescrever componentes. **O problema é que ela está incompleta:** 34 valores de cor aparecem hardcoded diretamente nos `*.module.css`, fora do sistema de tokens.

### 2.2 Convenções do projeto que o tema deve seguir

| Convenção | Referência | Aplicação aqui |
|---|---|---|
| Contexto com hook e guarda de provider | `src/context/CompetenciaContext.tsx:32-38` | `ThemeContext` seguirá o mesmo formato, incluindo o `throw` com mensagem em português |
| Storage encapsulado em objeto com `get`/`set`/`clear` | `src/api/ambienteStorage.ts:3-16`, `src/api/tokenStorage.ts:3-13` | `themeStorage` terá a mesma forma |
| Ícones SVG via `BaseIcon` (24×24, `stroke="currentColor"`) | `src/components/layout/NavIcons.tsx:5-22` | `IconSun` e `IconMoon` serão adicionados ao mesmo arquivo |
| Botões com `variant` + `size="icon"` | `src/components/ui/Button.tsx:4-10` | O toggle reutilizará `Button`, sem criar botão novo do zero |
| `prefers-reduced-motion` em componentes com transição | `Button.module.css:87`, `Sidebar.module.css:118` | A transição de tema respeitará o mesmo padrão |

**Ponto de atenção sobre storage:** o projeto usa `sessionStorage` para token e ambiente, o que faz sentido para dados de sessão. A preferência de tema, porém, precisa sobreviver ao fechamento do navegador — é uma configuração de acessibilidade/conforto visual, não um dado de sessão. **Este levantamento propõe `localStorage` para o tema**, um desvio consciente e justificado da convenção.

---

## 3. Diagnóstico — O que Bloqueia o Tema Escuro

Severidade: **A** = impede o funcionamento · **B** = quebra visualmente parte da tela · **C** = polimento.

| # | Problema | Arquivo / linha | Sev. |
|---|---|---|---|
| **P01** | **34 cores hardcoded fora dos tokens.** Como não passam por variável, permanecem claras quando o tema escuro é ativado. Inventário completo na seção 3.1. | 11 arquivos `*.module.css` | **A** |
| **P02** | **Superfícies claras "assadas" em `rgba`.** `.summaryItem` usa `rgba(238, 241, 246, 0.55)` e o `<th>` da tabela usa `rgba(238, 241, 246, 0.65)` — o cinza-claro do tema atual está embutido no valor. No escuro viram faixas claras sobre fundo escuro. | `pages.module.css:85`, `DataTable.module.css:25` | **A** |
| **P03** | **Ausência da propriedade `color-scheme`.** Sem ela o navegador renderiza os controles nativos em modo claro: o seletor de data do `<input type="date">` (usado em `DespesasPage.tsx:437-444` e em Receitas), o dropdown do `<select>` (9 ocorrências só em Despesas) e as barras de rolagem. Resultado: popups brancos ofuscantes sobre UI escura. | `src/styles/global.css` | **A** |
| **P04** | **Risco de FOUC** (*flash of unstyled content*). Se o tema for aplicado só depois que o React monta, o usuário vê um flash branco a cada carregamento — especialmente agressivo no escuro. Exige script síncrono no `index.html` antes do bundle. | `index.html:9-12` | **A** |
| **P05** | **Não existe camada de tema.** O `tokens.css` tem um único bloco `:root` sem mecanismo de sobrescrita (`[data-theme]` ou classe). | `src/styles/tokens.css:1` | **A** |
| **P06** | **`--color-primary` é usado como fundo e como texto ao mesmo tempo.** Como fundo em `Button.primary` (com `color: #fff`) e como cor de texto em `Sidebar.active`, `Button.outline:hover`, `pill:hover` e `auth .link`. No escuro esses dois papéis divergem: o texto precisa clarear para ter contraste sobre superfície escura, mas se o fundo do botão clarear junto, o rótulo branco perde legibilidade. Precisa ser desdobrado em dois tokens. | `Button.module.css:25-32`, `Sidebar.module.css:108-116`, `CompetenciaSelector.module.css:88-91`, `auth.module.css:29-32` | **B** |
| **P07** | **`color: #fff` fixo sobre fundos semânticos.** `Button.primary/danger/success` e `CompetenciaSelector.pillActive` assumem que o fundo é escuro o suficiente. No tema escuro, `--color-success` e `--color-danger` precisam clarear para ter contraste sobre a superfície — e aí texto branco sobre verde-claro falha o AA. | `Button.module.css:27,36,56`, `CompetenciaSelector.module.css:96,102` | **B** |
| **P08** | **Sombras invisíveis no escuro.** `--shadow-sm/md` usam `rgba(15, 23, 42, 0.06/0.08)` — quase imperceptíveis sobre fundo escuro, eliminando a hierarquia de elevação de cards e modais. | `tokens.css:47-48` | **B** |
| **P09** | **Cores de dinheiro reprovam em contraste.** `--color-income: #28a745` e `--color-expense: #e74c3c` sobre uma superfície escura (~`#1a1f27`) ficam abaixo do mínimo AA de 4.5:1. Num app financeiro, valores ilegíveis são um defeito funcional, não estético. | `tokens.css:9-10` | **B** |
| **P10** | **Toast com paleta 100% hardcoded** — 6 valores hex, nenhum tokenizado. Ficaria com fundo verde/vermelho pastel claro sobre UI escura. | `Toast.module.css:21-31` | **B** |
| **P11** | **Badge com cores hardcoded** (`#1e7e34`, `#9a6700` sobre `rgba` claros). Aparece em toda linha das tabelas de Despesas e Receitas. | `Badge.module.css:11-17` | **B** |
| **P12** | **Gradiente das telas de autenticação hardcoded.** `radial-gradient(..., rgba(11, 92, 173, 0.18), transparent)` sobre `--color-background`; o fundo muda, o gradiente não acompanha. | `auth.module.css:7-9` | **C** |
| **P13** | **Sem `<meta name="theme-color">`.** A barra do navegador no Android/iOS não acompanha o tema, quebrando a continuidade visual em mobile. | `index.html:3-8` | **C** |
| **P14** | **`--color-sidebar` declarado mas nunca usado.** O `Sidebar.module.css:3` usa `--color-surface`. Token órfão que pode confundir na montagem da paleta escura. **Não remover** (regra 1.3) — apenas documentar. | `tokens.css:20` | **C** |
| **P15** | **Nenhum teste cobre tema.** Não há mock de `matchMedia` no `src/test/setup.ts`. | `src/test/setup.ts` | **C** |
| **P16** | **`docs/design-system.md` não contempla tema escuro.** Ficará divergente após a entrega. | `docs/design-system.md` | **C** |

### 3.1 Inventário completo das cores hardcoded (P01)

| Arquivo | Linhas | Valores | Papel semântico |
|---|---|---|---|
| `components/ui/Button.module.css` | 27, 36, 56, 73, 77 | `#fff` (×5) | Texto sobre fundo semântico |
| | 40 | `#c0392b` | Hover de `danger` |
| | 60 | `#218838` | Hover de `success` |
| | 66, 71, 72 | `rgba(255,255,255,.45/.12)`, `#fff` | Bordas/fundo do `ghost` no header |
| `components/layout/Sidebar.module.css` | 53 | `#9aa3af` | Cor do caret |
| | 62, 105 | `#5b6573` | Cor do ícone |
| | 39, 101 | `rgba(45,55,72,.04)` | Fundo de hover |
| | 109 | `rgba(11,92,173,.08)` | Fundo do item ativo |
| `components/ui/DataTable.module.css` | 25 | `rgba(238,241,246,.65)` | Fundo do cabeçalho |
| | 29 | `rgba(11,92,173,.03)` | Hover de linha |
| `pages/pages.module.css` | 85 | `rgba(238,241,246,.55)` | Fundo do card de resumo |
| | 57, 62, 68 | `rgba(231,76,60,.06)`, `rgba(40,167,69,.45/.06)` | Hover das ações da tabela |
| `components/toast/Toast.module.css` | 22–24 | `#e8f9f0`, `#1a7f4b`, `#b8ebd0` | Toast de sucesso |
| | 28–30 | `#fdeeee`, `#b42318`, `#f5c2c2` | Toast de erro |
| `components/ui/Badge.module.css` | 11–12 | `rgba(40,167,69,.12)`, `#1e7e34` | Badge "pago" |
| | 16–17 | `rgba(240,173,78,.18)`, `#9a6700` | Badge "pendente" |
| `components/ui/Modal.module.css` | 4 | `rgba(16,24,40,.45)` | Overlay |
| `components/ui/Input.module.css` | 38 | `rgba(11,92,173,.15)` | Anel de foco |
| `components/ui/Select.module.css` | 27 | `rgba(11,92,173,.15)` | Anel de foco |
| `components/layout/Header.module.css` | 28 | `rgba(255,255,255,.16)` | Fundo do monograma "RF" |
| `components/ui/CompetenciaSelector.module.css` | 96, 102 | `#fff` (×2) | Texto da pill ativa |
| `pages/auth.module.css` | 8 | `rgba(11,92,173,.18)` | Gradiente de fundo |
| | 37 | `rgba(231,76,60,.1)` | Fundo do alerta de erro |

**Total: 34 ocorrências em 11 arquivos.** Todas precisam virar token antes de o tema escuro funcionar.

---

## 4. Estratégia

### 4.1 Mecanismo de troca

**Atributo `data-theme` no `<html>`**, com bloco de sobrescrita em `tokens.css`:

```css
:root { /* tokens do tema claro — bloco atual, inalterado */ }
[data-theme='dark'] { /* apenas as sobrescritas */ }
```

Por que essa abordagem, e não as alternativas:

- **Contra classe no `<body>`:** o `<html>` é aplicável pelo script anti-FOUC antes de o `<body>` existir.
- **Contra apenas `@media (prefers-color-scheme)`:** não permite escolha manual, que é justamente o pedido.
- **Contra trocar o arquivo CSS inteiro:** exigiria duplicar todos os tokens e dobraria a manutenção.

### 4.2 Três modos, não dois

| Modo | Comportamento |
|---|---|
| `light` | Claro fixo |
| `dark` | Escuro fixo |
| `system` | Acompanha `prefers-color-scheme` do sistema operacional, reagindo em tempo real |

**Default: `system`** — respeita a configuração que o usuário já fez no aparelho.

O botão terá **dois estados visíveis** (sol / lua) alternando entre claro e escuro. O modo `system` é o valor inicial e permanece ativo até o primeiro clique; a partir daí a escolha explícita prevalece. Isso mantém o controle simples (um clique) sem perder o respeito à preferência do sistema.

### 4.3 Sequência segura de implementação

A ordem abaixo garante que **nenhuma etapa isolada altere a aparência atual**, o que torna cada task revisável e reversível:

```
Fase 1 → Adicionar tokens novos com os valores claros ATUAIS   → zero mudança visual
Fase 2 → Trocar as 34 cores hardcoded pelos tokens novos       → zero mudança visual
Fase 3 → Adicionar o bloco [data-theme='dark']                 → zero mudança (inativo)
Fase 4 → Ligar o estado e o botão                              → o tema passa a funcionar
```

Se algo divergir visualmente ao final da Fase 2, é bug de substituição — detectado antes de o tema escuro entrar em cena.

### 4.4 Paleta escura proposta

Valores iniciais, a serem confirmados na auditoria de contraste (T6.1):

| Token | Claro (atual) | Escuro (proposto) | Nota |
|---|---|---|---|
| `--color-background` | `#eef1f6` | `#12161c` | Fundo da aplicação |
| `--color-surface` | `#ffffff` | `#1a1f27` | Cards, tabelas, modais |
| `--color-surface-subtle` | `#f4f6f9` | `#212832` | Cabeçalho de tabela, card de resumo |
| `--color-border` | `#e1e6ee` | `#2c333f` | |
| `--color-text` | `#2d3748` | `#e4e8ef` | Contraste ~13:1 |
| `--color-text-muted` | `#718096` | `#9aa5b6` | Contraste ~7:1 |
| `--color-brand` | `#0b5cad` | `#0a4a8c` | Header levemente mais profundo |
| `--color-primary` (fundo) | `#0b5cad` | `#1a6ec0` | Mantém `#fff` legível por cima |
| `--color-primary-text` (novo) | `#0b5cad` | `#6bb2ee` | Links e itens ativos |
| `--color-income` | `#28a745` | `#4ade80` | Corrige P09 |
| `--color-expense` | `#e74c3c` | `#f87171` | Corrige P09 |
| `--color-success` | `#28a745` | `#4ade80` | |
| `--color-danger` | `#e74c3c` | `#f87171` | |
| `--color-warning` | `#f0ad4e` | `#fbbf24` | |
| `--color-on-success` (novo) | `#ffffff` | `#0d2818` | Texto sobre verde-claro (P07) |
| `--color-on-danger` (novo) | `#ffffff` | `#2b0f0f` | Texto sobre vermelho-claro (P07) |
| `--shadow-sm` | `rgba(15,23,42,.06)` | `rgba(0,0,0,.45)` | Corrige P08 |
| `--shadow-md` | `rgba(15,23,42,.08)` | `rgba(0,0,0,.55)` | |

O azul da marca é preservado como identidade; apenas os papéis de fundo e de texto são separados.

---

## 5. Épicos e Tasks

Complexidade: **PP** ≤ 30min · **P** ≤ 1h30 · **M** 2–4h.

---

### E1 — Camada de tokens

| ID | Task | Complexidade |
|---|---|---|
| **T1.1** | Definir a paleta escura e registrar a decisão | P |

- **Arquivos:** este documento (seção 4.4) + `docs/design-system.md` na T6.5
- **Fazer:** validar os valores propostos numa ferramenta de contraste antes de escrever CSS. Sem código.
- **Aceite:** tabela de paleta aprovada, com razão de contraste anotada para cada par texto/fundo.

| ID | Task | Complexidade |
|---|---|---|
| **T1.2** | Adicionar tokens semânticos faltantes (valores claros atuais) | M |

- **Arquivos:** `src/styles/tokens.css`
- **Fazer:** **adicionar** ao bloco `:root` existente, sem alterar nenhum token atual, os tokens que hoje estão hardcoded:
  - Superfícies: `--color-surface-subtle`, `--color-surface-hover`, `--color-overlay`
  - Texto sobre fundo semântico: `--color-on-primary`, `--color-on-success`, `--color-on-danger`, `--color-on-brand`
  - Papel de texto da marca: `--color-primary-text` (valor `#0b5cad`, idêntico ao atual)
  - Hovers: `--color-danger-hover`, `--color-success-hover`, `--color-primary-soft`
  - Ícones: `--color-icon`, `--color-icon-muted`
  - Foco: `--color-focus-ring`
  - Feedback: `--color-success-bg`, `--color-success-fg`, `--color-success-border` e os equivalentes `danger` e `warning` (para Toast e Badge)
  - Header: `--color-header-overlay`
- **Regra crítica:** cada token recebe **exatamente** o valor hardcoded que vai substituir. Nada muda visualmente.
- **Aceite:** `npm run build` limpo; comparação visual de todas as 8 rotas idêntica ao estado anterior.
- **Depende de:** T1.1

| ID | Task | Complexidade |
|---|---|---|
| **T1.3** | Criar o bloco `[data-theme='dark']` | M |

- **Arquivos:** `src/styles/tokens.css`
- **Fazer:** após o `:root`, adicionar `[data-theme='dark'] { ... }` com as sobrescritas da seção 4.4. Bloco inerte enquanto o atributo não for aplicado.
- **Aceite:** aplicando `data-theme="dark"` manualmente no DevTools, a aplicação escurece. Sem o atributo, nada muda.
- **Depende de:** T1.1, T1.2

| ID | Task | Complexidade |
|---|---|---|
| **T1.4** | Declarar `color-scheme` nos dois temas | PP |

- **Arquivos:** `src/styles/tokens.css`, `src/styles/global.css`
- **Fazer:** `:root { color-scheme: light; }` e `[data-theme='dark'] { color-scheme: dark; }`.
- **Aceite:** o seletor de data e o dropdown de select nativos renderizam escuros; barras de rolagem acompanham.
- **Resolve:** P03
- **Depende de:** T1.3

---

### E2 — Erradicar cores hardcoded

> Onze tasks mecânicas e independentes entre si. Cada uma troca literais por tokens **sem alterar o resultado visual no tema claro**. Podem ser paralelizadas entre pessoas diferentes.

| ID | Arquivo | O que trocar | Complexidade |
|---|---|---|---|
| **T2.1** | `components/ui/Button.module.css` | `#fff` → `--color-on-primary` / `--color-on-success` / `--color-on-danger` conforme a variante; `#c0392b` → `--color-danger-hover`; `#218838` → `--color-success-hover`; rgba do `ghost` → `--color-header-overlay` / `--color-on-brand` | P |
| **T2.2** | `components/layout/Sidebar.module.css` | `#9aa3af` → `--color-icon-muted`; `#5b6573` → `--color-icon`; `rgba(45,55,72,.04)` → `--color-surface-hover`; `rgba(11,92,173,.08)` → `--color-primary-soft`; `var(--color-primary)` usado como texto em `.active` → `--color-primary-text` | P |
| **T2.3** | `components/ui/DataTable.module.css` | fundo do `<th>` → `--color-surface-subtle`; hover de linha → `--color-surface-hover` | PP |
| **T2.4** | `pages/pages.module.css` | `.summaryItem` → `--color-surface-subtle`; hovers de `.actionDanger`/`.actionPaid` → tokens de danger/success | P |
| **T2.5** | `components/toast/Toast.module.css` | 6 hex → `--color-success-bg/fg/border` e `--color-danger-bg/fg/border` | PP |
| **T2.6** | `components/ui/Badge.module.css` | `#1e7e34` e `rgba(40,167,69,.12)` → tokens de success; `#9a6700` e `rgba(240,173,78,.18)` → tokens de warning | PP |
| **T2.7** | `components/ui/Modal.module.css` | overlay → `--color-overlay` | PP |
| **T2.8** | `components/ui/Input.module.css` + `Select.module.css` | anel de foco → `--color-focus-ring` | PP |
| **T2.9** | `components/layout/Header.module.css` | fundo do monograma → `--color-header-overlay` | PP |
| **T2.10** | `components/ui/CompetenciaSelector.module.css` | `#fff` da pill ativa → `--color-on-success`; `--color-primary` do hover → `--color-primary-text` | PP |
| **T2.11** | `pages/auth.module.css` | gradiente → `--color-primary-soft`; fundo do erro → `--color-danger-bg` | P |

- **Aceite comum a E2:** após cada task, a rota afetada é visualmente idêntica ao estado anterior no tema claro. `rg '#[0-9a-fA-F]{3,8}' src --glob '*.module.css'` deve retornar vazio ao final (o `tokens.css` passa a concentrar todos os literais).
- **Resolve:** P01, P02, P06 (parcial), P07, P10, P11, P12
- **Depende de:** T1.2

---

### E3 — Estado do tema

| ID | Task | Complexidade |
|---|---|---|
| **T3.1** | Criar `src/constants/theme.ts` | PP |

- **Arquivos:** novo `src/constants/theme.ts`
- **Fazer:** `export type ThemeMode = 'light' | 'dark' | 'system'`, `export type ResolvedTheme = 'light' | 'dark'`, `export const THEME_STORAGE_KEY = 'theme'`, `export const THEME_ATTRIBUTE = 'data-theme'`.
- **Aceite:** compila; sem consumidores ainda.

| ID | Task | Complexidade |
|---|---|---|
| **T3.2** | Criar `src/api/themeStorage.ts` | P |

- **Arquivos:** novo `src/api/themeStorage.ts`
- **Fazer:** objeto com `get(): ThemeMode | null`, `set(mode)`, `clear()`, seguindo a forma de `ambienteStorage.ts`. Usa **`localStorage`** (justificativa na seção 2.2). Validar o valor lido contra a união de tipos e retornar `null` se inválido — mesmo cuidado que `ambienteStorage` tem com `Number.isFinite`. Envolver os acessos em `try/catch` (modo privado de alguns navegadores lança em `localStorage`).
- **Aceite:** valor corrompido no storage não quebra a aplicação.
- **Depende de:** T3.1

| ID | Task | Complexidade |
|---|---|---|
| **T3.3** | Criar `ThemeContext` | M |

- **Arquivos:** novo `src/context/ThemeContext.tsx`
- **Fazer:** seguir o formato de `CompetenciaContext.tsx`. Expor `{ mode, resolvedTheme, setMode, toggleTheme }`. Estado inicial lido de `themeStorage` com fallback `'system'`. `useEffect` aplica `document.documentElement.setAttribute('data-theme', resolvedTheme)` e persiste. `toggleTheme` alterna entre `light` e `dark` a partir do `resolvedTheme` corrente. Hook `useTheme()` com o mesmo `throw` de guarda em português.
- **Aceite:** trocar o modo altera o atributo no `<html>` e grava no `localStorage`.
- **Depende de:** T3.2

| ID | Task | Complexidade |
|---|---|---|
| **T3.4** | Reagir a mudanças do sistema no modo `system` | P |

- **Arquivos:** `src/context/ThemeContext.tsx`
- **Fazer:** assinar `matchMedia('(prefers-color-scheme: dark)')` e recalcular `resolvedTheme` quando `mode === 'system'`. Remover o listener no cleanup.
- **Aceite:** com o modo `system`, alternar o tema do sistema operacional muda a aplicação sem reload.
- **Depende de:** T3.3

| ID | Task | Complexidade |
|---|---|---|
| **T3.5** | Registrar o `ThemeProvider` | PP |

- **Arquivos:** `src/main.tsx`
- **Fazer:** envolver a árvore com `<ThemeProvider>` como provider **mais externo** (acima de `ToastProvider`), já que o tema não depende de autenticação e precisa valer nas telas de login. Ordem dos demais providers preservada.
- **Aceite:** tema disponível também em `/login`, `/registro` e `/convites/aceitar`.
- **Depende de:** T3.3

| ID | Task | Complexidade |
|---|---|---|
| **T3.6** | Script anti-FOUC no `index.html` | P |

- **Arquivos:** `index.html`
- **Fazer:** `<script>` **síncrono e inline** no `<head>`, antes do módulo do bundle: lê `localStorage.theme`, resolve `system` via `matchMedia` e aplica `data-theme` no `documentElement`. Envolver em `try/catch` e manter minimalista (poucas linhas — é código bloqueante).
- **Aceite:** recarregar com tema escuro ativo não produz nenhum flash branco. Verificar com throttling de rede no DevTools.
- **Resolve:** P04
- **Depende de:** T3.1

| ID | Task | Complexidade |
|---|---|---|
| **T3.7** | Testes do `ThemeContext` | P |

- **Arquivos:** novo `src/context/ThemeContext.test.tsx`; ajustar `src/test/setup.ts`
- **Fazer:** **adicionar** mock de `window.matchMedia` ao setup (sem substituir o conteúdo existente). Testar: default `system`; `toggleTheme` alterna e persiste; valor inválido no storage cai no default; atributo aplicado no `documentElement`.
- **Aceite:** `npm test` verde.
- **Resolve:** P15
- **Depende de:** T3.4

---

### E4 — Botão de alternância

| ID | Task | Complexidade |
|---|---|---|
| **T4.1** | Adicionar `IconSun` e `IconMoon` | P |

- **Arquivos:** `src/components/layout/NavIcons.tsx`
- **Fazer:** duas funções novas usando `BaseIcon`, no mesmo padrão dos ícones existentes (24×24, `stroke="currentColor"`, `aria-hidden`). **Somente adicionar** — nenhum ícone atual é tocado.
- **Aceite:** ícones herdam a cor do contexto, como os demais.

| ID | Task | Complexidade |
|---|---|---|
| **T4.2** | Criar o componente `ThemeToggle` | P |

- **Arquivos:** novos `src/components/ui/ThemeToggle.tsx`, `ThemeToggle.module.css`
- **Fazer:** reutilizar `Button` com `size="icon"`. Prop opcional `variant` (default `'ghost'`, para uso no header). Mostra `IconMoon` no claro e `IconSun` no escuro. Acessibilidade: `aria-label` dinâmico ("Ativar tema escuro" / "Ativar tema claro"), `title` correspondente e `aria-pressed`.
- **Aceite:** navegável por teclado com foco visível; leitor de tela anuncia a ação.
- **Depende de:** T3.3, T4.1

| ID | Task | Complexidade |
|---|---|---|
| **T4.3** | Inserir o toggle no `Header` | PP |

- **Arquivos:** `src/components/layout/Header.tsx`
- **Fazer:** adicionar `<ThemeToggle />` dentro de `.actions`, **à esquerda** do botão "Sair". Nenhum elemento existente é removido ou reordenado.
- **Aceite:** visível em todas as rotas autenticadas; `.actions` já tem `gap` e `flex-shrink: 0`, então não deve exigir CSS novo — confirmar em 320px.
- **Depende de:** T4.2

| ID | Task | Complexidade |
|---|---|---|
| **T4.4** | *(Opcional)* Expor o toggle nas telas de autenticação | P |

- **Arquivos:** `src/pages/auth.module.css` e as três páginas de auth
- **Fazer:** posicionar o toggle no canto superior da tela de login/registro/convite, já que essas rotas não renderizam o `Header`.
- **Aceite:** usuário consegue trocar o tema antes de autenticar.
- **Nota:** se o drawer mobile de `docs/levantamento-responsividade.md` (T3.1–T3.5) for implementado, avaliar também um item de tema dentro dele. Dependência opcional entre os dois levantamentos.
- **Depende de:** T4.2

| ID | Task | Complexidade |
|---|---|---|
| **T4.5** | Transição suave entre temas | P |

- **Arquivos:** `src/styles/global.css`
- **Fazer:** transição curta (~150ms) de `background-color`, `color` e `border-color` em superfícies. **Não usar `transition: all` em `*`** — degrada a performance de rolagem em listas longas. Restringir aos elementos estruturais. Incluir bloco `prefers-reduced-motion: reduce` desativando a transição, seguindo o padrão do projeto.
- **Aceite:** troca fluida, sem *jank* perceptível na página de despesas com muitos registros.
- **Depende de:** T1.3

---

### E5 — Integração com o navegador

| ID | Task | Complexidade |
|---|---|---|
| **T5.1** | `<meta name="theme-color">` dinâmico | P |

- **Arquivos:** `index.html`, `src/context/ThemeContext.tsx`
- **Fazer:** adicionar a meta tag ao `<head>` e atualizar seu `content` no efeito do contexto, acompanhando `--color-brand` de cada tema.
- **Aceite:** a barra do navegador no Android acompanha o tema.
- **Resolve:** P13
- **Depende de:** T3.3

| ID | Task | Complexidade |
|---|---|---|
| **T5.2** | Validar controles nativos no tema escuro | P |

- **Arquivos:** verificação; ajustes pontuais em `Input.module.css` / `Select.module.css` se necessário
- **Fazer:** conferir `<input type="date">` (Despesas e Receitas), `<input type="number">` e todos os `<select>` no escuro, em Chrome, Firefox e Safari. A `color-scheme` da T1.4 deve resolver a maior parte; documentar o que sobrar.
- **Aceite:** nenhum popup nativo branco sobre a UI escura.
- **Depende de:** T1.4

| ID | Task | Complexidade |
|---|---|---|
| **T5.3** | Estilizar as barras de rolagem | PP |

- **Arquivos:** `src/styles/global.css`
- **Fazer:** `scrollbar-color` para Firefox e `::-webkit-scrollbar-*` para Chromium, ancorados em tokens. Relevante porque `.main` e `.wrapper` do `DataTable` têm scroll próprio.
- **Aceite:** barras internas não destoam do tema.
- **Depende de:** T1.3

| ID | Task | Complexidade |
|---|---|---|
| **T5.4** | Revisar o gradiente das telas de autenticação | PP |

- **Arquivos:** `src/pages/auth.module.css`
- **Fazer:** validar que o `radial-gradient` tokenizado na T2.11 tem intensidade adequada no escuro; ajustar a opacidade do token se necessário.
- **Aceite:** login com profundidade visual equivalente nos dois temas.
- **Depende de:** T2.11, T1.3

---

### E6 — Qualidade e documentação

| ID | Task | Complexidade |
|---|---|---|
| **T6.1** | Auditoria de contraste WCAG AA | M |

- **Fazer:** medir todos os pares texto/fundo do tema escuro. Mínimos: **4.5:1** para texto normal, **3:1** para texto grande e para bordas de componentes de interface. Atenção especial a `--color-income` / `--color-expense` sobre `--color-surface` (P09), ao Badge e ao Toast.
- **Aceite:** planilha de razões preenchida; nenhum par abaixo do mínimo; ajustes aplicados em `tokens.css`.
- **Resolve:** P09
- **Depende de:** T1.3, E2 completo

| ID | Task | Complexidade |
|---|---|---|
| **T6.2** | Matriz de QA visual | P |

- **Fazer:** percorrer as 8 rotas nos dois temas, cobrindo os estados que só aparecem em interação: modal de exclusão aberto, toast de sucesso e de erro, badge pago e pendente, formulário com erro de validação, tabela vazia (`emptyMessage`), botão desabilitado, item de menu ativo e estado de foco por teclado. Registrar na seção 9.
- **Aceite:** matriz preenchida sem pendências.
- **Depende de:** T4.3

| ID | Task | Complexidade |
|---|---|---|
| **T6.3** | Teste do `ThemeToggle` | P |

- **Arquivos:** novo `src/components/ui/ThemeToggle.test.tsx`
- **Fazer:** clicar alterna o atributo no `documentElement`; `aria-label` e `aria-pressed` mudam conforme o tema.
- **Depende de:** T3.7, T4.2

| ID | Task | Complexidade |
|---|---|---|
| **T6.4** | Verificação anti-regressão do tema claro | P |

- **Fazer:** comparar as 8 rotas no tema claro contra capturas feitas **antes** da Fase 1. É a rede de segurança da regra 1.3.
- **Aceite:** nenhuma diferença visual no tema claro.
- **Depende de:** E2 completo

| ID | Task | Complexidade |
|---|---|---|
| **T6.5** | Atualizar `docs/design-system.md` | P |

- **Fazer:** documentar a tabela de tokens dos dois temas, o mecanismo `data-theme`, os três modos e a orientação de **sempre usar token, nunca literal**, em novos componentes.
- **Resolve:** P16, P14 (documentar `--color-sidebar` como órfão preservado)
- **Depende de:** T6.1

---

## 6. Ordem de Execução

| Fase | Épicos | Tasks | Entrega | Esforço |
|---|---|---|---|---|
| **1 — Tokens** | E1 (T1.1, T1.2) | 2 | Vocabulário semântico completo. **Zero mudança visual.** | ~4h |
| **2 — Tokenização** | E2 | 11 | Nenhuma cor literal fora do `tokens.css`. **Zero mudança visual.** Paralelizável. | ~5h |
| **3 — Paleta escura** | E1 (T1.3, T1.4) | 2 | Tema escuro funcional via DevTools, ainda sem UI. | ~3h |
| **4 — Estado** | E3 | 7 | Persistência, modo `system` e anti-FOUC. | ~6h |
| **5 — Botão** | E4 | 5 | Funcionalidade entregue ao usuário. | ~4h |
| **6 — Navegador** | E5 | 4 | Controles nativos, barra do navegador e scrollbars. | ~2h |
| **7 — QA** | E6 | 5 | Contraste, testes e documentação. | ~6h |

**Total: 36 tasks · ~30h.**

As fases 1 e 2 representam metade do esforço e **não produzem nenhum efeito visível** — é dívida técnica sendo paga para que a troca de tema seja possível. Vale alinhar essa expectativa antes de começar: não há como entregar um tema escuro consistente sem essa base, e o retorno é que qualquer ajuste futuro de paleta passa a ser uma alteração de uma linha.

---

## 7. Mapa Problema → Task

| Problema | Sev. | Tasks |
|---|---|---|
| P01 Cores hardcoded | A | T1.2, T2.1–T2.11 |
| P02 Superfícies claras em `rgba` | A | T1.2, T2.3, T2.4 |
| P03 Sem `color-scheme` | A | T1.4, T5.2 |
| P04 FOUC | A | T3.6 |
| P05 Sem camada de tema | A | T1.3 |
| P06 `--color-primary` com papel duplo | B | T1.2, T2.2, T2.10 |
| P07 `#fff` sobre fundo semântico | B | T1.2, T2.1, T2.10 |
| P08 Sombras invisíveis | B | T1.3 |
| P09 Contraste das cores de dinheiro | B | T1.1, T6.1 |
| P10 Toast hardcoded | B | T2.5 |
| P11 Badge hardcoded | B | T2.6 |
| P12 Gradiente de auth | C | T2.11, T5.4 |
| P13 Sem `theme-color` | C | T5.1 |
| P14 `--color-sidebar` órfão | C | T6.5 |
| P15 Sem testes | C | T3.7, T6.3 |
| P16 Doc desatualizada | C | T6.5 |

---

## 8. Critérios de Aceite Globais

1. **O tema claro permanece pixel a pixel idêntico** ao estado atual (regra 1.3, verificado em T6.4).
2. Um clique no botão do header alterna o tema, com efeito **imediato em todas as rotas**.
3. A preferência **persiste entre sessões** e após fechar o navegador.
4. **Nenhum flash** de tema claro ao carregar com o escuro ativo.
5. Sem escolha explícita, a aplicação **respeita o tema do sistema operacional** e reage à sua mudança em tempo real.
6. **Todos os pares de cor atingem WCAG AA** no tema escuro (4.5:1 texto normal, 3:1 texto grande e bordas).
7. **Nenhum controle nativo** (data, select, scrollbar) renderiza claro sobre a UI escura.
8. `rg '#[0-9a-fA-F]{3,8}' src --glob '*.module.css'` **retorna vazio** — todos os literais concentrados em `tokens.css`.
9. Suíte verde (`npm test`) e build limpo (`npm run build`).
10. **Nenhuma classe, componente ou teste preexistente removido** (seção 1).

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Substituir 34 cores pode alterar o tema claro sem ninguém notar | **Alto** | Cada token da T1.2 recebe exatamente o literal que substitui; capturas de tela antes da Fase 1 e comparação em T6.4 |
| Cores semânticas de dinheiro reprovarem em contraste | Alto — é um app financeiro | T6.1 é bloqueante para a entrega; valores propostos em 4.4 já partem de tons mais claros |
| Script inline anti-FOUC quebrar em modo privado ou com storage bloqueado | Médio | `try/catch` obrigatório e fallback para `system` |
| `transition` global degradar a rolagem em listas longas | Médio | Proibido `transition: all` em `*`; restrito a elementos estruturais e desativado em `prefers-reduced-motion` |
| Conflito de merge com o levantamento de responsividade em `Header.tsx`, `NavIcons.tsx` e `tokens.css` | Médio | Seção 1.1: não executar os dois em paralelo nesses arquivos |
| Alguém reaproveitar por engano o `prefers-color-scheme` órfão de `index.css` | Baixo | Regra 1.2 explícita; arquivo não é importado |
| `localStorage` em vez de `sessionStorage` divergir da convenção | Baixo | Desvio justificado e documentado na seção 2.2 e no `themeStorage.ts` |

---

## 10. Fora de Escopo

Registrado para decisão futura:

- Seletor de três estados (claro / escuro / sistema) na interface — o modo `system` existe no estado, mas o botão alterna apenas entre dois valores.
- Temas adicionais além de claro e escuro.
- Persistência da preferência no backend (por usuário, sincronizada entre dispositivos) — hoje é por navegador.
- Modo de alto contraste (`prefers-contrast`).
- Remoção de `src/index.css` e `src/App.css` (proibida pela seção 1).
- Remoção do token órfão `--color-sidebar` (proibida pela seção 1).

---

## 11. Registro da Matriz de QA (preencher em T6.2)

| Rota / Estado | Claro | Escuro |
|---|---|---|
| `/login` | | |
| `/registro` | | |
| `/convites/aceitar` | | |
| `/despesas` — lista | | |
| `/despesas` — formulário aberto | | |
| `/despesas` — erro de validação | | |
| `/despesas` — modal de exclusão | | |
| `/despesas` — tabela vazia | | |
| `/receitas` | | |
| `/categorias` | | |
| `/pagadores` | | |
| `/convites` | | |
| Toast de sucesso | | |
| Toast de erro | | |
| Badge pago / pendente | | |
| Botão desabilitado | | |
| Item de menu ativo | | |
| Foco por teclado | | |

---

## 12. Registro da Implementação

### 12.1 O que foi entregue

Todas as tasks de E1 a E5 foram implementadas. De E6 ficaram concluídas as automatizadas (T6.3 testes, T6.5 documentação); as que exigem navegador real seguem pendentes: **T6.1** (medição de contraste com ferramenta), **T6.2** (matriz da seção 11) e **T6.4** (comparação visual do tema claro antes/depois).

O critério de aceite 8 já está satisfeito: a busca por `#hex` e `rgba()` em `src/**/*.module.css` retorna vazio.

### 12.2 Desvios conscientes do plano

1. **Dois tokens de superfície tênue em vez de um.** O plano previa consolidar `rgba(238, 241, 246, 0.55)` (blocos de resumo) e `rgba(238, 241, 246, 0.65)` (cabeçalho de tabela) num só token. Como os alfas diferem, unificar mudaria o tema claro e violaria a regra 1.3. Ficaram `--color-surface-subtle` e `--color-table-header`, cada um com o valor exato que substituiu.

2. **Escopo maior que os 34 literais mapeados.** A implementação de responsividade, concluída antes desta, introduziu quatro cores literais novas (overlay do drawer, hover e foco do botão hambúrguer, hover do botão de fechar do drawer, gradiente de dica de rolagem da tabela). Todas foram tokenizadas junto, o que gerou `--color-scroll-hint` e reaproveitou `--color-overlay` e `--color-surface-hover`.

3. **Transição restrita a `body` e campos de formulário.** O plano falava em "elementos estruturais". Na prática, incluir superfícies como `td` faria o navegador animar milhares de nós ao trocar o tema numa tabela de lançamentos. Cards e tabelas trocam instantaneamente; só o fundo da página e os campos animam.

4. **Botão de tema fora do header no mobile (ajuste à T4.3).** Somados hambúrguer, marca, botão de tema e "Sair", sobravam cerca de 116px para o nome da aplicação numa tela de 360px — abaixo dos ~150px que "Registros Financeiros" ocupa. O botão foi para o rodapé do drawer, com rótulo "Tema", e o `Header` ganhou a prop opcional `showThemeToggle` (default `true`, preservando o comportamento para quem já o usava). Coberto por teste em `AppShell.test.tsx`.

5. **Moldura `AuthPage` criada para a T4.4.** `AceitarConvitePage` tem cinco retornos distintos, todos repetindo `.authPage` + `.card`. Em vez de inserir o botão nos sete pontos, o par virou o componente `src/pages/AuthPage.tsx`. A marcação renderizada é idêntica; nenhuma classe de `auth.module.css` foi removida.

6. **Sem customização de barra de rolagem (T5.3).** Estilizar `::-webkit-scrollbar` ou `scrollbar-width` alteraria também a aparência do tema claro, contra a regra 1.3. A declaração `color-scheme` em ambos os temas já faz o navegador renderizar a barra no tom certo, que era o objetivo da task.

### 12.3 Contraste — o que ainda precisa ser medido

Os valores da paleta escura foram escolhidos com estimativa de luminância relativa, não com ferramenta de medição. As margens calculadas ficam confortavelmente acima de AA (o par mais apertado é `--color-on-primary` branco sobre `--color-primary` `#1a6ec0`, em torno de 5,3:1), mas **T6.1 continua sendo o passo bloqueante** antes de considerar a entrega fechada.
