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

  CREATE TABLE IF NOT EXISTS invites (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT COLLATE NOCASE,
    code        TEXT UNIQUE,
    max_uses    INTEGER NOT NULL DEFAULT 1,
    uses        INTEGER NOT NULL DEFAULT 0,
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME,
    revoked     INTEGER NOT NULL DEFAULT 0,
    CHECK (email IS NOT NULL OR code IS NOT NULL)
  );
  CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
  CREATE INDEX IF NOT EXISTS idx_invites_code  ON invites(code);
`);

// Additive migration: users.disabled flag (safe to re-run)
const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
if (!userCols.includes("disabled")) {
  db.exec("ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0");
}

// ── User helpers ──────────────────────────────────────────────────────────
const stmts = {
  getUserById:       db.prepare("SELECT * FROM users WHERE id = ?"),
  getUserByEmail:    db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE"),
  getUserByOAuth:    db.prepare("SELECT * FROM users WHERE auth_provider = ? AND oauth_id = ?"),
  listUsers:         db.prepare("SELECT id, email, name, auth_provider, created_at, disabled FROM users ORDER BY created_at DESC"),
  createUser:        db.prepare("INSERT INTO users (email, name, avatar_url, password_hash, auth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, ?)"),
  setUserDisabled:   db.prepare("UPDATE users SET disabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"),
  // Invites
  listInvites:       db.prepare(`SELECT i.id, i.email, i.code, i.max_uses, i.uses, i.created_at, i.expires_at, i.revoked, u.email AS created_by_email
                                 FROM invites i LEFT JOIN users u ON u.id = i.created_by
                                 ORDER BY i.created_at DESC`),
  createInvite:      db.prepare("INSERT INTO invites (email, code, max_uses, created_by, expires_at) VALUES (?, ?, ?, ?, ?)"),
  getInviteByEmail:  db.prepare(`SELECT * FROM invites WHERE email = ? COLLATE NOCASE AND revoked = 0 AND uses < max_uses AND (expires_at IS NULL OR expires_at > datetime('now'))`),
  getInviteByCode:   db.prepare(`SELECT * FROM invites WHERE code = ? AND revoked = 0 AND uses < max_uses AND (expires_at IS NULL OR expires_at > datetime('now'))`),
  consumeInvite:     db.prepare("UPDATE invites SET uses = uses + 1 WHERE id = ?"),
  revokeInvite:      db.prepare("UPDATE invites SET revoked = 1 WHERE id = ?"),
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
function listUsers() { return stmts.listUsers.all(); }
function getUserByOAuth(provider, oauthId) { return stmts.getUserByOAuth.get(provider, oauthId); }

function createUser({ email, name, avatar, passwordHash, provider, oauthId }) {
  const info = stmts.createUser.run(email, name || null, avatar || null, passwordHash || null, provider || "local", oauthId || null);
  return getUserById(info.lastInsertRowid);
}

function setUserDisabled(id, disabled) { stmts.setUserDisabled.run(disabled ? 1 : 0, id); }

function listInvites() { return stmts.listInvites.all(); }
function createInvite({ email, code, maxUses, createdBy, expiresAt }) {
  const info = stmts.createInvite.run(email || null, code || null, maxUses || 1, createdBy || null, expiresAt || null);
  return info.lastInsertRowid;
}
function getInviteByEmail(email) { return stmts.getInviteByEmail.get(email); }
function getInviteByCode(code)  { return stmts.getInviteByCode.get(code); }
function consumeInvite(id)      { stmts.consumeInvite.run(id); }
function revokeInvite(id)       { stmts.revokeInvite.run(id); }

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
  db, getUserById, getUserByEmail, getUserByOAuth, createUser, listUsers, setUserDisabled,
  listInvites, createInvite, getInviteByEmail, getInviteByCode, consumeInvite, revokeInvite,
  saveRefreshToken, getRefreshToken, deleteRefreshToken, deleteAllUserRefreshTokens,
  getUserData, setUserData, getAllUserData, bulkSetUserData,
};
