/**
 * Тесты для системы профилей и расчета калорий
 */

const calorieCalculator = require('../src/services/calorieCalculator');

describe('CalorieCalculator', () => {
  describe('calculateBMR', () => {
    test('должен правильно рассчитывать BMR для мужчины', () => {
      const bmr = calorieCalculator.calculateBMR('male', 75, 180, 30);
      expect(bmr).toBe(1750);
    });

    test('должен правильно рассчитывать BMR для женщины', () => {
      const bmr = calorieCalculator.calculateBMR('female', 60, 165, 25);
      expect(bmr).toBe(1381);
    });

    test('должен округлять результат', () => {
      const bmr = calorieCalculator.calculateBMR('male', 70.5, 175.5, 28);
      expect(Number.isInteger(bmr)).toBe(true);
    });
  });

  describe('calculateDailyCalories', () => {
    test('должен правильно рассчитывать суточную норму', () => {
      const bmr = 1750;
      const dailyCalories = calorieCalculator.calculateDailyCalories(bmr, 1.55);
      expect(dailyCalories).toBe(2713);
    });

    test('должен округлять результат', () => {
      const bmr = 1500;
      const dailyCalories = calorieCalculator.calculateDailyCalories(bmr, 1.375);
      expect(Number.isInteger(dailyCalories)).toBe(true);
    });
  });

  describe('calculate', () => {
    test('должен выполнять полный расчет для мужчины', () => {
      const result = calorieCalculator.calculate({
        gender: 'male',
        weight: 75,
        height: 180,
        age: 30,
        activityLevel: 1.55
      });

      expect(result).toHaveProperty('bmr');
      expect(result).toHaveProperty('dailyCalories');
      expect(result.bmr).toBe(1750);
      expect(result.dailyCalories).toBe(2713);
    });

    test('должен выполнять полный расчет для женщины', () => {
      const result = calorieCalculator.calculate({
        gender: 'female',
        weight: 60,
        height: 165,
        age: 25,
        activityLevel: 1.375
      });

      expect(result).toHaveProperty('bmr');
      expect(result).toHaveProperty('dailyCalories');
      expect(result.bmr).toBe(1381);
      expect(result.dailyCalories).toBe(1899);
    });

    test('должен работать с минимальной активностью', () => {
      const result = calorieCalculator.calculate({
        gender: 'male',
        weight: 80,
        height: 175,
        age: 35,
        activityLevel: 1.2
      });

      expect(result.dailyCalories).toBeGreaterThan(result.bmr);
      expect(result.dailyCalories).toBeLessThan(result.bmr * 1.3);
    });

    test('должен работать с максимальной активностью', () => {
      const result = calorieCalculator.calculate({
        gender: 'male',
        weight: 80,
        height: 175,
        age: 35,
        activityLevel: 1.9
      });

      expect(result.dailyCalories).toBeGreaterThan(result.bmr * 1.8);
    });
  });

  describe('validateInput', () => {
    test('должен принимать корректные данные', () => {
      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 75,
          height: 180,
          age: 30,
          activityLevel: 1.55
        });
      }).not.toThrow();
    });

    test('должен отклонять некорректный пол', () => {
      expect(() => {
        calorieCalculator.validateInput({
          gender: 'other',
          weight: 75,
          height: 180,
          age: 30,
          activityLevel: 1.55
        });
      }).toThrow('Пол должен быть male или female');
    });

    test('должен отклонять некорректный вес', () => {
      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 0,
          height: 180,
          age: 30,
          activityLevel: 1.55
        });
      }).toThrow('Вес должен быть от 1 до 500 кг');

      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 600,
          height: 180,
          age: 30,
          activityLevel: 1.55
        });
      }).toThrow('Вес должен быть от 1 до 500 кг');
    });

    test('должен отклонять некорректный рост', () => {
      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 75,
          height: 0,
          age: 30,
          activityLevel: 1.55
        });
      }).toThrow('Рост должен быть от 1 до 300 см');

      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 75,
          height: 350,
          age: 30,
          activityLevel: 1.55
        });
      }).toThrow('Рост должен быть от 1 до 300 см');
    });

    test('должен отклонять некорректный возраст', () => {
      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 75,
          height: 180,
          age: 0,
          activityLevel: 1.55
        });
      }).toThrow('Возраст должен быть от 1 до 150 лет');

      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 75,
          height: 180,
          age: 200,
          activityLevel: 1.55
        });
      }).toThrow('Возраст должен быть от 1 до 150 лет');
    });

    test('должен отклонять некорректный коэффициент активности', () => {
      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 75,
          height: 180,
          age: 30,
          activityLevel: 1.0
        });
      }).toThrow('Коэффициент активности должен быть от 1.2 до 1.9');

      expect(() => {
        calorieCalculator.validateInput({
          gender: 'male',
          weight: 75,
          height: 180,
          age: 30,
          activityLevel: 2.0
        });
      }).toThrow('Коэффициент активности должен быть от 1.2 до 1.9');
    });
  });

  describe('getActivityLevels', () => {
    test('должен возвращать все уровни активности', () => {
      const levels = calorieCalculator.getActivityLevels();
      
      expect(levels).toHaveProperty('SEDENTARY');
      expect(levels).toHaveProperty('LIGHT');
      expect(levels).toHaveProperty('MODERATE');
      expect(levels).toHaveProperty('HIGH');
      expect(levels).toHaveProperty('VERY_HIGH');
    });

    test('каждый уровень должен иметь value и name', () => {
      const levels = calorieCalculator.getActivityLevels();
      
      Object.values(levels).forEach(level => {
        expect(level).toHaveProperty('value');
        expect(level).toHaveProperty('name');
        expect(level).toHaveProperty('description');
        expect(typeof level.value).toBe('number');
        expect(typeof level.name).toBe('string');
        expect(typeof level.description).toBe('string');
      });
    });

    test('значения коэффициентов должны быть в допустимом диапазоне', () => {
      const levels = calorieCalculator.getActivityLevels();
      
      Object.values(levels).forEach(level => {
        expect(level.value).toBeGreaterThanOrEqual(1.2);
        expect(level.value).toBeLessThanOrEqual(1.9);
      });
    });
  });

  describe('Реальные примеры', () => {
    test('Пример 1: Офисный работник', () => {
      // Мужчина, 30 лет, 75 кг, 180 см, малоподвижный
      const result = calorieCalculator.calculate({
        gender: 'male',
        weight: 75,
        height: 180,
        age: 30,
        activityLevel: 1.2
      });

      expect(result.bmr).toBe(1750);
      expect(result.dailyCalories).toBe(2100);
    });

    test('Пример 2: Активная женщина', () => {
      // Женщина, 25 лет, 60 кг, 165 см, высокая активность
      const result = calorieCalculator.calculate({
        gender: 'female',
        weight: 60,
        height: 165,
        age: 25,
        activityLevel: 1.725
      });

      expect(result.bmr).toBe(1381);
      expect(result.dailyCalories).toBe(2382);
    });

    test('Пример 3: Спортсмен', () => {
      // Мужчина, 25 лет, 85 кг, 185 см, очень высокая активность
      const result = calorieCalculator.calculate({
        gender: 'male',
        weight: 85,
        height: 185,
        age: 25,
        activityLevel: 1.9
      });

      expect(result.bmr).toBe(1931);
      expect(result.dailyCalories).toBe(3669);
    });

    test('Пример 4: Пожилой человек', () => {
      // Женщина, 65 лет, 70 кг, 160 см, легкая активность
      const result = calorieCalculator.calculate({
        gender: 'female',
        weight: 70,
        height: 160,
        age: 65,
        activityLevel: 1.375
      });

      expect(result.bmr).toBe(1164);
      expect(result.dailyCalories).toBe(1600);
    });
  });
});
