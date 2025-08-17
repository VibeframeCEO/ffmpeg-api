const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // parse JSON requests

// POST /execute -> expects { command, outputPath }
app.post("/execute", async (req, res) => {
  const { command, outputPath } = req.body;

  if (!command || !outputPath) {
    return res.status(400).json({ error: "command and outputPath are required" });
  }

  console.log("⚡ Running FFmpeg command:", command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ FFmpeg error:", stderr);
      return res.status(500).json({ error: "FFmpeg failed", details: stderr });
    }

    console.log("✅ FFmpeg finished");

    try {
      const fileBuffer = fs.readFileSync(outputPath);
      res.setHeader("Content-Type", "video/mp4");
      res.send(fileBuffer);

      // cleanup temp file
      fs.unlinkSync(outputPath);
    } catch (readErr) {
      console.error("❌ File read error:", readErr);
      res.status(500).json({ error: "Failed to read output file" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
