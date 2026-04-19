/**
 * Обработчик добавления еды через текст
 */

const { Markup } = require('telegraf');
const requestService = require('../../services/requestService');
const profileService = require('../../services/profileService');
const openaiService = require('../../services/openai');
const dailyReportsQueries = require('../../database/queries/dailyReports');
const { formatNutritionData } = require('../../utils/formatter');
const logger = require('../../utils/logger');

/**
 * Парсинг текста для извлечения названия еды и веса
 * Примеры:
 * "Куриная грудка 200г" -> { food: "Куриная грудка", weight: 200 }
 * "Рис 150" -> { food: "Рис", weight: 150 }
 * "Яблоко 100 грамм" -> { food: "Яблоко", weight: 100 }
 */
function parseFoodText(text) {
  // Убираем лишние пробелы
  text = text.trim();
  
  // Паттерны для поиска веса
  const patterns = [
    /^(.+?)\s+(\d+)\s*г(?:рамм)?$/i,  // "Еда 200г" или "Еда 200 грамм"
    /^(.+?)\s+(\d+)$/,                 // "Еда 200"
    /^(\d+)\s*г(?:рамм)?\s+(.+)$/i,   // "200г Еда"
    /^(\d+)\s+(.+)$/                   // "200 Еда"
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Определяем порядок (еда-вес или вес-еда)
      if (pattern.source.startsWith('^(.+?)')) {
        // Еда идет первой
        return {
          food: match[1].trim(),
          weight: parseInt(match[2])
        };
      } else {
        // Вес идет первым
        return {
          food: match[2].trim(),
          weight: parseInt(match[1])
        };
      }
    }
  }
  
  return null;
}

/**
 * Проверка, является ли текст описанием еды
 */
function isFoodText(text) {
  if (!text || text.length < 3 || text.length > 200) {
    return false;
  }
  
  // Проверяем наличие цифр (вес)
  if (!/\d+/.test(text)) {
    return false;
  }
  
  // Если несколько строк - обрабатываем только первую
  const firstLine = text.split('\n')[0].trim();
  
  // Пытаемся распарсить первую строку
  const parsed = parseFoodText(firstLine);
  return parsed !== null && parsed.weight > 0 && parsed.weight < 5000;
}

/**
 * Обработка добавления еды через текст
 */
async function handleTextFood(ctx) {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  
  try {
    // Разбиваем на строки и обрабатываем каждую
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return false;
    }
    
    // Парсим все строки
    const parsedItems = [];
    for (const line of lines) {
      const parsed = parseFoodText(line);
      if (parsed) {
        parsedItems.push(parsed);
      }
    }
    
    if (parsedItems.length === 0) {
      return false; // Ни одна строка не распарсилась
    }
    
    logger.info('Text food parsed', { 
      userId, 
      itemsCount: parsedItems.length,
      items: parsedItems
    });
    
    // Отправляем сообщение о начале обработки
    const processingMsg = await ctx.reply(`⏳ Анализирую ${parsedItems.length} ${parsedItems.length === 1 ? 'блюдо' : 'блюда'}...`);
    
    const results = [];
    
    // Обрабатываем каждое блюдо
    for (const item of parsedItems) {
      try {
        // Проверяем лимиты
        const requestResult = await requestService.consumeRequestAtomic(userId);
        
        if (!requestResult.allowed) {
          results.push({
            success: false,
            food: item.food,
            error: 'Лимит запросов исчерпан'
          });
          break; // Прерываем обработку остальных
        }
        
        // Анализируем через OpenAI
        const nutritionData = await openaiService.analyzeFoodByText(item.food, item.weight);
        
        // Сохраняем результат
        const savedRequest = await requestService.saveRequest(
          userId,
          null, // нет photo_file_id
          nutritionData,
          item.weight
        );
        
        results.push({
          success: true,
          food: item.food,
          weight: item.weight,
          nutritionData,
          requestId: savedRequest.id
        });
        
      } catch (error) {
        logger.error('Error processing food item', {
          userId,
          food: item.food,
          error: error.message
        });
        
        results.push({
          success: false,
          food: item.food,
          error: error.message
        });
      }
    }
    
    // Обновляем дневной отчет
    await dailyReportsQueries.getOrCreateDailyReport(userId);
    await dailyReportsQueries.updateConsumedValues(userId);
    
    // Удаляем сообщение "Анализирую..."
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
    } catch (e) {
      // Игнорируем ошибку удаления
    }
    
    // Формируем ответ
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (successCount === 0) {
      await ctx.reply('❌ Не удалось обработать ни одно блюдо.');
      return true;
    }
    
    // Проверяем наличие профиля для показа прогресса
    const profile = await profileService.getProfile(userId);
    
    // Отправляем результаты
    for (const result of results) {
      if (result.success) {
        let message = formatNutritionData(result.nutritionData);
        
        // Добавляем информацию о прогрессе, если есть профиль
        if (profile && profile.target_calories) {
          const percentage = ((result.nutritionData.calories / profile.target_calories) * 100).toFixed(1);
          const remaining = profile.target_calories - result.nutritionData.calories;
          
          message += `\n\n📊 <b>Прогресс по цели:</b>\n`;
          message += `🎯 Цель: ${profile.target_calories} ккал/день\n`;
          message += `📈 Это блюдо: ${percentage}% от дневной нормы\n`;
          
          if (remaining > 0) {
            message += `✅ Осталось: ${remaining.toFixed(0)} ккал`;
          } else {
            message += `⚠️ Превышение: ${Math.abs(remaining).toFixed(0)} ккал`;
          }
        }
        
        await ctx.reply(
          message,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              Markup.button.callback('✏️ Корректировать', `correct_${result.requestId}`)
            ])
          }
        );
      } else {
        await ctx.reply(`❌ ${result.food}: ${result.error}`);
      }
    }
    
    // Итоговое сообщение
    if (results.length > 1) {
      let summary = `\n✅ Обработано: ${successCount}`;
      if (failCount > 0) {
        summary += `\n❌ Ошибок: ${failCount}`;
      }
      await ctx.reply(summary);
    }
    
    logger.info('Text food batch processed', {
      userId,
      total: results.length,
      success: successCount,
      failed: failCount
    });
    
    return true;
    
  } catch (error) {
    logger.error('Error in handleTextFood', {
      userId,
      text,
      error: error.message,
      stack: error.stack
    });
    
    await ctx.reply('❌ Произошла ошибка при анализе. Попробуйте еще раз.');
    return true;
  }
}

module.exports = {
  parseFoodText,
  isFoodText,
  handleTextFood
};
