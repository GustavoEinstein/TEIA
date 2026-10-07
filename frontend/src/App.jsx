import React from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"

// --- PÁGINAS PÚBLICAS ---
import LandingPage from "./pages/LandingPage"
import Login from "./Login"
import Register from "./Register"
import TermosDeUso from "./pages/TermosDeUso"
import PoliticaDePrivacidade from "./pages/PaginaDePrivacidade"

// --- PÁGINAS DE RECUPERAÇÃO DE SENHA ---
import EsqueceuSenha from "./pages/EsqueceuSenha"
import NovaSenha from "./pages/NovaSenha"

// --- PÁGINAS DO DASHBOARD (PRIVADAS) ---
import Dashboard from "./Dashboard"
import MainContent from "./components/MainContent"
import DetalharProducao from "./pages/DetalharProducao"
import VisualizarMinhaProducao from "./pages/VisualizarMinhaProducao"
import FormularioManual from "./pages/formularios/FormularioManual"
import SelecionarMetodo from "./pages/SelecionarMetodo"
import BuscarBase from "./pages/BuscarBase"
import MinhasProducoes from "./pages/MinhasProducoes"
import RevisaoDuploCego from "./pages/RevisaoDuploCego"
import Revisao from "./pages/FormRevisao"
import Ajuda from "./pages/Ajuda"
import Profile from "./pages/Profile"
import AprovacaoContas from "./pages/AprovacaoContas"
import Ranking from "./pages/Ranking"

// --- NOVAS PÁGINAS DO FÓRUM E ADMIN ---
import Forum from "./pages/Forum/Forum"
import TopicoDetalhe from "./pages/Forum/TopicoDetalhe"
import Admin from "./pages/Admin"
import CentralAdmin from "./pages/CentralAdmin"
import GamificacaoAdmin from "./pages/GamificacaoAdmin"
import DiarioOperacoes from "./pages/DiarioOperacoes"
import DiarioDetalhes from "./pages/DiarioDetalhes"
import ConfiguracoesGerais from "./pages/ConfiguracoesGerais"

// --- PÁGINA DE EDIÇÃO ---
import EditarProducao from "./EditarProducao"

// --- COMPONENTE DE PROTEÇÃO ---
import PrivateRoute from "./components/PrivateRoute"

function App() {
  return (
    <Router>
      <Routes>
        {/* === ROTAS PÚBLICAS === */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* === ROTAS LEGAIS AQUI === */}
        <Route path="/termos" element={<TermosDeUso />} />
        <Route path="/privacidade" element={<PoliticaDePrivacidade />} />

        <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
        <Route path="/reset-password/:uid/:token" element={<NovaSenha />} />

        {/* === ROTAS PRIVADAS (Só acessa com login) === */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<MainContent />} />
            <Route path="producao/:id" element={<DetalharProducao />} />
            <Route path="minha-producao/:id" element={<VisualizarMinhaProducao />} />
            <Route path="catalogar" element={<SelecionarMetodo />} />
            <Route path="catalogar/base" element={<BuscarBase />} />
            <Route path="catalogar/manual" element={<FormularioManual />} />
            <Route path="minhas-producoes" element={<MinhasProducoes />} />
            <Route path="revisao" element={<RevisaoDuploCego />} />
            <Route path="revisao/:id" element={<Revisao />} />
            <Route path="ajuda" element={<Ajuda />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="forum" element={<Forum />} />
            <Route path="forum/:id" element={<TopicoDetalhe />} />
            <Route path="editar-producao/:id" element={<EditarProducao />} />

            <Route path="central-admin" element={<CentralAdmin />} />
            <Route path="aprovacoes" element={<AprovacaoContas />} />
            <Route path="admin" element={<Admin />} />
            <Route path="admin/gamificacao" element={<GamificacaoAdmin />} />
            <Route path="admin/diario" element={<DiarioOperacoes />} />
            <Route path="admin/diario/:id" element={<DiarioDetalhes />} />
            <Route path="admin/configuracoes" element={<ConfiguracoesGerais />} />
          </Route>

          <Route path="/perfil" element={<Profile />} />
        </Route>

        {/* Rota de fallback (Erro 404) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App