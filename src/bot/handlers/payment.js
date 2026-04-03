const { Markup } = require('telegraf');
const paymentService = require('../../services/paymentService');
const { MESSAGES, PAYMENT_PACKAGES } = require('../../config/constants');
const logger = require('../../utils/logger');

// Step 1: show payment methods
async function showPaymentMethods(ctx, message) {
  const text = message || MESSAGES.LIMIT_REACHED;
  await ctx.reply(text, Markup.inlineKeyboard([
    [Markup.button.callback('\u2b50 Telegram Stars', 'pay_method_stars')]
  ]));
}

// Step 2: method selected, show packages
async function handleMethodSelection(ctx) {
  const method = ctx.callbackQuery.data.replace('pay_method_', '');
  logger.info('Payment method selected', { method, userId: ctx.from.id });

  const buttons = PAYMENT_PACKAGES.map((pkg, index) => [
    Markup.button.callback(
      pkg.requests + ' \u0437\u0430\u043f\u0440\u043e\u0441\u043e\u0432 \u2014 \u2b50 ' + pkg.price,
      'pay_' + method + '_' + index
    )
  ]);

  await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
    ...buttons,
    [Markup.button.callback('\u2190 \u041d\u0430\u0437\u0430\u0434', 'pay_back')]
  ]).reply_markup);

  await ctx.answerCbQuery();
}

// Step 3: package selected, send Stars invoice
async function handleStarsPackageSelection(ctx) {
  const parts = ctx.callbackQuery.data.split('_');
  const packageIndex = parseInt(parts[2], 10);
  const userId = ctx.from.id;

  if (isNaN(packageIndex) || packageIndex < 0 || packageIndex >= PAYMENT_PACKAGES.length) {
    await ctx.answerCbQuery('Invalid package');
    return;
  }

  logger.info('Stars package selected', { packageIndex, userId });
  const invoiceData = paymentService.createInvoice(packageIndex);

  await ctx.replyWithInvoice({
    title: invoiceData.title,
    description: invoiceData.description,
    payload: invoiceData.payload,
    provider_token: '',
    currency: 'XTR',
    prices: invoiceData.prices,
    need_name: false,
    need_phone_number: false,
    need_email: false,
    need_shipping_address: false,
    is_flexible: false
  });

  await ctx.answerCbQuery();
  logger.info('Stars invoice sent', { userId, packageIndex });
}

// Back to method selection
async function handlePayBack(ctx) {
  await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
    [Markup.button.callback('\u2b50 Telegram Stars', 'pay_method_stars')]
  ]).reply_markup);
  await ctx.answerCbQuery();
}

// Pre-checkout handler
async function handlePreCheckout(ctx) {
  try {
    const payload = ctx.preCheckoutQuery.invoice_payload;
    logger.info('Pre-checkout query', { userId: ctx.from.id, payload });
    const payloadData = JSON.parse(payload);
    if (typeof payloadData.packageIndex !== 'number' || typeof payloadData.requests !== 'number') {
      await ctx.answerPreCheckoutQuery(false, 'Invalid payment data');
      return;
    }
    await ctx.answerPreCheckoutQuery(true);
  } catch (error) {
    logger.error('Error in handlePreCheckout', { error: error.message });
    await ctx.answerPreCheckoutQuery(false, 'Payment processing error');
  }
}

// Successful payment handler
async function handleSuccessfulPayment(ctx) {
  try {
    const userId = ctx.from.id;
    const payment = ctx.message.successful_payment;
    const payloadData = JSON.parse(payment.invoice_payload);
    const packageData = PAYMENT_PACKAGES[payloadData.packageIndex];

    logger.info('Successful payment', { userId, totalAmount: payment.total_amount });

    const updatedUser = await paymentService.processPayment(userId, payment.invoice_payload);

    await paymentService.saveTransaction(
      userId,
      payment.total_amount,
      payment.currency,
      payloadData.requests,
      'telegram_stars',
      payment.telegram_payment_charge_id
    );

    await ctx.reply(
      MESSAGES.PAYMENT_SUCCESS + '\n\n' +
      '\u2b50 ' + payloadData.requests + ' requests added\n' +
      'Total purchased: ' + updatedUser.purchased_requests
    );
  } catch (error) {
    logger.error('Error in handleSuccessfulPayment', { error: error.message });
    await ctx.reply('Payment error. Please contact support.');
  }
}

module.exports = {
  showPaymentMethods,
  handleMethodSelection,
  handleStarsPackageSelection,
  handlePayBack,
  handlePreCheckout,
  handleSuccessfulPayment
};
