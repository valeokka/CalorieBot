# Implementation Plan

- [x] 1. Инициализация проекта и настройка окружения






  - [x] 1.1 Создать структуру директорий проекта

    - Создать директории: src/bot, src/services, src/database, src/utils, src/config
    - Создать поддиректории: src/bot/handlers, src/bot/middleware, src/database/migrations, src/database/queries
    - _Requirements: 4.1, 10.4_
  

  - [x] 1.2 Инициализировать npm проект и установить зависимости

    - Выполнить npm init для создания package.json
    - Установить основные зависимости: telegraf, pg, openai, dotenv, winston
    - Добавить скрипты в package.json: start, dev, migrate
    - _Requirements: 4.1, 10.4_
  

  - [x] 1.3 Создать конфигурационные файлы

    - Создать .env.example с шаблоном переменных окружения (BOT_TOKEN, OPENAI_API_KEY, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, PAYMENT_PROVIDER_TOKEN)
    - Создать .gitignore для исключения node_modules, .env, logs
    - _Requirements: 4.1, 10.4_

- [x] 2. Настройка базы данных







  - [x] 2.1 Создать SQL миграцию для инициализации схемы


    - Написать src/database/migrations/init.sql с таблицами user_classes, users, requests_history, transactions
    - Добавить начальные данные для user_classes (FREE с daily_limit=1, PREMIUM с daily_limit=NULL, ADMIN с daily_limit=NULL)
    - Создать индексы: idx_users_class, idx_requests_user_date, idx_requests_created_at, idx_transactions_user
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  

  - [x] 2.2 Создать модуль подключения к PostgreSQL



    - Реализовать src/database/connection.js с пулом соединений pg.Pool
    - Настроить параметры пула: max=20, idleTimeoutMillis=30000, connectionTimeoutMillis=2000
    - Добавить обработку ошибок подключения через pool.on('error')
    - _Requirements: 10.4_
  
  - [x] 2.3 Реализовать SQL запросы для работы с данными


    - Создать src/database/queries/users.js с запросами: getUser, createUser, updatePurchasedRequests, getUserWithClass
    - Создать src/database/queries/requests.js с запросами: createRequest, updateRequest, getTodayRequestCount, getRequestById
    - Создать src/database/queries/classes.js с запросами: getClassById, getClassByName
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3. Реализация утилит и вспомогательных модулей






  - [x] 3.1 Создать файл констант

    - Реализовать src/config/constants.js с константами: USER_CLASSES, PAYMENT_PACKAGES, OPENAI (timeout, retries), MESSAGES
    - Определить пакеты оплаты: 10 запросов за 99 RUB, 50 за 399 RUB, 100 за 699 RUB
    - _Requirements: 6.1, 7.2, 7.3, 7.4, 7.5_
  

  - [x] 3.2 Создать модуль логирования

    - Реализовать src/utils/logger.js с использованием winston
    - Настроить транспорты: Console и File (error.log, combined.log)
    - Настроить форматы: timestamp, json для файлов, colorize для консоли
    - _Requirements: 10.1, 10.5_
  
  - [x] 3.3 Создать модуль валидации


    - Реализовать src/utils/validator.js с функциями: isPositiveNumber, validateNutritionValue
    - Добавить валидацию для корректировки результатов (калории, белки, жиры, углеводы)
    - _Requirements: 3.3, 3.5_
  

  - [x] 3.4 Создать модуль форматирования сообщений

    - Реализовать src/utils/formatter.js с функциями: formatNutritionData, formatUserStats
    - Добавить эмодзи для визуального оформления (🍽️, 🔥, 🥩, 🧈, 🍞)
    - Форматировать числа с округлением до 1 десятичного знака
    - _Requirements: 1.4_

- [x] 4. Реализация сервисного слоя




  - [x] 4.1 Создать UserService


    - Реализовать src/services/userService.js с методами: getOrCreateUser, getUserClass, updatePurchasedRequests, getUserStats
    - В getOrCreateUser: если пользователь не существует, создать с user_class_id=1 (FREE), purchased_requests=0
    - В getUserStats: вернуть класс, использованные запросы за день, оставшиеся лимиты, purchased_requests
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.3, 9.1, 9.2, 9.3, 9.4_
  
  - [x] 4.2 Создать RequestService


    - Реализовать src/services/requestService.js с методами: canMakeRequest, saveRequest, updateRequest, getTodayRequestCount, decrementPurchasedRequest
    - В canMakeRequest: проверить daily_limit класса, если NULL - разрешить, если в пределах лимита - разрешить, иначе проверить purchased_requests
    - При использовании purchased_requests вызывать decrementPurchasedRequest
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 4.3 Создать OpenAIService


    - Реализовать src/services/openai.js с методом analyzeFood(photoUrl, weight)
    - Создать промпт для ChatGPT Vision API: анализ блюда, возврат JSON с dishName, calories, protein, fat, carbs
    - Если weight указан, включить в промпт для расчета на указанный вес
    - Реализовать retry логику с экспоненциальной задержкой (2 попытки)
    - Установить таймаут 30 секунд
    - Обрабатывать ошибки API и возвращать понятные сообщения
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 2.4, 10.1, 10.2, 10.3_
  
  - [x] 4.4 Создать PaymentService





    - Реализовать src/services/paymentService.js с методами: createInvoice, processPayment, saveTransaction
    - В createInvoice: использовать PAYMENT_PACKAGES из constants
    - В processPayment: обновить purchased_requests через UserService
    - В saveTransaction: сохранить запись в таблицу transactions
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 5. Реализация middleware для бота




  - [x] 5.1 Создать auth middleware


    - Реализовать src/bot/middleware/auth.js для автоматической регистрации пользователей
    - При каждом запросе вызывать userService.getOrCreateUser(ctx.from.id)
    - Сохранить объект пользователя в ctx.state.user для использования в обработчиках
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Создать rate limit middleware


    - Реализовать src/bot/middleware/rateLimit.js для проверки лимитов перед обработкой фото
    - Применять только к обработчику фотографий (не к командам)
    - Интегрировать с requestService.canMakeRequest
    - Если лимит исчерпан, отправить сообщение с кнопками покупки и прервать обработку
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [-] 6. Реализация обработчиков команд и событий














  - [x] 6.1 Создать обработчик команды /start


    - Реализовать src/bot/handlers/start.js
    - Отправлять приветственное сообщение с описанием функционала
    - Для существующих пользователей показывать информацию о доступных командах
    - _Requirements: 4.5_
  

  - [x] 6.2 Создать обработчик команды /status

    - Реализовать src/bot/handlers/status.js
    - Получать статистику через UserService.getUserStats
    - Отображать класс пользователя, использованные и оставшиеся запросы, количество купленных запросов
    - Для PREMIUM/ADMIN показывать сообщение о безлимитном доступе
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 6.3 Создать обработчик фотографий













    - Реализовать src/bot/handlers/photo.js
    - Извлекать file_id самой большой версии фото
    - Парсить подпись на наличие веса порции (regex)
    - Проверять возможность запроса через RequestService.canMakeRequest
    - При достижении лимита показывать кнопки для покупки запросов
    - Отправлять фото в OpenAIService.analyzeFood
    - Сохранять результат через RequestService.saveRequest
    - Форматировать и отправлять ответ с inline-кнопкой "Корректировать результаты"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1_
  
  - [x] 6.4 Создать обработчик корректировки результатов




    - Реализовать src/bot/handlers/correction.js
    - Обрабатывать callback_query для кнопки "Корректировать результаты"
    - Показывать inline-клавиатуру с параметрами (калории, белки, жиры, углеводы)
    - При выборе параметра запрашивать новое значение
    - Валидировать введенное значение через validator
    - Обновлять запись через RequestService.updateRequest
    - Обновлять сообщение с новыми данными
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 6.5 Создать обработчик платежей





    - Реализовать src/bot/handlers/payment.js
    - Обрабатывать выбор пакета запросов через callback_query
    - Создавать инвойс через Telegram Payments API
    - Обрабатывать успешный платеж (pre_checkout_query и successful_payment)
    - Увеличивать purchased_requests через UserService.updatePurchasedRequests
    - Сохранять транзакцию через PaymentService
    - Отправлять подтверждение пользователю
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Инициализация и запуск бота





  - [x] 7.1 Создать главный модуль бота


    - Реализовать src/bot/index.js с инициализацией Telegraf
    - Зарегистрировать все middleware (auth, rateLimit)
    - Зарегистрировать все обработчики команд и событий
    - Добавить централизованный обработчик ошибок
    - Запустить бота через bot.launch()
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 7.2 Создать скрипт для запуска миграций


    - Создать npm скрипт для выполнения init.sql
    - Добавить проверку успешности миграции
    - _Requirements: 7.1_

- [x] 8. Настройка деплоя и документация





  - [x] 8.1 Создать конфигурацию PM2


    - Создать ecosystem.config.js для PM2
    - Настроить автоперезапуск, логирование, ограничение памяти
    - _Requirements: 10.5_
  
  - [x] 8.2 Создать README с инструкциями


    - Описать процесс установки и настройки
    - Добавить примеры переменных окружения
    - Описать команды для запуска и управления ботом
    - _Requirements: 4.1, 7.1_
  
  - [x] 8.3 Создать package.json скрипты


    - Добавить скрипты: start, dev, migrate, logs
    - _Requirements: 7.1_

- [x] 9. Тестирование и отладка





  - [x] 9.1 Протестировать основной флоу


    - Отправить фото без подписи и проверить результат
    - Отправить фото с весом в подписи
    - Проверить форматирование ответа
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_
  
  - [x] 9.2 Протестировать систему лимитов


    - Исчерпать дневной лимит для FREE пользователя
    - Проверить использование purchased_requests
    - Проверить отображение кнопок покупки при достижении лимита
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 9.3 Протестировать корректировку результатов


    - Изменить каждый параметр (калории, белки, жиры, углеводы)
    - Проверить валидацию некорректного ввода
    - Убедиться, что изменения сохраняются в БД
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 9.4 Протестировать обработку ошибок


    - Симулировать недоступность OpenAI API
    - Проверить поведение при ошибках БД
    - Убедиться, что пользователь получает понятные сообщения
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
