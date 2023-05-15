import { createHash, createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { Telegraf } from 'telegraf';

const { BOT_TOKEN, GROUP_CHAT_ID, APP_URL } = env;

const bot = new Telegraf(BOT_TOKEN);

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
		.map(item => {
			const title = escapeMarkdown(`- ${item.name}`);
			const quantity = item.qty > 1 ? ` *x${item.qty}*` : '';
			return `${title}${quantity}`;
		}).join('\n');

	const message = `${mention}:\n${itemsString}`;
	await bot.telegram.sendMessage(GROUP_CHAT_ID, message, { parse_mode: 'MarkdownV2' });
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

export const isSignatureValid = (auth: Map<string, string>) => {
	if (!auth) return false;
	const hash = auth.get('hash');
	if (!hash) return false;

	const hashedKeys = [...auth.keys()].filter(key => key !== 'hash');
	hashedKeys.sort();
	const dataCheckString = hashedKeys.map((key) => `${key}=${auth.get(key)}`).join('\n');
	const secretKey = createHash('sha256').update(BOT_TOKEN).digest();
	const hmac = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
	return hash === hmac;
};

