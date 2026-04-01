const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  getUserByEmail, getUserByOAuth, createUser,
  saveRefreshToken, getRefreshToken, deleteRefreshToken,
  deleteAllUserRefreshTokens, getUserById,
} = require("./db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET not set in .env");
  process.exit(1);
}

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_DAYS = 30;

// ── Helpers ───────────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sendTokenPair(res, user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  saveRefreshToken(user.id, hashToken(refreshToken), expiresAt);
  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar_url },
  });
}

// Password validation: 8+ chars with a number and lowercase, OR 15+ chars
function isValidPassword(pw) {
  if (!pw) return false;
  if (pw.length >= 15) return true;
  return pw.length >= 8 && /[a-z]/.test(pw) && /\d/.test(pw);
}

// ── Middleware: requireAuth ───────────────────────────────────────────────

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ── Routes ────────────────────────────────────────────────────────────────

// Register with email + password — CLOSED to new registrations
router.post("/register", (req, res) => {
  return res.status(403).json({ error: "Registration is closed. Contact the administrator for access." });
});

// Login with email + password
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = getUserByEmail(email);
  if (!user || !user.password_hash) return res.status(401).json({ error: "Invalid email or password" });
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  sendTokenPair(res, user);
});

// Google OAuth
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Google credential required" });
  try {
    // Decode the Google ID token (verify signature using Google's public keys)
    const { OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    if (!email) return res.status(400).json({ error: "No email in Google token" });

    // Find existing user only — no new accounts
    let user = getUserByOAuth("google", googleId);
    if (!user) {
      user = getUserByEmail(email);
      if (!user) {
        return res.status(403).json({ error: "Registration is closed. Contact the administrator for access." });
      }
    }
    sendTokenPair(res, user);
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

// Apple OAuth
router.post("/apple", async (req, res) => {
  const { idToken, user: appleUser } = req.body;
  if (!idToken) return res.status(400).json({ error: "Apple ID token required" });
  try {
    const appleSignin = require("apple-signin-auth");
    const payload = await appleSignin.verifyIdToken(idToken, {
      audience: process.env.APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });
    const { sub: appleId, email } = payload;
    if (!email && !appleUser?.email) return res.status(400).json({ error: "No email in Apple token" });
    const userEmail = email || appleUser.email;
    const userName = appleUser ? `${appleUser.name?.firstName || ""} ${appleUser.name?.lastName || ""}`.trim() : null;

    let user = getUserByOAuth("apple", appleId);
    if (!user) {
      user = getUserByEmail(userEmail);
      if (!user) {
        user = createUser({ email: userEmail, name: userName, provider: "apple", oauthId: appleId });
      }
    }
    sendTokenPair(res, user);
  } catch (err) {
    console.error("Apple auth error:", err.message);
    res.status(401).json({ error: "Apple authentication failed" });
  }
});

// Refresh token
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });
  const hashed = hashToken(refreshToken);
  const stored = getRefreshToken(hashed);
  if (!stored) return res.status(401).json({ error: "Invalid or expired refresh token" });
  // Rotate: delete old, issue new pair
  deleteRefreshToken(hashed);
  const user = getUserById(stored.user_id);
  if (!user) return res.status(401).json({ error: "User not found" });
  sendTokenPair(res, user);
});

// Get current user
router.get("/me", requireAuth, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, name: user.name, avatar: user.avatar_url });
});

// Logout (invalidate all refresh tokens)
router.post("/logout", requireAuth, (req, res) => {
  deleteAllUserRefreshTokens(req.user.id);
  res.json({ ok: true });
});

module.exports = { router, requireAuth };
