import os
import uuid
import subprocess
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse

app = FastAPI()

TMP_DIR = "/app/tmp"
os.makedirs(TMP_DIR, exist_ok=True)

@app.post("/execute")
async def execute_command(request: Request):
    data = await request.json()
    command = data.get("command")

    if not command:
        return {"error": "No command provided"}

    # unique filename
    filename = f"{uuid.uuid4()}.mp4"
    output_file = os.path.join(TMP_DIR, filename)

    # add output path if not included
    if output_file not in command:
        command = f"{command} {output_file}"

    try:
        # run ffmpeg
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            return {"error": result.stderr}

        # return the actual video file (binary)
        return FileResponse(output_file, media_type="video/mp4", filename=filename)

    except Exception as e:
        return {"error": str(e)}

