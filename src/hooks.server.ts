import { runMigrations } from '$lib/server/db/migrate';
import * as bot from '$lib/server/bot';
import { scheduleOldLinkDeletion } from '$lib/server/menu-link';

await runMigrations();
bot.init();
scheduleOldLinkDeletion();

process.on('SIGTERM', async () => {
	await bot.stop();
	process.exit(0);
});
