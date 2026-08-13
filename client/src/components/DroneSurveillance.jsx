import React, { useState, useEffect } from 'react';
import { Radio, Shield, Zap, Activity, Eye, Navigation, Battery, Signal, Compass, Play, Pause, Flame, Video, Sparkles } from 'lucide-react';

export default function DroneSurveillance({ stations, tigers }) {
  const [activeDrone, setActiveDrone] = useState(1);
  const [isFlying, setIsFlying] = useState(true);
  const [thermalMode, setThermalMode] = useState(true);
  const [latestCapture, setLatestCapture] = useState(null);
  const [droneTelemetry, setDroneTelemetry] = useState({
    altitude: 124,
    speed: 34,
    battery: 88,
    heading: 142,
    lat: 21.6685,
    lng: 79.2890
  });

  // Fetch Latest Ingested Tiger Capture from Backend REST API
  useEffect(() => {
    let mounted = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/captures/latest');
        const data = await res.json();
        if (mounted && data.latestCapture) {
          setLatestCapture(data.latestCapture);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 2500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Telemetry fluctuation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isFlying) {
        setDroneTelemetry(prev => ({
          ...prev,
          altitude: Math.min(180, Math.max(90, prev.altitude + (Math.random() * 6 - 3))),
          speed: Math.min(50, Math.max(20, prev.speed + (Math.random() * 4 - 2))),
          heading: (prev.heading + Math.floor(Math.random() * 5 - 2) + 360) % 360,
          battery: Math.max(15, prev.battery - 0.05)
        }));
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isFlying]);

  const droneDocks = [
    { id: 1, name: 'Surveillance Drone Alpha (Turia Core Sector)', model: 'Matrice 300 RTK Thermal', status: 'PATROLLING', targetBeat: 'Karmajhiri Beat 1', lat: 21.6645, lng: 79.2812 },
    { id: 2, name: 'Surveillance Drone Beta (Khawasa Buffer Sector)', model: 'Mavic 3 Enterprise Thermal', status: 'PATROLLING', targetBeat: 'Buffer Conflict Zone', lat: 21.5890, lng: 79.3520 },
    { id: 3, name: 'Surveillance Drone Gamma (Jamtara Corridor)', model: 'Autel EVO II Dual 640T', status: 'STANDBY_DOCK', targetBeat: 'Jamtara Beat 4', lat: 21.7120, lng: 79.2540 }
  ];

  const activeDoc = droneDocks.find(d => d.id === activeDrone) || droneDocks[0];
  const activeImage = latestCapture?.imageUrl || '/drone_thermal_tiger.png';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-teal-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-teal-400 uppercase tracking-wider">
            <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>Autonomous Aerial Thermal Surveillance System</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Pench Drone Thermal Patrol Console</h2>
          <p className="text-xs text-gray-400 mt-0.5">Real-time FLIR thermal infrared aerial monitoring for nocturnal tiger movements & anti-poaching sweeps</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#0B150F] px-3 py-2 rounded-xl border border-teal-800/40 text-xs font-mono text-teal-300 flex items-center space-x-2">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span>Battery: <strong>{Math.round(droneTelemetry.battery)}%</strong></span>
          </div>

          <button
            onClick={() => setThermalMode(!thermalMode)}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center space-x-2 shadow-lg ${
              thermalMode
                ? 'bg-amber-500 text-black border border-amber-300 animate-pulse'
                : 'bg-teal-700 text-white hover:bg-teal-600'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{thermalMode ? '🌙 FLIR Thermal Mode ON' : 'Standard RGB Camera'}</span>
          </button>
        </div>
      </div>

      {/* Main Drone Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Drone Feed Viewport */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-teal-900/60 bg-[#070F0A] space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-teal-900/50 pb-3 text-xs">
            <div className="flex items-center space-x-2 font-bold text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{activeDoc.name}</span>
            </div>

            <div className="flex items-center space-x-2 font-mono text-[11px]">
              <span className="text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Auto-Syncing Field Captures</span>
              </span>
              <span className="text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                {activeDoc.model}
              </span>
            </div>
          </div>

          {/* Video Feed Frame - Displays Latest Ingested Tiger Capture */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-teal-500/80 bg-black h-96 shadow-2xl flex items-center justify-center">
            
            {/* Live Synchronized Field Capture Photo */}
            <img
              src={activeImage}
              alt="Aerial Drone Thermal Tiger Feed"
              style={{
                filter: thermalMode
                  ? 'contrast(190%) brightness(130%) sepia(100%) hue-rotate(300deg) saturate(300%)'
                  : 'contrast(100%)'
              }}
              className="w-full h-full object-cover transition-all duration-500"
            />

            {/* AI Bounding Box Overlay for Royal Bengal Tiger */}
            <div className="absolute top-[16%] left-[42%] w-[48%] h-[68%] border-2 border-emerald-400 rounded-xl pointer-events-none alert-pulse flex flex-col justify-between p-1.5 z-10 shadow-2xl">
              <div className="bg-emerald-950/95 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-600 w-max shadow-lg flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>🐅 TIGER FLANK & EYE-SHINE: {latestCapture?.confidence ? `${(latestCapture.confidence * 100).toFixed(1)}%` : '98.7%'}</span>
              </div>
              <div className="text-[9px] font-mono text-amber-300 bg-black/90 px-1.5 py-0.5 rounded border border-amber-800/80 w-max">
                {latestCapture?.lat ? `${latestCapture.lat.toFixed(4)}°N, ${latestCapture.lng.toFixed(4)}°E` : `${droneTelemetry.lat.toFixed(4)}°N, ${droneTelemetry.lng.toFixed(4)}°E`} ({latestCapture?.stationId || 'PTR-KOR-01'})
              </div>
            </div>

            {/* Telemetry HUD Overlays */}
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-teal-300 font-mono text-[10px] p-2 rounded-xl border border-teal-800 space-y-1">
              <div>ALT: <strong className="text-white">{Math.round(droneTelemetry.altitude)}m AGL</strong></div>
              <div>SPEED: <strong className="text-white">{Math.round(droneTelemetry.speed)} km/h</strong></div>
              <div>HEADING: <strong className="text-white">{droneTelemetry.heading}° SSE</strong></div>
            </div>

            {/* Live Sync Badge Header */}
            <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-sm text-emerald-300 font-mono text-[10px] px-3 py-1.5 rounded-xl border border-emerald-700 flex items-center space-x-1.5 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE CAPTURE: {latestCapture?.tigerName || 'Raiyyakasa Male (T-30)'} ({latestCapture?.stationId || 'PTR-KOR-01'})</span>
            </div>

            {/* Bottom Target Grid Indicator */}
            <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-sm text-emerald-300 font-mono text-[11px] px-3 py-2 rounded-xl border border-emerald-800/80 flex items-center justify-between">
              <span>Target Grid: {latestCapture?.stationId ? `Station ${latestCapture.stationId}` : activeDoc.targetBeat}</span>
              <span className="text-teal-400 font-bold">Signal: Strong (5G Mesh)</span>
            </div>

          </div>

          {/* Flight Controls Bar */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFlying(!isFlying)}
                className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                  isFlying ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {isFlying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isFlying ? 'Pause Patrol Sweep' : 'Resume Drone Flight'}</span>
              </button>
            </div>

            <div className="text-gray-400 font-mono text-[11px]">
              GPS Lock: <strong className="text-emerald-400">18 Satellites RTK Fixed</strong>
            </div>
          </div>

        </div>

        {/* Drone Fleet List & Telemetry Panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Radio className="w-4 h-4 text-teal-400" />
            <span>Active Reserve Drone Fleet</span>
          </h3>

          <div className="space-y-3">
            {droneDocks.map(dock => {
              const isSelected = dock.id === activeDrone;
              return (
                <div
                  key={dock.id}
                  onClick={() => setActiveDrone(dock.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-teal-950/80 border-teal-500 text-white shadow-xl scale-[1.02]'
                      : 'bg-[#070F0A]/80 border-emerald-900/40 hover:border-emerald-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-300">{dock.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      dock.status === 'PATROLLING'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {dock.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-400 font-mono">{dock.model}</div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-teal-900/30">
                    <span>Target: {dock.targetBeat}</span>
                    <span className="text-teal-400 font-semibold">{isSelected ? '● Stream Active' : 'Switch Stream'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-teal-900/40 text-xs space-y-2">
            <strong className="text-white block font-mono">Live Sync Status:</strong>
            <p className="text-gray-300 text-[11px] leading-relaxed">
              Surveillance Drone Alpha automatically synchronizes with camera trap captures. Whenever a smartphone QR code or live field image is captured, the viewport instantly updates with the new tiger photograph!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
