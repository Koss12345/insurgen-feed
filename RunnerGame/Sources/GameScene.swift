import SpriteKit
import UIKit

private struct Category {
    static let player: UInt32 = 1 << 0
    static let obstacle: UInt32 = 1 << 1
    static let ground: UInt32 = 1 << 2
}

class GameScene: SKScene, SKPhysicsContactDelegate {
    private let groundHeight: CGFloat = 160
    private let playerSize = CGSize(width: 40, height: 40)

    private var player: SKShapeNode!
    private var scoreLabel: SKLabelNode!
    private var messageLabel: SKLabelNode!

    private var isOnGround = false
    private var isRunning = false
    private var score = 0
    private var speed0: CGFloat = 320
    private var currentSpeed: CGFloat = 320
    private var lastUpdate: TimeInterval = 0
    private var scoreAccumulator: TimeInterval = 0

    private var best: Int {
        get { UserDefaults.standard.integer(forKey: "best") }
        set { UserDefaults.standard.set(newValue, forKey: "best") }
    }

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.10, green: 0.12, blue: 0.20, alpha: 1)
        physicsWorld.gravity = CGVector(dx: 0, dy: -22)
        physicsWorld.contactDelegate = self

        let ground = SKSpriteNode(color: SKColor(red: 0.25, green: 0.8, blue: 0.5, alpha: 1),
                                  size: CGSize(width: size.width, height: groundHeight))
        ground.anchorPoint = .zero
        ground.physicsBody = SKPhysicsBody(edgeFrom: CGPoint(x: 0, y: groundHeight),
                                           to: CGPoint(x: size.width, y: groundHeight))
        ground.physicsBody?.categoryBitMask = Category.ground
        addChild(ground)

        scoreLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
        scoreLabel.fontSize = 36
        scoreLabel.position = CGPoint(x: size.width / 2, y: size.height - 110)
        addChild(scoreLabel)

        messageLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
        messageLabel.fontSize = 28
        messageLabel.numberOfLines = 0
        messageLabel.position = CGPoint(x: size.width / 2, y: size.height / 2 + 40)
        addChild(messageLabel)

        resetGame()
    }

    // MARK: - Game flow

    private func resetGame() {
        removeAction(forKey: "spawn")
        children.filter { $0.name == "obstacle" }.forEach { $0.removeFromParent() }
        player?.removeFromParent()

        player = SKShapeNode(rectOf: playerSize, cornerRadius: 8)
        player.fillColor = SKColor(red: 1, green: 0.8, blue: 0.2, alpha: 1)
        player.strokeColor = .clear
        player.position = CGPoint(x: 100, y: groundHeight + playerSize.height / 2)
        let body = SKPhysicsBody(rectangleOf: playerSize)
        body.allowsRotation = false
        body.categoryBitMask = Category.player
        body.collisionBitMask = Category.ground
        body.contactTestBitMask = Category.obstacle | Category.ground
        player.physicsBody = body
        addChild(player)

        score = 0
        currentSpeed = speed0
        lastUpdate = 0
        scoreAccumulator = 0
        isRunning = false
        scoreLabel.text = "0"
        messageLabel.text = "Тап — прыжок\nРекорд: \(best)"
    }

    private func startGame() {
        isRunning = true
        messageLabel.text = ""
        scheduleNextObstacle()
    }

    private func gameOver() {
        guard isRunning else { return }
        isRunning = false
        removeAction(forKey: "spawn")
        children.filter { $0.name == "obstacle" }.forEach { $0.removeAllActions() }
        if score > best { best = score }
        player.fillColor = .red
        UINotificationFeedbackGenerator().notificationOccurred(.error)
        messageLabel.text = "Конец!\nСчёт: \(score)  Рекорд: \(best)\nТап — заново"
    }

    // MARK: - Obstacles

    private func scheduleNextObstacle() {
        let gap = TimeInterval(CGFloat.random(in: 0.9...1.8) * speed0 / currentSpeed)
        let wait = SKAction.wait(forDuration: gap)
        let spawn = SKAction.run { [weak self] in
            self?.spawnObstacle()
            self?.scheduleNextObstacle()
        }
        run(.sequence([wait, spawn]), withKey: "spawn")
    }

    private func spawnObstacle() {
        let h = CGFloat.random(in: 40...90)
        let w = CGFloat.random(in: 28...50)
        let node = SKShapeNode(rectOf: CGSize(width: w, height: h), cornerRadius: 4)
        node.name = "obstacle"
        node.fillColor = SKColor(red: 0.95, green: 0.35, blue: 0.4, alpha: 1)
        node.strokeColor = .clear
        node.position = CGPoint(x: size.width + w, y: groundHeight + h / 2)
        let body = SKPhysicsBody(rectangleOf: CGSize(width: w - 4, height: h - 4))
        body.isDynamic = false
        body.categoryBitMask = Category.obstacle
        node.physicsBody = body
        addChild(node)

        let distance = size.width + w * 2
        let move = SKAction.moveBy(x: -distance, y: 0, duration: TimeInterval(distance / currentSpeed))
        node.run(.sequence([move, .removeFromParent()]))
    }

    // MARK: - Input

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        if !isRunning {
            if messageLabel.text?.contains("Конец") == true { resetGame() }
            else { startGame() }
            return
        }
        guard isOnGround else { return }
        player.physicsBody?.velocity = .zero
        player.physicsBody?.applyImpulse(CGVector(dx: 0, dy: 420))
        isOnGround = false
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    // MARK: - Update / physics

    override func update(_ currentTime: TimeInterval) {
        guard isRunning else { return }
        if lastUpdate == 0 { lastUpdate = currentTime }
        let dt = currentTime - lastUpdate
        lastUpdate = currentTime

        scoreAccumulator += dt
        if scoreAccumulator >= 0.1 {
            scoreAccumulator -= 0.1
            score += 1
            scoreLabel.text = "\(score)"
            currentSpeed = min(speed0 + CGFloat(score) * 0.8, 650)
        }
        if let y = player?.position.y, y <= groundHeight + playerSize.height / 2 + 1 {
            isOnGround = true
        }
    }

    func didBegin(_ contact: SKPhysicsContact) {
        let mask = contact.bodyA.categoryBitMask | contact.bodyB.categoryBitMask
        if mask == Category.player | Category.obstacle { gameOver() }
        else if mask == Category.player | Category.ground { isOnGround = true }
    }
}
