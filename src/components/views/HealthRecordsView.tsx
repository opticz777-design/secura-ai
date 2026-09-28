import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Mic, 
  Stethoscope, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Download, 
  Edit3, 
  CalendarPlus, 
  Paperclip, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ArrowUpRight, 
  Activity, 
  HeartPulse, 
  Thermometer, 
  Weight, 
  Share2,
  Save,
  Check,
  Building2,
  FileCheck,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { Patient, HealthRecord } from '../../types';
import { INITIAL_HEALTH_RECORDS, INITIAL_PATIENTS } from '../../data/mockData';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';

interface HealthRecordsViewProps {
  patients?: Patient[];
  records?: HealthRecord[];
  isLoading?: boolean;
  error?: string | null;
  onAddRecord?: (record: Partial<HealthRecord>) => Promise<boolean>;
  onUpdateRecordStatus?: (id: string, status: string) => Promise<boolean>;
}
import { apiFetch } from '../../utils/api';

export const HealthRecordsView: React.FC<HealthRecordsViewProps> = ({ 
  patients = INITIAL_PATIENTS,
  records = INITIAL_HEALTH_RECORDS,
  isLoading = false,
  error = null,
  onAddRecord,
  onUpdateRecordStatus
}) => {
  const { t } = useLanguage();
  const { role } = useRole();

  // State Management
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [selectedVisitType, setSelectedVisitType] = useState<string>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 7;

  // Modals & Panels State
  const [activeRecord, setActiveRecord] = useState<HealthRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState<boolean>(false);
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [editedNotes, setEditedNotes] = useState<string>('');

  // Add Record Form State
  const [newPatientId, setNewPatientId] = useState<string>(patients[0]?.id || 'P-101');
  const [newVisitType, setNewVisitType] = useState<HealthRecord['visitType']>('Routine Checkup');
  const [newDate, setNewDate] = useState<string>('07 Aug 2026');
  const [newRecordedBy, setNewRecordedBy] = useState<HealthRecord['recordedBy']>('ASHA Worker');
  const [newSymptoms, setNewSymptoms] = useState<string>('');
  const [newBp, setNewBp] = useState<string>('');
  const [newPulse, setNewPulse] = useState<string>('');
  const [newTemp, setNewTemp] = useState<string>('');
  const [newWeight, setNewWeight] = useState<string>('');
  const [newSpO2, setNewSpO2] = useState<string>('');
  const [newNeedsDoctorReview, setNewNeedsDoctorReview] = useState<boolean>(false);
  const [newDoctorNotes, setNewDoctorNotes] = useState<string>('');

  // Follow-up Form State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState<boolean>(false);
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [followUpReason, setFollowUpReason] = useState<string>('');
  const [followUpPriority, setFollowUpPriority] = useState<string>('Normal');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Village Options
  const villageList = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.village));
    patients.forEach(p => set.add(p.village));
    return ['All', ...Array.from(set)];
  }, [records, patients]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        r.patientName.toLowerCase().includes(query) ||
        r.village.toLowerCase().includes(query) ||
        r.symptoms.toLowerCase().includes(query) ||
        r.summary.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query);

      // Village Filter
      const matchesVillage = selectedVillage === 'All' || r.village === selectedVillage;

      // Visit Type Filter
      const matchesType = selectedVisitType === 'All' || r.visitType === selectedVisitType;

      // Source Filter
      const matchesSource = selectedSource === 'All' || r.recordedBy === selectedSource;

      // Status Filter
      const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;

      return matchesSearch && matchesVillage && matchesType && matchesSource && matchesStatus;
    });
  }, [records, searchQuery, selectedVillage, selectedVisitType, selectedSource, selectedStatus]);

  // Paginated Records
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Stat Calculations
  const totalRecordsCount = records.length;
  const recordsThisWeek = records.filter(r => {
    if (!r.date) return false;
    const recordDate = new Date(r.date);
    const now = new Date();
    const diffTime = now.getTime() - recordDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }).length;
  const needingReviewCount = records.filter(r => r.status !== 'Reviewed').length;
  const followUpCount = records.filter(r => {
    if (!r.followUpDate) return false;
    const followUp = new Date(r.followUpDate);
    return followUp > new Date();
  }).length;

  // Submit Add New Record Form
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddRecord) return;
    
    if (newBp && !/^\d{2,3}\/\d{2,3}$/.test(newBp)) {
      alert("Please enter blood pressure in the format 120/80.");
      return;
    }

    const selPatient = patients.find(p => p.id === newPatientId) || patients[0];

    const partialRecord: Partial<HealthRecord> = {
      patientId: selPatient.id,
      visitType: newVisitType,
      date: newDate || 'Today',
      recordedBy: newRecordedBy,
      symptoms: newSymptoms || 'Routine health examination.',
      summary: newSymptoms.length > 60 ? `${newSymptoms.slice(0, 60)}...` : newSymptoms || 'Routine health examination.',
      status: newNeedsDoctorReview ? 'Pending Review' : 'Reviewed',
      vitals: {
        bp: newBp || undefined,
        pulse: newPulse ? Number(newPulse) : undefined,
        temp: newTemp || undefined,
        weight: newWeight ? Number(newWeight) : undefined,
        spO2: newSpO2 ? Number(newSpO2) : undefined
      },
      doctorNotes: newDoctorNotes || undefined
    };

    const success = await onAddRecord(partialRecord);
    if (success) {
      setIsAddModalOpen(false);
      showToast(t('records.toastAdded', 'New health record created successfully!'));

      // Reset Form
      setNewSymptoms('');
      setNewDoctorNotes('');
      setNewNeedsDoctorReview(false);
    }
  };

  // Submit Follow-up Form
  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;
    setIsSubmittingFollowUp(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: activeRecord.patientId,
          scheduledDate: followUpDate,
          reason: followUpReason,
          priority: followUpPriority,
          notes: followUpNotes
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(t('records.toastFollowUp', 'Follow-up scheduled successfully!'));
        setIsFollowUpModalOpen(false);
        setFollowUpDate('');
        setFollowUpReason('');
        setFollowUpNotes('');
      } else {
        alert("Failed to schedule follow-up: " + json.error);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activeRecord) return;
    setIsExportingPdf(true);
    showToast(t('records.toastExporting', 'Generating official health record PDF...'));
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/patients/${activeRecord.patientId}/health-record-pdf`);
      
      if (!res.ok) {
        throw new Error('Failed to generate PDF. You might not have permission.');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SynCura_Patient_${activeRecord.patientId}_Health_Record.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      showToast('Patient health record exported successfully.');
    } catch (err: any) {
      alert(err.message || "Failed to download PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Helper Badge Renderers
  const renderSourceBadge = (source: HealthRecord['recordedBy']) => {
    if (source === 'Voice Input') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md">
          <Mic className="w-3 h-3 text-purple-600" />
          <span>{t('records.voiceInput', 'Voice Input')}</span>
        </span>
      );
    }
    if (source === 'Doctor') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
          <Stethoscope className="w-3 h-3 text-blue-600" />
          <span>{t('records.doctor', 'Doctor')}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md">
        <User className="w-3 h-3 text-teal-600" />
        <span>{t('records.ashaWorker', 'ASHA Worker')}</span>
      </span>
    );
  };

  const renderVisitTypeBadge = (type: HealthRecord['visitType']) => {
    let colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';
    if (type === 'Emergency') colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    if (type === 'Pregnancy') colorClasses = 'bg-pink-50 text-pink-800 border-pink-200';
    if (type === 'Immunization') colorClasses = 'bg-purple-50 text-purple-800 border-purple-200';
    if (type === 'Routine Checkup') colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    if (type === 'Follow Up') colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    if (type === 'General Consult') colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';

    return (
      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${colorClasses}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>ABDM Integrated EHR Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('records.title', 'Health Records')}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {t('records.subtitle', 'Complete visit and medical history across all patients in your area.')}
          </p>
        </div>

        {role === 'ASHA_WORKER' && (
          <button
            id="btn-add-new-health-record"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('records.newRecord', '+ New Record')}</span>
          </button>
        )}
      </div>

      {/* SUMMARY STAT ROW (4 compact stat cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('records.totalRecords', 'Total Records')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalRecordsCount}</div>
          <p className="text-[11px] text-slate-400 font-medium">All recorded visits</p>
        </div>

        {/* Records This Week */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('records.thisWeek', 'Records This Week')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{recordsThisWeek}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +15%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Compared to last week</p>
        </div>

        {/* Records Needing Doctor Review */}
        <div className="bg-amber-50/60 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              {t('records.needingReview', 'Needing Doctor Review')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-950">{needingReviewCount}</span>
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'Pending Review' ? 'All' : 'Pending Review')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>{t('records.reviewLink', 'Review →')}</span>
            </button>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">Pending Medical Officer sign-off</p>
        </div>

        {/* Records with Follow-up Scheduled */}
        <div className="bg-blue-50/60 p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              {t('records.followUpScheduled', 'Follow-up Scheduled')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950">{followUpCount}</div>
          <p className="text-[11px] text-blue-700 font-medium">Appointments set for future date</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-health-records"
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={t('records.searchPlaceholder', 'Search by patient name, village, or diagnosis...')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
            />
          </div>

          {/* Desktop Dropdown Filters */}
          <div className="hidden lg:flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Village Filter */}
            <select
              id="select-filter-village"
              value={selectedVillage}
              onChange={(e) => { setSelectedVillage(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="All">{t('records.allVillages', 'All Villages')}</option>
              {villageList.filter(v => v !== 'All').map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Visit Type Filter */}
            <select
              id="select-filter-visit-type"
              value={selectedVisitType}
              onChange={(e) => { setSelectedVisitType(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="All">{t('records.allTypes', 'All Visit Types')}</option>
              <option value="Routine Checkup">{t('records.routineCheckup', 'Routine Checkup')}</option>
              <option value="Pregnancy">{t('records.pregnancy', 'Pregnancy')}</option>
              <option value="Immunization">{t('records.immunization', 'Immunization')}</option>
              <option value="Emergency">{t('records.emergency', 'Emergency')}</option>
              <option value="Follow Up">{t('records.followUp', 'Follow Up')}</option>
              <option value="General Consult">{t('records.generalConsult', 'General Consult')}</option>
            </select>

            {/* Source Filter */}
            <select
              id="select-filter-source"
              value={selectedSource}
              onChange={(e) => { setSelectedSource(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="All">{t('records.allSources', 'All Sources')}</option>
              <option value="ASHA Worker">{t('records.ashaWorker', 'ASHA Worker')}</option>
              <option value="Voice Input">{t('records.voiceInput', 'Voice Input')}</option>
              <option value="Doctor">{t('records.doctor', 'Doctor')}</option>
            </select>

            {/* Status Filter */}
            <select
              id="select-filter-status"
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Reviewed">{t('records.reviewed', 'Reviewed')}</option>
              <option value="Pending Review">{t('records.pendingReview', 'Pending Review')}</option>
            </select>

            {/* Reset Filters */}
            {(selectedVillage !== 'All' || selectedVisitType !== 'All' || selectedSource !== 'All' || selectedStatus !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedVillage('All');
                  setSelectedVisitType('All');
                  setSelectedSource('All');
                  setSelectedStatus('All');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 rounded-xl cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="lg:hidden w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters {selectedVillage !== 'All' || selectedVisitType !== 'All' ? '(Active)' : ''}</span>
          </button>
        </div>

        {/* Mobile Filter Panel Sheet */}
        {isMobileFiltersOpen && (
          <div className="lg:hidden grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700"
            >
              <option value="All">{t('records.allVillages', 'All Villages')}</option>
              {villageList.filter(v => v !== 'All').map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            <select
              value={selectedVisitType}
              onChange={(e) => setSelectedVisitType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700"
            >
              <option value="All">{t('records.allTypes', 'All Visit Types')}</option>
              <option value="Routine Checkup">Routine</option>
              <option value="Pregnancy">Pregnancy</option>
              <option value="Immunization">Immunization</option>
              <option value="Emergency">Emergency</option>
              <option value="Follow Up">Follow Up</option>
            </select>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700"
            >
              <option value="All">{t('records.allSources', 'All Sources')}</option>
              <option value="ASHA Worker">ASHA</option>
              <option value="Voice Input">Voice AI</option>
              <option value="Doctor">Doctor</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Pending Review">Pending</option>
            </select>
          </div>
        )}
      </div>

      {/* RECORDS TABLE (DESKTOP) / CARD LIST (MOBILE) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        
        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{t('records.colPatient', 'Patient')}</th>
                <th className="py-3.5 px-4">{t('records.colVisitType', 'Visit Type')}</th>
                <th className="py-3.5 px-4">{t('records.colDate', 'Date')}</th>
                <th className="py-3.5 px-4">{t('records.colRecordedBy', 'Recorded By')}</th>
                <th className="py-3.5 px-4">{t('records.colSummary', 'Summary')}</th>
                <th className="py-3.5 px-4">{t('records.colStatus', 'Status')}</th>
                <th className="py-3.5 px-4 text-right">{t('records.colActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No health records match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Patient Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={r.patientAvatar} 
                          alt={r.patientName} 
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0" 
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {r.patientName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {r.gender} • {r.age} yrs • {r.village}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Visit Type */}
                    <td className="py-3.5 px-4">
                      {renderVisitTypeBadge(r.visitType)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {r.date}
                    </td>

                    {/* Recorded By */}
                    <td className="py-3.5 px-4">
                      {renderSourceBadge(r.recordedBy)}
                    </td>

                    {/* Summary Snippet */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-600 font-medium truncate" title={r.symptoms}>
                        {r.summary}
                      </p>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      {r.status === 'Reviewed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t('records.reviewed', 'Reviewed')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{t('records.pendingReview', 'Pending Review')}</span>
                        </span>
                      )}
                    </td>

                    {/* Actions Button */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {role === 'DOCTOR' && r.status !== 'Reviewed' && (
                          <button
                            onClick={async () => {
                              if (onUpdateRecordStatus) {
                                const success = await onUpdateRecordStatus(r.id, 'Reviewed');
                                if (success) showToast('Record signed off successfully');
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
                          >
                            Sign Off
                          </button>
                        )}
                        <button
                          id={`btn-view-record-${r.id.toLowerCase()}`}
                          onClick={() => {
                            setActiveRecord(r);
                            setIsTranscriptExpanded(false);
                            setIsEditingNotes(false);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          {t('records.view', 'View')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE STACKED CARDS LIST */}
        <div className="block md:hidden divide-y divide-slate-100">
          {paginatedRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No health records found matching filters.
            </div>
          ) : (
            paginatedRecords.map((r) => (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img src={r.patientAvatar} alt={r.patientName} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.patientName}</h4>
                      <p className="text-[11px] text-slate-400">{r.gender} • {r.age} yrs • {r.village}</p>
                    </div>
                  </div>

                  {renderVisitTypeBadge(r.visitType)}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Date: <strong className="text-slate-800">{r.date}</strong></span>
                  {renderSourceBadge(r.recordedBy)}
                </div>

                <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                  {r.summary}
                </p>

                <div className="flex items-center justify-between pt-1">
                  {r.status === 'Reviewed' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Reviewed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Pending Review</span>
                    </span>
                  )}

                  <div className="flex gap-2">
                    {role === 'DOCTOR' && r.status !== 'Reviewed' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (onUpdateRecordStatus) {
                            const success = await onUpdateRecordStatus(r.id, 'Reviewed');
                            if (success) showToast('Record signed off successfully');
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs"
                      >
                        Sign Off
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveRecord(r);
                        setIsTranscriptExpanded(false);
                        setIsEditingNotes(false);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-700 font-bold text-xs rounded-xl shadow-2xs"
                    >
                      {t('records.view', 'View')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-semibold">
          <div>
            {t('records.showing', 'Showing')} {filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} {t('records.of', 'of')} {filteredRecords.length} records
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-pagination-prev"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border transition-colors ${
                currentPage === 1 
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  currentPage === p
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              id="btn-pagination-next"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border transition-colors ${
                currentPage === totalPages 
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* RECORD DETAIL PANEL (Slide-In Modal / Drawer) */}
      {activeRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto flex flex-col justify-between animate-slide-left">
            
            {/* PANEL HEADER */}
            <div className="p-6 bg-slate-900 text-white space-y-4 relative sticky top-0 z-10">
              <button
                id="btn-close-record-detail"
                onClick={() => setActiveRecord(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={activeRecord.patientAvatar}
                  alt={activeRecord.patientName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-teal-500 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{activeRecord.patientName}</h3>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {activeRecord.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {activeRecord.gender} • {activeRecord.age} years old • {activeRecord.village}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Visit Date: <strong className="text-white">{activeRecord.date}</strong></span>
                <span className="text-slate-600">•</span>
                {renderVisitTypeBadge(activeRecord.visitType)}
                <span className="text-slate-600">•</span>
                {renderSourceBadge(activeRecord.recordedBy)}
              </div>
            </div>

            {/* PANEL BODY CONTENT */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* 1. VITALS SECTION */}
              {activeRecord.vitals && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>{t('records.vitals', 'Vitals')}</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {/* BP */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">BP</span>
                      <strong className="text-xs font-black text-slate-900">{activeRecord.vitals.bp}</strong>
                    </div>

                    {/* Temp */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Temp</span>
                      <strong className="text-xs font-black text-slate-900">{activeRecord.vitals.temp}</strong>
                    </div>

                    {/* Pulse */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pulse</span>
                      <strong className="text-xs font-black text-slate-900">{activeRecord.vitals.pulse} bpm</strong>
                    </div>

                    {/* Weight */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Weight</span>
                      <strong className="text-xs font-black text-slate-900">{activeRecord.vitals.weight} kg</strong>
                    </div>

                    {/* SpO2 */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">SpO2</span>
                      <strong className="text-xs font-black text-slate-900">{activeRecord.vitals.spO2}%</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SYMPTOMS & NOTES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>{t('records.symptomsNotes', 'Symptoms & Notes')}</span>
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Recorded by {activeRecord.recordedByName || activeRecord.recordedBy}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        value={editedNotes || activeRecord.symptoms}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                      <button
                        onClick={() => {
                          setActiveRecord({
                            ...activeRecord,
                            symptoms: editedNotes || activeRecord.symptoms,
                            summary: editedNotes ? (editedNotes.slice(0, 50) + '...') : activeRecord.summary
                          });
                          setIsEditingNotes(false);
                          showToast('Notes updated successfully!');
                        }}
                        className="px-3 py-1.5 bg-teal-700 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {activeRecord.symptoms}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. VOICE TRANSCRIPT (IF VOICE INPUT) */}
              {activeRecord.recordedBy === 'Voice Input' && activeRecord.voiceTranscript && (
                <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                      <Mic className="w-4 h-4 text-purple-600" />
                      <span>{t('records.voiceTranscript', 'Voice Transcript')}</span>
                      <span className="text-[10px] bg-purple-200 text-purple-900 font-extrabold px-1.5 py-0.5 rounded">
                        SynCura AI
                      </span>
                    </div>

                    <button
                      onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isTranscriptExpanded ? t('records.collapse', 'Collapse') : t('records.expand', 'Expand')}</span>
                      {isTranscriptExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className={`text-xs text-slate-800 font-mono leading-relaxed bg-white/80 p-3 rounded-lg border border-purple-100 ${
                    isTranscriptExpanded ? '' : 'line-clamp-2'
                  }`}>
                    {activeRecord.voiceTranscript}
                  </div>
                </div>
              )}

              {/* 4. DOCTOR'S ADVICE */}
              {activeRecord.doctorNotes && (
                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span>{t('records.doctorAdvice', "Doctor's Advice")}</span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-800">
                      {activeRecord.doctorName || 'Medical Officer'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white/80 p-3 rounded-lg border border-blue-100">
                    {activeRecord.doctorNotes}
                  </p>
                </div>
              )}

              {/* 5. ATTACHMENTS */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-teal-600" />
                  <span>{t('records.attachments', 'Attachments')}</span>
                </h4>

                {activeRecord.attachments && activeRecord.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeRecord.attachments.map((att) => (
                      <div key={att.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">{att.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{att.type} • {att.size}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => showToast(`Downloading ${att.name}...`)}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    No attachments uploaded for this visit.
                  </p>
                )}
              </div>

              {/* 6. PATIENT VISIT HISTORY TIMELINE */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>{t('records.visitHistoryTimeline', 'Patient Visit History')}</span>
                </h4>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg inline-block border border-teal-200">
                    Visit #{activeRecord.visitHistoryNumber || 1} • Previous visit {activeRecord.previousVisitDaysAgo || 14} days ago
                  </div>

                  <div className="relative pl-4 border-l-2 border-teal-600 space-y-3">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                      <div className="text-xs font-bold text-slate-900">{activeRecord.date} (Current Visit)</div>
                      <div className="text-[11px] text-slate-500 font-medium">{activeRecord.visitType} — {activeRecord.summary}</div>
                    </div>

                    <div className="relative opacity-70">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                      <div className="text-xs font-bold text-slate-700">14 Days Ago</div>
                      <div className="text-[11px] text-slate-500 font-medium">Routine NCD Checkup & Blood Pressure Log</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* PANEL FOOTER ACTIONS */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
              <div className="flex gap-2">
                {role === 'ASHA_WORKER' && (
                  <button
                    onClick={() => {
                      setIsEditingNotes(true);
                      setEditedNotes(activeRecord.symptoms);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t('records.editRecord', 'Edit Record')}</span>
                  </button>
                )}
                {role === 'DOCTOR' && activeRecord.status !== 'Reviewed' && (
                  <button
                    onClick={async () => {
                      if (onUpdateRecordStatus) {
                        const success = await onUpdateRecordStatus(activeRecord.id, 'Reviewed');
                        if (success) {
                          setActiveRecord({ ...activeRecord, status: 'Reviewed', needsDoctorReview: false });
                          showToast('Record signed off successfully');
                        }
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Sign Off</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFollowUpModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('records.scheduleFollowUp', 'Schedule Follow-up')}</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className={`px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${isExportingPdf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Generating...' : t('records.exportPdf', 'Export as PDF')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD NEW VISIT RECORD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-scale-up border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-900">Add New Health Record</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              
              {/* Patient Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Select Patient</label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender}, {p.age} yrs - {p.village})
                    </option>
                  ))}
                </select>
              </div>

              {/* Visit Type & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Visit Type</label>
                  <select
                    value={newVisitType}
                    onChange={(e) => setNewVisitType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="Routine Checkup">Routine Checkup</option>
                    <option value="Pregnancy">Pregnancy</option>
                    <option value="Immunization">Immunization</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="General Consult">General Consult</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Recorded By Source</label>
                  <select
                    value={newRecordedBy}
                    onChange={(e) => setNewRecordedBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="ASHA Worker">ASHA Worker</option>
                    <option value="Voice Input">Voice Input (AI Sync)</option>
                    <option value="Doctor">Doctor</option>
                  </select>
                </div>
              </div>

              {/* Symptoms & Chief Complaint */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Symptoms & Chief Complaint</label>
                <textarea
                  rows={3}
                  required
                  value={newSymptoms}
                  onChange={(e) => setNewSymptoms(e.target.value)}
                  placeholder="Describe patient symptoms, clinical findings, or purpose of visit..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Vitals Inputs Grid */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Patient Vitals</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">BP</span>
                    <input
                      type="text"
                      value={newBp}
                      onChange={(e) => setNewBp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Pulse (bpm)</span>
                    <input
                      type="number"
                      value={newPulse}
                      onChange={(e) => setNewPulse(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Temp</span>
                    <input
                      type="text"
                      value={newTemp}
                      onChange={(e) => setNewTemp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Weight (kg)</span>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">SpO2 (%)</span>
                    <input
                      type="number"
                      value={newSpO2}
                      onChange={(e) => setNewSpO2(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Needs Doctor Review Toggle */}
              <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  id="chk-needs-doctor-review"
                  checked={newNeedsDoctorReview}
                  onChange={(e) => setNewNeedsDoctorReview(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                />
                <label htmlFor="chk-needs-doctor-review" className="text-xs font-bold text-amber-900 cursor-pointer">
                  Flag for Medical Officer / Doctor Review
                </label>
              </div>

              {/* Doctor's Notes (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Doctor's Advice / Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={newDoctorNotes}
                  onChange={(e) => setNewDoctorNotes(e.target.value)}
                  placeholder="Specific advice or prescriptions if doctor consulted..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Health Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE FOLLOW-UP MODAL */}
      {isFollowUpModalOpen && activeRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Schedule Follow-up</h3>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleFollowUp} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Patient</label>
                <input
                  type="text"
                  disabled
                  value={`${activeRecord.patientName} (${activeRecord.patientId})`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Priority</label>
                  <select
                    value={followUpPriority}
                    onChange={(e) => setFollowUpPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Reason</label>
                <input
                  type="text"
                  required
                  value={followUpReason}
                  onChange={(e) => setFollowUpReason(e.target.value)}
                  placeholder="e.g. Routine Checkup, Test Results"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Additional instructions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFollowUp}
                  className={`px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 ${isSubmittingFollowUp ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isSubmittingFollowUp ? 'Scheduling...' : 'Schedule Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
