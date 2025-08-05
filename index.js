const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from "public" folder
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));

app.post('/run-ffmpeg', (req, res) => {
  const { command } = req.body;

  console.log('Received FFmpeg command:', command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('FFmpeg error:', stderr);
      return res.status(500).json({ error: stderr });
    }
    console.log('FFmpeg output:', stdout);
    res.json({
      message: 'Video generated successfully',
      downloadUrl: 'https://ffmpeg-api-production-aee7.up.railway.app/videos/output.mp4'
    });
  });
});

app.listen(port, () => {
  console.log(`FFmpeg API listening on port ${port}`);
});
