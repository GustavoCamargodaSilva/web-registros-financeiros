# Levantamento — Receita ligada ao usuário + totais por pessoa

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `api-registros-financeiros` + `web-registros-financeiros`.
>
> **Regra:** classes, services, controllers e páginas já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** — **sem excluir** pagador, competência, delete de receita, despesas, convites, auth nem o formulário toggle “Cadastrar”.

---

## 1. Objetivo

Alinhar o cadastro/listagem de **receitas** ao modelo já usado em **despesas** quanto à ligação com **pessoa (membro do ambiente)** e aos **totais**.

| Requisito | Descrição |
|-----------|-----------|
| Ligar receita à pessoa | No cadastro, a receita fica associada a um **usuário membro** (no fluxo típico: o **usuário logado**, como default da despesa individual) |
| Totais na listagem | Exibir **total geral** da competência **e** totais **separados por pessoa** |
| Escopo | Levantamento + tasks; **sem implementação** nesta fase |

**Importante — não confundir conceitos:**

| Conceito | Significado em receita |
|----------|------------------------|
| **Pagador** | De onde veio o dinheiro (ex.: “BOTICARIO”) — já existe |
| **Pessoa / responsável** | **De quem é** a receita no ambiente (membro) — o que falta na UX/API pública |
| **Criador** | Quem registrou o lançamento (auditoria) |

---

## 2. Situação atual (baseline)

### 2.1 API — `ReceitaEntity`

| Campo | Papel hoje |
|-------|------------|
| `pagador` | Origem do valor (cadastro de pagadores) |
| `usuario` | Já preenchido no create com o **usuário logado** (`CadastrarReceitaService`) |
| `ambiente` | Ambiente ativo |
| `valor`, `pago`, `dataPagamento`, `ano`, `mes` | Dados financeiros / competência |

Não existem: `escopo`, `responsavel` (FK separada do criador).

### 2.2 Contratos atuais

**POST** `/api/v1/receitas` — body (`ReceitaDTO`):

`pagadorId`, `valor`, `pago`, `dataPagamento`  
→ **não** recebe responsável; o service grava `usuario = logado` internamente.

**GET** `/api/v1/receitas?ano=&mes=` — (`ReceitaCompetenciaResponseDTO`):

- `valorTotal` (geral)
- `receitas[]` (`ReceitaResponseDTO`): id, pagador, valor, pago, data, ano, mes  
→ **não** expõe `usuarioId` / `usuarioNome` (nem responsável)

### 2.3 Front — `ReceitasPage`

| Item | Estado |
|------|--------|
| Form (toggle Cadastrar) | Pagador, valor, pago, data — **sem** select de pessoa |
| Resumo | Só **total geral** |
| Tabela | Coluna Pagador (origem), sem coluna “pessoa/responsável” |
| Types | Sem campos de usuário/responsável |

### 2.4 Referência — despesas (já implementado)

| Item | Como funciona |
|------|----------------|
| Create | `escopo` + `responsavelUsuarioId` (default = logado se individual) |
| Response | `responsavelUsuarioId`, `responsavelNome`, `escopo` |
| UI resumo | `calcularResumoDespesas` → total geral + por responsável (+ conjuntas) |
| Membros | `GET /api/v1/ambientes/ativo/membros` (reutilizar) |

---

## 3. Semântica desejada (produto)

### 3.1 Cadastro

- Ao cadastrar receita, associar a um **membro do ambiente**.
- Default: **usuário logado** (igual default de despesa individual).
- **Pagador** continua obrigatório e independente (fonte do dinheiro ≠ pessoa do casal).

### 3.2 Listagem / resumo

Na competência selecionada, mostrar:

1. **Total geral** (soma de todas as receitas do ambiente no mês)
2. **Total por pessoa** (soma das receitas ligadas a cada membro que tenha lançamentos)

Tabela: manter Pagador; incluir coluna da **pessoa** (nome do membro).

### 3.3 O que fica fora do MVP

| Fora | Motivo |
|------|--------|
| Escopo `CONJUNTA` em receita | Pedido atual fala em pessoa + total geral; conjunta pode ser fase 2 |
| Editar receita | Não solicitado |
| Rateio percentual | Overkill |
| Alterar cadastro de Pagadores | Independente |

---

## 4. Opções de modelagem

| Opção | Ideia | Prós | Contras |
|-------|-------|------|---------|
| **A (recomendada no MVP)** | Reusar `usuario` já gravado como “pessoa da receita”; **expor** `usuarioId`/`usuarioNome` no response; create continua só com logado (ou aceita `responsavelUsuarioId` gravando em `usuario` — ver nota) | Menos schema; dados antigos já têm `usuario_id`; tasks menores | Mistura “criador” e “dono” se no futuro alguém lançar por outro |
| **B (espelho despesa)** | Novo campo `responsavel` (FK) + opcional `escopo`; `usuario` permanece criador | Igual despesas; Ana pode lançar receita de Bruno | Mais código/validação; migration conceitual |
| C | Totais só no front sem expor usuário | Frágil / impossível sem nome no response | Não atende |

**Sugestão deste levantamento: Opção A no MVP**, com create permitindo opcionalmente escolher o membro (`responsavelUsuarioId` no DTO) e persistir em `usuario` **somente se** o produto aceitar que “pessoa da receita” = esse campo (e o logado continua sendo quem chama a API — autenticação).

**Nota de produto (decidir em D1):**

- Se a regra for **sempre** “a receita é de quem está logado” → nem precisa select; só expor + agregar.
- Se a regra for “como despesa: posso escolher o responsável” → select de membros + validar membership (padrão `CadastrarDespesaService`).

---

## 5. Contratos sugeridos (após aprovação)

### 5.1 POST `/api/v1/receitas` (aditivo)

```json
{
  "pagadorId": 1,
  "valor": 1000.00,
  "pago": false,
  "dataPagamento": "2026-07-31",
  "responsavelUsuarioId": 2
}
```

| Campo | Regra MVP |
|-------|-----------|
| `responsavelUsuarioId` | Opcional; default = usuário logado; deve ser membro do ambiente ativo |

Persistência (Opção A): continuar usando coluna/`usuario` da entity para essa pessoa.

### 5.2 GET listagem — item (`ReceitaResponseDTO`) aditivo

| Campo novo | Tipo |
|------------|------|
| `usuarioId` ou `responsavelUsuarioId` | `Long` |
| `usuarioNome` ou `responsavelNome` | `String` |

Manter `valorTotal` no envelope. Totais por pessoa podem ser:

- **Front** (como despesas): agregar a lista — **recomendado**, reutiliza padrão `despesasResumo`
- ou API devolver `porUsuario[]` — opcional, não necessário no MVP

### 5.3 Front — resumo

Espelhar UX de despesas (cards/summary):

| Bloco | Conteúdo |
|-------|----------|
| Total geral | Soma da competência (verde / `--color-income`) |
| Por pessoa | Um bloco por membro com total > 0 |

Utilitário novo sugerido: `utils/receitasResumo.ts` (espelho enxuto de `despesasResumo`, sem “conjuntas”).

---

## 6. Arquivos relevantes (não excluir)

### API

| Path | Papel |
|------|-------|
| `ReceitaEntity.java` | Já tem `usuario` |
| `ReceitaDTO.java` | Estender (aditivo) |
| `ReceitaResponseDTO.java` | Expor pessoa |
| `ReceitaMapper.java` | Mapear nome/id |
| `CadastrarReceitaService.java` | Default logado + validar membro se id enviado |
| `ListarReceitasPorCompetenciaService.java` | Sem mudança de filtro (ambiente + competência) |
| `ReceitasIntegrationTest.java` | Cobrir exposição + default |

### Front

| Path | Papel |
|------|-------|
| `types/receita.types.ts` | Campos novos |
| `pages/ReceitasPage.tsx` | Select (se D1 exigir), coluna, resumo |
| `utils/receitasResumo.ts` | **Novo** — totais |
| `ambientes.api.ts` / membros | Reutilizar (já existe) |

---

## 7. Decisões abertas (para aprovação)

| # | Pergunta | Opção recomendada |
|---|----------|-------------------|
| D1 | Pessoa da receita = sempre logado, ou select como despesa? | Select com **default = logado** (mais próximo do “como despesa”) |
| D2 | Nome dos campos na API (`usuario*` vs `responsavel*`) | `responsavelUsuarioId` / `responsavelNome` (alinha ao vocabulário de despesas) mesmo persistindo em `usuario` no MVP A |
| D3 | Receita conjunta no MVP? | **Não** |
| D4 | Totais por pessoa na API ou no front? | **Front** (`receitasResumo`) |
| D5 | Coluna na tabela | “Responsável” (nome), mantendo “Pagador” |

---

## 8. Tasks (baixa complexidade) — após aprovação

Ordem sugerida. Cada task deve ser pequena e aditiva.

### API

1. **Expor pessoa na response**  
   - Estender `ReceitaResponseDTO` + `ReceitaMapper` com id/nome a partir de `entity.getUsuario()`.  
   - Ajustar teste de listagem para assertar os campos.

2. **Aceitar responsável no create (se D1 = select)**  
   - Campo opcional em `ReceitaDTO`.  
   - Em `CadastrarReceitaService`: default logado; se informado, validar membro do ambiente (`MembroAmbienteRepository`) e setar `usuario`.  
   - Teste: create sem id → logado; create com outro membro → ok; membro inválido → 4xx.

3. *(Opcional)* Documentar no Postman/coleção o campo novo — só se o projeto já versiona isso.

### Front

4. **Types + client**  
   - Atualizar `Receita` / request com campos novos (sem remover pagador).

5. **Utilitário `receitasResumo`**  
   - `totalGeral` + `porResponsavel[]`; testes unitários espelhando o padrão de `despesasResumo.test.ts`.

6. **Resumo na `ReceitasPage`**  
   - Cards: total geral + um por pessoa (estilo summary de despesas, cor income).

7. **Formulário**  
   - Se D1 = select: carregar membros, select “Responsável” default `usuario.id`, enviar no POST.  
   - Se D1 = só logado: sem select; backend já associa.

8. **Tabela**  
   - Coluna Responsável (nome); empty state inalterado no sentido; não remover Excluir/Pagador.

### Validação manual

9. **Checklist**  
   - Dois usuários no mesmo ambiente cadastram receitas → totais por pessoa corretos + total geral.  
   - Pagador continua independente.  
   - Form continua só ao clicar em Cadastrar.

---

## 9. Riscos / cuidados

| Risco | Mitigação |
|-------|-----------|
| Quebrar clients que não esperam campos novos | Campos **aditivos** no JSON |
| Confundir Pagador com Responsável na UI | Labels claros; DS: Pagador = origem, Responsável = pessoa |
| Dados antigos sem `usuario` | Improvável (create sempre setou); se null, UI mostra “—” e não entra no total por pessoa |
| Opção A limitar lançar por outro | Se surgir necessidade, evoluir para Opção B sem apagar A |

---

## 10. Critérios de pronto (definição de done)

- [ ] Response de receita traz identificação da pessoa
- [ ] Create associa ao logado (e, se aprovado, permite escolher membro válido)
- [ ] Tela mostra **total geral** + **totais por pessoa** na competência
- [ ] Tabela mostra responsável sem remover pagador
- [ ] Nenhuma exclusão de código não relacionado
- [ ] Testes de API (e unit do resumo front) cobrindo o feliz e o erro de membro inválido (se select)

---

## 11. Próximo passo

Aprovar **D1–D5** e autorizar início pela **Task 1** (expor pessoa na response).
