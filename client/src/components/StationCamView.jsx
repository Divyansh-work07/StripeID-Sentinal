import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Shield, CheckCircle2, AlertTriangle, Activity, RefreshCw, Zap, ArrowLeft, Eye, Volume2, Moon, Sun, Flame } from 'lucide-react';

export default function StationCamView({ stationId, onBack }) {
  const [stationName, setStationName] = useState(stationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoTrigger, setAutoTrigger] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [sensorStatusText, setSensorStatusText] = useState('🔴 CAPTURING LIVE (Connected to Reserve Portal)');
  
  // Night Vision & Audio Sensors
  const [nightVisionMode, setNightVisionMode] = useState(false); // 🌙 Thermal / IR Shader
  const [bioAcousticActive, setBioAcousticActive] = useState(true); // 🔊 Audio Roar Sensor
  const [bioAudioStatus, setBioAudioStatus] = useState('🟢 Audio Sensor Monitoring (Roars & Alarm Calls)');
  const [bioAudioLevel, setBioAudioLevel] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const prevFrameRef = useRef(null);
  const streamRef = useRef(null);
  const cooldownRef = useRef(0);
  const audioContextRef = useRef(null);

  // Connection Signal to Main Server Portal
  useEffect(() => {
    fetch('/api/stations/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationId, isConnecting: true })
    }).catch(e => console.error('Connect signal error:', e));

    const heartbeatInterval = setInterval(() => {
      fetch('/api/stations/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId })
      }).catch(e => console.error('Heartbeat error:', e));
    }, 4000);

    return () => {
      clearInterval(heartbeatInterval);
      fetch('/api/stations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, isConnecting: false })
      }).catch(e => console.error(e));
    };
  }, [stationId]);

  // Fetch station details
  useEffect(() => {
    fetch('/api/stations')
      .then(r => r.json())
      .then(stations => {
        const st = stations.find(s => s.id === stationId);
        if (st) setStationName(`${st.name} (${st.id})`);
      })
      .catch(e => console.error(e));
  }, [stationId]);

  // Start mobile camera & Bio-Acoustic microphone analyzer
  const startMobileCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);

      // Bio-Acoustic Microphone Frequency Analyzer
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudio = () => {
          if (!streamRef.current) return;
          analyser.getByteFrequencyData(dataArray);

          let lowFreqSum = 0;
          for (let i = 2; i < 16; i++) {
            lowFreqSum += dataArray[i];
          }
          const avgLevel = Math.round(lowFreqSum / 14);
          setBioAudioLevel(avgLevel);

          if (avgLevel > 145 && bioAcousticActive) {
            setBioAudioStatus('🔊 BIO-ACOUSTIC ALERT: Tiger Roar / Alarm Call Resonance Detected!');
            captureAndUpload();
          }

          requestAnimationFrame(checkAudio);
        };
        checkAudio();
      } catch (aErr) {
        console.error('Audio analyzer init:', aErr);
      }

    } catch (err) {
      console.error('Camera activation error:', err);
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = videoStream;
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          await videoRef.current.play();
        }
        setIsStreaming(true);
      } catch (vErr) {
        alert('Please grant camera permissions to activate this station sensor.');
      }
    }
  };

  const stopMobileCamera = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    startMobileCamera();
    return () => stopMobileCamera();
  }, [stationId]);

  // Capture frame & upload to server with Night Vision aware Gemini AI Vision Classifier
  const captureAndUpload = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const now = Date.now();
    if (now - cooldownRef.current < 6000) return;
    cooldownRef.current = now;

    setIsProcessing(true);
    setSensorStatusText(
      nightVisionMode
        ? '🌙 Night Vision Tiger Candidate Detected! Submitting IR Frame to Gemini AI...'
        : '🐅 Tiger Candidate Detected! Submitting Frame to Gemini AI...'
    );

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `MOBILE_SENSOR_${stationId}_${Date.now()}.JPG`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stationId', stationId);
      formData.append('isNightVision', nightVisionMode ? 'true' : 'false');

      try {
        const apiKey = localStorage.getItem('GEMINI_API_KEY') || 'YOUR_GEMINI_API_KEY';
        const headers = {};
        if (apiKey) headers['x-gemini-key'] = apiKey;

        const res = await fetch('/api/triage/upload', {
          method: 'POST',
          headers,
          body: formData
        });
        const data = await res.json();
        setIsProcessing(false);
        setSensorStatusText('🔴 CAPTURING LIVE (Connected to Reserve Portal)');

        if (data.isTiger) {
          setCaptureCount(prev => prev + 1);
        }

        setLastResult({
          time: new Date().toLocaleTimeString(),
          ...data
        });
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
        setSensorStatusText('🔴 CAPTURING LIVE (Connected to Reserve Portal)');
      }
    }, 'image/jpeg', 0.92);
  };

  // REAL-TIME TIGER SUBJECT VISUAL DETECTOR (Daytime Color OR Night-Vision Thermal IR Eye-Shine / Silhouette)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isStreaming || !autoTrigger || isProcessing) return;

      const video = videoRef.current;
      if (!video || video.paused || video.ended || !video.videoWidth) return;

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 160, 120);

      const currentFrame = ctx.getImageData(0, 0, 160, 120);
      const data = currentFrame.data;

      let tigerColorPixels = 0;
      let stripeEdgeScore = 0;
      let nightEyeShinePixels = 0; // High intensity eye-shine points in night mode

      for (let i = 0; i < data.length; i += 8) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 1. Daytime Tiger Orange/Gold Filter
        if (r > 120 && g > 60 && g < r * 0.85 && b < g * 0.75) {
          tigerColorPixels++;
        }

        // 2. Night Vision Eye-Shine & High Thermal Contrast Filter
        if (nightVisionMode) {
          if (r > 210 && g > 210 && b > 210) {
            nightEyeShinePixels++;
          }
        }

        // 3. Flank Stripe Edge Contrast Detection
        if (i > 8) {
          const prevR = data[i - 8];
          if (Math.abs(r - prevR) > 50) stripeEdgeScore++;
        }
      }

      const prevFrame = prevFrameRef.current;
      let motionPixels = 0;
      if (prevFrame) {
        for (let i = 0; i < data.length; i += 8) {
          const rDiff = Math.abs(data[i] - prevFrame.data[i]);
          const gDiff = Math.abs(data[i + 1] - prevFrame.data[i + 1]);
          const bDiff = Math.abs(data[i + 2] - prevFrame.data[i + 2]);
          if (rDiff + gDiff + bDiff > 90) motionPixels++;
        }
      }

      // NIGHT VISION TRIGGER: Triggers on Night Eye-Shine / Thermal Contrast / Flank Stripes in Darkness!
      if (nightVisionMode) {
        if (motionPixels > 350 && (nightEyeShinePixels > 40 || stripeEdgeScore > 160)) {
          captureAndUpload();
        }
      } else {
        // DAYTIME TRIGGER: Triggers on Tawny Orange / Stripe Pattern!
        if (motionPixels > 400 && (tigerColorPixels > 120 || stripeEdgeScore > 180)) {
          captureAndUpload();
        }
      }

      prevFrameRef.current = currentFrame;
    }, 450);

    return () => clearInterval(interval);
  }, [isStreaming, autoTrigger, isProcessing, nightVisionMode]);

  return (
    <div className="min-h-screen bg-[#070F0A] text-white p-4 max-w-md mx-auto flex flex-col justify-between space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
        <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center space-x-1 text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Sensor</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            STATION SENSOR: {stationId}
          </span>
          <div className="text-xs font-bold text-white mt-0.5">{stationName}</div>
        </div>
      </div>

      {/* Toolbar Options: Thermal Shader & Bio-Acoustic Sensor */}
      <div className="flex items-center justify-between gap-2 bg-[#0B150F] p-2 rounded-xl border border-emerald-900/50 text-xs">
        <button
          onClick={() => setNightVisionMode(!nightVisionMode)}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
            nightVisionMode
              ? 'bg-amber-500 text-black shadow-lg animate-pulse'
              : 'bg-[#070F0A] text-gray-300 border border-emerald-900/60 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{nightVisionMode ? '🌙 Thermal IR Mode ON' : '🌙 Night Thermal IR Shader'}</span>
        </button>

        <button
          onClick={() => setBioAcousticActive(!bioAcousticActive)}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
            bioAcousticActive
              ? 'bg-teal-600 text-white'
              : 'bg-[#070F0A] text-gray-400 border border-emerald-900/60'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>🔊 Roar Audio Sensor</span>
        </button>
      </div>

      {/* Live Camera Viewfinder with Night Vision Thermal IR Shader Overlay */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/80 bg-black h-96 shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            filter: nightVisionMode
              ? 'contrast(200%) brightness(140%) sepia(100%) hue-rotate(300deg) saturate(300%)'
              : 'none'
          }}
          className="w-full h-full object-cover"
        />

        {/* Live HUD Badges */}
        <div className="absolute top-3 left-3 bg-black/80 text-emerald-400 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-rose-300 font-bold">
            {nightVisionMode ? '🌙 NIGHT VISION IR ACTIVE' : '🔴 CAPTURING LIVE TO PORTAL'}
          </span>
        </div>

        <div className="absolute top-3 right-3 bg-black/80 text-teal-300 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-teal-800 flex items-center space-x-1">
          <Volume2 className="w-3 h-3 text-emerald-400" />
          <span>Audio: {bioAudioLevel} dB</span>
        </div>

        {/* Bio-Acoustic Status Banner */}
        <div className="absolute top-12 left-3 right-3 bg-black/80 backdrop-blur-sm text-teal-300 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-teal-800/80 truncate">
          {bioAudioStatus}
        </div>

        {/* Live Status Text Banner */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-sm text-emerald-300 font-mono text-[11px] px-3 py-1.5 rounded-xl border border-emerald-800/80 text-center font-bold">
          {sensorStatusText}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2 z-20">
            <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm font-bold text-emerald-300">
              {nightVisionMode ? 'Gemini AI Night-Vision IR Classifier Active...' : 'Gemini AI Vision Triaging Tiger...'}
            </div>
            <span className="text-xs text-gray-400">Verifying nocturnal eye-shine & thermal stripe signature</span>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-900/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center space-x-2 text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={autoTrigger}
              onChange={(e) => setAutoTrigger(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span>Auto Capture ONLY When Tiger Appears</span>
          </label>

          <button
            onClick={captureAndUpload}
            disabled={isProcessing}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-lg flex items-center space-x-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>📸 Manual Tiger Snap</span>
          </button>
        </div>

        {/* Last Triage Result */}
        {lastResult && (
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
            lastResult.isTiger
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 alert-pulse'
              : 'bg-rose-950/90 border-rose-600 text-rose-200'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span>{lastResult.isTiger ? '🐅 TIGER DETECTED & MAPPED!' : '❌ Non-Subject / Foliage Quarantined'}</span>
              <span className="font-mono text-[10px]">{lastResult.time}</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              {lastResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[10px] text-gray-500 font-mono">
        Pench Tiger Reserve AI Night-Vision & Bio-Acoustic Sensor • Station {stationId}
      </div>

    </div>
  );
}
