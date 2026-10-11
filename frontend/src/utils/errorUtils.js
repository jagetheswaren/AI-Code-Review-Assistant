export function getErrorMessage(error, fallback = 'Something went wrong.', seen = new Set()) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object') {
    if (seen.has(error)) return fallback;
    seen.add(error);

    for (const key of ['message', 'error', 'detail']) {
      if (typeof error[key] === 'string' && error[key].trim()) return error[key];
    }

    if (error.response?.data) return getErrorMessage(error.response.data, fallback, seen);
    if (error.data) return getErrorMessage(error.data, fallback, seen);

    try {
      return JSON.stringify(error) || fallback;
    } catch {
      return fallback;
    }
  }

  return String(error);
}

export function normalizeError(error, fallback = 'Something went wrong.') {
  return { message: getErrorMessage(error, fallback), raw: error };
}