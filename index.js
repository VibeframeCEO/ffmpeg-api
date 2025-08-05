const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Create videos directory if it doesn't exist
const videosPath = path.join(__dirname, "public/videos");
fs.mkdirSync(videosPath, { recursive: true });

app.use(cors());
app.use(bodyParser.json());
app.use("/videos", express.static(videosPath));

app.post("/execute", async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "No command provided." });
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("FFmpeg error:", stderr);
      return res.status(500).json({ error: error.message });
    }

    const outputPath = path.join(videosPath, "output.mp4");

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: "Video not found after FFmpeg execution." });
    }

    // ✅ Send video file directly
    res.sendFile(outputPath);
  });
});

app.get("/", (req, res) => {
  res.send("FFmpeg API is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
