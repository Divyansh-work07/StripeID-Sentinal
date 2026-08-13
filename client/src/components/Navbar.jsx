import React, { useState } from 'react';
import { Shield, Eye, Camera, AlertTriangle, FileText, Map, Sparkles, HardDrive, Clock, Key, CheckCircle2, Cpu, Video, Radio } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, alertCount, pendingReviewsCount, triageMetrics, geminiApiKey, setGeminiApiKey }) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiApiKey || '');
  const [testingStatus, setTestingStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    if (!cleanKey) {
      setGeminiApiKey('');
      localStorage.removeItem('GEMINI_API_KEY');
      setShowKeyModal(false);
      return;
    }

    setTestingStatus('Verifying Gemini API Key with Google API...');
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanKey })
      });
      const data = await res.json();
      setTestingStatus(null);

      if (data.success) {
        setGeminiApiKey(cleanKey);
        localStorage.setItem('GEMINI_API_KEY', cleanKey);
        setTestResult({ success: true, message: data.message });
        setTimeout(() => setShowKeyModal(false), 2000);
      } else {
        setTestResult({ success: false, message: data.message || 'API Key verification failed.' });
      }
    } catch (err) {
      console.error(err);
      setTestingStatus(null);
      setTestResult({ success: false, message: 'Could not connect to backend server.' });
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-emerald-900/40 bg-[#080D09]/90">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Reserve Title & Government Branding */}
          <div className="flex items-center space-x-3.5 w-full lg:w-auto">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 p-0.5 shadow-xl shadow-emerald-950/80">
              <div className="w-full h-full bg-[#0B150F] rounded-[10px] flex items-center justify-center overflow-hidden">
                <img src="/stripeid_sentinel_logo.jpg" alt="StripeID Sentinel Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-wide text-white uppercase font-sans">
                  StripeID <span className="text-emerald-400">Sentinel</span>
                </h1>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  Pench Reserve
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                Automated Camera Trap Triage & Tiger Movement Intelligence System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-[#0B150F] p-1.5 rounded-2xl border border-emerald-900/40 text-xs font-semibold">
            
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'map'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>GIS Territory Map</span>
            </button>

            <button
              onClick={() => setActiveTab('mobile-traps')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'mobile-traps'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span>📹 Field Stations (25 Total)</span>
            </button>

            <button
              onClick={() => setActiveTab('drone')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'drone'
                  ? 'bg-teal-500 text-black font-extrabold shadow-lg shadow-teal-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              <Radio className="w-4 h-4 text-teal-300" />
              <span>🚁 Drone Aerial Patrol</span>
            </button>

            <button
              onClick={() => setActiveTab('triage')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'triage'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>AI Triage Wizard</span>
              {triageMetrics && (
                <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-mono border border-emerald-800">
                  {triageMetrics.aiBlankReductionRate}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('stripe')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'stripe'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>StripeID Matcher</span>
              {pendingReviewsCount > 0 && (
                <span className="bg-amber-400 text-black text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                  {pendingReviewsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'alerts'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Alert Center</span>
              {alertCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-ping">
                  {alertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                activeTab === 'export'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>NTCA Report</span>
            </button>

          </nav>

          {/* Right Action Tools: Gemini API Key Config */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowKeyModal(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                geminiApiKey
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>{geminiApiKey ? '🔑 Gemini API Active' : '🔑 Set Gemini API Key'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel bg-[#0B150F] border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Key className="w-5 h-5" />
                <span>Configure Google Gemini API Key</span>
              </div>
              <button onClick={() => setShowKeyModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Enter your <strong>Google Gemini API Key</strong> to enable multimodal computer vision tiger classification & AI report generation.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="Enter your Gemini API key..."
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  className="w-full bg-[#070F0A] border border-emerald-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              {testingStatus && (
                <div className="text-xs text-amber-300 flex items-center space-x-2 font-mono">
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>{testingStatus}</span>
                </div>
              )}

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs font-mono ${
                  testResult.success ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'
                }`}>
                  {testResult.message}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-5 py-2 rounded-xl transition shadow-lg"
                >
                  Save & Verify Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </header>
  );
}
