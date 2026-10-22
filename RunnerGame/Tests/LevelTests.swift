import XCTest
import SpriteKit
@testable import Runner

final class LevelTests: XCTestCase {
    private let playerDiameter: CGFloat = 26

    /// Во всех случайных уровнях каждого мира в любом ряду должен быть проход для человечка
    func testRandomLevelsAlwaysHavePassage() {
        for world in World.all {
            for _ in 0..<100 {
                let level = Level.random(world: world)
                XCTAssertFalse(level.obstacles.isEmpty)
                let rows = Dictionary(grouping: level.obstacles.filter { $0.kind != .mud }) { Int($0.y) }
                for (y, row) in rows {
                    XCTAssertTrue(hasGap(row), "нет прохода в ряду y=\(y), мир \(world.name)")
                }
            }
        }
    }

    func testRandomObstaclesStayInsideTunnel() {
        for _ in 0..<100 {
            for o in Level.random().obstacles {
                let r = o.sweepRect
                XCTAssertGreaterThanOrEqual(r.minX, Level.minX - 0.5)
                XCTAssertLessThanOrEqual(r.maxX, Level.maxX + 0.5)
                XCTAssertLessThan(o.y, Level.length)
            }
        }
    }

    func testShareCodeRoundTrip() throws {
        let level = Level(obstacles: [
            Obstacle(x: 200, y: 500, w: 40, h: 40),
            Obstacle(x: 200, y: 800, w: 44, h: 44, kind: .mover),
            Obstacle(x: 150, y: 1000, w: 100, h: 14, kind: .laser)
        ])
        let decoded = try XCTUnwrap(Level.fromShareCode(level.shareCode()))
        XCTAssertEqual(decoded.obstacles.map(\.kind), [.block, .mover, .laser])
        XCTAssertEqual(decoded.obstacles[1].y, 800)
    }

    func testShareCodeSurvivesLineBreaksAndSpaces() throws {
        let code = Level(obstacles: [Obstacle(x: 200, y: 500, w: 40, h: 40)]).shareCode()
        let messy = "  " + String(code.prefix(12)) + "\n " + String(code.dropFirst(12)) + "\n"
        XCTAssertNotNil(Level.fromShareCode(messy))
    }

    func testInvalidShareCodesAreRejected() {
        XCTAssertNil(Level.fromShareCode(""))
        XCTAssertNil(Level.fromShareCode("hello"))
        XCTAssertNil(Level.fromShareCode("TUNNEL1:!!!not-base64!!!"))
        XCTAssertNil(Level.fromShareCode("TUNNEL1:" + Data("{}".utf8).base64EncodedString()))
    }

    func testImportedLevelIsSanitized() throws {
        let wild = Level(obstacles: [
            Obstacle(x: -5000, y: 99999, w: 9999, h: 1, kind: .block),
            Obstacle(x: 5000, y: -50, w: 40, h: 40, kind: .mover)
        ])
        let data = try JSONEncoder().encode(wild)
        let decoded = try XCTUnwrap(Level.fromShareCode("TUNNEL1:" + data.base64EncodedString()))
        XCTAssertEqual(decoded.obstacles.count, 2)
        for o in decoded.obstacles {
            XCTAssertGreaterThanOrEqual(o.sweepRect.minX, Level.minX - 0.5)
            XCTAssertLessThanOrEqual(o.sweepRect.maxX, Level.maxX + 0.5)
            XCTAssertLessThanOrEqual(o.y, Level.length)
            XCTAssertGreaterThanOrEqual(o.y, 0)
            XCTAssertLessThanOrEqual(o.w, 200)
        }
    }

    func testOldSavesWithoutKindDecodeAsBlocks() throws {
        let json = #"{"obstacles":[{"x":200,"y":500,"w":40,"h":40}]}"#
        let level = try JSONDecoder().decode(Level.self, from: Data(json.utf8))
        XCTAssertEqual(level.obstacles.first?.kind, .block)
    }

    func testLaserBlinksAndMudIsHarmless() {
        let laser = Obstacle(x: 200, y: 0, w: 100, h: 14, kind: .laser)
        XCTAssertTrue(laser.isDeadly(at: 0.5))
        XCTAssertFalse(laser.isDeadly(at: 1.5))
        XCTAssertTrue(laser.isDeadly(at: 2.5))
        XCTAssertFalse(Obstacle(x: 200, y: 0, w: 100, h: 60, kind: .mud).isDeadly(at: 0))
        XCTAssertTrue(Obstacle(x: 200, y: 0, w: 40, h: 40).isDeadly(at: 0))
    }

    func testMoverStaysWithinRange() {
        let saw = Obstacle(x: 200, y: 700, w: 44, h: 44, kind: .mover)
        for i in 0..<500 {
            XCTAssertLessThanOrEqual(abs(saw.xOffset(Double(i) * 0.05)), Obstacle.moverRange + 0.001)
        }
        XCTAssertEqual(Obstacle(x: 200, y: 700, w: 40, h: 40).xOffset(3), 0)
    }

    func testSpikeHitboxIsSmallerThanDrawing() {
        let spike = Obstacle(x: 200, y: 500, w: 80, h: 30, kind: .spike)
        XCTAssertLessThan(spike.rect(at: 0).width, 80)
        XCTAssertEqual(Obstacle(x: 200, y: 500, w: 80, h: 30).rect(at: 0).width, 80)
    }

    func testTunnelAndObstacleNodesBuild() {
        XCTAssertGreaterThan(makeTunnelNode(world: World.all[1]).children.count, 5)
        for kind in [Obstacle.Kind.block, .spike, .mover, .laser, .mud] {
            let node = makeObstacleNode(Obstacle(x: 200, y: 500, w: 60, h: 40, kind: kind))
            XCTAssertEqual(node.position, CGPoint(x: 200, y: 500))
        }
    }

    // MARK: -

    /// Есть ли в ряду свободная щель шириной с человечка
    private func hasGap(_ row: [Obstacle]) -> Bool {
        let spans = row.map { ($0.sweepRect.minX, $0.sweepRect.maxX) }.sorted { $0.0 < $1.0 }
        var cursor = Level.minX
        for (lo, hi) in spans {
            if lo - cursor >= playerDiameter { return true }
            cursor = max(cursor, hi)
        }
        return Level.maxX - cursor >= playerDiameter
    }
}
