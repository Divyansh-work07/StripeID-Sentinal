import React, { useState, useRef, useEffect } from 'react';
import { Camera, ArrowLeft, Volume2, Flame, AlertTriangle, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';

export default function StationCamView({ stationId = 'STATION-01', onBack }) {
  // =========================================================================
  // 1. CORE STATE & REFS (REQUIRED)
  // =========================================================================
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [captures, setCaptures] = useState([]); // List of captured images for manual deletion

  const videoRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const cooldownRef = useRef(0);

  // =========================================================================
  // 2. OPTIONAL FEATURE STATES (DELETE IF NOT NEEDED)
  // =========================================================================
  // [OPTIONAL: NIGHT VISION]
  const [nightVisionMode, setNightVisionMode] = useState(false);
  const nightVisionRef = useRef(nightVisionMode);
  useEffect(() => { nightVisionRef.current = nightVisionMode; }, [nightVisionMode]);

  // [OPTIONAL: BIO-ACOUSTIC AUDIO]
  const [bioAcousticActive, setBioAcousticActive] = useState(true);
  const [bioAudioLevel, setBioAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  // [OPTIONAL: AUTO MOTION TRIGGER]
  const [autoTrigger, setAutoTrigger] = useState(true);
  const canvasRef = useRef(null);
  const prevFrameRef = useRef(null);

  // =========================================================================
  // 3. CAMERA SETUP & SHUTDOWN (REQUIRED)
  // =========================================================================
  const stopCamera = () => {
    // Stop Audio Loop
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    // Stop Video Stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
  };

  const startCamera = async () => {
    setPermissionError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);

      // ---------------------------------------------------------------------
      // [OPTIONAL FEATURE: AUDIO ANALYZER] - Delete block if audio not needed
      // ---------------------------------------------------------------------
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const analyzeAudio = () => {
            if (!streamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < 10; i++) sum += dataArray[i];
            setBioAudioLevel(Math.round(sum / 10));
            animFrameRef.current = requestAnimationFrame(analyzeAudio);
          };
          animFrameRef.current = requestAnimationFrame(analyzeAudio);
        }
      } catch (err) {}
      // ---------------------------------------------------------------------

    } catch (err) {
      setPermissionError('Camera access failed. Verify browser camera permissions.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [stationId]);

  // =========================================================================
  // 4. IMAGE CAPTURE & MANUALLY MANAGED CAPTURES (REQUIRED)
  // =========================================================================
  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const now = Date.now();
    if (now - cooldownRef.current < 2000) return;
    cooldownRef.current = now;

    setIsProcessing(true);

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

      const imageUrl = URL.createObjectURL(blob);
      const newCapture = {
        id: Date.now(),
        url: imageUrl,
        time: new Date().toLocaleTimeString(),
        stationId,
        isTiger: Math.random() > 0.5 // Simulated classifier or server result
      };

      // Store in state so user can review/delete manually
      setCaptures(prev => [newCapture, ...prev]);
      setIsProcessing(false);
    }, 'image/jpeg', 0.85);
  };

  // Manual Delete Function: Single Image
  const handleDeleteCapture = (id) => {
    setCaptures(prev => prev.filter(item => item.id !== id));
  };

  // Manual Delete Function: Delete All Non-Tigers
  const handlePurgeNonTigers = () => {
    setCaptures(prev => prev.filter(item => item.isTiger));
  };

  // =========================================================================
  // 5. [OPTIONAL FEATURE: AUTOMATIC MOTION TRIGGER] - Delete block if not needed
  // =========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isStreaming || !autoTrigger || isProcessing) return;
      const video = videoRef.current;
      if (!video || video.paused || !video.videoWidth) return;

      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      const canvas = canvasRef.current;
      canvas.width = 80;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 80, 60);

      const currentFrame = ctx.getImageData(0, 0, 80, 60);
      const data = currentFrame.data;
      const prevFrame = prevFrameRef.current;

      let motionScore = 0;
      if (prevFrame && prevFrame.data.length === data.length) {
        for (let i = 0; i < data.length; i += 16) {
          if (Math.abs(data[i] - prevFrame.data[i]) > 60) motionScore++;
        }
      }

      if (motionScore > 80) {
        captureFrame();
      }

      prevFrameRef.current = currentFrame;
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming, autoTrigger, isProcessing]);
  // =========================================================================

  return (
    <div className="min-h-screen bg-[#070F0A] text-white p-4 max-w-md mx-auto space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
        <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center space-x-1 text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>
        <div className="text-xs font-bold text-emerald-400">STATION: {stationId}</div>
      </div>

      {/* [OPTIONAL TOOLBAR] - Delete buttons here if features are removed */}
      <div className="flex gap-2 text-xs">
        {/* [OPTIONAL NIGHT VISION BUTTON] */}
        <button
          onClick={() => setNightVisionMode(!nightVisionMode)}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center space-x-1 border ${
            nightVisionMode ? 'bg-amber-500 text-black' : 'bg-black text-gray-300 border-emerald-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Thermal IR</span>
        </button>

        {/* [OPTIONAL AUDIO SENSOR BUTTON] */}
        <button
          onClick={() => setBioAcousticActive(!bioAcousticActive)}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center space-x-1 border ${
            bioAcousticActive ? 'bg-teal-600 text-white' : 'bg-black text-gray-400 border-emerald-900'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Audio ({bioAudioLevel}dB)</span>
        </button>
      </div>

      {/* Video Viewfinder */}
      <div className="relative rounded-xl overflow-hidden border border-emerald-500/80 bg-black h-72 flex items-center justify-center">
        {permissionError ? (
          <div className="p-4 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-xs text-gray-300">{permissionError}</p>
            <button onClick={startCamera} className="bg-emerald-600 text-xs px-3 py-1.5 rounded font-bold">
              Retry Camera
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              filter: nightVisionMode
                ? 'contrast(200%) brightness(140%) sepia(100%) hue-rotate(300deg)'
                : 'none'
            }}
            className="w-full h-full object-cover"
          />
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-xs text-emerald-400">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-1"></div>
            <span>Capturing...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-[#0B150F] p-3 rounded-xl border border-emerald-900/50 text-xs">
        {/* [OPTIONAL AUTO MOTION CHECKBOX] */}
        <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={autoTrigger}
            onChange={(e) => setAutoTrigger(e.target.checked)}
            className="rounded accent-emerald-500"
          />
          <span>Auto Motion</span>
        </label>

        <button
          onClick={captureFrame}
          disabled={isProcessing}
          className="bg-emerald-500 text-black font-bold px-4 py-2 rounded-lg flex items-center space-x-1"
        >
          <Camera className="w-4 h-4" />
          <span>Snap Frame</span>
        </button>
      </div>

      {/* MANUAL DELETE GALLERY */}
      <div className="space-y-2 bg-[#0B150F] p-3 rounded-xl border border-emerald-900/50">
        <div className="flex items-center justify-between text-xs font-bold border-b border-emerald-900/50 pb-2">
          <span>Captured Frames ({captures.length})</span>
          {captures.length > 0 && (
            <button
              onClick={handlePurgeNonTigers}
              className="text-rose-400 hover:text-rose-300 flex items-center space-x-1 text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Purge Non-Tigers</span>
            </button>
          )}
        </div>

        {captures.length === 0 ? (
          <div className="text-center text-xs text-gray-500 py-4">No captured frames yet.</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {captures.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-black/60 p-2 rounded-lg border border-emerald-900/30 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <img src={item.url} alt="capture" className="w-10 h-10 object-cover rounded" />
                  <div>
                    <div className="font-bold flex items-center space-x-1">
                      <span>{item.isTiger ? '🐅 Tiger' : '🌿 Non-Tiger'}</span>
                    </div>
                    <div className="text-[10px] text-gray-400">{item.time}</div>
                  </div>
                </div>

                {/* MANUAL DELETE BUTTON FOR INDIVIDUAL IMAGE */}
                <button
                  onClick={() => handleDeleteCapture(item.id)}
                  className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 transition"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
