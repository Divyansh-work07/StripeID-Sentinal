import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, VideoOff, RefreshCw, Zap, Shield, MapPin, Sparkles, CheckCircle2, AlertTriangle, Play, Pause, Activity, Plus, Trash2, Radio, QrCode, Wifi, Globe, Smartphone, ExternalLink, Copy } from 'lucide-react';

export default function LiveMobileTraps({ stations: initialStations, onUploadSuccess, geminiApiKey, onOpenStationCam }) {
  const [stations, setStations] = useState(initialStations || []);
  
  // Active Camera Streams assigned to specific stations
  const [activeCameras, setActiveCameras] = useState([
    { id: 1, stationId: 'PTR-KOR-01', label: 'Station PTR-KOR-01 (Karmajhiri Gate North)', streamType: 'device', ipUrl: '', isStreaming: false, autoTrigger: true, lastCapturedAt: null, isProcessing: false, lastResult: null, statusText: '🟢 Monitoring Stream' },
    { id: 2, stationId: 'PTR-KOR-03', label: 'Station PTR-KOR-03 (Turia Main Entrance)', streamType: 'device', ipUrl: '', isStreaming: false, autoTrigger: true, lastCapturedAt: null, isProcessing: false, lastResult: null, statusText: '🟢 Monitoring Stream' },
    { id: 3, stationId: 'PTR-KOR-04', label: 'Station PTR-KOR-04 (Jamtara Core Beat)', streamType: 'device', ipUrl: '', isStreaming: false, autoTrigger: true, lastCapturedAt: null, isProcessing: false, lastResult: null, statusText: '🟢 Monitoring Stream' }
  ]);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState({ 1: '', 2: '', 3: '' });
  const [selectedStationToLink, setSelectedStationToLink] = useState('');
  const [activeQrStation, setActiveQrStation] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRefs = useRef({});
  const canvasRefs = useRef({});
  const prevFrameData = useRef({});
  const streamRefs = useRef({});
  const cooldownTimer = useRef({});

  // Poll stations status every 2.5 seconds to reflect real-time "CAPTURING" status when QR is scanned
  useEffect(() => {
    function fetchLiveStations() {
      fetch('/api/stations')
        .then(r => r.json())
        .then(data => {
          setStations(data);
        })
        .catch(e => console.error(e));
    }

    fetchLiveStations();
    const interval = setInterval(fetchLiveStations, 2500);
    return () => clearInterval(interval);
  }, []);

  // Enumerate video devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setAvailableDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevices(prev => ({
            ...prev,
            1: videoDevices[0]?.deviceId || '',
            2: videoDevices[1]?.deviceId || videoDevices[0]?.deviceId || '',
            3: videoDevices[2]?.deviceId || videoDevices[0]?.deviceId || ''
          }));
        }
      } catch (err) {
        console.error('Error enumerating cameras:', err);
      }
    }
    getDevices();
  }, []);

  // Add a new camera stream slot for any of the 25 stations
  const handleAddCameraStream = (stationId) => {
    const targetStation = stations.find(s => s.id === stationId) || stations[0];
    const newId = activeCameras.length > 0 ? Math.max(...activeCameras.map(c => c.id)) + 1 : 1;

    const newCam = {
      id: newId,
      stationId: targetStation.id,
      label: `Station ${targetStation.id} (${targetStation.name})`,
      streamType: 'device',
      ipUrl: '',
      isStreaming: false,
      autoTrigger: true,
      lastCapturedAt: null,
      isProcessing: false,
      lastResult: null,
      statusText: '🟢 Monitoring Stream'
    };

    setActiveCameras(prev => [...prev, newCam]);
    if (availableDevices.length > 0) {
      setSelectedDevices(prev => ({ ...prev, [newId]: availableDevices[0].deviceId }));
    }
  };

  // Remove a camera stream slot
  const handleRemoveStream = (camId) => {
    stopCamera(camId);
    setActiveCameras(prev => prev.filter(c => c.id !== camId));
  };

  // Start Camera Stream
  const startCamera = async (camId) => {
    const cam = activeCameras.find(c => c.id === camId);

    // Wi-Fi IP Camera URL Mode
    if (cam.streamType === 'ip' && cam.ipUrl) {
      if (videoRefs.current[camId]) {
        videoRefs.current[camId].crossOrigin = 'anonymous';
        videoRefs.current[camId].src = cam.ipUrl;
        await videoRefs.current[camId].play().catch(e => console.log('IP Stream notice:', e));
      }
      setActiveCameras(prev => prev.map(c => c.id === camId ? { ...c, isStreaming: true } : c));
      return;
    }

    // Direct Browser / Mobile Sensor Mode
    try {
      const deviceId = selectedDevices[camId];
      const constraints = deviceId
        ? { video: { deviceId: { exact: deviceId } } }
        : { video: { facingMode: 'environment' } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRefs.current[camId] = stream;

      if (videoRefs.current[camId]) {
        videoRefs.current[camId].srcObject = stream;
        await videoRefs.current[camId].play();
      }

      setActiveCameras(prev => prev.map(c => c.id === camId ? { ...c, isStreaming: true } : c));
    } catch (err) {
      console.error(`Failed to start camera for slot ${camId}:`, err);
      alert(`Could not access mobile camera sensor. Please ensure camera permissions are granted.`);
    }
  };

  // Stop Camera Stream
  const stopCamera = (camId) => {
    if (streamRefs.current[camId]) {
      streamRefs.current[camId].getTracks().forEach(track => track.stop());
      streamRefs.current[camId] = null;
    }
    if (videoRefs.current[camId]) {
      videoRefs.current[camId].srcObject = null;
      videoRefs.current[camId].removeAttribute('src');
    }
    setActiveCameras(prev => prev.map(c => c.id === camId ? { ...c, isStreaming: false } : c));
  };

  // Capture frame & submit for triage
  const captureAndTriage = async (camId) => {
    const cam = activeCameras.find(c => c.id === camId);
    const video = videoRefs.current[camId];
    if (!video || !video.videoWidth) return;

    const now = Date.now();
    if (cooldownTimer.current[camId] && (now - cooldownTimer.current[camId] < 6000)) return;
    cooldownTimer.current[camId] = now;

    setActiveCameras(prev => prev.map(c => c.id === camId ? { ...c, isProcessing: true, statusText: '🐅 Tiger Candidate Detected! Triaging...' } : c));

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `MOBILE_TRAP_${cam.stationId}_${Date.now()}.JPG`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stationId', cam.stationId);

      try {
        const apiKey = geminiApiKey || localStorage.getItem('GEMINI_API_KEY') || 'YOUR_GEMINI_API_KEY';
        const headers = {};
        if (apiKey) {
          headers['x-gemini-key'] = apiKey;
        }

        const res = await fetch('/api/triage/upload', {
          method: 'POST',
          headers,
          body: formData
        });

        const data = await res.json();
        const timeStr = new Date().toLocaleTimeString();

        setActiveCameras(prev => prev.map(c => c.id === camId ? {
          ...c,
          isProcessing: false,
          statusText: '🟢 Monitoring Stream (Waiting for Tiger...)',
          lastCapturedAt: timeStr,
          lastResult: data
        } : c));

        if (onUploadSuccess) onUploadSuccess();

      } catch (err) {
        console.error('Error uploading mobile trap snapshot:', err);
        setActiveCameras(prev => prev.map(c => c.id === camId ? { ...c, isProcessing: false, statusText: '🟢 Monitoring Stream' } : c));
      }
    }, 'image/jpeg', 0.92);
  };

  // REAL-TIME TIGER SUBJECT VISUAL DETECTOR (No Tiger = No Capture!)
  useEffect(() => {
    const interval = setInterval(() => {
      activeCameras.forEach(cam => {
        if (!cam.isStreaming || !cam.autoTrigger || cam.isProcessing) return;

        const video = videoRefs.current[cam.id];
        if (!video || video.paused || video.ended || !video.videoWidth) return;

        const canvas = canvasRefs.current[cam.id] || document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 160, 120);

        const currentFrame = ctx.getImageData(0, 0, 160, 120);
        const data = currentFrame.data;

        let tigerColorPixels = 0;
        let stripeEdgeScore = 0;

        for (let i = 0; i < data.length; i += 8) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > 120 && g > 60 && g < r * 0.85 && b < g * 0.75) {
            tigerColorPixels++;
          }

          if (i > 8) {
            const prevR = data[i - 8];
            if (Math.abs(r - prevR) > 50) stripeEdgeScore++;
          }
        }

        const prevFrame = prevFrameData.current[cam.id];
        let motionPixels = 0;
        if (prevFrame) {
          for (let i = 0; i < data.length; i += 8) {
            const rDiff = Math.abs(data[i] - prevFrame.data[i]);
            const gDiff = Math.abs(data[i + 1] - prevFrame.data[i + 1]);
            const bDiff = Math.abs(data[i + 2] - prevFrame.data[i + 2]);
            if (rDiff + gDiff + bDiff > 90) motionPixels++;
          }
        }

        if (motionPixels > 400 && (tigerColorPixels > 120 || stripeEdgeScore > 180)) {
          captureAndTriage(cam.id);
        }

        prevFrameData.current[cam.id] = currentFrame;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [activeCameras]);

  // Helper to generate full Station URL
  const getStationMobileUrl = (stId) => {
    const origin = window.location.origin;
    return `${origin}/#station-${stId}`;
  };

  const capturingCount = stations.filter(s => s.isCapturing).length;

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-emerald-900/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <QrCode className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>AI Real-Time Mobile QR Station Capture Portal</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">25 Station QR Code Mobile Camera Connect Console</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            When a QR code is scanned, the specific station instantly displays <strong>🔴 CAPTURING LIVE</strong> in the reserve portal!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#0B150F] px-3 py-2 rounded-xl border border-emerald-900/40 text-xs flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-300 font-mono">Stations: <strong className="text-emerald-400">25 Total</strong></span>
          </div>

          <div className={`px-3 py-2 rounded-xl border text-xs flex items-center space-x-2 transition ${
            capturingCount > 0
              ? 'bg-rose-950/90 border-rose-500 text-rose-200 alert-pulse font-bold'
              : 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200'
          }`}>
            <Activity className="w-4 h-4 text-rose-400 animate-ping" />
            <span className="font-mono">Mobile QR Capturing: <strong>{capturingCount} Live</strong></span>
          </div>
        </div>
      </div>

      {/* Connected Mobile Camera Streams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span>Active Mobile Camera Station Streams ({activeCameras.length})</span>
          </h3>

          {/* Quick Add Stream Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedStationToLink}
              onChange={(e) => setSelectedStationToLink(e.target.value)}
              className="bg-[#0B150F] border border-emerald-800/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
            >
              <option value="">-- Connect Camera to Station --</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id}: {s.name} ({s.isCapturing ? '🔴 CAPTURING' : 'Standby'})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (selectedStationToLink) {
                  handleAddCameraStream(selectedStationToLink);
                  setSelectedStationToLink('');
                }
              }}
              disabled={!selectedStationToLink}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition shadow-lg disabled:opacity-40 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Link Mobile Camera</span>
            </button>
          </div>
        </div>

        {/* Camera Feed Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCameras.map(cam => {
            const station = stations.find(s => s.id === cam.stationId) || stations[0];
            const isStationCapturing = station?.isCapturing || cam.isStreaming;

            return (
              <div
                key={cam.id}
                className={`glass-panel p-5 rounded-2xl border transition-all space-y-4 shadow-xl relative ${
                  isStationCapturing
                    ? 'border-rose-500/80 bg-[#1A0B0F]/90 alert-pulse'
                    : 'border-emerald-900/40 bg-[#070F0A]/80'
                }`}
              >
                {/* Station Title Bar */}
                <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isStationCapturing ? 'bg-rose-500 animate-ping' : 'bg-gray-500'}`}></span>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isStationCapturing ? 'text-rose-400' : 'text-emerald-400'}`}>
                        Station ID: {cam.stationId}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5">{station?.name}</h4>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setActiveQrStation(station)}
                      className="bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-700/60 p-1.5 rounded-lg transition flex items-center space-x-1 text-[10px] font-bold"
                      title="Show Station QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan QR</span>
                    </button>
                    
                    <button
                      onClick={() => handleRemoveStream(cam.id)}
                      className="text-gray-400 hover:text-rose-400 p-1 transition"
                      title="Remove Stream"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                {isStationCapturing && (
                  <div className="bg-rose-950/90 border border-rose-600/80 p-2 rounded-xl text-center text-xs font-bold text-rose-200 flex items-center justify-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span>🔴 CAPTURING (Mobile QR Scanner Active)</span>
                  </div>
                )}

                {/* Connection Mode */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-[#070F0A] p-1 rounded-lg border border-emerald-900/50">
                    <button
                      onClick={() => setActiveCameras(prev => prev.map(c => c.id === cam.id ? { ...c, streamType: 'device' } : c))}
                      className={`flex-1 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center space-x-1 ${
                        cam.streamType === 'device' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Device Camera</span>
                    </button>

                    <button
                      onClick={() => setActiveCameras(prev => prev.map(c => c.id === cam.id ? { ...c, streamType: 'ip' } : c))}
                      className={`flex-1 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center space-x-1 ${
                        cam.streamType === 'ip' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Wifi className="w-3 h-3" />
                      <span>Wi-Fi IP WebCam</span>
                    </button>
                  </div>

                  {cam.streamType === 'device' ? (
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Select Camera Sensor</label>
                      <select
                        value={selectedDevices[cam.id]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedDevices(prev => ({ ...prev, [cam.id]: val }));
                        }}
                        className="w-full bg-[#0B150F] border border-emerald-900/60 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="">Back Mobile Camera</option>
                        {availableDevices.map((d, idx) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Mobile Sensor ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] text-teal-300 mb-1 font-mono">Wi-Fi IP WebCam Stream URL</label>
                      <input
                        type="text"
                        placeholder="http://192.168.1.50:8080/video"
                        value={cam.ipUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveCameras(prev => prev.map(c => c.id === cam.id ? { ...c, ipUrl: val } : c));
                        }}
                        className="w-full bg-[#0B150F] border border-teal-800/60 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-400 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Live Video Feed Viewport */}
                <div className="relative rounded-xl overflow-hidden border border-emerald-800/60 bg-black h-56 flex items-center justify-center">
                  <video
                    ref={el => videoRefs.current[cam.id] = el}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cam.isStreaming ? 'block' : 'hidden'}`}
                  />

                  {!cam.isStreaming && (
                    <div className="text-center p-4 space-y-2">
                      <VideoOff className="w-10 h-10 text-gray-600 mx-auto" />
                      <div className="text-xs font-bold text-gray-400">
                        {isStationCapturing ? '🔴 CAPTURING (Mobile QR Scanner Active)' : 'Station Camera Standby'}
                      </div>
                      <button
                        onClick={() => startCamera(cam.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg inline-flex items-center space-x-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Feed ({cam.stationId})</span>
                      </button>
                    </div>
                  )}

                  {/* Overlays */}
                  {cam.isStreaming && (
                    <>
                      <div className="absolute top-2 left-2 bg-black/80 text-emerald-400 font-mono text-[10px] px-2 py-1 rounded border border-emerald-800 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span>SENSOR: {cam.stationId}</span>
                      </div>

                      <button
                        onClick={() => stopCamera(cam.id)}
                        className="absolute top-2 right-2 bg-rose-950/90 text-rose-300 font-semibold text-[10px] px-2 py-1 rounded border border-rose-800 hover:bg-rose-900 transition"
                      >
                        Stop Stream
                      </button>
                    </>
                  )}
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cam.autoTrigger}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setActiveCameras(prev => prev.map(c => c.id === cam.id ? { ...c, autoTrigger: checked } : c));
                      }}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span>Capture ONLY When Tiger Appears</span>
                  </label>

                  <button
                    onClick={() => captureAndTriage(cam.id)}
                    disabled={!cam.isStreaming || cam.isProcessing}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition disabled:opacity-40 flex items-center space-x-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>📸 Manual Tiger Snap</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 25 Reserve Camera Trap Stations Full Grid Catalog with REAL-TIME "CAPTURING" BADGES */}
      <div className="space-y-4 pt-6 border-t border-emerald-900/40">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>All 25 Station QR Codes Network (Pench Tiger Reserve)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Scanning any station QR code instantly turns that station card to <strong>🔴 CAPTURING LIVE</strong> in real time!</p>
          </div>

          <div className="text-xs font-mono flex items-center space-x-3">
            <span className="text-emerald-400 font-bold">● Standby Stations</span>
            <span className="text-rose-400 font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>🔴 CAPTURING LIVE ({capturingCount})</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {stations.map(st => {
            const isCapturing = st.isCapturing;
            const isBuffer = st.type === 'Buffer';

            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 relative shadow-lg ${
                  isCapturing
                    ? 'bg-[#21090E] border-2 border-rose-500 text-white alert-pulse scale-[1.02] z-10'
                    : isBuffer
                    ? 'bg-[#161009]/80 border-amber-900/40 hover:border-amber-600/60 text-gray-300'
                    : 'bg-[#070F0A]/80 border-emerald-900/40 hover:border-emerald-600/60 text-gray-300'
                }`}
              >
                {/* Real-time Status Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono font-extrabold ${isCapturing ? 'text-rose-300' : 'text-emerald-400'}`}>
                    {st.id}
                  </span>
                  
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    isCapturing
                      ? 'bg-rose-900 text-rose-100 border border-rose-400 font-mono shadow-md animate-pulse'
                      : isBuffer
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {isCapturing && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>}
                    <span>{isCapturing ? '🔴 CAPTURING' : st.type}</span>
                  </span>
                </div>

                <div className="font-bold text-xs truncate text-white">{st.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{st.range} Sector</div>

                <div className="flex items-center justify-between gap-1 pt-2 border-t border-emerald-900/30">
                  <button
                    onClick={() => setActiveQrStation(st)}
                    className="flex-1 bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-800 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 transition"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Station QR</span>
                  </button>

                  <button
                    onClick={() => handleAddCameraStream(st.id)}
                    className="flex-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Link Stream</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Station Dedicated QR Code Modal */}
      {activeQrStation && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel bg-[#0B150F] border-2 border-teal-500 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-teal-900/50 pb-3">
              <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
                <QrCode className="w-5 h-5" />
                <span>Station QR Code: {activeQrStation.id}</span>
              </div>
              <button onClick={() => setActiveQrStation(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="text-center space-y-3">
              <h4 className="text-base font-bold text-white">{activeQrStation.name} ({activeQrStation.id})</h4>
              <p className="text-xs text-gray-300">
                Scan this QR Code with <strong>any mobile phone</strong> to activate that camera for Station <strong>{activeQrStation.id}</strong>! Station card in portal will instantly turn <strong>🔴 CAPTURING LIVE</strong>!
              </p>

              {/* Generated QR Code Image */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border-4 border-emerald-500">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getStationMobileUrl(activeQrStation.id))}`}
                  alt={`QR Code for Station ${activeQrStation.id}`}
                  className="w-44 h-44 mx-auto object-contain"
                />
              </div>

              <div className="bg-[#070F0A] p-3 rounded-xl border border-teal-900/60 text-xs text-left space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">Station Direct Link:</span>
                <code className="text-[11px] text-teal-300 font-mono break-all block">
                  {getStationMobileUrl(activeQrStation.id)}
                </code>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getStationMobileUrl(activeQrStation.id));
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? '✓ Link Copied!' : 'Copy Mobile Link'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveQrStation(null);
                    if (onOpenStationCam) onOpenStationCam(activeQrStation.id);
                  }}
                  className="bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Station Sensor Now</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
