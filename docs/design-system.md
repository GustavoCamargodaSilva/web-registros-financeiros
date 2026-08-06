# Design System — Registros Financeiros

> **Fonte visual:** referência de produto financeiro tipo Falcon Finanças (dashboard SaaS claro, header azul, sidebar cinza, cards brancos, semântica vermelho/verde para dinheiro).  
> **Produto:** Registros Financeiros (não copiar marca/logo de terceiros).  
> **Código:** tokens em `src/styles/tokens.css`. Toda UI nova ou alteração visual **deve** seguir este documento.

---

## 1. Posicionamento

| Item | Definição |
|------|-----------|
| Produto | App de controle financeiro doméstico / ambiente compartilhado |
| Público | Casais e pessoas que registram despesas e receitas por competência |
| Tom | Profissional, limpo, legível — prioriza dados e ações, não marketing |
| Assinatura visual | Header azul sólido + semântica forte de dinheiro (vermelho = saída, verde = entrada) |

---

## 2. Princípios

1. **Dados primeiro** — valores monetários e status de pagamento devem ser óbvios à primeira leitura.
2. **Cards como módulos** — cada bloco de conteúdo (lista, formulário, resumo, gráfico) vive em superfície branca.
3. **Hierarquia por cor, não por decoração** — azul = marca/navegação; vermelho/verde = dinheiro; cinza = estrutura.
4. **Um padrão de navegação** — grupos expansíveis no menu (Despesas, Receitas) com subitens; clique na linha inteira abre/fecha.
5. **Sem estética genérica de “AI landing”** — sem cream+terracotta, sem dark+neon, sem layout jornal. Este DS é SaaS financeiro claro.

---

## 3. Paleta (tokens)

Usar sempre as variáveis CSS. **Nenhum hex ou `rgba()` literal é permitido em `*.module.css`** — o tema escuro depende disso: uma cor fixa não muda quando o tema troca e vira uma mancha clara sobre o fundo escuro. Os hex abaixo são os valores do tema claro; a seção 3.1 traz os equivalentes escuros.

| Token | Hex (claro) | Uso |
|-------|-----|-----|
| `--color-brand` | `#0B5CAD` | Header top bar, marca, links ativos fortes |
| `--color-brand-hover` | `#094A8F` | Hover de ações na marca |
| `--color-primary` | `#0B5CAD` | **Fundo** de botão primário e realces sólidos |
| `--color-primary-hover` | `#094A8F` | Hover do primário |
| `--color-primary-text` | `#0B5CAD` | **Texto, borda e anel de foco** da marca sobre superfície |
| `--color-income` | `#28A745` | Receitas, saldos positivos, “realizado” a receber |
| `--color-expense` | `#E74C3C` | Despesas, a pagar, valores de saída |
| `--color-success` | `#28A745` | Feedback positivo / pago |
| `--color-warning` | `#F0AD4E` | Alertas, segmentos secundários de gráfico |
| `--color-danger` | `#E74C3C` | Erro, exclusão, despesa |
| `--color-background` | `#EEF1F6` | Fundo da área de conteúdo |
| `--color-sidebar` | `#F4F6F9` | Fundo da sidebar |
| `--color-surface` | `#FFFFFF` | Cards, inputs, painéis |
| `--color-border` | `#E1E6EE` | Bordas de card, tabela, inputs |
| `--color-text` | `#2D3748` | Texto principal |
| `--color-text-muted` | `#718096` | Labels, meta, placeholders |
| `--color-header-text` | `#FFFFFF` | Texto/ícones no header azul |

Tokens derivados, criados para que nada precise de cor literal:

| Grupo | Tokens |
|-------|--------|
| Texto sobre fundo sólido | `--color-on-primary`, `--color-on-success`, `--color-on-danger` |
| Hover de botão semântico | `--color-success-hover`, `--color-danger-hover` |
| Superfícies derivadas | `--color-surface-subtle`, `--color-surface-hover`, `--color-table-header`, `--color-row-hover`, `--color-overlay`, `--color-scroll-hint` |
| Realces da marca | `--color-primary-soft`, `--color-focus-ring`, `--color-auth-glow` |
| Ícones | `--color-icon`, `--color-icon-muted` |
| Sobre o header azul | `--color-header-mark`, `--color-header-overlay`, `--color-header-border` |
| Toast e alertas | `--color-success-bg/fg/border`, `--color-danger-bg/fg/border`, `--color-success-soft`, `--color-success-outline`, `--color-danger-soft`, `--color-danger-surface` |
| Badges | `--color-badge-success-bg/fg`, `--color-badge-warning-bg/fg` |

### 3.1 Tema claro e escuro

O tema é aplicado por `data-theme="light" \| "dark"` no `<html>`. O bloco `[data-theme='dark']` em `src/styles/tokens.css` sobrescreve **apenas cores** — espaçamento, raio e layout continuam vindo do `:root`.

Pontos de atenção ao criar cor nova:

- **Papel duplo do azul.** `--color-primary` é fundo (precisa ser escuro o bastante para o rótulo branco); `--color-primary-text` é texto e borda (precisa clarear no escuro para ter contraste com a superfície). Escolher pelo papel, não pelo tom.
- **Verde e vermelho invertem o texto.** No escuro, `--color-success` e `--color-danger` ficam claros, então `--color-on-success` e `--color-on-danger` passam a ser tons escuros. Nunca escrever `color: #fff` sobre eles.
- **Translúcidos brancos, não cinzas.** Realces do tipo `rgba(45, 55, 72, 0.04)` escurecem uma superfície clara, mas somem numa escura. No escuro os equivalentes usam branco com alfa baixo.
- **Sombras precisam de preto opaco.** As sombras suaves do tema claro são invisíveis sobre fundo escuro; `--shadow-sm/md` são redefinidos no bloco escuro.
- **`color-scheme`** é declarado nos dois temas para que date pickers, selects e barras de rolagem nativas acompanhem — sem isso o calendário do `input[type=date]` abre branco no escuro.

O estado vive em `src/context/ThemeContext.tsx`, com três modos: `light`, `dark` e `system` (padrão). A preferência vai para o `localStorage` (e não `sessionStorage`, usado por token e ambiente) porque é conforto visual e deve sobreviver ao fechamento do navegador. Um script inline no `index.html` aplica o atributo antes do primeiro paint; sem ele a tela pisca branca ao carregar no escuro.

O botão fica no header no desktop e no rodapé do drawer no mobile — no header de 360px ele truncaria o nome da aplicação. Nas telas de autenticação a moldura `AuthPage` o posiciona no canto superior direito.

### Regras semânticas de dinheiro

| Conceito | Cor |
|----------|-----|
| Despesa / a pagar / saída | `--color-expense` |
| Receita / a receber / entrada | `--color-income` |
| Neutro / saldo sem julgamento | `--color-text` ou `--color-primary` |
| Pago / concluído | `--color-success` |
| Pendente | `--color-warning` ou muted + badge |

---

## 4. Tipografia

| Papel | Família | Peso | Tamanho ref. |
|-------|---------|------|----------------|
| UI / corpo | `DM Sans` (fallback: system-ui) | 400 / 500 | 14–16px |
| Título de página | `DM Sans` | 700 | 22–28px |
| Valor monetário | `DM Sans` tabular nums | 700 | 16–24px (destaque até 32px) |
| Label / caption | `DM Sans` | 500 | 12–13px, `--color-text-muted` |

- Preferir **sentence case** em labels e botões (“Salvar”, “Cadastrar”).
- Valores monetários: formato `pt-BR` (`R$ 1.234,56`), alinhados à direita em tabelas.
- Evitar Inter/Roboto como “rosto” do produto; o stack oficial é **DM Sans**.

---

## 5. Espaçamento, raio e sombra

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-xs` | `4px` | Gaps mínimos |
| `--spacing-sm` | `8px` | Entre itens de lista / chips |
| `--spacing-md` | `16px` | Padding interno de card pequeno |
| `--spacing-lg` | `24px` | Padding de página / entre cards |
| `--spacing-xl` | `32px` | Seções maiores |
| `--radius-sm` | `6px` | Inputs, chips |
| `--radius-md` | `10px` | Cards, botões |
| `--radius-pill` | `999px` | Pills de competência (mês) |
| `--shadow-sm` | `0 1px 3px rgba(15, 23, 42, 0.06)` | Cards |
| `--shadow-md` | `0 4px 12px rgba(15, 23, 42, 0.08)` | Dropdown / modal |

### Tokens de layout e responsividade

| Token | Valor | Uso |
|-------|-------|-----|
| `--header-height` | `56px` | Altura base do header (cresce com a safe area) |
| `--sidebar-width` | `248px` | Sidebar fixa no desktop |
| `--drawer-width` | `280px` | Drawer no mobile (limitado a `85vw`) |
| `--page-padding` | `24px` → `16px` em ≤640px | Padding do `main` |
| `--tap-target-min` | `44px` | Alvo mínimo de toque abaixo de 900px |
| `--safe-top/right/bottom/left` | `env(safe-area-inset-*)` | Notch e barra inferior do iOS |
| `--z-header` / `--z-drawer` / `--z-modal` / `--z-toast` | `20` / `800` / `900` / `1000` | Ordem de empilhamento |

---

## 6. Layout (shell)

### Desktop

```
+----------------------------------------------------------+
| HEADER azul (marca | ambiente | usuario | sair)          |
+------------+---------------------------------------------+
| SIDEBAR    | MAIN fundo cinza                            |
| cinza      |  +-------- card branco --------+            |
| menu       |  | titulo / filtros / conteudo |            |
| accordion  |  +-----------------------------+            |
|            |  +---- card ----+  +---- card ----+         |
+------------+---------------------------------------------+
```

| Região | Spec |
|--------|------|
| Header | Altura ~56–64px, fundo `--color-brand`, texto branco |
| Sidebar | Largura ~240–260px, fundo `--color-sidebar`, borda direita sutil |
| Main | Padding `--spacing-lg`, fundo `--color-background` |
| Cards | Fundo `--color-surface`, raio `--radius-md`, borda `--color-border` + `--shadow-sm` |

### Menu lateral

- Estilo árvore (referência Falcon): fundo branco, caret triangular à **esquerda** (▶ fechado / ▼ aberto), ícone linear + label.
- Grupos (**Despesas**, **Receitas**): clique em **qualquer lugar** da linha abre/fecha.
- Subitens indentados com ícone + texto (ex.: Cadastro, Categorias / Cadastro, Pagadores).
- Item ativo: fundo azul translúcido + texto/ícone `--color-primary`.
- Ícones outline, stroke fino, cinza → primary quando ativo.

### Breakpoints

Escala desktop-first. Os valores vivem em `src/constants/breakpoints.ts` (JS) e estão
documentados no topo de `src/styles/tokens.css` (CSS). **Não criar breakpoints novos.**

| Nome | Consulta | Alvo |
|------|----------|------|
| `xs` | `max-width: 480px` | Celular pequeno (referência: 360px) |
| `sm` | `max-width: 640px` | Celular padrão |
| `md` | `max-width: 900px` | **Corte mobile/desktop** |
| `lg` | `max-width: 1200px` | Notebook |

Como Custom Properties não funcionam dentro de `@media`, os literais ficam nas próprias
consultas. Para decisões que o CSS não resolve (trocar componente, não só estilo), use
`useBreakpoint()`, que lê os mesmos valores — CSS e JS concordam no mesmo pixel.

### Mobile (≤ 900px)

- Header compacto azul, com botão hambúrguer à esquerda. Abaixo de 480px o nome do
  usuário sai do header e aparece no topo do drawer.
- **Sidebar vira drawer**: painel deslizante sobre overlay, com foco preso, fechamento
  por `Escape`, por toque no overlay, pelo botão de fechar e ao escolher um item.
- `DataTable` **troca a tabela por cartões** (ver seção 7).
- Cards empilham em coluna única; o `main` devolve a rolagem ao documento para que o
  navegador consiga ocultar a barra de endereço.
- Modal vira **bottom sheet** abaixo de 640px.
- Alvos de toque com no mínimo `--tap-target-min`.
- Bottom nav (futuro): no máximo 3–4 destinos primários; fundo branco, ícone + label.

---

## 7. Componentes

### Botão

| Variante | Uso |
|----------|-----|
| `primary` | Ação principal da tela (Salvar, Cadastrar) |
| `success` | Confirmar pagamento / ação positiva financeira |
| `danger` | Excluir / ação destrutiva |
| `outline` | Secundário (Fechar, Cancelar, Sair) |

Altura padrão: 40px no desktop, `--tap-target-min` (44px) abaixo de 900px. Raio: `--radius-md`.
Sem pills em botões de formulário (pills só em filtros de mês).

### Input / Select

- Fundo branco, borda `--color-border`, focus ring `--color-primary`.
- Label acima, muted, 13px.
- Erro: borda/texto `--color-danger`.
- Abaixo de 900px a fonte sobe para **16px**: com menos que isso o Safari do iOS aplica
  zoom automático ao focar o campo e desalinha o layout inteiro.

### Card

- Um propósito por card.
- Título opcional no topo (peso 600–700).
- Sem “card dentro de card” desnecessário.

### Tabela (`DataTable`)

- Cabeçalho muted, linhas com borda inferior leve.
- Hover de linha sutil (`background` cinza muito claro).
- Colunas de valor à direita; ações (Editar) à direita.

**Abaixo de 900px cada linha vira um cartão**, porque larguras fixas em 7 colunas forçariam
rolagem horizontal permanente. O que aparece no cartão é definido por coluna:

| Campo | Efeito no cartão |
|-------|------------------|
| `priority: 'primary'` | Destaque no topo (ex.: descrição à esquerda, valor à direita) |
| `priority: 'secondary'` | Par rótulo/valor no corpo — **padrão** |
| `priority: 'low'` | Igual ao secondary, porém sempre por último |
| `priority: 'actions'` | Rodapé do cartão, sem rótulo |
| `hideOnMobile: true` | Some do cartão e **permanece** na tabela do desktop (ex.: coluna ID) |

Toda coluna nova deve declarar sua prioridade. `mobileMode="scroll"` mantém a tabela com
rolagem horizontal quando o cartão não fizer sentido.

#### Presets de largura (desktop)

Larguras centralizadas em `src/constants/tableColumnWidths.ts` (espelhadas pelos tokens
`--table-col-*` em `tokens.css`). **Dentro de uma mesma tabela, usar apenas percentuais**
que somem 100% — evitar misturar `px` e `%` sem mapa documentado.

| Preset | Uso | Largura |
|--------|-----|---------|
| `textPrimary` | Descrição, pagador, nome principal | `20%` |
| `textSecondary` | Responsável | `15%` |
| `textTertiary` | Cartão, categoria | `13%` |
| `money` | Valor monetário (+ `align: 'right'`) | `10%` |
| `date` | Vencimento, pagamento (+ `align: 'right'`) | `11%` |
| `status` | Badge pago/pendente | `10%` |
| `short` | Parcela, ID | `8%` / `10%` |
| `actions` | Botões de ação | `13%`–`18%` |

Mapas prontos por tela: `DESPESAS_TABLE_WIDTHS`, `RECEITAS_TABLE_WIDTHS`, etc.
Helper: `columnWidth('textPrimary')`.

#### Formulários

- **`.formGrid`** — grade de 3 colunas iguais (Despesas, Receitas). Campos condicionais
  devem ser agrupados para preferir linhas completas de 3.
- **`.formNarrow`** — exceção intencional para cadastros de campo único (Categorias,
  Pagadores, Cartões, Convites): `max-width: 480px`, não segue a grade ampla.

### Badge / status

- Pago → verde; Pendente → warning ou cinza; Conjunta/Individual → neutro/primary suave.

### Seletor de competência

- Ano: pills `←` | `2026` | `→` (ano em verde; mínimo `ANO_BASE = 2026`).
- Mês: pills JAN…DEZ; ativo preenchido em success.
- Mesmo controle em Despesas e Receitas.

### Resumo / Stat

- Label pequeno muted + valor grande em semântica (expense/income).
- Ícone opcional à esquerda, nunca emoji.

### Gráficos (quando existirem)

- Linha/área: despesas vs receitas no tempo.
- Donut: categorias do mês; total no centro.
- Cores de série derivadas da paleta (expense, income, warning, primary).

---

## 8. Copy (microcopy)

- Botões: verbo no infinitivo/imperativo curto — “Cadastrar”, “Salvar”, “Fechar”.
- Toast de sucesso: passado — “Despesa cadastrada com sucesso”.
- Erro: o que falhou + o que fazer — sem pedido de desculpas.
- Empty state: convite a agir — “Nenhuma despesa neste mês. Cadastre a primeira.”

---

## 9. Acessibilidade (piso)

- Contraste AA em texto sobre fundo.
- Foco de teclado visível (outline primary).
- `prefers-reduced-motion`: reduzir animações de menu/chevron e do drawer.
- Não depender só de cor para status (complementar com texto/ícone).
- Alvos de toque de no mínimo 44×44px abaixo de 900px (`--tap-target-min`).
- Overlays (drawer e modal) prendem o foco, fecham com `Escape` e bloqueiam a rolagem do
  fundo. O bloqueio é centralizado em `src/utils/scrollLock.ts`, com contagem de
  referências para o caso de drawer e modal abertos ao mesmo tempo.

---

## 10. Do / Don’t

| Do | Don’t |
|----|-------|
| Usar tokens de `tokens.css` | Hex ou `rgba()` solto em CSS modules |
| Escolher o token pelo papel (`--color-primary-text` para texto) | Reaproveitar `--color-primary` para tudo |
| `--color-on-success` sobre fundo verde | `color: #fff` sobre fundo semântico |
| Cards brancos no fundo cinza | Fundo branco flat sem hierarquia |
| Vermelho/verde só para dinheiro/status | Colorir tudo de azul |
| Menu accordion com clique na linha inteira | Só a setinha clicável |
| Tipografia DM Sans | Voltar a Inter “genérico” sem motivo |
| Seguir este DS em toda página nova | Inventar outro visual por tela |

---

## 11. Checklist antes de merge de UI

- [ ] Cores/espaços/raios vêm de tokens — zero hex/`rgba()` em `*.module.css`
- [ ] Tela conferida nos dois temas, incluindo overlays, toasts e badges
- [ ] Token de cor novo declarado no `:root` **e** no bloco `[data-theme='dark']`
- [ ] Valores financeiros com semântica correta
- [ ] Shell (header/sidebar/main) respeitado
- [ ] Sem rolagem horizontal entre 320px e 1920px
- [ ] Colunas novas de `DataTable` declaram `priority`
- [ ] Colunas de tabela usam preset de `tableColumnWidths.ts` (ou mapa documentado que soma 100%)
- [ ] Alvos de toque ≥ 44px abaixo de 900px
- [ ] Breakpoints restritos à escala da seção 6
- [ ] Textos e empty states no tom do DS
- [ ] Nenhum desvio “por estética” sem atualizar este documento

---

## 12. Evolução

Mudanças de padrão (nova cor, novo componente global) **atualizam este arquivo e `tokens.css` no mesmo PR**. Páginas não definem sistema paralelo.
