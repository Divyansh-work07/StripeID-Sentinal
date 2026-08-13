import React, { useState, useRef } from 'react';
import { UploadCloud, Trash2, RotateCcw, CheckCircle, ShieldAlert, Zap, HardDrive, Clock, Filter, Eye, AlertCircle, Image as ImageIcon, FolderOpen, AlertTriangle, XCircle } from 'lucide-react';

export default function TriageWizard({ metrics, quarantineLogs, onRestoreQuarantine, onPurgeQuarantine, onSimulateUpload, geminiApiKey }) {
  const [selectedStation, setSelectedStation] = useState('PTR-KOR-01');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [customFile, setCustomFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
      setUploadResult(null);
    }
  };

  const handleBatchIngest = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setUploadResult(null);

    if (!customFile) {
      setErrorMessage('⚠️ Please select an image file from your computer first!');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('stationId', selectedStation);
    formData.append('photos', customFile);

    try {
      const headers = {};
      if (geminiApiKey) {
        headers['x-gemini-key'] = geminiApiKey;
      }

      const res = await fetch('/api/triage/upload', {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      setIsUploading(false);

      if (!data.success && !data.isTiger) {
        setErrorMessage(data.message || '❌ NO TIGER DETECTED IN IMAGE! AI Vision classified frame as Non-Subject / Foliage.');
        if (onSimulateUpload) onSimulateUpload();
        return;
      }

      if (data.isDuplicate) {
        setUploadResult({
          isDuplicate: true,
          message: data.message,
          existingRecord: data.existingRecord
        });
        if (onSimulateUpload) onSimulateUpload();
        return;
      }

      if (data.summary) {
        setUploadResult(data.summary);
        if (onSimulateUpload) onSimulateUpload();
      }
    } catch (err) {
      console.error('Triage upload error:', err);
      setIsUploading(false);
      setErrorMessage('Failed to process image upload.');
    }
  };

  const filteredLogs = filterCategory === 'ALL'
    ? quarantineLogs
    : quarantineLogs.filter(q => q.blankCategory.toLowerCase().includes(filterCategory.toLowerCase()));

  return (
    <div className="space-y-6">
      
      {/* Top Banner KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-emerald-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Raw Frames Processed</span>
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              <Filter className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-white">{metrics?.totalProcessed || 631}</div>
          <div className="mt-1 text-xs text-emerald-400 font-medium">100% Ingestion Coverage across 25 Stations</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Blank Frames Filtered</span>
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/50">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-amber-400">{metrics?.blankRemoved || 289}</div>
          <div className="mt-1 text-xs text-amber-300 font-medium">Staged in Safe Reversible Quarantine ({metrics?.triageEfficiencyPct || '45.8'}%)</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-teal-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Disk Storage Saved</span>
            <div className="p-2 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-800/50">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-teal-300">{metrics?.totalSpaceSavedGB || '1.85'} GB</div>
          <div className="mt-1 text-xs text-teal-400 font-medium">Bandwidth & Server Overhead Saved</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cyan-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Officer Hours Saved</span>
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-cyan-300">{metrics?.timeSavedHours || '18.4'} hrs</div>
          <div className="mt-1 text-xs text-cyan-400 font-medium">Based on 45 sec/frame manual review standard</div>
        </div>
      </div>

      {/* Main Ingestion Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Image Uploader with AI Vision & Deduplication */}
        <div className="glass-panel p-6 rounded-2xl border-2 border-emerald-500/60 bg-[#0C1A11] space-y-5 shadow-2xl">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-black bg-emerald-400 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 fill-black" />
              <span>AI VISION TRIAGE UPLOADER</span>
            </div>
            <h3 className="text-xl font-black text-white">Upload Field Camera Photo</h3>
            <p className="text-xs text-emerald-200/80 mt-1">
              AI Vision Classifier checks for tiger subjects and prevents duplicate photo re-ingestion.
            </p>
          </div>

          <form onSubmit={handleBatchIngest} className="space-y-4">
            
            {/* Step 1: Station Selector */}
            <div className="bg-[#070F0A] p-3 rounded-xl border border-emerald-800/50 space-y-1">
              <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Step 1: Select Camera Station</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full bg-[#122218] border border-emerald-700/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-medium"
              >
                <option value="PTR-KOR-01">PTR-KOR-01 (Turia Nala Crossing)</option>
                <option value="PTR-KOR-04">PTR-KOR-04 (Pyorthuri Waterhole)</option>
                <option value="PTR-KOR-06">PTR-KOR-06 (Karmajhiri Gate North)</option>
                <option value="PTR-BUF-01">PTR-BUF-01 (Khawasa Buffer Peripheral)</option>
                <option value="PTR-BUF-03">PTR-BUF-03 (Telia Village Corridor)</option>
              </select>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Step 2: Choose File Box */}
            <div className="bg-[#070F0A] p-4 rounded-xl border-2 border-dashed border-emerald-400/80 hover:border-emerald-300 transition text-center space-y-3">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Step 2: Choose Photo File</div>
              
              {previewUrl ? (
                <div className="space-y-2">
                  <img src={previewUrl} alt="Selected Upload" className="w-full h-36 object-cover rounded-xl border-2 border-emerald-400 shadow-lg" />
                  <div className="text-xs text-emerald-300 font-bold flex items-center justify-center gap-1">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span className="truncate max-w-[180px]">{customFile?.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-amber-300 underline font-semibold hover:text-white"
                  >
                    Change / Choose different photo
                  </button>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                    <FolderOpen className="w-6 h-6 text-emerald-400" />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Select Photo From Computer</span>
                  </button>

                  <div className="text-[11px] text-gray-400">Or drag and drop any image file here</div>
                </div>
              )}
            </div>

            {/* Step 3: Analyze Button */}
            <button
              type="submit"
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-xl shadow-emerald-950/80 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Running AI Vision & Deduplication...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Step 3: Analyze Photo Live</span>
                </>
              )}
            </button>

          </form>

          {/* Error / No Tiger Detected Alert Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-600 space-y-1.5 text-xs text-rose-200 shadow-xl alert-pulse">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span>AI Vision Alert</span>
              </div>
              <p className="leading-relaxed text-[11.5px] font-semibold">{errorMessage}</p>
            </div>
          )}

          {/* Duplicate Image Warning Banner */}
          {uploadResult?.isDuplicate && (
            <div className="p-4 rounded-xl bg-amber-950/90 border border-amber-500 space-y-2 text-xs text-amber-200 shadow-xl">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>Deduplication Prevention Triggered</span>
              </div>
              <p className="leading-relaxed text-[11.5px]">{uploadResult.message}</p>
              {uploadResult.existingRecord && (
                <div className="text-[11px] font-mono text-amber-300 bg-[#070F0A] p-2 rounded-lg border border-amber-800/50">
                  <div>Existing Capture ID: <strong>{uploadResult.existingRecord.id}</strong></div>
                  <div>Assigned Subject: <strong>{uploadResult.existingRecord.tigerName}</strong></div>
                  <div>Station: {uploadResult.existingRecord.stationId}</div>
                </div>
              )}
            </div>
          )}

          {/* Success Upload Result Alert */}
          {uploadResult && !uploadResult.isDuplicate && (
            <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-500 space-y-2 text-xs shadow-lg">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Tiger Identified by AI Vision!</span>
              </div>
              <div className="text-gray-300 font-mono text-[11px] space-y-1">
                <div>• Ingested Station: <strong>{uploadResult.stationName}</strong></div>
                <div>• Status: <strong className="text-emerald-400 font-sans">Routed to StripeID Review Queue</strong></div>
              </div>
              <div className="text-[11px] text-amber-300 font-semibold pt-1 border-t border-emerald-900/50">
                👉 Click the <strong>StripeID Intelligence</strong> tab at the top to inspect flank overlays!
              </div>
            </div>
          )}

          {/* Triage Safety Principles Alert */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-xs text-amber-200/90 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Safe Reversible Deletion Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              No images are permanently deleted immediately. All flagged blank frames are held in staged quarantine for 30 days. Forest officials can restore any misclassified frame with 1-click.
            </p>
          </div>

        </div>

        {/* Right Column: Safe Reversible Quarantine Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-emerald-900/50 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-emerald-900/40">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Staged Quarantine Table <span className="text-xs font-normal text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/40">{quarantineLogs.length} Filtered Items</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Safely holds blank & zero-subject frames ready for review, restoration, or permanent purge</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Filter Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-[#122218] border border-emerald-800/60 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="foliage">Foliage / Wind</option>
                  <option value="sun flare">Sun Flare</option>
                  <option value="shadow">Shadow Drift</option>
                </select>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-900/40 text-gray-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Quarantine ID</th>
                    <th className="py-2.5 px-3">Station</th>
                    <th className="py-2.5 px-3">Original File</th>
                    <th className="py-2.5 px-3">AI Classification Reason</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3 text-right">Safety Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60 font-mono text-[11px]">
                  {filteredLogs.map(item => (
                    <tr key={item.id} className="hover:bg-emerald-950/30 transition">
                      <td className="py-3 px-3 text-amber-400 font-bold">{item.id}</td>
                      <td className="py-3 px-3 text-emerald-300 font-sans">{item.stationId}</td>
                      <td className="py-3 px-3 text-gray-300 truncate max-w-[140px]">{item.originalFilename}</td>
                      <td className="py-3 px-3 text-gray-300 font-sans">
                        <span className="inline-block bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">
                          {item.blankCategory}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-400">{item.fileSizeMB} MB</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{(item.confidence * 100).toFixed(0)}%</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2 font-sans">
                          {item.status.includes('Restored') ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-1 rounded">Restored</span>
                          ) : (
                            <>
                              <button
                                onClick={() => onRestoreQuarantine(item.id)}
                                className="flex items-center space-x-1 bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded text-[10px] font-semibold transition"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => onPurgeQuarantine(item.id)}
                                className="flex items-center space-x-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 px-2.5 py-1 rounded text-[10px] font-semibold transition"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Purge</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-xs text-gray-400">
            <span>Showing {filteredLogs.length} of {quarantineLogs.length} quarantined frames</span>
            <span className="text-emerald-400 font-mono text-[11px]">Storage Reclaimed: {metrics?.totalSpaceSavedGB || '1.85'} GB</span>
          </div>

        </div>

      </div>

    </div>
  );
}
