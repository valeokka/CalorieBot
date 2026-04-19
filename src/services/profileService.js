/**
 * Сервис для работы с профилями пользователей
 */

const profileQueries = require('../database/queries/profiles');
const calorieCalculator = require('./calorieCalculator');
const logger = require('../utils/logger');

class ProfileService {
  /**
   * Получить профиль пользователя
   */
  async getProfile(telegramId) {
    try {
      return await profileQueries.getProfile(telegramId);
    } catch (error) {
      logger.error('Error getting profile', { telegramId, error: error.message });
      throw error;
    }
  }

  /**
   * Создать или обновить профиль с расчетом калорий
   */
  async createOrUpdateProfile(telegramId, { gender, age, weight, height, activityLevel }) {
    try {
      // Рассчитываем норму калорий
      const { bmr, dailyCalories } = calorieCalculator.calculate({
        gender,
        weight,
        height,
        age,
        activityLevel
      });

      // Сохраняем профиль
      const profile = await profileQueries.upsertProfile(telegramId, {
        gender,
        age,
        weight,
        height,
        activityLevel,
        calorieGoal: dailyCalories,
        isManualGoal: false
      });

      logger.info('Profile created/updated', { 
        telegramId, 
        bmr, 
        dailyCalories 
      });

      return { profile, bmr, dailyCalories };
    } catch (error) {
      logger.error('Error creating/updating profile', { 
        telegramId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Обновить цель калорий вручную
   */
  async updateCalorieGoalManually(telegramId, calorieGoal) {
    try {
      if (calorieGoal <= 0 || calorieGoal > 10000) {
        throw new Error('Цель калорий должна быть от 1 до 10000');
      }

      const profile = await profileQueries.updateCalorieGoal(telegramId, calorieGoal, true);
      
      if (!profile) {
        throw new Error('Профиль не найден. Сначала заполните профиль.');
      }

      logger.info('Calorie goal updated manually', { telegramId, calorieGoal });

      return profile;
    } catch (error) {
      logger.error('Error updating calorie goal', { 
        telegramId, 
        calorieGoal,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Пересчитать цель калорий на основе текущих данных профиля
   */
  async recalculateCalorieGoal(telegramId) {
    try {
      const profile = await profileQueries.getProfile(telegramId);
      
      if (!profile) {
        throw new Error('Профиль не найден. Сначала заполните профиль.');
      }

      // Пересчитываем калории
      const { bmr, dailyCalories } = calorieCalculator.calculate({
        gender: profile.gender,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        activityLevel: profile.activity_level
      });

      // Обновляем цель
      const updatedProfile = await profileQueries.updateCalorieGoal(
        telegramId, 
        dailyCalories, 
        false
      );

      logger.info('Calorie goal recalculated', { 
        telegramId, 
        bmr, 
        dailyCalories 
      });

      return { profile: updatedProfile, bmr, dailyCalories };
    } catch (error) {
      logger.error('Error recalculating calorie goal', { 
        telegramId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Удалить профиль
   */
  async deleteProfile(telegramId) {
    try {
      const profile = await profileQueries.deleteProfile(telegramId);
      
      logger.info('Profile deleted', { telegramId });
      
      return profile;
    } catch (error) {
      logger.error('Error deleting profile', { 
        telegramId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new ProfileService();
