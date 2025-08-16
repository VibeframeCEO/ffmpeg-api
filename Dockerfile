FROM node:18

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

# Install system deps + ffmpeg + python & pip (for yt-dlp)
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends ffmpeg python3 python3-pip python3-yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files & install node modules
COPY package*.json ./
RUN npm install

# Copy app files
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
