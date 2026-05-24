import { useState } from 'react';
import { coreApi } from '../api/services';

/**
 * @typedef {import('../types/api').HouseholdRecord} HouseholdRecord
 * @typedef {import('../types/api').PredictResponse} PredictResponse
 */

export const usePredict = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * @param {HouseholdRecord} record 
   * @returns {Promise<PredictResponse>}
   */
  const executePrediction = async (record) => {
    setLoading(true);
    setError(null);
    try {
      const data = await coreApi.predictFeatures({ records: [record] });
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado al predecir.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { executePrediction, result, loading, error };
};
