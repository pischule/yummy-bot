import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './store';

export async function runMigrations() {
	await migrate(db, { migrationsFolder: './drizzle' });
}
