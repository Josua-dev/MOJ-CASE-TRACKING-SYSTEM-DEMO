/**
 * API setup — CSRF token handling via axios interceptor
 *
 * Pre-fetches the CSRF token when the app boots, then automatically attaches
 * it as the x-csrf-token header on all POST/PUT/DELETE/PATCH requests.
 * If a request fires before the token arrives, the response interceptor
 * retries it once the token is available.
 */
import axios from 'axios';

let csrfToken = null;
let csrfPromise = null;

/**
 * Fetch a fresh CSRF token from the server (cached after first call)
 */
function fetchCsrfToken() {
  if (csrfPromise) return csrfPromise;
  csrfPromise = axios.get('/api/csrf-token')
    .then(({ data }) => {
      csrfToken = data?.data?.csrfToken || null;
      return csrfToken;
    })
    .catch(() => {
      // CSRF not available — allow requests to proceed (they may fail if the
      // server enforces CSRF, but some environments disable it, e.g. tests).
      csrfToken = null;
      return null;
    });
  return csrfPromise;
}

// Eagerly pre-fetch the token as soon as this module loads
fetchCsrfToken();

// Axios request interceptor: attach CSRF token to mutating requests
axios.interceptors.request.use((config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
    // If token isn't ready yet, the response interceptor will catch the 403 and retry
  }
  return config;
}, null);

// Axios response interceptor: if a request fails due to CSRF, fetch a new token and retry once
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (config && !config._csrfRetry && error.response?.status === 403 &&
        error.response?.data?.code === 'CSRF_MISSING') {
      config._csrfRetry = true;
      try {
        const { data } = await axios.get('/api/csrf-token');
        const token = data?.data?.csrfToken;
        if (token) {
          csrfToken = token;
          config.headers['x-csrf-token'] = token;
          return axios(config);
        }
      } catch {} // swallow — let the original error propagate
    }
    return Promise.reject(error);
  }
);

export { fetchCsrfToken };
