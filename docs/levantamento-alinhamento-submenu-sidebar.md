# Levantamento Técnico

## Objetivo

Corrigir o alinhamento horizontal dos itens do submenu da sidebar esquerda: ao expandir um grupo (ex.: Despesas), os filhos (Cadastro, Categorias, Cartão) devem abrir **abaixo** do grupo, com **ícone e rótulo na mesma coluna vertical** dos ícones/rótulos da opção principal (e do Home), sem o recuo extra que gera sensação de menu “torto”.

## Contexto Atual

- Repo: `web-registros-financeiros`
- Menu lateral: componente `Sidebar` usado no desktop (`AppShell` → `<aside>`) e no mobile (`Drawer`)
- Estrutura do menu:
  - Links de topo (`topLinks`): Home
  - Grupos expansíveis (`baseMenuGroups`): Despesas, Receitas, Usuário (este último filtrado por `canManageMembros`)
- Cada grupo: botão `.itemRow` com caret + ícone + label; filhos em `.subnav` → `NavLink` `.sublink`
- Home já reserva espaço do caret via `.topLinkSpacer` (16px) para alinhar o ícone com os grupos

### Causa raiz (verificada no CSS)

Em `Sidebar.module.css`, `.sublink` usa `padding-left: 38px`.

Coluna do ícone da opção principal (`.itemRow`):

| Trecho | Valor |
|--------|------:|
| `padding-left` do `.itemRow` | 6px |
| largura `.caret` | 16px |
| `gap` do flex | 8px |
| **início do `.icon` do grupo** | **30px** |

Início do ícone do submenu: **38px** → **8px à direita** do ícone do pai. Isso corresponde ao desalinhamento da captura anexada.

Não há lógica de negócio envolvida: é layout/CSS (com possível ajuste estrutural mínimo no JSX para espelhar o padrão do Home).

## Fluxo Atual

1. Usuário clica no botão do grupo (`handleGroupClick`) → `openGroups[id]` alterna.
2. Se aberto, renderiza `.subnav` com `NavLink`s filhos.
3. Estilo `.sublink` aplica padding esquerdo 38px → filhos visualmente mais à frente que o ícone/label do pai.
4. Item ativo usa `.active` (fundo soft / cor primary-text); isso **não** causa o desalinhamento.

## Fluxo Proposto

1. Mesmo fluxo de expansão/navegação (sem mudança de rotas, permissões ou estado).
2. Ao abrir o submenu, ícone e texto dos filhos alinhados à coluna de ícone/texto do pai (e do Home).
3. Desktop e drawer mobile com o mesmo alinhamento (mesmo CSS module).

## Arquivos Envolvidos

| Arquivo | Motivo | Impacto | Responsabilidade | Dependências |
|---------|--------|---------|------------------|--------------|
| `src/components/layout/Sidebar.module.css` | Fonte do recuo (`.sublink` padding-left 38px); possível ajuste de spacer compartilhado | Alto — visual | Tokens de layout do menu | Variáveis em `tokens` / design system (indireto) |
| `src/components/layout/Sidebar.tsx` | Opcional: inserir spacer no filho (igual Home) para não depender de número mágico de padding | Médio se estrutural; Baixo se só CSS | Markup do menu | `NavIcons`, `NavLink`, `Sidebar.module.css` |
| `src/components/layout/NavIcons.tsx` | Só referência: `IconCaret` 12×12 em slot 16px — **não precisa alterar** se o slot `.caret` permanecer 16px | Nenhum esperado | Ícones SVG | — |
| `src/components/layout/AppShell.tsx` | Consome `Sidebar`; sem mudança esperada | Nenhum | Shell desktop/drawer | `Sidebar` |
| `docs/design-system.md` | Documenta sidebar; atualizar só se houver regra de alinhamento a registrar | Baixo / opcional | Docs | — |

**Fora de escopo:** páginas de conteúdo, rotas, `AmbienteContext`, API, tema claro/escuro (exceto validar visual nos dois temas).

## Classes Envolvidas

Projeto React com funções/componentes (não classes OOP). Equivalente:

| Símbolo | Responsabilidade | Dependências | Acoplamento | Impacto / alteração |
|---------|------------------|--------------|-------------|---------------------|
| `Sidebar` | Renderiza nav, grupos abertos, links | `react-router` (`NavLink`, `useLocation`), `useAmbientePermissoes`, `NavIcons`, CSS module | Baixo com AppShell | **Possível** markup do `.sublink` (spacer) |
| `MenuGroup` / `MenuChild` (interfaces locais) | Modelo de dados do menu | — | Local ao arquivo | **Não** |
| `AppShell` | Posiciona Sidebar | `Sidebar`, `Drawer`, etc. | Médio no layout | **Não** |
| Estilos `.itemRow`, `.caret`, `.topLinkSpacer`, `.sublink`, `.subnav` | Grid visual do menu | CSS variables | Local ao module | **Sim** em `.sublink` (e reuso de spacer se aplicável) |

## Dependências

- `react-router` `NavLink` — inalterado
- CSS Modules — alteração local
- Tokens (`--color-*`, `--radius-sm`, `--tap-target-min`) — sem mudança obrigatória
- Sem dependência de API/backend

## Impactos

- Visual: submenu alinhado ao pai em todos os grupos (Despesas, Receitas, Usuário)
- Home permanece referência de alinhamento (já usa spacer 16px)
- Mobile drawer herda o mesmo module
- Sem impacto em auth, RBAC (`canManageMembros`), rotas ou performance de dados

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Ajuste só do número 38→30 “quebra” se `.caret` ou `gap` mudarem depois | Preferir estrutura com spacer da mesma largura do `.caret` (padrão já usado em Home) **ou** documentar a fórmula 6+16+8 no CSS |
| Recuo zero demais (ícone do filho sob o caret) | Critério: alinhar ao **ícone do pai**, não à borda esquerda absoluta sem slot do caret |
| Regressão de área de toque em ≤900px | Manter `min-height` / media query existentes; só mudar eixo X |
| Expectativa de indentação hierárquica “clássica” | Requisito explícito do produto: **sem** indent extra |

## Performance

N/A relevante: mudança de CSS/markup estático. Sem queries, loops, cache ou IO.

## Arquitetura

- Alteração localizada no módulo da Sidebar — baixo acoplamento, alta coesão
- Não misturar regra de alinhamento em `AppShell` ou páginas
- Reutilizar o padrão já existente do Home (`.topLinkSpacer`) evita duplicar “números mágicos” divergentes
- Sem necessidade de nova abstração de design system neste ciclo (salvo se o time quiser tokens `--sidebar-icon-inset` depois)

## Design Patterns

Nenhuma oportunidade **necessária**. O spacer do Home já é o padrão estrutural a espelhar; não introduzir Strategy/Factory etc. para padding.

## Segurança

Sem impacto: sem auth, IDs, inputs ou secrets. Manter `aria-expanded` no botão do grupo e `aria-label` do `nav`.

## Logs (SLF4J)

N/A no frontend React deste repo. Não adicionar `console.log` para alinhamento visual.

## Estratégia TDD

Não há testes unitários atuais de `Sidebar` (só `AppShell.test.tsx` cobre rotas/shell). Para esta UI:

| Tipo | Plano |
|------|--------|
| Unitário | Opcional e de baixo valor se só CSS. Se o markup ganhar spacer, teste de presença do spacer / estrutura (Testing Library) é opcional |
| Integração | Não obrigatório |
| Aceite manual | Principal: expandir Despesas/Receitas/Usuário; comparar coluna de ícones pai vs filhos; Home vs grupos; tema claro/escuro; desktop e drawer ≤900px |
| Casos positivos | Filho aberto: ícone do submenu alinhado ao ícone do pai |
| Casos negativos | Grupo fechado: sem subnav; permissão sem Usuário: grupo ausente (inalterado) |
| Borda | Grupo ativo + sublink ativo (`.active`); caret aberto/fechado; reduced-motion |
| Mocks | `useAmbientePermissoes` só se houver teste de render do grupo Usuário |

## Quebra em Tasks

### Task 1 — Confirmar métrica alvo e escopo visual

- **Objetivo:** Fixar o critério de alinhamento (coluna do ícone do pai = coluna do ícone do filho).
- **Descrição:** Com sidebar aberta, validar fórmula atual (6+16+8 vs 38) e listar grupos a checar (Despesas, Receitas, Usuário). Não alterar código além do necessário na task seguinte.
- **Arquivos:** referência `Sidebar.module.css`, `Sidebar.tsx`; captura do usuário.
- **Critério de aceite:** Critério escrito: “ícone do `.sublink` alinhado ao `.icon` do `.itemRow` do mesmo grupo; label na mesma linha de base visual do label do pai”.
- **Dependências:** Nenhuma.
- **Complexidade:** Baixa.
- **Riscos:** Confundir alinhamento com a borda do caret.
- **Observações:** Home já define a coluna correta via spacer.

### Task 2 — Ajustar layout do submenu para o mesmo eixo do pai

- **Objetivo:** Eliminar o recuo extra de 8px (e qualquer indent hierárquico além do slot do caret).
- **Descrição:** Alterar o CSS de `.sublink` e, se necessário para manter sincronismo com `.caret`/Home, espelhar no JSX do filho o mesmo spacer de 16px usado em `.topLinkSpacer` (reutilizar classe existente ou classe equivalente compartilhada), com padding horizontal igual ao do `.itemRow` / `.topLink`. Não mudar labels, rotas, ícones nem lógica de `openGroups`.
- **Arquivos:** `Sidebar.module.css`; opcionalmente `Sidebar.tsx`.
- **Critério de aceite:** Com Despesas expandido, Cadastro/Categorias/Cartão alinhados ao ícone/texto “Despesas”; idem Receitas e Usuário; Home permanece alinhado aos grupos.
- **Dependências:** Task 1.
- **Complexidade:** Baixa.
- **Riscos:** Número mágico residual se só CSS; preferir spacer estrutural se o time quiser robustez.
- **Observações:** Manter `gap: 8px`, larguras `.icon` 20px e `.caret` 16px salvo decisão explícita de redesenho.

### Task 3 — Validação visual desktop + drawer e temas

- **Objetivo:** Garantir ausência de regressão responsiva/tema.
- **Descrição:** Verificar ≤900px no drawer, hover/active, `prefers-reduced-motion` no caret, tema claro e escuro.
- **Arquivos:** nenhum de produto obrigatório; opcional nota em `docs/design-system.md` se quiser registrar a regra de coluna única de ícones.
- **Critério de aceite:** Checklist manual OK nos dois viewports e temas; área de toque dos sublinks inalterada em intenção (só eixo X).
- **Dependências:** Task 2.
- **Complexidade:** Baixa.
- **Riscos:** Diferença de padding do drawer head não afeta o module da Sidebar (já isolado).
- **Observações:** Sem scanner de segurança necessário para esta mudança.

## Critérios Gerais de Aceite

1. Submenus abrem abaixo do grupo, **sem** deslocamento à frente em relação ao ícone/rótulo do pai.
2. Home, grupos e sublinks compartilham a mesma coluna de ícones.
3. Comportamento de expand/collapse, rotas e permissão do grupo Usuário inalterados.
4. Desktop e mobile (drawer) consistentes.
5. Temas claro/escuro sem regressão de contraste nos estados `.active` / hover.

## Pendências

- Confirmar se o time prefere **só CSS** (ajustar padding-left) ou **CSS + spacer no JSX** (alinhado ao padrão Home) — recomendação técnica: spacer/estrutura igual ao Home para não divergir se `.caret` mudar.
- Merge em `develop` via fluxo `feature-from-impl` após implementação (fora deste skill).

## Dúvidas Técnicas

- Nenhuma bloqueante: causa e alvo estão claros no CSS atual.
- Opcional de produto: algum grau mínimo de indent “hierárquico” era intencional no passado? O pedido atual remove esse indent.

## Approach

1. Localizei o menu em `Sidebar.tsx` / `Sidebar.module.css` (únicos arquivos de UI do menu lateral com subnav).
2. Comparei padding/gap/larguras: `.itemRow`+`.caret` vs `.sublink` (38px) vs `.topLink`+`.topLinkSpacer`.
3. Confirmei que o desalinhamento da imagem (~ícone do filho mais à direita que o do pai) casa com 38px vs ~30px.
4. Descartei mudança em `AppShell`, rotas ou ícones SVG — não causam o offset.
5. Descartei “remover o caret” ou redesenhar o menu — fora do requisito.
6. Tasks mínimas: métrica → ajuste de layout → QA visual; TDD automatizado limitado porque é CSS; aceite manual é o gate.
7. Skill `levantamento-tecnico`: sem implementação e sem patches de código neste artefato; implementação posterior via `feature-from-impl` deste MD.
