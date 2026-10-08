import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  FileText, 
  Activity, 
  Heart, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  X, 
  Stethoscope,
  Plus,
  Filter,
  MoreVertical,
  Download,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  Eye,
  CalendarPlus
} from 'lucide-react';
import { Patient, PatientStatus, VisitRecord, VitalRecord, PatientDocument, HealthRecord } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { HEALTH_CENTRES } from '../../config/healthCentres';
import { useRole, USERS_BY_ROLE } from '../../context/RoleContext';

interface PatientsViewProps {
  patients: Patient[];
  isLoading?: boolean;
  error?: string | null;
  onOpenAddPatientModal: () => void;
  onOpenEditPatientModal?: (patient: Patient) => void;
  onSelectPatientForConsultation: (patient: Patient) => void;
  onDeletePatient?: (id: string) => void;
  onAddRecord?: (record: Partial<HealthRecord>) => Promise<boolean>;
}

import { AddVisitModal } from '../modals/AddVisitModal';
import { ScheduleFollowUpModal } from '../modals/ScheduleFollowUpModal';
import { UploadDocumentModal } from '../modals/UploadDocumentModal';
import { StartConsultationModal } from '../modals/StartConsultationModal';
import { apiFetch } from '../../utils/api';

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  isLoading,
  error,
  onOpenAddPatientModal,
  onOpenEditPatientModal,
  onSelectPatientForConsultation,
  onDeletePatient,
  onAddRecord
}) => {
  const { t } = useLanguage();
  const { role } = useRole();
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [isStartConsultationModalOpen, setIsStartConsultationModalOpen] = useState(false);

  // Real Documents State
  const [patientDocuments, setPatientDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Patient for Side Drawer / Modal Detail
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailTab, setDetailTab] = useState<'Overview' | 'Visit History' | 'Vitals' | 'Documents'>('Overview');

  // Menu dropdown state for row actions
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Toast / Feedback state
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Prescription Form State
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    medication: '',
    dosage: '',
    instructions: ''
  });
  const [isSendingPrescription, setIsSendingPrescription] = useState<string | null>(null);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);

  const handleSendPrescription = async (target: 'PATIENT' | 'ASHA') => {
    if (!selectedPatient) return;
    if (!prescriptionForm.diagnosis || !prescriptionForm.medication || !prescriptionForm.dosage || !prescriptionForm.instructions) {
      setPrescriptionError('All fields are required.');
      return;
    }
    
    setIsSendingPrescription(target);
    setPrescriptionError(null);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await apiFetch(`${baseUrl}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          sendTarget: target,
          ...prescriptionForm
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        let successMsg = `Prescription sent to ${target === 'PATIENT' ? 'Patient' : 'ASHA Worker'} successfully.`;
        
        if (target === 'PATIENT' && data.meta?.emailStatus) {
          if (data.meta.emailStatus === 'Not sent - no email available') {
            successMsg = 'Prescription saved, but Patient has no email address on file.';
          } else if (data.meta.emailStatus === 'Failed to send') {
            successMsg = 'Prescription saved, but email delivery failed.';
          }
        }
        
        setActionFeedback(successMsg);
        setTimeout(() => setActionFeedback(null), 4000);
        setIsPrescriptionModalOpen(false);
        setPrescriptionForm({ diagnosis: '', medication: '', dosage: '', instructions: '' });
      } else {
        setPrescriptionError(data.error || 'Failed to send prescription');
      }
    } catch (err: any) {
      setPrescriptionError(err.message || 'An error occurred');
    } finally {
      setIsSendingPrescription(null);
    }
  };

  // Village options extracted dynamically from dataset
  const villageOptions = ['All Villages', ...HEALTH_CENTRES.map(c => c.name)];

  // Translation helpers
  const getStatusTranslation = (statusStr: string) => {
    if (statusStr === 'Consulted') return t('status.consulted', 'Consulted');
    if (statusStr === 'Follow Up') return t('status.followUp', 'Follow Up');
    if (statusStr === 'Registered') return t('status.registered', 'Registered');
    if (statusStr === 'Critical') return t('status.critical', 'Critical');
    return statusStr;
  };

  const getGenderTranslation = (genderStr: string) => {
    if (genderStr === 'Male') return t('patients.male', 'Male');
    if (genderStr === 'Female') return t('patients.female', 'Female');
    if (genderStr === 'Other') return t('patients.other', 'Other');
    return genderStr;
  };

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
                            p.name.toLowerCase().includes(query) || 
                            p.village.toLowerCase().includes(query) ||
                            p.phone.includes(query) ||
                            (p.abhaId && p.abhaId.includes(query));

      const matchesVillage = selectedVillage === 'All' || selectedVillage === 'All Villages' || p.village.includes(selectedVillage);
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      const matchesGender = selectedGender === 'All' || p.gender === selectedGender;

      return matchesSearch && matchesVillage && matchesStatus && matchesGender;
    });
  }, [patients, searchQuery, selectedVillage, selectedStatus, selectedGender]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedVillage, selectedStatus, selectedGender]);

  // Paginated patients
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  // Fetch documents when tab changes to Documents
  React.useEffect(() => {
    if (selectedPatient && detailTab === 'Documents') {
      fetchDocuments(selectedPatient.id);
    }
  }, [detailTab, selectedPatient?.id]);

  const fetchDocuments = async (patientId: string) => {
    setIsLoadingDocuments(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/patients/${patientId}/documents`);
      const data = await res.json();
      if (data.success) {
        setPatientDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Real Vitals State
  const [patientVitals, setPatientVitals] = useState<any[]>([]);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);

  const fetchVitals = async (patientId: string, abortController?: AbortController) => {
    setIsLoadingVitals(true);
    setVitalsError(null);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/health-records?patientId=${patientId}`, {
        signal: abortController?.signal
      });
      const data = await res.json();
      if (data.success) {
        // Explicitly sort chronologically by date/createdAt to ensure reliable Latest Vitals calculation
        const sorted = (data.data || []).sort((a: any, b: any) => {
          const tA = new Date(a.date || a.createdAt).getTime();
          const tB = new Date(b.date || b.createdAt).getTime();
          return tA - tB;
        });
        setPatientVitals(sorted);
      } else {
        setVitalsError('Unable to load health records.');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching vitals', error);
        setVitalsError('Unable to load health records.');
      }
    } finally {
      setIsLoadingVitals(false);
    }
  };

  React.useEffect(() => {
    let abortController = new AbortController();
    let interval: NodeJS.Timeout;

    if (selectedPatient && detailTab === 'Vitals') {
      setPatientVitals([]); // Clear stale data from previous patient immediately
      fetchVitals(selectedPatient.id, abortController);
      interval = setInterval(() => {
        fetchVitals(selectedPatient.id, abortController);
      }, 30000);
    }

    return () => {
      abortController.abort();
      if (interval) clearInterval(interval);
    };
  }, [selectedPatient?.id, detailTab]);

  const handleAction = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Toast Feedback Banner */}
      {actionFeedback && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-slide-down">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-teal-600">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-100 border-t-teal-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Loading patients...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 p-8 rounded-2xl border border-rose-200 text-center max-w-xl mx-auto my-12 animate-fade-in">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-rose-500" />
          <h3 className="text-lg font-bold text-rose-700 mb-2">Failed to load data</h3>
          <p className="text-sm text-rose-600 font-medium">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* PAGE HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-teal-600" />
            <span>{t('patients.title')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.patients')}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t('patients.subtitle')}
          </p>
        </div>

        {/* Top Right Quick Actions Button */}
        {role === 'ASHA_WORKER' && (
          <button
            onClick={onOpenAddPatientModal}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ {t('patients.addPatient', 'Add Patient')}</span>
          </button>
        )}
      </div>

      {/* FILTER / SEARCH BAR (DESKTOP) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={t('patients.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="md:hidden w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal-600" />
            <span>{t('common.filter')} ({selectedVillage !== 'All' ? 1 : 0} + {selectedStatus !== 'All' ? 1 : 0} + {selectedGender !== 'All' ? 1 : 0})</span>
          </button>

          {/* Desktop Filter Dropdowns */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Village Dropdown */}
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              {villageOptions.map(v => (
                <option key={v} value={v}>{v === 'All Villages' ? t('patients.allVillages') : v}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="All">{t('patients.allStatuses')}</option>
              <option value="Registered">{t('status.registered')}</option>
              <option value="Consulted">{t('status.consulted')}</option>
              <option value="Follow Up">{t('status.followUp')}</option>
              <option value="Critical">{t('status.critical')}</option>
            </select>

            {/* Gender Dropdown */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="All">{t('patients.allGenders')}</option>
              <option value="Male">{t('patients.male')}</option>
              <option value="Female">{t('patients.female')}</option>
              <option value="Other">{t('patients.other')}</option>
            </select>

            {/* Clear Filters Button */}
            {(selectedVillage !== 'All' || selectedStatus !== 'All' || selectedGender !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedVillage('All');
                  setSelectedStatus('All');
                  setSelectedGender('All');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 px-2.5 py-2 underline cursor-pointer"
              >
                {t('common.reset')}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Filters Sheet for Mobile */}
        {mobileFiltersOpen && (
          <div className="md:hidden pt-3 border-t border-slate-100 grid grid-cols-1 gap-3.5 animate-slide-down">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{t('patients.village')}</label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
              >
                {villageOptions.map(v => (
                  <option key={v} value={v}>{v === 'All Villages' ? t('patients.allVillages') : v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{t('patients.status')}</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
              >
                <option value="All">{t('patients.allStatuses')}</option>
                <option value="Registered">{t('status.registered')}</option>
                <option value="Consulted">{t('status.consulted')}</option>
                <option value="Follow Up">{t('status.followUp')}</option>
                <option value="Critical">{t('status.critical')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">{t('patients.gender')}</label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
              >
                <option value="All">{t('patients.allGenders')}</option>
                <option value="Male">{t('patients.male')}</option>
                <option value="Female">{t('patients.female')}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP PATIENT TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">{t('patients.name', 'Name')}</th>
                <th className="p-4">{t('patients.age', 'Age')}</th>
                <th className="p-4">{t('patients.gender', 'Gender')}</th>
                <th className="p-4">{t('patients.village', 'Village')}</th>
                <th className="p-4">{t('patients.lastVisit', 'Last Visit')}</th>
                <th className="p-4">{t('patients.status', 'Status')}</th>
                <th className="p-4 text-right">{t('patients.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient) => {
                  let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (patient.status === 'Consulted') {
                    badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
                  } else if (patient.status === 'Follow Up') {
                    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                  } else if (patient.status === 'Critical') {
                    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                  }

                  return (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setDetailTab('Overview');
                      }}
                    >
                      {/* Avatar + Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={patient.avatar}
                            alt={patient.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                              {patient.name}
                            </div>
                            <div className="text-slate-400 text-[11px] font-mono">
                              {patient.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Age */}
                      <td className="p-4 font-semibold text-slate-700">
                        {patient.age} {t('common.years', 'yrs')}
                      </td>

                      {/* Gender */}
                      <td className="p-4 text-slate-600">
                        {getGenderTranslation(patient.gender)}
                      </td>

                      {/* Village */}
                      <td className="p-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{patient.village}</span>
                        </div>
                      </td>

                      {/* Last Visit */}
                      <td className="p-4 text-slate-500 font-medium">
                        {patient.lastVisit}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold border text-[11px] inline-block ${badgeStyle}`}>
                          {getStatusTranslation(patient.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setDetailTab('Overview');
                            }}
                            className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-3 py-1.5 rounded-xl border border-teal-200/80 text-xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>{t('common.view')}</span>
                          </button>

                          {role === 'ASHA_WORKER' && (
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === patient.id ? null : patient.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="More Options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMenuId === patient.id && (
                                <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 w-36 py-1.5 text-xs text-left animate-scale-up">
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      if (onOpenEditPatientModal) {
                                        onOpenEditPatientModal(patient);
                                      }
                                    }}
                                    className="w-full px-3.5 py-2 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{t('common.edit')}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      if (onDeletePatient) {
                                        onDeletePatient(patient.id);
                                        handleAction(`Patient ${patient.name} deleted`);
                                      } else {
                                        handleAction(`Patient ${patient.name} archived`);
                                      }
                                    }}
                                    className="w-full px-3.5 py-2 hover:bg-rose-50 font-medium text-rose-600 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>{t('common.delete')}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                    No patients match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div>
            Showing <strong className="text-slate-900">{filteredPatients.length > 0 ? startIndex + 1 : 0}</strong> - <strong className="text-slate-900">{Math.min(startIndex + itemsPerPage, filteredPatients.length)}</strong> of <strong className="text-slate-900">{filteredPatients.length}</strong> patients
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            <span className="font-bold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE PATIENT CARD LIST VIEW */}
      <div className="md:hidden space-y-3">
        {paginatedPatients.length > 0 ? (
          paginatedPatients.map((patient) => {
            let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
            if (patient.status === 'Consulted') {
              badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
            } else if (patient.status === 'Follow Up') {
              badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
            } else if (patient.status === 'Critical') {
              badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
            }

            return (
              <div
                key={patient.id}
                onClick={() => {
                  setSelectedPatient(patient);
                  setDetailTab('Overview');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 cursor-pointer active:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={patient.avatar}
                      alt={patient.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{patient.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {getGenderTranslation(patient.gender)} • {patient.age} {t('common.years', 'yrs')} • {patient.village}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] shrink-0 ${badgeStyle}`}>
                    {getStatusTranslation(patient.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600 font-medium">
                  <div>Last Visit: <span className="font-bold text-slate-800">{patient.lastVisit}</span></div>
                  <div className="flex items-center gap-1 text-teal-700 font-bold">
                    <span>{t('common.view')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium text-xs">
            No patients match your search.
          </div>
        )}

        {/* Mobile Pagination */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-100 rounded-xl font-bold disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-100 rounded-xl font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* PATIENT DETAIL PANEL (SLIDE-IN MODAL) */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col h-full sm:h-[92vh] max-h-[92vh] overflow-hidden my-auto border border-slate-200">
            {/* Panel Header */}
            <div className="p-6 bg-slate-50/80 border-b border-slate-200 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedPatient.avatar}
                    alt={selectedPatient.name}
                    className="w-14 h-14 rounded-full object-cover ring-4 ring-teal-600/20 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${
                        selectedPatient.status === 'Consulted' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                        selectedPatient.status === 'Follow Up' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        selectedPatient.status === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {getStatusTranslation(selectedPatient.status)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {getGenderTranslation(selectedPatient.gender)} • {selectedPatient.age} {t('common.years', 'yrs')} • {selectedPatient.village}
                    </p>
                    <p className="text-xs text-slate-700 font-mono font-semibold mt-0.5">
                      Phone: {selectedPatient.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 mt-6 border-b border-slate-200 overflow-x-auto">
                {(['Overview', 'Visit History', 'Vitals', 'Documents'] as const).map((tab) => {
                  let tabLabel = tab;
                  if (tab === 'Overview') tabLabel = t('patients.overview') as any;
                  if (tab === 'Visit History') tabLabel = t('patients.visitHistory') as any;
                  if (tab === 'Vitals') tabLabel = t('patients.vitals') as any;
                  if (tab === 'Documents') tabLabel = t('patients.documents') as any;

                  return (
                    <button
                      key={tab}
                      onClick={() => setDetailTab(tab)}
                      className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer relative ${
                        detailTab === tab
                          ? 'text-teal-700 border-b-2 border-teal-600 font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tabLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* OVERVIEW TAB */}
              {detailTab === 'Overview' && (
                <div className="space-y-6 animate-fade-in text-xs font-medium">
                  {/* ABHA Banner */}
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Ayushman Bharat Digital Health ID</span>
                      <span className="text-sm font-mono font-black text-slate-900">{selectedPatient.abhaId || 'ABHA Registration Pending'}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                      ABDM Verified
                    </span>
                  </div>

                  {/* Two Column Key Info Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Registration Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Registration Date</span>
                        <strong className="text-slate-900 text-xs font-semibold">{selectedPatient.registrationDate || 'Not Available'}</strong>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Assigned ASHA Worker</span>
                        <strong className="text-slate-900 text-xs font-semibold">{selectedPatient.assignedAsha || 'Anita Devi (ASHA Sector 1)'}</strong>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Residential Address</span>
                        <strong className="text-slate-900 text-xs font-semibold">{selectedPatient.address || `${selectedPatient.village} Village`}</strong>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Emergency Contact</span>
                        <strong className="text-slate-900 text-xs font-semibold">{selectedPatient.emergencyContact || 'Family Member (+91 98765 00000)'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosed Conditions */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Conditions & Complaints</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedPatient.conditions || []).map((cond, i) => (
                        <span key={i} className="bg-teal-50 text-teal-800 font-bold text-xs px-3 py-1 rounded-xl border border-teal-200">
                          {cond}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VISIT HISTORY TAB */}
              {detailTab === 'Visit History' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chronological Health Records</h3>

                  <div className="relative border-l-2 border-teal-100 ml-3 space-y-6 pl-5">
                    {isLoadingVitals ? (
                      <div className="text-sm text-slate-500 font-medium py-2">Loading visits...</div>
                    ) : patientVitals.length === 0 ? (
                      <div className="text-sm text-slate-500 font-medium py-2">No visits recorded yet.</div>
                    ) : patientVitals.map((record: any) => (
                      <div key={record.id} className="relative group">
                        <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-teal-600 ring-4 ring-white" />
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-md">
                              {record.visitType || 'General Consult'}
                            </span>
                            <span className="text-slate-400 font-medium">
                              {record.date ? new Date(record.date).toLocaleDateString('en-GB') : 'Unknown Date'}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm mt-1">{record.symptoms || 'No symptoms reported'}</h4>
                          <p className="text-xs text-slate-600 font-medium">{record.notes || record.summary || 'No notes available'}</p>

                          <div className="text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-200/60 flex items-center justify-between">
                            <span>Attending: <strong>{record.recordedBy || 'System'}</strong></span>
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {record.status || 'Recorded'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VITALS TAB */}
              {detailTab === 'Vitals' && (() => {
                if (isLoadingVitals) {
                  return <div className="text-sm text-slate-500 font-medium py-4 text-center">Loading vital records...</div>;
                }
                if (vitalsError) {
                  return <div className="text-sm text-rose-500 font-medium py-4 text-center">{vitalsError}</div>;
                }

                const latestVitalsRecord = [...patientVitals].reverse().find(r => r.vitals && Object.keys(r.vitals).length > 0);
                const latestVitals = latestVitalsRecord ? latestVitalsRecord.vitals : null;

                if (!latestVitalsRecord) {
                  return <div className="text-sm text-slate-500 font-medium py-4 text-center">No vital records available</div>;
                }

                const bpRecords = patientVitals.filter(r => r.vitals?.bp && /^\d{2,3}\/\d{2,3}$/.test(r.vitals.bp)).slice(-5);

                return (
                  <div className="space-y-6 animate-fade-in">
                    {/* Most Recent Vitals Highlight Card */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Most Recent Vital Readings</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200/80 text-center">
                          <span className="text-slate-500 font-bold text-[10px] block uppercase">Blood Pressure</span>
                          <strong className="text-base font-black text-teal-900 mt-0.5 block">{latestVitals?.bp || 'Not recorded'}</strong>
                          <span className="text-[10px] text-teal-700 font-semibold">{latestVitals?.bp ? 'mmHg' : ''}</span>
                        </div>

                        <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 text-center">
                          <span className="text-slate-500 font-bold text-[10px] block uppercase">Temperature</span>
                          <strong className="text-base font-black text-amber-900 mt-0.5 block">{latestVitals?.temp || 'Not recorded'}</strong>
                          <span className="text-[10px] text-amber-700 font-semibold">{latestVitals?.temp ? 'Recorded' : ''}</span>
                        </div>

                        <div className="p-3.5 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-200/80 text-center">
                          <span className="text-slate-500 font-bold text-[10px] block uppercase">Pulse Rate</span>
                          <strong className="text-base font-black text-blue-900 mt-0.5 block">{latestVitals?.pulse ? `${latestVitals.pulse} bpm` : 'Not recorded'}</strong>
                          <span className="text-[10px] text-blue-700 font-semibold">{latestVitals?.pulse ? 'Recorded' : ''}</span>
                        </div>

                        <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200/80 text-center">
                          <span className="text-slate-500 font-bold text-[10px] block uppercase">Body Weight</span>
                          <strong className="text-base font-black text-purple-900 mt-0.5 block">{latestVitals?.weight ? `${latestVitals.weight} kg` : 'Not recorded'}</strong>
                          <span className="text-[10px] text-purple-700 font-semibold">{latestVitals?.weight ? 'Recorded' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vitals Line Trend Chart */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Blood Pressure Trend (Last 5 Visits)</h4>
                          <p className="text-[11px] text-slate-500">Systolic/Diastolic readings over time.</p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-bold">
                          <span className="flex items-center gap-1 text-teal-700"><span className="w-3 h-3 rounded-full bg-teal-600 inline-block"></span> Systolic BP</span>
                          <span className="flex items-center gap-1 text-emerald-700"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Diastolic BP</span>
                        </div>
                      </div>

                      {bpRecords.length === 0 ? (
                        <div className="text-sm text-slate-500 font-medium py-4 text-center">No blood pressure history available</div>
                      ) : (
                        <div className="h-44 w-full relative pt-2 pb-6">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                            {/* Grid lines */}
                            <line x1="0" y1="20" x2="500" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                            <line x1="0" y1="50" x2="500" y2="50" stroke="#e2e8f0" strokeDasharray="3 3" />
                            <line x1="0" y1="80" x2="500" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" />
                            <line x1="0" y1="110" x2="500" y2="110" stroke="#cbd5e1" />

                            {(() => {
                              let allVals: number[] = [];
                              bpRecords.forEach(r => {
                                const parts = r.vitals.bp.split('/');
                                if (parts.length === 2) {
                                  allVals.push(parseInt(parts[0], 10));
                                  allVals.push(parseInt(parts[1], 10));
                                }
                              });
                              
                              let actualMin = Math.min(...allVals);
                              let actualMax = Math.max(...allVals);
                              
                              if (allVals.length === 0) {
                                actualMin = 60;
                                actualMax = 180;
                              } else if (actualMin === actualMax) {
                                actualMin -= 20;
                                actualMax += 20;
                              }
                              
                              const chartMin = actualMin - 10;
                              const chartMax = actualMax + 10;
                              const range = Math.max(1, chartMax - chartMin);

                              const getY = (val: number) => {
                                return 110 - ((val - chartMin) / range) * 90;
                              };

                              const step = 500 / Math.max(1, bpRecords.length - 1);
                              
                              const sysPoints = bpRecords.map((r, i) => {
                                const sys = parseInt(r.vitals.bp.split('/')[0], 10);
                                const x = bpRecords.length === 1 ? 250 : i * step;
                                return `${x},${getY(sys)}`;
                              });
                              
                              const diaPoints = bpRecords.map((r, i) => {
                                const dia = parseInt(r.vitals.bp.split('/')[1], 10);
                                const x = bpRecords.length === 1 ? 250 : i * step;
                                return `${x},${getY(dia)}`;
                              });
                              
                              const sysPath = sysPoints.length > 1 ? `M ${sysPoints.join(' L ')}` : '';
                              const diaPath = diaPoints.length > 1 ? `M ${diaPoints.join(' L ')}` : '';

                              return (
                                <>
                                  {sysPath && <path d={sysPath} fill="none" stroke="#0d9488" strokeWidth="3" />}
                                  {diaPath && <path d={diaPath} fill="none" stroke="#10b981" strokeWidth="3" />}
                                  
                                  {bpRecords.map((r, i) => {
                                    const sys = parseInt(r.vitals.bp.split('/')[0], 10);
                                    const dia = parseInt(r.vitals.bp.split('/')[1], 10);
                                    const x = bpRecords.length === 1 ? 250 : i * step;
                                    return (
                                      <React.Fragment key={i}>
                                        <circle cx={x} cy={getY(sys)} r={i === bpRecords.length - 1 ? "5" : "4"} fill="#0d9488" stroke={i === bpRecords.length - 1 ? "#ffffff" : "none"} strokeWidth={i === bpRecords.length - 1 ? "2" : "0"} />
                                        <circle cx={x} cy={getY(dia)} r={i === bpRecords.length - 1 ? "5" : "4"} fill="#10b981" stroke={i === bpRecords.length - 1 ? "#ffffff" : "none"} strokeWidth={i === bpRecords.length - 1 ? "2" : "0"} />
                                      </React.Fragment>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </svg>

                          <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-500 font-bold mt-2">
                            {(() => {
                              const formatDate = (dateStr: string) => {
                                const d = new Date(dateStr);
                                if (isNaN(d.getTime())) return dateStr;
                                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                              };

                              if (bpRecords.length === 1) {
                                return <span className="w-full text-center">{formatDate(bpRecords[0].date || bpRecords[0].createdAt)}</span>;
                              }
                              
                              return bpRecords.map((r, i) => {
                                const leftPercent = (i / (bpRecords.length - 1)) * 100;
                                return (
                                  <span key={i} style={{ position: 'absolute', left: `${leftPercent}%`, transform: 'translateX(-50%)' }}>
                                    {formatDate(r.date || r.createdAt)}
                                  </span>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* DOCUMENTS TAB */}
              {detailTab === 'Documents' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uploaded Records & Prescriptions</h3>
                    {role !== 'SUPERVISOR' && (
                      <button 
                        onClick={() => setIsUploadDocumentModalOpen(true)}
                        className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload Document</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {isLoadingDocuments ? (
                      <div className="col-span-full text-sm text-slate-500 font-medium py-2">Loading documents...</div>
                    ) : patientDocuments.length === 0 ? (
                      <div className="col-span-full text-sm text-slate-500 font-medium py-2">No documents uploaded yet.</div>
                    ) : patientDocuments.map((doc) => (
                      <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 hover:border-teal-300 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs truncate max-w-[150px]">{doc.originalFileName}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">{doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                            {doc.description && <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[150px]">{doc.description}</p>}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
                            window.open(`${baseUrl}/patients/${selectedPatient.id}/documents/${doc.id}`, '_blank');
                          }}
                          className="p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                          title="View / Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel Bottom Action Buttons */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  if (selectedPatient) setIsFollowUpModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('patients.scheduleFollowUp', 'Schedule Follow-Up')}</span>
              </button>

              {role === 'ASHA_WORKER' && (
                <>
                  <button
                    onClick={() => {
                      if (selectedPatient) setIsAddVisitModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {t('patients.addNewVisit', 'Add New Visit')}
                  </button>

                  <button
                    onClick={() => {
                      if (selectedPatient) setIsStartConsultationModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors active:scale-98"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>{t('patients.startConsultation', 'Start Consultation')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {isPrescriptionModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">{t('patients.writePrescription', 'Write Prescription')}</h3>
              </div>
              <button onClick={() => setIsPrescriptionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm font-medium">
              <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <img src={selectedPatient.avatar} alt={selectedPatient.name} className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-bold text-slate-900">{selectedPatient.name}</div>
                  <div className="text-xs text-slate-500">Patient ID: {selectedPatient.id}</div>
                </div>
              </div>
              
              {prescriptionError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {prescriptionError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Diagnosis</label>
                <input 
                  type="text" 
                  value={prescriptionForm.diagnosis}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. Viral Fever" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Medication</label>
                <input 
                  type="text" 
                  value={prescriptionForm.medication}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, medication: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. Paracetamol 500mg" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Dosage</label>
                <input 
                  type="text" 
                  value={prescriptionForm.dosage}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. 1-0-1 (Twice daily)" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Instructions</label>
                <textarea 
                  value={prescriptionForm.instructions}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, instructions: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" 
                  placeholder="e.g. Take after meals..."
                ></textarea>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsPrescriptionModalOpen(false);
                  setPrescriptionError(null);
                  setPrescriptionForm({ diagnosis: '', medication: '', dosage: '', instructions: '' });
                }}
                disabled={!!isSendingPrescription}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSendPrescription('PATIENT')}
                disabled={!!isSendingPrescription}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSendingPrescription === 'PATIENT' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send to Patient</span>
                )}
              </button>
              <button 
                onClick={() => handleSendPrescription('ASHA')}
                disabled={!!isSendingPrescription}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSendingPrescription === 'ASHA' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send to ASHA Worker</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddVisitModalOpen && selectedPatient && onAddRecord && (
        <AddVisitModal
          patient={selectedPatient}
          onClose={() => setIsAddVisitModalOpen(false)}
          onAddRecord={async (record) => {
            const success = await onAddRecord(record);
            if (success) {
              fetchVitals(selectedPatient.id);
            }
            return success;
          }}
        />
      )}

      {isFollowUpModalOpen && selectedPatient && (
        <ScheduleFollowUpModal
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          onClose={() => setIsFollowUpModalOpen(false)}
          onSuccess={() => {
            setIsFollowUpModalOpen(false);
            setActionFeedback(`Follow-up appointment scheduled for ${selectedPatient.name}`);
            setTimeout(() => setActionFeedback(null), 3000);
          }}
        />
      )}

      {isUploadDocumentModalOpen && selectedPatient && (
        <UploadDocumentModal
          patientId={selectedPatient.id}
          onClose={() => setIsUploadDocumentModalOpen(false)}
          onSuccess={() => {
            setIsUploadDocumentModalOpen(false);
            setActionFeedback('Document uploaded successfully.');
            setTimeout(() => setActionFeedback(null), 3000);
            fetchDocuments(selectedPatient.id);
          }}
        />
      )}

      {isStartConsultationModalOpen && selectedPatient && (
        <StartConsultationModal
          patient={selectedPatient}
          onClose={() => setIsStartConsultationModalOpen(false)}
          onSubmit={(symptoms, ashaNotes) => {
            const p = selectedPatient;
            setSelectedPatient(null);
            setIsStartConsultationModalOpen(false);
            onSelectPatientForConsultation(p, symptoms, ashaNotes);
          }}
        />
      )}
      </>
      )}
    </div>
  );
};

