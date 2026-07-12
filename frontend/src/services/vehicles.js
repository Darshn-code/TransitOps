import { api } from './api.js';

// GET  /vehicles              → VehicleOut[]
export const getVehicles    = ()         => api.get('/vehicles');

// GET  /vehicles/{id}         → VehicleOut
export const getVehicle     = (id)       => api.get(`/vehicles/${id}`);

// POST /vehicles              → VehicleOut   (Fleet Manager only)
export const createVehicle  = (body)     => api.post('/vehicles', body);

// PATCH /vehicles/{id}        → VehicleOut   (Fleet Manager only)
export const updateVehicle  = (id, body) => api.patch(`/vehicles/${id}`, body);

// POST /vehicles/{id}/retire  → VehicleOut   (Fleet Manager only — no DELETE endpoint)
export const retireVehicle  = (id)       => api.post(`/vehicles/${id}/retire`);
