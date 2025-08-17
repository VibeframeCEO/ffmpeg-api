FROM node:18-bullseye-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install only prod deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy app source
COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
