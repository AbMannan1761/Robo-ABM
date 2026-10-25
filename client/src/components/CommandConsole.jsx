import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, Bot, User, Terminal } from 'lucide-react';

const CommandConsole = ({ 
  onSendCommand, 
  messages = [], 
  isListening, 
  onToggleListening, 
  isProcessing,
  lastToolUsed,
  onAudioPlay,
  inputLanguage = 'bn-BD',
  onToggleLanguage
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendCommand(inputText.trim());
    setInputText('');
  };

  return (
    <div className="hud-panel console-panel">
      {/* Console Header */}
      <div className="hud-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>NEURAL LOG & DISPATCH</span>
        </div>
        {lastToolUsed && (
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '9px', 
            fontFamily: 'var(--font-mono)', 
            background: 'rgba(0, 243, 255, 0.1)', 
            border: '1px solid rgba(0, 243, 255, 0.4)',
            color: '#00f3ff'
          }}>
            TOOL: {lastToolUsed.toUpperCase()}
          </span>
        )}
      </div>

      {/* Message Feed */}
      <div className="console-feed">
        {messages.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#64748b', gap: '8px' }}>
            <Bot className="w-8 h-8 text-cyan-500/40" />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: '#00adb5' }}>
              STONIC NEURAL BILINGUAL INTERFACE ONLINE
            </p>
            <p style={{ fontSize: '11px', maxWidth: '300px', lineHeight: '1.5' }}>
              বাংলা বা ইংরেজিতে কথা বলুন বা লিখুন:<br />
              <span style={{ color: '#00f3ff' }}>"ক্রোম খুলো"</span>, <span style={{ color: '#00f3ff' }}>"গান চালাও"</span>, <span style={{ color: '#00f3ff' }}>"পিসির অবস্থা"</span>, or <span style={{ color: '#00f3ff' }}>"Open VS Code"</span>.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-bot'}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '10px', color: '#94a3b8' }}>
                {msg.role === 'user' ? (
                  <>
                    <User className="w-3 h-3 text-cyan-400" />
                    <span>COMMANDER</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-cyan-400" />
                    <span style={{ color: '#00f3ff', fontFamily: 'var(--font-display)' }}>STONIC AI</span>
                  </>
                )}
                <span>• {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
              </div>
              
              <div>{msg.content}</div>

              {msg.audio && (
                <button 
                  onClick={() => onAudioPlay && onAudioPlay(msg.audio)}
                  style={{ 
                    marginTop: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '10px', 
                    color: '#00f3ff', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer' 
                  }}
                >
                  <Volume2 className="w-3.5 h-3.5" /> Replay Voice
                </button>
              )}
            </div>
          ))
        )}

        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f3ff', fontFamily: 'var(--font-display)', fontSize: '11px' }}>
            <Bot className="w-4 h-4 animate-spin" />
            <span>Processing neural synthesis...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="console-input-bar">
        {/* Quick Language Toggle */}
        <button
          type="button"
          onClick={onToggleLanguage}
          className="btn-icon"
          style={{ 
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-display)',
            background: inputLanguage === 'bn-BD' ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: inputLanguage === 'bn-BD' ? '#00f3ff' : 'rgba(255, 255, 255, 0.2)',
            color: inputLanguage === 'bn-BD' ? '#00f3ff' : '#94a3b8',
            minWidth: '46px',
            height: '32px'
          }}
          title={inputLanguage === 'bn-BD' ? "ভয়েস ইনপুট: বাংলা (ক্লিক করে ইংরেজি করুন)" : "Voice Input: English (Click to switch to Bengali)"}
        >
          {inputLanguage === 'bn-BD' ? 'বাংলা' : 'ENG'}
        </button>

        <button
          type="button"
          onClick={onToggleListening}
          className="btn-icon"
          style={{ 
            background: isListening ? '#ef4444' : 'rgba(0, 243, 255, 0.1)',
            borderColor: isListening ? '#ef4444' : 'rgba(0, 243, 255, 0.3)',
            color: isListening ? '#fff' : '#00f3ff'
          }}
          title={isListening ? "Listening... click to stop" : `Start Voice Input (${inputLanguage === 'bn-BD' ? 'বাংলা' : 'English'})`}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isListening 
              ? (inputLanguage === 'bn-BD' ? "আপনার বাংলা কথা শুনছি..." : "Listening to your voice...") 
              : (inputLanguage === 'bn-BD' ? "বাংলা বা ইংরেজিতে নির্দেশ দিন..." : "Enter command or ask in Bengali / English...")
          }
          className="console-input"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="hud-btn"
          style={{ padding: '8px 14px' }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default CommandConsole;
