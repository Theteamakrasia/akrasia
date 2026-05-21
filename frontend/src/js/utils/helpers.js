/** Clamp a number between min and max */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Debounce a function */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

/** Format a date to locale string */
export const formatDate = (date, locale = "en-US") =>
  new Date(date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });

/** Capitalize the first letter */
export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/** Generate a simple unique id */
export const uid = () => Math.random().toString(36).slice(2, 9);
