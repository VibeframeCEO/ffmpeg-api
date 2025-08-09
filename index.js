const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/videos", express.static(path.join(__dirname, "public/videos")));
app.use("/audio", express.static(path.join(__dirname, "public/audio")));

// Multer config (same as before)
const storage = multer.diskStorage({
  destination: path.join(__dirname, "public/audio"),
  filename: (req, file, cb) => {
    cb(null, "generated.mp3"); // Overwrite each time
  },
});
const upload = multer({ storage });
app.post("/upload-audio", upload.single("audio"), (req, res) => {
  res.json({ message: "Audio uploaded successfully!" });
});

// helper to run shell command
function runCmd(cmd, options = { maxBuffer: 1024 * 1024 * 20 }) {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        return reject({ error, stdout, stderr });
      }
      resolve({ stdout, stderr });
    });
  });
}

// helper to download YouTube via yt-dlp into /tmp -> returns local path
async function downloadYoutube(url) {
  const ts = Date.now();
  const base = `/tmp/input-${ts}`;
  const outTemplate = `${base}.%(ext)s`;
  // use bestvideo+bestaudio and merge into mp4
  const cmd = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 -o "${outTemplate}" "${url}"`;
  console.log('Downloading YouTube URL with yt-dlp:', url);
  await runCmd(cmd);
  const outPath = `${base}.mp4`;
  if (!fs.existsSync(outPath)) {
    throw new Error(`yt-dlp download failed (no output at ${outPath})`);
  }
  console.log('Downloaded to:', outPath);
  return outPath;
}

app.post("/execute", async (req, res) => {
  try {
    let { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: "No command provided." });
    }

    // Detect YouTube links (youtube.com or youtu.be) and replace them with local files
    const ytRegex = /(https?:\/\/(www\.)?(youtube\.com|youtu\.be)[^\s"']+)/g;
    const matches = [...command.matchAll(ytRegex)];
    if (matches.length) console.log('YouTube links found:', matches.map(m => m[0]));

    for (const m of matches) {
      const url = m[0];
      const localPath = await downloadYoutube(url); // downloads to /tmp
      // replace all occurrences of the URL in the command with the local path
      // escape special regex chars in the URL for safe replace
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const urlRe = new RegExp(escapedUrl, "g");
      command = command.replace(urlRe, localPath);
      console.log('Replaced URL with local path:', localPath);
    }

    console.log('Final ffmpeg command:', command);
    // Run ffmpeg (this may take time)
    await runCmd(command);

    const outputPath = path.join(__dirname, "public/videos/output.mp4");
    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: "Video not found after FFmpeg execution." });
    }

    res.sendFile(outputPath);
  } catch (e) {
    console.error("Execute error:", e);
    if (e.stderr) {
      // return ffmpeg/yt-dlp stderr (trim to a reasonable length)
      return res.status(500).json({ error: e.stderr.toString().slice(0, 2000) });
    }
    return res.status(500).json({ error: e.error?.message || e.message || "Unknown error" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ FFmpeg API is working.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

