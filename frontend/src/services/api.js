/**
 * Base API helper.
 * All requests go through /api (proxied by Vite to http://localhost:8000).
 * Token is read from localStorage on every call so it's always fresh.
 *
 * Throws an Error with the backend's detail message on 4xx/5xx.
 */

const BASE = '/api';

async function request(method, path, body) {
  const token = localStorage.getItem('fs_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null; // No Content

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.detail || `Request failed with status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),
};
