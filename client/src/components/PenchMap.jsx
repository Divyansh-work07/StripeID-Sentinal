import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Shield, Layers, Navigation, AlertTriangle, Maximize2, Compass, Activity, Sparkles, Flame, Radio } from 'lucide-react';

export default function PenchMap({ penchInfo, stations, occupancies, overlaps, selectedTigerId, setSelectedTigerId }) {
  const mapRef = useRef(null);
  const googleMapObj = useRef(null);
  const overlaysRef = useRef([]);

  const [showCoreBuffer, setShowCoreBuffer] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showHulls, setShowHulls] = useState(true);
  const [showOverlaps, setShowOverlaps] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showHeatmapPredictor, setShowHeatmapPredictor] = useState(false); // 🔮 AI 48h Predictor
  const [showRangerUnits, setShowRangerUnits] = useState(true); // 📡 Ranger GPS Patrol Units
  const [mapLoaded, setMapLoaded] = useState(false);

  // Live Forest Ranger Patrol Units
  const rangerUnits = [
    { id: 'QRT-1', name: 'Turia QRT Response Vehicle', sector: 'Turia Core Beat 1', lat: 21.6600, lng: 79.2840, status: 'PATROLLING' },
    { id: 'RANGER-4', name: 'Karmajhiri Anti-Poaching Squad', sector: 'Karmajhiri Sector', lat: 21.6780, lng: 79.2950, status: 'PATROLLING' },
    { id: 'PATROL-8', name: 'Khawasa Conflict Peripheral Unit', sector: 'Buffer Conflict Zone', lat: 21.5950, lng: 79.3480, status: 'DISPATCHED' }
  ];

  // Initialize Google Maps
  useEffect(() => {
    const loader = new Loader({
      apiKey: '',
      version: 'weekly',
      libraries: ['geometry', 'visualization']
    });

    loader.load().then((google) => {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 21.6534, lng: 79.2965 },
        zoom: 12,
        mapTypeId: 'hybrid',
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1d2c1d' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#749274' }] },
          { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
          { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: true
      });

      googleMapObj.current = map;
      setMapLoaded(true);
    }).catch(err => {
      console.log('Google Maps API script fallback active:', err);
      setMapLoaded(false);
    });
  }, []);

  // Draw Layers when state updates
  useEffect(() => {
    if (!googleMapObj.current || !window.google) return;
    const map = googleMapObj.current;
    const google = window.google;

    // Clear previous overlays
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    // 1. Draw Core & Buffer Reserve Boundaries
    if (showCoreBuffer && penchInfo?.bounds) {
      const corePoly = new google.maps.Polygon({
        paths: penchInfo.bounds.corePolygon.map(p => ({ lat: p[1], lng: p[0] })),
        strokeColor: '#10B981',
        strokeOpacity: 0.9,
        strokeWeight: 2.5,
        fillColor: '#059669',
        fillOpacity: 0.12
      });
      corePoly.setMap(map);
      overlaysRef.current.push(corePoly);

      const bufferPoly = new google.maps.Polygon({
        paths: penchInfo.bounds.bufferPolygon.map(p => ({ lat: p[1], lng: p[0] })),
        strokeColor: '#F59E0B',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        strokeDashArray: [6, 6],
        fillColor: '#D97706',
        fillOpacity: 0.06
      });
      bufferPoly.setMap(map);
      overlaysRef.current.push(bufferPoly);
    }

    // 2. Draw Camera Trap Stations as Circle Dots
    if (showStations && stations) {
      stations.forEach(station => {
        const isBuffer = station.type === 'Buffer';
        const isCapturing = station.isCapturing;

        const marker = new google.maps.Marker({
          position: { lat: station.lat, lng: station.lng },
          map,
          title: `Station ${station.id}: ${station.name} (${station.type})`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isCapturing ? 9 : 6.5,
            fillColor: isCapturing ? '#EF4444' : isBuffer ? '#F59E0B' : '#10B981',
            fillOpacity: 0.95,
            strokeColor: '#FFFFFF',
            strokeWeight: isCapturing ? 3 : 1.5
          }
        });

        const infowindow = new google.maps.InfoWindow({
          content: `
            <div style="color: #000; padding: 6px; font-family: sans-serif;">
              <strong style="color: ${isCapturing ? '#DC2626' : '#059669'}; font-size: 13px;">${station.id} - ${station.name}</strong><br/>
              <span style="font-size: 11px;">Status: <b>${isCapturing ? '🔴 CAPTURING LIVE' : station.status}</b></span><br/>
              <span style="font-size: 11px;">Beat: ${station.beat} (${station.type})</span><br/>
              <span style="font-size: 11px;">Total Captures Logged: ${station.totalCaptures}</span>
            </div>
          `
        });

        marker.addListener('click', () => {
          infowindow.open(map, marker);
        });

        overlaysRef.current.push(marker);
      });
    }

    // 3. Draw Live Forest Ranger Patrol Units
    if (showRangerUnits) {
      rangerUnits.forEach(unit => {
        const rangerMarker = new google.maps.Marker({
          position: { lat: unit.lat, lng: unit.lng },
          map,
          title: `${unit.id}: ${unit.name}`,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: '#3B82F6',
            fillOpacity: 0.95,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });

        const rInfo = new google.maps.InfoWindow({
          content: `
            <div style="color: #000; padding: 6px; font-family: sans-serif;">
              <strong style="color: #2563EB; font-size: 13px;">📡 ${unit.name} (${unit.id})</strong><br/>
              <span style="font-size: 11px;">Sector: <b>${unit.sector}</b></span><br/>
              <span style="font-size: 11px;">Status: <b>${unit.status}</b></span>
            </div>
          `
        });

        rangerMarker.addListener('click', () => {
          rInfo.open(map, rangerMarker);
        });

        overlaysRef.current.push(rangerMarker);
      });
    }

    // 4. Draw Individual Tiger Home Ranges, Trajectories & Directional Arrows
    if (occupancies) {
      occupancies.forEach(occ => {
        if (selectedTigerId !== 'ALL' && occ.tigerId !== selectedTigerId) return;

        const tigerColor = occ.tigerColor || '#10B981';

        // A. Home Range Polygon (Minimum Convex Polygon)
        if (showHulls && occ.convexHull && occ.convexHull.length >= 3) {
          const hullPoly = new google.maps.Polygon({
            paths: occ.convexHull,
            strokeColor: tigerColor,
            strokeOpacity: 0.95,
            strokeWeight: 3,
            fillColor: tigerColor,
            fillOpacity: 0.22,
            map
          });
          overlaysRef.current.push(hullPoly);
        }

        // B. Directional Trajectory Line with Movement Arrows
        if (showTrajectories && occ.trajectoryPath && occ.trajectoryPath.length >= 2) {
          const line = new google.maps.Polyline({
            path: occ.trajectoryPath,
            strokeColor: tigerColor,
            strokeOpacity: 0.9,
            strokeWeight: 4,
            icons: [{
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3.5,
                fillColor: tigerColor,
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 1
              },
              offset: '0%',
              repeat: '80px'
            }],
            map
          });
          overlaysRef.current.push(line);

          // Leading Directional Movement Head Marker
          const lastPoint = occ.trajectoryPath[occ.trajectoryPath.length - 1];
          const headMarker = new google.maps.Marker({
            position: lastPoint,
            map,
            title: `Tiger ${occ.tigerName} (${occ.tigerId}) Current Movement Direction`,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: tigerColor,
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              rotation: 45
            }
          });
          overlaysRef.current.push(headMarker);
        }

        // C. Centroid Tiger Location Marker with Info Window
        if (occ.centroid) {
          const tigMarker = new google.maps.Marker({
            position: occ.centroid,
            map,
            title: `🐅 ${occ.tigerName || occ.name} (${occ.tigerId})`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: tigerColor,
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2.5
            }
          });

          const tigInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="color: #000; padding: 6px; font-family: sans-serif;">
                <strong style="color: ${tigerColor}; font-size: 13px;">🐅 ${occ.tigerName || occ.name} (${occ.tigerId})</strong><br/>
                <span style="font-size: 11px;">Territory Area: <b>${occ.areaKm2} sq km</b></span><br/>
                <span style="font-size: 11px;">Recorded Movement: <b>${occ.totalDistanceKm} km</b></span><br/>
                <span style="font-size: 11px; color: #4B5563;">Sex: <b>${occ.sex || 'Monitored'}</b></span>
              </div>
            `
          });

          tigMarker.addListener('click', () => {
            tigInfoWindow.open(map, tigMarker);
          });

          overlaysRef.current.push(tigMarker);
        }

        // D. AI 48-Hour Movement Spatial Predictor Heatmap Rings
        if (showHeatmapPredictor && occ.centroid) {
          const predictorCircle = new google.maps.Circle({
            map,
            center: occ.centroid,
            radius: (occ.areaKm2 || 15) * 220, // 48h Spatial Radius
            strokeColor: tigerColor,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: tigerColor,
            fillOpacity: 0.15
          });
          overlaysRef.current.push(predictorCircle);
        }

      });
    }

    // Zoom map to selected tiger if single tiger selected
    if (selectedTigerId !== 'ALL' && occupancies) {
      const selOcc = occupancies.find(o => o.tigerId === selectedTigerId);
      if (selOcc && selOcc.centroid) {
        map.panTo(selOcc.centroid);
        map.setZoom(13);
      }
    }

  }, [showCoreBuffer, showStations, showHulls, showOverlaps, showTrajectories, showHeatmapPredictor, showRangerUnits, selectedTigerId, occupancies, penchInfo, stations]);

  return (
    <div className="space-y-4">
      
      {/* Control Bar & Layer Toggles */}
      <div className="glass-panel p-4 rounded-2xl border border-emerald-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Tiger Selector Filter */}
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">Focus Tiger:</span>
          <select
            value={selectedTigerId}
            onChange={e => setSelectedTigerId(e.target.value)}
            className="bg-[#0B150F] border border-emerald-800/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
          >
            <option value="ALL">🌐 All Reserve Tigers ({occupancies?.length || 0})</option>
            {occupancies?.map(occ => (
              <option key={occ.tigerId} value={occ.tigerId}>
                🐅 {occ.tigerName} ({occ.tigerId}) • {occ.areaKm2} km²
              </option>
            ))}
          </select>
        </div>

        {/* GIS Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCoreBuffer(!showCoreBuffer)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
              showCoreBuffer ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Core/Buffer</span>
          </button>

          <button
            onClick={() => setShowStations(!showStations)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
              showStations ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>25 Stations</span>
          </button>

          <button
            onClick={() => setShowTrajectories(!showTrajectories)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
              showTrajectories ? 'bg-teal-950 border border-teal-500 text-teal-300' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Directional Vectors</span>
          </button>

          <button
            onClick={() => setShowHeatmapPredictor(!showHeatmapPredictor)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              showHeatmapPredictor
                ? 'bg-amber-500 text-black border border-amber-300 shadow-lg animate-pulse'
                : 'bg-[#0B150F] text-amber-400 border border-amber-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🔮 AI 48h Predictor</span>
          </button>

          <button
            onClick={() => setShowRangerUnits(!showRangerUnits)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
              showRangerUnits ? 'bg-blue-950 border border-blue-500 text-blue-300' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>📡 Ranger Units</span>
          </button>
        </div>

      </div>

      {/* Main Google Maps Viewport Container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-900/60 bg-[#070F0A] h-[650px] shadow-2xl">
        <div ref={mapRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-black/85 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-900/80 text-xs space-y-2 max-w-xs shadow-2xl font-mono">
          <div className="font-bold text-white flex items-center space-x-1">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Pench GIS Map Legend</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-gray-300">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Core Station</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Buffer Station</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <span>🔴 Capturing Live</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>📡 Ranger Unit</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
