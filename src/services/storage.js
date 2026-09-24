// Thin wrapper over localStorage. Every read and write is guarded so the
// prototype keeps working in private windows or when storage is blocked.
const PREFIX = 'gac.';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* storage unavailable */
    }
  },
  clearAll() {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
  },
};

// Per-tab storage, used for the login session so an admin and a customer can be
// signed in side by side in two tabs of the same browser.
export const tabStorage = {
  get(key) {
    try {
      const raw = window.sessionStorage.getItem(PREFIX + key);
      return raw === null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  },
  remove(key) {
    try {
      window.sessionStorage.removeItem(PREFIX + key);
    } catch {
      /* storage unavailable */
    }
  },
};

// Calls `onChange` when another tab changes a stored key that `match` accepts.
export function onStorageChange(match, onChange) {
  const handler = (e) => {
    if (e.key === null || (e.key.startsWith(PREFIX) && match(e.key.slice(PREFIX.length)))) onChange();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

// Simulated network latency so loading states are visible in the prototype.
export const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
