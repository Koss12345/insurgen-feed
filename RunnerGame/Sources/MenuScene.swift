import SpriteKit

final class MenuScene: SKScene {
    private var slotButton: SKShapeNode!
    private var worldButton: SKShapeNode!
    private var subLabel = SKLabelNode()

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1)

        let title = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        title.text = "ТОННЕЛЬ"
        title.fontSize = 48
        title.position = CGPoint(x: size.width / 2, y: size.height - 150)
        addChild(title)

        subLabel = SKLabelNode(fontNamed: "AvenirNext-Medium")
        subLabel.fontSize = 18
        subLabel.position = CGPoint(x: size.width / 2, y: size.height - 190)
        addChild(subLabel)

        let items = [("Случайный тоннель", "random"), ("", "world"), ("Играть свой уровень", "custom"),
                     ("", "slot"), ("Редактор", "editor"), ("Достижения", "achievements"), ("Настройки", "settings")]
        for (i, item) in items.enumerated() {
            let b = makeButton(item.0, name: item.1, size: CGSize(width: 280, height: 52))
            b.position = CGPoint(x: size.width / 2, y: size.height / 2 + 190 - CGFloat(i) * 64)
            addChild(b)
            switch item.1 {
            case "world", "slot": b.fillColor = SKColor(red: 0.3, green: 0.3, blue: 0.4, alpha: 1)
            default: break
            }
            if item.1 == "world" { worldButton = b }
            if item.1 == "slot" { slotButton = b }
        }
        refresh()
    }

    private func refresh() {
        let world = World.current
        subLabel.text = "Рекорд в мире «\(world.name)»: \(Records.best(slot: nil))%"
        setButtonTitle(worldButton, "Мир: \(world.name)")
        let slot = LevelStore.currentSlot
        let count = LevelStore.load(slot: slot)?.obstacles.count ?? 0
        setButtonTitle(slotButton, "Слот \(slot + 1)/\(LevelStore.slotCount) · \(count) об. · \(Records.best(slot: slot))%")
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first, let name = buttonName(at: t.location(in: self)) else { return }
        let next: SKScene
        switch name {
        case "random": next = PlayScene(size: size, source: .random)
        case "custom": next = PlayScene(size: size, source: .custom)
        case "world":
            Settings.worldIndex = (Settings.worldIndex + 1) % World.all.count
            refresh()
            return
        case "slot":
            LevelStore.currentSlot = (LevelStore.currentSlot + 1) % LevelStore.slotCount
            refresh()
            return
        case "achievements": next = AchievementsScene(size: size)
        case "settings": next = SettingsScene(size: size)
        default: next = EditorScene(size: size)
        }
        next.scaleMode = scaleMode
        view?.presentScene(next)
    }
}
