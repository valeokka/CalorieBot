const pool = require('../connection');
const logger = require('../../utils/logger');

/**
 * Получить профиль пользователя
 */
async function getProfile(telegramId) {
  const query = 'SELECT * FROM user_profiles WHERE telegram_id = $1';
  const result = await pool.query(query, [telegramId]);
  return result.rows[0];
}

/**
 * Создать или обновить профиль пользователя
 */
async function upsertProfile(telegramId, profileData) {
  const { gender, age, weight, height, activityLevel, calorieGoal, isManualGoal } = profileData;
  
  const query = `
    INSERT INTO user_profiles (
      telegram_id, gender, age, weight, height, 
      activity_level, calorie_goal, is_manual_goal, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (telegram_id) 
    DO UPDATE SET
      gender = EXCLUDED.gender,
      age = EXCLUDED.age,
      weight = EXCLUDED.weight,
      height = EXCLUDED.height,
      activity_level = EXCLUDED.activity_level,
      calorie_goal = EXCLUDED.calorie_goal,
      is_manual_goal = EXCLUDED.is_manual_goal,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    telegramId, gender, age, weight, height, 
    activityLevel, calorieGoal, isManualGoal
  ]);
  
  return result.rows[0];
}

/**
 * Обновить только цель калорий
 */
async function updateCalorieGoal(telegramId, calorieGoal, isManual = true) {
  const query = `
    UPDATE user_profiles 
    SET calorie_goal = $2,
        is_manual_goal = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = $1
    RETURNING *
  `;
  
  const result = await pool.query(query, [telegramId, calorieGoal, isManual]);
  return result.rows[0];
}

/**
 * Удалить профиль пользователя
 */
async function deleteProfile(telegramId) {
  const query = 'DELETE FROM user_profiles WHERE telegram_id = $1 RETURNING *';
  const result = await pool.query(query, [telegramId]);
  return result.rows[0];
}

module.exports = {
  getProfile,
  upsertProfile,
  updateCalorieGoal,
  deleteProfile,
};
