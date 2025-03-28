require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "https://your-frontend-url.vercel.app",
      "http://localhost:3000", // For local development
    ],
    credentials: true,
  })
);

// MongoDB Connection (Atlas for production)
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/internal-tool")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Google OAuth2 Setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
  process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
  process.env.GOOGLE_REDIRECT_URI || "YOUR_REDIRECT_URI"
);

// Routes
app.get("/auth/gmail", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });
  res.redirect(url);
});

app.get("/auth/gmail/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send("Authentication successful! You can close this tab.");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/emails", async (req, res) => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const response = await gmail.users.messages.list({ userId: "me" });
    res.json(response.data);
  } catch (err) {
    console.error("Gmail API error:", err);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

// Health check endpoint (required for Vercel)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Server error");
});

// Start server (Vercel overrides PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export for Vercel serverless functions
module.exports = app;
