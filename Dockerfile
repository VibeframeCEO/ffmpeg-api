# Use lightweight Debian image
FROM debian:bullseye-slim

# Install system dependencies + ffmpeg + python + pip + venv
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    ffmpeg python3 python3-pip python3-venv curl && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add venv to PATH (so we can just call yt-dlp / python normally)
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy app code into container
COPY . /app

# Expose port (Railway auto-assigns $PORT)
EXPOSE 8080

# If your server is in /app/app/main.py
CMD ["python3", "app/main.py"]
