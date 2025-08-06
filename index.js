const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use('/audios', express.static(path.join(__dirname, 'public/audios')));

app.get('/', (req, res) => {
  res.send('✅ FFmpeg API is running on Railway');
});

app.get('/test-video', (req, res) => {
  const filePath = path.join(__dirname, 'public/videos/BG3.mp4');
  console.log('Sending file from:', filePath);
  res.sendFile(filePath);
});

app.get('/test-audio', (req, res) => {
  const filePath = path.join(__dirname, 'public/audios/sample.mp3');
  console.log('Sending file from:', filePath);
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

