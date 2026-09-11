import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Telegram bot status & getMe verification
  app.get('/api/telegram/status', async (req, res) => {
    const queryToken = req.query.token as string | undefined;
    const token = queryToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = (req.query.chat_id as string | undefined) || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return res.json({
        configured: false,
        message: 'Токен Telegram бота не настроен',
        chatId: chatId || null,
      });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json() as { ok: boolean; result?: any; description?: string };

      if (data.ok) {
        return res.json({
          configured: true,
          bot: data.result,
          chatId: chatId || null,
        });
      } else {
        return res.status(400).json({
          configured: false,
          error: data.description || 'Не удалось авторизовать бота',
          chatId: chatId || null,
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        configured: false,
        error: `Сетевая ошибка при проверке бота: ${err?.message || err}`,
      });
    }
  });

  // Send message to Telegram chat / channel
  app.post('/api/telegram/send', async (req, res) => {
    const {
      text,
      parse_mode = 'HTML',
      disable_notification = false,
      chat_id,
      bot_token,
    } = req.body;

    const token = bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = chat_id || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return res.status(400).json({
        ok: false,
        error: 'Отсутствует Bot Token. Укажите его в настройках или в переменной TELEGRAM_BOT_TOKEN.',
      });
    }

    if (!targetChatId) {
      return res.status(400).json({
        ok: false,
        error: 'Отсутствует Chat ID / Channel ID. Укажите его в настройках или в переменной TELEGRAM_CHAT_ID.',
      });
    }

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Текст сообщения не может быть пустым.',
      });
    }

    try {
      const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          parse_mode,
          disable_notification,
          disable_web_page_preview: true,
        }),
      });

      const result = await telegramRes.json() as { ok: boolean; description?: string; result?: any };

      if (result.ok) {
        return res.json({
          ok: true,
          messageId: result.result?.message_id,
          sentAt: new Date().toISOString(),
          chat: result.result?.chat,
        });
      } else {
        return res.status(400).json({
          ok: false,
          error: result.description || 'Ошибка API Telegram',
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: `Не удалось связаться с сервером Telegram: ${err?.message || err}`,
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Footbalmonitor Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
