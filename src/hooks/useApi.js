import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook genérico para consumo de endpoints asíncronos.
 *
 * @param {Function} apiFn   - Función que retorna una Promise (del servicio api.js).
 * @param {Object}   options
 * @param {boolean}  options.immediate - Si es true, ejecuta la llamada al montar. Default: true.
 * @param {Array}    options.deps      - Dependencias que disparan una nueva ejecución (como useEffect).
 *
 * @returns {{ data, loading, error, execute }}
 *   - data:    resultado de la última llamada exitosa.
 *   - loading: true mientras hay una petición en vuelo.
 *   - error:   string con el mensaje de error, o null.
 *   - execute: función para disparar la llamada manualmente (acepta argumentos).
 *
 * @example
 * const { data, loading, error } = useApi(
 *   () => dashboardApi.getTendenciaNacional(),
 *   { immediate: true }
 * );
 */
const useApi = (apiFn, { immediate = true, deps = [] } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // Ref para evitar actualizar estado en componentes desmontados
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFn(...args);
        if (mountedRef.current) setData(result);
        return result;
      } catch (err) {
        if (mountedRef.current) setError(err.message ?? 'Error desconocido');
        return null;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]);

  return { data, loading, error, execute };
};

export default useApi;
