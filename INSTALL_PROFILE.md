# Установка функции профиля

## Быстрая установка

### 1. Выполнить миграцию базы данных

```bash
npm run migrate
```

Вы должны увидеть:
```
✅ Все миграции выполнены успешно
   ✓ init.sql
   ✓ add_user_profiles.sql

📊 Проверка созданных таблиц:
   ✓ user_classes
   ✓ users
   ✓ requests_history
   ✓ transactions
   ✓ user_profiles
```

### 2. Перезапустить бота

**Режим разработки:**
```bash
npm run dev
```

**Продакшен:**
```bash
npm restart
```

### 3. Проверить работу

Отправьте боту команду `/profile` в Telegram.

## Проверка установки

### Проверка таблицы в БД

```bash
psql -U caloriebot -d MrCalorie
```

```sql
-- Проверить структуру таблицы
\d user_profiles

-- Проверить, что таблица пустая
SELECT COUNT(*) FROM user_profiles;
```

### Тестирование функции

1. Отправьте `/profile` боту
2. Нажмите "Заполнить профиль"
3. Заполните все поля
4. Проверьте, что расчет выполнен корректно

### Проверка в БД

```sql
-- Посмотреть созданные профили
SELECT * FROM user_profiles;

-- Проверить профиль конкретного пользователя
SELECT * FROM user_profiles WHERE telegram_id = YOUR_TELEGRAM_ID;
```

## Откат изменений (если нужно)

Если нужно удалить функцию профиля:

```sql
-- Удалить таблицу профилей
DROP TABLE IF EXISTS user_profiles CASCADE;
```

Затем перезапустите бота.

## Возможные проблемы

### Ошибка "relation user_profiles does not exist"

**Решение:** Выполните миграцию:
```bash
npm run migrate
```

### Ошибка "column does not exist"

**Решение:** Убедитесь, что миграция `add_user_profiles.sql` выполнена успешно:
```sql
\d user_profiles
```

### Бот не отвечает на /profile

**Решение:** 
1. Проверьте логи: `pm2 logs calorie-bot`
2. Перезапустите бота: `npm restart`
3. Проверьте, что все файлы созданы:
   - `src/bot/handlers/profile.js`
   - `src/services/profileService.js`
   - `src/services/calorieCalculator.js`
   - `src/database/queries/profiles.js`

## Готово!

Функция профиля установлена и готова к использованию. Пользователи могут:
- Создавать профиль с расчетом нормы калорий
- Изменять цель калорий вручную или пересчитывать
- Удалять профиль

Подробная документация: `PROFILE_FEATURE.md`
