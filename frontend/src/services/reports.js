import { api } from './api.js';

// All /reports/* endpoints — Fleet Manager + Financial Analyst only

// GET /reports/fuel-efficiency
// → { vehicle_id, registration_number, distance, liters, km_per_liter: number|null }[]
export const getFuelEfficiency     = () => api.get('/reports/fuel-efficiency');

// GET /reports/fleet-utilization
// → { vehicle_id, registration_number, completed_trips, utilization_pct: number|null }[]
export const getFleetUtilization   = () => api.get('/reports/fleet-utilization');

// GET /reports/operational-cost
// → { vehicle_id, registration_number, maintenance_cost, fuel_cost, expense_cost, total }[]
export const getOperationalCost    = () => api.get('/reports/operational-cost');

// GET /reports/roi
// → { vehicle_id, registration_number, revenue, maintenance_cost, fuel_cost, roi: number|null }[]
export const getVehicleROI         = () => api.get('/reports/roi');

// GET /reports/monthly-revenue
// → { year, month, revenue }[]
export const getMonthlyRevenue     = () => api.get('/reports/monthly-revenue');

// GET /reports/top-costliest-vehicles?limit=5
// → { vehicle_id, registration_number, operational_cost }[]
export const getTopCostliestVehicles = (limit = 5) =>
  api.get(`/reports/top-costliest-vehicles?limit=${limit}`);
