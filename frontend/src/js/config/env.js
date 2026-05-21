/**
 * Environment config
 * Vite exposes variables prefixed with VITE_ via import.meta.env.
 * Define VITE_API_BASE_URL in frontend/.env (never commit that file).
 */
const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  APP_NAME:     "Akrasia",
  VERSION:      "1.0.0",
};

export default ENV;
