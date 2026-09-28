import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Activity, 
  Users, 
  ArrowRight, 
  Stethoscope, 
  FileText, 
  AlertTriangle, 
  Phone,
  Pill,
  ChevronRight
} from 'lucide-react';
import { Patient, OutbreakAlert, Consultation, ActiveTab, HealthRecord } from '../../types';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { AnonymousPatientAvatar } from '../AnonymousPatientAvatar';
import { useLanguage } from '../../context/LanguageContext';
import { HEALTH_CENTRES } from '../../config/healthCentres';

interface DoctorDashboardProps {
  patients: Patient[];
  outbreakAlerts: OutbreakAlert[];
  consultations: Consultation[];
  healthRecords: HealthRecord[];
  dashboardStats: any;
  onNavigate: (tab: ActiveTab) => void;
  onSelectConsultation?: (consultationId: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  patients,
  outbreakAlerts,
  consultations,
  healthRecords,
  dashboardStats,
  onNavigate,
  onSelectConsultation
}) => {
  const { t } = useLanguage();
  const selectedDate = new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });

  // Real backend metrics
  const waitingCount = dashboardStats?.waitingConsultations || consultations.filter(c => c.status === 'Waiting').length;
  const completedCount = dashboardStats?.completedToday || 0;
  const followUpsDueCount = dashboardStats?.followUpsDue || 0;

  // Real waiting consultations list
  const waitingConsultations = consultations.filter(c => c.status === 'Waiting');

  // Derive recent prescriptions from completed consultations
  const recentPrescriptions = consultations
    .filter(c => c.status === 'Completed' && c.doctorNotes)
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      patientName: c.patientName,
      age: c.age,
      village: c.village,
      diagnosis: c.doctorNotes,
      date: c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : 'Today',
      status: 'Completed',
      asha: c.ashaWorkerName
    }));

  // Patients Needing Follow-up derived from Health Records
  const followUpPatients = healthRecords
    .filter(r => r.status === 'Needs Follow-up' || r.followUpScheduled)
    .slice(0, 4)
    .map(r => ({
      id: r.id,
      name: r.patientName,
      age: r.age,
      village: r.village,
      condition: r.notes || r.summary || 'Follow-up requested',
      dueDate: r.followUpDate || 'Pending',
      urgency: 'normal' // could map from r.status or similar
    }));

  const handleReviewCase = (consultationId: string) => {
    if (onSelectConsultation) {
      onSelectConsultation(consultationId);
    }
    onNavigate('teleconsultation');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 animate-fade-in">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('doctorDash.welcome', 'Welcome back, Dr. Priya Nair!')}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            You have <strong className="text-amber-600 font-bold">{waitingCount} consultations</strong> waiting today • {HEALTH_CENTRES[0].name}
          </p>
        </div>

        {/* Date Picker Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2 rounded-full border border-slate-200 shadow-2xs transition-colors cursor-pointer">
          <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{selectedDate}</span>
        </div>
      </div>

      {/* 2. FOUR STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Consultations */}
        <div 
          onClick={() => onNavigate('teleconsultation')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('teleconsult.queueWaiting', 'Pending Consultations')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600">{waitingCount}</span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">In Queue</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Requiring immediate review</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Completed Today */}
        <div 
          onClick={() => onNavigate('teleconsultation')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">Completed Today</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700">{completedCount}</span>
              <span className="text-[11px] font-bold text-emerald-600">Prescriptions sent</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Verified with e-prescriptions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Avg. Consultation Time */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Avg. Consult Time</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-700">{dashboardStats?.avgConsultTime || 'N/A'}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              {dashboardStats?.avgConsultTime && dashboardStats.avgConsultTime !== 'N/A' ? 'Based on completed today' : 'Not enough data to calculate'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Follow-ups Due */}
        <div 
          onClick={() => onNavigate('health-records')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">Follow-ups Due</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-700">{followUpsDueCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Scheduled for this cycle</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 cols): Consultation Queue & Recent Prescriptions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Consultation Queue Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('doctorDash.consultationQueue', 'Consultation Queue')}
                </h3>
              </div>
              <button 
                id="link-doctor-full-queue"
                onClick={() => onNavigate('teleconsultation')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Queue →</span>
              </button>
            </div>

            <div className="space-y-3">
              {waitingConsultations.length > 0 ? (
                waitingConsultations.map((c) => (
                <div 
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-teal-300 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <AnonymousPatientAvatar className="w-11 h-11" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{c.patientName}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.priority === 'Urgent' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}>
                          {c.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {c.age} yrs • {c.gender} • {c.village}
                      </p>
                      <p className="text-xs text-slate-700 font-normal italic mt-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        "{c.symptoms}"
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1 flex-wrap">
                        <span>{t('tele.submittedBy', 'Submitted by')}:</span>
                        <strong className="text-slate-800 font-bold">{c.ashaWorkerName || 'Anita Devi (ASHA)'}</strong>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 font-normal">{c.submittedAt || 'Today'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      id={`btn-review-case-${c.id}`}
                      onClick={() => handleReviewCase(c.id)}
                      className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Review Case</span>
                    </button>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">No pending consultations</div>
              )}
            </div>
          </div>

          {/* Recent Prescriptions & Clinical Summaries */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('doctorDash.recentPrescriptions', 'Recent Prescriptions & Clinical Summaries')}
                </h3>
              </div>
              <button 
                onClick={() => onNavigate('health-records')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Health Records →</span>
              </button>
            </div>

            <div className="space-y-3">
              {recentPrescriptions.length > 0 ? (
                recentPrescriptions.map((rx) => (
                <div 
                  key={rx.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{rx.patientName}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">({rx.age} yrs • {rx.village})</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-1 bg-white p-2 rounded-lg border border-slate-200/60">
                        {rx.diagnosis}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                      {rx.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-200/60">
                    <span>{rx.date}</span>
                    <span>ASHA: <strong className="text-slate-600">{rx.asha}</strong></span>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">No recent prescriptions</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Patients Needing Follow-up & Outbreak Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patients Needing Follow-up */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('doctorDash.followUpsScheduled', 'Patients Needing Follow-up')}
                </h3>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                4 Due
              </span>
            </div>

            <div className="space-y-3">
              {followUpPatients.length > 0 ? (
                followUpPatients.map((fup) => (
                <div 
                  key={fup.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition-all flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{fup.name}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">({fup.age} yrs • {fup.village})</span>
                    </div>
                    <p className="text-xs text-purple-900 font-medium mt-0.5">
                      {fup.condition}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">
                      Scheduled: <strong className="text-slate-700">{fup.dueDate}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigate('teleconsultation')}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors shrink-0 cursor-pointer"
                    title="Initiate follow-up teleconsult"
                  >
                    <Stethoscope className="w-4 h-4" />
                  </button>
                </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">No follow-ups due</div>
              )}
            </div>
          </div>

          {/* Outbreak Alerts in Your Coverage Area */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('doctorDash.criticalAlerts', 'Outbreak Alerts in Coverage Area')}
                </h3>
              </div>
              <button 
                onClick={() => onNavigate('outbreak-monitoring')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Map →</span>
              </button>
            </div>

            <div className="space-y-3">
              {outbreakAlerts.length > 0 ? (
                outbreakAlerts.slice(0, 2).map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => onNavigate('outbreak-monitoring')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    alert.severity === 'High' 
                      ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50' 
                      : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        alert.severity === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {alert.severity} Risk
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1.5">{alert.disease} - {alert.location}</h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">{alert.cases} cases reported • {alert.trend}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-700 font-medium flex items-center justify-between">
                    <span>Protocol: Fever screening & IV fluid buffer</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">No active outbreak alerts in your coverage area</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
