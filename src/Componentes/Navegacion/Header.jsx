import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', marginBottom: '1.5rem' }}>
      <div style={{ position: 'relative', width: '300px' }}>
        <Search size={18} strokeWidth={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Buscar regiones, métricas..." 
          style={{ 
            width: '100%', 
            padding: '0.8rem 1rem 0.8rem 2.5rem', 
            borderRadius: 'var(--border-radius-lg)', 
            background: 'rgba(255, 255, 255, 0.4)', 
            border: '1px solid var(--glass-border)', 
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'var(--transition-smooth)'
          }} 
          onFocus={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.6)'}
          onBlur={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.4)'}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={22} strokeWidth={1.5} color="var(--text-secondary)" />
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--danger-color)', borderRadius: '50%' }}></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-pill)', cursor: 'pointer' }}>
          <User size={20} strokeWidth={1.5} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Admin ENAHO</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
