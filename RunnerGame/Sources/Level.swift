import SpriteKit

struct Obstacle: Codable {
    enum Kind: String, Codable { case block, spike, mover }

    static let moverRange: CGFloat = 50

    var x: CGFloat
    var y: CGFloat
    var w: CGFloat
    var h: CGFloat
    var kind: Kind

    init(x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat, kind: Kind = .block) {
        self.x = x; self.y = y; self.w = w; self.h = h; self.kind = kind
    }

    // Старые сохранения не знают про kind — считаем их блоками
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        x = try c.decode(CGFloat.self, forKey: .x)
        y = try c.decode(CGFloat.self, forKey: .y)
        w = try c.decode(CGFloat.self, forKey: .w)
        h = try c.decode(CGFloat.self, forKey: .h)
        kind = try c.decodeIfPresent(Kind.self, forKey: .kind) ?? .block
    }

    func xOffset(_ t: TimeInterval) -> CGFloat {
        kind == .mover ? Obstacle.moverRange * sin(CGFloat(t) * 1.8 + y * 0.01) : 0
    }

    /// Опасная зона в момент t (у шипов и пилы чуть меньше картинки)
    func rect(at t: TimeInterval) -> CGRect {
        let inset: CGFloat
        switch kind {
        case .block: inset = 0
        case .spike: inset = 0.2
        case .mover: inset = 0.12
        }
        return CGRect(x: x + xOffset(t) - w / 2, y: y - h / 2, width: w, height: h)
            .insetBy(dx: w * inset, dy: h * inset)
    }

    /// Вся область, которую занимает объект (для удаления в редакторе)
    var sweepRect: CGRect {
        let r = CGRect(x: x - w / 2, y: y - h / 2, width: w, height: h)
        return kind == .mover ? r.insetBy(dx: -Obstacle.moverRange, dy: 0) : r
    }
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
            let roll = Int.random(in: 0..<100)
            if roll < 20 {
                // Пила, ездит в центре — по бокам всегда есть проход
                obstacles.append(Obstacle(x: CGFloat.random(in: 170...220), y: y, w: 44, h: 44, kind: .mover))
            } else if roll < 45 {
                let w = CGFloat.random(in: 50...130)
                let x = CGFloat.random(in: (minX + w / 2)...(maxX - w / 2))
                obstacles.append(Obstacle(x: x, y: y, w: w, h: CGFloat.random(in: 28...40), kind: .spike))
            } else if roll < 70 {
                let w = CGFloat.random(in: 40...140)
                let x = CGFloat.random(in: (minX + w / 2)...(maxX - w / 2))
                obstacles.append(Obstacle(x: x, y: y, w: w, h: CGFloat.random(in: 30...60)))
            } else {
                // Два блока от стен, между ними всегда есть проход >= 100
                let h = CGFloat.random(in: 30...60)
                let wl = CGFloat.random(in: 40...100)
                let wr = CGFloat.random(in: 40...100)
                obstacles.append(Obstacle(x: minX + wl / 2, y: y, w: wl, h: h))
                obstacles.append(Obstacle(x: maxX - wr / 2, y: y, w: wr, h: h))
            }
            y += CGFloat.random(in: 150...230)
        }
        return Level(obstacles: obstacles)
    }

    // MARK: - Обмен уровнями

    private static let shareTag = "TUNNEL1:"

    func shareCode() -> String {
        let data = (try? JSONEncoder().encode(self)) ?? Data()
        return Level.shareTag + data.base64EncodedString()
    }

    static func fromShareCode(_ text: String) -> Level? {
        let t = text.components(separatedBy: .whitespacesAndNewlines).joined()
        guard t.hasPrefix(shareTag),
              let data = Data(base64Encoded: String(t.dropFirst(shareTag.count))),
              let level = try? JSONDecoder().decode(Level.self, from: data) else { return nil }
        // Код приходит снаружи — приводим значения к допустимым
        let clean = level.obstacles.prefix(300).compactMap { o -> Obstacle? in
            guard o.x.isFinite, o.y.isFinite, o.w.isFinite, o.h.isFinite else { return nil }
            let w = max(10, min(200, o.w)), h = max(10, min(200, o.h))
            let pad = w / 2 + (o.kind == .mover ? Obstacle.moverRange : 0)
            guard pad < (maxX - minX) / 2 else { return nil }
            return Obstacle(x: max(minX + pad, min(maxX - pad, o.x)),
                            y: max(0, min(length, o.y)), w: w, h: h, kind: o.kind)
        }
        return Level(obstacles: Array(clean))
    }
}

enum LevelStore {
    static let slotCount = 5

    static var currentSlot: Int {
        get { max(0, min(slotCount - 1, UserDefaults.standard.integer(forKey: "slot"))) }
        set { UserDefaults.standard.set(newValue, forKey: "slot") }
    }

    // Слот 0 хранится под старым ключом, чтобы не потерять прежний уровень
    private static func key(_ slot: Int) -> String { slot == 0 ? "customLevel" : "level_\(slot)" }

    static func load(slot: Int = currentSlot) -> Level? {
        guard let data = UserDefaults.standard.data(forKey: key(slot)) else { return nil }
        return try? JSONDecoder().decode(Level.self, from: data)
    }

    static func save(_ level: Level, slot: Int = currentSlot) {
        if let data = try? JSONEncoder().encode(level) {
            UserDefaults.standard.set(data, forKey: key(slot))
        }
    }
}

// MARK: - Графика (рисуется кодом)

private func lines(_ build: (CGMutablePath) -> Void) -> CGPath {
    let p = CGMutablePath()
    build(p)
    return p
}

func makeTunnelNode() -> SKNode {
    let root = SKNode()
    let bottom: CGFloat = -1000
    let top = Level.length + 1500
    let midX = (Level.minX + Level.maxX) / 2

    let floor = SKSpriteNode(color: SKColor(red: 0.17, green: 0.19, blue: 0.27, alpha: 1),
                             size: CGSize(width: Level.maxX - Level.minX, height: top - bottom))
    floor.anchorPoint = CGPoint(x: 0.5, y: 0)
    floor.position = CGPoint(x: midX, y: bottom)
    root.addChild(floor)

    // Плитка на полу
    let grid = SKShapeNode(path: lines { p in
        for y in stride(from: bottom, through: top, by: 60) {
            p.move(to: CGPoint(x: Level.minX, y: y)); p.addLine(to: CGPoint(x: Level.maxX, y: y))
        }
        for x in stride(from: Level.minX + 60, to: Level.maxX, by: 60) {
            p.move(to: CGPoint(x: x, y: bottom)); p.addLine(to: CGPoint(x: x, y: top))
        }
    })
    grid.strokeColor = SKColor(white: 1, alpha: 0.06)
    grid.lineWidth = 1
    grid.zPosition = 0.5
    root.addChild(grid)

    // Кирпичные стены
    for (x0, x1) in [(CGFloat(0), Level.minX), (Level.maxX, CGFloat(390))] {
        let bg = SKSpriteNode(color: SKColor(red: 0.10, green: 0.09, blue: 0.13, alpha: 1),
                              size: CGSize(width: x1 - x0, height: top - bottom))
        bg.anchorPoint = .zero
        bg.position = CGPoint(x: x0, y: bottom)
        bg.zPosition = 1
        root.addChild(bg)

        let bricks = SKShapeNode(path: lines { p in
            var row = 0
            for y in stride(from: bottom, through: top, by: 30) {
                p.move(to: CGPoint(x: x0, y: y)); p.addLine(to: CGPoint(x: x1, y: y))
                let shift: CGFloat = row % 2 == 0 ? 0 : 15
                for x in stride(from: x0 + shift, to: x1, by: 30) where x > x0 {
                    p.move(to: CGPoint(x: x, y: y)); p.addLine(to: CGPoint(x: x, y: y + 30))
                }
                row += 1
            }
        })
        bricks.strokeColor = SKColor(white: 1, alpha: 0.07)
        bricks.lineWidth = 1
        bricks.zPosition = 1.1
        root.addChild(bricks)
    }

    // Неоновые края тоннеля
    let edges = SKShapeNode(path: lines { p in
        for x in [Level.minX, Level.maxX] {
            p.move(to: CGPoint(x: x, y: bottom)); p.addLine(to: CGPoint(x: x, y: top))
        }
    })
    edges.strokeColor = SKColor(red: 0.3, green: 0.8, blue: 1, alpha: 0.8)
    edges.lineWidth = 3
    edges.glowWidth = 3
    edges.zPosition = 1.2
    root.addChild(edges)

    // Финиш в шашечку
    let cell: CGFloat = 20
    let cols = Int((Level.maxX - Level.minX) / cell)
    for row in 0..<2 {
        for col in 0..<cols {
            let sq = SKSpriteNode(color: (row + col) % 2 == 0 ? .white : SKColor(white: 0.1, alpha: 1),
                                  size: CGSize(width: cell, height: cell))
            sq.position = CGPoint(x: Level.minX + cell * (CGFloat(col) + 0.5),
                                  y: Level.length + cell * (CGFloat(row) + 0.5))
            sq.zPosition = 1.5
            root.addChild(sq)
        }
    }
    let label = SKLabelNode(fontNamed: "AvenirNext-Heavy")
    label.text = "ФИНИШ"
    label.fontSize = 28
    label.position = CGPoint(x: midX, y: Level.length + 60)
    label.zPosition = 1.5
    root.addChild(label)
    return root
}

func makeObstacleNode(_ o: Obstacle) -> SKNode {
    let node: SKNode
    switch o.kind {
    case .block:
        let crate = SKShapeNode(rectOf: CGSize(width: o.w, height: o.h), cornerRadius: 5)
        crate.fillColor = SKColor(red: 0.72, green: 0.45, blue: 0.2, alpha: 1)
        crate.strokeColor = SKColor(red: 0.42, green: 0.25, blue: 0.1, alpha: 1)
        crate.lineWidth = 3
        let cross = SKShapeNode(path: lines { p in
            let hw = o.w / 2 - 6, hh = o.h / 2 - 6
            p.move(to: CGPoint(x: -hw, y: -hh)); p.addLine(to: CGPoint(x: hw, y: hh))
            p.move(to: CGPoint(x: -hw, y: hh)); p.addLine(to: CGPoint(x: hw, y: -hh))
        })
        cross.strokeColor = SKColor(red: 0.42, green: 0.25, blue: 0.1, alpha: 0.7)
        cross.lineWidth = 3
        crate.addChild(cross)
        node = crate
    case .spike:
        let n = max(1, Int(o.w / 22))
        let tw = o.w / CGFloat(n)
        let spikes = SKShapeNode(path: lines { p in
            for i in 0..<n {
                let x0 = -o.w / 2 + CGFloat(i) * tw
                p.move(to: CGPoint(x: x0, y: -o.h / 2))
                p.addLine(to: CGPoint(x: x0 + tw / 2, y: o.h / 2))
                p.addLine(to: CGPoint(x: x0 + tw, y: -o.h / 2))
                p.closeSubpath()
            }
        })
        spikes.fillColor = SKColor(red: 0.82, green: 0.86, blue: 0.92, alpha: 1)
        spikes.strokeColor = SKColor(red: 0.35, green: 0.4, blue: 0.5, alpha: 1)
        spikes.lineWidth = 2
        node = spikes
    case .mover:
        let r = o.w / 2
        let blade = SKShapeNode(path: lines { p in
            let teeth = 10
            for i in 0..<(teeth * 2) {
                let a = CGFloat(i) * .pi / CGFloat(teeth)
                let rr = i % 2 == 0 ? r : r * 0.72
                let pt = CGPoint(x: cos(a) * rr, y: sin(a) * rr)
                if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
            }
            p.closeSubpath()
        })
        blade.fillColor = SKColor(red: 0.75, green: 0.78, blue: 0.85, alpha: 1)
        blade.strokeColor = SKColor(red: 0.9, green: 0.3, blue: 0.3, alpha: 1)
        blade.lineWidth = 2
        let hub = SKShapeNode(circleOfRadius: r * 0.28)
        hub.fillColor = SKColor(red: 0.9, green: 0.3, blue: 0.3, alpha: 1)
        hub.strokeColor = .clear
        blade.addChild(hub)
        blade.run(.repeatForever(.rotate(byAngle: .pi * 2, duration: 0.6)))
        node = blade
    }
    node.name = "obs"
    node.position = CGPoint(x: o.x, y: o.y)
    node.zPosition = 2
    return node
}

/// Рельса, по которой ездит пила
func makeRailNode(_ o: Obstacle) -> SKNode {
    let rail = SKShapeNode(path: lines { p in
        p.move(to: CGPoint(x: o.x - Obstacle.moverRange, y: o.y))
        p.addLine(to: CGPoint(x: o.x + Obstacle.moverRange, y: o.y))
    })
    rail.strokeColor = SKColor(red: 0.9, green: 0.3, blue: 0.3, alpha: 0.35)
    rail.lineWidth = 4
    rail.zPosition = 1.8
    return rail
}

func makeButton(_ title: String, name: String, size: CGSize = CGSize(width: 150, height: 44)) -> SKShapeNode {
    let b = SKShapeNode(rectOf: size, cornerRadius: 12)
    b.name = "btn_" + name
    b.fillColor = SKColor(red: 0.25, green: 0.45, blue: 0.9, alpha: 1)
    b.strokeColor = SKColor(white: 1, alpha: 0.25)
    b.zPosition = 20
    let l = SKLabelNode(fontNamed: "AvenirNext-Bold")
    l.text = title
    l.fontSize = 17
    l.verticalAlignmentMode = .center
    b.addChild(l)
    return b
}

func setButtonTitle(_ b: SKShapeNode, _ title: String) {
    (b.children.first as? SKLabelNode)?.text = title
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
