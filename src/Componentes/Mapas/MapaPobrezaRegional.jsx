import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as topojson from "topojson-client";
import { Calendar, Minus, Plus, Loader2, AlertCircle } from "lucide-react";
import { dashboardApi } from "../../api/services";

// ─── Mapeo: ID numérico INEI → nombre de departamento (NOMBDEP en el GeoJSON) ──
const DEPT_ID_A_NOMBRE = {
  1: "AMAZONAS",
  2: "ANCASH",
  3: "APURIMAC",
  4: "AREQUIPA",
  5: "AYACUCHO",
  6: "CAJAMARCA",
  7: "CALLAO",
  8: "CUSCO",
  9: "HUANCAVELICA",
  10: "HUANUCO",
  11: "ICA",
  12: "JUNIN",
  13: "LA LIBERTAD",
  14: "LAMBAYEQUE",
  15: "LIMA",
  16: "LORETO",
  17: "MADRE DE DIOS",
  18: "MOQUEGUA",
  19: "PASCO",
  20: "PIURA",
  21: "PUNO",
  22: "SAN MARTIN",
  23: "TACNA",
  24: "TUMBES",
  25: "UCAYALI",
};

const DEPT_NAME_ALIASES = {
  "LIMA PROVINCIAS": "LIMA",
  "LIMA METROPOLITANA": "LIMA",
};

const normalizeDeptName = (value) =>
  DEPT_NAME_ALIASES[
    String(value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toUpperCase()
      .trim()
  ] ||
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim();

const pickFirst = (obj, keys) => {
  for (const key of keys) {
    if (obj?.[key] != null) return obj[key];
  }
  return null;
};

const parseTasa = (value) => {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/%/g, "").trim();
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeTasaPercent = (value) => {
  const parsed = parseTasa(value);
  if (parsed == null) return null;
  if (parsed >= 0 && parsed <= 1) return parsed * 100;
  return parsed;
};

// ─── Normaliza la respuesta de /api/regional/{anio} ────────────────────────────
// Crea un Map: nombreDept → tasa_pobreza para búsqueda rápida en el mapa.
const normalizarRegional = (raw) => {
  const rows =
    (Array.isArray(raw) && raw) ||
    raw?.data ||
    raw?.regional ||
    raw?.datos ||
    raw?.regional?.data ||
    raw?.data?.regional ||
    raw?.data?.data ||
    raw?.result ||
    [];
  const lookup = new Map();
  const list = Array.isArray(rows) ? rows : [];
  list.forEach((r) => {
    const tasa = normalizeTasaPercent(
      pickFirst(r, [
        "tasa_pobreza",
        "tasa",
        "pobreza_total",
        "pobreza",
        "tasa_pobreza_total",
        "valor",
        "value",
      ]),
    );
    // El backend puede devolver nombre o ID
    const nombre = pickFirst(r, [
      "departamento_nombre",
      "DEPARTAMENTO_NOMBRE",
      "departamento",
      "NOMBDEP",
      "nombre",
      "name",
    ]);
    if (nombre) {
      lookup.set(normalizeDeptName(nombre), tasa);
      return;
    }
    const deptId = pickFirst(r, [
      "DEPARTAMENTO",
      "departamento_id",
      "departamentoId",
      "id_departamento",
      "id",
      "codigo",
      "code",
    ]);
    if (deptId != null) {
      const nombre = DEPT_ID_A_NOMBRE[Number(deptId)];
      if (nombre) lookup.set(normalizeDeptName(nombre), tasa);
    }
  });
  return lookup;
};

// ─── Escala de color: verde (baja pobreza) → rojo (alta pobreza) ───────────────
const getTasaColor = (tasa) => {
  if (tasa == null) return "#8E8E93"; // gris si no hay dato
  if (tasa < 10) return "#32D74B";
  if (tasa < 20) return "#0A84FF";
  if (tasa < 30) return "#FF9500";
  if (tasa < 40) return "#FF6B00";
  return "#FF3B30";
};

const getTasaLabel = (tasa) => {
  if (tasa == null) return "Sin dato";
  if (tasa < 10) return "Muy baja";
  if (tasa < 20) return "Baja";
  if (tasa < 30) return "Media";
  if (tasa < 40) return "Alta";
  return "Muy alta";
};

// ─── Sub-componente: leyenda de colores ─────────────────────────────────────────
const Leyenda = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      padding: "1rem",
      background: "rgba(255,255,255,0.3)",
      borderRadius: "12px",
      marginTop: "1rem",
      fontSize: "0.8rem",
    }}
  >
    <span
      style={{
        fontWeight: 600,
        marginBottom: "0.3rem",
        color: "var(--text-primary)",
      }}
    >
      Tasa de Pobreza
    </span>
    {[
      { color: "#32D74B", label: "< 10%" },
      { color: "#0A84FF", label: "10% – 20%" },
      { color: "#FF9500", label: "20% – 30%" },
      { color: "#FF6B00", label: "30% – 40%" },
      { color: "#FF3B30", label: "> 40%" },
      { color: "#8E8E93", label: "Sin dato" },
    ].map(({ color, label }) => (
      <div
        key={label}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "4px",
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      </div>
    ))}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
const MapaPobrezaRegional = () => {
  const [geoData, setGeoData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [regionalData, setRegionalData] = useState(new Map());
  const [selectedDept, setSelectedDept] = useState(null);
  const [trendDept, setTrendDept] = useState(null);

  const minYear = 2017;
  const maxYear = 2024;
  const clampYear = (year) => Math.min(maxYear, Math.max(minYear, year));

  // ── Cargar TopoJSON local ────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/topojsonperu.json")
      .then((res) => res.json())
      .then((topology) => {
        const geojson = topojson.feature(
          topology,
          topology.objects.peru_departamental_simple,
        );
        setGeoData(geojson);
      })
      .catch((err) => console.error("Error cargando topojson:", err));
  }, []);

  // ── Cargar años disponibles desde el backend ─────────────────────────────────
  useEffect(() => {
    dashboardApi
      .getAnios()
      .then((resp) => {
        const anios = resp?.anios ?? resp ?? [];
        if (anios.length > 0) {
          setAniosDisponibles(anios);
          // Seleccionar el año más reciente por defecto
          setSelectedYear(clampYear(Math.max(...anios)));
        }
      })
      .catch(() => {
        // Si falla, dejamos el selector libre sin restricciones
        setAniosDisponibles([]);
      });
  }, []);

  // ── Cargar datos regionales al cambiar el año ────────────────────────────────
  useEffect(() => {
    dashboardApi
      .getRegional(selectedYear)
      .then((resp) => setRegionalData(normalizarRegional(resp)))
      .catch(() => setRegionalData(new Map()));
  }, [selectedYear]);

  // ── Cargar tendencia de departamento al seleccionar uno ──────────────────────
  const cargarTendenciaDept = useCallback((deptId) => {
    if (!deptId) return;
    dashboardApi
      .getTendenciaRegional(deptId)
      .then(setTrendDept)
      .catch(() => setTrendDept(null));
  }, []);

  // ── Estilo dinámico de cada feature del GeoJSON ─────────────────────────────
  const getStyle = useCallback(
    (feature) => {
      const nombre = normalizeDeptName(feature?.properties?.NOMBDEP ?? "");
      const tasa = regionalData.get(nombre) ?? null;
      return {
        fillColor: getTasaColor(tasa),
        weight: 1,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7,
      };
    },
    [regionalData],
  );

  // ── Interacción por feature ──────────────────────────────────────────────────
  const onEachFeature = useCallback(
    (feature, layer) => {
      const nombre = feature?.properties?.NOMBDEP ?? "Desconocido";
      const nombUp = normalizeDeptName(nombre);
      const tasa = regionalData.get(nombUp);
      const tasaLabel =
        tasa != null
          ? `${getTasaLabel(tasa)} (${Number(tasa).toFixed(1)}%)`
          : "Sin dato";

      layer.bindTooltip(`<b>${nombre}</b><br/>Pobreza: <b>${tasaLabel}</b>`, {
        direction: "center",
        className: "glass-tooltip",
      });

      layer.on({
        mouseover: (e) => {
          e.target.setStyle({ weight: 3, color: "#fff", fillOpacity: 0.95 });
          e.target.bringToFront();
        },
        mouseout: (e) => {
          e.target.setStyle(getStyle(feature));
        },
        click: () => {
          // Buscar ID de departamento a partir del nombre para la tendencia
          const entry = Object.entries(DEPT_ID_A_NOMBRE).find(
            ([, v]) => normalizeDeptName(v) === nombUp,
          );
          const deptId = entry ? Number(entry[0]) : null;
          setSelectedDept({ nombre, tasa, id: deptId });
          if (deptId) cargarTendenciaDept(deptId);
        },
      });
    },
    [regionalData, getStyle, cargarTendenciaDept],
  );

  const aniosMostrados = aniosDisponibles.filter(
    (anio) => anio >= minYear && anio <= maxYear,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        height: "100%",
      }}
    >
      <div>
        <h1 className="gradient-text">Equidad y Sesgo Regional</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Mapa interactivo con tasas de pobreza predichas por departamento. Haz
          clic en una región para más detalles.
        </p>
      </div>

      {/* Selector de año */}
      <div className="glass-panel" style={{ padding: "1.5rem 2rem" }}>
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
                Año de Análisis
              </span>
              <span
                style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
              >
                {aniosMostrados.length > 0
                  ? `Panel ENAHO: ${aniosMostrados.join(", ")}`
                  : "Cargando años disponibles…"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              className="ios-stepper-btn"
              onClick={() => setSelectedYear((y) => clampYear(y - 1))}
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(clampYear(Number(e.target.value)))
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
              onClick={() => setSelectedYear((y) => clampYear(y + 1))}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal: mapa + panel lateral */}
      <div style={{ display: "flex", gap: "1.5rem", flex: 1 }}>
        {/* Mapa */}
        <div
          className="glass-panel"
          style={{
            flex: 2,
            padding: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {geoData ? (
            <MapContainer
              center={[-9.19, -75.01]}
              zoom={5}
              style={{
                height: "100%",
                width: "100%",
                background: "transparent",
              }}
              key={`${selectedYear}-${regionalData.size}`} // Re-monta el mapa al cambiar año o al cargar datos para re-aplicar estilos
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              <GeoJSON
                data={geoData}
                style={getStyle}
                onEachFeature={onEachFeature}
              />
            </MapContainer>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              <Loader2 size={24} className="spin" /> Cargando mapa…
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div
          className="glass-panel"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h3>Detalle Regional ({selectedYear})</h3>

          {selectedDept ? (
            <div>
              <div
                style={{
                  background: "rgba(255,255,255,0.4)",
                  padding: "1rem",
                  borderRadius: "var(--border-radius-md)",
                  marginBottom: "1rem",
                }}
              >
                <h4
                  style={{
                    color: "var(--text-primary)",
                    textTransform: "capitalize",
                    marginBottom: "0.3rem",
                  }}
                >
                  {selectedDept.nombre}
                </h4>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: "bold",
                    color: getTasaColor(selectedDept.tasa),
                  }}
                >
                  {selectedDept.tasa != null
                    ? `${Number(selectedDept.tasa).toFixed(1)}%`
                    : "Sin dato"}
                </div>
                <span
                  style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}
                >
                  {getTasaLabel(selectedDept.tasa)}
                </span>
                <span
                  style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}
                >
                  Tasa de pobreza estimada
                </span>
              </div>
              {trendDept && (
                <div
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
                >
                  <AlertCircle
                    size={14}
                    style={{ marginRight: "0.3rem", verticalAlign: "middle" }}
                  />
                  Tendencia regional disponible en consola.
                </div>
              )}
              <button
                className="btn-glass"
                style={{ marginTop: "0.5rem", width: "100%" }}
                onClick={() => {
                  setSelectedDept(null);
                  setTrendDept(null);
                }}
              >
                Limpiar selección
              </button>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Haz clic en un departamento del mapa para ver su tasa de pobreza
              detallada.
            </p>
          )}

          {/* Leyenda de colores */}
          <Leyenda />
        </div>
      </div>
    </div>
  );
};

export default MapaPobrezaRegional;
