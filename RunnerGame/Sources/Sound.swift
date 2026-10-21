import AVFoundation

enum Sfx: CaseIterable { case start, hit, win, place, remove }

/// Звуки генерируются кодом, отдельных файлов не нужно
final class Sound {
    static let shared = Sound()
    private var players: [Sfx: AVAudioPlayer] = [:]

    private init() {
        try? AVAudioSession.sharedInstance().setCategory(.ambient)
        let notes: [Sfx: [(Double, Double)]] = [
            .start: [(440, 0.08), (660, 0.12)],
            .hit: [(200, 0.12), (140, 0.12), (90, 0.25)],
            .win: [(523, 0.1), (659, 0.1), (784, 0.1), (1047, 0.25)],
            .place: [(520, 0.05)],
            .remove: [(300, 0.06)]
        ]
        for (sfx, seq) in notes {
            if let p = try? AVAudioPlayer(data: Sound.wav(seq)) {
                p.prepareToPlay()
                players[sfx] = p
            }
        }
    }

    func play(_ sfx: Sfx) {
        guard Settings.soundOn, let p = players[sfx] else { return }
        p.currentTime = 0
        p.play()
    }

    private static func wav(_ notes: [(Double, Double)]) -> Data {
        let rate = 22050
        var samples: [Int16] = []
        for (freq, dur) in notes {
            let n = Int(Double(rate) * dur)
            for i in 0..<n {
                let t = Double(i) / Double(rate)
                let envelope = 1 - Double(i) / Double(n)
                samples.append(Int16(sin(2 * .pi * freq * t) * envelope * 0.4 * 32767))
            }
        }
        let dataLen = samples.count * 2
        var d = Data()
        func u32(_ v: UInt32) { withUnsafeBytes(of: v.littleEndian) { d.append(contentsOf: $0) } }
        func u16(_ v: UInt16) { withUnsafeBytes(of: v.littleEndian) { d.append(contentsOf: $0) } }
        d.append("RIFF".data(using: .ascii)!); u32(UInt32(36 + dataLen))
        d.append("WAVE".data(using: .ascii)!)
        d.append("fmt ".data(using: .ascii)!); u32(16); u16(1); u16(1)
        u32(UInt32(rate)); u32(UInt32(rate * 2)); u16(2); u16(16)
        d.append("data".data(using: .ascii)!); u32(UInt32(dataLen))
        for s in samples { u16(UInt16(bitPattern: s)) }
        return d
    }
}
