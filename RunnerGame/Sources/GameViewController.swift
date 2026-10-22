import UIKit
import SpriteKit

class GameViewController: UIViewController {
    override func loadView() {
        view = SKView(frame: UIScreen.main.bounds)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let skView = view as? SKView else { return }
        let size = CGSize(width: 390, height: 844)
        var scene: SKScene = MenuScene(size: size)
        #if DEBUG
        if let debug = debugScene(size: size) { scene = debug }
        #endif
        scene.scaleMode = .aspectFill
        skView.presentScene(scene)
        skView.ignoresSiblingOrder = true
        GameCenter.authenticate(from: self)
        Sound.shared.refreshMusic()
    }

    #if DEBUG
    /// Для автоматических скриншотов в CI: -screen play|editor|achievements|settings, -world N
    private func debugScene(size: CGSize) -> SKScene? {
        let args = ProcessInfo.processInfo.arguments
        func value(_ key: String) -> String? {
            guard let i = args.firstIndex(of: key), i + 1 < args.count else { return nil }
            return args[i + 1]
        }
        if let w = value("-world").flatMap({ Int($0) }) { Settings.worldIndex = w }
        switch value("-screen") {
        case "play": return PlayScene(size: size, source: .random)
        case "editor":
            LevelStore.save(Level.random(), slot: LevelStore.currentSlot)
            return EditorScene(size: size)
        case "achievements": return AchievementsScene(size: size)
        case "settings": return SettingsScene(size: size)
        default: return nil
        }
    }
    #endif

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .portrait }
}
