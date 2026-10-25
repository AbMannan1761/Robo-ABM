import json
import os
import time
from typing import Dict, Any, List

MEMORY_FILE = os.path.join(os.path.dirname(__file__), "memory_store.json")

class MemoryManager:
    """Manages persistent conversational and user memory."""

    def __init__(self, filepath: str = MEMORY_FILE):
        self.filepath = filepath
        self.data = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "user_profile": {
                "name": "Commander",
                "preferences": {},
                "created_at": time.time()
            },
            "facts": [],
            "history": []
        }

    def _save(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[Memory] Failed to save: {e}")

    def get_user_name(self) -> str:
        return self.data.get("user_profile", {}).get("name", "Commander")

    def set_user_name(self, name: str):
        self.data["user_profile"]["name"] = name
        self._save()

    def add_fact(self, fact: str):
        if fact not in self.data["facts"]:
            self.data["facts"].append({"fact": fact, "timestamp": time.time()})
            self._save()

    def get_facts(self) -> List[Dict[str, Any]]:
        return self.data.get("facts", [])

    def add_interaction(self, role: str, content: str):
        self.data["history"].append({
            "role": role,
            "content": content,
            "timestamp": time.time()
        })
        # Keep last 50 entries
        if len(self.data["history"]) > 50:
            self.data["history"] = self.data["history"][-50:]
        self._save()

    def get_recent_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.data.get("history", [])[-limit:]
