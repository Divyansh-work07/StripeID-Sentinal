import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import PenchMap from './components/PenchMap.jsx';
import TriageWizard from './components/TriageWizard.jsx';
import StripeMatcher from './components/StripeMatcher.jsx';
import AlertCenter from './components/AlertCenter.jsx';
import NTCAReportModal from './components/NTCAReportModal.jsx';
import LiveMobileTraps from './components/LiveMobileTraps.jsx';
import StationCamView from './components/StationCamView.jsx';
import SentinelAssistant from './components/SentinelAssistant.jsx';
import DroneSurveillance from './components/DroneSurveillance.jsx';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [activeStationCam, setActiveStationCam] = useState(null);
  const [penchInfo, setPenchInfo] = useState(null);
  const [stations, setStations] = useState([]);
  const [tigers, setTigers] = useState([]);
  const [triageMetrics, setTriageMetrics] = useState(null);
  const [quarantineLogs, setQuarantineLogs] = useState([]);
  const [occupancies, setOccupancies] = useState([]);
  const [overlaps, setOverlaps] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [selectedTigerId, setSelectedTigerId] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('GEMINI_API_KEY') || 'YOUR_GEMINI_API_KEY';
  });

  // Check Hash navigation for Mobile QR Code direct scanning
  useEffect(() => {
    function checkHash() {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#station-')) {
        const stId = hash.replace('#station-', '');
        setActiveStationCam(stId);
      }
    }
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Refresh all state from REST API
  const refreshData = async () => {
    try {
      const [infoRes, stRes, tigRes, metRes, quarRes, occRes, altRes, revRes] = await Promise.all([
        fetch('/api/pench-info').then(r => r.json()),
        fetch('/api/stations').then(r => r.json()),
        fetch('/api/tigers').then(r => r.json()),
        fetch('/api/triage/metrics').then(r => r.json()),
        fetch('/api/triage/quarantine').then(r => r.json()),
        fetch('/api/occupancy').then(r => r.json()),
        fetch('/api/alerts').then(r => r.json()),
        fetch('/api/stripe/review-queue').then(r => r.json())
      ]);

      setPenchInfo(infoRes);
      setStations(stRes);
      setTigers(tigRes);
      setTriageMetrics(metRes);
      setQuarantineLogs(quarRes);
      setOccupancies(occRes.occupancies);
      setOverlaps(occRes.overlaps);
      setAlerts(altRes);
      setPendingReviews(revRes);
    } catch (err) {
      console.error('Failed to fetch application data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Restore quarantine item
  const handleRestoreQuarantine = async (id) => {
    try {
      await fetch('/api/triage/quarantine/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      refreshData();
      showToast('Image restored back to working dataset.');
    } catch (err) {
      console.error(err);
    }
  };

  // Purge quarantine item
  const handlePurgeQuarantine = async (id) => {
    try {
      await fetch('/api/triage/quarantine/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      refreshData();
      showToast('Image permanently purged from quarantine.');
    } catch (err) {
      console.error(err);
    }
  };

  // Approve stripe match
  const handleApproveMatch = async (captureId, tigerId) => {
    try {
      await fetch('/api/stripe/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captureId, tigerId })
      });
      await refreshData();
      showToast('Stripe match confirmed & territory updated!');
    } catch (err) {
      console.error(err);
    }
  };

  // Reject match & auto-enroll new tiger
  const handleRejectAndEnroll = async (captureId, newName, sex) => {
    try {
      const res = await fetch('/api/stripe/reject-and-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captureId, newName, sex })
      });
      const data = await res.json();
      await refreshData();
      if (data.tiger?.id) {
        setSelectedTigerId(data.tiger.id);
      }
      showToast(`🐅 New tiger ${data.tiger?.name || 'enrolled'}! Movement directional arrows & unique color mapped on Google Map.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Action / Resolve Alert
  const handleActionAlert = async (alertId) => {
    try {
      await fetch('/api/alerts/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      refreshData();
      showToast('Alert marked as RESOLVED & Patrol Actioned!');
    } catch (err) {
      console.error(err);
    }
  };

  // Manual Delete Alert
  const handleDeleteAlert = async (alertId) => {
    try {
      await fetch('/api/alerts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      refreshData();
      showToast('Alert manually deleted by Forest Officer.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTigerOnMap = (tigerId) => {
    setSelectedTigerId(tigerId);
    setActiveTab('map');
  };

  // If a mobile phone scanned a QR Code, render dedicated StationCamView!
  if (activeStationCam) {
    return (
      <StationCamView
        stationId={activeStationCam}
        onBack={() => {
          window.location.hash = '';
          setActiveStationCam(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080D09] flex flex-col selection:bg-emerald-500 selection:text-white relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-emerald-900 to-teal-900 border-2 border-emerald-400 text-white p-4 rounded-2xl shadow-2xl flex items-center space-x-3 alert-pulse">
          <CheckCircle2 className="w-6 h-6 text-emerald-300 flex-shrink-0" />
          <div className="text-xs font-bold font-mono">{toastMessage}</div>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alerts.filter(a => a.status === 'ACTIVE').length}
        pendingReviewsCount={pendingReviews.length}
        triageMetrics={triageMetrics}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
      />

      {/* Main Operational Dashboard Workspace */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6">
        
        {activeTab === 'map' && (
          <PenchMap
            penchInfo={penchInfo}
            stations={stations}
            occupancies={occupancies}
            overlaps={overlaps}
            selectedTigerId={selectedTigerId}
            setSelectedTigerId={setSelectedTigerId}
          />
        )}

        {activeTab === 'triage' && (
          <TriageWizard
            metrics={triageMetrics}
            quarantineLogs={quarantineLogs}
            onRestoreQuarantine={handleRestoreQuarantine}
            onPurgeQuarantine={handlePurgeQuarantine}
            onSimulateUpload={refreshData}
            geminiApiKey={geminiApiKey}
          />
        )}

        {activeTab === 'mobile-traps' && (
          <LiveMobileTraps
            stations={stations}
            onUploadSuccess={refreshData}
            geminiApiKey={geminiApiKey}
            onOpenStationCam={(stId) => setActiveStationCam(stId)}
          />
        )}

        {activeTab === 'drone' && (
          <DroneSurveillance
            stations={stations}
            tigers={tigers}
          />
        )}

        {activeTab === 'stripe' && (
          <StripeMatcher
            tigers={tigers}
            pendingReviews={pendingReviews}
            onApproveMatch={handleApproveMatch}
            onRejectAndEnroll={handleRejectAndEnroll}
            geminiApiKey={geminiApiKey}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertCenter
            alerts={alerts}
            onActionAlert={handleActionAlert}
            onDeleteAlert={handleDeleteAlert}
            onSelectTigerOnMap={handleSelectTigerOnMap}
          />
        )}

        {activeTab === 'export' && (
          <NTCAReportModal />
        )}

      </main>

      {/* Floating Ask Sentinel AI Assistant Widget */}
      <SentinelAssistant
        tigers={tigers}
        alerts={alerts}
        stations={stations}
        geminiApiKey={geminiApiKey}
        onSelectTigerOnMap={handleSelectTigerOnMap}
      />

      {/* Persistent Status Bar */}
      <footer className="border-t border-emerald-900/40 bg-[#060A07] py-2 px-6 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
        <div>
          Pench Tiger Reserve (PTR) • Madhya Pradesh & Maharashtra Forest Departments
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-emerald-400">● REST API Connected (Port 5000)</span>
          <span>Google Maps Platform Active</span>
          <span className="text-emerald-400">● 25 Station Mobile QR Sensors Ready</span>
        </div>
      </footer>

    </div>
  );
}
