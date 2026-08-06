# Relatório de Performance — web-registros-financeiros

**Data:** 05/08/2026  
**Stack:** React 19.2 · TypeScript 6 · Vite 8 · React Router 8 · Recharts 3  
**Escopo:** Análise estática completa + build de produção + revisão de padrões de renderização  
**Páginas analisadas:** 13 rotas · 105 arquivos TS/TSX em `src/`

---

## Resumo Executivo

O frontend é uma **SPA bem organizada**, com separação clara (`api/`, `pages/`, `components/`, `context/`, `utils/`), agregações puras testadas (Vitest) e boas práticas pontuais (`useSyncExternalStore`, `Promise.all`, anti-FOUC de tema). Porém, há **gargalos estruturais recorrentes** que impactam first load, rede e renderização:

1. **Bundle monolítico (681 KB / 201 KB gzip)** — sem code splitting; `recharts` carrega no login.
2. **Sem cache de API** — mesmos dados refetchados ao navegar entre rotas.
3. **Refetch total após mutações leves** — toggle "pago" dispara 3–4 requests.
4. **Colunas DataTable inline** — nova referência a cada render.
5. **ToastProvider acima da árvore de app** — toast re-renderiza Auth + Competencia + rotas.
6. **Páginas monolíticas** — `DespesasPage` (736 linhas), `ReceitasPage` (528 linhas) com duplicação.

### Nota Geral de Performance: **6,0 / 10**

| Dimensão           | Nota  | Comentário |
|--------------------|-------|------------|
| Arquitetura        | 7,0   | Pastas claras; falta camada de cache e splitting |
| Código             | 6,5   | Legível; duplicação CRUD e páginas grandes |
| Renderização       | 6,0   | Sem memoização; props instáveis em tabelas |
| Rede / API         | 5,5   | Paralelismo OK; refetch redundante |
| Bundle             | 4,5   | Chunk único; warning Vite > 500 KB |
| Listas             | 7,0   | Volume baixo; sem virtualização (OK hoje) |
| UX de performance  | 6,5   | Skeletons, modo background; loading global na Home |
| **Qualidade Geral**| **6,0** | Base sólida; otimizações de alto ROI disponíveis |

**Impacto esperado das melhorias prioritárias:** redução de **40–60%** no JS inicial (first load), **50–70%** menos requests redundantes na navegação, e **20–35%** menos trabalho de render em páginas de listagem.

---

## Limitações da Medição

| Item | Status | Motivo |
|------|--------|--------|
| Build de produção | ✅ Executado | `npm run build` — chunk único medido |
| Lighthouse / Web Vitals | ❌ Não executado | Requer servidor + browser automatizado |
| Chrome Performance trace | ❌ Não executado | Requer sessão interativa |
| Bundle analyzer visual | ❌ Não executado | `rollup-plugin-visualizer` não configurado |
| Profiling React DevTools | ❌ Não executado | Análise estática + padrões conhecidos |

> **Importante:** Estimativas de render são baseadas em análise de código e volume esperado (~30–120 registros/mês). Com centenas de lançamentos, listas sem virtualização degradariam.

---

## Etapa 1 — Análise Geral do Projeto

### Estrutura

```
src/
├── api/           # 13 módulos REST + client.ts central
├── components/    # auth, layout, toast, ui
├── context/       # Auth, Competencia, Theme, Ambiente
├── hooks/         # useApiFeedback, useBreakpoint, useMediaQuery
├── pages/         # 13 páginas (+ 2 subcomponentes Home)
├── types/         # DTOs espelhando API
└── utils/         # Agregações puras (home, despesas, receitas)
```

### Pontos positivos

- **Separação de responsabilidades** — API isolada, utils testáveis, tipos dedicados.
- **AmbienteProvider escopado** ao `AppShell` (não global) — `AppShell.tsx:33`.
- **Agregações fora do JSX** — `calcularBalancoMes`, `calcularResumoDespesas`, etc.
- **Anti-FOUC** inline em `index.html:14-27` — evita flash de tema.
- **65 testes Vitest** — cobertura de utils e componentes críticos.

### Pontos de melhoria

| Problema | Evidência | Impacto |
|----------|-----------|---------|
| Estado global via Context sem selectors | 5 providers em `main.tsx` | Re-render em cascata |
| Sem camada de cache (TanStack Query/SWR) | `client.ts` — fetch puro | Requests duplicados |
| Sem lazy loading de rotas | `App.tsx:4-13` — imports estáticos | Bundle grande no first paint |
| Duplicação CRUD | Categorias/Cartões/Pagadores ~95% iguais | Manutenção + superfície de bugs |
| Duplicação Despesas/Receitas | ~60% código compartilhável | Páginas difíceis de otimizar |
| `resolverAmbienteAtivo` duplicado | `AmbienteContext.tsx:16-28`, `ConvitesPage.tsx:19-31` | DRY violado |

---

## Etapa 2 — Análise dos Componentes

### Páginas principais

| Componente | Linhas | Renders estimados | Problemas |
|------------|--------|-------------------|-----------|
| `DespesasPage` | 736 | Alto (15+ states) | Monolítico; columns inline; refetch total |
| `ReceitasPage` | 528 | Alto | Idem Despesas |
| `HomePage` | 202 | Médio-alto | `setLoading(true)` sempre; `individuaisData` sem memo |
| `ConvitesPage` | 270 | Médio | Fetch duplicado de ambientes |
| `CategoriasPage` | 164 | Médio | columns recriadas (canWrite muda referência) |
| `DataTable` | 238 | Por pai | `key={index}`; sem `React.memo` |
| `ToastProvider` | 95 | Global | State de toasts no mesmo provider da app |
| `AppShell` | 89 | Por rota/context | OK — escopo correto de Ambiente |

### Problemas por componente (detalhados)

#### `DespesasPage` — Severidade: **Alta**

**Problemas:**
1. **15 estados locais** — qualquer `setState` re-renderiza form + tabela + modals.
2. **`columns` inline no JSX** (`DespesasPage.tsx:609-720`) — array + funções `render` novas a cada render.
3. **`alternarPago`** (`DespesasPage.tsx:335-347`) — PATCH leve seguido de `loadData('background')` com 4 requests.
4. **`useEffect` de form** (`DespesasPage.tsx:149-164`) — `setForm` condicional causa render extra.

**Como corrigir:**

```tsx
// Extrair columns para useMemo com deps estáveis
const columns = useMemo<DataTableColumn<Despesa>[]>(() => [
  { key: 'descricao', header: 'Descrição', render: (row) => row.descricao },
  // ...
], [canWrite, pagoLoadingId, /* handlers estáveis via useCallback */])

// Optimistic update em alternarPago
const alternarPago = useCallback(async (despesa: Despesa) => {
  const novoPago = !despesa.pago
  setDespesas((prev) => prev.map((d) => (d.id === despesa.id ? { ...d, pago: novoPago } : d)))
  try {
    await despesasApi.atualizarPago(despesa.id, novoPago)
  } catch (error) {
    setDespesas((prev) => prev.map((d) => (d.id === despesa.id ? { ...d, pago: !novoPago } : d)))
    handleError(error)
  }
}, [handleError])
```

**Ganho estimado:** 25–40% menos renders na tabela; 75% menos requests no toggle pago.

---

#### `HomePage` — Severidade: **Média**

**Problemas:**
1. **`setLoading(true)` em toda troca de competência** (`HomePage.tsx:70`) — esconde conteúdo com hint "Atualizando…".
2. **`individuaisData` sem `useMemo`** (`HomePage.tsx:100-103`) — recalculado a cada render.
3. **`contentStyle` inline no Tooltip** (`HomePage.tsx:187-191`) — objeto novo a cada render (impacto baixo).

**Como corrigir:**

```tsx
const individuaisData = useMemo(
  () => resumoDespesas.porResponsavel.map((item) => ({ nome: item.nome, total: item.total })),
  [resumoDespesas.porResponsavel],
)

// Loading incremental: só skeleton no primeiro load
const loadData = useCallback(async () => {
  if (!hasLoadedOnce) setLoading(true)
  // ...
}, [ano, mes, handleError, hasLoadedOnce])
```

**Ganho estimado:** UX mais fluida; ~10% menos trabalho de render.

---

#### `DataTable` — Severidade: **Média**

**Problemas:**
1. **`key={index}`** (`DataTable.tsx:157, 221`) — reconciliação subótima ao reordenar/filtrar.
2. **Sem `React.memo`** — re-renderiza integralmente quando `columns` muda referência.
3. **`sortDetails` + filtros de columns** recalculados a cada render no modo mobile.

**Como corrigir:**

```tsx
// DataTable.tsx — aceitar keyExtractor opcional
interface DataTableProps<T> {
  getRowKey?: (row: T, index: number) => string | number
}

// Uso em DespesasPage
<DataTable getRowKey={(row) => row.id} ... />

export const DataTable = memo(DataTableInner) as typeof DataTableInner
```

**Ganho estimado:** 15–25% em listas com filtros frequentes.

---

#### `ToastProvider` — Severidade: **Média-Alta**

**Problema:** `{children}` e `{toasts.map(...)}` no mesmo componente (`ToastProvider.tsx:70-84`). Cada toast adicionado/remove re-renderiza **toda a subárvore** (Auth, Competencia, App, rotas).

**Como corrigir:**

```tsx
// Separar: contexto estável + portal de UI
function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  // render só o div.container
}

// Provider expõe apenas funções estáveis (useRef + dispatch)
// ToastContainer montado como sibling, não wrapper de children
```

**Ganho estimado:** Elimina re-renders globais a cada toast (~2–4 por ação CRUD).

---

## Etapa 3 — Hooks

### Inventário

| Hook | Ocorrências | Avaliação |
|------|-------------|-----------|
| `useState` | ~80+ | OK; excesso em DespesasPage/ReceitasPage |
| `useEffect` | ~25 | Maioria correta; alguns evitáveis |
| `useMemo` | 11 arquivos | Bem usado em contexts; ausente em columns/Home |
| `useCallback` | 14 arquivos | Bem usado em loadData; handlers inline em JSX |
| `useReducer` | **0** | Oportunidade em forms complexos |
| `useRef` | 3 | Toast id, Modal focus, Drawer |
| `useSyncExternalStore` | 1 | **Excelente** em `useMediaQuery.ts` |
| Context API | 5 | Values memoizados ✓; sem selectors |

### Problemas encontrados

| Arquivo | Linhas | Problema | Correção |
|---------|--------|----------|----------|
| `HomePage.tsx` | 88-90 | Effect dispara load a cada competência | Debounce ou stale-while-revalidate |
| `DespesasPage.tsx` | 149-164 | Effect + setForm condicional | Inicializar form no open handler |
| `DespesasPage.tsx` | 142-147 | Effect reseta form em competência | OK — necessário |
| `AmbienteContext.tsx` | 64-66 | Effect no mount | OK |
| `main.tsx` | 12 | `StrictMode` | Double effects em dev (dobra fetches) |
| `useApiFeedback.ts` | 8-37 | `handleError` recriado se `showError` mudar | Estável via ToastContext memoizado ✓ |

### Memoização desnecessária vs ausente

| Situação | Veredicto |
|----------|-----------|
| Context values com `useMemo` | ✅ Correto |
| `resumo` / `despesasFiltradas` com `useMemo` | ✅ Correto |
| `columns` sem `useMemo` | ❌ Deveria memoizar |
| `individuaisData` sem `useMemo` | ❌ Deveria memoizar |
| `useCallback` em todos loadData | ✅ Correto |
| Handlers inline em `render` de columns | ❌ Instáveis |

---

## Etapa 4 — Renderização

### Re-renderizações identificadas

```
Troca de competência (PageHeader)
  → CompetenciaContext value muda
    → HomePage, DespesasPage, ReceitasPage (se montadas)
    → PageHeader, CompetenciaSelector
    → loadData() em effect → setState × N

Toast de sucesso
  → ToastProvider setToasts
    → AuthProvider children re-render
      → ProtectedRoute, AppShell, página ativa

Troca de ambiente (Sidebar)
  → AmbienteContext
    → Sidebar, página CRUD, permissões canWrite
```

### Props instáveis (alta frequência)

| Origem | Tipo | Onde |
|--------|------|------|
| `columns={[...]}` | Array novo | DespesasPage, ReceitasPage |
| `render: (row) => <Button onClick={() => ...}>` | Função + closure | Todas as DataTables |
| `contentStyle={{ ... }}` | Objeto | HomePage, HomeDespesasPorCategoria |
| `style={{ width: \`${n}%\` }}` | Objeto | HomePage barras |
| `onChange={(e) => setForm(...)}` | Função inline | Forms (aceitável em inputs) |

### Cascata de renders

1. **`loadData('background')`** — 4 `setState` sequenciais → 4 renders (React 19 pode batch, mas ainda reconcilia).
2. **Filtro de despesas** — `filtroEscopo` muda → `despesasFiltradas` recalcula → DataTable re-render (OK com useMemo).
3. **`canWrite` muda** — columns array recriado → DataTable full re-render.

### Sugestões

```tsx
// 1. Batch setState com useReducer ou single state object
const [pageState, dispatch] = useReducer(despesasReducer, initialState)

// 2. React.memo nos subcomponentes de Home
export const HomeDespesasPorCategoria = memo(function HomeDespesasPorCategoria(...) { ... })

// 3. Split DespesasPage
<DespesasForm ... />
<DespesasTable ... />
<DespesasFilters ... />
```

---

## Etapa 5 — Performance de Listas

### Operações analisadas

| Função | Arquivo | Complexidade | Observação |
|--------|---------|--------------|------------|
| `calcularResumoDespesas` | `despesasResumo.ts:16-53` | O(n) | ✅ Loop único + Map |
| `calcularGastosPorCategoria` | `homeGastosPorCategoria.ts:11-32` | O(n + c log c) | ✅ Sort uma vez |
| `filtrarDespesas` | `despesasFiltro.ts` | O(n) | ✅ Memoizado no caller |
| `limitarCategoriasParaDonut` | `limitarCategoriasParaDonut.ts` | O(n log n) | Poucos itens |
| `DataTable data.map` | `DataTable.tsx:156, 220` | O(n × cols) | Sem virtualização |

### Virtualização

**Status:** não utilizada (sem `react-window`, `@tanstack/react-virtual`).

**Necessidade atual:** **Baixa**

| Lista | Tamanho esperado | Recomendação |
|-------|------------------|--------------|
| Despesas/receitas/mês | 30–120 | Monitorar; virtualizar se > 200 |
| Categorias/cartões/pagadores | < 50 | Não necessário |
| Membros | 2–20 | Não necessário |

**Quando implementar:** se usuários reportarem lentidão com despesas fixas (12/mês × muitas categorias) ou variáveis (24 parcelas).

```tsx
// Futuro — TanStack Virtual
import { useVirtualizer } from '@tanstack/react-virtual'
```

### Loops duplicados

| Problema | Onde | Impacto |
|----------|------|---------|
| Home busca despesas + categorias | `HomePage.tsx:72-76` | DespesasPage busca de novo ao navegar |
| `categoriasApi.listar()` | Home, Despesas, Categorias | 3× sem cache |
| `listarMembrosAtivo()` | Despesas, Receitas, Convites | 3× sem cache |

---

## Etapa 6 — Bundle e Carregamento

### Build de produção (05/08/2026)

```
dist/assets/index-go1Yzw9v.js   681.11 kB │ gzip: 201.33 kB
dist/assets/index-DY-YfglJ.css   33.16 kB │ gzip:   7.03 kB
dist/index.html                   1.33 kB │ gzip:   0.70 kB
```

**740 módulos** transformados em **1 chunk JS**.

Vite emitiu warning: *"Some chunks are larger than 500 kB"* — code splitting não configurado.

### Composição estimada do bundle

| Pacote | Impacto estimado (gzip) | Carregado em |
|--------|-------------------------|--------------|
| `react` + `react-dom` | ~45 KB | Todas as rotas |
| `react-router` | ~15 KB | Todas |
| **`recharts`** | **~80–120 KB** | Só `/home` (mas carrega em todas) |
| Código app (páginas) | ~40–60 KB | Todas (imports estáticos) |
| Runtime/helpers | restante | — |

### Problemas

1. **`App.tsx`** — 10 páginas importadas estaticamente; login carrega DespesasPage + Recharts.
2. **`vite.config.ts`** — sem `build.rollupOptions.output.manualChunks`.
3. **Sem prefetch** de rotas prováveis (`/despesas`, `/receitas`).
4. **CSS único** — OK para app pequeno (33 KB).

### Melhorias

```tsx
// App.tsx — route-based splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const DespesasPage = lazy(() => import('./pages/DespesasPage'))

<Suspense fallback={<AuthBootSkeleton />}>
  <Routes>...</Routes>
</Suspense>
```

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          vendor: ['react', 'react-dom', 'react-router'],
        },
      },
    },
  },
})
```

**Ganho estimado:** First load **-40% a -55%** JS gzip na rota `/login` (~80–110 KB).

---

## Etapa 7 — Rede e API

### Cliente HTTP (`api/client.ts`)

| Aspecto | Estado | Recomendação |
|---------|--------|--------------|
| Fetch nativo | ✅ | OK |
| Refresh token deduplicado | ✅ `refreshInFlight` | OK |
| Retry em 401 | ✅ | OK |
| Cache | ❌ | TanStack Query |
| Deduplicação in-flight | ❌ | Query client |
| Compressão | ✅ Backend gzip | Transparente |
| Parallel requests | ✅ `Promise.all` | OK |

### Padrão repetido (7 páginas)

```typescript
const loadData = useCallback(async (mode: 'full' | 'background' = 'full') => {
  if (mode === 'full') setListLoading(true)
  const [...] = await Promise.all([...])
  setState(...)
}, [deps])
```

### Requests redundantes

| Endpoint | Consumidores | Solução |
|----------|--------------|---------|
| `GET /categorias` | Home, Despesas, Categorias | Cache 5 min |
| `GET /ambientes` | AmbienteContext, Convites | Reutilizar context |
| `GET /membros` | Despesas, Receitas, Convites | Cache por ambienteId |
| `GET /despesas?ano&mes` | Home, Despesas | Cache por competência |

### Refetch excessivo

| Ação | Requests após mutação | Ideal |
|------|----------------------|-------|
| Toggle pago | 4 (despesas + cat + cartões + membros) | 0 (optimistic) ou 1 |
| Cadastrar categoria | 1 (listar) | + invalidar cache |
| Excluir despesa | 4 | 1 ou optimistic |

---

## Etapa 8 — Memória e CPU

### Memória

| Item | Análise |
|------|---------|
| Estado por página | DespesasPage ~15 arrays/objetos — OK |
| Recharts | Mantém DOM SVG + dados — liberar ao desmontar rota (lazy ajuda) |
| Toast array | Max ~3 toasts — OK |
| Closures em columns | Novas a cada render — pressão GC leve |
| `Map` em utils | Local, liberado após cálculo — OK |

### CPU

| Operação | Complexidade | Quando |
|----------|--------------|--------|
| `calcularResumoDespesas` | O(n) | Cada render se despesas mudam |
| `filtrarDespesas` | O(n) | Cada filtro (memoizado ✓) |
| Recharts layout | O(n) SVG | Home montada |
| Reconciliação DataTable | O(n × cols) | Cada render com columns instáveis |

**Sem loops O(n²)** em paths críticos com volume atual.

---

## Etapa 9 — Web Vitals (Estimativa)

| Métrica | Estimativa | Fator limitante |
|---------|------------|-----------------|
| **LCP** | 1,8–3,5 s (3G) | Bundle 201 KB gzip + API |
| **INP** | Bom (< 200 ms) | Poucos listeners; forms simples |
| **CLS** | Baixo | Skeletons fixos; anti-FOUC ✓ |
| **TTFB** | Depende da API | Proxy Vite em dev |
| **FCP** | 1,2–2,5 s | JS monolítico |

> Para medição real: `npm run build && npm run preview` + Lighthouse ou WebPageTest.

---

## Etapa 10 — UX Relacionada à Performance

| Comportamento | Avaliação |
|---------------|-----------|
| Skeleton na Home (primeiro load) | ✅ `HomeSkeleton` |
| Skeleton na DataTable | ✅ 5 rows |
| Modo `background` (sem skeleton) | ✅ Pós-mutação |
| Hint "Atualizando competência…" | ⚠️ Pode parecer lentidão |
| Drawer fecha ao navegar | ✅ `AppShell.tsx:22-24` |
| Toast deduplicado | ✅ `ToastProvider.tsx:38-42` |
| Mensagem API indisponível | ✅ `client.ts:107-109` |
| Focus trap em Modal | ✅ Acessibilidade OK |

---

## Gargalos Críticos (Priorizados)

| # | Gargalo | Severidade | Impacto | Esforço |
|---|---------|------------|---------|---------|
| 1 | Bundle monolítico (681 KB) | **Crítico** | First load lento | Baixo |
| 2 | Sem cache de API | **Crítico** | Requests redundantes | Médio |
| 3 | Refetch total após toggle pago | **Alto** | 4 requests por clique | Baixo |
| 4 | Columns inline no DataTable | **Alto** | Re-render completo | Baixo |
| 5 | ToastProvider re-render global | **Alto** | Cascata desnecessária | Médio |
| 6 | Páginas monolíticas (736 linhas) | **Médio** | Difícil otimizar | Alto |
| 7 | `key={index}` no DataTable | **Médio** | Reconciliação subótima | Baixo |
| 8 | Home loading full em competência | **Baixo** | UX | Baixo |
| 9 | StrictMode double fetch (dev) | **Baixo** | Dev only | — |

---

## Melhorias Prioritárias

| Prioridade | Item | Impacto | Dificuldade |
|------------|------|---------|-------------|
| 🔴 P0 | `React.lazy` + `Suspense` por rota | Alto (first load) | Baixa |
| 🔴 P0 | `manualChunks` — separar `recharts` | Alto (first load) | Baixa |
| 🔴 P0 | TanStack Query (cache + dedupe) | Alto (rede) | Média |
| 🟠 P1 | Optimistic update em `alternarPago` | Alto (rede + UX) | Baixa |
| 🟠 P1 | `useMemo(columns)` + `React.memo(DataTable)` | Médio (render) | Baixa |
| 🟠 P1 | Separar Toast UI do Provider | Médio (render global) | Média |
| 🟡 P2 | Extrair hook `useCrudList` | Manutenção | Média |
| 🟡 P2 | Split DespesasPage em subcomponentes | Manutenção + perf | Alta |
| 🟡 P2 | `getRowKey` no DataTable | Baixo-médio | Baixa |
| 🟢 P3 | Virtualização (se volume crescer) | Médio (escala) | Média |
| 🟢 P3 | `useReducer` em forms complexos | Baixo | Média |

---

## Score Final

| Dimensão | Nota |
|----------|------|
| Arquitetura | **7,0 / 10** |
| Código | **6,5 / 10** |
| Renderização | **6,0 / 10** |
| Rede / API | **5,5 / 10** |
| Bundle | **4,5 / 10** |
| Listas | **7,0 / 10** |
| UX Performance | **6,5 / 10** |
| **Qualidade Geral** | **6,0 / 10** |

---

## Próximos Passos Recomendados

1. **Implementar P0** (1–2 dias) — lazy routes, manualChunks, TanStack Query básico.
2. **Medir baseline** — Lighthouse em `/login`, `/home`, `/despesas` após build.
3. **Implementar P1** — optimistic pago, memo columns, Toast refactor.
4. **Integrar bundle analyzer** no CI — threshold gzip < 120 KB na rota login.
5. **Repetir auditoria** após otimizações com Web Vitals reais.

---

*Relatório gerado por análise estática do código-fonte, build de produção Vite e revisão de padrões React. Resultados de runtime podem variar conforme rede, dispositivo e volume de dados.*
