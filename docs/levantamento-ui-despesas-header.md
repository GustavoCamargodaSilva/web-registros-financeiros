# Levantamento — UI Despesas (formulário) + Header

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projeto:** `web-registros-financeiros`
>
> **Regra:** páginas, componentes, APIs e estilos já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** ou ajustes pontuais de CSS/JSX nos arquivos citados — **sem excluir** login, registro, aceite de convite, receitas, categorias, pagadores nem a lógica de cadastro de despesa na API.

---

## 1. Objetivo

Melhorar a usabilidade da tela de **Despesas** e o espaçamento do **header** superior, com base no feedback visual (prints) e no uso atual do formulário sempre expandido.

| # | Pedido | Resultado esperado |
|---|--------|--------------------|
| 1 | Formulário de nova despesa **não** ficar sempre aberto | Barra de competência/total + botão verde **Cadastrar** no fim; formulário só ao clicar |
| 2 | Campos do cadastro ocupam muita altura (hoje em coluna) | Campos em **layout horizontal / grade** (várias colunas) para reduzir altura |
| 3 | Header (ano/mês/sair) com altura/espaçamento incorreto | Espaço adequado entre os controles (data etc.) e a **linha inferior** do header |

---

## 2. Situação atual (baseline)

### 2.1 `DespesasPage`

| Item | Estado |
|------|--------|
| Card competência | Sempre visível: título + “Total no mês” |
| Card “Nova despesa” | **Sempre montado** com o formulário aberto |
| Layout do form | `.form` em `pages.module.css`: `display: grid` **uma coluna**, `max-width: 480px` |
| Botão submit | Dentro do form, texto “Cadastrar”, variant `primary` (azul) |
| Lista | Card “Despesas do mês” com `DataTable` |

Arquivo: `src/pages/DespesasPage.tsx`  
Estilos: `src/pages/pages.module.css`

### 2.2 Header + competência

| Item | Estado |
|------|--------|
| Header | `Header.tsx` + `Header.module.css` |
| Altura | `--header-height: 64px` (fixa) em `tokens.css` |
| Padding vertical | `padding: 0 var(--spacing-lg)` — **sem** padding top/bottom |
| Borda | `border-bottom: 1px solid var(--color-border)` |
| Competência | `CompetenciaSelector` (Ano/Mês) no header em `/despesas` e `/receitas` |
| Sair | Botão `outline` à direita |

Efeito observado: com altura fixa baixa e selects com label, o bloco de data fica visualmente **colado** na linha inferior (prints do usuário).

### 2.3 Tokens úteis já existentes

| Token | Valor | Uso sugerido |
|-------|-------|--------------|
| `--color-success` | `#28c76f` | Botão verde “Cadastrar” |
| `--spacing-md` / `--spacing-lg` | 16px / 24px | Padding do header e gaps do form |
| `--color-primary` | azul | Manter para outras actions; não misturar com o CTA verde |

### 2.4 Modal

Já existe `Modal.tsx`, mas é de **confirmação** (confirmar/cancelar), não um painel de formulário.  
**Sugestão MVP:** toggle inline (mostrar/ocultar o card do form) — sem obrigar modal. Modal pode ser fase posterior.

---

## 3. Interpretação do pedido de layout dos campos

Texto do pedido: campos em posição **vertical** ocupam muito espaço → “colocar os campos em vertical”.

Interpretação adotada neste levantamento (a confirmar):

| Atual | Desejado |
|-------|----------|
| Empilhados (1 coluna = layout vertical) | **Em linha / grade horizontal** (2–3 colunas no desktop) |

Se a intenção for outra (ex.: modal fullscreen em coluna), registrar na §8 antes de implementar.

---

## 4. Proposta de UX

### 4.1 Barra de competência + CTA

```
┌─────────────────────────────────────────────────────────────┐
│ Competência: Julho/2026     Total no mês: R$ …   [Cadastrar] │  ← botão verde à direita
└─────────────────────────────────────────────────────────────┘
         ↓ ao clicar (form aberto)
┌─────────────────────────────────────────────────────────────┐
│ Nova despesa                                         [Fechar]│
│ [desc] [valor] [venc] [tipo] …   ← grade horizontal         │
│                                              [Salvar / …]   │
└─────────────────────────────────────────────────────────────┘
│ Despesas do mês (tabela) …                                  │
```

Comportamentos sugeridos:

| Ação | Comportamento |
|------|----------------|
| Clique em **Cadastrar** | Abre o formulário (`formAberto = true`) |
| Sucesso no submit | Limpa form (já existe), **fecha** o formulário (opcional mas recomendado) |
| Cancelar / Fechar | Fecha sem limpar obrigatoriamente (ou limpa — ver §8) |
| Troca de competência | Mantém form fechado ou fecha se aberto (preferência: fechar) |

### 4.2 Layout do formulário

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥ ~768px) | Grid 2 ou 3 colunas; ações na última linha |
| Mobile | 1 coluna (acessibilidade / toque) |

Campos permanecem os mesmos (sem mudança de contrato com a API).

### 4.3 Header

| Ajuste | Detalhe |
|--------|---------|
| Altura | Trocar altura rígida por `min-height` + padding vertical **ou** aumentar `--header-height` |
| Espaço até a linha | `padding-block` (ex.: 12–16px) para afastar Ano/Mês/Sair da `border-bottom` |
| AppShell | Se usar `min-height` no header, alinhar `grid-template-rows` em `AppShell.module.css` para não “cortar” o header |

Escopo do header: impacto em **todas** as páginas autenticadas (Despesas, Receitas, etc.) — desejável e coerente com o print.

---

## 5. Arquivos sugeridos (sem apagar os atuais)

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DespesasPage.tsx` | Estado `formAberto`; botão na barra; condicional do form; opcional “Fechar” |
| `src/pages/pages.module.css` | Toolbar da competência; `formHorizontal` / grid; botão success se necessário |
| `src/components/ui/Button.tsx` + `Button.module.css` | Variant `success` (verde) **aditiva** |
| `src/components/layout/Header.module.css` | Padding / min-height |
| `src/styles/tokens.css` | Ajuste de `--header-height` se necessário |
| `src/components/layout/AppShell.module.css` | Só se a row do grid precisar acompanhar header auto |

**Não alterar neste escopo (salvo task explícita):**

- APIs (`despesas.api.ts`), types, Auth, convites  
- Lógica de validação/submit além de fechar o form após sucesso  
- `ReceitasPage` formulário (pedido atual é só despesas) — header sim, global  

---

## 6. Decisões pendentes

| # | Pergunta | Sugestão |
|---|----------|----------|
| 1 | Form inline ou modal? | **Inline** (toggle) no MVP |
| 2 | Layout “vertical” do pedido = horizontal/grade? | **Sim** — confirmar |
| 3 | Após cadastrar com sucesso, fechar o form? | **Sim** |
| 4 | Botão “Cadastrar” da barra vs submit do form | Barra = abrir; submit = “Salvar” ou manter “Cadastrar” dentro do form |
| 5 | Aplicar o mesmo padrão (botão + form fechado) em Receitas? | Fora do MVP; só se pedido |
| 6 | Variant `success` no `Button` ou className local? | Variant no `Button` (reutilizável) |

---

## 7. Tasks de baixa complexidade

> Nenhuma task abaixo deve ser executada nesta fase de levantamento.

### Fase 0 — Fechamento

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T0.1 | Confirmar decisões §6 (inline vs modal; horizontal; fechar após sucesso) | Baixa | — | Decisões |
| T0.2 | Validar com os prints: padding mínimo desejado no header (ex. 12px / 16px) | Baixa | — | Valor de spacing |

### Fase 1 — Botão verde “Cadastrar” + form oculto

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T1.1 | Adicionar variant `success` em `Button` (usa `--color-success`) | Baixa | — | Botão verde |
| T1.2 | Em `DespesasPage`, estado `formAberto` (default `false`) | Baixa | — | Estado |
| T1.3 | Reestruturar card de competência: conteúdo + botão **Cadastrar** à direita | Baixa | T1.1, T1.2 | Toolbar |
| T1.4 | Renderizar card/form “Nova despesa” **somente** se `formAberto` | Baixa | T1.2 | Form sob demanda |
| T1.5 | Ao abrir, opcional foco no primeiro campo | Baixa | T1.4 | UX |
| T1.6 | Botão Fechar/Cancelar no form → `formAberto = false` | Baixa | T1.4 | Fecha form |
| T1.7 | Após submit com sucesso → fechar form (além do reset já existente) | Baixa | T1.4 | Fluxo completo |
| T1.8 | **Não remover** validação, API call nem tabela de despesas | — | — | Regra |

### Fase 2 — Layout horizontal do formulário

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T2.1 | Criar classe CSS (ex. `.formGrid`) com 2–3 colunas no desktop | Baixa | — | CSS |
| T2.2 | Aplicar `.formGrid` no form de nova despesa | Baixa | T1.4, T2.1 | Layout |
| T2.3 | Campo “Quantidade de parcelas” (condicional) ocupa 1 célula sem quebrar grid | Baixa | T2.2 | Consistência |
| T2.4 | Linha de actions (Salvar/Fechar) em full-width na última row | Baixa | T2.2 | Actions |
| T2.5 | Media query: 1 coluna em telas estreitas | Baixa | T2.1 | Mobile |
| T2.6 | Remover ou ampliar `max-width: 480px` do form de despesas (hoje limita demais a grade) | Baixa | T2.2 | Largura útil |

### Fase 3 — Espaçamento do Header

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T3.1 | Em `Header.module.css`, adicionar `padding-block` (ex. `var(--spacing-md)`) | Baixa | T0.2 | Espaço vs borda |
| T3.2 | Trocar `height` fixo por `min-height: var(--header-height)` (ou subir token) | Baixa | T3.1 | Cabe conteúdo |
| T3.3 | Ajustar `--header-height` em `tokens.css` se ainda ficar apertado (ex. 64 → 72/80) | Baixa | T3.2 | Token |
| T3.4 | Revisar `AppShell.module.css` (`grid-template-rows`) para header com altura automática | Baixa | T3.2 | Sem corte |
| T3.5 | Checar visual em `/despesas` e `/receitas` (Ano/Mês + Sair) | Baixa | T3.1–T3.4 | OK |
| T3.6 | **Não alterar** lógica de `CompetenciaSelector` / logout | — | — | Regra |

### Fase 4 — Verificação

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T4.1 | Desktop: form fechado por padrão; Cadastrar abre; layout em grade | Baixa | Fases 1–2 | OK |
| T4.2 | Cadastro válido fecha form e atualiza tabela | Baixa | T1.7 | OK |
| T4.3 | Mobile: form 1 coluna utilizável | Baixa | T2.5 | OK |
| T4.4 | Header: espaço visível entre controles e linha inferior (comparar com prints) | Baixa | Fase 3 | OK |
| T4.5 | Regressão: login, lista, categorias, pagadores, convite intactos | Baixa | — | OK |

### Fase 5 — Depois (fora deste MVP)

| ID | Task | Complexidade | Nota |
|----|------|--------------|------|
| T5.1 | Mesmo padrão (CTA + form oculto + grade) em `ReceitasPage` | Baixa/Média | Paridade UX |
| T5.2 | Form de despesa em `Modal` dedicado | Média | Alternativa ao inline |
| T5.3 | Atalho teclado Esc para fechar form | Baixa | Polish |

---

## 8. Cenários de teste (quando implementar)

| ID | Caso | Esperado |
|----|------|----------|
| C1 | Entrar em Despesas | Vê competência + total + botão verde; **sem** form |
| C2 | Clicar Cadastrar | Form aparece |
| C3 | Fechar / Cancelar | Form some; tabela permanece |
| C4 | Preencher e salvar | Sucesso toast; lista atualiza; form fecha |
| C5 | Validação inválida | Erros nos campos; form continua aberto |
| C6 | Desktop | Campos lado a lado (grade), altura menor que hoje |
| C7 | Header | Gap claro entre Ano/Mês/Sair e a borda inferior |
| C8 | Receitas / outras páginas | Header com mesmo espaçamento; forms dessas páginas inalterados |

---

## 9. Fora de escopo (esta fase)

- Implementação de qualquer task T0–T5  
- Remover ou refatorar módulos não citados  
- Alterações na API Spring / e-mail  
- Redesign completo do design system  
- Seletor de ambiente / convites  

---

## 10. Critérios de pronto do MVP

1. Formulário de nova despesa **fechado** por padrão  
2. Botão verde **Cadastrar** no fim da barra de competência/total abre o form  
3. Campos do form em **grade horizontal** no desktop (1 coluna no mobile)  
4. Header com **espaço** entre os controles e a linha inferior  
5. Cadastro continua funcionando (mesma API e validações)  
6. Nenhuma feature não relacionada removida  

---

## 11. Ordem sugerida de entrega

| PR | Conteúdo |
|----|----------|
| PR1 | Fase 3 (header) — isolado, baixo risco |
| PR2 | Fase 1 (toggle + botão verde) |
| PR3 | Fase 2 (grade do form) + Fase 4 (checagem visual) |

---

## 12. Referências

| Item | Path |
|------|------|
| Página | `src/pages/DespesasPage.tsx` |
| Estilos de página | `src/pages/pages.module.css` |
| Header | `src/components/layout/Header.tsx`, `Header.module.css` |
| Shell | `src/components/layout/AppShell.module.css` |
| Tokens | `src/styles/tokens.css` |
| Botão | `src/components/ui/Button.tsx`, `Button.module.css` |
| Competência | `src/components/ui/CompetenciaSelector.tsx` |

---

## 13. Próximo passo sugerido

1. Confirmar §6 (especialmente layout horizontal vs outra leitura do texto).  
2. Aprovar este plano.  
3. Só então autorizar **PR1** (header) ou **PR2** (botão + form).

**Status atual:** levantamento concluído — **implementação não iniciada**.
