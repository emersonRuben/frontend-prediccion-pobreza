import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ══════════════════════════════════════════════════════════════════════════════
// DATOS REALES — extraídos del notebook 07_explicabilidad_shap
// ══════════════════════════════════════════════════════════════════════════════

// Pre vs Post COVID — importancias |SHAP| medio por período
const covidData = [
  { feature: 'Alquiler mensual imputado (S/.)',  preCovid: 0.92, postCovid: 1.09 },
  { feature: 'Miembros del hogar (Solo familia)',preCovid: 0.76, postCovid: 0.81 },
  { feature: 'Año',                              preCovid: 0.32, postCovid: 0.38 },
  { feature: 'Hogar tiene: Conexión a Internet', preCovid: 0.31, postCovid: 0.38 },
  { feature: 'Dominio Geográfico',               preCovid: 0.28, postCovid: 0.35 },
  { feature: '% Ocupados',                       preCovid: 0.22, postCovid: 0.27 },
  { feature: 'Educación Promedio',                preCovid: 0.30, postCovid: 0.27 },
  { feature: 'Tiene seguro de salud',            preCovid: 0.29, postCovid: 0.25 },
  { feature: 'Hogar tiene: TV cable/satelital',  preCovid: 0.26, postCovid: 0.20 },
  { feature: 'Departamento (Codificado/Frec.)',  preCovid: 0.18, postCovid: 0.19 },
  { feature: 'Dummy: Desagüe Red Pública (0/1)',preCovid: 0.14, postCovid: 0.15 },
  { feature: 'Área/Dominio (Frecuencia)',        preCovid: 0.11, postCovid: 0.13 },
];

// ══════════════════════════════════════════════════════════════════════════════
// TOOLTIP PERSONALIZADO para el gráfico de barras
// ══════════════════════════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(30px) saturate(200%)',
      WebkitBackdropFilter: 'blur(30px) saturate(200%)',
      border: '1px solid rgba(255,255,255,0.8)',
      borderRadius: '16px',
      padding: '0.8rem 1rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      fontSize: '0.85rem',
    }}>
      <p style={{ fontWeight: 600, marginBottom: '0.4rem', color: '#1C1C1E' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 500, margin: '0.15rem 0' }}>
          {p.name}: {p.value.toFixed(3)}
        </p>
      ))}
    </div>
  );
};

const CovidImpactChart = () => {
  return (
    <div className="glass-panel" style={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '0.3rem' }}>Cambio en Importancia de Variables: Pre vs Post COVID</h3>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.8rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#5B9BD5' }}></div>
          <span>Pre-COVID (2017-19)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F4735E' }}></div>
          <span>Post-COVID (2021-23)</span>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.8rem', fontSize: '0.9rem', lineHeight: 1.45 }}>
        La pandemia incrementó el impacto predictivo del alquiler, la conectividad a internet y el dominio geográfico sobre la probabilidad de pobreza.
      </p>

      <div style={{ flex: 1, minHeight: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={covidData}
            margin={{ top: 10, right: 10, left: 60, bottom: 140 }}
            barGap={2}
            barCategoryGap="18%"
          >
            <defs>
              <linearGradient id="gradPre" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B9BD5" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#4A8BC2" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="gradPost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F4735E" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#E85D47" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} opacity={0.4} />
            <XAxis
              dataKey="feature"
              stroke="var(--text-secondary)"
              tickLine={false}
              axisLine={{ stroke: 'var(--glass-border)' }}
              tick={{ fontSize: 10, fontWeight: 500 }}
              angle={-40}
              textAnchor="end"
              interval={0}
              height={90}
            />
            <YAxis
              stroke="var(--text-secondary)"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              width={50}
              label={{
                value: '|SHAP| medio',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 },
                offset: 0,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="preCovid" name="Pre-COVID" fill="url(#gradPre)" radius={[4, 4, 0, 0]} barSize={18} />
            <Bar dataKey="postCovid" name="Post-COVID" fill="url(#gradPost)" radius={[4, 4, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CovidImpactChart;
