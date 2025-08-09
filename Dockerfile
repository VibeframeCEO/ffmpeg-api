FROM node:18

WORKDIR /app

# Install system deps + ffmpeg + python & pip (for yt-dlp)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install --no-cache-dir yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Copy package files & install
COPY package*.json ./
RUN npm install

# Copy app
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
