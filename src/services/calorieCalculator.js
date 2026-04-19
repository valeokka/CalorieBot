/**
 * Сервис для расчета нормы калорий по формуле Миффлина-Сан Жеора
 */

const logger = require('../utils/logger');

/**
 * Коэффициенты физической активности
 */
const ACTIVITY_LEVELS = {
  SEDENTARY: { value: 1.2, name: 'Малоподвижный', description: 'Сидячая работа, минимум движения' },
  LIGHT: { value: 1.375, name: 'Легкая активность', description: 'Прогулки, зарядка 1-3 раза в неделю' },
  MODERATE: { value: 1.55, name: 'Умеренная активность', description: 'Тренировки 3-5 раз в неделю' },
  HIGH: { value: 1.725, name: 'Высокая активность', description: 'Интенсивные тренировки 6-7 раз в неделю' },
  VERY_HIGH: { value: 1.9, name: 'Очень высокая', description: 'Интенсивные тренировки 2 раза в день' }
};

class CalorieCalculator {
  /**
   * Рассчитать базальный уровень метаболизма (BMR) по формуле Миффлина-Сан Жеора
   * @param {string} gender - Пол ('male' или 'female')
   * @param {number} weight - Вес в кг
   * @param {number} height - Рост в см
   * @param {number} age - Возраст в годах
   * @returns {number} BMR в калориях
   */
  calculateBMR(gender, weight, height, age) {
    // BMR = (10 × вес в кг) + (6.25 × рост в см) − (5 × возраст) + константа
    const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
    
    // Для мужчин: +5, для женщин: -161
    const genderConstant = gender === 'male' ? 5 : -161;
    
    const bmr = baseBMR + genderConstant;
    
    logger.info('BMR calculated', { gender, weight, height, age, bmr });
    
    return Math.round(bmr);
  }

  /**
   * Рассчитать суточную норму калорий с учетом физической активности
   * @param {number} bmr - Базальный уровень метаболизма
   * @param {number} activityLevel - Коэффициент физической активности (1.2-1.9)
   * @returns {number} Суточная норма калорий
   */
  calculateDailyCalories(bmr, activityLevel) {
    const dailyCalories = bmr * activityLevel;
    
    logger.info('Daily calories calculated', { bmr, activityLevel, dailyCalories });
    
    return Math.round(dailyCalories);
  }

  /**
   * Полный расчет нормы калорий
   * @param {Object} params - Параметры для расчета
   * @param {string} params.gender - Пол ('male' или 'female')
   * @param {number} params.weight - Вес в кг
   * @param {number} params.height - Рост в см
   * @param {number} params.age - Возраст в годах
   * @param {number} params.activityLevel - Коэффициент активности (1.2-1.9)
   * @returns {Object} Результат расчета { bmr, dailyCalories }
   */
  calculate({ gender, weight, height, age, activityLevel }) {
    try {
      // Валидация входных данных
      this.validateInput({ gender, weight, height, age, activityLevel });
      
      // Расчет BMR
      const bmr = this.calculateBMR(gender, weight, height, age);
      
      // Расчет суточной нормы
      const dailyCalories = this.calculateDailyCalories(bmr, activityLevel);
      
      return {
        bmr,
        dailyCalories
      };
    } catch (error) {
      logger.error('Error calculating calories', { 
        error: error.message,
        params: { gender, weight, height, age, activityLevel }
      });
      throw error;
    }
  }

  /**
   * Валидация входных данных
   */
  validateInput({ gender, weight, height, age, activityLevel }) {
    if (!['male', 'female'].includes(gender)) {
      throw new Error('Пол должен быть male или female');
    }
    
    if (weight <= 0 || weight > 500) {
      throw new Error('Вес должен быть от 1 до 500 кг');
    }
    
    if (height <= 0 || height > 300) {
      throw new Error('Рост должен быть от 1 до 300 см');
    }
    
    if (age <= 0 || age > 150) {
      throw new Error('Возраст должен быть от 1 до 150 лет');
    }
    
    if (activityLevel < 1.2 || activityLevel > 1.9) {
      throw new Error('Коэффициент активности должен быть от 1.2 до 1.9');
    }
  }

  /**
   * Получить список уровней активности
   */
  getActivityLevels() {
    return ACTIVITY_LEVELS;
  }
}

module.exports = new CalorieCalculator();
