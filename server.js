require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());

const allowedOrigins = [
  "https://tbc-app-back.vercel.app",
  "https://tbc-app-back-39ceq35o1-favas-projects-94d5781a.vercel.app", // Add preview URL
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/internal-tool")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Google OAuth2 Setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
  process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
  "https://tbc-app-back.vercel.app/auth/gmail/callback"
);

// Routes (Existing)
app.get("/auth/gmail", (req, res) => {
  /* ... */
});
app.get("/auth/gmail/callback", async (req, res) => {
  /* ... */
});
app.get("/api/emails", async (req, res) => {
  /* ... */
});
app.get("/api/health", (req, res) => {
  /* ... */
});

// Error handling
app.use((err, req, res, next) => {
  /* ... */
});

// Vercel export
module.exports = app;
