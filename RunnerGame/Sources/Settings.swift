import UIKit
import SpriteKit

enum Settings {
    static var soundOn: Bool {
        get { !UserDefaults.standard.bool(forKey: "soundOff") }
        set { UserDefaults.standard.set(!newValue, forKey: "soundOff") }
    }
    static var musicOn: Bool {
        get { !UserDefaults.standard.bool(forKey: "musicOff") }
        set { UserDefaults.standard.set(!newValue, forKey: "musicOff") }
    }
    static var hapticsOn: Bool {
        get { !UserDefaults.standard.bool(forKey: "hapticsOff") }
        set { UserDefaults.standard.set(!newValue, forKey: "hapticsOff") }
    }
    static var worldIndex: Int {
        get { max(0, min(World.all.count - 1, UserDefaults.standard.integer(forKey: "world"))) }
        set { UserDefaults.standard.set(newValue, forKey: "world") }
    }
}

enum Haptics {
    static func notify(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        guard Settings.hapticsOn else { return }
        UINotificationFeedbackGenerator().notificationOccurred(type)
    }
}

/// Рекорды: случайный тоннель (отдельно для каждого мира) и каждый слот (slot == nil — случайный)
enum Records {
    private static func key(_ slot: Int?) -> String {
        slot.map { "best_slot_\($0)" } ?? "bestProgress_\(Settings.worldIndex)"
    }

    static func best(slot: Int?) -> Int { UserDefaults.standard.integer(forKey: key(slot)) }

    static func submit(_ progress: Int, slot: Int?) {
        if progress > best(slot: slot) { UserDefaults.standard.set(progress, forKey: key(slot)) }
    }

    static func reset(slot: Int?) { UserDefaults.standard.removeObject(forKey: key(slot)) }

    /// Сумма рекордов по мирам, чем сложнее мир — тем дороже процент (для таблицы лидеров)
    static func totalScore() -> Int {
        (0..<World.all.count).reduce(0) { $0 + UserDefaults.standard.integer(forKey: "bestProgress_\($1)") * ($1 + 1) }
    }

    static func resetAll() {
        for w in 0..<World.all.count { UserDefaults.standard.removeObject(forKey: "bestProgress_\(w)") }
        for s in 0..<LevelStore.slotCount { reset(slot: s) }
    }
}

enum Achievements {
    static let all: [(id: String, title: String, detail: String)] = [
        ("first_win", "Первый финиш", "Дойди до финиша"),
        ("half", "На полпути", "Пройди 50% случайного тоннеля"),
        ("world_0", "Хозяин подвала", "Победи в мире «Подвал»"),
        ("world_1", "Ледяной король", "Победи в мире «Лёд»"),
        ("world_2", "Покоритель лавы", "Победи в мире «Лава»"),
        ("builder", "Строитель", "Поставь 20 объектов в редакторе"),
        ("own_win", "Мой тоннель", "Пройди свой уровень"),
        ("sharer", "Делюсь", "Поделись уровнем")
    ]

    static func isUnlocked(_ id: String) -> Bool { UserDefaults.standard.bool(forKey: "ach_" + id) }

    /// true, если достижение получено впервые
    @discardableResult
    static func unlock(_ id: String) -> Bool {
        guard !isUnlocked(id) else { return false }
        UserDefaults.standard.set(true, forKey: "ach_" + id)
        return true
    }

    /// Открывает достижения и показывает плашку про новые
    static func announce(_ ids: [String], on parent: SKNode, at p: CGPoint) {
        var row = 0
        for id in ids where unlock(id) {
            guard let a = all.first(where: { $0.id == id }) else { continue }
            showBanner("🏆 " + a.title, on: parent, at: CGPoint(x: p.x, y: p.y - CGFloat(row) * 28))
            row += 1
        }
    }
}
