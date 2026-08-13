import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, PhoneCall, Radio, ExternalLink, MapPin, Eye, Filter, Trash2, Send, Check } from 'lucide-react';

export default function AlertCenter({ alerts, onActionAlert, onDeleteAlert, onSelectTigerOnMap }) {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredAlerts = filterStatus === 'ALL'
    ? alerts
    : filterStatus === 'ACTIVE'
    ? alerts.filter(a => a.status === 'ACTIVE')
    : filterStatus === 'RESOLVED'
    ? alerts.filter(a => a.status === 'RESOLVED')
    : alerts.filter(a => a.severity === 'CRITICAL');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-rose-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse text-rose-500" />
            <span>Real-time Anomaly & Human-Wildlife Conflict Alert Center</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Pench Reserve Emergency Siren Console</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Automated conflict risk triggers, territorial encroaching alerts, and ranger patrol management
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#0B150F] p-1.5 rounded-xl border border-emerald-900/40 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterStatus === 'ALL' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            All Alerts ({alerts.length})
          </button>

          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 ${
              filterStatus === 'ACTIVE' ? 'bg-rose-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <span>Active ({alerts.filter(a => a.status === 'ACTIVE').length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterStatus === 'RESOLVED' ? 'bg-teal-700 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Resolved ({alerts.filter(a => a.status === 'RESOLVED').length})
          </button>

          <button
            onClick={() => setFilterStatus('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterStatus === 'CRITICAL' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Critical Risk
          </button>
        </div>
      </div>

      {/* Alert Cards Feed */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => {
          const isCritical = alert.severity === 'CRITICAL';
          const isResolved = alert.status === 'RESOLVED';

          return (
            <div
              key={alert.id}
              className={`glass-panel p-5 rounded-2xl border transition-all space-y-4 shadow-xl ${
                isResolved
                  ? 'border-teal-800/40 bg-[#07130C]/80'
                  : isCritical
                  ? 'border-rose-600/80 bg-[#1A0A0E]/90 alert-pulse'
                  : 'border-amber-600/60 bg-[#161208]/90'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-emerald-900/40 pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    isResolved
                      ? 'bg-teal-950 text-teal-400 border-teal-800'
                      : isCritical
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    {isResolved ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isResolved
                          ? 'bg-teal-950 text-teal-300 border-teal-700'
                          : isCritical
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}>
                        {alert.category.replace(/_/g, ' ')}
                      </span>

                      <span className="text-[10px] font-mono text-gray-400 bg-[#0B150F] px-2 py-0.5 rounded border border-emerald-900/40">
                        ID: {alert.id}
                      </span>

                      {/* Resolved Badge */}
                      {isResolved && (
                        <span className="text-[10px] font-bold text-teal-300 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-500">
                          ✓ PATROL DISPATCHED / RESOLVED
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mt-1">{alert.title}</h3>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono text-gray-400">
                  <span>Detected: <strong className="text-emerald-400">{alert.detectedAt}</strong></span>
                  <span>•</span>
                  <span>Confidence: <strong className="text-amber-400">{(alert.confidence * 100).toFixed(0)}%</strong></span>
                </div>
              </div>

              {/* Alert Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Evidence Image */}
                <div className="relative rounded-xl overflow-hidden border border-emerald-800/50 bg-[#070F0A] h-48">
                  <img src={alert.evidenceImageUrl} alt="Evidence Frame" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/80 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-800">
                    Station: {alert.stationName || alert.stationId}
                  </div>
                  {alert.nearVillage && (
                    <div className="absolute bottom-2 left-2 bg-rose-950/90 text-rose-300 font-semibold text-[10px] px-2 py-1 rounded border border-rose-800">
                      ⚠️ Proximity: {alert.nearVillage}
                    </div>
                  )}
                </div>

                {/* Description & Recommended Action */}
                <div className="lg:col-span-2 space-y-3 text-xs">
                  <div>
                    <div className="font-bold text-gray-300 mb-1">AI Detection & Spatial Analysis:</div>
                    <p className="text-gray-300 leading-relaxed bg-[#0B150F] p-3 rounded-xl border border-emerald-900/40">
                      {alert.description}
                    </p>
                  </div>

                  <div className="bg-amber-950/40 border border-amber-800/50 p-3 rounded-xl space-y-1">
                    <div className="font-bold text-amber-300 flex items-center space-x-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                      <span>Recommended Ranger Patrol Protocol:</span>
                    </div>
                    <p className="text-amber-200/90 text-[11px] leading-relaxed">
                      {alert.recommendedAction}
                    </p>
                  </div>

                  {/* Resolution Timestamp if Resolved */}
                  {isResolved && alert.actionedAt && (
                    <div className="text-[11px] text-teal-300 bg-teal-950/80 p-2 rounded-lg border border-teal-800/60 font-mono flex items-center justify-between">
                      <span>✓ Actioned at: <strong>{alert.actionedAt}</strong></span>
                      <span>By: {alert.actionedBy || 'Range QRT Team'}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-900/40">
                <button
                  onClick={() => onSelectTigerOnMap(alert.tigerId)}
                  className="flex items-center space-x-1.5 bg-[#0D1C13] hover:bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-3 py-2 rounded-xl text-xs font-semibold transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Locate Individual {alert.tigerId} on Google Map</span>
                </button>

                <div className="flex items-center space-x-2">
                  
                  {/* Action / Resolve Alert Button */}
                  {!isResolved && (
                    <button
                      onClick={() => onActionAlert(alert.id)}
                      className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition"
                    >
                      <Check className="w-4 h-4 text-white" />
                      <span>Mark Patrol Actioned & Resolved</span>
                    </button>
                  )}

                  {/* Manual Delete Button */}
                  <button
                    onClick={() => onDeleteAlert(alert.id)}
                    className="flex items-center space-x-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>

                </div>
              </div>

            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="glass-panel p-12 text-center text-gray-400 rounded-2xl border border-emerald-900/40">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <div className="text-base font-bold text-white">No Alerts Found in Selected Filter</div>
            <p className="text-xs text-gray-400 mt-1">All clear across Pench Core & Buffer Ranges.</p>
          </div>
        )}
      </div>

    </div>
  );
}
