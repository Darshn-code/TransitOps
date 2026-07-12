import { api } from './api.js';

// GET  /maintenance              → MaintenanceLogOut[]   (FM, Dispatcher, Analyst)
export const getMaintenanceLogs  = ()         => api.get('/maintenance');

// GET  /maintenance/{id}         → MaintenanceLogOut
export const getMaintenanceLog   = (id)       => api.get(`/maintenance/${id}`);

// POST /maintenance              → MaintenanceLogOut   (FM only)
// body: { vehicle_id, description, cost? }
export const createMaintenanceLog = (body)    => api.post('/maintenance', body);

// POST /maintenance/{id}/close   → MaintenanceLogOut   (FM only)
export const closeMaintenanceLog  = (id)      => api.post(`/maintenance/${id}/close`, {});
