# Levantamento — Edição de despesa (+ atualização da série)

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `api-registros-financeiros` + `web-registros-financeiros`.
>
> **Regra:** classes, services, controllers e páginas já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** (novo endpoint/service de atualização, ícone/ação na tabela, formulário de edição) — **sem excluir** cadastro, filtros, totais, FIXO 12 meses, responsável/escopo, convites nem outras telas.

---

## 1. Objetivo

| Pedido | Resultado esperado |
|--------|--------------------|
| Ícone na lista de despesas | Abrir edição (valor, descrição, etc.) |
| Despesa **fixa** ou **parcelada** (variável) | Ao alterar, **atualizar as outras recorrências/parcelas** da mesma série |

Escopo desta fase: **apenas levantamento** — sem implementação.

---

## 2. Situação atual (baseline)

### 2.1 API

| Capacidade | Estado |
|------------|--------|
| `POST /api/v1/despesas` | Existe (cria série) |
| `GET /api/v1/despesas?ano=&mes=` | Existe |
| `PUT` / `PATCH` despesa | **Não existe** |
| `GET` por id | **Não existe** |

Série ligada por `grupoParcelamento` (UUID) em todas as ocorrências geradas no create:

| Tipo | O que existe hoje |
|------|-------------------|
| `FIXO` | 12 linhas, **mesmo valor**, `totalParcelas = 1`, mesmo `grupoParcelamento` |
| `VARIAVEL` | N linhas, valor **rateado**, `numeroParcela` / `totalParcelas`, mesmo `grupoParcelamento` |

`DespesaRepository` **não** tem `findByGrupoParcelamento` / `findByAmbienteIdAndGrupoParcelamento` ainda.

### 2.2 Front

| Item | Estado |
|------|--------|
| Lista | `DataTable` sem coluna de ações |
| Ícone editar | **Não existe** |
| Modal atual | Só confirmação (excluir em outras telas), não formulário de edição |
| Types | Já incluem `grupoParcelamento`, `escopo`, responsável |

### 2.3 Arquivos relevantes

| Camada | Path |
|--------|------|
| Entity | `DespesaEntity.java` |
| Create | `CadastrarDespesaService.java`, `GeradorParcelasService.java` |
| Controller | `DespesasController.java` |
| Front | `DespesasPage.tsx`, `despesas.api.ts`, `despesa.types.ts` |
| UI base | `DataTable.tsx`, `Modal.tsx`, `Button.tsx` |

---

## 3. Regras de negócio propostas

### 3.1 Escopo da edição (série)

Quando o usuário edita **qualquer** ocorrência de uma série (`grupoParcelamento` compartilhado):

| Campo | FIXO (recorrência) | VARIAVEL (parcelas) |
|-------|--------------------|---------------------|
| `descricao` | Propaga para **todas** do grupo | Idem |
| `valor` | Mesmo valor em **todas** | **Recalcula** rateio em todas (como no create) |
| `categoriaId` | Propaga para todas | Idem |
| `escopo` / `responsavelUsuarioId` | Propaga para todas | Idem |
| `pago` | **Só a linha editada** (cada mês tem status próprio) | Idem |
| `vencimento` | Ver §6 (decisão) | Ver §6 |
| `tipoDespesa` | **Não alterar** no MVP (evita regenerar série) | Idem |
| Quantidade de parcelas / meses | **Não alterar** no MVP | Idem |

Motivo de `pago` local: marcar junho como pago não deve marcar julho.

### 3.2 Identificação da série

1. Carregar despesa por `id` + validar pertencimento ao **ambiente ativo**.  
2. Buscar todas com o mesmo `grupoParcelamento` + `ambienteId`.  
3. Aplicar regras §3.1.

Se por algum motivo antigo existir linha sem grupo: atualizar **somente** aquela linha.

### 3.3 Valor em VARIAVEL

Reutilizar `CalculadoraValorParcela` sobre o **novo valor total** informado, mantendo `totalParcelas` e a ordem das parcelas (`numeroParcela`).  
Vencimentos das parcelas **permanecem** (salvo decisão de realinhar em §6).

### 3.4 Valor em FIXO

Gravar o novo valor em **todas** as ocorrências do grupo (sem rateio).

---

## 4. Contrato API proposto

### 4.1 Atualizar

```http
PUT /api/v1/despesas/{id}
Authorization: Bearer …
X-Ambiente-Id: …
Content-Type: application/json
```

Body (espelha campos editáveis; pode reutilizar/adaptar `DespesaDTO`):

```json
{
  "descricao": "Aluguel",
  "valor": 1600.00,
  "vencimento": "2026-07-10",
  "pago": true,
  "categoriaId": 1,
  "escopo": "INDIVIDUAL",
  "responsavelUsuarioId": 2
}
```

Resposta sugerida: `200` com a despesa atualizada (da competência/id editado) **ou** `204` + front recarrega a lista.

### 4.2 (Opcional) Buscar por id

```http
GET /api/v1/despesas/{id}
```

Útil para popular o form; no MVP o front pode editar com os dados já da lista (já tem a row).

### 4.3 Erros

| Caso | HTTP |
|------|------|
| Id inexistente / outro ambiente | 404 |
| Responsável inválido | 400 (reusar regra do create) |
| Validação bean | 400 |

---

## 5. Front — UX proposta

### 5.1 Lista

Nova coluna **Ações** com ícone/botão **Editar** (lápis) por linha.

### 5.2 Formulário de edição

| Opção | Descrição | Sugestão |
|-------|-----------|----------|
| **E1** | Painel/card “Editar despesa” (como o de cadastro) | Bom MVP, reaproveita layout |
| **E2** | Modal com form | Exige evoluir `Modal` além de confirmar/cancelar |
| **E3** | Página dedicada | Overkill |

**Sugestão:** **E1** — abrir formulário preenchido; botões Salvar / Cancelar.  
Aviso curto: “Alterações de valor/descrição serão aplicadas às demais ocorrências desta série.”

### 5.3 Campos no form de edição (MVP)

- Descrição, Valor, Vencimento (da ocorrência), Pago, Categoria, Escopo, Responsável  
- Tipo / parcelas / meses: **somente leitura** (ou ocultos)

### 5.4 Após salvar

- Toast de sucesso  
- Recarregar lista da competência  
- Fechar form de edição  

---

## 6. Decisões pendentes

| # | Pergunta | Sugestão |
|---|----------|----------|
| 1 | Sempre atualizar a **série inteira** para valor/descrição/etc.? | **Sim** (pedido do usuário) |
| 2 | `pago` só na ocorrência editada? | **Sim** |
| 3 | Alterar `vencimento`: só a linha ou deslocar toda a série? | MVP: **só a linha** editada; fase 2: “realinhar série” |
| 4 | Permitir mudar FIXO ↔ VARIAVEL na edição? | **Não** no MVP |
| 5 | UI: card inline (E1) ou modal (E2)? | **E1** |
| 6 | Confirmar com dialog “Isso afeta N ocorrências”? | Recomendado (opcional no MVP) |
| 7 | Ícone: SVG inline / unicode / lib? | Botão outline com texto “Editar” ou ícone simples sem nova lib |

---

## 7. Tasks de baixa complexidade

> Nenhuma task abaixo deve ser executada nesta fase de levantamento.

### Fase 0 — Fechamento

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T0.1 | Confirmar §6 (pago local, vencimento, confirmação de série) | Baixa | — | Decisões |
| T0.2 | Confirmar campos editáveis vs somente leitura | Baixa | T0.1 | Lista de campos |

### Fase 1 — API: repositório + exceptions

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T1.1 | `findByAmbienteIdAndGrupoParcelamento` no `DespesaRepository` | Baixa | — | Query |
| T1.2 | `findByIdAndAmbienteId` (ou equivalente) | Baixa | — | Query |
| T1.3 | Exception `DespesaNaoEncontradaException` + handler 404 | Baixa | — | Erro |
| T1.4 | **Não** remover create/list existentes | — | — | Regra |

### Fase 2 — API: service de atualização

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T2.1 | Criar `AtualizarDespesaService` | Baixa | T1 | Service |
| T2.2 | Validar ambiente + carregar série pelo grupo | Baixa | T2.1 | Série |
| T2.3 | Validar responsável/escopo (reusar lógica do create) | Baixa | T2.1 | Validação |
| T2.4 | Propagar descricao/categoria/escopo/responsável para o grupo | Baixa | T2.2 | Update |
| T2.5 | FIXO: aplicar mesmo `valor` em todas do grupo | Baixa | T2.2 | Update |
| T2.6 | VARIAVEL: recalcular valores com `CalculadoraValorParcela` | Baixa | T2.2 | Update |
| T2.7 | Aplicar `pago` (e vencimento se §6) só na entidade `id` | Baixa | T2.2 | Update |
| T2.8 | DTO de update (ou reuso parcial de `DespesaDTO` sem tipo/parcelas) | Baixa | T0.2 | Contrato |

### Fase 3 — API: controller + testes

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T3.1 | `PUT /api/v1/despesas/{id}` no `DespesasController` | Baixa | T2 | Endpoint |
| T3.2 | Teste: editar FIXO propaga valor para as 12 | Baixa | T3.1 | Teste |
| T3.3 | Teste: editar VARIAVEL recalcula parcelas do grupo | Baixa | T3.1 | Teste |
| T3.4 | Teste: `pago` não altera outras do grupo | Baixa | T3.1 | Teste |
| T3.5 | Teste: id de outro ambiente → 404 | Baixa | T3.1 | Teste |

### Fase 4 — Front: API client + types

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T4.1 | Type `DespesaUpdateRequest` | Baixa | T2.8 | Types |
| T4.2 | `despesasApi.atualizar(id, body)` | Baixa | T4.1 | Client |

### Fase 5 — Front: UI edição

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T5.1 | Coluna Ações + botão/ícone Editar na tabela | Baixa | — | UI |
| T5.2 | Estado `despesaEmEdicao` + form preenchido (card) | Baixa | T5.1 | Form |
| T5.3 | Campos editáveis + tipo somente leitura | Baixa | T5.2 | Form |
| T5.4 | Texto informativo sobre atualização da série | Baixa | T5.2 | UX |
| T5.5 | Submit → `atualizar` → toast → `loadData` → fechar | Baixa | T4.2, T5.2 | Fluxo |
| T5.6 | Cancelar limpa edição sem salvar | Baixa | T5.2 | UX |
| T5.7 | (Opcional) Confirmar “afetará N recorrências” via `Modal` atual | Baixa | T5.5 | Confirmação |
| T5.8 | **Não** quebrar filtros/resumo/cadastro | — | — | Regra |

### Fase 6 — Docs / verificação

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T6.1 | Atualizar Postman / docs com PUT despesa | Baixa | T3.1 | Docs |
| T6.2 | Fluxo manual: editar aluguel FIXO e conferir outros meses | Baixa | T5 | E2E |
| T6.3 | Fluxo manual: editar variável 3x e conferir rateio | Baixa | T5 | E2E |

### Fase 7 — Depois do MVP

| ID | Task | Complexidade | Nota |
|----|------|--------------|------|
| T7.1 | Opção “editar só esta ocorrência” vs “toda a série” | Média | UX avançada |
| T7.2 | Realinhar vencimentos da série ao mudar data | Média | |
| T7.3 | Excluir série / excluir só uma | Média | |
| T7.4 | Mudar tipo FIXO↔VARIAVEL regenerando grupo | Alta | |

---

## 8. Cenários de teste (quando implementar)

| ID | Caso | Esperado |
|----|------|----------|
| C1 | Editar descrição de FIXO | Todas do grupo com nova descrição |
| C2 | Editar valor de FIXO (1500→1600) | 12 ocorrências com 1600 |
| C3 | Editar valor VARIAVEL 3x (3000→3000 já rateado → 4500) | Parcelas recalculadas somando 4500 |
| C4 | Marcar `pago=true` em jun | Só jun pago; jul inalterado |
| C5 | Ícone Editar abre form com dados da linha | OK |
| C6 | Cancelar não chama API | OK |
| C7 | Filtros/resumo após editar | Totais atualizados no reload |

---

## 9. Fora de escopo (esta fase)

- Implementação de qualquer task T0–T7  
- Exclusão de despesa  
- Regenerar quantidade de meses/parcelas  
- Alterar receitas  
- Remover cadastro, filtros ou totais existentes  

---

## 10. Critérios de pronto do MVP

1. Lista de despesas tem ação **Editar**  
2. Usuário altera valor/descrição/etc. e salva  
3. Em FIXO/VARIAVEL, campos de série propagam para o `grupoParcelamento`  
4. `pago` permanece por ocorrência  
5. Listagem/filtros/resumo continuam corretos após editar  
6. Nenhuma feature não relacionada removida  

---

## 11. Ordem sugerida de entrega

| PR | Conteúdo |
|----|----------|
| PR1 | Fases 1–3 (API + testes) |
| PR2 | Fases 4–5 (front) + Fase 6 (docs/manual) |

---

## 12. Próximo passo sugerido

1. Fechar decisões da **§6** (principalmente vencimento e confirmação de série).  
2. Aprovar este plano.  
3. Só então autorizar **PR1** (API de atualização com propagação no grupo).

**Status atual:** MVP implementado (PUT com propagação de série + UI de edição).
