import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Registro from './pages/Registro'
import Biblioteca from './pages/Biblioteca'
import Perfil from './pages/Perfil'
import Layout from './components/Layout'

function RotasProtegidas() {
  const { user, perfil, loading } = useAuth()

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">LYON</div>
      <div className="loading-dot" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!perfil?.onboarding_completo) return <Navigate to="/onboarding" replace />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/*" element={<RotasProtegidas />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
