# yummy-bot

Веб-приложение для заказа еды. Поддержка нескольких локаций — каждая со своим чатом и меню. Авторизация по телеграм, заказы отправляются в чат соответствующей локации

<table>
  <tr>
    <td>
      <img src="https://github.com/pischule/yummy-bot-4/assets/41614960/4628fda2-fcab-48bc-ac38-eeddf74de45d"/>
    </td>
    <td>
      <img src="https://github.com/pischule/yummy-bot-4/assets/41614960/c48a375f-d618-44e4-bee4-243112fc28bf"/>
    </td>
    <td>
      <img src="https://github.com/pischule/yummy-bot-4/assets/41614960/b6debea7-a813-47c5-a10a-b317318880d2"/>
    </td>
  </tr>
  <tr>
    <td></td>
    <td>
      <img src="https://github.com/pischule/yummy-bot-4/assets/41614960/72748835-6b0b-4d34-a9a8-408d94f23e7b"/>
    </td>
    <td></td>
  </tr>
</table>

Пример docker-compose.yml

```yaml
services:
  app:
    image: ghcr.io/pischule/yummy-bot-4:main
    ports:
      - 8000:8000
    restart: unless-stopped
    init: true
    environment:
      BOT_TOKEN: 'токен телеграм-бота'
      BOT_PROXY: 'socks://127.0.0.1:1080' # optional, remove if not behind a proxy
      APP_URL: 'url приложения'
      ADMIN_CHAT_IDS: 'id чатов с админами'
      DB_URL: 'file:/app/data/db.sqlite3'
      COOKIE_ENCRYPTION_KEY: 'generate using <openssl rand -base64 32>'
    volumes:
      - './data:/app/data'
```

Создайте Telegram-чат для админов, отключите в нём возможность делиться (sharing), пригласите бота. Узнайте чат-айди бота командой `/chatid`, укажите его в `ADMIN_CHAT_IDS`. Для входа в админку — команда `/admin`, бот пришлёт кнопку входа с авторизацией через Telegram.
