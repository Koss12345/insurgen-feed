import SpriteKit

/// Мир = цвета тоннеля + сложность
struct World {
    let name: String
    let floor: SKColor
    let wall: SKColor
    let edge: SKColor
    let baseSpeed: CGFloat
    let gain: CGFloat
    let spacing: ClosedRange<CGFloat>
    let icy: Bool

    static let all = [
        World(name: "Подвал", floor: SKColor(red: 0.17, green: 0.19, blue: 0.27, alpha: 1),
              wall: SKColor(red: 0.10, green: 0.09, blue: 0.13, alpha: 1),
              edge: SKColor(red: 0.3, green: 0.8, blue: 1, alpha: 0.8),
              baseSpeed: 200, gain: 30, spacing: 190...260, icy: false),
        World(name: "Лёд", floor: SKColor(red: 0.45, green: 0.62, blue: 0.75, alpha: 1),
              wall: SKColor(red: 0.18, green: 0.28, blue: 0.38, alpha: 1),
              edge: SKColor(red: 0.85, green: 0.97, blue: 1, alpha: 0.9),
              baseSpeed: 240, gain: 40, spacing: 150...230, icy: true),
        World(name: "Лава", floor: SKColor(red: 0.30, green: 0.12, blue: 0.10, alpha: 1),
              wall: SKColor(red: 0.12, green: 0.05, blue: 0.05, alpha: 1),
              edge: SKColor(red: 1, green: 0.45, blue: 0.1, alpha: 0.9),
              baseSpeed: 290, gain: 55, spacing: 120...190, icy: false)
    ]

    static var current: World { all[Settings.worldIndex] }
}
