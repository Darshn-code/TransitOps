export const PERMISSIONS = {
  fleet_manager: {
    dashboard: 'full',
    fleet: 'full',
    drivers: 'full',      // Fleet Manager gets full access to drivers page
    trips: 'none',
    maintenance: 'full',
    fuel: 'view',
    reports: 'full',
    settings: 'full'
  },
  dispatcher: {
    dashboard: 'full',
    fleet: 'view',
    drivers: 'view',
    trips: 'full',
    maintenance: 'view',
    fuel: 'view',
    reports: 'view',
    settings: 'none'
  },
  safety_officer: {
    dashboard: 'view',
    fleet: 'view',
    drivers: 'full',
    trips: 'view',
    maintenance: 'none',
    fuel: 'none',
    reports: 'view',
    settings: 'none'
  },
  financial_analyst: {
    dashboard: 'view',
    fleet: 'none',
    drivers: 'none',
    trips: 'none',
    maintenance: 'view',
    fuel: 'full',
    reports: 'full',
    settings: 'none'
  }
};

/**
 * Checks if a specific role has the required permission level for a module.
 * @param {string} role - The role of the logged in user (e.g. 'fleet_manager')
 * @param {string} module - The module to check (e.g. 'fleet')
 * @param {'view'|'full'} level - The required level of permission
 * @returns {boolean} True if permitted, false otherwise.
 */
export function can(role, module, level = 'view') {
  if (!role) return false;
  
  // Normalize role string from backend/session just in case (e.g. UPPERCASE/snake_case)
  const normalizedRole = role.toLowerCase().replace(' ', '_');
  
  const perm = PERMISSIONS[normalizedRole]?.[module] ?? 'none';
  
  if (perm === 'none') return false;
  if (level === 'view') return true; // Both 'view' and 'full' permissions satisfy a 'view' check
  if (level === 'full') return perm === 'full';
  
  return false;
}
