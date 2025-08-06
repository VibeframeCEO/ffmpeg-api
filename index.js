const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const multer = require("multer"); // ✅ NEW

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/audio", express.static(path.join(__dirname, "public/audio"))); // ✅ Serve audio files too

// ✅ Multer config to store uploaded audio
const storage = multer.diskStorage({
  destination: path.join(__dirname, "public/audio"),
  filename: (req, file, cb) => {
    cb(null, "generated.mp3"); // Overwrite each time
  },
});

const upload = multer({ storage });

// ✅ Upload route
app.post("/upload-audio", upload.single("audio"), (req, res) => {
  res.json({ message: "Audio uploaded successfully!" });
});

// ✅ FFmpeg execute
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

    const outputPath = path.join(__dirname, "public/videos/output.mp4");

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: "Video not found after FFmpeg execution." });
    }

    res.sendFile(outputPath);
  });
});

// ✅ Home route
app.get("/", (req, res) => {
  res.send("✅ FFmpeg API is working.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
