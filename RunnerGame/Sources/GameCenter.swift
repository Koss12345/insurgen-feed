import GameKit

/// Таблица лидеров. Работает после настройки Game Center в App Store Connect
/// (см. AppStore/SUBMISSION.md); без неё все вызовы тихо ничего не делают.
enum GameCenter {
    static let leaderboardID = "com.example.runner.best"

    static func authenticate(from vc: UIViewController) {
        GKLocalPlayer.local.authenticateHandler = { login, _ in
            if let login { vc.present(login, animated: true) }
        }
    }

    static func submit(score: Int) {
        guard GKLocalPlayer.local.isAuthenticated, score > 0 else { return }
        GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local,
                                  leaderboardIDs: [leaderboardID]) { _ in }
    }

    @discardableResult
    static func showLeaderboard(from vc: UIViewController?) -> Bool {
        guard GKLocalPlayer.local.isAuthenticated, let vc else { return false }
        let gc = GKGameCenterViewController(leaderboardID: leaderboardID, playerScope: .global, timeScope: .allTime)
        gc.gameCenterDelegate = Delegate.shared
        vc.present(gc, animated: true)
        return true
    }

    private final class Delegate: NSObject, GKGameCenterControllerDelegate {
        static let shared = Delegate()
        func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
            gameCenterViewController.dismiss(animated: true)
        }
    }
}
