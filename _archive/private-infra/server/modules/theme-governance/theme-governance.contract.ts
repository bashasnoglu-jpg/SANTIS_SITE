export const ThemeGovernanceContract = {
  getActive: '/api/theme/active',
  getResolved: '/api/theme/resolved',
  getVersions: '/api/theme/versions',
  getAudit: '/api/theme/audit',
  postSync: '/api/theme/sync',
  postActivate: '/api/theme/activate',
  postOverride: '/api/theme/override'
} as const;
