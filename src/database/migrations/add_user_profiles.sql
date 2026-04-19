-- Миграция: добавление таблицы профилей пользователей

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  telegram_id BIGINT PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  age INTEGER CHECK (age > 0 AND age < 150),
  weight DECIMAL(5, 2) CHECK (weight > 0 AND weight < 500),
  height INTEGER CHECK (height > 0 AND height < 300),
  activity_level DECIMAL(3, 3) CHECK (activity_level >= 1.2 AND activity_level <= 1.9),
  calorie_goal INTEGER CHECK (calorie_goal > 0),
  is_manual_goal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_profiles_telegram_id ON user_profiles(telegram_id);

-- Комментарии к таблице
COMMENT ON TABLE user_profiles IS 'Профили пользователей с данными для расчета калорий';
COMMENT ON COLUMN user_profiles.gender IS 'Пол: male или female';
COMMENT ON COLUMN user_profiles.age IS 'Возраст в годах';
COMMENT ON COLUMN user_profiles.weight IS 'Вес в килограммах';
COMMENT ON COLUMN user_profiles.height IS 'Рост в сантиметрах';
COMMENT ON COLUMN user_profiles.activity_level IS 'Коэффициент физической активности (1.2-1.9)';
COMMENT ON COLUMN user_profiles.calorie_goal IS 'Целевая норма калорий в день';
COMMENT ON COLUMN user_profiles.is_manual_goal IS 'Установлена ли цель вручную (true) или рассчитана (false)';
