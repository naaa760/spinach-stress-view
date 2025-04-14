import express, { json } from "express";
import cors from "cors";
import { resolve, dirname } from "path";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import process from "process";

// Create equivalent of __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON
app.use(json());

// API endpoint to serve GeoJSON data
app.get("/api/stress-data", (req, res) => {
  try {
    // Path to your GeoJSON file (relative to server directory)
    const dataPath = resolve(__dirname, "../public/data/stress_sample.json");

    if (existsSync(dataPath)) {
      const data = readFileSync(dataPath, "utf8");
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ error: "Data file not found" });
    }
  } catch (error) {
    console.error("Error serving stress data:", error);
    res.status(500).json({ error: "Failed to serve data" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
