/**
 * Обработчик команды /status
 */

const userService = require('../../services/userService');
const profileService = require('../../services/profileService');
const { formatUserStats } = require('../../utils/formatter');
const { MESSAGES } = require('../../config/constants');
const logger = require('../../utils/logger');

/**
 * Обработчик команды /status
 * @param {Object} ctx - Контекст Telegraf
 */
async function statusHandler(ctx) {
  try {
    const userId = ctx.from.id;

    logger.info(`User ${userId} requested status`);

    // Получаем статистику пользователя через UserService
    const stats = await userService.getUserStats(userId);

    // Проверяем наличие профиля
    const profile = await profileService.getProfile(userId);

    // Форматируем и отправляем сообщение
    let message = formatUserStats(stats);
    
    // Добавляем информацию о профиле, если он есть
    if (profile) {
      const goalSource = profile.is_manual_goal ? 'установлена вручную' : 'рассчитана автоматически';
      message += `\n\n👤 <b>Профиль:</b>\n`;
      message += `🎯 Цель калорий: ${profile.calorie_goal} ккал/день (${goalSource})\n`;
      message += `\n💡 Используйте /profile для управления профилем`;
    } else {
      message += `\n\n💡 Создайте профиль командой /profile для расчета нормы калорий`;
    }

    await ctx.reply(message, { parse_mode: 'HTML' });

  } catch (error) {
    logger.error('Error in statusHandler', {
      userId: ctx.from?.id,
      error: error.message,
      stack: error.stack
    });
    await ctx.reply(MESSAGES.ERROR);
  }
}

module.exports = statusHandler;
