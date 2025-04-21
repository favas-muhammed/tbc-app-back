const express = require("express");
const connectDB = require("./db");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
connectDB()
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Path to token storage file
const TOKEN_PATH = path.join(__dirname, "token.json");

// Google OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
  process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
  process.env.GOOGLE_REDIRECT_URI || "YOUR_REDIRECT_URI"
);

// Load tokens from file if available
if (fs.existsSync(TOKEN_PATH)) {
  const token = fs.readFileSync(TOKEN_PATH);
  oauth2Client.setCredentials(JSON.parse(token));
}

// Route for Gmail authentication
app.get("/auth/gmail", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    prompt: "consent",
  });
  res.redirect(url);
});

// Callback route to handle OAuth2 response and save tokens
app.get("/auth/gmail/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Save the tokens to file
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    res.send("Authentication successful! You can close this tab.");
  } catch (error) {
    console.error("Error retrieving access token", error);
    res.status(500).send("Authentication failed");
  }
});

// API endpoint to fetch emails
app.get("/api/emails", async (req, res) => {
  try {
    if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const response = await gmail.users.messages.list({ userId: "me" });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching emails", error);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

// Root route to prevent "Cannot GET /" error
app.get("/", (req, res) => {
  res.send("Backend API is running");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
