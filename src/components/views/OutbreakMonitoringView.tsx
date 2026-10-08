import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  Send, 
  ShieldAlert, 
  Plus, 
  Users, 
  Droplet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Clock,
  Search,
  Filter,
  X,
  Bell,
  ChevronRight,
  Info,
  Check,
  Building2,
  Calendar
} from 'lucide-react';
import { OutbreakAlert, AlertActivityLog } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useRole, USERS_BY_ROLE } from '../../context/RoleContext';
import { HEALTH_CENTRES } from '../../config/healthCentres';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const VILLAGE_COORDINATES: Record<string, {lat: number, lng: number}> = {
  'Chirakkal': { lat: 11.9153, lng: 75.3619 },
  'Pappinisseri': { lat: 11.9529, lng: 75.3592 },
  'Azhikode': { lat: 11.9203, lng: 75.3361 },
  'Pallikunnu': { lat: 11.8928, lng: 75.3660 },
  'Valapattanam': { lat: 11.9272, lng: 75.3464 },
  'Puzhathi': { lat: 11.8983, lng: 75.3853 },
  'Kalliasseri': { lat: 11.9712, lng: 75.3616 }
};

const getVillageCoordinates = (locationName?: string) => {
  if (!locationName) return undefined;
  const normalized = locationName.trim().toLowerCase();
  for (const [key, coords] of Object.entries(VILLAGE_COORDINATES)) {
    if (key.toLowerCase() === normalized) {
      return coords;
    }
  }
  return undefined;
};

export const OutbreakMonitoringView: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const { t } = useLanguage();
  const { role } = useRole();
  const isDoctor = role === 'DOCTOR';

  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7');
  const [isLoading, setIsLoading] = useState(true);
  
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [statistics, setStatistics] = useState({
    activeAlerts: 0,
    affectedVillages: 0,
    casesReported: 0,
    resolvedClusters: 0
  });
  const [activityLogs, setActivityLogs] = useState<AlertActivityLog[]>([]);

  const [selectedClusterId, setSelectedClusterId] = useState<string | number | null>(null);
  const [activeMapPopupId, setActiveMapPopupId] = useState<string | number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [isNewClusterModalOpen, setIsNewClusterModalOpen] = useState(false);
  const [newVillage, setNewVillage] = useState('');
  const [newDisease, setNewDisease] = useState('');
  const [newCases, setNewCases] = useState(3);
  const [newSymptoms, setNewSymptoms] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEscalating, setIsEscalating] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async (range: string, showLoader: boolean = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const [alertsRes, statsRes, activitiesRes] = await Promise.all([
        fetch(`${baseUrl}/outbreak-alerts?timeRange=${range}`),
        fetch(`${baseUrl}/outbreak-alerts/statistics?timeRange=${range}`),
        fetch(`${baseUrl}/outbreak-alerts/activities/recent`)
      ]);

      if (alertsRes.ok) {
        const json = await alertsRes.json();
        if (json.success) {
          const fetchedAlerts = json.data;
          setAlerts(fetchedAlerts);
          if (fetchedAlerts.length > 0 && !selectedClusterId && showLoader) {
            setSelectedClusterId(fetchedAlerts[0].id);
          }
        }
      }
      
      if (statsRes.ok) {
        const json = await statsRes.json();
        if (json.success) setStatistics(json.data);
      }

      if (activitiesRes.ok) {
        const json = await activitiesRes.json();
        if (json.success) setActivityLogs(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch outbreak data:', error);
      if (showLoader) showToast('Unable to load outbreak data. Please try again.');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(timeRange);
    
    // Polling every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchData(timeRange, false);
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [timeRange]);

  const handleTimeRangeChange = (range: '7' | '30' | '90') => {
    if (range === timeRange) return;
    setTimeRange(range);
  };

  const selectedCluster = useMemo(() => {
    return alerts.find(a => a.id === selectedClusterId) || alerts[0] || null;
  }, [alerts, selectedClusterId]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchesSearch = 
        a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.symptoms && a.symptoms.some((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const alertRisk = a.caseCount >= 6 ? 'High' : a.caseCount >= 3 ? 'Moderate' : 'Low';
      const matchesRisk = riskFilter === 'All' || alertRisk === riskFilter;
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [alerts, searchQuery, riskFilter, statusFilter]);

  const handleNotifyHealthOfficer = async (cluster: OutbreakAlert) => {
    if (cluster.healthOfficerNotified) return;
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/outbreak-alerts/${cluster.id}/notify`, { method: 'PATCH' });
      if (res.ok) {
        showToast(t('outbreak.officerNotifiedToast', `Health Officer notified for cluster!`));
        fetchData(timeRange, false);
      } else {
        showToast('Unable to notify the health officer.');
      }
    } catch (error) {
      showToast('Unable to notify the health officer.');
    }
  };

  const handleEscalateOutbreak = async (cluster: OutbreakAlert) => {
    if (cluster.escalatedToStateHealthDepartment) return;
    setIsEscalating(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/outbreak-alerts/${cluster.id}/escalate`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || t('outbreak.escalatedToast', 'Escalated to State Health Department!'));
        fetchData(timeRange, false);
      } else {
        showToast(json.error || 'Unable to escalate outbreak alert.');
      }
    } catch (error) {
      showToast('Unable to escalate outbreak alert. Please try again.');
    } finally {
      setIsEscalating(false);
    }
  };

  const handleMarkContained = async (cluster: OutbreakAlert) => {
    if (cluster.status === 'Contained') return;
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/outbreak-alerts/${cluster.id}/contain`, { method: 'PATCH' });
      if (res.ok) {
        showToast(t('outbreak.containedToast', 'Cluster successfully marked as Contained!'));
        fetchData(timeRange, false);
      }
    } catch (error) {
      showToast('Error marking as contained.');
    }
  };

  const handleCreateClusterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillage.trim() || !newDisease.trim()) return;
    setIsReporting(true);

    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/outbreak-alerts/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease: newDisease,
          location: newVillage,
          caseCount: Number(newCases),
          symptoms: newSymptoms,
          detectionReason: 'Manual Report by ASHA'
        })
      });

      if (res.ok) {
        const json = await res.json();
        showToast(`New outbreak cluster reported in ${newVillage}!`);
        setIsNewClusterModalOpen(false);
        setNewVillage('');
        setNewDisease('');
        setNewCases(3);
        setNewSymptoms('');
        fetchData(timeRange, false);
        if (json.success && json.data && json.data.id) {
          setSelectedClusterId(json.data.id);
          setActiveMapPopupId(json.data.id);
        }
      } else {
        showToast('Unable to report the cluster.');
      }
    } catch (error) {
      showToast('Unable to report the cluster.');
    } finally {
      setIsReporting(false);
    }
  };

  const renderTrendSvg = (trendPercentage?: number, direction?: string) => {
    const isUp = direction !== 'down';
    return (
      <svg className="w-full h-full overflow-visible" viewBox="0 0 300 60" preserveAspectRatio="none">
        <line x1="0" y1="10" x2="300" y2="10" stroke="#e2e8f0" strokeDasharray="3 3" />
        <line x1="0" y1="30" x2="300" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
        <line x1="0" y1="50" x2="300" y2="50" stroke="#cbd5e1" />
        <path
          d={
            timeRange === '7'
              ? (isUp ? "M 10 45 L 100 35 L 200 25 L 290 12" : "M 10 15 L 100 25 L 200 38 L 290 48")
              : timeRange === '30'
              ? (isUp ? "M 10 45 L 50 42 L 100 35 L 150 30 L 200 25 L 250 18 L 290 12" : "M 10 15 L 50 18 L 100 25 L 150 28 L 200 38 L 250 42 L 290 48")
              : (isUp ? "M 10 45 L 30 48 L 60 40 L 90 38 L 120 30 L 150 32 L 180 25 L 210 20 L 240 18 L 270 15 L 290 12" : "M 10 15 L 30 12 L 60 20 L 90 22 L 120 30 L 150 28 L 180 38 L 210 42 L 240 44 L 270 47 L 290 48")
          }
          fill="none"
          stroke={isUp ? '#e11d48' : '#10b981'}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="290" cy={isUp ? "12" : "48"} r="5" fill={isUp ? "#e11d48" : "#10b981"} stroke="#ffffff" strokeWidth="2" />
      </svg>
    );
  };

  const mapCenter = useMemo(() => {
    if (selectedCluster && getVillageCoordinates(selectedCluster.location)) {
      return getVillageCoordinates(selectedCluster.location);
    }
    return { lat: 11.8745, lng: 75.3704 };
  }, [selectedCluster]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-slide-down">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-rose-600" />
            <span>Disease Surveillance & Vector Response</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('outbreak.title', 'Outbreak Monitoring')}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t('outbreak.subtitle', 'Track disease clusters and manage early-warning alerts across your region.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center">
            <button
              onClick={() => handleTimeRangeChange('7')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === '7' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('outbreak.time7Days', 'Last 7 Days')}
            </button>
            <button
              onClick={() => handleTimeRangeChange('30')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === '30' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('outbreak.time30Days', 'Last 30 Days')}
            </button>
            <button
              onClick={() => handleTimeRangeChange('90')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === '90' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('outbreak.time90Days', 'Last 90 Days')}
            </button>
          </div>

          {role === 'ASHA_WORKER' && (
            <button
              onClick={() => setIsNewClusterModalOpen(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('outbreak.reportNewCluster', 'Report New Cluster')}</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-rose-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Loading surveillance data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statistics.activeAlerts}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {t('outbreak.activeAlertsStat', 'Active Outbreak Alerts')}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statistics.affectedVillages}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {t('outbreak.affectedVillagesStat', 'Affected Villages')}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statistics.casesReported}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {t('outbreak.casesThisWeekStat', 'Cases Reported')}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statistics.resolvedClusters}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {t('outbreak.resolvedClustersStat', 'Resolved Clusters')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>{t('outbreak.regionalMapTitle', 'PHC Sector Disease Cluster Map')}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Click any marker to inspect cluster symptoms and trigger emergency intervention.
              </p>
            </div>
            <span className="bg-rose-50 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-200 self-start sm:self-auto">
              Live GIS Feed
            </span>
          </div>

          <div className="relative h-96 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
            {!isLoaded ? (
              <div className="text-slate-500 font-medium text-sm flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-rose-600 rounded-full animate-spin" />
                Loading Google Maps...
              </div>
            ) : loadError || !(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY ? (
              <div className="text-slate-500 font-medium text-sm text-center px-6">
                Google Maps is unavailable. Please configure a valid Google Maps API key in your .env file.
              </div>
            ) : alerts.length === 0 ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{ lat: 11.8745, lng: 75.3704 }}
                zoom={12}
                options={{ mapTypeControl: true, streetViewControl: false }}
              >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-slate-200 text-sm font-semibold text-slate-700 z-10">
                  No active outbreak clusters are currently recorded.
                </div>
              </GoogleMap>
            ) : (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={12}
                options={{ mapTypeControl: true, streetViewControl: false }}
                onClick={() => setActiveMapPopupId(null)}
              >
                {(() => {
                  const locationCounts: Record<string, number> = {};
                  alerts.forEach(a => {
                    if (getVillageCoordinates(a.location)) {
                      locationCounts[a.location] = (locationCounts[a.location] || 0) + 1;
                    }
                  });
                  const locationIndices: Record<string, number> = {};

                  return alerts.map((alert) => {
                    const baseCoords = getVillageCoordinates(alert.location);
                    if (!baseCoords) return null;

                    const totalAtLocation = locationCounts[alert.location];
                    const indexAtLocation = locationIndices[alert.location] || 0;
                    locationIndices[alert.location] = indexAtLocation + 1;

                    let coords = baseCoords;
                    if (totalAtLocation > 1) {
                      const radius = 0.0003;
                      const angle = (indexAtLocation / totalAtLocation) * Math.PI * 2;
                      coords = {
                        lat: baseCoords.lat + radius * Math.cos(angle),
                        lng: baseCoords.lng + radius * Math.sin(angle)
                      };
                    }

                    let fillColor = '#EAB308';
                    let riskLabel = 'Low';
                    let badgeClass = 'bg-yellow-100 text-yellow-700';
                    if (alert.caseCount >= 6) {
                      fillColor = '#EF4444';
                      riskLabel = 'High';
                      badgeClass = 'bg-rose-100 text-rose-700';
                    } else if (alert.caseCount >= 3) {
                      fillColor = '#F97316';
                      riskLabel = 'Moderate';
                      badgeClass = 'bg-orange-100 text-orange-700';
                    }

                    const isSelected = alert.id === selectedClusterId;
                    
                    const svgMarker = isSelected
                      ? `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="${fillColor}" fill-opacity="0.2" /><circle cx="24" cy="24" r="16" fill="${fillColor}" fill-opacity="0.4" /><circle cx="24" cy="24" r="10" fill="${fillColor}" stroke="#ffffff" stroke-width="3" /></svg>`
                      : `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${fillColor}" fill-opacity="0.3" /><circle cx="16" cy="16" r="8" fill="${fillColor}" stroke="#ffffff" stroke-width="2" /></svg>`;

                    const icon = {
                      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarker)}`,
                      anchor: window.google ? new window.google.maps.Point(isSelected ? 24 : 16, isSelected ? 24 : 16) : undefined
                    };

                    const isPopupActive = activeMapPopupId === alert.id;

                    return (
                      <Marker
                        key={alert.id}
                        position={coords}
                        icon={icon}
                        onClick={() => {
                          setSelectedClusterId(alert.id);
                          setActiveMapPopupId(alert.id);
                        }}
                      >
                        {isPopupActive && (
                          <InfoWindow
                            position={coords}
                            onCloseClick={() => setActiveMapPopupId(null)}
                          >
                            <div className="p-1 max-w-[200px] text-slate-800 space-y-1">
                              <strong className="block text-sm text-slate-900 border-b border-slate-200 pb-1 mb-1">{alert.location}</strong>
                              <div className="text-xs">
                                <span className="font-semibold text-slate-700">{alert.disease}</span>
                                <div className="text-rose-600 font-bold">{alert.caseCount} active cases</div>
                              </div>
                              <div className="text-xs pt-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                                  {riskLabel} Risk
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">Status: <span className="font-semibold text-slate-700">{alert.status}</span></div>
                              <div className="text-[10px] text-slate-500">First detected: {new Date(alert.createdAt || Date.now()).toLocaleDateString()}</div>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    );
                  });
                })()}
              </GoogleMap>
            )}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              {t('outbreak.legendTitle', 'Risk Severity Legend')}:
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: '#EF4444', border: '1px solid #FCA5A5' }} />
                <span className="text-slate-800">{t('outbreak.riskHigh', 'High Risk')} (&ge; 6 cases)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: '#F97316', border: '1px solid #FDBA74' }} />
                <span className="text-slate-800">{t('outbreak.riskMedium', 'Moderate Risk')} (3-5 cases)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: '#EAB308', border: '1px solid #FDE047' }} />
                <span className="text-slate-800">{t('outbreak.riskLow', 'Low Risk')} (1-2 cases)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5 min-h-[520px]">
          {selectedCluster ? (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-slate-900 text-lg">{selectedCluster.location}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    selectedCluster.caseCount >= 6 ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    selectedCluster.caseCount >= 3 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}>
                    {selectedCluster.caseCount >= 6 ? 'High' : selectedCluster.caseCount >= 3 ? 'Moderate' : 'Low'} {t('outbreak.colRisk', 'Risk')}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-semibold flex items-center justify-between">
                  <span>Disease: <strong className="text-slate-900">{selectedCluster.disease}</strong></span>
                  <span>{selectedCluster.caseCount} Active Cases</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-200/60">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>First Detected: {new Date(selectedCluster.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>{t('outbreak.caseTrend', 'Case Count Trend')}</span>
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    selectedCluster.trendPercentage && selectedCluster.trendPercentage >= 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedCluster.trendPercentage && selectedCluster.trendPercentage > 0 ? `+${selectedCluster.trendPercentage}%` : selectedCluster.trendPercentage === 0 ? '0%' : `${selectedCluster.trendPercentage}%`}
                  </span>
                </div>
                <div className="h-24 w-full relative pt-2">
                  {renderTrendSvg(selectedCluster.trendPercentage, selectedCluster.trendPercentage && selectedCluster.trendPercentage >= 0 ? 'up' : 'down')}
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                    <span>Start</span>
                    <span>Mid</span>
                    <span>Today ({selectedCluster.caseCount} cases)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  {t('outbreak.reportedSymptoms', 'Reported Symptoms')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCluster.symptoms && selectedCluster.symptoms.length > 0 ? (
                    selectedCluster.symptoms.map((sym: any, idx: number) => (
                      <span
                        key={idx}
                        className="bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                      >
                        <span>{sym.name}</span>
                        <span className="bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                          {sym.count}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">None reported</span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                {role === 'SUPERVISOR' ? (
                  <button
                    onClick={() => handleEscalateOutbreak(selectedCluster)}
                    disabled={selectedCluster.escalatedToStateHealthDepartment || isEscalating}
                    className={`w-full sm:flex-1 py-2.5 px-4 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                      selectedCluster.escalatedToStateHealthDepartment || isEscalating ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-rose-700 hover:bg-rose-800 text-white cursor-pointer'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {isEscalating ? 'Escalating...' : selectedCluster.escalatedToStateHealthDepartment ? 'Escalated to State Health Department' : t('outbreak.escalateToState', 'Escalate to State Health Department')}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNotifyHealthOfficer(selectedCluster)}
                    disabled={selectedCluster.healthOfficerNotified}
                    className={`w-full sm:flex-1 py-2.5 px-4 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                      selectedCluster.healthOfficerNotified ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>
                      {selectedCluster.healthOfficerNotified ? 'Officer Notified' : t('outbreak.notifyHealthOfficer', 'Notify Health Officer')}
                    </span>
                  </button>
                )}
                
                {selectedCluster.status !== 'Contained' && selectedCluster.status !== 'Resolved' && (
                  <button
                    onClick={() => handleMarkContained(selectedCluster)}
                    className="w-full sm:flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('outbreak.markContained', 'Mark as Contained')}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t('outbreak.clusterDetails', 'Cluster Details')}</h3>
              <p className="text-xs text-slate-500 max-w-xs font-medium">
                {alerts.length === 0 ? 'No active outbreak alerts detected for the selected period.' : t('outbreak.selectClusterPrompt', 'Select a cluster on the map to view details.')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>{t('outbreak.activeAlertsTable', 'Active Alerts')}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Comprehensive registry of active, under-review, and contained epidemic alerts across PHC sectors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('outbreak.searchPlaceholder', 'Search village or disease...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 w-48 sm:w-56"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="All">{t('outbreak.allRisks', 'All Risk Levels')}</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="All">{t('outbreak.allStatuses', 'All Statuses')}</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="Contained">Contained</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">{t('outbreak.colVillage', 'Village / Sector')}</th>
                <th className="py-3 px-4">Disease</th>
                <th className="py-3 px-4">{t('outbreak.colRisk', 'Risk Level')}</th>
                <th className="py-3 px-4">{t('outbreak.colCases', 'Case Count')}</th>
                <th className="py-3 px-4">{t('outbreak.colTrend', 'Trend')}</th>
                <th className="py-3 px-4">{t('outbreak.colStatus', 'Status')}</th>
                <th className="py-3 px-4 text-right">{t('outbreak.colActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr 
                    key={alert.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      selectedClusterId === alert.id ? 'bg-teal-50/50 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {alert.location}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {alert.disease}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        alert.caseCount >= 6 ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        alert.caseCount >= 3 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                        'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}>
                        {alert.caseCount >= 6 ? 'High' : alert.caseCount >= 3 ? 'Moderate' : 'Low'} Risk
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {alert.caseCount} cases
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`flex items-center gap-1 font-bold ${
                        alert.trendPercentage && alert.trendPercentage >= 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {alert.trendPercentage && alert.trendPercentage >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{alert.trendPercentage && alert.trendPercentage > 0 ? `+${alert.trendPercentage}%` : alert.trendPercentage === 0 ? '0%' : `${alert.trendPercentage}%`}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        alert.status === 'Contained' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        alert.status === 'Under Review' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedClusterId(alert.id);
                          setActiveMapPopupId(alert.id);
                        }}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>{t('common.view', 'View')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium text-xs">
                    No active outbreak alerts detected for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>{t('outbreak.recentActivityTitle', 'Recent Alert Activity')}</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Real-time Autonomous Feed</span>
        </div>

        <div className="space-y-3">
          {activityLogs.length > 0 ? activityLogs.map((log) => (
            <div 
              key={log.id} 
              className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-start gap-3 hover:border-slate-300 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 font-bold text-xs ${
                log.activityType === 'Detection' ? 'bg-rose-600' :
                log.activityType === 'Notification' ? 'bg-amber-500' :
                log.activityType === 'Manual Report' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                {log.activityType === 'Detection' ? <AlertTriangle className="w-4 h-4" /> :
                 log.activityType === 'Notification' ? <Bell className="w-4 h-4" /> :
                 log.activityType === 'Manual Report' ? <Send className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <strong className="font-bold text-slate-900">{log.title}</strong>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt || Date.now()).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {log.description}
                </p>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center text-slate-400 font-medium text-xs">
              No recent outbreak activity.
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {isNewClusterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>{t('outbreak.reportNewCluster', 'Report New Outbreak Cluster')}</span>
              </div>
              <button 
                onClick={() => setIsNewClusterModalOpen(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClusterSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Village / Location Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mavilayi Ward 2"
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Disease / Outbreak Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dengue Fever / Acute Diarrhea"
                  value={newDisease}
                  onChange={(e) => setNewDisease(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Initial Cases</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newCases}
                  onChange={(e) => setNewCases(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Observed Symptoms (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g., High Fever, Vomiting, Chills"
                  value={newSymptoms}
                  onChange={(e) => setNewSymptoms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClusterModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl"
                  disabled={isReporting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReporting}
                  className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors ${
                    isReporting ? 'bg-slate-400 text-slate-100 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isReporting ? 'Reporting...' : 'Submit Cluster Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
