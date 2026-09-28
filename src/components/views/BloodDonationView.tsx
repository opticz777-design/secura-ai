import React, { useState, useEffect } from 'react';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { HEALTH_CENTRES } from '../../config/healthCentres';
import {
  Droplet,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Plus,
  AlertCircle,
  Clock,
  Building2,
  Users,
  X,
  Filter,
  Calendar,
  Check,
  Info,
  UserPlus,
  Send,
  Edit2,
  Trash2
} from 'lucide-react';
import { BloodDonor, BloodRequest } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface BloodDonationViewProps {
  donors: BloodDonor[];
  requests: BloodRequest[];
  isLoading?: boolean;
  error?: string | null;
  onAddRequest: (req: BloodRequest) => void;
  onAddDonor?: (donor: BloodDonor) => void;
  onUpdateBloodRequest?: (req: BloodRequest) => void;
  onDeleteDonor?: (id: string) => void;
  onEditDonor?: (donor: BloodDonor) => void;
}

export const BloodDonationView: React.FC<BloodDonationViewProps> = ({
  donors,
  requests,
  isLoading,
  error,
  onAddRequest,
  onAddDonor,
  onUpdateBloodRequest,
  onDeleteDonor,
  onEditDonor
}) => {
  const { t } = useLanguage();

  // Tab state
  const [activeTab, setActiveTab] = useState<'active-requests' | 'donor-directory'>('active-requests');

  // Modals state
  const [selectedRequestForMatches, setSelectedRequestForMatches] = useState<BloodRequest | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showRegisterDonorModal, setShowRegisterDonorModal] = useState(false);
  const [editingDonorId, setEditingDonorId] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isNotifyingDonorId, setIsNotifyingDonorId] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${baseUrl}/donors/responses/all`);
        const json = await res.json();
        if (json.success) {
          setResponses(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch responses", err);
      }
    };
    fetchResponses();
    
    // Poll every 30 seconds for responses
    const interval = setInterval(fetchResponses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Local state for full list of donors if onAddDonor not provided
  const [localDonors, setLocalDonors] = useState<BloodDonor[]>([]);
  const allDonors = [...donors, ...localDonors];

  // Local state for request updates
  const [localRequests, setLocalRequests] = useState<BloodRequest[]>([]);
  const [localMatchedDonorsCount, setLocalMatchedDonorsCount] = useState<Record<string, number>>({});
  
  const allRequests = requests.map(r => {
    const updated = localRequests.find(lr => lr.id === r.id);
    return updated || r;
  });

  // Filters for Donor Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('All');
  const [filterVillage, setFilterVillage] = useState('All');
  const [filterEligibility, setFilterEligibility] = useState('All');

  // Filters for Active Requests
  const [requestFilterGroup, setRequestFilterGroup] = useState('All');
  const [requestFilterUrgency, setRequestFilterUrgency] = useState('All');

  // New Request Form State
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'>('O+');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [urgency, setUrgency] = useState<'Critical' | 'Urgent' | 'Scheduled'>('Critical');
  const [hospital, setHospital] = useState(HEALTH_CENTRES[0].name);
  const [reqVillage, setReqVillage] = useState(HEALTH_CENTRES[0].name);
  const [contactNumber, setContactNumber] = useState('+91 98765 12345');
  const [notes, setNotes] = useState('');

  // New Donor Form State
  const [donorFullName, setDonorFullName] = useState('');
  const [donorAge, setDonorAge] = useState<number>(25);
  const [donorGender, setDonorGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [donorBloodGroup, setDonorBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'>('O+');
  const [donorVillage, setDonorVillage] = useState(HEALTH_CENTRES[0].name);
  const [donorEmail, setDonorEmail] = useState('');
  const [donorLastDonated, setDonorLastDonated] = useState('3 months ago');

  const bloodGroupsList = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const villagesList = ['All', ...HEALTH_CENTRES.map(c => c.name)];

  const getDistanceKm = (villageName: string) => {
    const center = HEALTH_CENTRES.find(c => c.name === villageName);
    return center ? center.distanceValue / 1000 : 2.5;
  };
  
  const getDistanceString = (villageName: string) => {
    const center = HEALTH_CENTRES.find(c => c.name === villageName);
    return center ? center.distance : '2.5km';
  };

  // Stats calculation
  const activeRequestsCount = allRequests.filter(r => r.status !== 'Fulfilled').length;
  const registeredDonorsCount = allDonors.length;
  const successfulMatchesCount = 18;
  const avgResponseTime = '18 min';

  // Filtered Donors
  const filteredDonors = allDonors.filter(d => {
    const matchesGroup = filterBloodGroup === 'All' || d.bloodGroup === filterBloodGroup;
    const matchesVillage = filterVillage === 'All' || d.village.toLowerCase().includes(filterVillage.toLowerCase());
    const matchesEligibility = filterEligibility === 'All' || d.eligibilityStatus === filterEligibility;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery);
    return matchesGroup && matchesVillage && matchesEligibility && matchesSearch;
  });

  // Filtered Requests
  const filteredRequests = allRequests.filter(r => {
    const matchesGroup = requestFilterGroup === 'All' || r.bloodGroup === requestFilterGroup;
    const matchesUrgency = requestFilterUrgency === 'All' || r.urgency === requestFilterUrgency;
    return matchesGroup && matchesUrgency;
  });

  // Handle Create New Request
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    // Calculate matched donors count based on group
    const matchingDonorsCount = allDonors.filter(d => d.bloodGroup === bloodGroup && d.eligibilityStatus === 'Eligible').length;

    const newReq: BloodRequest = {
      id: `BR-${Date.now().toString().slice(-4)}`,
      patientName: patientName.trim(),
      bloodGroup,
      unitsNeeded: Number(unitsNeeded) || 1,
      urgency,
      hospital: hospital.trim() || HEALTH_CENTRES[0].name,
      village: reqVillage || HEALTH_CENTRES[0].name,
      postedAt: 'Just now',
      status: 'Active',
      matchedDonorsCount: matchingDonorsCount,
      requesterContact: contactNumber,
      notes
    };

    onAddRequest(newReq);
    showToast(t('bloodDonation.toastRequestPosted', 'Request posted — matching donors notified!'));

    // Reset form & close modal
    setShowNewRequestModal(false);
    setPatientName('');
    setNotes('');
  };

  // Handle Register/Edit Donor
  const handleRegisterDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorFullName.trim()) return;

    const newDonor: BloodDonor = {
      id: editingDonorId || `BD-${Date.now().toString().slice(-4)}`,
      name: donorFullName.trim(),
      bloodGroup: donorBloodGroup,
      phone: '',
      email: donorEmail,
      village: donorVillage,
      age: Number(donorAge) || 25,
      gender: donorGender,
      distanceKm: getDistanceKm(donorVillage),
      lastDonated: donorLastDonated || 'Never',
      eligibilityStatus: 'Eligible',
      isAvailable: true,
      avatar: DEFAULT_AVATAR
    };

    if (editingDonorId) {
      if (onEditDonor) {
        onEditDonor(newDonor);
      }
      showToast('Donor updated successfully!');
    } else {
      if (onAddDonor) {
        onAddDonor(newDonor);
      } else {
        setLocalDonors(prev => [newDonor, ...prev]);
      }
      showToast(t('bloodDonation.toastDonorRegistered', 'New blood donor registered successfully!'));
    }

    setShowRegisterDonorModal(false);
    setEditingDonorId(null);
    setDonorFullName('');
  };

  // Handle Mark Request Fulfilled
  const handleMarkFulfilled = (req: BloodRequest) => {
    const updated: BloodRequest = { ...req, status: 'Fulfilled' };
    if (onUpdateBloodRequest) {
      onUpdateBloodRequest(updated);
    } else {
      setLocalRequests(prev => [...prev.filter(r => r.id !== req.id), updated]);
    }
    showToast(t('bloodDonation.toastMarkedFulfilled', 'Request marked as fulfilled!'));
  };

  // Get matching donors for modal
  const getMatchingDonorsForRequest = (req: BloodRequest) => {
    return allDonors.filter(d => d.bloodGroup === req.bloodGroup || d.bloodGroup === 'O-')
      .sort((a, b) => {
        if (a.bloodGroup === req.bloodGroup && b.bloodGroup !== req.bloodGroup) return -1;
        if (a.eligibilityStatus === 'Eligible' && b.eligibilityStatus !== 'Eligible') return -1;
        return a.distanceKm - b.distanceKm;
      });
  };

  const handleNotifyDonor = async (donor: BloodDonor, request: BloodRequest) => {
    setIsNotifyingDonorId(donor.id);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/donors/${donor.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Push notification sent to ${donor.name}`, 'success');

        // Update "donors notified" count
        const updatedRequest = { ...request, matchedDonorsCount: request.matchedDonorsCount + 1 };
        if (onUpdateBloodRequest) {
          onUpdateBloodRequest(updatedRequest);
        } else {
          setLocalRequests(prev => [...prev.filter(r => r.id !== request.id), updatedRequest]);
        }
      } else {
        showToast(`Failed to send: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Failed to send: Network error or server unavailable`, 'error');
    } finally {
      setIsNotifyingDonorId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border animate-slide-up ${toastType === 'success'
            ? 'bg-slate-900 text-white border-slate-700'
            : 'bg-rose-100 text-rose-800 border-rose-300'
          }`}>
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-rose-600">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-100 border-t-rose-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Loading blood donation data...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 p-8 rounded-2xl border border-rose-200 text-center max-w-xl mx-auto my-12 animate-fade-in">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-rose-500" />
          <h3 className="text-lg font-bold text-rose-700 mb-2">Failed to load data</h3>
          <p className="text-sm text-rose-600 font-medium">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* PAGE HEADER */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
                <span>Emergency Healthcare Network</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t('bloodDonation.title', 'Blood Donation Coordination')}
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium max-w-2xl">
                {t('bloodDonation.subtitle', 'Find matching donors and manage emergency blood requests in your area.')}
              </p>
            </div>

            <div>
              <button
                id="btn-new-blood-request"
                onClick={() => setShowNewRequestModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t('bloodDonation.newRequest', '+ New Blood Request')}</span>
              </button>
            </div>
          </div>

          {/* SUMMARY STAT ROW (4 compact stat cards, same style as Dashboard) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Requests */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:border-rose-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{activeRequestsCount}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {t('bloodDonation.activeRequestsStat', 'Active Requests')}
                </div>
              </div>
            </div>

            {/* Registered Donors */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:border-blue-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{registeredDonorsCount}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {t('bloodDonation.registeredDonorsStat', 'Registered Donors')}
                </div>
              </div>
            </div>

            {/* Successful Matches This Month */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{successfulMatchesCount}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {t('bloodDonation.successfulMatchesStat', 'Successful Matches This Month')}
                </div>
              </div>
            </div>

            {/* Avg. Response Time */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:border-amber-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{avgResponseTime}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {t('bloodDonation.avgResponseTimeStat', 'Avg. Response Time')}
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-2">
              <button
                id="tab-active-requests"
                onClick={() => setActiveTab('active-requests')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'active-requests'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Droplet className="w-4 h-4" />
                <span>{t('bloodDonation.tabActiveRequests', 'Active Requests')}</span>
                <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${activeTab === 'active-requests' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {activeRequestsCount}
                </span>
              </button>

              <button
                id="tab-donor-directory"
                onClick={() => setActiveTab('donor-directory')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'donor-directory'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>{t('bloodDonation.tabDonorDirectory', 'Donor Directory')}</span>
                <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${activeTab === 'donor-directory' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {registeredDonorsCount}
                </span>
              </button>
            </div>

            {activeTab === 'donor-directory' && (
              <button
                id="btn-register-new-donor"
                onClick={() => {
                  setEditingDonorId(null);
                  setDonorFullName('');
                  setDonorEmail('');
                  setShowRegisterDonorModal(true);
                }}
                className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('bloodDonation.registerDonor', '+ Register New Donor')}</span>
              </button>
            )}
          </div>

          {/* TAB 1: ACTIVE REQUESTS */}
          {activeTab === 'active-requests' && (
            <div className="space-y-4">
              {/* Active Requests Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Filter Requests:
                  </span>

                  {/* Group Filter */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Group:</span>
                    <select
                      value={requestFilterGroup}
                      onChange={(e) => setRequestFilterGroup(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {bloodGroupsList.map(g => (
                        <option key={g} value={g}>{g === 'All' ? 'All Groups' : g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Urgency Filter */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Urgency:</span>
                    <select
                      value={requestFilterUrgency}
                      onChange={(e) => setRequestFilterUrgency(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="All">All Urgencies</option>
                      <option value="Critical">Critical</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>

                <div className="text-slate-500 font-semibold">
                  Showing {filteredRequests.length} of {allRequests.length} requests
                </div>
              </div>

              {/* Request Cards List */}
              {filteredRequests.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                  <Droplet className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
                  <h3 className="text-base font-bold text-slate-800">
                    {t('bloodDonation.noRequestsFound', 'No blood requests matching your filters.')}
                  </h3>
                  <p className="text-xs text-slate-500">Try adjusting your filters or create a new request.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRequests.map((req) => {
                    const isFulfilled = req.status === 'Fulfilled';

                    return (
                      <div
                        key={req.id}
                        className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-4 transition-all hover:shadow-md ${isFulfilled
                            ? 'border-slate-200 opacity-75'
                            : req.urgency === 'Critical'
                              ? 'border-rose-300 bg-rose-50/30'
                              : 'border-slate-200/80 hover:border-slate-300'
                          }`}
                      >
                        {/* Top Row: Blood Group Badge + Urgency Tag */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl font-black text-base flex items-center justify-center shrink-0 shadow-md ${isFulfilled
                                ? 'bg-slate-300 text-slate-700'
                                : 'bg-rose-600 text-white shadow-rose-600/20'
                              }`}>
                              {req.bloodGroup}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900 leading-tight">
                                {req.patientName}
                              </h3>
                              <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                  {req.hospital}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {req.village}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Urgency Badge */}
                          {isFulfilled ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                              {t('bloodDonation.fulfilledTag', 'Fulfilled')}
                            </span>
                          ) : (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-2xs ${req.urgency === 'Critical'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : req.urgency === 'Urgent'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}>
                              {req.urgency === 'Critical' && t('bloodDonation.urgencyCritical', 'Critical')}
                              {req.urgency === 'Urgent' && t('bloodDonation.urgencyUrgent', 'Urgent')}
                              {req.urgency === 'Scheduled' && t('bloodDonation.urgencyScheduled', 'Scheduled')}
                            </span>
                          )}
                        </div>

                        {/* Details Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-medium block">Units Needed</span>
                            <strong className="text-slate-900 text-sm">{req.unitsNeeded} Units</strong>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-medium block">Posted Time</span>
                            <strong className="text-slate-900 text-sm">{req.postedAt}</strong>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                            <span className="text-slate-400 font-medium block">Requester Contact</span>
                            <strong className="text-slate-900 text-sm">{req.requesterContact || '+91 98765 00000'}</strong>
                          </div>
                        </div>

                        {req.notes && (
                          <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 font-medium">
                            <strong className="text-amber-800">Note:</strong> {req.notes}
                          </p>
                        )}

                        {/* Bottom Row: Matched Donors snippet + Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Matched Donors Count with Avatar Stack */}
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 overflow-hidden">
                              {allDonors
                                .filter(d => d.bloodGroup === req.bloodGroup)
                                .slice(0, 3)
                                .map((d, i) => (
                                  <img
                                    key={i}
                                    src={d.avatar}
                                    alt={d.name}
                                    className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                                  />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                              {req.matchedDonorsCount} {req.matchedDonorsCount === 1 ? t('bloodDonation.donorNotified', 'donor notified') : t('bloodDonation.donorsNotified', 'donors notified')}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              id={`btn-view-matches-${req.id}`}
                              onClick={() => setSelectedRequestForMatches(req)}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>{t('bloodDonation.viewMatches', 'View Matches')}</span>
                            </button>

                            {!isFulfilled && (
                              <button
                                id={`btn-mark-fulfilled-${req.id}`}
                                onClick={() => handleMarkFulfilled(req)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{t('bloodDonation.markFulfilled', 'Mark Fulfilled')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DONOR DIRECTORY */}
          {activeTab === 'donor-directory' && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Search */}
                  <div className="md:col-span-4 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder={t('bloodDonation.searchPlaceholder', 'Search donor by name or village...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  {/* Blood Group Filter */}
                  <div className="md:col-span-3">
                    <select
                      value={filterBloodGroup}
                      onChange={(e) => setFilterBloodGroup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="All">All Blood Groups</option>
                      {bloodGroupsList.filter(g => g !== 'All').map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Village Filter */}
                  <div className="md:col-span-3">
                    <select
                      value={filterVillage}
                      onChange={(e) => setFilterVillage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {villagesList.map(v => (
                        <option key={v} value={v}>{v === 'All' ? 'All Villages' : v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Eligibility Filter */}
                  <div className="md:col-span-2">
                    <select
                      value={filterEligibility}
                      onChange={(e) => setFilterEligibility(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Eligible">Eligible</option>
                      <option value="Not Eligible">Not Eligible</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Desktop Donor Directory Table & Mobile Stack */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Donor Name</th>
                        <th className="p-4">Blood Group</th>
                        <th className="p-4">Village</th>
                        <th className="p-4">Age / Gender</th>
                        <th className="p-4">Last Donated</th>
                        <th className="p-4">Eligibility Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {filteredDonors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 font-semibold">
                            {t('bloodDonation.noDonorsFound', 'No matching donors found for selected criteria.')}
                          </td>
                        </tr>
                      ) : (
                        filteredDonors.map((donor) => {
                          const isEligible = donor.eligibilityStatus === 'Eligible';

                          return (
                            <tr key={donor.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={donor.avatar}
                                    alt={donor.name}
                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900">{donor.name}</div>
                                    <div className="text-[11px] text-slate-400">{donor.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-4">
                                <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-900 text-white font-black text-xs">
                                  {donor.bloodGroup}
                                </span>
                              </td>

                              <td className="p-4">
                                <div className="flex items-center gap-1 font-semibold text-slate-700">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{donor.village}</span>
                                  <span className="text-slate-400 font-normal">({getDistanceString(donor.village)})</span>
                                </div>
                              </td>

                              <td className="p-4 font-semibold text-slate-700">
                                {donor.age} yrs • {donor.gender || 'Male'}
                              </td>

                              <td className="p-4 text-slate-600 font-semibold">
                                {donor.lastDonated}
                              </td>

                              <td className="p-4">
                                {isEligible ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {t('bloodDonation.eligible', 'Eligible')}
                                  </span>
                                ) : (
                                  <div className="group relative inline-block">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 cursor-help">
                                      <Info className="w-3.5 h-3.5 text-amber-600" />
                                      {t('bloodDonation.notEligible', 'Not Eligible')}
                                    </span>
                                    {/* Tooltip explaining eligible date */}
                                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-20 font-semibold">
                                      {t('bloodDonation.eligibleAgainOn', 'Eligible again on')} {donor.eligibleDate || '3 months'}
                                    </div>
                                  </div>
                                )}
                              </td>

                                <td className="p-4 text-right flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    if (onEditDonor) {
                                      setEditingDonorId(donor.id);
                                      setDonorFullName(donor.name);
                                      setDonorAge(donor.age || 25);
                                      setDonorGender(donor.gender as any || 'Male');
                                      setDonorBloodGroup(donor.bloodGroup as any);
                                      setDonorVillage(donor.village);
                                      setDonorEmail(donor.email || '');
                                      setDonorLastDonated(donor.lastDonated || 'Never');
                                      setShowRegisterDonorModal(true);
                                    }
                                  }}
                                  className="inline-flex items-center justify-center p-2 rounded-xl border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 transition-colors cursor-pointer"
                                  title="Edit Donor"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteDonor && onDeleteDonor(donor.id)}
                                  className="inline-flex items-center justify-center p-2 rounded-xl border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 transition-colors cursor-pointer"
                                  title="Delete Donor"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stack Cards */}
                <div className="block lg:hidden divide-y divide-slate-100">
                  {filteredDonors.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 font-semibold text-xs">
                      {t('bloodDonation.noDonorsFound', 'No matching donors found for selected criteria.')}
                    </div>
                  ) : (
                    filteredDonors.map((donor) => {
                      const isEligible = donor.eligibilityStatus === 'Eligible';

                      return (
                        <div key={donor.id} className="p-4 space-y-3 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={donor.avatar}
                                alt={donor.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                              />
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{donor.name}</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">{donor.email}</div>
                                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{donor.village} ({getDistanceString(donor.village)})</span>
                                </div>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-black text-xs shrink-0">
                              {donor.bloodGroup}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                            <div>
                              <span className="text-slate-400 font-medium block">Age & Gender</span>
                              <strong>{donor.age} yrs • {donor.gender || 'Male'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block">Last Donated</span>
                              <strong>{donor.lastDonated}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex gap-2">
                                {/* Removing bad response pill */}
                            </div>
                            {isEligible ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Eligible
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                <Info className="w-3 h-3" />
                                Eligible on {donor.eligibleDate || '3 mos'}
                              </span>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (onEditDonor) {
                                    setEditingDonorId(donor.id);
                                    setDonorFullName(donor.name);
                                    setDonorAge(donor.age || 25);
                                    setDonorGender(donor.gender as any || 'Male');
                                    setDonorBloodGroup(donor.bloodGroup as any);
                                    setDonorVillage(donor.village);
                                    setDonorEmail(donor.email || '');
                                    setDonorLastDonated(donor.lastDonated || 'Never');
                                    setShowRegisterDonorModal(true);
                                  }
                                }}
                                className="inline-flex items-center justify-center p-2 rounded-xl border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 transition-colors cursor-pointer"
                                title="Edit Donor"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteDonor && onDeleteDonor(donor.id)}
                                className="inline-flex items-center justify-center p-2 rounded-xl border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 transition-colors cursor-pointer"
                                title="Delete Donor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: VIEW MATCHES MODAL */}
      {selectedRequestForMatches && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Droplet className="w-5 h-5 fill-white text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {t('bloodDonation.matchedDonorsHeader', 'Ranked Matching Donors')}
                  </h3>
                  <p className="text-xs text-rose-100 font-medium">
                    For {selectedRequestForMatches.patientName} ({selectedRequestForMatches.bloodGroup})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequestForMatches(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Context Bar */}
            <div className="p-4 bg-rose-50/80 border-b border-rose-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Hospital</span>
                <strong className="text-slate-900">{selectedRequestForMatches.hospital}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Village</span>
                <strong className="text-slate-900">{selectedRequestForMatches.village}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Units Needed</span>
                <strong className="text-slate-900">{selectedRequestForMatches.unitsNeeded} Units</strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Urgency</span>
                <strong className="text-rose-700">{selectedRequestForMatches.urgency}</strong>
              </div>
            </div>

            {/* Donor List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ranked by Proximity & Blood Compatibility
              </h4>

              {getMatchingDonorsForRequest(selectedRequestForMatches).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-semibold">
                  No matching donors currently registered in database.
                </div>
              ) : (
                getMatchingDonorsForRequest(selectedRequestForMatches).map((donor, idx) => (
                  <div
                    key={donor.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={donor.avatar}
                          alt={donor.name}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100"
                        />
                        <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">{donor.name}</h5>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-black">
                            {donor.bloodGroup}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <span>{donor.village} ({getDistanceString(donor.village)} away)</span>
                          <span>•</span>
                          <span>Last: {donor.lastDonated}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      {responses.find(r => String(r.donorId) === String(donor.id) && String(r.bloodRequestId) === String(selectedRequestForMatches?.id)) && (
                         <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${responses.find(r => String(r.donorId) === String(donor.id) && String(r.bloodRequestId) === String(selectedRequestForMatches?.id))?.response === 'WILLING' ? 'text-emerald-800 bg-emerald-100 border-emerald-200' : 'text-rose-800 bg-rose-100 border-rose-200'}`}>
                           {responses.find(r => String(r.donorId) === String(donor.id) && String(r.bloodRequestId) === String(selectedRequestForMatches?.id))?.response === 'WILLING' ? '🟢 Willing to Donate' : '🔴 Unavailable'}
                         </span>
                      )}

                      {donor.eligibilityStatus === 'Eligible' ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                          Eligible
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                          Not Eligible
                        </span>
                      )}

                      <button
                        onClick={() => handleNotifyDonor(donor, selectedRequestForMatches)}
                        disabled={isNotifyingDonorId === donor.id}
                        className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isNotifyingDonorId === donor.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Phone className="w-3.5 h-3.5" />
                        )}
                        <span>{isNotifyingDonorId === donor.id ? 'Sending...' : t('bloodDonation.contactDonor', 'Contact Donor')}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRequestForMatches(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW BLOOD REQUEST MODAL */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600 fill-rose-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {t('bloodDonation.createModalTitle', 'Create New Emergency Blood Request')}
                </h3>
              </div>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Patient Name & Medical Condition *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Devi (Severe Postpartum Hemorrhage)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Blood Group *</label>
                  <select
                    value={bloodGroup}
                    onChange={(e: any) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {bloodGroupsList.filter(g => g !== 'All').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Units Needed *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={unitsNeeded}
                    onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">Urgency Level *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Critical', 'Urgent', 'Scheduled'] as const).map((u) => (
                    <label
                      key={u}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center cursor-pointer transition-all ${urgency === u
                          ? u === 'Critical' ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                            : u === 'Urgent' ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-xs'
                              : 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      <input
                        type="radio"
                        name="urgency"
                        value={u}
                        checked={urgency === u}
                        onChange={() => setUrgency(u)}
                        className="sr-only"
                      />
                      <span className="text-xs">{u}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Hospital / PHC Name *</label>
                  <input
                    type="text"
                    required
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Village *</label>
                  <select
                    value={reqVillage}
                    onChange={(e) => setReqVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {villagesList.filter(v => v !== 'All').map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Patient admitted in ICU, urgent blood requirement before morning C-section."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTER NEW DONOR MODAL */}
      {showRegisterDonorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                {editingDonorId ? 'Edit Blood Donor' : t('bloodDonation.registerDonor', 'Register New Blood Donor')}
              </h3>
              <button
                onClick={() => {
                  setShowRegisterDonorModal(false);
                  setEditingDonorId(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDonor} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Nair"
                  value={donorFullName}
                  onChange={(e) => setDonorFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Age *</label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={donorAge}
                    onChange={(e) => setDonorAge(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender</label>
                  <select
                    value={donorGender}
                    onChange={(e: any) => setDonorGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Blood Group *</label>
                  <select
                    value={donorBloodGroup}
                    onChange={(e: any) => setDonorBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {bloodGroupsList.filter(g => g !== 'All').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Village *</label>
                  <select
                    value={donorVillage}
                    onChange={(e) => setDonorVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {villagesList.filter(v => v !== 'All').map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Last Donation Date / Timeframe</label>
                <input
                  type="text"
                  placeholder="e.g. 4 months ago or Jan 2026"
                  value={donorLastDonated}
                  onChange={(e) => setDonorLastDonated(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterDonorModal(false);
                    setEditingDonorId(null);
                  }}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingDonorId ? 'Save Changes' : 'Register Donor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
