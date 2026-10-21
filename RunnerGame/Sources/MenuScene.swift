import SpriteKit

final class MenuScene: SKScene {
    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1)

        let title = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        title.text = "ТОННЕЛЬ"
        title.fontSize = 48
        title.position = CGPoint(x: size.width / 2, y: size.height - 220)
        addChild(title)

        let best = UserDefaults.standard.integer(forKey: "bestProgress")
        let sub = SKLabelNode(fontNamed: "AvenirNext-Medium")
        sub.text = "Лучший результат: \(best)%"
        sub.fontSize = 18
        sub.position = CGPoint(x: size.width / 2, y: size.height - 260)
        addChild(sub)

        let items = [("Случайный тоннель", "random"), ("Мой уровень", "custom"), ("Редактор", "editor")]
        for (i, item) in items.enumerated() {
            let b = makeButton(item.0, name: item.1, size: CGSize(width: 260, height: 56))
            b.position = CGPoint(x: size.width / 2, y: size.height / 2 - CGFloat(i) * 80)
            addChild(b)
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first, let name = buttonName(at: t.location(in: self)) else { return }
        let next: SKScene
        switch name {
        case "random": next = PlayScene(size: size, source: .random)
        case "custom": next = PlayScene(size: size, source: .custom)
        default: next = EditorScene(size: size)
        }
        next.scaleMode = scaleMode
        view?.presentScene(next)
    }
}
