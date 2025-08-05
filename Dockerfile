# Use a base Node.js image
FROM node:18

# Create app directory
WORKDIR /app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start your server
CMD ["node", "index.js"]
