import { env } from '$env/dynamic/private';
import { Bot } from 'grammy';

const { BOT_TOKEN, GROUP_CHAT_ID, APP_URL } = env;

let bot: Bot;

const escapeMarkdown = (s: string) => {
  const SPECIAL_CHARACTERS = '_*[]()~`>#+-=|{}.!'.split('');
  SPECIAL_CHARACTERS.forEach((c) => (s = s.replaceAll(c, '\\' + c)));
  return s;
};

export const sendOrder = async (order: Order, userId: string) => {
  const mention = `[${escapeMarkdown(order.name)}](tg://user?id=${userId})`;
  const itemsString = order.orderedItems
    .map((item) => {
      const title = escapeMarkdown(`- ${item.name}`);
      const quantity = item.qty > 1 ? ` *x${item.qty}*` : '';
      return `${title}${quantity}`;
    })
    .join('\n');

  const message = `${mention}:\n${itemsString}`;
  await bot.api.sendMessage(GROUP_CHAT_ID!, message, {
    parse_mode: 'MarkdownV2',
  });
};

export const sendOrderButton = async () => {
  const button = {
    text: 'Создать заказ',
    login_url: {
      url: `${APP_URL}/order`,
    },
  };
  await bot.api.sendMessage(
    GROUP_CHAT_ID!,
    'Нажмите на кнопку ниже, чтобы создать заказ',
    {
      reply_markup: { inline_keyboard: [[button]] },
    },
  );
};

const createHmac = async (secret: ArrayBuffer, data: ArrayBuffer) => {
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  const key = await crypto.subtle.importKey('raw', secret, algorithm, false, [
    'sign',
  ]);
  return await crypto.subtle.sign(algorithm.name, key, data);
};

const createHash = async (data: ArrayBuffer) => {
  return await crypto.subtle.digest('SHA-256', data);
};

const hex = (data: ArrayBuffer) => {
  return Array.prototype.map
    .call(new Uint8Array(data), (x) => x.toString(16).padStart(2, '0'))
    .join('');
};

const isLinkSignatureValid = async (hash: string, data: string) => {
  const enc = new TextEncoder();
  const secretKey = await createHash(
    enc.encode(BOT_TOKEN!).buffer as ArrayBuffer,
  );
  const digest = await createHmac(
    secretKey,
    enc.encode(data).buffer as ArrayBuffer,
  );
  return hash === hex(digest);
};

export const authenticate = async (searchParams: URLSearchParams) => {
  if (!searchParams) return null;
  const hash = searchParams.get('hash');
  if (!hash) return null;

  const dataCheckString = [...searchParams.keys()]
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${searchParams.get(key)}`)
    .join('\n');

  if (!(await isLinkSignatureValid(hash, dataCheckString))) {
    return null;
  }

  return {
    id: searchParams.get('id')!,
  };
};

export const init = () => {
  bot = new Bot(BOT_TOKEN!);
};
