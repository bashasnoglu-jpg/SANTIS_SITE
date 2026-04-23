export const ThemeGovernanceContract = {
  getActive: '/api/theme/active',
  getResolved: '/api/theme/resolved',
  postSync: '/api/theme/sync',
  postActivate: '/api/theme/activate',
  postOverride: '/api/theme/override',
  getVersions: '/api/theme/versions'
} as const;
