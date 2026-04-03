/**
 * Обработчик платежей
 */

const { Markup } = require('telegraf');
const paymentService = require('../../services/paymentService');
const userService = require('../../services/userService');
const { MESSAGES, PAYMENT_PACKAGES } = require('../../config/constants');
const logger = require('../../utils/logger');

/**
 * Обработчик выбора пакета запросов через callback_query
 * @param {Object} ctx - Контекст Telegraf
 */
async function handlePackageSelection(ctx) {
  try {
    const callbackData = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    // Парсим callback_data для получения индекса пакета (формат: "buy_0", "buy_1", "buy_2")
    const packageIndex = parseInt(callbackData.split('_')[1], 10);

    if (isNaN(packageIndex) || packageIndex < 0 || packageIndex >= PAYMENT_PACKAGES.length) {
      await ctx.answerCbQuery('❌ Некорректный пакет');
      return;
    }

    logger.info(`User ${userId} selected package ${packageIndex}`);

    // Создаем инвойс через PaymentService
    const invoiceData = paymentService.createInvoice(packageIndex);

    // Отправляем инвойс через Telegram Payments API (Stars)
    await ctx.replyWithInvoice({
      title: invoiceData.title,
      description: invoiceData.description,
      payload: invoiceData.payload,
      provider_token: '', // Для Telegram Stars provider_token не нужен
      currency: invoiceData.currency,
      prices: invoiceData.prices,
      start_parameter: `package_${packageIndex}`,
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false,
      is_flexible: false
    });

    await ctx.answerCbQuery();

    logger.info(`Invoice sent to user ${userId} for package ${packageIndex}`);

  } catch (error) {
    logger.error('Error in handlePackageSelection', {
      userId: ctx.from?.id,
      callbackData: ctx.callbackQuery?.data,
      error: error.message,
      stack: error.stack
    });

    await ctx.answerCbQuery('❌ Ошибка при создании платежа');
    await ctx.reply(MESSAGES.ERROR);
  }
}

/**
 * Обработчик pre_checkout_query (предварительная проверка платежа)
 * @param {Object} ctx - Контекст Telegraf
 */
async function handlePreCheckout(ctx) {
  try {
    const userId = ctx.from.id;
    const payload = ctx.preCheckoutQuery.invoice_payload;

    logger.info(`Pre-checkout query from user ${userId}`, { payload });

    // Валидируем payload
    try {
      const payloadData = JSON.parse(payload);
      if (!payloadData.packageIndex && payloadData.packageIndex !== 0) {
        throw new Error('Invalid payload structure');
      }
    } catch (parseError) {
      logger.error('Invalid payload in pre-checkout', { payload, error: parseError.message });
      await ctx.answerPreCheckoutQuery(false, 'Некорректные данные платежа');
      return;
    }

    // Подтверждаем платеж
    await ctx.answerPreCheckoutQuery(true);

    logger.info(`Pre-checkout approved for user ${userId}`);

  } catch (error) {
    logger.error('Error in handlePreCheckout', {
      userId: ctx.from?.id,
      error: error.message,
      stack: error.stack
    });

    await ctx.answerPreCheckoutQuery(false, 'Ошибка при обработке платежа');
  }
}

/**
 * Обработчик successful_payment (успешный платеж)
 * @param {Object} ctx - Контекст Telegraf
 */
async function handleSuccessfulPayment(ctx) {
  try {
    const userId = ctx.from.id;
    const payment = ctx.message.successful_payment;
    const payload = payment.invoice_payload;

    logger.info(`Successful payment from user ${userId}`, {
      totalAmount: payment.total_amount,
      currency: payment.currency,
      payload
    });

    // Обрабатываем платеж через PaymentService
    const updatedUser = await paymentService.processPayment(userId, payload);

    // Получаем данные пакета для сохранения транзакции
    const payloadData = JSON.parse(payload);
    const packageData = PAYMENT_PACKAGES[payloadData.packageIndex];

    // Сохраняем транзакцию через PaymentService
    await paymentService.saveTransaction(
      userId,
      payment.total_amount, // Stars передаются как есть, без деления
      payment.currency,
      payloadData.requests,
      'telegram_stars',
      payment.telegram_payment_charge_id
    );

    // Отправляем подтверждение пользователю
    const confirmationMessage = `${MESSAGES.PAYMENT_SUCCESS}\n\n` +
      `⭐ Оплачено: ${packageData.price} звёзд\n` +
      `📊 Добавлено запросов: ${payloadData.requests}\n` +
      `💳 Всего купленных запросов: ${updatedUser.purchased_requests}`;

    await ctx.reply(confirmationMessage);

    logger.info(`Payment processed successfully for user ${userId}`, {
      requestsAdded: payloadData.requests,
      totalPurchasedRequests: updatedUser.purchased_requests
    });

  } catch (error) {
    logger.error('Error in handleSuccessfulPayment', {
      userId: ctx.from?.id,
      error: error.message,
      stack: error.stack
    });

    await ctx.reply('❌ Ошибка при обработке платежа. Обратитесь в поддержку.');
  }
}

/**
 * Показать кнопки для покупки запросов
 * @param {Object} ctx - Контекст Telegraf
 * @param {string} message - Сообщение для отображения
 */
async function showPaymentButtons(ctx, message = null) {
  try {
    const displayMessage = message || MESSAGES.LIMIT_REACHED;

    const buttons = PAYMENT_PACKAGES.map((pkg, index) => 
      Markup.button.callback(
        `${pkg.requests} запросов — ⭐ ${pkg.price}`,
        `buy_${index}`
      )
    );

    await ctx.reply(
      displayMessage,
      Markup.inlineKeyboard(buttons, { columns: 1 })
    );

  } catch (error) {
    logger.error('Error in showPaymentButtons', {
      userId: ctx.from?.id,
      error: error.message
    });

    await ctx.reply(MESSAGES.ERROR);
  }
}

module.exports = {
  handlePackageSelection,
  handlePreCheckout,
  handleSuccessfulPayment,
  showPaymentButtons
};