import Foundation

/// Single entry point for all Express backend API calls.
/// Uses async/await with URLSession — no third-party dependencies.
actor APIService {
    static let shared = APIService()

    // Default to localhost for Simulator; change for device/remote
    var baseURL = URL(string: "http://localhost:4000")!

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    private let encoder = JSONEncoder()

    // MARK: - Generic request

    func fetch<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: (any Encodable)? = nil
    ) async throws -> T {
        guard let url = URL(string: baseURL.absoluteString + path) else {
            throw APIError.invalidResponse
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 90

        if let body {
            request.httpBody = try encoder.encode(AnyEncodable(body))
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200...299).contains(http.statusCode) else {
            let message = (try? JSONDecoder().decode(ErrorBody.self, from: data))?.error ?? "HTTP \(http.statusCode)"
            throw APIError.server(statusCode: http.statusCode, message: message)
        }

        return try decoder.decode(T.self, from: data)
    }

    // MARK: - Convenience: POST with body

    func post<T: Decodable>(_ path: String, body: any Encodable) async throws -> T {
        try await fetch(path, method: "POST", body: body)
    }

    // MARK: - Convenience: GET

    func get<T: Decodable>(_ path: String) async throws -> T {
        try await fetch(path)
    }
}

// MARK: - Error types

enum APIError: LocalizedError {
    case invalidResponse
    case server(statusCode: Int, message: String)
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse: "Invalid server response"
        case .server(_, let message): message
        case .decodingFailed(let detail): "Decoding failed: \(detail)"
        }
    }
}

private struct ErrorBody: Decodable {
    let error: String
}

// MARK: - Type-erased Encodable wrapper

private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init(_ wrapped: any Encodable) {
        _encode = { encoder in
            try wrapped.encode(to: encoder)
        }
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}
