/** Email validation */
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Minimum length check */
export const minLength = (str, min) => str.trim().length >= min;

/** URL validation */
export const isValidUrl = (url) => {
  try { new URL(url); return true; } catch { return false; }
};

/** Phone (basic international) */
export const isValidPhone = (phone) => /^\+?[\d\s\-().]{7,15}$/.test(phone);
