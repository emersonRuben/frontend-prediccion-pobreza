import React, { useRef, useEffect, useMemo, useState } from 'react';

// ══════════════════════════════════════════════════════════════════════════════
// BEESWARM DATA — distribuciones SHAP por feature (simuladas a partir de imagen)
// Cada feature tiene: range [min, max] de SHAP values, y dirección de color
// ══════════════════════════════════════════════════════════════════════════════
const beeswarmFeatures = [
  { name: 'Alquiler mensual imputado (S/.)',         shapRange: [-4.5, 0.8],  spread: 1.2,  colorDir: 'neg',  density: 180 },
  { name: 'Miembros del hogar (Solo familia)',       shapRange: [-1.0, 2.8],  spread: 0.9,  colorDir: 'pos',  density: 160 },
  { name: '% Ocupados',                              shapRange: [-0.5, 1.8],  spread: 0.7,  colorDir: 'pos',  density: 140 },
  { name: 'Hogar tiene: Conexión a Internet',        shapRange: [-1.2, 0.3],  spread: 0.5,  colorDir: 'neg',  density: 120 },
  { name: 'Año',                                     shapRange: [-0.5, 1.5],  spread: 0.6,  colorDir: 'pos',  density: 130 },
  { name: 'Educación Promedio',                       shapRange: [-2.0, 0.8],  spread: 0.8,  colorDir: 'neg',  density: 130 },
  { name: 'Dominio Geográfico',                      shapRange: [-1.5, 1.5],  spread: 0.6,  colorDir: 'mix',  density: 110 },
  { name: 'Tiene seguro de salud',                   shapRange: [-0.8, 0.5],  spread: 0.4,  colorDir: 'neg',  density: 100 },
  { name: 'Hogar tiene: TV cable/satelital',         shapRange: [-0.5, 1.0],  spread: 0.5,  colorDir: 'pos',  density: 100 },
  { name: 'Departamento (Codificado/Frecuencia)',    shapRange: [-0.8, 0.8],  spread: 0.5,  colorDir: 'mix',  density: 100 },
  { name: 'Dummy: Desagüe Red Pública (0/1)',        shapRange: [-0.3, 0.8],  spread: 0.4,  colorDir: 'pos',  density: 90 },
  { name: 'Tasa Informalidad',                       shapRange: [-0.5, 0.6],  spread: 0.35, colorDir: 'mix',  density: 90 },
  { name: 'Estrato Geográfico',                     shapRange: [-0.4, 0.6],  spread: 0.35, colorDir: 'mix',  density: 85 },
  { name: 'Área/Dominio (Frecuencia)',               shapRange: [-0.4, 0.5],  spread: 0.35, colorDir: 'mix',  density: 85 },
  { name: 'Total Miembros (Incl. trab. domésticos)',shapRange: [-0.2, 0.5],  spread: 0.3,  colorDir: 'pos',  density: 80 },
];

// ══════════════════════════════════════════════════════════════════════════════
// BEESWARM — Componente Canvas con gradiente de color
// ══════════════════════════════════════════════════════════════════════════════

/** Pseudo-random determinista */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Interpola color entre azul (0) → magenta (0.5) → rojo (1) */
function featureValueColor(t) {
  // t: 0=Low (blue) → 1=High (red), 0.5 = magenta
  const r = Math.round(t < 0.5 ? t * 2 * 180 : 180 + (t - 0.5) * 2 * 75);
  const g = Math.round(t < 0.5 ? 60 - t * 2 * 60 : 0);
  const b = Math.round(t < 0.5 ? 220 : 220 - (t - 0.5) * 2 * 220);
  return `rgb(${r},${g},${b})`;
}

function generateBeeswarmPoints(feature, seed) {
  const rng = seededRandom(seed);
  const points = [];
  const { shapRange, spread, colorDir, density } = feature;
  const [sMin, sMax] = shapRange;
  const center = (sMin + sMax) / 2;

  for (let i = 0; i < density; i++) {
    // Generate SHAP value with concentration near 0
    let u = rng();
    // Use a beta-like distribution concentrated near 0
    let shapVal;
    if (rng() < 0.6) {
      // Most points near 0
      shapVal = (rng() - 0.5) * spread * 0.5;
    } else {
      // Some spread out
      shapVal = sMin + rng() * (sMax - sMin);
    }
    shapVal = Math.max(sMin, Math.min(sMax, shapVal));

    // Feature value determines color
    let featureVal;
    if (colorDir === 'neg') {
      // High feature value → negative SHAP (reduces prediction)
      featureVal = 1 - ((shapVal - sMin) / (sMax - sMin));
    } else if (colorDir === 'pos') {
      // High feature value → positive SHAP (increases prediction)
      featureVal = (shapVal - sMin) / (sMax - sMin);
    } else {
      // Mixed
      featureVal = rng();
    }
    featureVal = Math.max(0, Math.min(1, featureVal + (rng() - 0.5) * 0.15));

    // Y jitter for beeswarm effect
    const yJitter = (rng() - 0.5) * 0.35;

    points.push({ shap: shapVal, color: featureVal, yOffset: yJitter });
  }
  return points;
}

const ShapBeeswarm = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const pointsData = useMemo(() => {
    return beeswarmFeatures.map((f, i) => ({
      ...f,
      points: generateBeeswarmPoints(f, (i + 1) * 12345),
    }));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const W = dimensions.width;
    const H = dimensions.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Layout
    const marginLeft = Math.max(220, Math.min(280, W * 0.35));
    const marginRight = 70;
    const marginTop = 40;
    const marginBottom = 50;
    const plotW = W - marginLeft - marginRight;
    const plotH = H - marginTop - marginBottom;
    const nFeatures = pointsData.length;
    const rowH = plotH / nFeatures;

    // Find global SHAP range
    let globalMin = Infinity, globalMax = -Infinity;
    pointsData.forEach(f => {
      if (f.shapRange[0] < globalMin) globalMin = f.shapRange[0];
      if (f.shapRange[1] > globalMax) globalMax = f.shapRange[1];
    });
    const pad = 0.3;
    globalMin -= pad;
    globalMax += pad;

    const mapX = (v) => marginLeft + ((v - globalMin) / (globalMax - globalMin)) * plotW;
    const mapY = (featureIdx, yOff) => marginTop + featureIdx * rowH + rowH / 2 + yOff * rowH * 0.45;

    // Background grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    const xTicks = [-4, -2, 0, 2];
    xTicks.forEach(v => {
      if (v >= globalMin && v <= globalMax) {
        const x = mapX(v);
        ctx.beginPath();
        ctx.moveTo(x, marginTop);
        ctx.lineTo(x, marginTop + plotH);
        ctx.stroke();
      }
    });

    // Zero line
    const zeroX = mapX(0);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(zeroX, marginTop - 5);
    ctx.lineTo(zeroX, marginTop + plotH + 5);
    ctx.stroke();

    // Feature labels (left)
    ctx.fillStyle = '#1C1C1E';
    ctx.font = `500 ${Math.max(10, Math.min(12, rowH * 0.4))}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    pointsData.forEach((f, i) => {
      const y = mapY(i, 0);
      ctx.fillText(f.name, marginLeft - 10, y);
    });

    // Draw points
    pointsData.forEach((f, i) => {
      f.points.forEach(p => {
        const x = mapX(p.shap);
        const y = mapY(i, p.yOffset);
        const r = Math.max(1.5, Math.min(2.8, rowH * 0.07));
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = featureValueColor(p.color);
        ctx.globalAlpha = 0.75;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    });

    // X axis labels
    ctx.fillStyle = '#8E8E93';
    ctx.font = '400 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    xTicks.forEach(v => {
      if (v >= globalMin && v <= globalMax) {
        ctx.fillText(v.toString(), mapX(v), marginTop + plotH + 8);
      }
    });
    ctx.fillStyle = '#8E8E93';
    ctx.font = '400 12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHAP value (impact on model output)', marginLeft + plotW / 2, H - 10);

    // Color bar (right side)
    const barX = W - 50;
    const barY = marginTop + 10;
    const barW = 14;
    const barH = plotH - 20;
    const grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
    grad.addColorStop(0, featureValueColor(1));   // High = red
    grad.addColorStop(0.5, featureValueColor(0.5)); // magenta
    grad.addColorStop(1, featureValueColor(0));   // Low = blue
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 7);
    ctx.fill();

    // Color bar labels
    ctx.fillStyle = '#FF3B30';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('High', barX + barW + 5, barY + 12);
    ctx.fillStyle = '#007AFF';
    ctx.textBaseline = 'top';
    ctx.fillText('Low', barX + barW + 5, barY + barH - 8);

    // Feature value label (rotated)
    ctx.save();
    ctx.fillStyle = '#8E8E93';
    ctx.font = '500 11px -apple-system, sans-serif';
    ctx.translate(barX + barW + 8, barY + barH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Feature value', 0, 10);
    ctx.restore();

    // Title
    ctx.fillStyle = '#1C1C1E';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('SHAP Beeswarm — Importancia Global', marginLeft + plotW / 2, 8);

  }, [dimensions, pointsData]);

  return (
    <div className="glass-panel" style={{ flex: 1.15, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: '450px' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
      </div>
    </div>
  );
};

export default ShapBeeswarm;
