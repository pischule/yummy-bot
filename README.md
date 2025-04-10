# yummy-bot

Веб-приложение для заказа еды. Авторизация по телеграм, заказы отправляются в заданный чат

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
      - 3000:3000
    restart: unless-stopped
    environment:
      BOT_TOKEN: 'токен телеграм-бота'
      GROUP_CHAT_ID: 'id чата, в который бот отправляет сообщения'
      APP_URL: 'url приложения'
      SECRET: 'секрет для доступа к админке'
    volumes:
      - './data:/usr/src/app/data'
```

Админка доступна по url `/_/SECRET/edit`
