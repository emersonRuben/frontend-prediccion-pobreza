import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  TrendingUp,
  Calendar,
  Minus,
  Plus,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { dashboardApi } from "../../api/services";

// ─── Normaliza la respuesta de /api/tendencia/nacional ─────────────────────────
// El backend puede devolver { tendencia: [...] } o directamente un array.
const normalizeTendencia = (raw) => {
  const rows = Array.isArray(raw) ? raw : (raw?.tendencia ?? raw?.datos ?? raw?.data ?? []);
  return rows.map((r) => {
    let tasa = r.tasa_total ?? r.tasa_real ?? r.tasa_pobreza ?? r.pobreza_total ?? null;
    if (tasa != null && tasa <= 1.0) tasa = tasa * 100;
    
    let prob = r.prob_media ?? r.tasa_predicha ?? r.prediccion_media ?? null;
    if (prob != null && prob <= 1.0) prob = prob * 100;
    
    return {
      anio: r.anio ?? r.ANIO ?? r.year,
      tasa_real: tasa,
      prob_media: prob,
    };
  });
};

const hasTendenciaData = (rows) =>
  Array.isArray(rows) && rows.some((r) => r?.anio != null);

const extractResumenTasa = (raw) => {
  let tasa = raw?.tasa_pobreza_total ?? raw?.tasa_pobreza ?? raw?.pobreza_total ?? raw?.tasa ?? null;
  if (tasa != null && tasa <= 1.0) tasa = tasa * 100;
  return tasa;
};

// ─── Sub-componente: widget KPI ─────────────────────────────────────────────────
const KPIWidget = ({ title, value, subtitle, icon, color, loading }) => (
  <div
    className="glass-panel"
    style={{ flex: 1, transition: "var(--transition-smooth)" }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "1rem",
      }}
    >
      <div>
        <h4
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h4>
        {loading ? (
          <Loader2
            size={28}
            className="spin"
            style={{ color: "var(--accent-color)" }}
          />
        ) : (
          <h2 style={{ fontSize: "2rem", fontWeight: 700 }}>{value}</h2>
        )}
      </div>
      <div
        className="ios-icon-box"
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: `rgba(${color}, 0.1)`,
          border: "none",
        }}
      >
        {icon}
      </div>
    </div>
    <div
      style={{
        fontSize: "0.85rem",
        color: "var(--success-color)",
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
      }}
    >
      <TrendingUp size={16} />
      {subtitle}
    </div>
  </div>
);

// ─── Sub-componente: banner de error ────────────────────────────────────────────
const ErrorBanner = ({ message, onRetry }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.8rem",
      padding: "0.8rem 1.2rem",
      borderRadius: "12px",
      background: "rgba(255, 59, 48, 0.08)",
      border: "1px solid rgba(255, 59, 48, 0.2)",
      color: "#FF3B30",
      fontSize: "0.85rem",
    }}
  >
    <AlertCircle size={16} />
    <span style={{ flex: 1 }}>{message}</span>
    <button
      onClick={onRetry}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        background: "none",
        border: "none",
        color: "#FF3B30",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      <RefreshCw size={14} /> Reintentar
    </button>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState(2024);

  // ── Estado de datos API ──────────────────────────────────────────────────────
  const [tendencia, setTendencia] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [modeloInfo, setModeloInfo] = useState(null);

  // ── Estado de carga / error ──────────────────────────────────────────────────
  const [loadingTendencia, setLoadingTendencia] = useState(true);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [errorTendencia, setErrorTendencia] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // ── Carga de tendencia nacional y metadatos del modelo ───────────────────────
  useEffect(() => {
    setLoadingTendencia(true);
    setErrorTendencia(null);

    Promise.allSettled([
      dashboardApi.getTendenciaNacional(),
      dashboardApi.getModeloInfo(),
    ]).then(([tendenciaResult, modeloResult]) => {
      if (tendenciaResult.status === "fulfilled") {
        const normalized = normalizeTendencia(tendenciaResult.value);
        if (hasTendenciaData(normalized)) {
          setTendencia(normalized);
        } else {
          setErrorTendencia("No se encontraron datos de tendencia");
        }
      } else {
        setErrorTendencia("No se pudo conectar con el backend");
      }

      if (modeloResult.status === "fulfilled") {
        setModeloInfo(modeloResult.value);
      }

      setLoadingTendencia(false);
    });
  }, [retryCount]);

  // ── Carga del resumen nacional al cambiar el año ─────────────────────────────
  useEffect(() => {
    setLoadingResumen(true);
    dashboardApi
      .getResumen(selectedYear)
      .then((data) => {
        const tasa = extractResumenTasa(data);
        if (tasa != null) {
          setResumen(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingResumen(false));
  }, [selectedYear]);

  // ── Datos del gráfico: usa API si disponible ─────────────────────────────────
  const baseChartData = tendencia ?? [];

  const chartData = useMemo(() => {
    const data = [...baseChartData];
    if (data.length === 0) return data;
    if (selectedYear > (data.at(-1)?.anio ?? 2030)) {
      const lastAnio = data.at(-1)?.anio ?? 2030;
      for (let i = lastAnio + 1; i <= selectedYear; i++) {
        const prevProb = data.at(-1).prob_media;
        data.push({
          anio: i,
          tasa_real: null,
          prob_media: Number(Math.max(2.0, prevProb - 0.5).toFixed(2)),
        });
      }
    }
    return data;
  }, [baseChartData, selectedYear]);

  // ── KPI: tasa de pobreza para el año seleccionado ───────────────────────────
  const tasaKPI = useMemo(() => {
    // Prioridad: resumen del backend → dato del gráfico
    if (resumen) {
      const tasa = extractResumenTasa(resumen);
      if (tasa != null) return Number(tasa).toFixed(1);
    }
    const punto = chartData.find((d) => d.anio === selectedYear);
    if (punto)
      return Number(punto.tasa_real ?? punto.prob_media ?? 0).toFixed(1);
    return "N/D";
  }, [resumen, chartData, selectedYear]);

  // ── KPI: AUC-ROC del modelo ──────────────────────────────────────────────────
  const aucRoc = useMemo(() => {
    if (!modeloInfo) return "0.9039"; // valor hardcoded como respaldo
    return (
      modeloInfo.auc_roc ??
      modeloInfo.metricas?.auc_roc ??
      modeloInfo.metrics?.auc_roc ??
      "0.9039"
    );
  }, [modeloInfo]);

  const isProyeccion = selectedYear > (tendencia?.at(-1)?.anio ?? 2024);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        height: "100%",
      }}
    >
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 className="gradient-text">Dashboard de Monitoreo</h1>
        <button className="btn-primary">Generar Reporte</button>
      </div>

      {/* Banner de error (si el backend no respondió) */}
      {errorTendencia && (
        <ErrorBanner
          message={errorTendencia}
          onRetry={() => setRetryCount((c) => c + 1)}
        />
      )}

      {/* Selector de año */}
      <div
        className="glass-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
          padding: "1.5rem 2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div
              className="ios-icon-box"
              style={{
                background: "rgba(0,122,255,0.1)",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
              }}
            >
              <Calendar size={18} color="#007AFF" />
            </div>
            <div>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  display: "block",
                }}
              >
                Año de Proyección
              </span>
              <span
                style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
              >
                {isProyeccion
                  ? "Proyección extendida"
                  : "Datos del panel ENAHO"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              className="ios-stepper-btn"
              onClick={() => setSelectedYear((y) => Math.max(2017, y - 1))}
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(Math.max(2017, Number(e.target.value)))
              }
              className="ios-input"
              style={{
                width: "80px",
                fontSize: "1.2rem",
                background: "transparent",
              }}
            />
            <button
              className="ios-stepper-btn"
              onClick={() => setSelectedYear((y) => y + 1)}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <KPIWidget
          title="AUC-ROC Modelo"
          value={Number(aucRoc).toFixed(4)}
          subtitle={
            modeloInfo ? "Configuración actual" : "Valor de referencia"
          }
          icon={<Activity size={26} strokeWidth={1.5} color="#007AFF" />}
          color="10, 132, 255"
          loading={false}
        />
        <KPIWidget
          title={`Tasa de Pobreza (${selectedYear})`}
          value={`${tasaKPI}%`}
          subtitle={
            isProyeccion
              ? "Proyección estimada"
              : resumen
                ? "Dato actualizado"
                : "Dato del panel"
          }
          icon={<TrendingUp size={26} strokeWidth={1.5} color="#34C759" />}
          color="50, 215, 75"
          loading={loadingResumen}
        />
      </div>

      {/* Gráfico de evolución */}
      <div className="glass-panel" style={{ flex: 1, minHeight: "400px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h3>
            Evolución y Proyecciones de Pobreza (2017–
            {Math.max(chartData.at(-1)?.anio ?? 2030, selectedYear)})
          </h3>
          {loadingTendencia && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
              }}
            >
              <Loader2 size={16} className="spin" /> Cargando datos…
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#32D74B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#32D74B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="anio" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--glass-border)"
              vertical={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--glass-border)",
                borderRadius: "16px",
                color: "#1C1C1E",
              }}
              itemStyle={{ color: "#1C1C1E" }}
            />
            <ReferenceLine
              x={selectedYear}
              stroke="#FF3B30"
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="tasa_real"
              stroke="#0A84FF"
              fillOpacity={1}
              fill="url(#colorReal)"
              name="Tasa Real"
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="prob_media"
              stroke="#32D74B"
              fillOpacity={1}
              fill="url(#colorProb)"
              name="Tasa Predicha (Media)"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
