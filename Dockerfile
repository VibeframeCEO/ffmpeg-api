# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Create the videos folder during build
RUN mkdir -p public/videos

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
