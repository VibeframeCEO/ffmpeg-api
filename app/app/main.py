from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
import subprocess
import uuid
import os

app = FastAPI()

@app.get("/")
def root():
    return {"message": "FFmpeg API is running!"}

@app.post("/execute")
async def execute_command(request: Request):
    data = await request.json()
    command = data.get("command")

    if not command:
        return {"error": "No command provided"}

    # Generate a unique temp file
    output_file = f"/app/tmp/{uuid.uuid4()}.mp4"
    os.makedirs("/app/tmp", exist_ok=True)

    # Append output file to command if not already
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

        # Return the generated video
        return FileResponse(output_file, media_type="video/mp4", filename="output.mp4")

    except Exception as e:
        return {"error": str(e)}
