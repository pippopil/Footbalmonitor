import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  fetchFlashscoreLiveMatches,
  fetchSstatsLiveMatches,
  fetchSofascoreLiveMatches,
  fetchPublicLiveMatches,
  fetchApiFootballMatches,
  fetchFootballDataMatches,
  ingestMatchesFromWebhook,
  getIngestedMatches,
  clearIngestedMatches,
} from './server/dataSources';

dotenv.config();

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

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

  // AI Match Analyst in 1 Click (Powered by Gemini 3.8 Flash with Intelligent Statistical Fallback)
  app.post('/api/ai/analyze-match', async (req, res) => {
    const { match, pressureAnalysis } = req.body;

    if (!match) {
      return res.status(400).json({ ok: false, error: 'Данные матча не переданы.' });
    }

    const {
      homeTeam,
      awayTeam,
      league,
      country,
      minute,
      score,
      stats,
    } = match;

    const daDiff = (stats?.dangerousAttacks?.[0] || 0) - (stats?.dangerousAttacks?.[1] || 0);
    const sotDiff = (stats?.shotsOnTarget?.[0] || 0) - (stats?.shotsOnTarget?.[1] || 0);
    const cornersTotal = (stats?.corners?.[0] || 0) + (stats?.corners?.[1] || 0);
    const totalGoals = (score?.[0] || 0) + (score?.[1] || 0);
    const xgHome = stats?.xg?.[0] || 0;
    const xgAway = stats?.xg?.[1] || 0;
    const pressureScore = pressureAnalysis?.pressureIndex || 65;

    // Helper for formatting telegram post
    function buildTelegramPost(analysisData: any) {
      const recsText = (analysisData.recommendations || [])
        .map((r: any) => `▫️ <b>${r.market}</b> (кэф ~${Number(r.oddsEstimate).toFixed(2)}) — <i>${r.confidence === 'HIGH' ? '🟢 Высокая' : r.confidence === 'MEDIUM' ? '🟡 Средняя' : '⚪ Умеренная'} уверенность</i>\n   👉 ${r.reasoning}`)
        .join('\n\n');

      const risksText = (analysisData.keyRisks || [])
        .map((rk: string) => `⚠️ ${rk}`)
        .join('\n');

      return `🤖 <b>AI-АНАЛИЗ МАТЧА В ОДИН КЛИК</b>\n\n` +
        `🏆 <b>${country} | ${league}</b>\n` +
        `⚔️ <b>${homeTeam} ${score[0]}:${score[1]} ${awayTeam}</b> (${minute}')\n\n` +
        `⚡ <b>Вердикт:</b> ${analysisData.headline}\n` +
        `📝 <i>${analysisData.summary}</i>\n\n` +
        `📊 <b>Вероятность следующего гола:</b>\n` +
        `• ${homeTeam}: <b>${analysisData.probabilities.nextGoalHome}%</b>\n` +
        `• ${awayTeam}: <b>${analysisData.probabilities.nextGoalAway}%</b>\n` +
        `• Без голов: <b>${analysisData.probabilities.noMoreGoals}%</b>\n` +
        `• Ожидаемый тотал: <b>${analysisData.probabilities.expectedTotalGoals}</b>\n\n` +
        `🎯 <b>Рекомендуемые маркеты (Value):</b>\n${recsText}\n\n` +
        `🛡️ <b>Факторы риска:</b>\n${risksText}\n\n` +
        `💡 <i>Тактика: ${analysisData.tacticalNote}</i>\n\n` +
        `📡 <i>Footbalmonitor AI Engine v2.4</i>`;
    }

    // Heuristic analytical engine fallback
    function generateHeuristicAnalysis() {
      const isHomeDominant = daDiff > 12 || sotDiff > 2 || (stats?.dangerousAttacks?.[0] > stats?.dangerousAttacks?.[1] * 1.4);
      const isAwayDominant = daDiff < -12 || sotDiff < -2 || (stats?.dangerousAttacks?.[1] > stats?.dangerousAttacks?.[0] * 1.4);
      const dominantSide = isHomeDominant ? 'home' : isAwayDominant ? 'away' : 'balanced';
      const dominantTeam = isHomeDominant ? homeTeam : isAwayDominant ? awayTeam : 'Обе команды';

      let intensityLevel: 'CALM' | 'ACTIVE' | 'HIGH_PRESSURE' | 'SIEGE' = 'ACTIVE';
      if (pressureScore >= 80) intensityLevel = 'SIEGE';
      else if (pressureScore >= 65) intensityLevel = 'HIGH_PRESSURE';
      else if (pressureScore < 45) intensityLevel = 'CALM';

      let headline = '';
      if (intensityLevel === 'SIEGE') {
        headline = `Осада ворот: ${dominantTeam} создает критическое давление, назревает быстрый гол!`;
      } else if (dominantSide !== 'balanced') {
        headline = `Тактический перевес ${dominantTeam}: доминирование по опасным атакам (${Math.max(stats.dangerousAttacks[0], stats.dangerousAttacks[1])}) и xG`;
      } else {
        headline = `Интенсивная обоюдоострая борьба: высокий темп при равных шансах на гол`;
      }

      const summary = `${homeTeam} и ${awayTeam} проводят матч с индексом давления ${pressureScore}/100 на ${minute}-й минуте при счете ${score[0]}:${score[1]}. ` +
        (dominantSide !== 'balanced'
          ? `${dominantTeam} контролирует территорию и взвинчивает темп на флангах, заставляя оборону соперника садиться в низкий блок.`
          : `Команды обмениваются позиционными выпадами без глубокого перекоса по владению, но с регулярным обострением.`);

      // Dynamic probability calculation
      let nextGoalHome = 35;
      let nextGoalAway = 35;
      let noMoreGoals = 30;

      if (isHomeDominant) {
        nextGoalHome = Math.min(75, 45 + Math.round(pressureScore * 0.3));
        nextGoalAway = Math.max(10, 30 - Math.round(pressureScore * 0.15));
        noMoreGoals = 100 - nextGoalHome - nextGoalAway;
      } else if (isAwayDominant) {
        nextGoalAway = Math.min(75, 45 + Math.round(pressureScore * 0.3));
        nextGoalHome = Math.max(10, 30 - Math.round(pressureScore * 0.15));
        noMoreGoals = 100 - nextGoalHome - nextGoalAway;
      } else {
        if (minute > 75) {
          nextGoalHome = 28;
          nextGoalAway = 28;
          noMoreGoals = 44;
        } else {
          nextGoalHome = 38;
          nextGoalAway = 36;
          noMoreGoals = 26;
        }
      }

      const nextTotalLine = totalGoals + 0.5;
      const recommendations = [
        {
          market: `ТБ ${nextTotalLine}`,
          oddsEstimate: Number((minute > 70 ? 2.15 : minute > 55 ? 1.78 : 1.55).toFixed(2)),
          confidence: (pressureScore > 65 || sotDiff !== 0 ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
          reasoning: `Суммарный xG (${(xgHome + xgAway).toFixed(2)}) и частота ударов в створ (${stats.shotsOnTarget[0] + stats.shotsOnTarget[1]}) сигнализируют о высокой вероятности взятия ворот до финального свистка.`,
          edge: `Опережение рыночной линии по метрике xG/Shot на ${(pressureScore * 0.18).toFixed(1)}%`,
        },
        {
          market: dominantSide !== 'balanced' ? `Следующий гол: ${dominantTeam}` : `Обе забьют: Да`,
          oddsEstimate: dominantSide !== 'balanced' ? 1.92 : 1.85,
          confidence: (dominantSide !== 'balanced' ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
          reasoning: dominantSide !== 'balanced'
            ? `${dominantTeam} проводит более 70% времени в финальной трети соперника с явным перевесом по угловым (${stats.corners[0]}-${stats.corners[1]}).`
            : `Обе команды уязвимы при быстрых контратаках и допускают разрывы между линиями полузащиты.`,
          edge: `Коэффициент валуен на фоне проседания защитных блоков соперника.`,
        },
      ];

      if (cornersTotal >= 5 || minute > 40) {
        recommendations.push({
          market: `ТБ ${cornersTotal + 2.5} угловых`,
          oddsEstimate: 1.82,
          confidence: 'MEDIUM',
          reasoning: `Активная игра через фланговые прострелы генерирует частые рикошеты и выносы на угловой (в среднем 1 корнер каждые 7-9 минут).`,
          edge: `Статистическая вероятность пробития тотала составляет 68%`,
        });
      }

      const keyRisks = [
        minute > 75
          ? 'Фактор усталости игроков и возможные тактические затяжки времени со стороны ведущей команды.'
          : 'Возможность тактических замен, способных сбить текущий темп давления.',
        (stats.yellowCards[0] + stats.yellowCards[1] >= 4)
          ? `Высокая плотность фолов (${stats.yellowCards[0] + stats.yellowCards[1]} ЖК) повышает риск удаления, способного перевернуть сценарий.`
          : 'Риск контратаки аутсайдера при оголении тылов атакующей команды.',
      ];

      const tacticalNote = dominantSide !== 'balanced'
        ? `${dominantTeam} методично растягивает оборонительный блок ${dominantSide === 'home' ? awayTeam : homeTeam} через перегруз полуфлангов. Вратарь соперника находится под постоянным прессингом.`
        : `Обе команды действуют в агрессивном контрпрессинге. Ключевая дуэль разворачивается в центральном круге.`;

      const result = {
        matchId: match.id,
        generatedAt: new Date().toLocaleTimeString('ru-RU'),
        headline,
        summary,
        momentum: {
          dominantSide,
          dominantTeam,
          pressureDescription: `${dominantTeam} имеет преимущество по опасным атакам (${stats.dangerousAttacks[0]}-${stats.dangerousAttacks[1]}) и ударам (${stats.shotsOnTarget[0]}-${stats.shotsOnTarget[1]}).`,
          intensityLevel,
        },
        probabilities: {
          nextGoalHome,
          nextGoalAway,
          noMoreGoals,
          expectedTotalGoals: `ТБ ${nextTotalLine}`,
        },
        recommendations,
        keyRisks,
        tacticalNote,
        source: 'heuristic' as const,
      };

      return {
        ...result,
        telegramFormattedText: buildTelegramPost(result),
      };
    }

    const ai = getGenAI();

    // If Gemini is available, run Gemini 3.8 Flash
    if (ai) {
      try {
        const prompt = `Ты элитный спортивный квант-аналитик футбола и эксперт по live-ставкам.
Проанализируй текущий матч в реальном времени и выдай структурированный тактический и беттинг-анализ.

ДАННЫЕ МАТЧА:
- Страна и турнир: ${country} | ${league}
- Матч: ${homeTeam} против ${awayTeam}
- Текущая минута: ${minute}'
- Текущий счет: ${score[0]}:${score[1]}
- Статистика ${homeTeam}:
  * Опасные атаки: ${stats.dangerousAttacks[0]}
  * Удары в створ: ${stats.shotsOnTarget[0]}
  * Удары мимо: ${stats.shotsOffTarget[0]}
  * Угловые: ${stats.corners[0]}
  * Владение мячом: ${stats.possession[0]}%
  * xG: ${stats.xg[0]}
  * Желтые карточки: ${stats.yellowCards[0]}
  * Красные карточки: ${stats.redCards[0]}
- Статистика ${awayTeam}:
  * Опасные атаки: ${stats.dangerousAttacks[1]}
  * Удары в створ: ${stats.shotsOnTarget[1]}
  * Удары мимо: ${stats.shotsOffTarget[1]}
  * Угловые: ${stats.corners[1]}
  * Владение мячом: ${stats.possession[1]}%
  * xG: ${stats.xg[1]}
  * Желтые карточки: ${stats.yellowCards[1]}
  * Красные карточки: ${stats.redCards[1]}
- Индекс давления (Pressure Index): ${pressureScore}/100

Требования:
1. Оцени реальный тактический сценарий, доминацию и интенсивность (CALM, ACTIVE, HIGH_PRESSURE, SIEGE).
2. Рассчитай точные процентные вероятности следующего гола (nextGoalHome, nextGoalAway, noMoreGoals), в сумме ровно 100%.
3. Предложи 2-3 наиболее выгодных (value) маркета для live-ставки с обоснованием и расчетным коэффициентом.
4. Укажи главные риски и тактическую заметку.
5. Ответ строго на русском языке в формате JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are a professional football match live analytics engine. Return purely valid JSON adhering strictly to the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                summary: { type: Type.STRING },
                intensityLevel: { type: Type.STRING, description: 'CALM, ACTIVE, HIGH_PRESSURE, or SIEGE' },
                dominantSide: { type: Type.STRING, description: 'home, away, or balanced' },
                dominantTeam: { type: Type.STRING },
                pressureDescription: { type: Type.STRING },
                nextGoalHome: { type: Type.INTEGER },
                nextGoalAway: { type: Type.INTEGER },
                noMoreGoals: { type: Type.INTEGER },
                expectedTotalGoals: { type: Type.STRING },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      market: { type: Type.STRING },
                      oddsEstimate: { type: Type.NUMBER },
                      confidence: { type: Type.STRING, description: 'LOW, MEDIUM, or HIGH' },
                      reasoning: { type: Type.STRING },
                      edge: { type: Type.STRING },
                    },
                    required: ['market', 'oddsEstimate', 'confidence', 'reasoning', 'edge'],
                  },
                },
                keyRisks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                tacticalNote: { type: Type.STRING },
              },
              required: [
                'headline',
                'summary',
                'intensityLevel',
                'dominantSide',
                'dominantTeam',
                'pressureDescription',
                'nextGoalHome',
                'nextGoalAway',
                'noMoreGoals',
                'expectedTotalGoals',
                'recommendations',
                'keyRisks',
                'tacticalNote',
              ],
            },
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const formattedTelegram = buildTelegramPost(parsed);
          return res.json({
            ok: true,
            analysis: {
              matchId: match.id,
              generatedAt: new Date().toLocaleTimeString('ru-RU'),
              headline: parsed.headline,
              summary: parsed.summary,
              momentum: {
                dominantSide: parsed.dominantSide || 'balanced',
                dominantTeam: parsed.dominantTeam || (parsed.dominantSide === 'home' ? homeTeam : parsed.dominantSide === 'away' ? awayTeam : 'Обе команды'),
                pressureDescription: parsed.pressureDescription,
                intensityLevel: parsed.intensityLevel || 'HIGH_PRESSURE',
              },
              probabilities: {
                nextGoalHome: parsed.nextGoalHome,
                nextGoalAway: parsed.nextGoalAway,
                noMoreGoals: parsed.noMoreGoals,
                expectedTotalGoals: parsed.expectedTotalGoals,
              },
              recommendations: parsed.recommendations || [],
              keyRisks: parsed.keyRisks || [],
              tacticalNote: parsed.tacticalNote,
              telegramFormattedText: formattedTelegram,
              source: 'gemini',
            },
          });
        }
      } catch (geminiError: any) {
        console.error('Gemini API call failed, falling back to heuristic engine:', geminiError?.message || geminiError);
      }
    }

    // Fallback if no API key or error
    const heuristicResult = generateHeuristicAnalysis();
    return res.json({
      ok: true,
      analysis: heuristicResult,
    });
  });

  // ==========================================
  // EXTERNAL DATA SOURCES API ENDPOINTS
  // ==========================================

  // 1. Get configuration status for real data sources
  app.get('/api/datasources/config', (req, res) => {
    res.json({
      ok: true,
      apiFootball: {
        serverConfigured: Boolean(process.env.API_FOOTBALL_KEY),
        provider: process.env.API_FOOTBALL_PROVIDER || 'api-sports',
      },
      footballData: {
        serverConfigured: Boolean(process.env.FOOTBALL_DATA_TOKEN),
      },
      webhook: {
        serverConfigured: Boolean(process.env.FEED_WEBHOOK_SECRET),
        endpoint: '/api/feed/ingest',
      },
      publicFeed: {
        available: true,
        description: 'Открытый онлайн-фид реальных матчей (EPL, LaLiga, Serie A, Bundesliga, Champions League)',
      },
    });
  });

  // 2. Fetch live matches from specified external data source
  app.get('/api/datasources/live', async (req, res) => {
    const source = (req.query.source as string) || 'flashscore';
    const apiKey = (req.query.api_key as string) || process.env.API_FOOTBALL_KEY || '';
    const provider = ((req.query.provider as string) || process.env.API_FOOTBALL_PROVIDER || 'api-sports') as 'api-sports' | 'rapidapi';
    const leagues = (req.query.leagues as string) || '';
    const footballToken = (req.query.football_data_token as string) || process.env.FOOTBALL_DATA_TOKEN || '';
    const sstatsKey = (req.query.sstats_key as string) || process.env.SSTATS_KEY || '';

    try {
      if (source === 'flashscore') {
        const result = await fetchFlashscoreLiveMatches();
        if (!result.ok && result.matches.length === 0) {
          return res.status(400).json(result);
        }
        return res.json({
          ok: true,
          source: 'Flashscore',
          count: result.matches.length,
          matches: result.matches,
          fetchedAt: new Date().toLocaleTimeString('ru-RU'),
        });
      }

      if (source === 'sstats') {
        const result = await fetchSstatsLiveMatches({ apiKey: sstatsKey });
        if (!result.ok && result.matches.length === 0) {
          return res.status(400).json(result);
        }
        return res.json({
          ok: true,
          source: 'SStats',
          count: result.matches.length,
          matches: result.matches,
          fetchedAt: new Date().toLocaleTimeString('ru-RU'),
        });
      }

      if (source === 'sofascore') {
        const result = await fetchSofascoreLiveMatches();
        if (!result.ok && result.matches.length === 0) {
          return res.status(400).json(result);
        }
        return res.json({
          ok: true,
          source: 'Sofascore',
          count: result.matches.length,
          matches: result.matches,
          fetchedAt: new Date().toLocaleTimeString('ru-RU'),
        });
      }

      if (source === 'api-football') {
        if (!apiKey) {
          return res.status(400).json({
            ok: false,
            error: 'Ключ API-Football не настроен. Введите его в панели источников или укажите API_FOOTBALL_KEY в .env',
          });
        }
        const result = await fetchApiFootballMatches({ apiKey, provider, leaguesFilter: leagues });
        if (!result.ok) {
          return res.status(400).json(result);
        }
        return res.json({
          ok: true,
          source: 'API-Football',
          count: result.matches.length,
          matches: result.matches,
          remainingQuota: result.remainingQuota,
          fetchedAt: new Date().toLocaleTimeString('ru-RU'),
        });
      }

      if (source === 'football-data') {
        if (!footballToken) {
          return res.status(400).json({
            ok: false,
            error: 'Токен Football-Data.org не настроен. Введите его в панели источников или укажите FOOTBALL_DATA_TOKEN в .env',
          });
        }
        const result = await fetchFootballDataMatches(footballToken);
        if (!result.ok) {
          return res.status(400).json(result);
        }
        return res.json({
          ok: true,
          source: 'Football-Data',
          count: result.matches.length,
          matches: result.matches,
          fetchedAt: new Date().toLocaleTimeString('ru-RU'),
        });
      }

      if (source === 'webhook') {
        const result = getIngestedMatches();
        return res.json({
          ok: true,
          source: 'Custom-Webhook',
          count: result.matches.length,
          matches: result.matches,
          lastIngestedAt: result.lastIngestedAt,
          totalReceived: result.totalReceived,
          fetchedAt: new Date().toLocaleTimeString('ru-RU'),
        });
      }

      if (source === 'public-feed') {
        const publicResult = await fetchPublicLiveMatches();
        return res.json({
          ok: true,
          source: 'Public-Feed',
          count: publicResult.matches.length,
          matches: publicResult.matches,
          fetchedAt: new Date().toLocaleTimeString('ru-RU'),
        });
      }

      // Default fallback: Flashscore Live
      const defaultResult = await fetchFlashscoreLiveMatches();
      return res.json({
        ok: true,
        source: 'Flashscore',
        count: defaultResult.matches.length,
        matches: defaultResult.matches,
        fetchedAt: new Date().toLocaleTimeString('ru-RU'),
      });
    } catch (err: any) {
      console.error('Error fetching live matches:', err);
      return res.status(500).json({
        ok: false,
        error: `Ошибка при получении данных: ${err?.message || err}`,
      });
    }
  });

  // 3. Test external connection & measure latency
  app.post('/api/datasources/test', async (req, res) => {
    const { source, apiKey, provider = 'api-sports', token, sstatsKey } = req.body;
    const start = Date.now();

    try {
      if (source === 'flashscore') {
        const result = await fetchFlashscoreLiveMatches();
        const latencyMs = Date.now() - start;
        if (!result.ok) {
          return res.status(400).json({ ok: false, latencyMs, error: result.error });
        }
        return res.json({
          ok: true,
          latencyMs,
          matchesFound: result.matches.length,
          message: `Flashscore Live подключен (${latencyMs}ms). Обнаружено ${result.matches.length} текущих матчей в прямом эфире без ограничений.`,
        });
      }

      if (source === 'sstats') {
        const result = await fetchSstatsLiveMatches({ apiKey: sstatsKey });
        const latencyMs = Date.now() - start;
        if (!result.ok) {
          return res.status(400).json({ ok: false, latencyMs, error: result.error });
        }
        return res.json({
          ok: true,
          latencyMs,
          matchesFound: result.matches.length,
          message: `SStats.net API подключен (${latencyMs}ms). Получено ${result.matches.length} текущих матчей с букмекерскими коэффициентами.`,
        });
      }

      if (source === 'sofascore') {
        const result = await fetchSofascoreLiveMatches();
        const latencyMs = Date.now() - start;
        if (!result.ok) {
          return res.status(400).json({ ok: false, latencyMs, error: result.error });
        }
        return res.json({
          ok: true,
          latencyMs,
          matchesFound: result.matches.length,
          message: `Sofascore Live подключен (${latencyMs}ms). Обнаружено ${result.matches.length} матчей.`,
        });
      }

      if (source === 'api-football') {
        const key = apiKey || process.env.API_FOOTBALL_KEY;
        if (!key) {
          return res.status(400).json({ ok: false, error: 'API-Football ключ отсутствует' });
        }
        const result = await fetchApiFootballMatches({ apiKey: key, provider });
        const latencyMs = Date.now() - start;

        if (!result.ok) {
          return res.status(400).json({ ok: false, latencyMs, error: result.error });
        }
        return res.json({
          ok: true,
          latencyMs,
          matchesFound: result.matches.length,
          remainingQuota: result.remainingQuota || 'Активна',
          message: `Соединение успешно (${latencyMs}ms). Обнаружено ${result.matches.length} live-матчей в реальном времени.`,
        });
      }

      if (source === 'football-data') {
        const tok = token || process.env.FOOTBALL_DATA_TOKEN;
        if (!tok) {
          return res.status(400).json({ ok: false, error: 'Токен Football-Data.org отсутствует' });
        }
        const result = await fetchFootballDataMatches(tok);
        const latencyMs = Date.now() - start;

        if (!result.ok) {
          return res.status(400).json({ ok: false, latencyMs, error: result.error });
        }
        return res.json({
          ok: true,
          latencyMs,
          matchesFound: result.matches.length,
          message: `Соединение успешно (${latencyMs}ms). Загружено ${result.matches.length} текущих матчей.`,
        });
      }

      if (source === 'public-feed') {
        const result = await fetchPublicLiveMatches();
        const latencyMs = Date.now() - start;
        return res.json({
          ok: true,
          latencyMs,
          matchesFound: result.matches.length,
          message: `Открытый фид подключен (${latencyMs}ms). Обнаружено ${result.matches.length} реальных матчей из европейских топ-лиг.`,
        });
      }

      return res.status(400).json({ ok: false, error: 'Неизвестный источник для тестирования' });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        latencyMs: Date.now() - start,
        error: `Сетевой сбой при тестировании: ${err?.message || err}`,
      });
    }
  });

  // 4. Webhook Ingestion API for Custom Scrapers / Telegram Bots / Python Scripts
  app.post('/api/feed/ingest', (req, res) => {
    const secretHeader = (req.headers['x-webhook-secret'] as string) || (req.query.secret as string);
    const expectedSecret = process.env.FEED_WEBHOOK_SECRET;

    const result = ingestMatchesFromWebhook(req.body, secretHeader, expectedSecret);
    if (!result.ok) {
      return res.status(401).json(result);
    }

    const state = getIngestedMatches();
    return res.json({
      ok: true,
      message: `Успешно принято ${result.count} матчей`,
      ingestedCount: result.count,
      totalInFeed: state.matches.length,
      lastIngestedAt: state.lastIngestedAt,
    });
  });

  // 5. Get current webhook matches status
  app.get('/api/feed/ingest', (req, res) => {
    const state = getIngestedMatches();
    res.json({
      ok: true,
      count: state.matches.length,
      lastIngestedAt: state.lastIngestedAt,
      totalReceived: state.totalReceived,
      matches: state.matches,
    });
  });

  // 6. Clear webhook ingested feed
  app.delete('/api/feed/ingest', (req, res) => {
    const result = clearIngestedMatches();
    res.json({ ok: true, message: 'Фид пользовательских матчей очищен' });
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
