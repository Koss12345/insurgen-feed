import SpriteKit

final class SettingsScene: SKScene {
    private var soundButton: SKShapeNode!
    private var musicButton: SKShapeNode!
    private var hapticsButton: SKShapeNode!
    private var resetButton: SKShapeNode!

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1)

        let title = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        title.text = "НАСТРОЙКИ"
        title.fontSize = 40
        title.position = CGPoint(x: size.width / 2, y: size.height - 200)
        addChild(title)

        let items = [("", "sound"), ("", "music"), ("", "haptics"), ("Сбросить рекорды", "reset"), ("Назад", "back")]
        for (i, item) in items.enumerated() {
            let b = makeButton(item.0, name: item.1, size: CGSize(width: 260, height: 56))
            b.position = CGPoint(x: size.width / 2, y: size.height / 2 + 90 - CGFloat(i) * 76)
            addChild(b)
            switch item.1 {
            case "sound": soundButton = b
            case "music": musicButton = b
            case "haptics": hapticsButton = b
            case "reset": resetButton = b
            default: break
            }
        }
        refresh()
    }

    private func refresh() {
        setButtonTitle(soundButton, "Звуки: " + (Settings.soundOn ? "вкл" : "выкл"))
        setButtonTitle(musicButton, "Музыка: " + (Settings.musicOn ? "вкл" : "выкл"))
        setButtonTitle(hapticsButton, "Вибрация: " + (Settings.hapticsOn ? "вкл" : "выкл"))
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first, let name = buttonName(at: t.location(in: self)) else { return }
        switch name {
        case "sound": Settings.soundOn.toggle(); Sound.shared.play(.place)
        case "music": Settings.musicOn.toggle(); Sound.shared.refreshMusic()
        case "haptics": Settings.hapticsOn.toggle()
        case "reset":
            Records.resetAll()
            setButtonTitle(resetButton, "Рекорды сброшены")
        default:
            let menu = MenuScene(size: size)
            menu.scaleMode = scaleMode
            view?.presentScene(menu)
            return
        }
        refresh()
    }
}
