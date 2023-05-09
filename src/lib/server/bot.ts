import { createHash, createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { Context, Telegraf } from 'telegraf';

const { BOT_TOKEN, GROUP_CHAT_ID, APP_URL, ADMIN_CHAT_ID } = env;

let bot: Telegraf<Context>;

const escapeMarkdown = (s: string) => {
	const SPECIAL_CHARACTERS = '_*[]()~`>#+-=|{}.!'.split('');
	SPECIAL_CHARACTERS.forEach((c) => (s = s.replaceAll(c, '\\' + c)));
	return s;
};

export const sendOrder = async (order: Order, userId: string) => {
	const mention = `[${escapeMarkdown(
		order.name
	)}](tg://user?id=${userId})`;
	const itemsString = order.orderedItems
		.map(item => `- ${item.name}${item.qty > 1 ? ` x${item.qty}` : ''}`)
		.join('\n');

	const message = `${mention}:\n${escapeMarkdown(itemsString)}`;
	await bot.telegram.sendMessage(GROUP_CHAT_ID, message, { parse_mode: 'MarkdownV2' });
};

export const isAdmin = (userId: string) => {
	return ADMIN_CHAT_ID === userId;
};

export const sendOrderButton = async () => {
	const button = {
		text: 'Создать заказ',
		login_url: {
			url: `${APP_URL}/order`
		}
	};
	await bot.telegram.sendMessage(GROUP_CHAT_ID, 'Нажмите на кнопку ниже, чтобы создать заказ', { reply_markup: { inline_keyboard: [[button]] } });
};

export const checkSignature = (auth: Map<string, string>) => {
	if (!auth) return false;
	const hashedKeys = [...auth.keys()].filter(key => key !== 'hash');
	hashedKeys.sort();
	const dataCheckString = hashedKeys.map((key) => `${key}=${auth.get(key)}`).join('\n');
	const secretKey = createHash('sha256').update(BOT_TOKEN).digest();
	const hmac = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

	const hash = auth.get('hash');
	return !!hash && hash === hmac;
};

export const init = () => {
	bot = new Telegraf(BOT_TOKEN);

	bot.command('del', async (ctx) => {
		const reply = ctx.message?.reply_to_message;
		if (!reply || reply.from?.id !== ctx.botInfo.id) {
			return;
		}
		await ctx.deleteMessage(reply.message_id);
	});

	bot.command('admin', async (ctx) => {
		const button = {
			text: 'Редактировать меню',
			login_url: {
				url: `${APP_URL}/admin/edit`
			}
		};
		await ctx.reply('Админские ссылки', { reply_markup: { inline_keyboard: [[button]] } });
	});

	bot.launch().then(() => console.log('bot started'));

	process.once('SIGINT', () => bot.stop('SIGINT'));
	process.once('SIGTERM', () => bot.stop('SIGTERM'));
};
