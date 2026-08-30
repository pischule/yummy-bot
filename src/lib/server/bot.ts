import { env } from '$env/dynamic/private';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Bot, type CommandContext, Context } from 'grammy';
import { logger } from '$lib/server/logger';
import { adminChatIds } from '$lib/server/config';
import { getMenuByLinkId } from '$lib/server/menu';
import { trackMessageToDelete } from '$lib/server/message-deletion';

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
		parse_mode: 'MarkdownV2',
		disable_notification: true
	});
	return sent.message_id;
};

export async function getBotUsername(): Promise<string> {
	if (bot.botInfo?.username) return bot.botInfo.username;
	const me = await bot.api.getMe();
	return me.username;
}

async function handleStart(ctx: CommandContext<Context>) {
	const linkId = ctx.match?.trim();
	if (!linkId || ctx.chat?.type !== 'private') return;

	const menu = await getMenuByLinkId(linkId);
	if (!menu) {
		return ctx.reply('Меню не найдено или ссылка устарела.');
	}

	const button = {
		text: 'Сделать заказ',
		web_app: {
			url: `${APP_URL}/login/order/${linkId}`
		}
	};

	const sent = await ctx.reply(
		'Пойдём другим путём! Нажмите на кнопку ниже, и всё откроется прямо тут, в Telegram',
		{
			reply_markup: { inline_keyboard: [[button]] }
		}
	);
	await trackMessageToDelete(ctx.chat!.id, sent.message_id);
}

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
		},
		style: 'danger'
	};

	try {
		const result = await bot.api.sendMessage(chatId, 'Вход в панель управления по кнопке ниже', {
			// @ts-ignore
			reply_markup: { inline_keyboard: [[button]] },
			disable_notification: true
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

		bot = new Bot(BOT_TOKEN!!, {
			client: {
				baseFetchConfig: {
					agent,
					compress: true
				}
			}
		});
	} else {
		bot = new Bot(BOT_TOKEN!!);
	}

	bot.command('chatid', sendChatId);
	bot.command('admin', sendAdminButton);
	bot.command('start', handleStart);
	bot.start().then();
};

export async function stop() {
	await bot.stop();
}
