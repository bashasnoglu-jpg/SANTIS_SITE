import {
  syncManifestToDatabase,
  activateThemeVersion
} from '../../modules/theme-governance/theme-governance.service';
import { insertThemeAuditLog } from '../../modules/theme-governance/theme-governance.repository';
import { AuditActions } from '../../modules/theme-governance/theme-governance.schemas';

async function main() {
  console.log('Seeding theme governance...');
  
  const version = await syncManifestToDatabase({
    deployedBy: 'system-seed',
    source: 'seed',
    notes: 'Initial sovereign visual truth seed'
  });

  await activateThemeVersion(version.id, 'system-seed');

  await insertThemeAuditLog({
    versionId: version.id,
    action: AuditActions.SEED_INITIAL_THEME,
    details: { seededBy: 'system-seed' }
  });

  console.log('Theme governance seeded successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to seed theme governance:', err);
  process.exit(1);
});
