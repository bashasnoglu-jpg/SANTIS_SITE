import { drizzle } from 'drizzle-orm/node-postgres';
import { dbVault } from '../santis-db-vault.js';
import * as themeGovernanceSchema from './schema/theme_governance';

export const db = drizzle(dbVault, { schema: { ...themeGovernanceSchema } });
