import React from 'react';
import { Cpu, HardDrive, Battery, Activity, Globe, Music, FileText } from 'lucide-react';

const SystemHUD = ({ metrics = {}, onQuickAction }) => {
  const cpu = metrics.cpu_percent || 0;
  const ram = metrics.memory_percent || 0;
  const battery = metrics.battery;
  const disk = metrics.disk_percent || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 2x2 Telemetry Gauge Grid */}
      <div className="telemetry-grid">
        {/* CPU */}
        <div className="gauge-card">
          <div className="gauge-title">
            <Cpu className="w-3.5 h-3.5" /> CPU LOAD
          </div>
          <div className="gauge-value">{cpu}%</div>
          <div className="gauge-bar">
            <div 
              className="gauge-fill" 
              style={{ width: `${Math.min(cpu, 100)}%`, background: 'linear-gradient(90deg, #00f3ff, #10b981)' }} 
            />
          </div>
        </div>

        {/* RAM */}
        <div className="gauge-card">
          <div className="gauge-title">
            <Activity className="w-3.5 h-3.5" /> RAM USAGE
          </div>
          <div className="gauge-value">{ram}%</div>
          <div className="gauge-bar">
            <div 
              className="gauge-fill" 
              style={{ width: `${Math.min(ram, 100)}%`, background: 'linear-gradient(90deg, #00f3ff, #a855f7)' }} 
            />
          </div>
        </div>

        {/* DISK */}
        <div className="gauge-card">
          <div className="gauge-title">
            <HardDrive className="w-3.5 h-3.5" /> DRIVE C:
          </div>
          <div className="gauge-value">{disk}%</div>
          <div className="gauge-bar">
            <div 
              className="gauge-fill" 
              style={{ width: `${Math.min(disk, 100)}%`, background: '#00f3ff' }} 
            />
          </div>
        </div>

        {/* POWER */}
        <div className="gauge-card">
          <div className="gauge-title">
            <Battery className="w-3.5 h-3.5" /> POWER
          </div>
          <div className="gauge-value">{battery ? `${battery.percent}%` : 'AC MAINS'}</div>
          <div className="gauge-bar">
            <div 
              className="gauge-fill" 
              style={{ width: `${battery ? battery.percent : 100}%`, background: '#10b981' }} 
            />
          </div>
        </div>
      </div>

      {/* Tactical Shortcut Buttons */}
      <div className="hud-panel" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: '#00f3ff', letterSpacing: '0.1em' }}>
            TACTICAL DISPATCH
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
            WINDOWS OS
          </span>
        </div>
        <div className="tactical-grid">
          <button 
            onClick={() => onQuickAction("open chrome")}
            className="hud-btn"
            style={{ justifyContent: 'center', fontSize: '10px', padding: '7px 10px' }}
          >
            <Globe className="w-3.5 h-3.5" /> Browser
          </button>
          <button 
            onClick={() => onQuickAction("open spotify")}
            className="hud-btn"
            style={{ justifyContent: 'center', fontSize: '10px', padding: '7px 10px' }}
          >
            <Music className="w-3.5 h-3.5" /> Spotify
          </button>
          <button 
            onClick={() => onQuickAction("open notepad")}
            className="hud-btn"
            style={{ justifyContent: 'center', fontSize: '10px', padding: '7px 10px' }}
          >
            <FileText className="w-3.5 h-3.5" /> Notepad
          </button>
          <button 
            onClick={() => onQuickAction("system status")}
            className="hud-btn"
            style={{ justifyContent: 'center', fontSize: '10px', padding: '7px 10px' }}
          >
            <Activity className="w-3.5 h-3.5" /> Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemHUD;
