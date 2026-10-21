import SpriteKit

final class PlayScene: SKScene {
    enum Source { case random, custom }
    private enum State { case ready, playing, over }

    private let source: Source
    private var level = Level(obstacles: [])
    private var state = State.ready

    private let cam = SKCameraNode()
    private var player = SKNode()
    private var movers: [(obstacle: Obstacle, node: SKNode)] = []
    private var targetX: CGFloat = 195
    private var lastUpdate: TimeInterval = 0
    private var playTime: TimeInterval = 0
    private let radius: CGFloat = 13
    private let playerOffset: CGFloat = 250

    private var progressLabel = SKLabelNode()
    private var messageLabel = SKLabelNode()

    init(size: CGSize, source: Source) {
        self.source = source
        super.init(size: size)
    }

    required init?(coder aDecoder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1)
        if source == .custom, let saved = LevelStore.load() { level = saved } else { level = Level.random() }

        addChild(makeTunnelNode())
        for o in level.obstacles {
            let node = makeObstacleNode(o)
            addChild(node)
            if o.kind == .mover { addChild(makeRailNode(o)) }
            if o.isAnimated {
                movers.append((o, node))
                applyAnimation(o, to: node, at: 0)
            }
        }

        camera = cam
        cam.position = CGPoint(x: size.width / 2, y: size.height / 2)
        addChild(cam)

        player = makePlayer()
        player.zPosition = 5
        player.position = CGPoint(x: size.width / 2, y: cam.position.y - playerOffset)
        targetX = player.position.x
        addChild(player)

        progressLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
        progressLabel.fontSize = 28
        progressLabel.position = CGPoint(x: 0, y: size.height / 2 - 70)
        progressLabel.zPosition = 10
        cam.addChild(progressLabel)

        messageLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
        messageLabel.fontSize = 26
        messageLabel.numberOfLines = 0
        messageLabel.text = "Тяни палец влево-вправо,\nчтобы обходить препятствия.\nТап — старт"
        messageLabel.position = CGPoint(x: 0, y: 60)
        messageLabel.zPosition = 10
        cam.addChild(messageLabel)
        updateProgress()
    }

    private func makePlayer() -> SKNode {
        let n = SKNode()

        let shadow = SKShapeNode(ellipseOf: CGSize(width: 34, height: 22))
        shadow.fillColor = SKColor(white: 0, alpha: 0.3)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 2, y: 4)
        n.addChild(shadow)

        for dx in [CGFloat(-7), 7] {
            let foot = SKShapeNode(rectOf: CGSize(width: 8, height: 11), cornerRadius: 3)
            foot.fillColor = SKColor(white: 0.12, alpha: 1)
            foot.strokeColor = .clear
            foot.position = CGPoint(x: dx, y: 0)
            n.addChild(foot)
            let dir: CGFloat = dx < 0 ? 1 : -1
            foot.run(.repeatForever(.sequence([.moveBy(x: 0, y: 7 * dir, duration: 0.15),
                                               .moveBy(x: 0, y: -14 * dir, duration: 0.3),
                                               .moveBy(x: 0, y: 7 * dir, duration: 0.15)])))
        }
        for dx in [CGFloat(-17), 17] {
            let arm = SKShapeNode(circleOfRadius: 5)
            arm.fillColor = SKColor(red: 0.95, green: 0.78, blue: 0.62, alpha: 1)
            arm.strokeColor = .clear
            arm.position = CGPoint(x: dx, y: 8)
            n.addChild(arm)
            let dir: CGFloat = dx < 0 ? -1 : 1
            arm.run(.repeatForever(.sequence([.moveBy(x: 0, y: 6 * dir, duration: 0.15),
                                              .moveBy(x: 0, y: -12 * dir, duration: 0.3),
                                              .moveBy(x: 0, y: 6 * dir, duration: 0.15)])))
        }
        let body = SKShapeNode(rectOf: CGSize(width: 30, height: 14), cornerRadius: 7)
        body.fillColor = SKColor(red: 0.3, green: 0.55, blue: 1, alpha: 1)
        body.strokeColor = SKColor(red: 0.15, green: 0.3, blue: 0.7, alpha: 1)
        body.lineWidth = 2
        body.position = CGPoint(x: 0, y: 8)
        n.addChild(body)
        let head = SKShapeNode(circleOfRadius: 8)
        head.fillColor = SKColor(red: 0.25, green: 0.15, blue: 0.1, alpha: 1)
        head.strokeColor = .clear
        head.position = CGPoint(x: 0, y: 9)
        n.addChild(head)
        return n
    }

    // MARK: - Ввод

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        if state == .ready {
            state = .playing
            messageLabel.text = ""
            Sound.shared.play(.start)
        }
        targetX = t.location(in: self).x
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first, state == .playing else { return }
        targetX = t.location(in: self).x
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard state == .over, let t = touches.first,
              let name = buttonName(at: t.location(in: self)) else { return }
        let next: SKScene
        switch name {
        case "retry": next = PlayScene(size: size, source: source)
        case "edit": next = EditorScene(size: size)
        default: next = MenuScene(size: size)
        }
        next.scaleMode = scaleMode
        view?.presentScene(next)
    }

    // MARK: - Игровой цикл

    override func update(_ currentTime: TimeInterval) {
        defer { lastUpdate = currentTime }
        guard state == .playing, lastUpdate > 0 else { return }
        let dt = min(currentTime - lastUpdate, 0.05)
        playTime += dt

        cam.position.y += CGFloat(dt) * (240 + 40 * (cam.position.y / 1000))

        let dx = targetX - player.position.x
        let inMud = level.obstacles.contains { $0.kind == .mud && hits($0.rect(at: 0)) }
        let step = (inMud ? 200 : 450) * CGFloat(dt)
        player.position.x += max(-step, min(step, dx))
        player.position.x = max(Level.minX + radius, min(Level.maxX - radius, player.position.x))
        player.position.y = cam.position.y - playerOffset

        for m in movers { applyAnimation(m.obstacle, to: m.node, at: playTime) }

        updateProgress()
        if level.obstacles.contains(where: { $0.isDeadly(at: playTime) && hits($0.rect(at: playTime)) }) { finish(won: false) }
        else if player.position.y >= Level.length { finish(won: true) }
    }

    private func hits(_ r: CGRect) -> Bool {
        let p = player.position
        let cx = max(r.minX, min(p.x, r.maxX))
        let cy = max(r.minY, min(p.y, r.maxY))
        let dx = p.x - cx, dy = p.y - cy
        return dx * dx + dy * dy < radius * radius
    }

    private var progress: Int { max(0, min(100, Int((player.position.y / Level.length) * 100))) }

    private func updateProgress() { progressLabel.text = "\(progress)%" }

    private func finish(won: Bool) {
        state = .over
        player.children.forEach { $0.removeAllActions() }
        Records.submit(progress, slot: source == .custom ? LevelStore.currentSlot : nil)
        Sound.shared.play(won ? .win : .hit)
        Haptics.notify(won ? .success : .error)
        messageLabel.text = won ? "Победа!" : "Врезался! \(progress)%"

        var items = [("Заново", "retry"), ("Меню", "menu")]
        if source == .custom { items.insert(("Править", "edit"), at: 1) }
        for (i, item) in items.enumerated() {
            let b = makeButton(item.0, name: item.1, size: CGSize(width: 200, height: 48))
            b.position = CGPoint(x: 0, y: -CGFloat(i) * 60)
            cam.addChild(b)
        }
    }
}
