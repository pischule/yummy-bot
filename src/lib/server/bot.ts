import { env } from '$env/dynamic/private';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Bot, type CommandContext, Context } from 'grammy';
import { logger } from '$lib/server/logger';
import { adminChatIds } from '$lib/server/config';

const { BOT_TOKEN, BOT_PROXY, APP_URL } = env;

export let bot: Bot;

const SPECIAL_CHARACTERS = '_*[]()~`>#+-=|{}.!'.split('');

const escapeMarkdown = (s: string) => {
	SPECIAL_CHARACTERS.forEach((c) => (s = s.replaceAll(c, '\\' + c)));
	return s;
};

export const sendOrder = async (order: Order, userId: number, chatId: string): Promise<number> => {
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

async function sendChatId(ctx: CommandContext<Context>) {
	try {
		await ctx.reply(`Chat ID: <code>${ctx.chatId}</code>`, { parse_mode: 'HTML' });
		logger.info('Replied with chatid');
	} catch (e) {
		logger.warn('Failed to reply with chatid');
	}
}

async function sendAdminButton(ctx: CommandContext<Context>) {
	const chatId = ctx.chatId;
	const sender = ctx.from?.username;
	const ctxLogger = logger.child({ chatId, sender });
	if (!adminChatIds.includes(chatId)) {
		ctxLogger.warn('Rejected sending admin button');
		return ctx.reply('Не твой уровень, дорогой!');
	}
	const button = {
		text: 'Войти в админку',
		login_url: {
			url: `${APP_URL}/_/edit`
		}
	};

	try {
		const result = await bot.api.sendMessage(chatId, 'Вход в панель управления по кнопке ниже', {
			reply_markup: { inline_keyboard: [[button]] }
		});
		const messageId = result.message_id;
		ctxLogger.info({ messageId }, 'Sent login button');
	} catch (e) {
		ctxLogger.error(e, 'Failed to send admin button');
	}
}

export const init = () => {
	if (bot) return;

	if (BOT_PROXY) {
		const agent = new SocksProxyAgent(BOT_PROXY);

		bot = new Bot(BOT_TOKEN, {
			client: {
				baseFetchConfig: {
					agent,
					compress: true
				}
			}
		});
	} else {
		bot = new Bot(BOT_TOKEN);
	}

	bot.command('chatid', sendChatId);
	bot.command('admin', sendAdminButton);
	bot.start().then();
};

export async function stop() {
	await bot.stop();
}
