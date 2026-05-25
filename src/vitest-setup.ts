// Test environment variables — must be set before any module imports
process.env.DB_URL = ':memory:';
process.env.SECRET = 'test-secret';
process.env.BOT_USERNAME = 'test_bot';
process.env.BOT_TOKEN = 'test-bot-token';
process.env.APP_URL = 'https://test.example.com';
