import { Match } from '../types';
import { calculatePressureAnalysis } from '../algorithms';
import { getMatchTeamCodes } from './teamCodes';

export interface CanvasShareResultOptions {
  watermarkText?: string;
  telegramChannel?: string;
}

/**
 * Generates a branded, high-resolution social share card for a live or finished match
 * using the HTML5 Canvas 2D API.
 * Output resolution: 1200 x 675 (standard 16:9 social share ratio)
 */
export async function generateMatchResultCanvas(
  match: Match,
  options: CanvasShareResultOptions = {}
): Promise<{ dataUrl: string; blob: Blob | null }> {
  const width = 1200;
  const height = 675;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const { homeCode, awayCode, matchCode } = getMatchTeamCodes(match);
  const pressure = calculatePressureAnalysis(match);

  // 1. Base Dark Background with subtle gradients
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#030712'); // Gray 950
  bgGrad.addColorStop(0.5, '#090d1a'); // Dark slate navy
  bgGrad.addColorStop(1, '#020617'); // Slate 950
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Glow Spheres
  // Emerald glow top-left
  const glow1 = ctx.createRadialGradient(150, 100, 10, 150, 100, 380);
  glow1.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
  glow1.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = glow1;
  ctx.beginPath();
  ctx.arc(150, 100, 380, 0, Math.PI * 2);
  ctx.fill();

  // Cyan glow bottom-right
  const glow2 = ctx.createRadialGradient(width - 150, height - 100, 10, width - 150, height - 100, 380);
  glow2.addColorStop(0, 'rgba(6, 182, 212, 0.16)');
  glow2.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = glow2;
  ctx.beginPath();
  ctx.arc(width - 150, height - 100, 380, 0, Math.PI * 2);
  ctx.fill();

  // 3. Decorative subtle field grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 60; x < width; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, height - 40);
    ctx.stroke();
  }

  // 4. Outer Border Frame
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, 30, 30, width - 60, height - 60, 24);
  ctx.stroke();

  // 5. Header: Branding and League
  // Top brand badge
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('⚽ FOOTBALMONITOR PRO • LIVE TELEMETRY', 60, 75);

  // Match ID & Code
  ctx.fillStyle = '#64748b';
  ctx.font = '14px monospace';
  ctx.fillText(`ID: #${match.id} | ${matchCode}`, 60, 100);

  // League & Country (top right)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${match.countryCode || ''} ${match.country} • ${match.league}`, width - 60, 75);

  // Match Status Badge (top right pill)
  const statusX = width - 60;
  const statusY = 94;
  const isLive = match.status === 'LIVE' || match.status === 'HT';
  ctx.fillStyle = isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)';
  roundRect(ctx, statusX - 140, statusY - 14, 140, 28, 14);
  ctx.fill();
  ctx.strokeStyle = isLive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(56, 189, 248, 0.5)';
  ctx.stroke();

  // Status text inside pill
  ctx.fillStyle = isLive ? '#34d399' : '#38bdf8';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const statusLabel = match.status === 'LIVE' ? `🔴 LIVE ${match.minute}'` : match.status === 'HT' ? '⏸️ HT' : match.status === 'FT' ? '🏁 FT' : `⏳ PRE ${match.startsInMinutes || 60}m`;
  ctx.fillText(statusLabel, statusX - 70, statusY + 5);

  // 6. Main Center Stage: Teams & Score Box
  const stageY = 250;

  // Home Team (Left aligned from center)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const truncatedHome = fitText(ctx, match.homeTeam, 360);
  ctx.fillText(truncatedHome, width / 2 - 130, stageY - 10);

  // Home Team Code Badge
  ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
  roundRect(ctx, width / 2 - 200, stageY + 10, 70, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(homeCode, width / 2 - 165, stageY + 28);

  // Score Box (Center)
  const scoreBoxWidth = 200;
  const scoreBoxHeight = 110;
  const scoreBoxX = width / 2 - scoreBoxWidth / 2;
  const scoreBoxY = stageY - 65;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Score Numbers
  ctx.textAlign = 'center';
  ctx.fillStyle = '#10b981';
  ctx.font = '900 68px monospace';
  const scoreDisplay = match.status === 'PREMATCH' ? '- : -' : `${match.score[0]} : ${match.score[1]}`;
  ctx.fillText(scoreDisplay, width / 2, stageY + 16);

  // Away Team (Right aligned from center)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const truncatedAway = fitText(ctx, match.awayTeam, 360);
  ctx.fillText(truncatedAway, width / 2 + 130, stageY - 10);

  // Away Team Code Badge
  ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
  roundRect(ctx, width / 2 + 130, stageY + 10, 70, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(awayCode, width / 2 + 165, stageY + 28);

  // 7. Key Telemetry Stat Cards Grid (Bottom)
  const cardY = 380;
  const cardWidth = 250;
  const cardHeight = 115;
  const gap = 30;
  const totalGridWidth = 4 * cardWidth + 3 * gap;
  const startX = (width - totalGridWidth) / 2;

  const statMetrics = [
    {
      title: 'ОЖИДАЕМЫЕ ГОЛЫ (xG)',
      val: `${match.stats.xg[0].toFixed(2)} - ${match.stats.xg[1].toFixed(2)}`,
      sub: `Сумма: ${(match.stats.xg[0] + match.stats.xg[1]).toFixed(2)} xG`,
      color: '#34d399',
    },
    {
      title: 'ОПАСНЫЕ АТАКИ (DA)',
      val: `${match.stats.dangerousAttacks[0]} - ${match.stats.dangerousAttacks[1]}`,
      sub: `Разница: ${Math.abs(match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1])} DA`,
      color: '#38bdf8',
    },
    {
      title: 'УДАРЫ В СТВОР / УГЛОВЫЕ',
      val: `${match.stats.shotsOnTarget[0]}:${match.stats.shotsOnTarget[1]} / ${match.stats.corners[0] + match.stats.corners[1]} угр`,
      sub: `Всего угловых: ${match.stats.corners[0] + match.stats.corners[1]}`,
      color: '#f59e0b',
    },
    {
      title: 'ИНДЕКС ДАВЛЕНИЯ',
      val: `${pressure.pressureIndex}%`,
      sub: pressure.goalProbability === 'EXTREME' ? '🔥 Гол назревает' : '📊 Контроль темпа',
      color: pressure.pressureIndex >= 70 ? '#f43f5e' : '#a855f7',
    },
  ];

  statMetrics.forEach((m, i) => {
    const x = startX + i * (cardWidth + gap);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    roundRect(ctx, x, cardY, cardWidth, cardHeight, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Metric title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.title, x + cardWidth / 2, cardY + 28);

    // Metric value
    ctx.fillStyle = m.color;
    ctx.font = '900 24px monospace';
    ctx.fillText(m.val, x + cardWidth / 2, cardY + 68);

    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.sub, x + cardWidth / 2, cardY + 95);
  });

  // 8. Footer Watermark & Timestamp
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const channel = options.telegramChannel || 't.me/footbalmonitor';
  ctx.fillText(`⚡ Footbalmonitor Pro In-Play Engine • Канал сигналов: ${channel}`, 60, height - 55);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';
  ctx.font = '12px monospace';
  const genTime = new Date().toLocaleString('ru-RU');
  ctx.fillText(`Создано: ${genTime}`, width - 60, height - 55);

  // Export to Data URL and Blob
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

  return { dataUrl, blob };
}

/**
 * Helper to draw rounded rectangle on Canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Truncates text with ellipsis if it exceeds maxWidth
 */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let len = text.length;
  while (len > 3 && ctx.measureText(text.slice(0, len) + '…').width > maxWidth) {
    len--;
  }
  return text.slice(0, len) + '…';
}
