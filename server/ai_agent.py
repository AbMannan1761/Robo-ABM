import re
import os
import json
import requests
from datetime import datetime
from typing import Dict, Any, Tuple
from system_controller import SystemController
from memory_manager import MemoryManager

class AIAgent:
    """Intelligent Assistant Agent with bilingual intelligence (Bengali + English), tool execution, and conversational abilities."""

    def __init__(self, memory_manager: MemoryManager):
        self.memory = memory_manager
        self.system_controller = SystemController()
        self.persona = "jarvis"  # jarvis, mentor, cyberpunk

    def set_persona(self, persona: str):
        self.persona = persona

    def _is_bengali(self, text: str) -> bool:
        """Check if input text contains Bengali script characters."""
        return any('\u0980' <= c <= '\u09FF' for c in text)

    def process_command(self, user_input: str, api_key: str = "", provider: str = "auto") -> Dict[str, Any]:
        """Process incoming user prompt, check for tools, and generate response in matching language."""
        clean_input = user_input.strip()
        self.memory.add_interaction("user", clean_input)
        is_bn = self._is_bengali(clean_input)
        user_name = self.memory.get_user_name()

        # 1. Check for name learning ("my name is ...", "আমার নাম ...")
        name_match = re.search(r"(?:my name is|call me|আমার নাম|নাম হলো|আমাকে ডাকবে)\s+([A-Za-z0-9\u0980-\u09FF]+)", clean_input, re.IGNORECASE)
        if name_match:
            new_name = name_match.group(1).capitalize()
            self.memory.set_user_name(new_name)
            if is_bn:
                response_text = f"বুঝেছি। এখন থেকে আমি আপনাকে {new_name} নামে সম্বোধন করব।"
            else:
                response_text = f"Understood. I will address you as {new_name} from now on."
            self.memory.add_interaction("assistant", response_text)
            return {
                "response": response_text,
                "tool_used": "set_name",
                "action_details": {"name": new_name}
            }

        # 2. Check for App Opening tool
        open_match = re.search(r"(?:open|launch|run|খুলো|চালু করো|ওপেন করো|চালাও)\s+([A-Za-z0-9\u0980-\u09FF\s]+)", clean_input, re.IGNORECASE)
        # Also check reverse Bengali pattern: "[App] খোলো" or "[App] চালু করো"
        reverse_open_match = re.search(r"([A-Za-z0-9\u0980-\u09FF\s]+)\s+(?:খুলো|খোলো|চালু করো|ওপেন করো)", clean_input, re.IGNORECASE)
        
        target_app = None
        if open_match and not any(w in clean_input.lower() for w in ["youtube", "google", "website", "ইউটিউব", "গুগল"]):
            target_app = open_match.group(1).strip()
        elif reverse_open_match and not any(w in clean_input.lower() for w in ["youtube", "google", "ইউটিউব", "গুগল"]):
            target_app = reverse_open_match.group(1).strip()

        if target_app:
            res = self.system_controller.open_application(target_app)
            if res.get("success"):
                if is_bn:
                    response_text = f"আপনার নির্দেশমতো {target_app} চালু করে দিচ্ছি।"
                else:
                    response_text = f"Launching {target_app} for you right away."
            else:
                if is_bn:
                    response_text = f"{target_app} চালু করার চেষ্টা করেছি, কিন্তু সমস্যা দেখা দিয়েছে: {res.get('error')}"
                else:
                    response_text = f"I attempted to launch {target_app}, but encountered an issue: {res.get('error')}"
            self.memory.add_interaction("assistant", response_text)
            return {
                "response": response_text,
                "tool_used": "open_app",
                "action_details": res
            }

        # 3. Check for Web Search or YouTube Search
        yt_patterns = [
            r"(?:play|search youtube for|youtube এ|youtube এ চালাও|ইউটিউবে চালাও|ইউটিউবে বাজাও|গান চালাও|গান বাজাও)\s+(.+)",
            r"(.+)\s+(?:গান চালাও|ভিডিও চালাও|ইউটিউবে চালাও|ইউটিউবে বাজাও|বাজাও)"
        ]
        yt_query = None
        for pattern in yt_patterns:
            m = re.search(pattern, clean_input, re.IGNORECASE)
            if m:
                extracted = m.group(1).replace("on youtube", "").replace("in youtube", "").replace("ইউটিউবে", "").strip()
                if extracted:
                    yt_query = extracted
                    break

        if yt_query:
            res = self.system_controller.web_search(yt_query, engine="youtube")
            if is_bn:
                response_text = f"ইউটিউবে '{yt_query}' অনুসন্ধান করে ভিডিও চালু করে দিচ্ছি।"
            else:
                response_text = f"Searching YouTube for '{yt_query}' and playing the top result."
            self.memory.add_interaction("assistant", response_text)
            return {
                "response": response_text,
                "tool_used": "youtube_search",
                "action_details": res
            }

        search_patterns = [
            r"(?:search for|google|খোঁজ করো|সার্চ করো|খুঁজে দাও|অনুসন্ধান করো|গুগলে সার্চ করো|গুগলে খোঁজ করো)\s+(.+)",
            r"(.+)\s+(?:খোঁজ করো|সার্চ করো|অনুসন্ধান করো)"
        ]
        search_query = None
        for pattern in search_patterns:
            m = re.search(pattern, clean_input, re.IGNORECASE)
            if m:
                extracted = m.group(1).strip()
                if extracted and len(extracted) > 1:
                    search_query = extracted
                    break

        if search_query:
            res = self.system_controller.web_search(search_query, engine="google")
            if is_bn:
                response_text = f"গুগলে '{search_query}' অনুসন্ধান শুরু করছি।"
            else:
                response_text = f"Initiating web search for '{search_query}'."
            self.memory.add_interaction("assistant", response_text)
            return {
                "response": response_text,
                "tool_used": "web_search",
                "action_details": res
            }

        # 4. Check for Volume Adjustment
        if any(w in clean_input.lower() for w in ["volume up", "increase volume", "sound up", "সাউন্ড বাড়াও", "আওয়াজ বাড়াও", "শব্দ বাড়াও", "ভলিউম বাড়াও"]):
            res = self.system_controller.adjust_volume("up")
            response_text = "মাস্টার ভলিউম বাড়িয়ে দেওয়া হয়েছে।" if is_bn else "Increasing master volume level."
            self.memory.add_interaction("assistant", response_text)
            return {"response": response_text, "tool_used": "volume_up", "action_details": res}

        if any(w in clean_input.lower() for w in ["volume down", "decrease volume", "sound down", "সাউন্ড কমাও", "আওয়াজ কমাও", "শব্দ কমাও", "ভলিউম কমাও"]):
            res = self.system_controller.adjust_volume("down")
            response_text = "মাস্টার ভলিউম কমিয়ে দেওয়া হয়েছে।" if is_bn else "Decreasing master volume level."
            self.memory.add_interaction("assistant", response_text)
            return {"response": response_text, "tool_used": "volume_down", "action_details": res}

        if any(w in clean_input.lower() for w in ["mute", "unmute", "নীরব করো", "মিউট করো", "আনমিউট করো", "শব্দ বন্ধ করো"]):
            res = self.system_controller.adjust_volume("mute")
            response_text = "অডিও মিউট/আনমিউট স্টেট পরিবর্তন করা হয়েছে।" if is_bn else "Toggling audio mute state."
            self.memory.add_interaction("assistant", response_text)
            return {"response": response_text, "tool_used": "volume_mute", "action_details": res}

        # 5. Check for System Diagnostics
        if any(w in clean_input.lower() for w in [
            "system status", "diagnostics", "cpu usage", "ram usage", "battery", 
            "পিসির অবস্থা", "কম্পিউটারের অবস্থা", "সিস্টেম স্ট্যাটাস", "সিপিইউ কেমন", "র‍্যাম কেমন", "চার্জ কত", "ব্যাটারি কেমন"
        ]):
            metrics = self.system_controller.get_system_metrics()
            cpu = metrics.get("cpu_percent", 0)
            ram = metrics.get("memory_percent", 0)
            bat = metrics.get("battery")
            if is_bn:
                bat_str = f" ব্যাটারি ব্যাকআপ {bat['percent']}% অবশিষ্ট আছে।" if bat else ""
                response_text = f"সকল সিস্টেম চমৎকারভাবে সচল রয়েছে। বর্তমানে CPU ব্যবহার হচ্ছে {cpu}%, এবং RAM ব্যবহৃত হচ্ছে {ram}%।{bat_str}"
            else:
                bat_str = f" Battery is at {bat['percent']}%." if bat else ""
                response_text = f"All systems nominal. CPU utilization is currently at {cpu}%, and RAM consumption stands at {ram}%.{bat_str}"
            self.memory.add_interaction("assistant", response_text)
            return {"response": response_text, "tool_used": "system_status", "action_details": metrics}

        # 6. Check for LLM API if key provided (OpenAI or Gemini)
        if api_key:
            try:
                llm_response = self._call_external_llm(clean_input, api_key, provider, is_bn)
                if llm_response:
                    self.memory.add_interaction("assistant", llm_response)
                    return {"response": llm_response, "tool_used": "llm", "action_details": {}}
            except Exception as e:
                print(f"[LLM error]: {e}")

        # 7. Fallback Intelligent Conversational Engine (JARVIS Bilingual Persona)
        response_text = self._generate_autonomous_response(clean_input, is_bn)
        self.memory.add_interaction("assistant", response_text)
        return {"response": response_text, "tool_used": "autonomous_engine", "action_details": {}}

    def _generate_autonomous_response(self, text: str, is_bn: bool) -> str:
        """Generate high-fidelity conversational responses matching the JARVIS persona in English or Bengali."""
        lower = text.lower()
        user_name = self.memory.get_user_name()

        # Bengali Conversation Mode
        if is_bn:
            # Greetings
            if any(w in lower for w in ["হ্যালো", "হাই", "সালাম", "নমস্কার", "কেমন আছো", "কেমন আছেন", "শুভ সকাল", "শুভ সন্ধ্যা"]):
                return f"সালাম ও শুভেচ্ছা, {user_name}। নিউরাল কোর সক্রিয় রয়েছে। আজ আপনার পিসিতে কী কাজ পরিচালনা করতে চান?"

            # Identity / Who are you
            if any(w in lower for w in ["কে তুমি", "তোমার পরিচয়", "তোমার নাম কি", "তুমি কে", "তোমার কাজ কি"]):
                return (
                    f"আমি স্টনিক জারভিস (Stonic JARVIS)—আপনার ব্যক্তিগত সায়েন্স-ফিকশন এআই সহকারী। "
                    f"আমি আপনার পিসির অবস্থা পর্যবেক্ষণ করা, সফটওয়্যার চালু করা, গান বাজানো এবং ওএস কমান্ড কার্যকর করতে পারি।"
                )

            # Capabilities / What can you do
            if any(w in lower for w in ["কী করতে পারো", "কাজ কি", "ফিচার", "কী কী করতে পারো", "কীভাবে সাহায্য করবে"]):
                return (
                    f"আমি সরাসরি আপনার উইন্ডোজ অপারেটিং সিস্টেম নিয়ন্ত্রণ করতে পারি। সফটওয়্যার ওপেন করা (ক্রোম, স্পটিফাই, ভিএস কোড), "
                    f"ভলিউম বাড়ানো-কমানো, ইউটিউব ও গুগলে তথ্য বা গান অনুসন্ধান, লাইভ সিপিইউ-র‍্যাম পর্যবেক্ষণ এবং আপনার যেকোনো প্রশ্নের উত্তর দেওয়া আমার দায়িত্ব।"
                )

            # Gratitude
            if any(w in lower for w in ["ধন্যবাদ", "থ্যাংক ইউ", "অনেক ধন্যবাদ", "গুড জব", "সাবাশ", "ওয়েল ডান"]):
                return f"আপনাকে সাহায্য করতে পেরে আমি আনন্দিত, {user_name}। মসৃণ ও দ্রুত কাজ সম্পাদন করাই আমার মূল লক্ষ্য।"

            # Status check
            if any(w in lower for w in ["তুমি কি আছো", "জেগে আছো", "রেডি", "শুনছো", "কথা বলো"]):
                return f"সকল সিস্টেম ১০০% ক্ষমতায় প্রস্তুত, {user_name}। আপনার নির্দেশের অপেক্ষায় আছি।"

            # Time check
            if any(w in lower for w in ["কয়টা বাজে", "সময় কত", "তারিখ কত", "আজকে কি বার"]):
                now = datetime.now()
                return f"বর্তমান লোকাল সময় {now.strftime('%I:%M %p')}, এবং আজকের তারিখ {now.strftime('%d %B, %Y')}।"

            # General Bengali Fallback
            return (
                f"আমি আপনার কথা মনোযোগ দিয়ে শুনেছি, {user_name}। কোনো অ্যাপ চালু করতে, গান চালাতে, "
                f"পিসির অবস্থা জানতে বা যেকোনো তথ্যের জন্য আমাকে নির্দেশ দিন।"
            )

        # English Conversation Mode (JARVIS Style)
        else:
            # Greetings
            if any(w in lower for w in ["hello", "hi", "hey", "greetings"]):
                return f"Greetings, {user_name}. Neural core is synchronized and standing by. What task shall we execute today?"

            # Who are you
            if any(w in lower for w in ["who are you", "what are you"]):
                return (
                    f"I am your autonomous neural interface, operating as Stonic JARVIS. "
                    f"I monitor your system telemetry, execute operating system workflows, and assist you with computing tasks."
                )

            # What can you do
            if any(w in lower for w in ["what can you do", "features", "capabilities"]):
                return (
                    f"I have direct access to your Windows architecture. I can launch software applications (like Chrome, Spotify, VS Code), "
                    f"control your sound levels, run web and YouTube queries, monitor real-time CPU and memory telemetry, "
                    f"and retain contextual memory across our sessions."
                )

            # Gratitude
            if any(w in lower for w in ["thank you", "thanks", "good job", "well done"]):
                return f"Always at your service, {user_name}. Seamless execution is my primary directive."

            # Status check
            if any(w in lower for w in ["are you there", "you awake", "ready", "systems check"]):
                return f"Systems operating at 100% capacity, {user_name}. Awaiting your command."

            # Time check
            if any(w in lower for w in ["what time is it", "time", "date"]):
                now = datetime.now()
                return f"Current local time is {now.strftime('%I:%M %p')} on {now.strftime('%B %d, %Y')}."

            # Default smart response
            return (
                f"Understood, {user_name}. Analyzing '{text}'. You can instruct me to launch any application, "
                f"search the web, or run system diagnostics at any time."
            )

    def _call_external_llm(self, prompt: str, api_key: str, provider: str, is_bn: bool = False) -> str:
        """Call external LLM if configured, adhering to bilingual personality."""
        user_name = self.memory.get_user_name()
        if is_bn:
            system_instruction = (
                f"You are Stonic JARVIS, a highly sophisticated, polite, and efficient AI companion living in a Windows PC. "
                f"The user's name is {user_name}. The user communicated in Bengali. You MUST respond completely in natural, elegant, fluent Bengali. "
                f"Keep responses concise, direct, cinematic, and helpful."
            )
        else:
            system_instruction = (
                f"You are Stonic JARVIS, a highly sophisticated, polite, and efficient AI assistant residing in a Windows PC. "
                f"The user's name is {user_name}. Keep responses concise, direct, cinematic, and helpful."
            )
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 150
        }
        res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
        return ""

