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

Usar sempre as variáveis CSS. Não hardcodar hex em páginas/componentes, exceto em overrides pontuais justificados.

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-brand` | `#0B5CAD` | Header top bar, marca, links ativos fortes |
| `--color-brand-hover` | `#094A8F` | Hover de ações na marca |
| `--color-primary` | `#0B5CAD` | Botão primário, foco, destaques de UI |
| `--color-primary-hover` | `#094A8F` | Hover do primário |
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

### Mobile

- Header compacto azul.
- Sidebar vira drawer ou lista colapsável no topo.
- Cards empilham em coluna única.
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

Altura padrão: 40px. Raio: `--radius-md`. Sem pills em botões de formulário (pills só em filtros de mês).

### Input / Select

- Fundo branco, borda `--color-border`, focus ring `--color-primary`.
- Label acima, muted, 13px.
- Erro: borda/texto `--color-danger`.

### Card

- Um propósito por card.
- Título opcional no topo (peso 600–700).
- Sem “card dentro de card” desnecessário.

### Tabela (`DataTable`)

- Cabeçalho muted, linhas com borda inferior leve.
- Hover de linha sutil (`background` cinza muito claro).
- Colunas de valor à direita; ações (Editar) à direita.

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
- `prefers-reduced-motion`: reduzir animações de menu/chevron.
- Não depender só de cor para status (complementar com texto/ícone).

---

## 10. Do / Don’t

| Do | Don’t |
|----|-------|
| Usar tokens de `tokens.css` | Hex solto em CSS modules |
| Cards brancos no fundo cinza | Fundo branco flat sem hierarquia |
| Vermelho/verde só para dinheiro/status | Colorir tudo de azul |
| Menu accordion com clique na linha inteira | Só a setinha clicável |
| Tipografia DM Sans | Voltar a Inter “genérico” sem motivo |
| Seguir este DS em toda página nova | Inventar outro visual por tela |

---

## 11. Checklist antes de merge de UI

- [ ] Cores/espaços/raios vêm de tokens
- [ ] Valores financeiros com semântica correta
- [ ] Shell (header/sidebar/main) respeitado
- [ ] Mobile legível (coluna única, sem overflow horizontal)
- [ ] Textos e empty states no tom do DS
- [ ] Nenhum desvio “por estética” sem atualizar este documento

---

## 12. Evolução

Mudanças de padrão (nova cor, novo componente global) **atualizam este arquivo e `tokens.css` no mesmo PR**. Páginas não definem sistema paralelo.
