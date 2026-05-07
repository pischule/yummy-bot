import { runMigrations } from '$lib/server/db/migrate';
import * as bot from '$lib/server/bot';

await runMigrations();
bot.init();
