const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static folders
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/audio", express.static(path.join(__dirname, "public/audio")));

app.post("/execute", async (req, res) => {
  try {
    const { inputVideo, inputAudio, chunks } = req.body;

    if (!inputVideo || !inputAudio) {
      return res.status(400).json({ error: "Bad request - inputVideo and inputAudio are required" });
    }

    const fontPath = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
    const fontSize = 70;
    const chunkDuration = 1.25;

    let filters = [];
    for (let i = 0; i < (chunks || []).length; i++) {
      const text = chunks[i].trim();
      if (!text) continue;

      const start = (i * chunkDuration).toFixed(2);
      const end = ((i + 1) * chunkDuration).toFixed(2);

      filters.push(
        `drawtext=fontfile='${fontPath}':text='${text.replace(/:/g, "\\:").replace(/'/g, "\\'")}':fontcolor=white:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${start},${end})'`
      );
    }

    const timestamp = Date.now();
    const outputPath = path.join("/tmp", `output_${timestamp}.mp4`);

    // ✅ Build ffmpeg command: cut to audio length
    const filterStr = filters.length > 0 ? `-vf "${filters.join(",")}"` : "";
    const command = `ffmpeg -y -i "${inputVideo}" -i "${inputAudio}" ${filterStr} -map 0:v -map 1:a -c:v libx264 -c:a aac -shortest "${outputPath}"`;

    console.log("Running FFmpeg:", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("FFmpeg error:", stderr);
        return res.status(500).json({ error: "FFmpeg failed", details: stderr });
      }

      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ error: "Video not created." });
      }

      res.sendFile(outputPath, (err) => {
        if (err) console.error("SendFile error:", err);
        fs.unlinkSync(outputPath); // cleanup
      });
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ FFmpeg API is working.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
