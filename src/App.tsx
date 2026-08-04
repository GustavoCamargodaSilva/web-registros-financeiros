import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { AceitarConvitePage } from './pages/AceitarConvitePage'
import { ConvitesPage } from './pages/ConvitesPage'
import { LoginPage } from './pages/LoginPage'
import { RegistroPage } from './pages/RegistroPage'
import { CategoriasPage } from './pages/CategoriasPage'
import { CartoesPage } from './pages/CartoesPage'
import { DespesasPage } from './pages/DespesasPage'
import { HomePage } from './pages/HomePage'
import { PagadoresPage } from './pages/PagadoresPage'
import { ReceitasPage } from './pages/ReceitasPage'

export default function App() {
  return (
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
  )
}
