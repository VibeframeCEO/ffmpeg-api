const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");

// Optional Cloudinary upload (set CLOUDINARY_URL env if you want it)
let cloudinary = null;
try {
  cloudinary = require("cloudinary").v2;
  if (process.env.CLOUDINARY_URL) cloudinary.config(process.env.CLOUDINARY_URL);
} catch (_) {}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Ensure temp dir exists
const TMP_DIR = "/tmp";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function buildDrawtextFilters(chunks = [], opts = {}) {
  const fontPath = opts.fontPath || "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
  const chunkDuration = typeof opts.chunkDuration === "number" ? opts.chunkDuration : 1.25;
  const fontSize = typeof opts.fontSize === "number" ? opts.fontSize : 70;

  const filters = [];
  for (let i = 0; i < chunks.length; i++) {
    const text = (chunks[i] || "").trim();
    if (!text) continue;
    const start = (i * chunkDuration).toFixed(2);
    const end = ((i + 1) * chunkDuration).toFixed(2);

    // JSON.stringify protects quotes/escapes for drawtext
    filters.push(
      `drawtext=fontfile='${fontPath}':text=${JSON.stringify(text)}:fontcolor=white:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t\\,${start}\\,${end})'`
    );
  }

  if (filters.length === 0) return "setpts=PTS-STARTPTS";
  return `${filters.join(",")},setpts=PTS-STARTPTS`;
}

function runFfmpeg({
  inputVideo,
  inputAudio,
  filterChain,
  outPath,
  threads = 2,
  crf = 23,
  preset = "veryfast",
}) {
  // Build a safe arg list (spawn, not shell)
  const args = [
    "-y",
    "-i", inputVideo,
    "-i", inputAudio,
    "-vf", filterChain,
    "-map", "0:v",
    "-map", "1:a",
    "-c:v", "libx264",
    "-preset", preset,
    "-crf", String(crf),
    "-c:a", "aac",
    "-shortest",
    "-max_muxing_queue_size", "1024",
    "-threads", String(threads),
    outPath,
  ];

  return spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
}

app.post("/execute", async (req, res) => {
  try {
    const {
      // either provide full prebuilt command pieces OR give these:
      inputVideo,
      inputAudio,
      chunks = [],
      chunkDuration = 1.25,
      fontSize = 70,
      fontPath = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
      // performance knobs
      threads = 2,
      crf = 23,
      preset = "veryfast",
      // if true -> upload to cloudinary instead of streaming binary
      upload = false,
      folder = "ffmpeg-api",
    } = req.body || {};

    if (!inputVideo || !inputAudio) {
      return res.status(400).json({ error: "inputVideo and inputAudio are required" });
    }

    const filterChain = buildDrawtextFilters(chunks, { chunkDuration, fontSize, fontPath });
    const outPath = path.join(TMP_DIR, `${uuidv4()}.mp4`);

    const ff = runFfmpeg({
      inputVideo,
      inputAudio,
      filterChain,
      outPath,
      threads,
      crf,
      preset,
    });

    let ffmpegLog = "";
    ff.stdout.on("data", (d) => (ffmpegLog += d.toString()));
    ff.stderr.on("data", (d) => (ffmpegLog += d.toString()));

    ff.on("close", async (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "FFmpeg failed", code, log: ffmpegLog });
      }

      // Upload to Cloudinary if requested
      if (upload && cloudinary && process.env.CLOUDINARY_URL) {
        try {
          const up = await cloudinary.uploader.upload(outPath, {
            resource_type: "video",
            folder,
            overwrite: true,
          });

          // cleanup local file
          fs.unlink(outPath, () => {});
          return res.json({ url: up.secure_url, public_id: up.public_id, bytes: up.bytes });
        } catch (err) {
          fs.unlink(outPath, () => {});
          return res.status(500).json({ error: "Cloudinary upload failed", details: String(err) });
        }
      }

      // Otherwise stream the binary MP4
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `inline; filename="output.mp4"`);

      const stream = fs.createReadStream(outPath);
      stream.on("close", () => fs.unlink(outPath, () => {}));
      stream.on("error", (e) => {
        fs.unlink(outPath, () => {});
        if (!res.headersSent) {
          res.status(500).json({ error: "Stream error", details: String(e) });
        }
      });
      stream.pipe(res);
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
});

app.get("/", (_req, res) => res.send("✅ FFmpeg Node API is running"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
