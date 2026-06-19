import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home.tsx";
import Contact from "../pages/Contact.tsx";
import About from "../pages/About.tsx";


export function AppRoutes(){

    return(
      <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
        </Routes>
    )
}

export default AppRoutes;