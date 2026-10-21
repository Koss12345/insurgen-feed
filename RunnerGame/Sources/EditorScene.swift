import SpriteKit

final class EditorScene: SKScene {
    private var level = LevelStore.load() ?? Level(obstacles: [])
    private let cam = SKCameraNode()
    private let obstacleLayer = SKNode()
    private var brushLabel = SKLabelNode()

    private let brushes: [(name: String, w: CGFloat, h: CGFloat)] = [
        ("Малый", 40, 40), ("Стенка", 120, 28), ("Большой", 80, 80)
    ]
    private var brush = 0
    private var moved: CGFloat = 0

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1)
        addChild(makeTunnelNode())
        addChild(obstacleLayer)
        redraw()

        camera = cam
        cam.position = CGPoint(x: size.width / 2, y: size.height / 2)
        addChild(cam)

        brushLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
        brushLabel.fontSize = 18
        brushLabel.position = CGPoint(x: 0, y: size.height / 2 - 60)
        brushLabel.zPosition = 20
        cam.addChild(brushLabel)
        updateBrushLabel()

        let hint = SKLabelNode(fontNamed: "AvenirNext-Medium")
        hint.text = "Тап — поставить/убрать, тяни — листать вверх"
        hint.fontSize = 13
        hint.position = CGPoint(x: 0, y: size.height / 2 - 85)
        hint.zPosition = 20
        cam.addChild(hint)

        let bottom = -size.height / 2
        let layout: [(String, String, CGFloat, CGFloat)] = [
            ("Кисть", "brush", -85, bottom + 100), ("Очистить", "clear", 85, bottom + 100),
            ("Играть", "play", -85, bottom + 45), ("Меню", "menu", 85, bottom + 45)
        ]
        for (title, name, x, y) in layout {
            let b = makeButton(title, name: name, size: CGSize(width: 160, height: 44))
            b.position = CGPoint(x: x, y: y)
            cam.addChild(b)
        }
    }

    private func updateBrushLabel() {
        brushLabel.text = "Кисть: \(brushes[brush].name) · блоков: \(level.obstacles.count)"
    }

    private func redraw() {
        obstacleLayer.removeAllChildren()
        level.obstacles.forEach { obstacleLayer.addChild(makeObstacleNode($0)) }
    }

    // MARK: - Ввод

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) { moved = 0 }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        let dy = t.location(in: cam).y - t.previousLocation(in: cam).y
        moved += abs(dy)
        let minY = size.height / 2
        let maxY = Level.length + size.height / 2 - 100
        cam.position.y = max(minY, min(maxY, cam.position.y - dy))
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first, moved < 10 else { return }
        let p = t.location(in: self)
        if let name = buttonName(at: p) { handleButton(name); return }
        placeOrRemove(at: p)
    }

    private func handleButton(_ name: String) {
        switch name {
        case "brush": brush = (brush + 1) % brushes.count
        case "clear": level.obstacles.removeAll(); redraw()
        case "play":
            LevelStore.save(level)
            let s = PlayScene(size: size, source: .custom)
            s.scaleMode = scaleMode
            view?.presentScene(s)
            return
        default:
            LevelStore.save(level)
            let s = MenuScene(size: size)
            s.scaleMode = scaleMode
            view?.presentScene(s)
            return
        }
        updateBrushLabel()
    }

    private func placeOrRemove(at p: CGPoint) {
        if let i = level.obstacles.lastIndex(where: { $0.rect.insetBy(dx: -8, dy: -8).contains(p) }) {
            level.obstacles.remove(at: i)
        } else {
            let b = brushes[brush]
            let x = max(Level.minX + b.w / 2, min(Level.maxX - b.w / 2, snap(p.x)))
            let y = max(300, min(Level.length - 100, snap(p.y)))
            level.obstacles.append(Obstacle(x: x, y: y, w: b.w, h: b.h))
        }
        redraw()
        updateBrushLabel()
        LevelStore.save(level)
    }

    private func snap(_ v: CGFloat) -> CGFloat { (v / 10).rounded() * 10 }
}
