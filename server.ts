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

  function humanizeTelegramError(rawError: string): string {
    if (rawError.includes("the bot can't send messages to the bot")) {
      return "В поле 'Chat ID' указан юзернейм или ID самого бота. Бот не может отправлять сообщения самому себе. Укажите ID вашего личного диалога или имя вашего канала/группы (например, @my_channel_name).";
    }
    if (rawError.includes("chat not found")) {
      return "Чат или канал не найден. Убедитесь, что бот добавлен в канал/группу и назначен администратором, либо напишите боту в личные сообщения команду /start.";
    }
    if (rawError.includes("bot was blocked by the user")) {
      return "Бот заблокирован пользователем. Откройте диалог с ботом в Telegram и нажмите 'Запустить' (Start).";
    }
    if (rawError.includes("bot is not a member") || rawError.includes("have no rights to send a message") || rawError.includes("not enough rights")) {
      return "У бота нет прав на публикацию в этом канале/чате. Добавьте бота в администраторы канала с разрешением отправки сообщений.";
    }
    return rawError;
  }

  // Get recent chats / updates from bot to auto-detect User/Channel ID
  app.get('/api/telegram/updates', async (req, res) => {
    const queryToken = req.query.token as string | undefined;
    const token = queryToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return res.status(400).json({ ok: false, error: 'Токен Telegram бота не настроен' });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`);
      const data = await response.json() as { ok: boolean; result?: any[]; description?: string };

      if (!data.ok) {
        return res.status(400).json({
          ok: false,
          error: humanizeTelegramError(data.description || 'Не удалось получить обновления бота'),
        });
      }

      const chats: Array<{ id: number | string; title: string; type: string; username?: string }> = [];
      const seen = new Set<string>();

      for (const update of (data.result || []).reverse()) {
        const chat = update.message?.chat || update.channel_post?.chat || update.my_chat_member?.chat;
        if (chat && !seen.has(String(chat.id))) {
          seen.add(String(chat.id));
          const name = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || `Чат ${chat.id}`;
          chats.push({
            id: chat.id,
            title: name,
            type: chat.type,
            username: chat.username,
          });
        }
      }

      return res.json({ ok: true, chats });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: `Ошибка при запросе к Telegram: ${err?.message || err}`,
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
        const errorText = humanizeTelegramError(result.description || 'Ошибка API Telegram');
        return res.status(400).json({
          ok: false,
          error: errorText,
          rawError: result.description,
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
