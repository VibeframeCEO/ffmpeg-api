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

# Set working directory to root of project
WORKDIR /app

# Copy everything from local folder into container
COPY /app

# Debug: list all files to make sure main.py exists
RUN ls -R /app

# Expose port
EXPOSE 8080

# Run main.py inside the inner app folder
CMD ["python3", "./app/main.py"]
