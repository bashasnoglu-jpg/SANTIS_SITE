import {
  syncManifestToDatabase,
  activateThemeVersion
} from '../modules/theme-governance/theme-governance.service';

async function main() {
  const args = process.argv.slice(2);
  const getArgValue = (key: string) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : undefined;
  };

  const hasArg = (key: string) => args.some(a => a === `--${key}` || a.startsWith(`--${key}=`));

  const actor = getArgValue('actor') || 'system';
  const source = getArgValue('source') || 'cli';
  const notes = getArgValue('notes');
  const activate = hasArg('activate');

  console.log(`Syncing theme manifest (source: ${source}, actor: ${actor})...`);

  try {
    const version = await syncManifestToDatabase({
      deployedBy: actor,
      source: source,
      notes: notes
    });

    console.log(`Manifest synced. Version ID: ${version.id}, Hash: ${version.versionHash}`);

    if (activate) {
      console.log(`Activating version ${version.id}...`);
      await activateThemeVersion(version.id, actor);
      console.log('Version activated successfully.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error syncing theme manifest:', error);
    process.exit(1);
  }
}

main();
