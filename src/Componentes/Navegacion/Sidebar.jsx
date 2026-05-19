import React from 'react';
import { Home, Map, BarChart2, Upload, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={22} strokeWidth={1.5} /> },
    { name: 'Mapas', path: '/mapas', icon: <Map size={22} strokeWidth={1.5} /> },
    { name: 'Explicabilidad', path: '/shap', icon: <BarChart2 size={22} strokeWidth={1.5} /> },
    { name: 'Cargar Datos', path: '/carga', icon: <Upload size={22} strokeWidth={1.5} /> },
  ];

  return (
    <aside className="glass-panel" style={{ width: '250px', height: 'calc(100vh - 3rem)', position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ padding: '0 1rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 10px var(--accent-color)' }}></div>
          Pobreza2026
        </h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.name} to={item.path} className={`ios-menu-item ${isActive ? 'active' : ''}`} style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              <div className="ios-icon-box">
                {React.cloneElement(item.icon, { color: isActive ? '#fff' : 'var(--accent-color)' })}
              </div>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <Settings size={22} strokeWidth={1.5} />
          <span>Configuración</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
