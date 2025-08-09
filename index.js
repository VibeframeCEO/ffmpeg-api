import express from "express";
import { exec } from "child_process";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dvxjzox0t",
  api_key: "363315973539756",
  api_secret: "R6TNXaPIz66XJo3kBDo4wGLs9Lc",
});

// Download file from URL
async function downloadFile(url, filepath) {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(filepath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

app.post("/generate", async (req, res) => {
  try {
    const { youtubeUrl, audioUrl, ffmpegCommand } = req.body;

    // Step 1: Download YouTube video locally
    const ytPath = path.resolve("temp", "youtube.mp4");
    await new Promise((resolve, reject) => {
      ytdl(youtubeUrl, { quality: "highestvideo" })
        .pipe(fs.createWriteStream(ytPath))
        .on("finish", resolve)
        .on("error", reject);
    });

    // Step 2: Upload YouTube video to Cloudinary
    const ytUpload = await cloudinary.uploader.upload(ytPath, {
      resource_type: "video",
      folder: "backgrounds",
    });
    const cloudBgUrl = ytUpload.secure_url;

    // Step 3: Replace YouTube link with Cloudinary link in ffmpeg command
    const finalCmd = ffmpegCommand.replace(youtubeUrl, cloudBgUrl);

    // Step 4: Run FFmpeg with modified command
    const outputPath = path.resolve("public/videos/output.mp4");
    await new Promise((resolve, reject) => {
      exec(finalCmd, (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg error:", stderr);
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Step 5: Upload final video to Cloudinary
    const finalUpload = await cloudinary.uploader.upload(outputPath, {
      resource_type: "video",
      folder: "final",
    });

    // Step 6: Return final Cloudinary URL
    res.json({ finalVideoUrl: finalUpload.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

