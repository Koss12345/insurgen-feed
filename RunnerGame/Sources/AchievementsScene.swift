import SpriteKit

final class AchievementsScene: SKScene {
    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1)

        let title = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        title.text = "ДОСТИЖЕНИЯ"
        title.fontSize = 36
        title.position = CGPoint(x: size.width / 2, y: size.height - 110)
        addChild(title)

        for (i, a) in Achievements.all.enumerated() {
            let done = Achievements.isUnlocked(a.id)
            let y = size.height - 190 - CGFloat(i) * 58
            let name = SKLabelNode(fontNamed: "AvenirNext-Bold")
            name.text = (done ? "🏆 " : "🔒 ") + a.title
            name.fontSize = 19
            name.fontColor = done ? .yellow : SKColor(white: 0.6, alpha: 1)
            name.horizontalAlignmentMode = .left
            name.position = CGPoint(x: 40, y: y)
            addChild(name)
            let detail = SKLabelNode(fontNamed: "AvenirNext-Medium")
            detail.text = a.detail
            detail.fontSize = 14
            detail.fontColor = SKColor(white: 0.7, alpha: 1)
            detail.horizontalAlignmentMode = .left
            detail.position = CGPoint(x: 40, y: y - 20)
            addChild(detail)
        }

        let board = makeButton("Таблица лидеров", name: "board", size: CGSize(width: 260, height: 50))
        board.position = CGPoint(x: size.width / 2, y: 130)
        addChild(board)
        let back = makeButton("Назад", name: "back", size: CGSize(width: 260, height: 50))
        back.position = CGPoint(x: size.width / 2, y: 65)
        addChild(back)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first, let name = buttonName(at: t.location(in: self)) else { return }
        if name == "board" {
            if !GameCenter.showLeaderboard(from: view?.window?.rootViewController) {
                showBanner("Game Center не подключён", on: self, at: CGPoint(x: size.width / 2, y: 190))
            }
            return
        }
        let menu = MenuScene(size: size)
        menu.scaleMode = scaleMode
        view?.presentScene(menu)
    }
}
