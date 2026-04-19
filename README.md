# 🍽️ Calorie Counter Bot

Умный Telegram-бот для подсчета калорий и макронутриентов по фотографиям еды с использованием OpenAI GPT-4o Vision API.

## ✨ Возможности

- 📸 **Анализ по фото** - отправь фото еды, получи полный расчет калорий и БЖУ
- ♻️ **Кэширование** - повторный анализ одного фото мгновенно возвращает результат
- �️ *к*Сжатие изображений** - автоматическая оптимизация фото (экономия до 75% размера)
- 📊 **Система классов** - FREE, PREMIUM, ADMIN с разными лимитами
- � **Поекупка запросов** - через Telegram Stars (встроенная валюта)
- ✏️ **Корректировка** - можно исправить результаты анализа
- 📈 **Статистика** - отслеживание использования и расходов
- 🔒 **Безопасность** - защита от race condition и утечек токенов
- ⚡ **Производительность** - оптимизированный connection pool и кэш БД

## 🎯 Требования

- **Node.js** v18 или выше
- **PostgreSQL** v14 или выше
- **PM2** (для продакшена)
- **OpenAI API ключ** с доступом к GPT-4o
- **Telegram Bot Token**

## 🚀 Быстрая установка

### 1. Клонирование и установка зависимостей

```bash
git clone <repository-url>
cd calorie-counter-bot
npm install
```

### 2. Настройка PostgreSQL

```bash
# Войти в PostgreSQL
sudo -u postgres psql

# Создать базу данных
CREATE DATABASE "MrCalorie";

# Создать пользователя (опционально)
CREATE USER caloriebot WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE "MrCalorie" TO caloriebot;

# Дать права на схему public
\c MrCalorie
GRANT ALL ON SCHEMA public TO caloriebot;
ALTER SCHEMA public OWNER TO caloriebot;

# Выйти
\q
```

**Важно:** Если используешь пользователя `postgres`, настрой аутентификацию:

```bash
# Открыть конфигурацию
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Заменить "peer" на "md5" для локальных подключений:
local   all             postgres                                md5
local   all             all                                     md5

# Перезапустить PostgreSQL
sudo systemctl restart postgresql
```

### 3. Настройка переменных окружения

```bash
# Скопировать пример
cp .env.example .env

# Отредактировать
nano .env
```

**Минимальная конфигурация:**

```env
# Telegram Bot (получить у @BotFather)
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# OpenAI API (получить на platform.openai.com)
OPENAI_API_KEY=sk-proj-abc123...
OPENAI_MODEL=gpt-4o

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=MrCalorie
DB_USER=caloriebot
DB_PASSWORD=your_strong_password

# Приложение
NODE_ENV=production
LOG_LEVEL=info
```

### 4. Выполнение миграции

```bash
npm run migrate
```

Должен увидеть:
```
✅ Подключение к базе данных успешно
✅ Миграция выполнена успешно
✓ user_classes
✓ users
✓ requests_history
✓ transactions
```

### 5. Запуск бота

**Режим разработки:**
```bash
npm run dev
```

**Продакшен с PM2:**
```bash
npm start
```

**Проверка статуса:**
```bash
pm2 status calorie-bot
pm2 logs calorie-bot
```

---

## 🔑 Получение токенов и ключей

### Telegram Bot Token

1. Найди **@BotFather** в Telegram
2. Отправь `/newbot`
3. Следуй инструкциям (имя бота, username)
4. Скопируй токен вида: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
5. Вставь в `.env` как `BOT_TOKEN`

### OpenAI API Key

1. Зарегистрируйся на [platform.openai.com](https://platform.openai.com/)
2. Перейди в **API Keys**
3. Нажми **Create new secret key**
4. Скопируй ключ (начинается с `sk-proj-...`)
5. Вставь в `.env` как `OPENAI_API_KEY`
6. **Важно:** Пополни баланс на $5-10 для работы

### Payment Provider Token (опционально)

Для приема платежей через Telegram Stars:

1. Открой **@BotFather**
2. Отправь `/mybots` → выбери бота
3. Нажми **Payments**
4. Выбери **Telegram Stars**
5. Скопируй токен
6. Вставь в `.env` как `PAYMENT_PROVIDER_TOKEN`

---

## 📋 Команды бота

- `/start` - Приветствие и инструкция
- `/status` - Статистика использования и лимиты
- **Отправка фото** - Анализ калорийности еды

**Дополнительно в подписи к фото:**
- `250` или `250г` - указать вес порции в граммах

---

## 👥 Классы пользователей

| Класс | Лимит запросов | Описание |
|-------|----------------|----------|
| **FREE** | 1 в день | Бесплатный доступ + покупка запросов |
| **PREMIUM** | Безлимит | Премиум подписка |
| **ADMIN** | Безлимит | Административный доступ |

### Изменение класса пользователя

```sql
-- Сделать пользователя PREMIUM
UPDATE users 
SET user_class_id = 2 
WHERE telegram_id = 123456789;

-- Сделать пользователя ADMIN
UPDATE users 
SET user_class_id = 3 
WHERE telegram_id = 123456789;
```

---

## 💰 Пакеты запросов (Telegram Stars)

| Запросов | Цена | Stars |
|----------|------|-------|
| 10 | 25 ⭐ | ~$0.50 |
| 50 | 100 ⭐ | ~$2.00 |
| 100 | 175 ⭐ | ~$3.50 |

**Настройка цен:** `src/config/constants.js` → `PAYMENT_PACKAGES`

---

## ⚙️ Конфигурация

### Основные параметры

```env
# OpenAI
OPENAI_MODEL=gpt-4o              # Модель для анализа
OPENAI_TIMEOUT=30000             # Таймаут запроса (мс)
OPENAI_MAX_RETRIES=2             # Количество повторов

# База данных
DB_MAX_CONNECTIONS=20            # Макс. соединений
DB_MIN_CONNECTIONS=2             # Мин. соединений
DB_STATEMENT_TIMEOUT=10000       # Таймаут SQL (мс)

# Кэширование
CACHE_ENABLED=true               # Кэш результатов по file_id
CACHE_TTL_HOURS=24               # Время жизни кэша (часы)
DB_CACHE_ENABLED=true            # Кэш БД запросов
DB_CACHE_TTL_MS=60000            # Время жизни кэша БД (мс)

# Сжатие изображений
IMAGE_COMPRESSION_ENABLED=true   # Включить сжатие
IMAGE_MAX_WIDTH=1920             # Макс. ширина
IMAGE_MAX_HEIGHT=1920            # Макс. высота
IMAGE_QUALITY=85                 # Качество JPEG (0-100)

# Валидация
WEIGHT_MIN=10                    # Мин. вес порции (г)
WEIGHT_MAX=5000                  # Макс. вес порции (г)
MAX_PHOTO_SIZE_MB=5              # Макс. размер фото (МБ)
```

Полный список параметров: `.env.example`

---

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Все логи
pm2 logs calorie-bot

# Последние 100 строк
pm2 logs calorie-bot --lines 100

# Только ошибки
pm2 logs calorie-bot --err

# Логи в файлах
tail -f logs/combined.log
tail -f logs/error.log
```

### Полезные фильтры

```bash
# Стоимость запросов к OpenAI
pm2 logs calorie-bot | grep "cost"

# Попадания в кэш
pm2 logs calorie-bot | grep "Cache hit"

# Сжатие изображений
pm2 logs calorie-bot | grep "Image compressed"

# Ошибки
pm2 logs calorie-bot | grep "ERROR"
```

### Статистика пула БД

```sql
-- Активные соединения
SELECT * FROM pg_stat_activity 
WHERE application_name = 'calorie-bot';

-- Количество запросов
SELECT COUNT(*) FROM requests_history;

-- Популярные блюда
SELECT dish_name, COUNT(*) as count
FROM requests_history
GROUP BY dish_name
ORDER BY count DESC
LIMIT 10;
```

---

## 🔧 Управление PM2

```bash
# Запуск
pm2 start ecosystem.config.js

# Остановка
pm2 stop calorie-bot

# Перезапуск
pm2 restart calorie-bot

# Удаление
pm2 delete calorie-bot

# Статус
pm2 status

# Мониторинг
pm2 monit

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

---

## 🐛 Устранение неполадок

### Бот не отвечает

```bash
# 1. Проверить статус
pm2 status calorie-bot

# 2. Проверить логи
pm2 logs calorie-bot --lines 50

# 3. Проверить переменные окружения
cat .env | grep -E "(BOT_TOKEN|OPENAI_API_KEY|DB_)"

# 4. Перезапустить
pm2 restart calorie-bot
```

### Ошибки OpenAI API

- **401 Unauthorized** - неверный API ключ
- **429 Rate Limit** - превышен лимит запросов
- **402 Quota Exceeded** - закончились деньги на балансе
- **Timeout** - увеличь `OPENAI_TIMEOUT`

### Ошибки базы данных

```bash
# Проверить подключение
psql -U caloriebot -h localhost -d MrCalorie

# Проверить таблицы
psql -U caloriebot -d MrCalorie -c "\dt"

# Проверить права
psql -U postgres -d MrCalorie -c "GRANT ALL ON SCHEMA public TO caloriebot;"
```

### Высокое использование памяти

```env
# Отключить кэш
DB_CACHE_ENABLED=false

# Или уменьшить TTL
DB_CACHE_TTL_MS=30000
```

### Медленная обработка фото

```env
# Отключить сжатие
IMAGE_COMPRESSION_ENABLED=false

# Или уменьшить качество
IMAGE_QUALITY=75
IMAGE_MAX_WIDTH=1600
```

---

## 📚 Документация

- **SECURITY_FIXES.md** - исправления безопасности
- **IMPROVEMENTS.md** - новые возможности
- **PERFORMANCE.md** - оптимизации производительности
- **CHANGELOG.md** - история изменений
- **INSTALL_OPTIMIZATIONS.md** - установка оптимизаций

---

## 🏗️ Структура проекта

```
calorie-counter-bot/
├── src/
│   ├── bot/
│   │   ├── handlers/          # Обработчики команд
│   │   ├── middleware/        # Middleware (auth, rate limit)
│   │   └── index.js          # Инициализация бота
│   ├── services/
│   │   ├── openai.js         # OpenAI API
│   │   ├── imageService.js   # Сжатие изображений
│   │   ├── userService.js    # Работа с пользователями
│   │   ├── requestService.js # Работа с запросами
│   │   └── paymentService.js # Платежи
│   ├── database/
│   │   ├── connection.js     # Connection pool
│   │   ├── queries/          # SQL запросы
│   │   └── migrations/       # Миграции
│   ├── utils/
│   │   ├── cache.js          # In-memory кэш
│   │   ├── logger.js         # Логирование
│   │   ├── validator.js      # Валидация
│   │   └── formatter.js      # Форматирование
│   └── config/
│       └── constants.js      # Константы и настройки
├── scripts/
│   └── migrate.js            # Скрипт миграции
├── logs/                     # Логи (создается автоматически)
├── .env                      # Переменные окружения
├── .env.example             # Пример конфигурации
├── ecosystem.config.js      # Конфигурация PM2
└── package.json
```

---

## 🚀 Производительность

### Бенчмарки

**Без оптимизаций:**
- Обработка фото: ~8s
- Запросов к БД: ~15ms каждый

**С оптимизациями:**
- Обработка фото: ~4.6s (**42% быстрее**)
- Запросов к БД: ~0.1ms из кэша (**99% быстрее**)
- Размер фото: -75% в среднем
- Стоимость OpenAI: -47% токенов

### Рекомендации по нагрузке

**< 100 пользователей/день:**
```env
DB_MAX_CONNECTIONS=10
IMAGE_QUALITY=80
```

**100-1000 пользователей/день:**
```env
DB_MAX_CONNECTIONS=20
DB_CACHE_TTL_MS=120000
```

**> 1000 пользователей/день:**
```env
DB_MAX_CONNECTIONS=50
DB_MIN_CONNECTIONS=5
IMAGE_MAX_WIDTH=1600
```

---

## 🤝 Разработка

### Добавление новых функций

1. Обнови требования в `.kiro/specs/`
2. Реализуй функционал
3. Добавь логирование
4. Обнови документацию
5. Протестируй

### Тестирование

```bash
# Режим разработки с hot reload
npm run dev

# Запуск тестов
npm test
```

---

## 📄 Лицензия

ISC License

---

## 💡 Поддержка

Для получения помощи:
- Создай issue в репозитории
- Проверь документацию в папке проекта
- Изучи логи: `pm2 logs calorie-bot`

---

## 🎉 Готово!

Бот настроен и готов к работе. Отправь ему фото еды в Telegram и получи анализ калорий!