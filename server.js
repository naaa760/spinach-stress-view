import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();

app.use(cors());

// Serve the stress sample JSON file
app.get("/api/stress-data", (req, res) => {
  const filePath = "/home/neha/heatmap_sample/stress_sample.json";

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Failed to read stress data file" });
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      res.status(500).json({ error: "Failed to parse stress data" });
    }
  });
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
