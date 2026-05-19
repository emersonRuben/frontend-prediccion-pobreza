import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './Componentes/Navegacion/Sidebar';
import Header from './Componentes/Navegacion/Header';
// Componentes placeholder para las rutas
import Dashboard from './Componentes/Dashboard/Dashboard';
import Mapas from './Componentes/Mapas/MapaPobrezaRegional';
import Explicabilidad from './Componentes/Explicabilidad/DashboardShap';
import CargaDatos from './Componentes/CargaDatos/CargaDatos';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ padding: '1.5rem', gap: '1.5rem' }}>
        <Sidebar />
        <div className="main-content" style={{ padding: 0 }}>
          <Header />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/mapas" element={<Mapas />} />
              <Route path="/shap" element={<Explicabilidad />} />
              <Route path="/carga" element={<CargaDatos />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
