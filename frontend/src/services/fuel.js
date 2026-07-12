import { api } from './api.js';

// ── Fuel Logs ──────────────────────────────────────────────────────────────
// GET  /fuel-logs           → FuelLogOut[]   (Financial Analyst only)
export const getFuelLogs    = ()     => api.get('/fuel-logs');

// POST /fuel-logs           → FuelLogOut
// body: { vehicle_id, liters, cost }
export const createFuelLog  = (body) => api.post('/fuel-logs', body);

// ── Expenses ───────────────────────────────────────────────────────────────
// GET  /expenses            → ExpenseOut[]   (Financial Analyst only)
export const getExpenses    = ()     => api.get('/expenses');

// POST /expenses            → ExpenseOut
// body: { vehicle_id, type: "toll"|"other", amount, description? }
export const createExpense  = (body) => api.post('/expenses', body);
