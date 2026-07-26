# Web — Registros Financeiros

Front-end React + Vite para consumir a API de registros financeiros.

## Pré-requisitos

- Node.js 20+
- API Spring Boot rodando em `http://localhost:8090`

## Como subir

### 1. Backend (porta 8090)

```bash
cd ../api-registros-financeiros
./mvnw spring-boot:run
```

No Windows:

```powershell
cd ..\api-registros-financeiros
.\mvnw.cmd spring-boot:run
```

### 2. Front-end (porta 5174)

```bash
cd web-registros-financeiros
npm install
npm run dev
```

Acesse: http://localhost:5174

## Integração com a API

O Vite está configurado com proxy de `/api` para `http://localhost:8090`, evitando problemas de CORS no desenvolvimento local.

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm test` | Testes em modo watch |
| `npm run test:run` | Testes uma vez |

## Módulos

- **Despesas** — listagem por competência e cadastro (fixo/variável)
- **Receitas** — listagem por competência, total do mês e cadastro
- **Categorias** — cadastro, listagem e exclusão
- **Pagadores** — cadastro, listagem e exclusão

## Observação sobre dados

A API usa H2 com `create-drop`. Ao reiniciar o backend, os dados são apagados.
