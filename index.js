const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Serve videos and audios correctly
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use('/audios', express.static(path.join(__dirname, 'public/audios')));

// ✅ Test route to verify server is up
app.get('/', (req, res) => {
  res.send('✅ FFmpeg API is running on Railway');
});

// ✅ Test if video is accessible
app.get('/test-video', (req, res) => {
  const filePath = path.join(__dirname, 'public/videos/BG3.mp4');
  console.log('Sending file from:', filePath);
  res.sendFile(filePath);
});

// ✅ Test if audio is accessible
app.get('/test-audio', (req, res) => {
  const filePath = path.join(__dirname, 'public/audios/sample.mp3');
  console.log('Sending file from:', filePath);
  res.sendFile(filePath);
});

// 🚀 Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
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
<<<<<<< HEAD
});
=======
});

// ✅ Home route
app.get("/", (req, res) => {
  res.send("✅ FFmpeg API is working.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

>>>>>>> 492145423d61b959a9ca0e09ef83d729663a6ddb
