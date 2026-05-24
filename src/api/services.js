import api from './axiosConfig';

/**
 * @typedef {import('../types/api').PredictFeaturesRequest} PredictFeaturesRequest
 * @typedef {import('../types/api').PredictResponse} PredictResponse
 * @typedef {import('../types/api').PredictProbaResponse} PredictProbaResponse
 */

// ══════════════════════════════════════════════════════════════════════════════
// API CORE — endpoints del modelo
// ══════════════════════════════════════════════════════════════════════════════
export const coreApi = {
  getHealth: () => api.get('/health').then((r) => r.data),
  getModelInfo: () => api.get('/model/info').then((r) => r.data),

  /**
   * @param {PredictFeaturesRequest} payload 
   * @returns {Promise<PredictResponse>}
   */
  predictFeatures: (payload) =>
    api.post('/predict/features', payload).then((r) => r.data),

  /**
   * @param {PredictFeaturesRequest} payload 
   * @returns {Promise<PredictProbaResponse>}
   */
  predictFeaturesProba: (payload) =>
    api.post('/predict/features/proba', payload).then((r) => r.data),

  /**
   * @param {File} file 
   * @returns {Promise<PredictResponse>}
   */
  predictParquet: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/predict/parquet', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /**
   * @param {File} file 
   * @returns {Promise<PredictProbaResponse>}
   */
  predictParquetProba: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/predict/parquet/proba', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  predictParquetDefault: () =>
    api.get('/predict/parquet/default').then((r) => r.data),

  predictParquetDefaultProba: () =>
    api.get('/predict/parquet/default/proba').then((r) => r.data),
};

// ══════════════════════════════════════════════════════════════════════════════
// API DASHBOARD — endpoints con prefijo /api
// ══════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  getHealth: () => api.get('/api/health').then((r) => r.data),
  getModeloInfo: () => api.get('/api/modelo/info').then((r) => r.data),
  getAnios: () => api.get('/api/anios').then((r) => r.data),
  getResumen: (anio) => api.get(`/api/resumen/${anio}`).then((r) => r.data),
  getRegional: (anio, topN = 25) =>
    api.get(`/api/regional/${anio}`, { params: { top_n: topN } }).then((r) => r.data),
  getTendenciaNacional: () => api.get('/api/tendencia/nacional').then((r) => r.data),
  getTendenciaArea: () => api.get('/api/tendencia/area').then((r) => r.data),
  getTendenciaPoblacion: () => api.get('/api/tendencia/poblacion').then((r) => r.data),
  getTendenciaRegional: (departamentoId) =>
    api.get(`/api/tendencia/regional/${departamentoId}`).then((r) => r.data),
  predict: (observaciones, umbralTipo = 'umbral_f1') =>
    api.post('/api/predict', { observaciones, umbral_tipo: umbralTipo }).then((r) => r.data),
};
