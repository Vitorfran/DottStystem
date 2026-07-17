import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home.tsx";
import About from "../pages/About.tsx";
import Login from "../pages/login.tsx"; // 1. Importado aqui
import Dashboard from "../pages/Dashboard_cliente.tsx";

export function AppRoutes(){
    return(
      <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} /> 
            <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
    )
}

export default AppRoutes;
