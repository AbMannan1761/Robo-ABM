import os
import sys
import psutil
import subprocess
import webbrowser
from typing import Dict, Any, List

class SystemController:
    """Manages Windows OS interactions, metrics, and automation."""

    COMMON_APPS = {
        "chrome": "chrome",
        "google chrome": "chrome",
        "ক্রোম": "chrome",
        "edge": "msedge",
        "browser": "chrome",
        "ব্রাউজার": "chrome",
        "notepad": "notepad",
        "নোটপ্যাড": "notepad",
        "calculator": "calc",
        "calc": "calc",
        "ক্যালকুলেটর": "calc",
        "spotify": "spotify",
        "স্পটিফাই": "spotify",
        "terminal": "wt",
        "টার্মিনাল": "wt",
        "cmd": "cmd",
        "powershell": "powershell",
        "explorer": "explorer",
        "files": "explorer",
        "ফাইল": "explorer",
        "ফাইল ম্যানেজার": "explorer",
        "vscode": "code",
        "code": "code",
        "ভিএস কোড": "code",
        "task manager": "taskmgr",
        "settings": "ms-settings:",
        "সেটিংস": "ms-settings:",
        "control panel": "control",
        "paint": "mspaint",
        "পেইন্ট": "mspaint"
    }

    @staticmethod
    def get_system_metrics() -> Dict[str, Any]:
        """Fetch real-time CPU, RAM, Disk, and Battery stats."""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            battery = psutil.sensors_battery()
            battery_info = None
            if battery:
                battery_info = {
                    "percent": battery.percent,
                    "power_plugged": battery.power_plugged,
                    "secsleft": battery.secsleft
                }

            return {
                "cpu_percent": cpu_percent,
                "memory_percent": mem.percent,
                "memory_used_gb": round(mem.used / (1024 ** 3), 2),
                "memory_total_gb": round(mem.total / (1024 ** 3), 2),
                "disk_percent": disk.percent,
                "disk_free_gb": round(disk.free / (1024 ** 3), 2),
                "battery": battery_info,
                "platform": sys.platform
            }
        except Exception as e:
            return {"error": str(e), "cpu_percent": 0, "memory_percent": 0}

    @staticmethod
    def open_application(app_name: str) -> Dict[str, Any]:
        """Launch a Windows application by name."""
        clean_name = app_name.strip().lower()
        cmd = SystemController.COMMON_APPS.get(clean_name, clean_name)
        
        try:
            if cmd.startswith("ms-settings:"):
                os.system(f"start {cmd}")
            else:
                subprocess.Popen(cmd, shell=True)
            return {"success": True, "message": f"Successfully launched {app_name}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def web_search(query: str, engine: str = "google") -> Dict[str, Any]:
        """Search the web or YouTube."""
        clean_query = query.strip()
        if not clean_query:
            return {"success": False, "error": "Query cannot be empty"}

        if "youtube" in engine.lower():
            url = f"https://www.youtube.com/results?search_query={clean_query}"
        else:
            url = f"https://www.google.com/search?q={clean_query}"

        try:
            webbrowser.open(url)
            return {"success": True, "message": f"Searching for '{clean_query}' on {engine.capitalize()}", "url": url}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def open_url(url: str) -> Dict[str, Any]:
        """Open a specific web link."""
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url
        try:
            webbrowser.open(url)
            return {"success": True, "message": f"Navigating to {url}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def adjust_volume(action: str) -> Dict[str, Any]:
        """Control volume on Windows using PowerShell / VBS script."""
        try:
            if action.lower() == "mute":
                # Toggle mute via keyboard event
                subprocess.run(
                    ["powershell", "-c", "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]173)"],
                    check=True
                )
                return {"success": True, "message": "Volume muted/unmuted"}
            elif action.lower() in ["up", "increase"]:
                for _ in range(5):
                    subprocess.run(
                        ["powershell", "-c", "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]175)"],
                        check=True
                    )
                return {"success": True, "message": "Volume increased"}
            elif action.lower() in ["down", "decrease"]:
                for _ in range(5):
                    subprocess.run(
                        ["powershell", "-c", "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]174)"],
                        check=True
                    )
                return {"success": True, "message": "Volume decreased"}
            return {"success": False, "error": f"Unknown action: {action}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
