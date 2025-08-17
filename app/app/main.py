from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
import subprocess
import uuid
import os
import time
import threading

app = FastAPI()

BASE_URL = os.getenv("RAILWAY_STATIC_URL", "http://localhost:8000")  # Railway domain

TMP_DIR = "/app/tmp"
os.makedirs(TMP_DIR, exist_ok=True)

EXPIRATION_SECONDS = 3600  # 1 hour


@app.get("/")
def root():
    return {"message": "FFmpeg API is running!"}


@app.post("/execute")
async def execute_command(request: Request):
    data = await request.json()
    command = data.get("command")

    if not command:
        return {"error": "No command provided"}

    # Generate unique file
    filename = f"{uuid.uuid4()}.mp4"
    output_file = os.path.join(TMP_DIR, filename)

    # Append output file if not already in command
    if output_file not in command:
        command = f"{command} {output_file}"

    try:
        # Run ffmpeg
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            return {
                "error": result.stderr,
                "returncode": result.returncode
            }

        # 👉 Return the actual video binary stream
        return FileResponse(output_file, media_type="video/mp4", filename=filename)

    except Exception as e:
        return {"error": str(e)}


@app.get("/videos/{filename}")
async def get_video(filename: str):
    filepath = os.path.join(TMP_DIR, filename)
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="video/mp4", filename=filename)
    return {"error": "File not found"}


# Background cleanup job
def cleanup_old_files():
    while True:
        now = time.time()
        for file in os.listdir(TMP_DIR):
            filepath = os.path.join(TMP_DIR, file)
            if os.path.isfile(filepath):
                file_age = now - os.path.getmtime(filepath)
                if file_age > EXPIRATION_SECONDS:
                    try:
                        os.remove(filepath)
                        print(f"Deleted old file: {file}")
                    except Exception as e:
                        print(f"Failed to delete {file}: {e}")
        time.sleep(600)  # run every 10 minutes


# Start cleanup thread
threading.Thread(target=cleanup_old_files, daemon=True).start()
