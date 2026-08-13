import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { RouteFallback } from './components/auth/RouteFallback'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

const AceitarConvitePage = lazy(() =>
  import('./pages/AceitarConvitePage').then((module) => ({ default: module.AceitarConvitePage })),
)
const ConvitesPage = lazy(() =>
  import('./pages/ConvitesPage').then((module) => ({ default: module.ConvitesPage })),
)
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const RegistroPage = lazy(() =>
  import('./pages/RegistroPage').then((module) => ({ default: module.RegistroPage })),
)
const CategoriasPage = lazy(() =>
  import('./pages/CategoriasPage').then((module) => ({ default: module.CategoriasPage })),
)
const CartoesPage = lazy(() =>
  import('./pages/CartoesPage').then((module) => ({ default: module.CartoesPage })),
)
const DespesasPage = lazy(() =>
  import('./pages/DespesasPage').then((module) => ({ default: module.DespesasPage })),
)
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const PagadoresPage = lazy(() =>
  import('./pages/PagadoresPage').then((module) => ({ default: module.PagadoresPage })),
)
const ReceitasPage = lazy(() =>
  import('./pages/ReceitasPage').then((module) => ({ default: module.ReceitasPage })),
)

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/convites/aceitar" element={<AceitarConvitePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="despesas" element={<DespesasPage />} />
            <Route path="receitas" element={<ReceitasPage />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="cartoes" element={<CartoesPage />} />
            <Route path="pagadores" element={<PagadoresPage />} />
            <Route path="convites" element={<ConvitesPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
