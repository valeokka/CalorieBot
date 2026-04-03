# Requirements Document

## Introduction

Телеграм-бот для подсчета калорий по фотографиям еды. Бот использует ChatGPT Vision API для анализа изображений и предоставляет пользователям информацию о калорийности и макронутриентах блюд. Система включает гибкую модель монетизации с классами пользователей и лимитами запросов.

## Glossary

- **CalorieAI**: Телеграм-бот для анализа калорийности еды по фотографиям
- **User**: Пользователь телеграм-бота
- **Request**: Запрос на анализ фотографии еды
- **User Class**: Класс пользователя, определяющий лимиты и возможности (FREE, PREMIUM, ADMIN)
- **Daily Limit**: Количество бесплатных запросов в день для определенного класса пользователей
- **Purchased Request**: Купленный дополнительный запрос, который не сгорает
- **ChatGPT Vision API**: API OpenAI для анализа изображений
- **Nutrition Data**: Данные о пищевой ценности: калории, белки, жиры, углеводы
- **Telegram Payment**: Система оплаты внутри Telegram
- **PostgreSQL Database**: Реляционная база данных для хранения информации о пользователях и запросах

## Requirements

### Requirement 1

**User Story:** Как пользователь, я хочу отправить фото еды и получить информацию о калориях и макронутриентах(Калории, Белки, Жиры, Углеводы), чтобы контролировать свое питание

#### Acceptance Criteria

1. WHEN User отправляет фотографию в CalorieAI, THE CalorieAI SHALL принять изображение и сохранить его file_id
2. WHEN CalorieAI получает фотографию, THE CalorieAI SHALL отправить запрос к ChatGPT Vision API с изображением и промптом для анализа
3. WHEN ChatGPT Vision API возвращает результат анализа, THE CalorieAI SHALL извлечь название блюда, калории, белки, жиры и углеводы
4. WHEN CalorieAI получает Nutrition Data от API, THE CalorieAI SHALL отформатировать ответ с эмодзи и отправить User
5. WHEN CalorieAI отправляет результат анализа, THE CalorieAI SHALL добавить inline-кнопку "Корректировать результаты"

### Requirement 2

**User Story:** Как пользователь, я хочу указать вес порции, чтобы получить более точные данные о калорийности

#### Acceptance Criteria

1. WHEN User отправляет фотографию с подписью, содержащей число, THE CalorieAI SHALL распознать это число как вес порции в граммах
2. WHEN CalorieAI определяет вес порции, THE CalorieAI SHALL передать эту информацию в промпт для ChatGPT Vision API
3. WHEN вес порции указан, THE CalorieAI SHALL рассчитать пищевую ценность для указанного веса
4. WHEN вес порции не указан, THE CalorieAI SHALL предоставить данные основываясь на анализе ChatGPT Vision API

### Requirement 3

**User Story:** Как пользователь, я хочу корректировать результаты анализа, чтобы исправить неточности

#### Acceptance Criteria

1. WHEN User нажимает кнопку "Корректировать", THE CalorieAI SHALL отобразить inline-клавиатуру с опциями для редактирования
2. WHEN User выбирает параметр для редактирования, THE CalorieAI SHALL запросить новое значение
3. WHEN User вводит новое значение, THE CalorieAI SHALL валидировать введенные данные как положительное число
4. WHEN новое значение валидно, THE CalorieAI SHALL обновить результат и сохранить изменения в PostgreSQL Database
5. WHEN новое значение невалидно, THE CalorieAI SHALL отобразить сообщение об ошибке и запросить корректный ввод

### Requirement 4

**User Story:** Как новый пользователь, я хочу автоматически зарегистрироваться при первом обращении к боту, чтобы начать использовать сервис

#### Acceptance Criteria

1. WHEN User впервые отправляет команду /start в CalorieAI, THE CalorieAI SHALL создать запись в PostgreSQL Database с telegram_id пользователя
2. WHEN CalorieAI создает нового User, THE CalorieAI SHALL присвоить User класс FREE по умолчанию
3. WHEN CalorieAI создает нового User, THE CalorieAI SHALL установить purchased_requests равным 0
4. WHEN CalorieAI создает нового User, THE CalorieAI SHALL сохранить текущую дату как registration_date
5. WHEN User уже зарегистрирован, THE CalorieAI SHALL отобразить приветственное сообщение с информацией о доступных командах

### Requirement 5

**User Story:** Как пользователь класса FREE, я хочу иметь 1 бесплатный запрос в день, чтобы пользоваться базовым функционалом

#### Acceptance Criteria

1. WHEN User класса FREE отправляет фотографию, THE CalorieAI SHALL подсчитать количество запросов User за текущий день
2. WHEN количество запросов за день меньше daily_limit для класса FREE, THE CalorieAI SHALL обработать запрос
3. WHEN количество запросов за день достигло daily_limit, THE CalorieAI SHALL проверить наличие purchased_requests
4. WHEN purchased_requests больше 0, THE CalorieAI SHALL уменьшить purchased_requests на 1 и обработать запрос
5. WHEN purchased_requests равно 0 и daily_limit достигнут, THE CalorieAI SHALL отклонить запрос и предложить купить дополнительные запросы

### Requirement 6

**User Story:** Как пользователь, я хочу покупать дополнительные запросы, чтобы использовать бот больше установленного лимита

#### Acceptance Criteria

1. WHEN User достигает лимита запросов, THE CalorieAI SHALL отобразить inline-кнопки с вариантами покупки запросов
2. WHEN User выбирает пакет запросов, THE CalorieAI SHALL инициировать процесс оплаты через Telegram Payment
3. WHEN платеж успешно завершен, THE CalorieAI SHALL увеличить purchased_requests User на купленное количество
4. WHEN платеж отменен или неуспешен, THE CalorieAI SHALL уведомить User об ошибке
5. WHEN User покупает запросы, THE CalorieAI SHALL сохранить транзакцию в PostgreSQL Database

### Requirement 7

**User Story:** Как администратор, я хочу иметь гибкую систему классов пользователей, чтобы легко изменять лимиты и добавлять новые классы

#### Acceptance Criteria

1. WHEN система инициализируется, THE CalorieAI SHALL создать таблицу user_classes в PostgreSQL Database
2. WHEN таблица user_classes создается, THE CalorieAI SHALL добавить классы FREE, PREMIUM и ADMIN
3. WHEN класс FREE создается, THE CalorieAI SHALL установить daily_limit равным 1
4. WHEN класс PREMIUM создается, THE CalorieAI SHALL установить daily_limit равным NULL (безлимит)
5. WHEN класс ADMIN создается, THE CalorieAI SHALL установить daily_limit равным NULL (безлимит)

### Requirement 8

**User Story:** Как администратор, я хочу сохранять историю всех запросов, чтобы анализировать использование и улучшать систему

#### Acceptance Criteria

1. WHEN CalorieAI успешно обрабатывает запрос, THE CalorieAI SHALL создать запись в таблице requests_history
2. WHEN запись создается, THE CalorieAI SHALL сохранить telegram_id пользователя, photo_file_id, название блюда и Nutrition Data
3. WHEN User указал вес порции, THE CalorieAI SHALL сохранить значение веса в поле weight
4. WHEN User скорректировал результаты, THE CalorieAI SHALL обновить соответствующую запись в requests_history
5. WHEN запись сохраняется, THE CalorieAI SHALL установить created_at равным текущей дате и времени

### Requirement 9

**User Story:** Как пользователь, я хочу видеть информацию о моих оставшихся запросах, чтобы планировать использование бота

#### Acceptance Criteria

1. WHEN User отправляет команду /status, THE CalorieAI SHALL подсчитать использованные запросы за текущий день
2. WHEN CalorieAI подсчитывает статистику, THE CalorieAI SHALL определить оставшиеся бесплатные запросы на сегодня
3. WHEN CalorieAI формирует ответ, THE CalorieAI SHALL отобразить User класс, оставшиеся бесплатные запросы и количество purchased_requests
4. WHEN User класса PREMIUM или ADMIN запрашивает статус, THE CalorieAI SHALL отобразить сообщение о безлимитном доступе

### Requirement 10

**User Story:** Как разработчик, я хочу обрабатывать ошибки API и сети, чтобы пользователи получали понятные сообщения при сбоях

#### Acceptance Criteria

1. WHEN ChatGPT Vision API возвращает ошибку, THE CalorieAI SHALL логировать детали ошибки
2. WHEN происходит ошибка API, THE CalorieAI SHALL отправить User сообщение о временной недоступности сервиса
3. WHEN превышен таймаут запроса к API, THE CalorieAI SHALL отменить запрос и уведомить User
4. WHEN происходит ошибка подключения к PostgreSQL Database, THE CalorieAI SHALL логировать ошибку и попытаться переподключиться
5. IF ошибка критическая, THEN THE CalorieAI SHALL уведомить администратора через логирование
