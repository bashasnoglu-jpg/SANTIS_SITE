/**
 * [PRIVATE_MOVED] Script Redirect Helper
 * This script informs developers that a command has been moved to the private Santis OS repository.
 */

const commandName = process.argv[2] || 'unknown';

console.error(`\n[PRIVATE_MOVED] ${commandName} belongs to private Santis OS infrastructure.`);
console.error('This command is intentionally disabled in SANTIS_SITE to enforce the public/private repo boundary.');
console.error('Run this command from the private Santis OS repository instead.\n');

process.exit(1);
