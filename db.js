const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "inteliq.db");

// Ensure directory exists
const fs = require("fs");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

// ── Schema migrations ─────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT UNIQUE NOT NULL,
    name            TEXT,
    avatar_url      TEXT,
    password_hash   TEXT,
    auth_provider   TEXT NOT NULL DEFAULT 'local',
    oauth_id        TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(auth_provider, oauth_id)
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT UNIQUE NOT NULL,
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_data (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_key    TEXT NOT NULL,
    data_json   TEXT NOT NULL DEFAULT '[]',
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, data_key)
  );

  CREATE TABLE IF NOT EXISTS user_api_keys (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_name    TEXT NOT NULL,
    key_value   TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, key_name)
  );
`);

// ── User helpers ──────────────────────────────────────────────────────────
const stmts = {
  getUserById:       db.prepare("SELECT * FROM users WHERE id = ?"),
  getUserByEmail:    db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE"),
  getUserByOAuth:    db.prepare("SELECT * FROM users WHERE auth_provider = ? AND oauth_id = ?"),
  createUser:        db.prepare("INSERT INTO users (email, name, avatar_url, password_hash, auth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, ?)"),
  // Refresh tokens
  insertRefresh:     db.prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)"),
  getRefresh:        db.prepare("SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > datetime('now')"),
  deleteRefresh:     db.prepare("DELETE FROM refresh_tokens WHERE token_hash = ?"),
  deleteUserRefresh: db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?"),
  cleanExpired:      db.prepare("DELETE FROM refresh_tokens WHERE expires_at <= datetime('now')"),
  // User data
  getData:           db.prepare("SELECT data_json FROM user_data WHERE user_id = ? AND data_key = ?"),
  upsertData:        db.prepare(`INSERT INTO user_data (user_id, data_key, data_json, updated_at)
                                 VALUES (?, ?, ?, datetime('now'))
                                 ON CONFLICT(user_id, data_key) DO UPDATE SET data_json = excluded.data_json, updated_at = datetime('now')`),
  getAllData:         db.prepare("SELECT data_key, data_json FROM user_data WHERE user_id = ?"),
};

function getUserById(id) { return stmts.getUserById.get(id); }
function getUserByEmail(email) { return stmts.getUserByEmail.get(email); }
function getUserByOAuth(provider, oauthId) { return stmts.getUserByOAuth.get(provider, oauthId); }

function createUser({ email, name, avatar, passwordHash, provider, oauthId }) {
  const info = stmts.createUser.run(email, name || null, avatar || null, passwordHash || null, provider || "local", oauthId || null);
  return getUserById(info.lastInsertRowid);
}

function saveRefreshToken(userId, tokenHash, expiresAt) {
  stmts.insertRefresh.run(userId, tokenHash, expiresAt);
}
function getRefreshToken(tokenHash) { return stmts.getRefresh.get(tokenHash); }
function deleteRefreshToken(tokenHash) { stmts.deleteRefresh.run(tokenHash); }
function deleteAllUserRefreshTokens(userId) { stmts.deleteUserRefresh.run(userId); }

function getUserData(userId, key) {
  const row = stmts.getData.get(userId, key);
  if (!row) return null;
  try { return JSON.parse(row.data_json); } catch { return null; }
}

function setUserData(userId, key, data) {
  stmts.upsertData.run(userId, key, JSON.stringify(data));
}

function getAllUserData(userId) {
  const rows = stmts.getAllData.all(userId);
  const result = {};
  for (const row of rows) {
    try { result[row.data_key] = JSON.parse(row.data_json); } catch { result[row.data_key] = null; }
  }
  return result;
}

function bulkSetUserData(userId, dataMap) {
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(dataMap)) {
      if (value !== undefined && value !== null) {
        stmts.upsertData.run(userId, key, JSON.stringify(value));
      }
    }
  });
  tx();
}

// Clean expired refresh tokens periodically
setInterval(() => { try { stmts.cleanExpired.run(); } catch {} }, 60 * 60 * 1000);

module.exports = {
  db, getUserById, getUserByEmail, getUserByOAuth, createUser,
  saveRefreshToken, getRefreshToken, deleteRefreshToken, deleteAllUserRefreshTokens,
  getUserData, setUserData, getAllUserData, bulkSetUserData,
};
