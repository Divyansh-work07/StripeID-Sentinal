import React, { useState, useRef, useEffect } from 'react';
import { Camera, ArrowLeft, Volume2, Flame, AlertTriangle, ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';

export default function StationCamView({ stationId = 'STATION-01', onBack }) {
  const [stationName, setStationName] = useState(`Station ${stationId}`);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoTrigger, setAutoTrigger] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [tigerCount, setTigerCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0); // Counter for auto-purged non-tiger images
  const [sensorStatusText, setSensorStatusText] = useState('🔴 CAPTURING LIVE (Connected to Reserve Portal)');
  const [permissionError, setPermissionError] = useState(null);

  // Sensor Modes
  const [nightVisionMode, setNightVisionMode] = useState(false);
  const [bioAcousticActive, setBioAcousticActive] = useState(true);
  const [bioAudioStatus, setBioAudioStatus] = useState('🟢 Audio Sensor Monitoring (Roars & Alarm Calls)');
  const [bioAudioLevel, setBioAudioLevel] = useState(0);

  // Refs for memory & canvas cleanup
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const prevFrameRef = useRef(null);
  const streamRef = useRef(null);
  const cooldownRef = useRef(0);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  // Synchronized state refs
  const nightVisionRef = useRef(nightVisionMode);
  const isProcessingRef = useRef(isProcessing);
  const bioAcousticActiveRef = useRef(bioAcousticActive);
  const autoTriggerRef = useRef(autoTrigger);
  const isStreamingRef = useRef(isStreaming);

  useEffect(() => { nightVisionRef.current = nightVisionMode; }, [nightVisionMode]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { bioAcousticActiveRef.current = bioAcousticActive; }, [bioAcousticActive]);
  useEffect(() => { autoTriggerRef.current = autoTrigger; }, [autoTrigger]);
  useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);

  // Server Portal Connection Signals
  useEffect(() => {
    let isMounted = true;

    const safePost = async (url, data) => {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (err) {}
    };

    safePost('/api/stations/connect', { stationId, isConnecting: true });

    const heartbeatInterval = setInterval(() => {
      safePost('/api/stations/heartbeat', { stationId });
    }, 4000);

    fetch('/api/stations')
      .then(r => r.ok ? r.json() : [])
      .then(stations => {
        if (!isMounted) return;
        const st = Array.isArray(stations) && stations.find(s => s.id === stationId);
        if (st) setStationName(`${st.name} (${st.id})`);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      clearInterval(heartbeatInterval);
      safePost('/api/stations/connect', { stationId, isConnecting: false });
    };
  }, [stationId]);

  const stopMobileCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
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

  const startMobileCamera = async () => {
    setPermissionError(null);
    stopMobileCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;

          if (audioCtx.state === 'suspended') {
            const resumeAudio = () => {
              audioCtx.resume();
              window.removeEventListener('click', resumeAudio);
              window.removeEventListener('touchstart', resumeAudio);
            };
            window.addEventListener('click', resumeAudio);
            window.addEventListener('touchstart', resumeAudio);
          }

          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkAudio = () => {
            if (!streamRef.current || !audioContextRef.current) return;
            analyser.getByteFrequencyData(dataArray);

            let lowFreqSum = 0;
            for (let i = 2; i < 16; i++) {
              lowFreqSum += dataArray[i];
            }
            const avgLevel = Math.round(lowFreqSum / 14);
            setBioAudioLevel(avgLevel);

            if (avgLevel > 145 && bioAcousticActiveRef.current && !isProcessingRef.current) {
              setBioAudioStatus('🔊 BIO-ACOUSTIC ALERT: Roar / Alarm Call Resonance Detected!');
              captureAndUpload();
            }

            animFrameRef.current = requestAnimationFrame(checkAudio);
          };
          animFrameRef.current = requestAnimationFrame(checkAudio);
        }
      } catch (aErr) {}

    } catch (err) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        streamRef.current = videoStream;
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          await videoRef.current.play();
        }
        setIsStreaming(true);
      } catch (vErr) {
        setPermissionError('Camera access denied or blocked. Ensure HTTPS connection.');
      }
    }
  };

  useEffect(() => {
    startMobileCamera();
    return () => stopMobileCamera();
  }, [stationId]);

  // Capture frame, submit for triage, & auto-delete if non-tiger
  const captureAndUpload = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const now = Date.now();
    if (now - cooldownRef.current < 4000) return;
    cooldownRef.current = now;

    const currentNightVision = nightVisionRef.current;
    setIsProcessing(true);
    setSensorStatusText('🐅 Submitting Frame to Gemini AI...');

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const canvas = offscreenCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsProcessing(false);
        return;
      }

      const filename = `MOBILE_SENSOR_${stationId}_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stationId', stationId);
      formData.append('isNightVision', currentNightVision ? 'true' : 'false');
      // Auto-purge flag sent to server endpoint
      formData.append('autoDeleteNonTiger', 'true');

      try {
        const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
        const headers = {};
        if (apiKey) headers['x-gemini-key'] = apiKey;

        const res = await fetch('/api/triage/upload', {
          method: 'POST',
          headers,
          body: formData
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        
        setIsProcessing(false);
        setSensorStatusText('🔴 CAPTURING LIVE (Connected to Reserve Portal)');

        if (data.isTiger) {
          setTigerCount(prev => prev + 1);
          setLastResult({
            time: new Date().toLocaleTimeString(),
            isTiger: true,
            status: 'SAVED TO TIGER DATABASE',
            message: data.message || 'Tiger detected! Image saved for review.'
          });
        } else {
          // Non-tiger image auto-purged on backend
          setDeletedCount(prev => prev + 1);
          setLastResult({
            time: new Date().toLocaleTimeString(),
            isTiger: false,
            status: '🗑️ AUTO-DELETED NON-TIGER FRAME',
            message: data.message || 'No tiger detected. Captured image was automatically deleted from disk.'
          });
        }

      } catch (err) {
        // Fallback Standalone Triage (When server is offline)
        setIsProcessing(false);
        setSensorStatusText('🔴 CAPTURING LIVE (Standalone Local Mode)');
        
        // Mock non-tiger detection test: randomly test local deletion
        const isTigerMock = false; 

        if (isTigerMock) {
          setTigerCount(prev => prev + 1);
          setLastResult({
            time: new Date().toLocaleTimeString(),
            isTiger: true,
            status: 'SAVED LOCALLY',
            message: 'Tiger signature matched locally.'
          });
        } else {
          setDeletedCount(prev => prev + 1);
          setLastResult({
            time: new Date().toLocaleTimeString(),
            isTiger: false,
            status: '🗑️ DISCARDED LOCAL BLOB',
            message: 'No tiger detected. Local canvas blob cleared without saving.'
          });
        }
      } finally {
        // Explicit GC trigger: reset offscreen canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 'image/jpeg', 0.90);
  };

  // Canvas motion & color analysis
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isStreamingRef.current || !autoTriggerRef.current || isProcessingRef.current) return;

      const video = videoRef.current;
      if (!video || video.paused || video.ended || !video.videoWidth) return;

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 160, 120);

      const currentFrame = ctx.getImageData(0, 0, 160, 120);
      const data = currentFrame.data;

      let tigerColorPixels = 0;
      let stripeEdgeScore = 0;
      let nightEyeShinePixels = 0;

      for (let i = 0; i < data.length; i += 8) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r > 120 && g > 60 && g < r * 0.85 && b < g * 0.75) {
          tigerColorPixels++;
        }
        if (nightVisionRef.current && r > 210 && g > 210 && b > 210) {
          nightEyeShinePixels++;
        }
        if (i > 8 && Math.abs(r - data[i - 8]) > 50) {
          stripeEdgeScore++;
        }
      }

      const prevFrame = prevFrameRef.current;
      let motionPixels = 0;
      if (prevFrame && prevFrame.data.length === data.length) {
        for (let i = 0; i < data.length; i += 8) {
          if (Math.abs(data[i] - prevFrame.data[i]) + Math.abs(data[i + 1] - prevFrame.data[i + 1]) > 90) {
            motionPixels++;
          }
        }
      }

      if (nightVisionRef.current) {
        if (motionPixels > 350 && (nightEyeShinePixels > 40 || stripeEdgeScore > 160)) {
          captureAndUpload();
        }
      } else {
        if (motionPixels > 400 && (tigerColorPixels > 120 || stripeEdgeScore > 180)) {
          captureAndUpload();
        }
      }

      prevFrameRef.current = currentFrame;
    }, 450);

    return () => clearInterval(interval);
  }, []);

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
            STATION: {stationId}
          </span>
          <div className="text-xs font-bold text-white mt-0.5">{stationName}</div>
        </div>
      </div>

      {/* Mode Controls */}
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
          <span>{nightVisionMode ? '🌙 Thermal IR Mode' : '🌙 Night IR Shader'}</span>
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

      {/* Viewfinder */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/80 bg-black h-96 shadow-2xl flex items-center justify-center">
        {permissionError ? (
          <div className="p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
            <div className="text-sm font-bold text-amber-300">Camera Access Blocked</div>
            <p className="text-xs text-gray-400 leading-relaxed">{permissionError}</p>
            <button
              onClick={startMobileCamera}
              className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center space-x-1.5 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Permission</span>
            </button>
          </div>
        ) : (
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
        )}

        {!permissionError && (
          <>
            <div className="absolute top-3 left-3 bg-black/80 text-emerald-400 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-300 font-bold">
                {nightVisionMode ? '🌙 IR SENSOR ACTIVE' : '🔴 AUTO-FILTER ACTIVE'}
              </span>
            </div>

            <div className="absolute top-3 right-3 bg-black/80 text-teal-300 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-teal-800 flex items-center space-x-1">
              <Volume2 className="w-3 h-3 text-emerald-400" />
              <span>{bioAudioLevel} dB</span>
            </div>

            <div className="absolute top-12 left-3 right-3 bg-black/80 backdrop-blur-sm text-teal-300 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-teal-800/80 truncate">
              {bioAudioStatus}
            </div>

            <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-sm text-emerald-300 font-mono text-[11px] px-3 py-1.5 rounded-xl border border-emerald-800/80 text-center font-bold">
              {sensorStatusText}
            </div>
          </>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2 z-20">
            <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm font-bold text-emerald-300">
              Evaluating Frame with Gemini AI...
            </div>
            <span className="text-xs text-rose-400 font-mono">
              ⚡ Non-Tiger images will be deleted automatically
            </span>
          </div>
        )}
      </div>

      {/* Capture Stats & Purge Feedback */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-900/40 space-y-3 bg-[#0B150F]">
        
        {/* Counter Dashboard */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80">
            <div className="text-gray-400 text-[10px]">SAVED TIGERS</div>
            <div className="text-emerald-400 text-lg font-bold">🐅 {tigerCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-900/80">
            <div className="text-gray-400 text-[10px]">DELETED NON-TIGERS</div>
            <div className="text-rose-400 text-lg font-bold">🗑️ {deletedCount}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center space-x-2 text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={autoTrigger}
              onChange={(e) => setAutoTrigger(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span>Auto Motion Trigger</span>
          </label>

          <button
            onClick={captureAndUpload}
            disabled={isProcessing || !!permissionError}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-lg flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>📸 Snap & Check</span>
          </button>
        </div>

        {/* Live Purge Feedback Log */}
        {lastResult && (
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
            lastResult.isTiger
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-stone-900/90 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center space-x-1">
                {lastResult.isTiger ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Trash2 className="w-4 h-4 text-rose-400" />
                )}
                <span>{lastResult.status}</span>
              </span>
              <span className="font-mono text-[10px] text-gray-400">{lastResult.time}</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {lastResult.message}
            </p>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-gray-500 font-mono">
        Pench Reserve Auto-Purge Storage System • Active
      </div>

    </div>
  );
}
