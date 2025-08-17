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

# Add venv to PATH
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory inside container
WORKDIR /app

# Copy just the inner "app" folder into container
COPY app /app

# Debug: list files
RUN ls -R /app

# Expose port (Railway uses $PORT automatically)
EXPOSE 8080

# Run your main.py
CMD ["python3", "/app/app/main.py"]
