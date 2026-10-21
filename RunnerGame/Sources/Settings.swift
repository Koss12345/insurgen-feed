import UIKit

enum Settings {
    static var soundOn: Bool {
        get { !UserDefaults.standard.bool(forKey: "soundOff") }
        set { UserDefaults.standard.set(!newValue, forKey: "soundOff") }
    }
    static var hapticsOn: Bool {
        get { !UserDefaults.standard.bool(forKey: "hapticsOff") }
        set { UserDefaults.standard.set(!newValue, forKey: "hapticsOff") }
    }
}

enum Haptics {
    static func notify(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        guard Settings.hapticsOn else { return }
        UINotificationFeedbackGenerator().notificationOccurred(type)
    }
}

/// Рекорды: случайный тоннель и каждый слот хранятся отдельно (slot == nil — случайный)
enum Records {
    private static func key(_ slot: Int?) -> String { slot.map { "best_slot_\($0)" } ?? "bestProgress" }

    static func best(slot: Int?) -> Int { UserDefaults.standard.integer(forKey: key(slot)) }

    static func submit(_ progress: Int, slot: Int?) {
        if progress > best(slot: slot) { UserDefaults.standard.set(progress, forKey: key(slot)) }
    }

    static func reset(slot: Int?) { UserDefaults.standard.removeObject(forKey: key(slot)) }

    static func resetAll() {
        reset(slot: nil)
        for s in 0..<LevelStore.slotCount { reset(slot: s) }
    }
}
