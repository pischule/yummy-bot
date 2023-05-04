import { env } from '$env/dynamic/private';
import { Telegraf } from 'telegraf';

const { BOT_TOKEN, CHAT_ID } = env;
if (!BOT_TOKEN || !CHAT_ID) throw new Error('token not provided');

const bot = new Telegraf(BOT_TOKEN);

export const sendOrderToChat = async (name: string, items: Item[]) => {
	const itemsString = items
		.map(item => `- ${item.name}${item.qty > 1 ? ` x${item.qty}` : ''}`)
		.join('\n');
	const message = `${name}:\n${itemsString}`;
	const button = {
		text: "Создать заказ",
		login_url: {
			url: 'https://dev.com:5173/order'
		},
	};
	await bot.telegram.sendMessage(CHAT_ID, message, { reply_markup: { inline_keyboard: [[button]] } });
};

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
