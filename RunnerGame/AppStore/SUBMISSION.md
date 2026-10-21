# Публикация в App Store: чек-лист

Нужен платный аккаунт Apple Developer (99 $/год) и Mac с Xcode.

## 1. Подготовка проекта
1. В `project.yml` замените `com.example.runner` (и `bundleIdPrefix`) на свой Bundle ID, например `com.ivan.tunnel`.
2. `xcodegen generate`, откройте `Runner.xcodeproj`.
3. Target → Signing & Capabilities → выберите Team. Нажмите «+ Capability» → **Game Center** (для таблицы лидеров).
4. Запустите на реальном телефоне, пройдите все экраны.
5. В `Sources/GameCenter.swift` замените `leaderboardID` на ID вашей таблицы.

## 2. App Store Connect
1. My Apps → «+» → New App, Bundle ID — ваш.
2. Features → Game Center → создайте таблицу лидеров (Classic, Best score, Integer, высокий счёт — лучший) с ID из шага 1.5.
3. Заполните текст из `listing.md`, ссылку на политику конфиденциальности (разместите `privacy-policy.md` на любой странице, например GitHub Pages) и вопросы о возрасте.
4. App Privacy → «Data Not Collected».
5. Export compliance уже настроен (`ITSAppUsesNonEncryption = false`).

## 3. Скриншоты
Обязателен набор для 6.9" iPhone (1320×2868). Сделайте их в симуляторе iPhone 16/17 Pro Max: меню, игра в каждом из миров, редактор, достижения. Скриншот в симуляторе — Cmd+S.

## 4. Загрузка
Product → Archive → Distribute App → App Store Connect → Upload. Затем выберите билд в карточке версии и отправьте на проверку (Submit for Review).
