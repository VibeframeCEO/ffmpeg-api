const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function extractOutputPath(cmd) {
  // try last "quoted.mp4"
  let m = cmd.match(/"([^"]+\.mp4)"\s*$/);
  if (m && m[1]) return m[1];
  // try last unquoted .mp4 token
  m = cmd.match(/(\S+\.mp4)\s*$/);
  if (m && m[1]) return m[1];
  return null;
}

// Healthcheck
app.get("/", (_req, res) => res.send("✅ FFmpeg API up"));

// Main endpoint: POST /execute
app.post("/execute", (req, res) => {
  const { command } = req.body || {};
  if (!command || typeof command !== "string") {
    return res.status(400).json({ error: "Bad request - please send JSON { command: \"ffmpeg ... /tmp/out.mp4\" }" });
  }

  const outputPath = extractOutputPath(command);
  if (!outputPath) {
    return res.status(400).json({ error: "Could not find output .mp4 path at the end of your command" });
  }

  console.log("🎬 Running FFmpeg:\n", command);
  const child = spawn(command, { shell: true });

  let stderr = "";
  child.stderr.on("data", (d) => {
    const text = d.toString();
    // keep only the last ~12KB to avoid memory blow-up
    stderr = (stderr + text).slice(-12 * 1024);
  });

  child.on("error", (err) => {
    console.error("❌ spawn error:", err);
    return res.status(500).json({ error: "Failed to start ffmpeg", details: String(err) });
  });

  child.on("close", async (code) => {
    if (code !== 0) {
      console.error("❌ ffmpeg exit code:", code);
      return res.status(500).json({ error: "ffmpeg failed", details: stderr });
    }

    // stream the file back as binary
    try {
      const abs = path.resolve(outputPath);
      if (!fs.existsSync(abs)) {
        return res.status(500).json({ error: "Output file not found after ffmpeg", details: abs });
      }

      const stat = fs.statSync(abs);
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Length", stat.size);

      const stream = fs.createReadStream(abs);
      stream.pipe(res);

      // clean up after sending
      res.on("finish", () => {
        fs.unlink(abs, (e) => {
          if (e) console.warn("⚠️ cleanup failed:", e.message);
          else console.log("🧹 deleted", abs);
        });
      });
    } catch (e) {
      console.error("❌ send error:", e);
      return res.status(500).json({ error: "Failed to stream output", details: String(e) });
    }
  });
});

app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
