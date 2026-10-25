import os
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

from system_controller import SystemController
from memory_manager import MemoryManager
from voice_service import VoiceService
from ai_agent import AIAgent

app = FastAPI(title="Stonic JARVIS Core Engine", version="1.0.0")

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory = MemoryManager()
agent = AIAgent(memory)
sys_controller = SystemController()

class CommandRequest(BaseModel):
    command: str
    voice: Optional[str] = "jarvis"
    api_key: Optional[str] = ""
    provider: Optional[str] = "auto"

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "jarvis"

class ProfileRequest(BaseModel):
    name: str

@app.get("/")
def read_root():
    return {"status": "online", "system": "Stonic JARVIS Neural Core v1.0"}

@app.get("/api/metrics")
def get_metrics():
    return sys_controller.get_system_metrics()

@app.get("/api/memory")
def get_memory():
    return {
        "user_name": memory.get_user_name(),
        "facts": memory.get_facts(),
        "recent_history": memory.get_recent_history()
    }

@app.post("/api/profile")
def update_profile(req: ProfileRequest):
    memory.set_user_name(req.name)
    return {"success": True, "user_name": memory.get_user_name()}

@app.post("/api/command")
async def execute_command(req: CommandRequest):
    """Processes user voice/text command, triggers actions, and synthesizes neural audio."""
    result = agent.process_command(req.command, api_key=req.api_key, provider=req.provider)
    response_text = result["response"]

    # Synthesize Neural Speech Audio
    audio_data = await VoiceService.generate_speech_base64(response_text, voice_type=req.voice)
    result["audio"] = audio_data

    return result

@app.post("/api/tts")
async def synthesize_speech(req: TTSRequest):
    audio_data = await VoiceService.generate_speech_base64(req.text, voice_type=req.voice)
    if not audio_data:
        raise HTTPException(status_code=500, detail="Audio synthesis failed")
    return {"audio": audio_data}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            metrics = sys_controller.get_system_metrics()
            await websocket.send_json(metrics)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5800, reload=True)
