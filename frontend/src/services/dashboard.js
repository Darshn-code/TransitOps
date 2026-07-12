import { api } from './api.js';

// GET /dashboard/summary?vehicle_type=...&status=...&region=...
export const getDashboardSummary = (params = {}) => {
  const query = new URLSearchParams();
  if (params.vehicle_type) query.append('vehicle_type', params.vehicle_type);
  if (params.status) query.append('status', params.status);
  if (params.region) query.append('region', params.region);
  
  const queryString = query.toString();
  return api.get(`/dashboard/summary${queryString ? `?${queryString}` : ''}`);
};
