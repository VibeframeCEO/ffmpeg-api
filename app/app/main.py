from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
import subprocess
import uuid
import os

app = FastAPI()

BASE_URL = os.getenv("RAILWAY_STATIC_URL", "http://localhost:8000")  # Railway gives you your domain

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
    output_file = f"/app/tmp/{filename}"
    os.makedirs("/app/tmp", exist_ok=True)

    # Append output file if not already in command
    if output_file not in command:
        command = f"{command} {output_file}"

    try:
        # Run ffmpeg command
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

        # Return a URL instead of the file
        video_url = f"{BASE_URL}/videos/{filename}"
        return JSONResponse({"url": video_url})

    except Exception as e:
        return {"error": str(e)}

# Route to serve generated videos
@app.get("/videos/{filename}")
async def get_video(filename: str):
    filepath = f"/app/tmp/{filename}"
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="video/mp4", filename=filename)
    return {"error": "File not found"}
