# Levantamento — Despesa FIXA recorrente (próximos meses)

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `api-registros-financeiros` (geração) + `web-registros-financeiros` (UX do formulário, se necessário).
>
> **Regra:** classes, services, controllers e páginas já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** ou ajustes pontuais em `GeradorParcelasService` / DTO / form — **sem excluir** VARIAVEL, responsável/escopo, convites, auth nem a listagem por competência.

---

## 1. Objetivo

Corrigir o significado de despesa **FIXA** no produto:

| Expectativa do usuário | Comportamento hoje |
|------------------------|--------------------|
| “Fixa” = gasto que **se repete todos os meses** (ex.: aluguel) | `FIXO` gera **apenas 1** registro no mês do vencimento |

| Requisito | Descrição |
|-----------|-----------|
| FIXO recorrente | Ao cadastrar como fixa, criar ocorrências nos **próximos meses** (mesmo valor) |
| VARIAVEL | Continua sendo **parcelamento** (valor dividido / N parcelas) — sem mudar regra atual |
| Escopo | Levantamento + tasks; **sem implementação** nesta fase |

---

## 2. Situação atual (baseline)

### 2.1 Geração (`GeradorParcelasService`)

```java
if (despesaDTO.getTipoDespesa() == TipoDespesa.FIXO) {
    return 1;  // ← só uma ocorrência
}
return despesaDTO.getQuantidadeParcelas(); // VARIAVEL: 1–24
```

Para cada ocorrência:

- Vencimento: `vencimento + (n-1) meses`
- Valor VARIAVEL: rateado por `CalculadoraValorParcela`
- Valor FIXO (hoje): o valor integral, mas só 1 vez
- `grupoParcelamento` UUID compartilha o lote
- `numeroParcela` / `totalParcelas` preenchidos

### 2.2 Semântica atual (implícita)

| Tipo | Significado implementado |
|------|---------------------------|
| `VARIAVEL` | Compra parcelada em N vezes |
| `FIXO` | Uma única despesa na competência do vencimento |

### 2.3 Front

- Select Tipo: Fixo / Variável
- Campo “Quantidade de parcelas” só se `VARIAVEL`
- Tabela mostra coluna Parcela só se `totalParcelas > 1`

### 2.4 Arquivos relevantes

| Item | Path |
|------|------|
| Geração | `GeradorParcelasService.java` |
| Create | `CadastrarDespesaService.java` |
| DTO | `DespesaDTO.java` (`quantidadeParcelas`) |
| Entity | `DespesaEntity.java` |
| Front form | `DespesasPage.tsx` |
| Testes | `DespesasParcelamentoIntegrationTest.java` |

---

## 3. Semântica desejada (produto)

| Tipo | Significado | Valor por mês | Horizonte |
|------|-------------|-----------------|-----------|
| **FIXO** | Recorrência mensal (mesmo gasto todo mês) | **Igual** em todas as ocorrências | A definir (§6) |
| **VARIAVEL** | Parcelamento de um valor total | Rateado / N | `quantidadeParcelas` (já existe, 1–24) |

Importante **não** tratar FIXO como “parcela 1/N” na UI (aluguel não é “1/12”), mesmo que internamente existam N linhas.

---

## 4. Opções de implementação

| Opção | Ideia | Prós | Contras |
|-------|-------|------|---------|
| **A (recomendada MVP)** | No create FIXO, **materializar** N meses à frente (mesmo valor, mesmo dia de vencimento +1 mês) | Alinha ao motor atual de VARIAVEL; listagem por competência já funciona | Precisa decidir N; editar/cancelar o futuro exige regra de grupo |
| B | Template de recorrência + job mensal | Menos linhas no banco | Job, complexidade, “mês futuro vazio” até rodar |
| C | Virtual na listagem (calcula FIXO na leitura) | Poucos registros | Query/listagem complexa; conflito com pago/edição |

**Sugestão:** Opção **A** — gerar ocorrências concretas, como já se faz com VARIAVEL, mudando só a regra de quantidade e de valor (sem rateio).

---

## 5. Proposta técnica (Opção A)

### 5.1 Regra de geração FIXO

Para `tipoDespesa = FIXO` e horizonte `H` meses:

1. Criar `H` entidades (ou `H` a partir do mês do vencimento inclusive).
2. Vencimento da ocorrência `i`: `vencimento.plusMonths(i - 1)`.
3. **Valor**: sempre o valor informado (não usar rateio de `CalculadoraValorParcela`).
4. Mesmo `escopo`, `responsavel`, `categoria`, `pago` inicial, `grupoParcelamento`.
5. Exibição de parcela:
   - **Preferência:** `numeroParcela = 1`, `totalParcelas = 1` em cada linha (coluna Parcela continua “-” na UI), **ou**
   - Campo/flag futuro `recorrente` (fase 2) se precisar distinguir no response.

Reutilizar `grupoParcelamento` para amarrar a série (útil para cancelar/editar lote depois).

### 5.2 Horizonte `H` — alternativas

| Alternativa | Descrição | UX |
|-------------|-----------|-----|
| **H1** | Default fixo **12 meses** (configurável no `application.yaml`) | Zero campo novo no form |
| **H2** | Campo no create: `quantidadeMeses` (ex. 1–60), obrigatório para FIXO | Usuário controla |
| **H3** | Recorrer até `dataFim` / fim do ano civil | Mais flexível, mais UI |

**Sugestão MVP:** **H2** com default **12** no front (e na API se omitido), espelhando a ideia de `quantidadeParcelas` da variável — label diferente: “Repetir por quantos meses”.

Se preferir zero mudança de contrato no front primeiro: **H1** só na API.

### 5.3 Contrato API (se H2)

Estender `DespesaDTO` (aditivo):

| Campo | Tipo | Quando |
|-------|------|--------|
| `quantidadeMeses` | Integer 1–60 (ex.) | Opcional; se FIXO e omitido → default 12 |
| `quantidadeParcelas` | já existe | Continua **só** para VARIAVEL |

Validação:

- FIXO: não exige `quantidadeParcelas`; usa `quantidadeMeses` ou default.
- VARIAVEL: inalterado.

### 5.4 Front (se H2)

| Item | Mudança |
|------|---------|
| Label/ajuda do Tipo Fixo | Texto curto: “Repete o mesmo valor nos próximos meses” |
| Campo | “Meses de repetição” visível se FIXO (default 12) |
| Tabela | Continua sem mostrar parcela para FIXO (`totalParcelas == 1`) |
| Lista por competência | Já mostra a ocorrência do mês ao trocar Ano/Mês |

### 5.5 O que **não** fazer no MVP

- Job mensal automático além do horizonte gerado  
- Editar/excluir em lote toda a série (pode ser fase 2 usando `grupoParcelamento`)  
- Mudar significado de VARIAVEL  
- Remover campos de responsável/escopo  

---

## 6. Decisões pendentes

| # | Pergunta | Sugestão |
|---|----------|----------|
| 1 | Opção A (materializar meses)? | **Sim** |
| 2 | Horizonte H1 (12 fixo) ou H2 (campo meses)? | **H2** com default 12 |
| 3 | Limite máximo de meses? | **24** ou **60** (alinhar a parcelas variáveis: 24) |
| 4 | Status `pago` nas ocorrências futuras | Todas `false` (ou herdar só a 1ª do request) — **sugerir:** valor do request em todas, tipicamente `false` |
| 5 | Exibir série como parcelas 1/N na UI? | **Não** — manter `totalParcelas = 1` |
| 6 | Despesas FIXO já cadastradas (1 linha)? | Sem backfill no MVP; só novos cadastros |

---

## 7. Tasks de baixa complexidade

> Nenhuma task abaixo deve ser executada nesta fase de levantamento.

### Fase 0 — Fechamento

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T0.1 | Confirmar §6 (H1 vs H2, limite, pago nas futuras) | Baixa | — | Decisões |
| T0.2 | Confirmar labels UI (“Meses de repetição” etc.) | Baixa | T0.1 | Copy |

### Fase 1 — API: geração FIXO

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T1.1 | Em `GeradorParcelasService`, separar resolução: FIXO → meses; VARIAVEL → parcelas | Baixa | T0.1 | Código |
| T1.2 | FIXO: loop `H` meses com **mesmo valor** (sem `CalculadoraValorParcela`) | Baixa | T1.1 | Geração |
| T1.3 | FIXO: `numeroParcela=1`, `totalParcelas=1` (ou regra §6.5) | Baixa | T1.2 | UI ok |
| T1.4 | Manter `grupoParcelamento` único na série | Baixa | T1.2 | Grupo |
| T1.5 | Propagar escopo/responsável (já no `CadastrarDespesaService`) para todas as ocorrências | Baixa | T1.2 | Regressão ok |
| T1.6 | **Não** alterar regra de rateio VARIAVEL | — | — | Regra |

### Fase 2 — API: DTO / validação (se H2)

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T2.1 | Adicionar `quantidadeMeses` em `DespesaDTO` (+ getters/setters) | Baixa | T0.1 = H2 | Campo |
| T2.2 | Validação: se FIXO e informado, range 1–N; se omitido, default | Baixa | T2.1 | Validação |
| T2.3 | Garantir que FIXO **não** exige `quantidadeParcelas` (já true hoje) | Baixa | — | OK |
| T2.4 | (Se H1) Só ler default de config `app.despesa.fixo-meses-default: 12` | Baixa | T0.1 = H1 | Config |

### Fase 3 — Testes API

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T3.1 | Teste: FIXO default gera H linhas em meses consecutivos | Baixa | T1–T2 | Teste |
| T3.2 | Teste: cada mês lista 1 ocorrência com mesmo valor | Baixa | T3.1 | Teste |
| T3.3 | Teste: VARIAVEL 2 parcelas continua igual | Baixa | — | Regressão |
| T3.4 | Teste: FIXO com `quantidadeMeses=3` (se H2) | Baixa | T2 | Teste |

### Fase 4 — Front (se H2; se H1 pular para docs)

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T4.1 | Types: `quantidadeMeses?` em `DespesaRequest` | Baixa | T2.1 | Types |
| T4.2 | Form: campo meses quando Tipo = Fixo (default 12) | Baixa | T4.1 | UI |
| T4.3 | Texto de ajuda sob o select Fixo | Baixa | T0.2 | UX |
| T4.4 | Enviar `quantidadeMeses` no POST | Baixa | T4.2 | Integração |
| T4.5 | **Não** mostrar parcelas na tabela para FIXO | Baixa | T1.3 | Lista |

### Fase 5 — Docs / verificação

| ID | Task | Complexidade | Dependências | Saída |
|----|------|--------------|--------------|-------|
| T5.1 | Atualizar Postman / docs de despesa FIXO | Baixa | T1–T2 | Docs |
| T5.2 | Fluxo manual: cadastrar aluguel FIXO → ver em M+0, M+1, M+2… | Baixa | T1 / T4 | E2E |
| T5.3 | Atualizar parágrafo do levantamento de responsável que dizia “não alterar significado FIXO/VARIAVEL” (nota: significado FIXO agora é recorrência) | Baixa | — | Consistência docs |

### Fase 6 — Depois do MVP

| ID | Task | Complexidade | Nota |
|----|------|--------------|------|
| T6.1 | Excluir/editar série inteira por `grupoParcelamento` | Média | UX lote |
| T6.2 | Marcar só a ocorrência atual como paga sem afetar futuras | Já possível se forem linhas separadas | Validar |
| T6.3 | Encerrar recorrência (parar de gerar / apagar futuras) | Média | |
| T6.4 | Template + job (Opção B) se horizonte infinito for necessário | Alta | |

---

## 8. Cenários de teste (quando implementar)

| ID | Caso | Esperado |
|----|------|----------|
| C1 | FIXO, vencimento 15/06, H=12 | 12 linhas; jun/26… mai/27 |
| C2 | Listar jun/26 | 1 despesa, valor integral |
| C3 | Listar jul/26 | 1 despesa, mesmo valor, venc. 15/07 |
| C4 | Coluna Parcela | “-” (não 1/12) |
| C5 | VARIAVEL 3x | 3 parcelas rateadas (como hoje) |
| C6 | FIXO + responsável/conjunta | Todas as ocorrências com mesmo escopo/responsável |
| C7 | FIXO H=1 | Só o mês do vencimento (equivalente ao comportamento antigo) |

---

## 9. Fora de escopo (esta fase)

- Implementação de qualquer task T0–T6  
- Remover tipo VARIAVEL ou o form atual  
- Recorrência em receitas  
- Job agendado mensal  
- Backfill de despesas FIXO antigas  

---

## 10. Critérios de pronto do MVP

1. Cadastro **FIXO** cria ocorrências nos próximos meses (horizonte aprovado)  
2. Cada mês tem o **mesmo valor** (não rateado)  
3. **VARIAVEL** permanece com parcelamento atual  
4. Listagem por competência mostra a ocorrência do mês  
5. UI não trata a série FIXA como “parcela 1/N”  
6. Responsável/escopo continuam funcionando na série  

---

## 11. Ordem sugerida de entrega

| PR | Conteúdo |
|----|----------|
| PR1 | Fases 1–3 (API + testes) |
| PR2 | Fase 4 (front, se H2) + Fase 5 (docs) |

---

## 12. Próximo passo sugerido

1. Fechar decisões da **§6** (principalmente H1 vs H2 e limite de meses).  
2. Aprovar este plano.  
3. Só então autorizar **PR1** (geração FIXO na API).

**Status atual:** decisão confirmada — FIXO materializa **12 meses** (H1). Implementação autorizada/em andamento conforme essa regra.
