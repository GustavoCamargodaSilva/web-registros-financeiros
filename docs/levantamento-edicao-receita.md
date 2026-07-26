# Levantamento — Edição de receita

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `api-registros-financeiros` + `web-registros-financeiros`.
>
> **Regra:** classes, services, controllers e páginas já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** (novo DTO/service/endpoint PUT, botão Editar, modo edição no form) — **sem excluir** cadastro, exclusão, totais por pessoa, pagadores, despesas nem o toggle “Cadastrar”.

---

## 1. Objetivo

Permitir **editar uma receita** já cadastrada quando for necessário (corrigir valor, pagador, responsável, status pago, data, etc.).

| Requisito | Descrição |
|-----------|-----------|
| Ação na lista | Botão/ação **Editar** na tabela de receitas |
| Formulário | Reutilizar o form atual (mesmo padrão de despesas: abre ao editar, fecha ao salvar/cancelar) |
| Persistência | `PUT` na API atualizando **somente** aquela ocorrência |
| Escopo | Levantamento + tasks; **sem implementação** nesta fase |

---

## 2. Situação atual (baseline)

### 2.1 API — receita

| Capacidade | Estado |
|------------|--------|
| `POST /api/v1/receitas` | Existe |
| `GET /api/v1/receitas?ano=&mes=` | Existe |
| `DELETE /api/v1/receitas/{id}` | Existe |
| `PUT` / `PATCH` receita | **Não existe** |

**Entity** (`ReceitaEntity`): `valor`, `pago`, `dataPagamento`, `ano`, `mes`, `pagador`, `usuario` (responsável), `ambiente`.

Não há série (`grupoParcelamento`), tipo FIXO/VARIAVEL nem parcelas — cada receita é **uma linha**.

### 2.2 Create atual (`ReceitaDTO`)

| Campo | Obrigatório |
|-------|-------------|
| `pagadorId` | sim |
| `valor` | sim |
| `pago` | sim |
| `dataPagamento` | sim |
| `responsavelUsuarioId` | opcional (default = logado; valida membro) |

`ano`/`mes` derivados de `dataPagamento` no service.

### 2.3 Front — `ReceitasPage`

| Item | Estado |
|------|--------|
| Form | Só cadastro (`formAberto`); título “Nova receita” |
| Campos | Pagador, Responsável, Valor, Pago, Data de pagamento |
| Tabela | Colunas + **Excluir**; **sem Editar** |
| API client | `listar`, `cadastrar`, `excluir` — sem `atualizar` |

### 2.4 Referência — edição de despesa (já existe)

| Item | Padrão |
|------|--------|
| Endpoint | `PUT /api/v1/despesas/{id}` |
| Front | `despesaEmEdicao` + form compartilhado + botão Editar |
| Série | Propaga campos na série FIXO/VARIAVEL |

Para receita **não** há propagação de série.

---

## 3. Comportamento desejado (MVP)

### 3.1 API — `PUT /api/v1/receitas/{id}`

Body sugerido (espelha o create):

```json
{
  "pagadorId": 1,
  "valor": 200.00,
  "pago": true,
  "dataPagamento": "2026-07-31",
  "responsavelUsuarioId": 2
}
```

| Campo | Editável | Regra |
|-------|----------|-------|
| `pagadorId` | sim | Pagador do ambiente ativo |
| `valor` | sim | `> 0` |
| `pago` | sim | |
| `dataPagamento` | sim | Recalcular `ano`/`mes` |
| `responsavelUsuarioId` | sim | Default logado; deve ser membro |

| Resposta | `200` + `ReceitaResponseDTO` |
| 404 | Receita inexistente ou de outro ambiente (`findByIdAndAmbienteId`) |
| 400 | Validação / responsável inválido / pagador inválido |

### 3.2 Front

| Comportamento | Detalhe |
|---------------|---------|
| Botão **Editar** | Na coluna Ações (junto de Excluir) |
| `abrirEdicao(row)` | Preenche form; abre formulário |
| Título | “Editar receita” vs “Nova receita” |
| Submit | `receitasApi.atualizar(id, …)` |
| Após sucesso | Fecha form, toast, recarrega lista |
| Fechar/Cancelar | Descarta edição |

Se a `dataPagamento` mudar de competência, o item some da lista do mês atual após reload (esperado) — mesmo critério do create.

### 3.3 Fora de escopo (MVP)

| Item | Motivo |
|------|--------|
| Propagação de série | Receita não tem série |
| Mudar ambiente da receita | Isolamento por `X-Ambiente-Id` |
| Histórico de alterações | Não pedido |
| PATCH parcial | PUT completo basta (paridade create/despesa) |

---

## 4. Arquivos relevantes (não excluir)

### API (criar / estender)

| Path | Papel |
|------|-------|
| `ReceitaUpdateDTO.java` | **Novo** — campos do PUT |
| `AtualizarReceitaService.java` | **Novo** — load + validações + save |
| `ReceitasController.java` | Adicionar `PUT /{id}` |
| `ReceitaRepository` | Já deve ter `findByIdAndAmbienteId` (usado no delete) |
| `ReceitasIntegrationTest.java` | Casos de update / 404 / mudança de mês |

Reutilizar (não apagar): `CadastrarReceitaService`, `DeletarReceitaService`, `ReceitaMapper`, exceções de pagador/responsável.

### Front

| Path | Papel |
|------|-------|
| `receita.types.ts` | + `ReceitaUpdateRequest` (pode espelhar `ReceitaRequest`) |
| `receitas.api.ts` | + `atualizar(id, data)` |
| `ReceitasPage.tsx` | Estado `receitaEmEdicao`, `abrirEdicao`, submit dual, botão Editar |

---

## 5. Decisões abertas (para aprovação)

| # | Pergunta | Opção recomendada |
|---|----------|-------------------|
| D1 | Todos os campos do create no PUT? | **Sim** |
| D2 | Resposta do PUT | `ReceitaResponseDTO` (como despesa) |
| D3 | UI do botão Editar | Outline “Editar” ao lado de Excluir (paridade despesas) |
| D4 | Form único cadastro/edição | **Sim** (como despesas) |
| D5 | Ao mudar mês da data | Some da lista atual; usuário muda competência se quiser ver — **ok** |

---

## 6. Tasks (baixa complexidade) — após aprovação

### API

1. **`ReceitaUpdateDTO`** — mesmos campos/validações do create (`pagadorId`, `valor`, `pago`, `dataPagamento`, `responsavelUsuarioId`).  
2. **`AtualizarReceitaService`** — buscar por id+ambiente; validar pagador e responsável (mesma lógica do create); atualizar entity; recalcular `ano`/`mes`; retornar response.  
3. **Controller** — `PUT /api/v1/receitas/{id}` → service.  
4. **Exceção 404** — reutilizar `ReceitaNaoEncontradaException` (já usada no delete) + handler existente.  
5. **Testes** — update feliz; 404; responsável inválido; listar mês antigo/novo se data mudar.

### Front

6. **Types + API client** — `ReceitaUpdateRequest` + `receitasApi.atualizar`.  
7. **`ReceitasPage` — estado de edição** — `receitaEmEdicao`, `buildEditForm`, `abrirEdicao` / `fecharFormulario`.  
8. **Submit** — cadastro vs atualização conforme modo.  
9. **Tabela** — botão Editar; título do form dinâmico.

### Validação manual

10. **Checklist**  
    - Editar valor/pago/responsável e ver na lista.  
    - Mudar data para outro mês → some da competência atual.  
    - Excluir e cadastrar continuam ok.  
    - Totais por pessoa recalculam após edição.

---

## 7. Riscos / cuidados

| Risco | Mitigação |
|-------|-----------|
| Copiar lógica de série da despesa | Não aplicar — receita é unitária |
| Duplicar validação de responsável | Extrair helper privado compartilhado **só se** ficar trivial; senão duplicar de forma aditiva no service novo (evitar refator grande) |
| Confundir `usuario` (responsável) com criador | Manter semântica atual do create: `usuario` = responsável |

---

## 8. Critérios de pronto

- [ ] `PUT /api/v1/receitas/{id}` funcional e isolado por ambiente  
- [ ] Front permite abrir, alterar, salvar e cancelar edição  
- [ ] Lista/totais refletem a alteração  
- [ ] Cadastro e exclusão intactos  
- [ ] Testes de integração cobrindo update e 404  

---

## 9. Próximo passo

Aprovar **D1–D5** e autorizar início pela **Task 1** (`ReceitaUpdateDTO`).
