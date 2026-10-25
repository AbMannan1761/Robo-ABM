import React, { useState } from 'react';
import { X, Settings, User, Mic, Key, Shield } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, settings, onSaveSettings }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    userName: settings.userName || 'Commander',
    persona: settings.persona || 'jarvis',
    voice: settings.voice || 'jarvis',
    apiKey: settings.apiKey || '',
    provider: settings.provider || 'auto'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="hud-panel w-full max-w-md p-5 border-cyan-400/50 shadow-[0_0_50px_rgba(0,243,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Settings className="w-4 h-4" />
            <span className="font-display text-sm tracking-wider">SYSTEM CONFIGURATION</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Commander Name */}
          <div>
            <label className="flex items-center gap-1.5 text-cyan-300 mb-1.5 font-display text-[11px]">
              <User className="w-3.5 h-3.5" /> COMMANDER CALLSIGN / NAME
            </label>
            <input 
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({...formData, userName: e.target.value})}
              className="w-full bg-black/60 border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              placeholder="e.g. Commander, Tony, Mannan"
            />
          </div>

          {/* AI Persona */}
          <div>
            <label className="flex items-center gap-1.5 text-cyan-300 mb-1.5 font-display text-[11px]">
              <Shield className="w-3.5 h-3.5" /> NEURAL PERSONA
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'jarvis', label: 'JARVIS' },
                { id: 'mentor', label: 'MENTOR' },
                { id: 'cyberpunk', label: 'CYBER' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData({...formData, persona: p.id})}
                  className={`py-1.5 px-2 rounded-lg border text-center font-display text-[10px] transition-all ${
                    formData.persona === p.id 
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.3)]' 
                      : 'border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Model */}
          <div>
            <label className="flex items-center gap-1.5 text-cyan-300 mb-1.5 font-display text-[11px]">
              <Mic className="w-3.5 h-3.5" /> VOICE SYNTHESIS ENGINE
            </label>
            <select
              value={formData.voice}
              onChange={(e) => setFormData({...formData, voice: e.target.value})}
              className="w-full bg-black/80 border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="jarvis">Christopher Neural (Authoritative JARVIS)</option>
              <option value="male">Guy Neural (Natural Male)</option>
              <option value="female">Aria Neural (Clear Female Companion)</option>
              <option value="bengali_male">Pradeep Neural (বাংলা পুরুষ কণ্ঠ)</option>
              <option value="bengali_female">Nabanita Neural (বাংলা নারী কণ্ঠ)</option>
            </select>
          </div>

          {/* External API Key (Optional) */}
          <div>
            <label className="flex items-center gap-1.5 text-cyan-300 mb-1.5 font-display text-[11px]">
              <Key className="w-3.5 h-3.5" /> EXTERNAL LLM API KEY (OPTIONAL)
            </label>
            <input 
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
              className="w-full bg-black/60 border border-cyan-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              placeholder="Leave blank to use Autonomous Local Brain"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">
              Default mode runs autonomously without needing any API credit.
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-cyan-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-white/20 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="hud-btn"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
