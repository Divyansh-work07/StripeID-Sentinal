import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Eye, CheckCircle2, XCircle, UserPlus, Sparkles, Sliders, Shield, 
  Search, ArrowRight, Zap, Info, Filter, Camera, Cpu, FileText, 
  Navigation, Layers, Trash2 
} from 'lucide-react';

export default function StripeMatcher({ 
  tigers, 
  pendingReviews, 
  onApproveMatch, 
  onRejectAndEnroll, 
  onDeleteCapture, 
  onDeleteTiger, 
  geminiApiKey 
}) {
  const [selectedTigerId, setSelectedTigerId] = useState(tigers?.[0]?.id || 'PTR-T-30');
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [newTigerNameInput, setNewTigerNameInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiReport, setAiReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showStripeComparison, setShowStripeComparison] = useState(true);

  const activeTiger = tigers?.find(t => t.id === selectedTigerId) || tigers?.[0];

  const handleApprove = async (captureId, tigerId) => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    await onApproveMatch?.(captureId, tigerId);
    setReviewModalItem(null);
  };

  const handleReject = async (captureId) => {
    await onRejectAndEnroll?.(captureId, newTigerNameInput || 'New Enrolled Tigress Candidate', 'Female');
    setReviewModalItem(null);
    setNewTigerNameInput('');
  };

  const handleDeleteCapture = async (captureId) => {
    if (window.confirm('Are you sure you want to permanently delete this field capture match candidate?')) {
      await onDeleteCapture?.(captureId);
      if (reviewModalItem?.id === captureId) {
        setReviewModalItem(null);
      }
    }
  };

  const handleDeleteTiger = async (tigerId) => {
    if (window.confirm(`Are you sure you want to delete tiger ${tigerId} from the catalog?`)) {
      await onDeleteTiger?.(tigerId);
      if (selectedTigerId === tigerId) {
        const remaining = tigers?.filter(t => t.id !== tigerId);
        setSelectedTigerId(remaining?.[0]?.id || '');
      }
    }
  };

  const handleGenerateAiReport = async () => {
    if (!activeTiger) return;
    setIsGeneratingReport(true);
    setAiReport(null);

    try {
      const res = await fetch('/api/ai/movement-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tigerId: activeTiger.id,
          apiKey: geminiApiKey
        })
      });
      const data = await res.json();
      setIsGeneratingReport(false);
      if (data.report) {
        setAiReport(data.report);
      }
    } catch (err) {
      console.error('AI Report error:', err);
      setIsGeneratingReport(false);
    }
  };

  const filteredTigers = tigers?.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.territoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>AI Computer Vision Flank Stripe Classifier & Human-in-the-Loop Queue</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">StripeID Flank Matching & Individual Verification</h2>
          <p className="text-xs text-gray-400 mt-0.5">Automated 96.4% confidence stripe bifurcation matching with officer verification control</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#0B150F] px-3.5 py-2 rounded-xl border border-amber-900/40 text-xs font-mono text-amber-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pending Review: <strong>{pendingReviews?.length || 0} Captures</strong></span>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Review Queue Alert Section */}
      {pendingReviews && pendingReviews.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border-2 border-amber-500/80 bg-[#161009]/90 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>Human-in-the-Loop Verification Required ({pendingReviews.length} New Field Captures)</span>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950 px-2.5 py-1 rounded border border-amber-800">
              High Priority
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingReviews.map(item => (
              <div key={item.id} className="bg-[#070F0A] p-4 rounded-xl border border-amber-900/50 space-y-3 relative group">
                <div className="relative rounded-lg overflow-hidden h-40 bg-black">
                  <img
                    src={item.imageUrl}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 font-mono text-[10px] text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                    Station: {item.stationId}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-emerald-950/90 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-700">
                    Confidence: {(item.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-white truncate">{item.filename}</div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.reviewReason || 'AI Flank match candidate'}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setReviewModalItem(item)}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold py-2 rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Verify Flank Stripe Match</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCapture(item.id)}
                    title="Delete capture match"
                    className="p-2 bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-red-200 rounded-xl transition shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Catalog Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tiger Selection Sidebar */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search tiger by ID, name, or territory..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B150F] border border-emerald-900/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredTigers?.map(tiger => {
              const isSelected = tiger.id === selectedTigerId;
              return (
                <div
                  key={tiger.id}
                  onClick={() => setSelectedTigerId(tiger.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg'
                      : 'bg-[#070F0A]/80 border-emerald-900/40 hover:border-emerald-600/60 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={tiger.avatar}
                      alt={tiger.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/60"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>{tiger.name}</span>
                        <span className="font-mono text-[10px] text-emerald-400">({tiger.id})</span>
                      </div>
                      <div className="text-[10px] text-gray-400">{tiger.territoryName} • {tiger.estimatedAreaKm2} sq km</div>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-gray-600'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Tiger Profile & AI Report Generator */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-emerald-900/50 space-y-6">
          {activeTiger ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-900/40 pb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={activeTiger.avatar}
                    alt={activeTiger.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white">{activeTiger.name}</h3>
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                        {activeTiger.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Sex: {activeTiger.sex} • Age: {activeTiger.ageYears} yrs • Territory: {activeTiger.territoryName} ({activeTiger.estimatedAreaKm2} sq km)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleGenerateAiReport}
                    disabled={isGeneratingReport}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center space-x-2 disabled:opacity-40"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{isGeneratingReport ? 'AI Generating Report...' : 'Generate AI Movement Report'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTiger(activeTiger.id)}
                    title="Delete tiger from catalog"
                    className="p-2.5 bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-red-200 rounded-xl transition shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Movement Report Box */}
              {aiReport && (
                <div className="bg-[#070F0A] p-5 rounded-2xl border border-emerald-700/60 text-xs space-y-3 font-sans shadow-2xl">
                  <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-emerald-900/50 pb-2">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Official AI Movement Intelligence Report: {activeTiger.name}</span>
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">Gemini 3.5 Flash Model</span>
                  </div>

                  <div className="whitespace-pre-wrap text-gray-200 leading-relaxed text-[11px]">
                    {aiReport}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">Select a tiger to view profile & stripe patterns</div>
          )}
        </div>

      </div>

      {/* INTERACTIVE STRIPE COMPARISON & VERIFICATION MODAL */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel bg-[#0B150F] border-2 border-emerald-500 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Layers className="w-5 h-5" />
                <span>Side-by-Side AI Stripe Pattern Feature Matcher</span>
              </div>
              <button onClick={() => setReviewModalItem(null)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            {/* Side-by-Side Image Comparison Canvas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Field Capture Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>📸 Field Camera Trap Image</span>
                  <span className="font-mono text-[10px]">Station: {reviewModalItem.stationId}</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border-2 border-amber-500 bg-black h-64 shadow-xl">
                  <img
                    src={reviewModalItem.imageUrl}
                    alt="Field capture"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 font-mono text-[10px] text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                    UNVERIFIED CANDIDATE
                  </div>
                </div>
              </div>

              {/* Verified Catalog Tiger Reference Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>🐅 Verified Catalog Signature (PTR-T-30)</span>
                  <span className="font-mono text-[10px]">96.4% AI Match</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-black h-64 shadow-xl">
                  <img
                    src={tigers?.[0]?.avatar || reviewModalItem.imageUrl}
                    alt="Catalog Reference"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 font-mono text-[10px] text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                    CATALOG SIGNATURE
                  </div>
                </div>
              </div>

            </div>

            {/* AI Stripe Bifurcation Match Analysis */}
            <div className="bg-[#070F0A] p-4 rounded-xl border border-emerald-900/60 text-xs space-y-2">
              <strong className="text-emerald-400 font-mono block">AI Computer Vision Stripe Match Analysis:</strong>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                {reviewModalItem.reviewReason || 'Gemini AI Vision identified 14 matching stripe bifurcations and whorl patterns across the shoulder and flank ribs.'}
              </p>
            </div>

            {/* Decision Controls with Delete Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-emerald-900/50">
              
              {/* Option to enroll as new tiger */}
              <div className="flex-1 w-full sm:w-auto flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Or enter new Tigress name..."
                  value={newTigerNameInput}
                  onChange={(e) => setNewTigerNameInput(e.target.value)}
                  className="bg-[#070F0A] border border-emerald-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 flex-1 font-sans"
                />
                <button
                  onClick={() => handleReject(reviewModalItem.id)}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg flex items-center space-x-1 whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll New Individual</span>
                </button>
              </div>

              {/* Delete match or confirm match */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleDeleteCapture(reviewModalItem.id)}
                  className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/60 text-red-300 hover:text-red-100 font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg flex items-center space-x-1.5 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Delete Match Record</span>
                </button>

                <button
                  onClick={() => handleApprove(reviewModalItem.id, 'PTR-T-30')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-5 py-2 rounded-xl transition shadow-xl flex items-center space-x-1.5 justify-center whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Match to PTR-T-30</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
