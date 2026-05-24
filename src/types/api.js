/**
 * @typedef {Object} HouseholdRecord
 * @property {number} ANIO
 * @property {number} DEPARTAMENTO
 * @property {number|null} [AREA]
 * @property {number|null} [ESTRATO]
 * @property {number|null} [MIEPERHO]
 * // Las llaves adicionales están permitidas
 */

/**
 * @typedef {Object} PredictFeaturesRequest
 * @property {HouseholdRecord[]} records
 */

/**
 * @typedef {Object} ThresholdInfo
 * @property {number} umbral_global
 * @property {number} test_year
 * @property {number} test_households
 * @property {number} tasa_real_pct
 * @property {number} tasa_predicha_pct
 */

/**
 * @typedef {Object} PredictionItem
 * @property {number} prediction
 * @property {number} umbral_global
 */

/**
 * @typedef {Object} PredictResponse
 * @property {PredictionItem[]} predictions
 * @property {ThresholdInfo} threshold_info
 */

/**
 * @typedef {Object} PredictProbaResponse
 * @property {number[][]} probabilities
 * @property {ThresholdInfo} threshold_info
 */

export {};
