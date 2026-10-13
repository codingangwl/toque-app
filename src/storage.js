export const STORAGE_KEY = 'review-alert:estados';

const VALID_STATUSES = ['revisada', 'reportada', 'respondida'];

// In-memory copy used when localStorage is blocked or full (private mode, disabled site data).
let fallback = null;

function readAll() {
  if (fallback) return fallback;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error instanceof SyntaxError) return {}; // corrupted data: start over, it gets overwritten on the next save
    fallback = {};
    return fallback;
  }
}

function writeAll(all) {
  if (!fallback) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return;
    } catch {
      // fall through to memory
    }
  }
  fallback = all;
}

export const isPersistent = () => fallback === null;

/** @returns {{ estado: string, fingerprint?: string, fecha?: string } | null} */
export function getRecord(id) {
  const value = readAll()[id];
  // Older versions stored just the status string.
  const record = typeof value === 'string' ? { estado: value } : value;
  return record && VALID_STATUSES.includes(record.estado) ? record : null;
}

/** Pass null to send the review back to "pendiente". */
export function setRecord(id, record) {
  const all = readAll();
  if (record) all[id] = record;
  else delete all[id];
  writeAll(all);
}
