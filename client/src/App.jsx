import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Settings, 
  Volume2, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  Terminal,
  Activity,
  Radio
} from 'lucide-react';

import ParticleAvatar from './components/ParticleAvatar';
import HolographicGlobe from './components/HolographicGlobe';
import SystemHUD from './components/SystemHUD';
import CommandConsole from './components/CommandConsole';
import SettingsModal from './components/SettingsModal';
import { clientAIBrain } from './services/aiBrain';

const API_BASE = 'http://127.0.0.1:5800';

const anyCharInBnRange = (text) => /[\u0980-\u09FF]/.test(text);

function App() {
  const [coreState, setCoreState] = useState('idle'); // idle, listening, thinking, speaking
  const [audioVolume, setAudioVolume] = useState(0);
  const [metrics, setMetrics] = useState({
    cpu_percent: 18,
    memory_percent: 45,
    disk_percent: 62,
    battery: { percent: 94, power_plugged: true }
  });
  const [backendOnline, setBackendOnline] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Stonic JARVIS online. Quantum neural lattice synchronized. Standing by for command.',
      timestamp: Date.now()
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastToolUsed, setLastToolUsed] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('stonic_settings');
    return saved ? JSON.parse(saved) : {
      userName: 'Commander',
      persona: 'jarvis',
      voice: 'jarvis',
      apiKey: '',
      provider: 'auto'
    };
  });

  const [inputLanguage, setInputLanguage] = useState(() => {
    return localStorage.getItem('stonic_lang') || 'bn-BD';
  });

  const toggleLanguage = () => {
    setInputLanguage((prev) => {
      const next = prev === 'bn-BD' ? 'en-US' : 'bn-BD';
      localStorage.setItem('stonic_lang', next);
      return next;
    });
  };

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const currentAudioElementRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/metrics`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch (e) {
        setBackendOnline(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = inputLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setCoreState('listening');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendCommand(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setCoreState('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (coreState === 'listening') {
          setCoreState('idle');
        }
      };

      recognitionRef.current = recognition;
    }
  }, [inputLanguage, settings.voice]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. You can type commands in the prompt bar.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setCoreState('idle');
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start mic:", err);
      }
    }
  };

  const playSpeechAudio = (audioBase64) => {
    if (!audioBase64) return;

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioCtx();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 64;
      }

      if (currentAudioElementRef.current) {
        currentAudioElementRef.current.pause();
      }

      const audio = new Audio(audioBase64);
      currentAudioElementRef.current = audio;

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      try {
        const source = audioContextRef.current.createMediaElementSource(audio);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        // already connected
      }

      audio.onplay = () => {
        setCoreState('speaking');
        monitorAudioVolume();
      };

      audio.onended = () => {
        setCoreState('idle');
        setAudioVolume(0);
      };

      audio.play().catch(e => console.warn("Audio autoplay blocked:", e));
    } catch (e) {
      console.warn("Audio analysis error:", e);
    }
  };

  const monitorAudioVolume = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkVolume = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      setAudioVolume(avg / 128);

      if (currentAudioElementRef.current && !currentAudioElementRef.current.paused) {
        requestAnimationFrame(checkVolume);
      } else {
        setAudioVolume(0);
      }
    };

    checkVolume();
  };

  const speakingIntervalRef = useRef(null);

  const simulateAvatarSpeaking = () => {
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    speakingIntervalRef.current = setInterval(() => {
      setAudioVolume(0.2 + Math.random() * 0.5);
    }, 120);
  };

  const stopAvatarSpeaking = () => {
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    setAudioVolume(0);
    setCoreState('idle');
  };

  const speakText = (text, isBn) => {
    if (!('speechSynthesis' in window)) {
      setCoreState('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      if (isBn) {
        const bnVoice = voices.find(v => 
          v.lang.toLowerCase().includes('bn') || 
          v.name.toLowerCase().includes('bangla') || 
          v.name.toLowerCase().includes('bengali')
        );
        if (bnVoice) {
          utterance.voice = bnVoice;
          utterance.lang = bnVoice.lang;
        } else {
          const naturalVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.startsWith('en'));
          if (naturalVoice) utterance.voice = naturalVoice;
        }
      } else {
        const enVoice = voices.find(v => 
          v.name.includes('Guy') || 
          v.name.includes('David') || 
          v.name.includes('Google US English') || 
          v.lang.startsWith('en')
        );
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setCoreState('speaking');
        simulateAvatarSpeaking();
      };

      utterance.onend = () => {
        stopAvatarSpeaking();
      };

      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        stopAvatarSpeaking();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed:", e);
      stopAvatarSpeaking();
    }
  };

  const handleSendCommand = async (commandText) => {
    if (!commandText.trim()) return;

    const newMsg = {
      role: 'user',
      content: commandText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
    setIsProcessing(true);
    setCoreState('thinking');

    const isBn = anyCharInBnRange(commandText);
    let handled = false;

    // 1. Try Python local backend
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const response = await fetch(`${API_BASE}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandText,
          voice: settings.voice,
          api_key: settings.apiKey,
          provider: settings.provider
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        handled = true;
        setBackendOnline(true);
        setLastToolUsed(data.tool_used);

        const botMsg = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
          audio: data.audio
        };
        setMessages(prev => [...prev, botMsg]);

        if (data.audio) {
          playSpeechAudio(data.audio);
        } else {
          speakText(data.response, isBn);
        }
      }
    } catch (e) {
      handled = false;
      setBackendOnline(false);
    }

    // 2. If local backend wasn't reached (Web / GitHub Pages mode), use client AI Brain!
    if (!handled) {
      const brainResult = clientAIBrain.process(commandText, settings.apiKey, settings.provider);
      setLastToolUsed(brainResult.tool);

      const botMsg = {
        role: 'assistant',
        content: brainResult.response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
      speakText(brainResult.response, isBn);
    }

    setIsProcessing(false);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('stonic_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="stonic-app">
      {/* Top HUD Header */}
      <header className="stonic-header">
        <div className="stonic-brand">
          <div className="brand-orb">
            <Radio className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h1 className="brand-title">
              STONIC <span>JARVIS</span>
            </h1>
            <p className="brand-subtitle">
              AUTONOMOUS SCI-FI PC CORE
            </p>
          </div>
        </div>

        <div className="stonic-header-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f3ff' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f3ff' }} />
            <span>UTC: {currentTime.slice(17, 25)}</span>
          </div>
          <div style={{ color: '#94a3b8' }}>
            COMMANDER: <span style={{ color: '#00f3ff', fontWeight: 600 }}>{settings.userName}</span>
          </div>
        </div>

        <div className="stonic-header-right">
          <div className="badge-status">
            {backendOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span style={{ color: '#34d399' }}>CORE LINK: ACTIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span style={{ color: '#fbbf24' }}>LOCAL AUTONOMOUS</span>
              </>
            )}
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-icon"
            title="Configure System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3-Column Bridge Grid */}
      <div className="stonic-main-grid">
        {/* Left Column: World Radar & Protocol */}
        <div className="stonic-col">
          <div className="hud-panel">
            <div className="hud-panel-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe className="w-4 h-4" /> WORLD RADAR
              </span>
              <span style={{ color: '#10b981', fontSize: '10px' }}>LIVE FEED</span>
            </div>
            <HolographicGlobe />
          </div>

          <div className="hud-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="hud-panel-header">
              <span>ACTIVE PROTOCOL</span>
            </div>
            <div className="hud-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="protocol-row">
                  <span style={{ color: '#94a3b8' }}>PERSONA</span>
                  <span style={{ color: '#00f3ff', textTransform: 'uppercase' }}>{settings.persona}</span>
                </div>
                <div className="protocol-row">
                  <span style={{ color: '#94a3b8' }}>VOICE MODEL</span>
                  <span style={{ color: '#00f3ff' }}>{settings.voice}</span>
                </div>
                <div className="protocol-row">
                  <span style={{ color: '#94a3b8' }}>MEMORY SYSTEM</span>
                  <span style={{ color: '#10b981' }}>PERSISTENT</span>
                </div>
                <div className="protocol-row">
                  <span style={{ color: '#94a3b8' }}>DISPATCH API</span>
                  <span style={{ color: '#00f3ff' }}>WINDOWS OS</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(0, 243, 255, 0.15)', fontSize: '10px', color: '#64748b', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                DESKTOP AGENT • RUNNING LOCALLY
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: 3D Holographic Particle Avatar Core */}
        <div className="stonic-col">
          <div className="hud-panel avatar-showcase">
            <div className="avatar-hud-info-left">
              COORD: +23.8103°N // 90.4125°E
            </div>
            <div className="avatar-hud-info-right">
              SPECTRUM: {Math.round(audioVolume * 100)}%
            </div>

            <ParticleAvatar 
              state={coreState} 
              audioVolume={audioVolume}
              persona={settings.persona}
            />

            <div style={{ position: 'absolute', bottom: '24px', zIndex: 20 }}>
              <button
                onClick={toggleListening}
                className={`hud-btn ${isListening ? 'hud-btn-active' : ''}`}
              >
                {isListening ? 'LISTENING... (CLICK TO STOP)' : 'COMMENCE VOICE INPUT'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry Gauges & Command Console */}
        <div className="stonic-col">
          <SystemHUD 
            metrics={metrics} 
            onQuickAction={handleSendCommand}
          />

          <CommandConsole 
            messages={messages}
            onSendCommand={handleSendCommand}
            isListening={isListening}
            onToggleListening={toggleListening}
            isProcessing={isProcessing}
            lastToolUsed={lastToolUsed}
            onAudioPlay={playSpeechAudio}
            inputLanguage={inputLanguage}
            onToggleLanguage={toggleLanguage}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}

export default App;
