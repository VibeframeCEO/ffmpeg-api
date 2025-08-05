const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.json());

app.post('/generate', (req, res) => {
  // Example: simple FFmpeg command - convert input.mp4 to output.mp4
  // Here you would adapt for your actual video generation commands

  const ffmpegCmd = 'ffmpeg -i input.mp4 -vf "drawtext=text=\'Hello World\':fontcolor=white:fontsize=24:x=10:y=10" output.mp4';

  exec(ffmpegCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('FFmpeg error:', error);
      return res.status(500).send('FFmpeg failed');
    }
    res.send('Video generated successfully');
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`FFmpeg API listening on port ${port}`);
});
