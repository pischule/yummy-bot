import { validateConfig } from '$lib/server/config';
import { runMigrations } from '$lib/server/db/migrate';
import * as bot from '$lib/server/bot';
import { scheduleOldLinkDeletion } from '$lib/server/menu-link';
import { scheduleTrackedMessageDeletion } from '$lib/server/message-deletion';

validateConfig();
await runMigrations();
bot.init();
scheduleOldLinkDeletion();
scheduleTrackedMessageDeletion();

process.on('SIGTERM', async () => {
	await bot.stop();
	process.exit(0);
});
