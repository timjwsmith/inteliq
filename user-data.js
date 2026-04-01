const express = require("express");
const { getUserData, setUserData, getAllUserData, bulkSetUserData } = require("./db");
const { requireAuth } = require("./auth");

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Valid data keys that can be stored
const VALID_KEYS = new Set([
  "watchlist", "search_history", "ledger_addrs", "cmc_holdings",
  "alerts", "journal", "call_records", "glossary_custom", "display_currency",
]);

// Get a single data key
router.get("/:key", (req, res) => {
  const { key } = req.params;
  if (!VALID_KEYS.has(key)) return res.status(400).json({ error: `Invalid data key: ${key}` });
  const data = getUserData(req.user.id, key);
  res.json({ data });
});

// Set a single data key
router.put("/:key", (req, res) => {
  const { key } = req.params;
  if (!VALID_KEYS.has(key)) return res.status(400).json({ error: `Invalid data key: ${key}` });
  const { data } = req.body;
  if (data === undefined) return res.status(400).json({ error: "data field required" });
setUserData(req.user.id, key, data);
  res.json({ ok: true });
});

// Get all user data at once (used on login)
router.get("/", (req, res) => {
  const all = getAllUserData(req.user.id);
  res.json(all);
});

// Bulk migrate from localStorage (first login)
router.post("/migrate", (req, res) => {
  const dataMap = req.body;
  if (!dataMap || typeof dataMap !== "object") return res.status(400).json({ error: "Data object required" });
  // Filter to valid keys only
  const filtered = {};
  for (const [key, value] of Object.entries(dataMap)) {
    if (VALID_KEYS.has(key)) filtered[key] = value;
  }
  if (Object.keys(filtered).length === 0) return res.status(400).json({ error: "No valid data keys found" });
  bulkSetUserData(req.user.id, filtered);
  res.json({ ok: true, migrated: Object.keys(filtered) });
});

module.exports = router;
