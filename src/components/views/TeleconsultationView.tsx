import React, { useState, useEffect, useMemo } from 'react';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { 
  Video, 
  Stethoscope, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  CheckCircle2, 
  Send, 
  FileText, 
  Clock, 
  User, 
  Sparkles,
  Activity,
  ChevronRight,
  ChevronLeft,
  Filter,
  SlidersHorizontal,
  Volume2,
  Play,
  Pause,
  Share2,
  MessageSquare,
  X,
  AlertCircle,
  Info,
  MapPin,
  Heart,
  Phone
} from 'lucide-react';
import { Appointment, Patient, Consultation, HealthRecord } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useRole, USERS_BY_ROLE } from '../../context/RoleContext';
import { AnonymousPatientAvatar } from '../AnonymousPatientAvatar';
import { apiFetch } from '../../utils/api';

interface TeleconsultationViewProps {
  appointments: Appointment[];
  patients: Patient[];
  consultations?: Consultation[];
  isLoading?: boolean;
  error?: string | null;
  onUpdateConsultation?: (updated: Consultation) => void;
  initialSelectedId?: string | null;
}

export const TeleconsultationView: React.FC<TeleconsultationViewProps> = ({
  patients,
  consultations = [],
  isLoading = false,
  error = null,
  onUpdateConsultation,
  initialSelectedId = null
}) => {
  const { t, language } = useLanguage();
  const { role } = useRole();

  const isDoctor = role === 'DOCTOR';
  const isAsha = role === 'ASHA_WORKER';




  // Selected consultation case for detail panel
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  // Auto-select initial item if provided or pick first queue item
  useEffect(() => {
    if (initialSelectedId && consultations.length > 0) {
      const match = consultations.find(c => c.id === initialSelectedId);
      if (match) setSelectedConsultation(match);
    } else if (!selectedConsultation && consultations.length > 0) {
      setSelectedConsultation(consultations[0]);
    }
  }, [initialSelectedId, consultations]);

  // Queue Filter & Sort state
  const [sortBy, setSortBy] = useState<'urgent' | 'newest' | 'oldest'>('urgent');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Case detail tab state
  const [detailTab, setDetailTab] = useState<'case-info' | 'vitals-history'>('case-info');

  // Doctor advice & AI simplification state
  const [doctorNotesInput, setDoctorNotesInput] = useState<string>('');
  const [simplifiedAdvice, setSimplifiedAdvice] = useState<string | null>(null);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  // Sync doctor notes when selected consultation changes
  useEffect(() => {
    if (selectedConsultation) {
      setDoctorNotesInput(selectedConsultation.doctorNotes || '');
      setSimplifiedAdvice(selectedConsultation.simplifiedNotes || null);
    }
  }, [selectedConsultation?.id]);

  // Vitals & History State
  const [patientRecords, setPatientRecords] = useState<HealthRecord[]>([]);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);

  // Fetch Health Records dynamically
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let isActive = true;
    
    if (!selectedConsultation?.patientId) {
      setPatientRecords([]);
      setVitalsError(null);
      setIsLoadingVitals(false);
      return;
    }

    const fetchVitals = async (isPolling = false) => {
      if (!isPolling) {
        setIsLoadingVitals(true);
        // Clear previous state instantly to prevent flicker
        setPatientRecords([]);
        setVitalsError(null);
      }
      
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await apiFetch(`${baseUrl}/health-records?patientId=${selectedConsultation.patientId}`);
        const json = await res.json();
        
        if (!isActive) return;

        if (json.success) {
          // Sort records descending by date
          const sorted = json.data
            .map((r: any) => ({
              ...r,
              id: String(r.id),
              date: r.date || new Date().toISOString()
            }))
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          setPatientRecords(sorted);
          setVitalsError(null);
        } else {
          setVitalsError(json.error || 'Unable to load health records.');
        }
      } catch (err) {
        if (!isActive) return;
        setVitalsError('Unable to load health records.');
      } finally {
        if (isActive && !isPolling) setIsLoadingVitals(false);
      }
    };

    fetchVitals();
    intervalId = setInterval(() => fetchVitals(true), 30000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [selectedConsultation?.patientId]);

  const latestRecordWithVitals = patientRecords.find(r => r.vitals && Object.keys(r.vitals).length > 0);
  const latestVitals = latestRecordWithVitals?.vitals;
  
  // Calculate BP trend data
  const bpRecords = patientRecords
    .filter(r => {
      if (!r.vitals?.bp) return false;
      const parts = String(r.vitals.bp).split('/');
      const sys = Number(parts[0]);
      const dia = parts.length > 1 ? Number(parts[1]) : NaN;
      return !isNaN(sys) && !isNaN(dia);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Chronological

  // Feedback Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const optionsDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      const optionsTime: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
      
      return `${d.toLocaleDateString('en-GB', optionsDate)}, ${d.toLocaleTimeString('en-US', optionsTime)}`;
    } catch {
      return dateStr;
    }
  };

  // Filter & Sort consultations
  const filteredConsultations = useMemo(() => {
    // 1. De-duplicate patients: keep only the most recent consultation per patient
    const uniqueConsultations = new Map();
    
    // Sort chronologically descending to process newest first
    const sortedDesc = [...consultations].sort((a, b) => {
      const timeA = new Date(a.createdAt || new Date()).getTime();
      const timeB = new Date(b.createdAt || new Date()).getTime();
      return timeB - timeA;
    });

    sortedDesc.forEach(c => {
      if (!uniqueConsultations.has(c.patientId)) {
        uniqueConsultations.set(c.patientId, c);
      }
    });

    let list = Array.from(uniqueConsultations.values());

    if (statusFilter !== 'All') {
      list = list.filter(c => c.status === statusFilter);
    }

    if (sortBy === 'urgent') {
      list.sort((a, b) => {
        if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
        if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
        return 0;
      });
    } else if (sortBy === 'newest') {
      list.reverse();
    }

    return list;
  }, [consultations, statusFilter, sortBy]);

  // AI Simplification generator
  const handleSimplifyAdvice = async () => {
    if (!doctorNotesInput.trim()) {
      showToast('Please type prescription notes first.');
      return;
    }
    setIsSimplifying(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/consultations/simplify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorNotes: doctorNotesInput, language: language })
      });
      const data = await response.json();
      if (data.success && data.simplifiedNotes) {
        setSimplifiedAdvice(data.simplifiedNotes);
        showToast('Prescription simplified using AI for patient comprehension!');
      } else {
        showToast('Error simplifying prescription: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Simplify error', error);
      showToast('Error simplifying prescription.');
    } finally {
      setIsSimplifying(false);
    }
  };

  // Action: Send advice
  const handleSendAdvice = () => {
    if (selectedConsultation && onUpdateConsultation) {
      const updated = { 
        ...selectedConsultation, 
        doctorNotes: doctorNotesInput, 
        simplifiedNotes: simplifiedAdvice || undefined,
        status: 'In Progress' as const 
      };
      onUpdateConsultation(updated);
      setSelectedConsultation(updated);
    }
    showToast(t('tele.adviceSent', 'Advice sent successfully to ASHA worker!'));
  };

  // Action: Mark completed
  const handleMarkCompleted = () => {
    if (selectedConsultation && onUpdateConsultation) {
      const updated = { ...selectedConsultation, status: 'Completed' as const };
      onUpdateConsultation(updated);
      setSelectedConsultation(updated);
    }
    showToast(t('tele.statusUpdated', 'Case marked as completed!'));
  };

  // Action: Notify Patient
  const handleNotifyPatient = async () => {
    if (!selectedConsultation) return;
    setIsNotifying(true);
    
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/consultations/${selectedConsultation.id}/notify-patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('Patient acknowledged & notified.');
        if (onUpdateConsultation) {
          const updated = { ...selectedConsultation, patientNotified: true };
          onUpdateConsultation(updated);
          setSelectedConsultation(updated);
        }
      } else {
        if (data.code === 'PATIENT_EMAIL_MISSING') {
          showToast('Patient email address is not available.');
        } else if (data.alreadyNotified) {
          showToast('Patient already notified');
        } else {
          showToast('Unable to notify patient. Please try again.');
        }
      }
    } catch (error) {
      showToast('Unable to notify patient. Please try again.');
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {isLoading && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-slide-down">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span>e-Sanjeevani Tele-Medicine • {t('tele.title')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('tele.title')}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t('tele.subtitle')}
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. QUEUE VIEW (DEFAULT TWO-COLUMN LAYOUT) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: CONSULTATION QUEUE (5 Columns) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>{t('tele.consultationQueue')}</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {filteredConsultations.length} cases waiting for doctor review
                </p>
              </div>

              <span className="bg-teal-50 text-teal-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-teal-200">
                Live Queue
              </span>
            </div>

            {/* Filter / Sort Control Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              {/* Sort By Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {t('tele.sortBy')}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                >
                  <option value="urgent">{t('tele.mostUrgent')}</option>
                  <option value="newest">{t('tele.newestFirst')}</option>
                  <option value="oldest">{t('tele.oldestFirst')}</option>
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {t('tele.statusFilter')}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                >
                  <option value="All">{t('tele.allStatuses')}</option>
                  <option value="Waiting">{t('tele.waiting')}</option>
                  <option value="In Progress">{t('tele.inProgress')}</option>
                  <option value="Completed">{t('tele.completed')}</option>
                </select>
              </div>
            </div>

            {/* Queue Item List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredConsultations.length > 0 ? (
                filteredConsultations.map((item) => {
                  const isSelected = selectedConsultation?.id === item.id;
                  const isUrgent = item.priority === 'Urgent';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedConsultation(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-400 ring-2 ring-teal-600/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AnonymousPatientAvatar className="w-11 h-11" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">{item.patientName}</h3>
                              {isUrgent && (
                                <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>{t('tele.urgent')}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {item.gender} • {item.age} yrs • {item.village}
                            </p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          item.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          item.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Symptoms Snippet */}
                      <p className="text-xs text-slate-700 font-medium line-clamp-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                        "{item.symptoms}"
                      </p>

                      {/* Footer Info Row */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t('tele.submittedBy')}: <strong className="text-slate-800">{item.ashaWorkerName}</strong></span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(item.submittedAt)}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConsultation(item);
                        }}
                        className={`w-full py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{t('tele.reviewCase')}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 font-medium text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  No cases match your filter criteria.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: CASE DETAIL PANEL (7 Columns) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6 min-h-[640px]">
            {selectedConsultation ? (
              <div className="space-y-6 animate-fade-in">
                {/* Patient Summary Header */}
                <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <AnonymousPatientAvatar className="w-16 h-16" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{selectedConsultation.patientName}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          selectedConsultation.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}>
                          {selectedConsultation.priority} Priority
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {selectedConsultation.gender} • {selectedConsultation.age} yrs • {selectedConsultation.village}
                      </p>
                      <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                        Phone: {selectedConsultation.phone}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:self-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Submission</span>
                    <span className="text-xs font-bold text-slate-800">{formatDate(selectedConsultation.submittedAt)}</span>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-1 border-b border-slate-200">
                  <button
                    onClick={() => setDetailTab('case-info')}
                    className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer relative ${
                      detailTab === 'case-info'
                        ? 'text-teal-700 border-b-2 border-teal-600 font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('tele.tabCaseInfo')}
                  </button>

                  <button
                    onClick={() => setDetailTab('vitals-history')}
                    className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer relative ${
                      detailTab === 'vitals-history'
                        ? 'text-teal-700 border-b-2 border-teal-600 font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('tele.tabVitalsHistory')}
                  </button>
                </div>

                {/* TAB 1: CASE INFO */}
                {detailTab === 'case-info' && (
                  <div className="space-y-4 text-xs font-medium animate-fade-in">
                    {/* Reported Symptoms */}
                    <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        {t('tele.symptoms')}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {selectedConsultation.symptoms || 'No symptoms recorded.'}
                      </p>
                    </div>

                    {/* ASHA Notes & Visit Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {t('tele.visitType')}
                        </span>
                        <strong className="text-slate-900 text-xs">{selectedConsultation.visitType || 'Field Consultation'}</strong>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {t('tele.submittedBy')}
                        </span>
                        <strong className="text-slate-900 text-xs">{selectedConsultation.ashaWorkerName}</strong>
                      </div>
                    </div>

                    {/* ASHA Notes Card */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        {t('tele.ashaNotes')}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {selectedConsultation.ashaNotes || 'No additional notes provided by field ASHA worker.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: VITALS & HISTORY */}
                {detailTab === 'vitals-history' && (
                  <div className="space-y-5 animate-fade-in text-xs">
                    {/* Loading & Error States */}
                    {isLoadingVitals && (
                      <div className="flex items-center justify-center p-6 text-teal-600 font-bold gap-2">
                        <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading latest vitals...
                      </div>
                    )}

                    {vitalsError && !isLoadingVitals && (
                      <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-bold text-center">
                        {vitalsError}
                      </div>
                    )}

                    {!isLoadingVitals && !vitalsError && (
                      <>
                        {/* Current Vitals Cards */}
                        <div>
                          <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2.5">
                            Latest Recorded Vitals
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-center">
                              <span className="text-[10px] text-teal-700 font-bold uppercase block">Blood Pressure</span>
                              <strong className="text-sm font-black text-teal-900">{latestVitals?.bp || <span className="text-xs text-slate-400 font-semibold">Not recorded</span>}</strong>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                              <span className="text-[10px] text-amber-700 font-bold uppercase block">Pulse Rate</span>
                              <strong className="text-sm font-black text-amber-900">{latestVitals?.pulse || <span className="text-xs text-slate-400 font-semibold">Not recorded</span>}</strong>
                            </div>

                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                              <span className="text-[10px] text-blue-700 font-bold uppercase block">SpO2 Level</span>
                              <strong className="text-sm font-black text-blue-900">{latestVitals?.spO2 || <span className="text-xs text-slate-400 font-semibold">Not recorded</span>}</strong>
                            </div>

                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                              <span className="text-[10px] text-purple-700 font-bold uppercase block">Temperature</span>
                              <strong className="text-sm font-black text-purple-900">{latestVitals?.temp || <span className="text-xs text-slate-400 font-semibold">Not recorded</span>}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Vitals BP Trend SVG Chart */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-slate-800 text-xs">BP Trend History</h5>
                            {bpRecords.length > 0 && (
                              <div className="flex items-center gap-3 text-[10px] font-bold">
                                <span className="text-teal-700 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Systolic</span>
                                <span className="text-emerald-700 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Diastolic</span>
                              </div>
                            )}
                          </div>

                          {bpRecords.length === 0 ? (
                            <div className="py-6 text-center text-slate-500 font-semibold text-xs border border-dashed border-slate-200 rounded-xl bg-white">
                              No blood pressure history available.
                            </div>
                          ) : (
                            <div className="h-32 w-full relative pt-1">
                              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${Math.max(400, bpRecords.length * 100)} 90`} preserveAspectRatio="none">
                                <line x1="0" y1="15" x2="100%" y2="15" stroke="#e2e8f0" strokeDasharray="3 3" />
                                <line x1="0" y1="45" x2="100%" y2="45" stroke="#e2e8f0" strokeDasharray="3 3" />
                                <line x1="0" y1="75" x2="100%" y2="75" stroke="#cbd5e1" />

                                {bpRecords.length > 1 && (
                                  <>
                                    <path 
                                      d={bpRecords.map((r, i) => {
                                        const [sys] = String(r.vitals?.bp || '').split('/').map(Number);
                                        const y = 90 - ((sys - 80) / 100) * 60; // Approximate scaling
                                        const x = (i / (bpRecords.length - 1)) * 360 + 20;
                                        return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(y, 80))}`;
                                      }).join(' ')} 
                                      fill="none" stroke="#0d9488" strokeWidth="2.5" 
                                    />
                                    <path 
                                      d={bpRecords.map((r, i) => {
                                        const parts = String(r.vitals?.bp || '').split('/');
                                        const dia = parts.length > 1 ? Number(parts[1]) : NaN;
                                        const y = 90 - ((dia - 50) / 100) * 60; // Approximate scaling
                                        const x = (i / (bpRecords.length - 1)) * 360 + 20;
                                        return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(y, 80))}`;
                                      }).join(' ')} 
                                      fill="none" stroke="#10b981" strokeWidth="2.5" 
                                    />
                                  </>
                                )}

                                {bpRecords.map((r, i) => {
                                  const parts = String(r.vitals?.bp || '').split('/');
                                  const sys = Number(parts[0]);
                                  const dia = parts.length > 1 ? Number(parts[1]) : NaN;

                                  const sysY = 90 - ((sys - 80) / 100) * 60;
                                  const diaY = 90 - ((dia - 50) / 100) * 60;
                                  const x = bpRecords.length > 1 ? (i / (bpRecords.length - 1)) * 360 + 20 : 200;
                                  const isLast = i === bpRecords.length - 1;
                                  
                                  return (
                                    <g key={i}>
                                      <circle cx={x} cy={Math.max(10, Math.min(sysY, 80))} r={isLast ? "4.5" : "3.5"} fill="#0d9488" stroke={isLast ? "#ffffff" : "none"} strokeWidth={isLast ? "2" : "0"} />
                                      <circle cx={x} cy={Math.max(10, Math.min(diaY, 80))} r={isLast ? "4.5" : "3.5"} fill="#10b981" stroke={isLast ? "#ffffff" : "none"} strokeWidth={isLast ? "2" : "0"} />
                                    </g>
                                  );
                                })}
                              </svg>

                              <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1">
                                {bpRecords.map((r, i) => {
                                  const date = new Date(r.date);
                                  const formatted = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                                  const isLast = i === bpRecords.length - 1;
                                  const isFirst = i === 0;
                                  // Show first, last, and maybe one in middle if many, or just all if few
                                  if (bpRecords.length <= 4 || isFirst || isLast) {
                                    return <span key={i}>{formatted}</span>;
                                  }
                                  return <span key={i}></span>;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}



                {/* DOCTOR'S PRESCRIPTION & ADVICE AREA */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>{t('tele.doctorPrescription')}</span>
                    </label>

                    {/* AI Simplify Button */}
                    {isDoctor && (
                      <button
                        onClick={handleSimplifyAdvice}
                        disabled={isSimplifying}
                        title={t('tele.simplifyTooltip')}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isSimplifying ? 'Simplifying...' : t('tele.simplifyForPatient')}</span>
                      </button>
                    )}
                  </div>

                  {isDoctor ? (
                    <textarea
                      rows={3}
                      placeholder="Type prescription, diagnostic instructions, and clinical advice here..."
                      value={doctorNotesInput}
                      onChange={(e) => setDoctorNotesInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  ) : (
                    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                      {selectedConsultation.doctorNotes ? (
                        <div className="space-y-2">
                          <p className="font-medium whitespace-pre-line leading-relaxed">
                            {selectedConsultation.doctorNotes}
                          </p>
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium mt-2">
                            <span>Prescribed by {USERS_BY_ROLE['DOCTOR'].name}</span>
                            <span>•</span>
                            <span>{new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-4 text-slate-400 font-medium gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{t('tele.awaitingReview')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Simplified Advice Callout Box */}
                  {simplifiedAdvice && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium whitespace-pre-line space-y-1 animate-slide-down">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AI Patient-Friendly Summary</span>
                      </div>
                      <p>{simplifiedAdvice}</p>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS AT BOTTOM */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                  {isDoctor && (
                    <>
                      <button
                        onClick={handleMarkCompleted}
                        className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        {t('tele.markCompleted')}
                      </button>

                      <button
                        onClick={handleSendAdvice}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t('tele.sendAdvice')}</span>
                      </button>
                    </>
                  )}

                  {isDoctor && selectedConsultation.doctorNotes && (
                    <button
                      onClick={handleNotifyPatient}
                      disabled={isNotifying || selectedConsultation.patientNotified}
                      className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
                        selectedConsultation.patientNotified 
                          ? 'bg-slate-100 text-slate-500' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {selectedConsultation.patientNotified
                          ? 'Patient already notified'
                          : isNotifying 
                            ? 'Sending notification...' 
                            : 'Acknowledge / Notify Patient'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* EMPTY STATE WHEN NO CASE SELECTED */
              <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-3 my-auto">
                <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">{t('tele.caseDetail')}</h3>
                <p className="text-xs text-slate-500 max-w-sm font-medium">
                  {t('tele.selectCasePrompt')}
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
