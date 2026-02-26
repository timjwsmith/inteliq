const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY is not set in .env");
  process.exit(1);
}

// Proxy route — keeps API key server-side only
app.post("/api/analyse", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Anthropic API error:", err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`✅ IntelIQ proxy server running on port ${PORT}`);
});
