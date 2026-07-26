# Levantamento — Nome e Sobrenome no cadastro

> **Escopo deste documento:** planejamento de implementação. **Nenhuma feature descrita aqui deve ser iniciada até aprovação.**
>
> **Projetos:** `api-registros-financeiros` + `web-registros-financeiros`.
>
> **Regra:** classes, services, controllers e páginas já existentes **permanecem intactos** enquanto não houver task explícita de extensão. Mudanças serão **aditivas** (novo campo `sobrenome`, ajustes de DTO/form) — **sem excluir** auth, login, convites, despesas, receitas, membros nem o fluxo atual de registro além do necessário para aceitar os dois campos.

---

## 1. Objetivo

Hoje o cadastro pede um único campo **Nome** (tratado como nome completo). O produto deve passar a pedir **Nome** e **Sobrenome** separados.

Nas telas que listam/selecionam usuários (responsável, membros, “Olá, …”), exibir **apenas o primeiro nome**.

| Requisito | Descrição |
|-----------|-----------|
| Cadastro | Campos **Nome** + **Sobrenome** (ambos obrigatórios) |
| Persistência | Guardar os dois valores no usuário |
| Display | Em listas/selects/header: **só o primeiro nome** |
| Escopo | Levantamento + tasks; **sem implementação** nesta fase |

---

## 2. Situação atual (baseline)

### 2.1 API

| Item | Path / detalhe |
|------|----------------|
| Entity | `UsuarioEntity` — campo único `nome` (`String`, length 100, not null) |
| Registro DTO | `RegistroRequestDTO` — `nome`, `telefone`, `email`, `senha` |
| Validação | `@NotBlank` + `@Size(min = 2, max = 100)` em `nome` |
| Service | `CadastrarUsuarioService` → `setNome(trim)` |
| Endpoint | `POST /api/v1/auth/registro` |
| Perfil | `GET /api/v1/auth/me` → `UsuarioResponseDTO` com `nome` (sem sobrenome) |

**Não existe** campo `sobrenome` em entity, DTO, testes ou front.

### 2.2 Onde o `nome` do usuário aparece hoje

| Superfície | Campo | Comportamento atual |
|------------|-------|---------------------|
| Header | `usuario.nome` | `Olá, {nome}` |
| Membros | `MembroAmbienteResponseDTO.nome` | Select de responsável |
| Despesas | `responsavelNome` | Tabela + resumo |
| Receitas | `responsavelNome` | Tabela + resumo |
| E-mail convite | `nomeUsuarioLogado` | Template usa `logado.getNome()` |

Mapeamentos (MapStruct / services) leem `usuario.getNome()` — se `nome` passar a ser só o primeiro nome, **listas e header já passam a mostrar só o primeiro nome** sem reescrever cada tela.

### 2.3 Front — registro

| Item | Path |
|------|------|
| Página | `RegistroPage.tsx` — input único `Nome` |
| Types | `auth.types.ts` — `RegistroRequest.nome`, `Usuario.nome` |
| API client | `auth.api.ts` |

---

## 3. Semântica desejada

| Campo | Significado | Exemplo |
|-------|-------------|---------|
| `nome` | Primeiro nome | `Gustavo` |
| `sobrenome` | Sobrenome (pode ter mais de uma palavra) | `Camargo Silva` |

| Contexto | O que mostrar |
|----------|----------------|
| Form “Criar conta” | Nome + Sobrenome |
| Header, selects, tabela responsável, resumos | **Só `nome`** |
| `/me` (opcional) | Pode expor `sobrenome` para perfil futuro; UI atual não precisa usar |
| E-mail de convite | Decidir em D3 (só primeiro nome vs nome completo) |

---

## 4. Opções de modelagem

| Opção | Ideia | Prós | Contras |
|-------|-------|------|---------|
| **A (recomendada)** | `nome` = primeiro nome; novo `sobrenome` na entity | Contratos de lista (`nome` / `responsavelNome`) continuam válidos; poucas mudanças no front de listagem | Dados antigos com nome completo em `nome` precisam cuidado |
| B | Manter `nome` como completo + getters `getPrimeiroNome()` | Menos migration conceitual | Continua pedindo um campo só no form ou exige parse frágil |
| C | Campo único `nomeCompleto` + `primeiroNome` derivado | Redundância | Dois campos para manter sincronizados |

**Sugestão: Opção A.**

### 4.1 Regras de validação sugeridas (MVP)

| Campo | Regra |
|-------|-------|
| `nome` | Obrigatório; trim; min 2 / max 60 (ou manter 100) |
| `sobrenome` | Obrigatório; trim; min 2 / max 100 |
| Não aceitar | String só espaços |

### 4.2 Dados existentes

Com `ddl-auto: create-drop` em desenvolvimento local, o recreate resolve.  
Se no futuro houver banco persistente: migration + script one-off (ex.: split no primeiro espaço) — **fora do MVP local**.

---

## 5. Contratos sugeridos (após aprovação)

### 5.1 POST `/api/v1/auth/registro` (aditivo)

```json
{
  "nome": "Gustavo",
  "sobrenome": "Camargo",
  "telefone": "11999998888",
  "email": "gustavo@email.com",
  "senha": "senha-segura"
}
```

### 5.2 Entity / `/me`

| Campo | Persistência | `/me` |
|-------|--------------|-------|
| `nome` | sim | sim (primeiro nome) |
| `sobrenome` | sim | sim (aditivo; front de listas não usa) |

### 5.3 Listas (membros, responsável)

Sem mudança de contrato: continuam devolvendo `nome` / `responsavelNome` = **primeiro nome**.

---

## 6. Arquivos relevantes (não excluir)

### API

| Path | Mudança prevista |
|------|------------------|
| `UsuarioEntity.java` | + `sobrenome` |
| `RegistroRequestDTO.java` | + `sobrenome` + validação |
| `CadastrarUsuarioService.java` | `setSobrenome` |
| `UsuarioResponseDTO.java` | + `sobrenome` (aditivo) |
| `ObterUsuarioLogadoService` / mapper de `/me` | Incluir sobrenome |
| `AuthIntegrationTest` / helpers de registro | Enviar `sobrenome` |
| `ListarMembrosAmbienteService`, mappers despesa/receita | **Sem mudança** se `nome` já for o primeiro |

### Front

| Path | Mudança prevista |
|------|------------------|
| `RegistroPage.tsx` | Inputs Nome + Sobrenome |
| `auth.types.ts` | `RegistroRequest.sobrenome`; `Usuario.sobrenome?` |
| `Header.tsx`, Despesas/Receitas | **Sem mudança** se API já devolver só primeiro nome em `nome` / `responsavelNome` |

---

## 7. Decisões abertas (para aprovação)

| # | Pergunta | Opção recomendada |
|---|----------|-------------------|
| D1 | `nome` passa a significar só primeiro nome? | **Sim** |
| D2 | Expor `sobrenome` em `/me`? | **Sim** (aditivo); listas não usam |
| D3 | E-mail de convite: só primeiro nome ou completo? | **Só primeiro nome** (igual UI) |
| D4 | Tamanhos max | `nome` 60; `sobrenome` 100 |
| D5 | Header: “Olá, Gustavo” (só nome) | **Sim** — sem alteração de componente se API ok |

---

## 8. Tasks (baixa complexidade) — após aprovação

### API

1. **Entity** — adicionar `sobrenome` em `UsuarioEntity` (not null, length conforme D4).  
2. **Registro DTO + service** — `RegistroRequestDTO` com `sobrenome`; `CadastrarUsuarioService` persiste trim de ambos.  
3. **`/me`** — incluir `sobrenome` em `UsuarioResponseDTO` (e mapper/service).  
4. **Testes** — atualizar registro nos testes/helpers para enviar `sobrenome`; cobrir 400 se faltar sobrenome.  
5. **Convite e-mail (se D3)** — confirmar que usa só `getNome()` (já deve bastar).

### Front

6. **Types** — `RegistroRequest` + `Usuario` com `sobrenome`.  
7. **`RegistroPage`** — dois campos (Nome, Sobrenome), validação client, payload com ambos.  
8. **Smoke visual** — Header / select responsável mostram só primeiro nome após novo cadastro (sem refatorar páginas se contrato mantido).

### Validação manual

9. **Checklist**  
   - Registrar com Nome + Sobrenome.  
   - Header: “Olá, {Nome}”.  
   - Select/tabela de responsável: só primeiro nome.  
   - Registro sem sobrenome → erro de validação.

---

## 9. Riscos / cuidados

| Risco | Mitigação |
|-------|-----------|
| Quebrar testes que mandam só `nome` | Atualizar helpers na mesma task de testes |
| Usuários antigos com nome completo em `nome` | Em create-drop: irrelevante; documentar migration futura |
| Front antigo enviando só `nome` | API passa a exigir `sobrenome` → 400 claro |
| Exibir sobrenome sem querer em lista | Não mapear `sobrenome` para `responsavelNome` / membros |

---

## 10. Critérios de pronto

- [ ] Cadastro exige Nome e Sobrenome  
- [ ] Ambos persistidos no usuário  
- [ ] Listas, selects e header mostram só o primeiro nome  
- [ ] `/me` pode devolver sobrenome sem quebrar clientes  
- [ ] Nenhuma exclusão de código não relacionado  
- [ ] Testes de registro atualizados  

---

## 11. Próximo passo

Aprovar **D1–D5** e autorizar início pela **Task 1** (entity + campo `sobrenome`).
