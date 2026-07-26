# web-registros-financeiros

Front-end React + Vite do **Registros Financeiros**: autenticação, ambientes compartilhados, despesas e receitas por competência (mês/ano), categorias, pagadores e convites de edição.

## Features

- Login / registro com JWT (access em memória/`sessionStorage` + refresh via cookie HttpOnly)
- Ambientes multi-tenant (header `X-Ambiente-Id`)
- Despesas (única / fixo / variável) e receitas por competência
- Categorias, pagadores e convites de editor
- Proxy same-origin `/api` (Vite em dev, Nginx em produção)

## Stack

| Item | Tecnologia |
|------|------------|
| UI | React 19 |
| Build | Vite 8 + TypeScript |
| Rotas | React Router 7 |
| Testes | Vitest + Testing Library |
| Lint | Oxlint |
| Deploy | Docker (Node build → Nginx) |

## Quick Start

### Pré-requisitos

- Node.js 20+
- API `api-registros-financeiros` rodando em `http://localhost:8090` (profile local)

### Subir

```bash
# 1) Backend (outro terminal)
cd ../api-registros-financeiros
# defina JWT_SECRET com ≥ 32 caracteres aleatórios
./mvnw spring-boot:run   # Windows: .\mvnw.cmd spring-boot:run

# 2) Front
cd ../web-registros-financeiros
npm install
npm run dev
```

Acesse: http://localhost:5174

O Vite faz proxy de `/api` → `http://localhost:8090` (ver `vite.config.ts`).

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Dev server (porta **5174**) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm test` | Vitest (watch) |
| `npm run test:run` | Vitest uma vez |
| `npm run lint` | Oxlint |

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/architecture.md](./docs/architecture.md) | Arquitetura, auth, proxy, deploy |
| [docs/features.md](./docs/features.md) | Telas, rotas e fluxos de uso |
| [docs/design-system.md](./docs/design-system.md) | Design system (se existir no repo) |

## Configuração / segredos

Este front **não usa** variáveis `VITE_*` no código atual: as chamadas são relative (`/api/v1/...`).

- Em **dev**, o destino da API é o proxy do Vite (`localhost:8090`).
- Em **produção**, o Nginx faz proxy de `/api/` para o backend (configure o host do backend no deploy — veja [docs/architecture.md](./docs/architecture.md#deploy-docker--nginx)).

**Não versione:**

- Arquivos `.env` / `.env.*` (se criar no futuro)
- Tokens, cookies de sessão ou dados reais de usuário em issues/PRs
- Hostnames internos de infraestrutura ou secrets de CI

Template seguro do Nginx: [`nginx.conf.example`](./nginx.conf.example).

## Estrutura

```text
src/
  api/           # client HTTP + módulos da API
  components/    # auth, layout, toast, ui
  context/       # Auth, Competência
  pages/         # telas
  types/ hooks/ utils/ styles/
```

## Projetos relacionados

- `api-registros-financeiros` — API Spring Boot
- `api-envio-emails` — envio de e-mails (convites)

## Observação (ambiente local)

No profile `local`, a API usa H2 com `create-drop`: ao reiniciar o backend, os dados são apagados.

## License

Uso conforme definido pelo autor do repositório.
