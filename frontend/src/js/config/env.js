/**
 * Environment config
 * Replace values per environment (dev / staging / prod)
 */
const ENV = {
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:8000/api",   // update for prod
  APP_NAME:     "Akrasia",
  VERSION:      "1.0.0",
};

export default ENV;
