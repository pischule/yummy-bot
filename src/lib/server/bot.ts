import { env } from '$env/dynamic/private';
import { Bot } from 'grammy';

const { BOT_TOKEN } = env;

export let bot: Bot;

const SPECIAL_CHARACTERS = '_*[]()~`>#+-=|{}.!'.split('');

const escapeMarkdown = (s: string) => {
	SPECIAL_CHARACTERS.forEach((c) => (s = s.replaceAll(c, '\\' + c)));
	return s;
};

export const sendOrder = async (order: Order, userId: string, chatId: string): Promise<number> => {
	const mention = `[${escapeMarkdown(order.name)}](tg://user?id=${userId})`;
	const itemsString = order.orderedItems
		.map((item) => {
			const title = escapeMarkdown(`- ${item.name}`);
			const quantity = item.qty > 1 ? ` *x${item.qty}*` : '';
			return `${title}${quantity}`;
		})
		.join('\n');

	const message = `${mention}:\n${itemsString}`;
	const sent = await bot.api.sendMessage(chatId, message, {
		parse_mode: 'MarkdownV2'
	});
	return sent.message_id;
};

export const init = () => {
	if (bot) return;
	bot = new Bot(BOT_TOKEN);
	bot.command('chatid', (ctx) =>
		ctx.reply(`Chat ID: <code>${ctx.chatId}</code>`, { parse_mode: 'HTML' })
	);
	bot.start().then();
};

export async function stop() {
	await bot.stop();
}
