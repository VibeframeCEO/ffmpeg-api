from fastapi import FastAPI, Request
import subprocess

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

    try:
        # Run ffmpeg command
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except Exception as e:
        return {"error": str(e)}
