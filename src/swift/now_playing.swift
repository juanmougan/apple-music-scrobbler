#!/usr/bin/env swift
import Foundation

struct TrackEvent: Codable {
    let type: String
    let timestamp: Double
    let data: TrackData?
}

struct TrackData: Codable {
    let name: String?
    let artist: String?
    let album: String?
    let playerState: String?
    let totalTime: Double?
    let elapsedTime: Double?
}

let center = DistributedNotificationCenter.default()
center.addObserver(forName: NSNotification.Name("com.apple.Music.playerInfo"), object: nil, queue: .main) { notification in
    if let info = notification.userInfo {
        let timestamp = Date().timeIntervalSince1970

        // Debug: Print all available keys
        let stderr = FileHandle.standardError
        let debugMessage = "DEBUG: Notification keys: \(Array(info.keys))\n"
        stderr.write(debugMessage.data(using: .utf8)!)

        // Extract all available data
        let playerState = info["Player State"] as? String
        let name = info["Name"] as? String
        let artist = info["Artist"] as? String
        let album = info["Album"] as? String
        let totalTime = info["Total Time"] as? Double
        let elapsedTime = info["Elapsed Time"] as? Double

        // Create a comprehensive event with all available data
        let event = TrackEvent(
            type: "music_event",
            timestamp: timestamp,
            data: TrackData(
                name: name,
                artist: artist,
                album: album,
                playerState: playerState,
                totalTime: totalTime,
                elapsedTime: elapsedTime
            )
        )

        if playerState != nil {
            let debugStateMessage = "DEBUG: Player state detected: \(playerState!)\n"
            stderr.write(debugStateMessage.data(using: .utf8)!)
        }

        if let name = name, let artist = artist {
            let debugTrackMessage = "DEBUG: Track info detected - Name: \(name), Artist: \(artist)\n"
            stderr.write(debugTrackMessage.data(using: .utf8)!)
        }

        if let jsonData = try? JSONEncoder().encode(event),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString)
            fflush(stdout)
        }
    }
}

RunLoop.main.run()
