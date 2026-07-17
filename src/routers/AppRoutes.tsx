import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home.tsx";
import About from "../pages/About.tsx";
import Login from "../pages/login.tsx"; 
import Dashboard from "../pages/Dashboard_cliente.tsx";
import CriarProjeto from "../pages/CriarProjeto.tsx";
import AdminDashboard from "../pages/AdminDashboard.tsx";
import Cadastro from "../pages/Cadastro.tsx";

export function AppRoutes(){
    return(
      <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} /> 
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/criar-projeto" element={<CriarProjeto />} />
            <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
    )
}

export default AppRoutes;

