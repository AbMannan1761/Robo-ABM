import asyncio
import base64
import os
import tempfile
import edge_tts
from typing import Optional

class VoiceService:
    """Provides high-fidelity Neural Text-To-Speech using edge-tts."""

    VOICES = {
        "jarvis": "en-US-ChristopherNeural",
        "male": "en-US-GuyNeural",
        "female": "en-US-AriaNeural",
        "bengali_male": "bn-BD-PradeepNeural",
        "bengali_female": "bn-BD-NabanitaNeural"
    }

    @staticmethod
    async def generate_speech_base64(text: str, voice_type: str = "jarvis") -> Optional[str]:
        """Convert text to MP3 audio and return as Base64 string for direct browser playback."""
        clean_text = text.strip()
        if not clean_text:
            return None

        # Detect Bengali script characters
        has_bengali = any('\u0980' <= c <= '\u09FF' for c in clean_text)
        if has_bengali:
            if voice_type in ["bengali_female", "female"]:
                voice = VoiceService.VOICES.get("bengali_female", "bn-BD-NabanitaNeural")
            else:
                voice = VoiceService.VOICES.get("bengali_male", "bn-BD-PradeepNeural")
        else:
            voice = VoiceService.VOICES.get(voice_type, VoiceService.VOICES["jarvis"])

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            temp_path = tmp_file.name

        try:
            communicate = edge_tts.Communicate(clean_text, voice)
            await communicate.save(temp_path)

            with open(temp_path, "rb") as f:
                audio_bytes = f.read()

            b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
            return f"data:audio/mp3;base64,{b64_audio}"
        except Exception as e:
            print(f"[VoiceService Error]: {e}")
            return None
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
