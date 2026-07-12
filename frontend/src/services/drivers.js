import { api } from './api.js';

// GET   /drivers              → DriverOut[]   (FM + Safety Officer)
export const getDrivers            = ()         => api.get('/drivers');

// GET   /drivers/{id}         → DriverOut
export const getDriver             = (id)       => api.get(`/drivers/${id}`);

// POST  /drivers              → DriverOut
export const createDriver          = (body)     => api.post('/drivers', body);

// PATCH /drivers/{id}         → DriverOut
export const updateDriver          = (id, body) => api.patch(`/drivers/${id}`, body);

// PATCH /drivers/{id}/safety-score → DriverOut
export const updateSafetyScore     = (id, score) =>
  api.patch(`/drivers/${id}/safety-score`, { safety_score: score });

// PATCH /drivers/{id}/status  → DriverOut
export const updateDriverStatus    = (id, status) =>
  api.patch(`/drivers/${id}/status`, { status });
