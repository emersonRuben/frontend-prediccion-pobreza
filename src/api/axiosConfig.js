import axios from 'axios';

// En desarrollo (Vite), usamos rutas relativas para aprovechar el proxy de vite.config.js
// En producción, usamos la variable VITE_API_URL.
const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'Error de red desconocido';
    // Reject con un Error nativo que contiene el mensaje final
    return Promise.reject(new Error(message));
  }
);

export default api;
