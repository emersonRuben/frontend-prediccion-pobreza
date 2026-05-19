/**
 * Servicio de API — ENAHO ML Backend
 *
 * Mapea todos los endpoints documentados en frontend_api_guide.md.
 *
 * Estrategia de base URL:
 *  - En DESARROLLO (Vite dev server): se usan rutas RELATIVAS ('', '/api')
 *    para que el proxy de Vite intercepte las peticiones y las reenvíe al
 *    backend en localhost:8000, evitando errores de CORS.
 *  - En PRODUCCIÓN: se respeta VITE_API_URL si apunta a un host externo
 *    (p.ej. "https://mi-api.render.com"). En ese caso el servidor debe
 *    tener configurado CORS correctamente.
 */
import axios from 'axios';

// ─── Base URL ──────────────────────────────────────────────────────────────────
// Si estamos en modo DESARROLLO (Vite dev server), forzamos rutas relativas
// para usar el proxy configurado en vite.config.js y evitar problemas de CORS.
// En PRODUCCIÓN, usamos VITE_API_URL si está definida, o por defecto rutas relativas si el frontend se sirve desde el mismo host.
const isDev = import.meta.env.DEV;
const rawEnvUrl = import.meta.env.VITE_API_URL ?? '';

const CORE_BASE = isDev ? '' : rawEnvUrl;
const DASH_BASE = isDev ? '/api' : (rawEnvUrl ? `${rawEnvUrl}/api` : '/api');

// ─── Interceptor de errores compartido ─────────────────────────────────────────
const onResponseError = (error) => {
  const message =
    error.response?.data?.detail ??
    error.response?.data?.message ??
    error.message ??
    'Error de red desconocido';
  return Promise.reject(new Error(message));
};

// ─── Cliente para endpoints CORE (sin prefijo /api) ────────────────────────────
const coreClient = axios.create({
  baseURL: CORE_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});
coreClient.interceptors.response.use((r) => r, onResponseError);

// ─── Cliente para endpoints DASHBOARD (con prefijo /api) ───────────────────────
const dashboardClient = axios.create({
  baseURL: DASH_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});
dashboardClient.interceptors.response.use((r) => r, onResponseError);

// ══════════════════════════════════════════════════════════════════════════════
// API CORE — endpoints sin prefijo /api
// ══════════════════════════════════════════════════════════════════════════════
export const coreApi = {
  /**
   * GET /health
   * Verifica el estado del servidor y si el modelo está cargado.
   * @returns {{ status: string, model_loaded: boolean }}
   */
  getHealth: () => coreClient.get('/health').then((r) => r.data),

  /**
   * GET /model/info
   * Metadatos del modelo: clase, columnas de features, capacidades.
   * @returns {{ model_class: string, supports_predict_proba: boolean, feature_columns: string[] }}
   */
  getModelInfo: () => coreClient.get('/model/info').then((r) => r.data),

  /**
   * POST /predict
   * Predicción binaria usando una matriz numérica (lista de listas).
   * El orden de columnas debe coincidir con feature_columns de /model/info.
   * No acepta null.
   * @param {number[][]} records - Matriz de registros numéricos.
   */
  predict: (records) =>
    coreClient.post('/predict', { records }).then((r) => r.data),

  /**
   * POST /predict/proba
   * Igual que /predict pero devuelve probabilidades.
   * @param {number[][]} records
   */
  predictProba: (records) =>
    coreClient.post('/predict/proba', { records }).then((r) => r.data),

  /**
   * POST /predict/features
   * Predicción usando objetos con columnas nombradas. Acepta null en campos faltantes.
   * @param {Object[]} records - Lista de objetos con las features nombradas.
   */
  predictFeatures: (records) =>
    coreClient.post('/predict/features', { records }).then((r) => r.data),

  /**
   * POST /predict/features/proba
   * Igual que /predict/features pero devuelve probabilidades.
   * @param {Object[]} records
   */
  predictFeaturesProba: (records) =>
    coreClient.post('/predict/features/proba', { records }).then((r) => r.data),

  /**
   * POST /predict/parquet
   * Sube un archivo .parquet (multipart/form-data, campo "file").
   * @param {File} file - Archivo .parquet seleccionado por el usuario.
   */
  predictParquet: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return coreClient
      .post('/predict/parquet', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /**
   * POST /predict/parquet/proba
   * Igual que /predict/parquet pero devuelve probabilidades.
   * @param {File} file
   */
  predictParquetProba: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return coreClient
      .post('/predict/parquet/proba', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /**
   * GET /predict/parquet/default
   * Ejecuta predicción sobre el panel procesado por defecto del servidor.
   */
  predictParquetDefault: () =>
    coreClient.get('/predict/parquet/default').then((r) => r.data),

  /**
   * GET /predict/parquet/default/proba
   * Igual que el anterior pero devuelve probabilidades.
   */
  predictParquetDefaultProba: () =>
    coreClient.get('/predict/parquet/default/proba').then((r) => r.data),
};

// ══════════════════════════════════════════════════════════════════════════════
// API DASHBOARD — endpoints con prefijo /api
// ══════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  /**
   * GET /api/health
   * Estado del servidor, modelo y panel cargado.
   * @returns {{ status: string, modelo_cargado: boolean, panel_cargado: boolean, n_registros_panel: number }}
   */
  getHealth: () => dashboardClient.get('/health').then((r) => r.data),

  /**
   * GET /api/modelo/info
   * Metadatos del modelo: umbrales, métricas de desempeño, etc.
   */
  getModeloInfo: () => dashboardClient.get('/modelo/info').then((r) => r.data),

  /**
   * GET /api/anios
   * Años disponibles en el panel de datos.
   * @returns {{ anios: number[] }}
   */
  getAnios: () => dashboardClient.get('/anios').then((r) => r.data),

  /**
   * GET /api/resumen/{anio}
   * KPIs nacionales para el año indicado.
   * @param {number} anio
   */
  getResumen: (anio) =>
    dashboardClient.get(`/resumen/${anio}`).then((r) => r.data),

  /**
   * GET /api/regional/{anio}?top_n=25
   * Tasa de pobreza por departamento para el año indicado.
   * @param {number} anio
   * @param {number} [topN=25]
   */
  getRegional: (anio, topN = 25) =>
    dashboardClient
      .get(`/regional/${anio}`, { params: { top_n: topN } })
      .then((r) => r.data),

  /**
   * GET /api/tendencia/nacional
   * Serie temporal de pobreza total y extrema.
   */
  getTendenciaNacional: () =>
    dashboardClient.get('/tendencia/nacional').then((r) => r.data),

  /**
   * GET /api/tendencia/area
   * Serie temporal por área (urbana / rural / total).
   */
  getTendenciaArea: () =>
    dashboardClient.get('/tendencia/area').then((r) => r.data),

  /**
   * GET /api/tendencia/poblacion
   * Serie temporal de población por condición de pobreza.
   */
  getTendenciaPoblacion: () =>
    dashboardClient.get('/tendencia/poblacion').then((r) => r.data),

  /**
   * GET /api/tendencia/regional/{departamento_id}
   * Serie temporal de pobreza de una región específica.
   * @param {number} departamentoId - ID numérico del departamento (1-25).
   */
  getTendenciaRegional: (departamentoId) =>
    dashboardClient
      .get(`/tendencia/regional/${departamentoId}`)
      .then((r) => r.data),

  /**
   * POST /api/predict
   * Predicción individual con umbral_tipo configurable.
   * umbral_tipo acepta: "umbral" | "umbral_f1" | "umbral_r80"
   * @param {Object[]} observaciones - Lista de observaciones con features nombradas.
   * @param {"umbral"|"umbral_f1"|"umbral_r80"} [umbralTipo="umbral_f1"]
   */
  predict: (observaciones, umbralTipo = 'umbral_f1') =>
    dashboardClient
      .post('/predict', { observaciones, umbral_tipo: umbralTipo })
      .then((r) => r.data),
};
