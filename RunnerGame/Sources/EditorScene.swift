import SpriteKit
import UIKit

final class EditorScene: SKScene {
    private struct Brush {
        let name: String
        let kind: Obstacle.Kind
        let w: CGFloat
        let h: CGFloat
    }

    private let brushes = [
        Brush(name: "Ящик", kind: .block, w: 40, h: 40),
        Brush(name: "Стенка", kind: .block, w: 120, h: 28),
        Brush(name: "Большой", kind: .block, w: 80, h: 80),
        Brush(name: "Шипы", kind: .spike, w: 80, h: 30),
        Brush(name: "Пила", kind: .mover, w: 44, h: 44),
        Brush(name: "Лазер", kind: .laser, w: 100, h: 14),
        Brush(name: "Лужа", kind: .mud, w: 100, h: 60)
    ]
    private var brush = 0
    private var level = LevelStore.load() ?? Level(obstacles: [])
    private var moved: CGFloat = 0

    private let cam = SKCameraNode()
    private let obstacleLayer = SKNode()
    private var infoLabel = SKLabelNode()
    private var brushButton: SKShapeNode!
    private var slotButton: SKShapeNode!

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1)
        addChild(makeTunnelNode())
        addChild(obstacleLayer)
        redraw()

        camera = cam
        cam.position = CGPoint(x: size.width / 2, y: size.height / 2)
        addChild(cam)

        infoLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
        infoLabel.fontSize = 17
        infoLabel.position = CGPoint(x: 0, y: size.height / 2 - 55)
        infoLabel.zPosition = 20
        cam.addChild(infoLabel)

        let hint = SKLabelNode(fontNamed: "AvenirNext-Medium")
        hint.text = "Тап — поставить или убрать, тяни — листать"
        hint.fontSize = 13
        hint.position = CGPoint(x: 0, y: size.height / 2 - 78)
        hint.zPosition = 20
        cam.addChild(hint)

        let bottom = -size.height / 2
        let panel = SKSpriteNode(color: SKColor(white: 0, alpha: 0.6), size: CGSize(width: size.width, height: 190))
        panel.position = CGPoint(x: 0, y: bottom + 95)
        panel.zPosition = 15
        cam.addChild(panel)

        let rows: [[(String, String)]] = [
            [("", "brush"), ("", "slot")],
            [("Очистить", "clear"), ("Импорт", "import")],
            [("Поделиться", "share"), ("Меню", "menu")],
            [("Играть", "play")]
        ]
        for (r, row) in rows.reversed().enumerated() {
            let y = bottom + 30 + CGFloat(r) * 44
            for (c, item) in row.enumerated() {
                let single = row.count == 1
                let b = makeButton(item.0, name: item.1, size: CGSize(width: single ? 350 : 170, height: 38))
                b.position = CGPoint(x: single ? 0 : (c == 0 ? -92 : 92), y: y)
                cam.addChild(b)
                if item.1 == "brush" { brushButton = b }
                if item.1 == "slot" { slotButton = b }
                if item.1 == "play" { b.fillColor = SKColor(red: 0.2, green: 0.65, blue: 0.4, alpha: 1) }
            }
        }
        updateLabels()
    }

    private func updateLabels() {
        setButtonTitle(brushButton, "Кисть: \(brushes[brush].name)")
        setButtonTitle(slotButton, "Слот \(LevelStore.currentSlot + 1)/\(LevelStore.slotCount)")
        infoLabel.text = "Объектов: \(level.obstacles.count)"
    }

    private func redraw() {
        obstacleLayer.removeAllChildren()
        for o in level.obstacles {
            let node = makeObstacleNode(o)
            obstacleLayer.addChild(node)
            if o.kind == .mover { obstacleLayer.addChild(makeRailNode(o)) }
            if o.isAnimated {
                node.run(.repeatForever(.customAction(withDuration: 1000) { n, t in
                    applyAnimation(o, to: n, at: TimeInterval(t))
                }))
            }
        }
    }

    private func toast(_ text: String) {
        let l = SKLabelNode(fontNamed: "AvenirNext-Bold")
        l.text = text
        l.fontSize = 20
        l.position = CGPoint(x: 0, y: 40)
        l.zPosition = 30
        cam.addChild(l)
        l.run(.sequence([.wait(forDuration: 1.2), .fadeOut(withDuration: 0.4), .removeFromParent()]))
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
        if t.location(in: cam).y < -size.height / 2 + 190 { return }  // нижняя панель
        placeOrRemove(at: p)
    }

    private func go(to next: SKScene) {
        LevelStore.save(level)
        next.scaleMode = scaleMode
        view?.presentScene(next)
    }

    private func handleButton(_ name: String) {
        switch name {
        case "brush":
            brush = (brush + 1) % brushes.count
        case "slot":
            LevelStore.save(level)
            LevelStore.currentSlot = (LevelStore.currentSlot + 1) % LevelStore.slotCount
            level = LevelStore.load() ?? Level(obstacles: [])
            redraw()
        case "clear":
            Records.reset(slot: LevelStore.currentSlot)
            level.obstacles.removeAll()
            redraw()
            LevelStore.save(level)
        case "share":
            guard !level.obstacles.isEmpty else { toast("Уровень пустой"); return }
            Achievements.announce(["sharer"], on: cam, at: CGPoint(x: 0, y: 100))
            let vc = UIActivityViewController(activityItems: [level.shareCode()], applicationActivities: nil)
            view?.window?.rootViewController?.present(vc, animated: true)
        case "import":
            if let text = UIPasteboard.general.string, let imported = Level.fromShareCode(text) {
                Records.reset(slot: LevelStore.currentSlot)
                level = imported
                redraw()
                LevelStore.save(level)
                toast("Уровень загружен в слот \(LevelStore.currentSlot + 1)")
            } else {
                toast("В буфере нет кода уровня")
            }
        case "play":
            go(to: PlayScene(size: size, source: .custom)); return
        default:
            go(to: MenuScene(size: size)); return
        }
        updateLabels()
    }

    private func placeOrRemove(at p: CGPoint) {
        Records.reset(slot: LevelStore.currentSlot)
        if let i = level.obstacles.lastIndex(where: { $0.sweepRect.insetBy(dx: -8, dy: -8).contains(p) }) {
            level.obstacles.remove(at: i)
            Sound.shared.play(.remove)
        } else {
            let b = brushes[brush]
            let pad = b.w / 2 + (b.kind == .mover ? Obstacle.moverRange : 0)
            let x = max(Level.minX + pad, min(Level.maxX - pad, snap(p.x)))
            let y = max(300, min(Level.length - 100, snap(p.y)))
            level.obstacles.append(Obstacle(x: x, y: y, w: b.w, h: b.h, kind: b.kind))
            Sound.shared.play(.place)
            let placed = UserDefaults.standard.integer(forKey: "placed") + 1
            UserDefaults.standard.set(placed, forKey: "placed")
            if placed >= 20 { Achievements.announce(["builder"], on: cam, at: CGPoint(x: 0, y: 100)) }
        }
        redraw()
        updateLabels()
        LevelStore.save(level)
    }

    private func snap(_ v: CGFloat) -> CGFloat { (v / 10).rounded() * 10 }
}
