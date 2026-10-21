import SpriteKit

struct Obstacle: Codable {
    var x: CGFloat
    var y: CGFloat
    var w: CGFloat
    var h: CGFloat

    var rect: CGRect { CGRect(x: x - w / 2, y: y - h / 2, width: w, height: h) }
}

struct Level: Codable {
    var obstacles: [Obstacle]

    static let length: CGFloat = 4000
    static let minX: CGFloat = 45
    static let maxX: CGFloat = 345

    static func random() -> Level {
        var obstacles: [Obstacle] = []
        var y: CGFloat = 500
        while y < length - 200 {
            let h = CGFloat.random(in: 30...60)
            if Bool.random() {
                let w = CGFloat.random(in: 40...140)
                let x = CGFloat.random(in: (minX + w / 2)...(maxX - w / 2))
                obstacles.append(Obstacle(x: x, y: y, w: w, h: h))
            } else {
                // Два блока от стен, между ними всегда есть проход >= 100
                let wl = CGFloat.random(in: 40...100)
                let wr = CGFloat.random(in: 40...100)
                obstacles.append(Obstacle(x: minX + wl / 2, y: y, w: wl, h: h))
                obstacles.append(Obstacle(x: maxX - wr / 2, y: y, w: wr, h: h))
            }
            y += CGFloat.random(in: 150...230)
        }
        return Level(obstacles: obstacles)
    }
}

enum LevelStore {
    private static let key = "customLevel"

    static func load() -> Level? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(Level.self, from: data)
    }

    static func save(_ level: Level) {
        if let data = try? JSONEncoder().encode(level) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}

// MARK: - Общие узлы

func makeTunnelNode() -> SKNode {
    let root = SKNode()
    let width = Level.maxX - Level.minX
    let top = Level.length + 1500

    let floor = SKSpriteNode(color: SKColor(red: 0.20, green: 0.22, blue: 0.30, alpha: 1),
                             size: CGSize(width: width, height: top + 1000))
    floor.anchorPoint = CGPoint(x: 0.5, y: 0)
    floor.position = CGPoint(x: (Level.minX + Level.maxX) / 2, y: -1000)
    root.addChild(floor)

    for (x, anchor) in [(Level.minX, CGFloat(1)), (Level.maxX, CGFloat(0))] {
        let wall = SKSpriteNode(color: SKColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1),
                                size: CGSize(width: 60, height: top + 1000))
        wall.anchorPoint = CGPoint(x: anchor, y: 0)
        wall.position = CGPoint(x: x, y: -1000)
        wall.zPosition = 1
        root.addChild(wall)
    }

    var y: CGFloat = -500
    while y < top {
        let tick = SKSpriteNode(color: SKColor(white: 1, alpha: 0.08), size: CGSize(width: 4, height: 30))
        tick.position = CGPoint(x: (Level.minX + Level.maxX) / 2, y: y)
        root.addChild(tick)
        y += 100
    }

    let finish = SKSpriteNode(color: SKColor(red: 0.3, green: 0.9, blue: 0.5, alpha: 1),
                              size: CGSize(width: width, height: 10))
    finish.position = CGPoint(x: (Level.minX + Level.maxX) / 2, y: Level.length)
    root.addChild(finish)
    let label = SKLabelNode(fontNamed: "AvenirNext-Bold")
    label.text = "ФИНИШ"
    label.fontSize = 28
    label.position = CGPoint(x: 195, y: Level.length + 30)
    root.addChild(label)
    return root
}

func makeObstacleNode(_ o: Obstacle) -> SKNode {
    let node = SKShapeNode(rectOf: CGSize(width: o.w, height: o.h), cornerRadius: 6)
    node.name = "obs"
    node.fillColor = SKColor(red: 0.95, green: 0.35, blue: 0.4, alpha: 1)
    node.strokeColor = SKColor(red: 1, green: 0.6, blue: 0.65, alpha: 1)
    node.position = CGPoint(x: o.x, y: o.y)
    node.zPosition = 2
    return node
}

func makeButton(_ title: String, name: String, size: CGSize = CGSize(width: 150, height: 44)) -> SKShapeNode {
    let b = SKShapeNode(rectOf: size, cornerRadius: 12)
    b.name = "btn_" + name
    b.fillColor = SKColor(red: 0.25, green: 0.45, blue: 0.9, alpha: 1)
    b.strokeColor = .clear
    b.zPosition = 20
    let l = SKLabelNode(fontNamed: "AvenirNext-Bold")
    l.text = title
    l.fontSize = 18
    l.verticalAlignmentMode = .center
    b.addChild(l)
    return b
}

extension SKScene {
    /// Имя кнопки под касанием (кнопки названы "btn_...")
    func buttonName(at point: CGPoint) -> String? {
        for node in nodes(at: point) {
            var n: SKNode? = node
            while let cur = n {
                if let name = cur.name, name.hasPrefix("btn_") { return String(name.dropFirst(4)) }
                n = cur.parent
            }
        }
        return nil
    }
}
