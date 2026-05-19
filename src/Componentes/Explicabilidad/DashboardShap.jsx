import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

// Datos de prueba basados en un shap_beeswarm/waterfall típico
const shapData = [
  { feature: 'Educación Superior', impact: 0.15 },
  { feature: 'Ingreso Per Cápita', impact: -0.22 },
  { feature: 'Hacinamiento', impact: 0.12 },
  { feature: 'Servicios Básicos', impact: -0.09 },
  { feature: 'Calidad de Vivienda', impact: 0.07 }
];

// Datos comparativos Pre/Post COVID
const covidData = [
  { feature: 'Ingreso', preCovid: 0.18, postCovid: 0.28 },
  { feature: 'Empleo Informal', preCovid: 0.12, postCovid: 0.22 },
  { feature: 'Hacinamiento', preCovid: 0.09, postCovid: 0.16 },
  { feature: 'Salud', preCovid: 0.05, postCovid: 0.15 }
];

const DashboardShap = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div>
        <h1 className="gradient-text">Explicabilidad del Modelo (SHAP)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Análisis de la influencia de cada variable en las predicciones.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Impacto Global de Variables</h3>

          {/* Leyenda Personalizada al Estilo Apple */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF3B30, #FF453A)', boxShadow: '0 2px 4px rgba(255, 59, 48, 0.3)' }}></div>
              <span>Aumenta Prob. de Pobreza</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #32D74B, #34C759)', boxShadow: '0 2px 4px rgba(50, 215, 75, 0.3)' }}></div>
              <span>Reduce Prob. de Pobreza</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }} barSize={32}>
              <defs>
                <linearGradient id="colorPos" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#FF453A" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="colorNeg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#32D74B" stopOpacity={1} />
                  <stop offset="100%" stopColor="#34C759" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              {/* Marco y grilla sutiles */}
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={true} vertical={true} opacity={0.4} />

              <XAxis type="number" stroke="var(--text-secondary)" tickLine={false} axisLine={{ stroke: 'var(--glass-border)', strokeWidth: 1 }} />
              <YAxis dataKey="feature" type="category" stroke="var(--text-primary)" width={140} tickLine={false} axisLine={{ stroke: 'var(--glass-border)', strokeWidth: 1 }} fontWeight={500} />

              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '16px', color: '#000', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                itemStyle={{ color: '#000', fontWeight: 600 }}
              />

              {/* Línea de origen (0) fundamental para SHAP */}
              <ReferenceLine x={0} stroke="rgba(0,0,0,0.2)" strokeWidth={2} strokeDasharray="3 3" />

              <Bar dataKey="impact" radius={[16, 16, 16, 16]}>
                {
                  shapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.impact > 0 ? 'url(#colorPos)' : 'url(#colorNeg)'} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Análisis Pre y Post COVID</h3>

          {/* Leyenda Personalizada para COVID */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8E8E93' }}></div>
              <span>Pre-COVID (2019)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF9500, #FF9F0A)', boxShadow: '0 2px 4px rgba(255, 149, 0, 0.3)' }}></div>
              <span>Post-COVID (2022+)</span>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            La pandemia incrementó severamente el impacto predictivo de la informalidad y la salud sobre la tasa de pobreza regional.
          </p>

          <div style={{ flex: 1, minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={covidData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                <defs>
                  <linearGradient id="colorPost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF9500" stopOpacity={1} />
                    <stop offset="100%" stopColor="#FF9F0A" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} opacity={0.4} />
                <XAxis dataKey="feature" stroke="var(--text-secondary)" tickLine={false} axisLine={{ stroke: 'var(--glass-border)' }} tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '16px', color: '#000', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: '#000', fontWeight: 600 }}
                />
                <Bar dataKey="preCovid" name="Pre-COVID" fill="#8E8E93" radius={[8, 8, 0, 0]} barSize={24} />
                <Bar dataKey="postCovid" name="Post-COVID" fill="url(#colorPost)" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardShap;
