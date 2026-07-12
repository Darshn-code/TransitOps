import { api } from './api.js';

// GET  /trips                     → TripOut[]   (Dispatcher + Safety Officer)
export const getTrips        = ()         => api.get('/trips');

// GET  /trips/{id}                → TripOut
export const getTrip         = (id)       => api.get(`/trips/${id}`);

// POST /trips                     → TripOut     (Dispatcher only)
export const createTrip      = (body)     => api.post('/trips', body);

// POST /trips/{id}/dispatch       → TripOut
export const dispatchTrip    = (id)       => api.post(`/trips/${id}/dispatch`, {});

// POST /trips/{id}/complete       → TripOut
// body: { final_odometer, fuel_consumed, fuel_cost, revenue }
export const completeTrip    = (id, body) => api.post(`/trips/${id}/complete`, body);

// POST /trips/{id}/cancel         → TripOut
// body: { reason? }
export const cancelTrip      = (id, body) => api.post(`/trips/${id}/cancel`, body);
