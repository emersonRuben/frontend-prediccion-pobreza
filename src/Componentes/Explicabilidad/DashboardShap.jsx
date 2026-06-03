import React from 'react';
import ShapBeeswarm from './ShapBeeswarm';
import CovidImpactChart from './CovidImpactChart';

const DashboardShap = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div>
        <h1 className="gradient-text">Explicabilidad del Modelo (SHAP)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Análisis de la influencia de cada variable en las predicciones.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* ── Panel 1: SHAP Beeswarm ──────────────────────────────── */}
        <ShapBeeswarm />

        {/* ── Panel 2: Pre vs Post COVID ──────────────────────────── */}
        <CovidImpactChart />
      </div>
    </div>
  );
};

export default DashboardShap;
