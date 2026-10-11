import { getErrorMessage, normalizeError } from './errorUtils';

test('extracts readable API error messages from nested response data', () => {
  expect(getErrorMessage({ response: { data: { error: 'GitHub not connected' } } })).toBe('GitHub not connected');
});

test('serializes unknown objects and safely handles circular values', () => {
  expect(getErrorMessage({ code: 'E_API' })).toBe('{"code":"E_API"}');

  const circular = {};
  circular.self = circular;
  expect(getErrorMessage(circular, 'Request failed')).toBe('Request failed');
});

test('normalizes errors while retaining the original value', () => {
  const raw = { detail: 'AI unavailable' };
  expect(normalizeError(raw)).toEqual({ message: 'AI unavailable', raw });
});