import React, { useState } from 'react';
import { 
  Calendar, 
  Mic, 
  Droplet, 
  Sparkles, 
  Users, 
  Stethoscope, 
  AlertTriangle, 
  Gift, 
  TrendingUp, 
  ArrowRight,
  UserPlus, 
  ShieldCheck, 
  Coins
} from 'lucide-react';
import { Patient, OutbreakAlert, ActiveTab, Consultation, HealthRecord } from '../../types';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { HEALTH_CENTRES } from '../../config/healthCentres';
import { useLanguage } from '../../context/LanguageContext';

interface AshaDashboardProps {
  patients: Patient[];
  outbreakAlerts: OutbreakAlert[];
  consultations: Consultation[];
  healthRecords: HealthRecord[];
  dashboardStats: any;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddPatientModal: () => void;
}

export const AshaDashboard: React.FC<AshaDashboardProps> = ({
  patients,
  outbreakAlerts,
  consultations,
  healthRecords,
  dashboardStats,
  onNavigate,
  onOpenAddPatientModal,
}) => {
  const { t } = useLanguage();
  const selectedDate = new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });

  // Safe fallback to 0 if stats haven't loaded yet
  const pendingIncentivesCount = dashboardStats?.pendingIncentives || 0;
  const activeBloodRequestsCount = dashboardStats?.activeBloodRequests || 0;
  const consultationsTodayCount = dashboardStats?.consultationsToday || 0;
  const totalPatientsCount = dashboardStats?.totalPatients || patients.length;
  
  // High risk outbreak alerts
  const highRiskAlerts = outbreakAlerts.filter(a => a.severity === 'High').length;
  
  // Follow-ups from health records (where status is Pending Review or Follow-up)
  const followUps = healthRecords.filter(r => r.status === 'Needs Follow-up' || r.followUpScheduled);

  // Dynamic health tip based on outbreak alerts
  const healthTip = outbreakAlerts.length > 0
    ? `${outbreakAlerts[0].disease} alert in ${outbreakAlerts[0].location}. Advise community on preventive measures.`
    : t('dashboard.healthTipsDesc', 'Promote seasonal health practices and encourage regular checkups in the community.');

  const getStatusTranslation = (statusStr: string) => {
    if (statusStr === 'Consulted') return t('status.consulted', 'Consulted');
    if (statusStr === 'Follow Up') return t('status.followUp', 'Follow Up');
    if (statusStr === 'Registered') return t('status.registered', 'Registered');
    if (statusStr === 'Confirmed') return t('status.confirmed', 'Confirmed');
    if (statusStr === 'Pending') return t('status.pending', 'Pending');
    return statusStr;
  };

  const getGenderTranslation = (genderStr: string) => {
    if (genderStr === 'Male') return t('patients.male', 'Male');
    if (genderStr === 'Female') return t('patients.female', 'Female');
    return genderStr;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 animate-fade-in">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('nav.dashboard')}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t('dashboard.welcome', 'Welcome back, Anita Devi')} • <strong className="text-slate-800 font-semibold">{t('dashboard.subtitle')}</strong>
          </p>
        </div>

        {/* Date Picker Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2 rounded-full border border-slate-200 shadow-2xs transition-colors cursor-pointer">
          <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{selectedDate}</span>
        </div>
      </div>

      {/* 2. THREE LARGE FEATURE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Blue Card: Voice Based Input Collection */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {t('dashboard.voiceInputTitle')}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
              {t('dashboard.voiceInputDesc')}
            </p>
          </div>
          <button
            id="dash-start-voice-input-btn"
            onClick={() => onNavigate('voice-input')}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('dashboard.startVoiceInput')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Rose Card: Blood Donation Coordination */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50/60 border border-rose-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Droplet className="w-6 h-6 fill-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {t('dashboard.bloodDonationTitle')}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
              {t('dashboard.bloodDonationDesc')}
            </p>
          </div>
          <button
            id="dash-open-blood-coordination-btn"
            onClick={() => onNavigate('blood-donation')}
            className="mt-5 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('dashboard.openCoordination')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Emerald/Teal Card: Awareness Content Generation */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-600/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-700/20 mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {t('dashboard.awarenessTitle')}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
              {t('dashboard.awarenessDesc')}
            </p>
          </div>
          <button
            id="dash-generate-content-btn"
            onClick={() => onNavigate('awareness-content')}
            className="mt-5 w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('dashboard.generateContent')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. FOUR COMPACT STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div 
          onClick={() => onNavigate('patients')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('dashboard.totalPatients')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{totalPatientsCount}</span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                {t('common.active', 'Active')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Consultations Today */}
        <div 
          onClick={() => onNavigate('teleconsultation')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('dashboard.consultationsToday')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{consultationsTodayCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        {/* Outbreak Alerts */}
        <div 
          onClick={() => onNavigate('outbreak-monitoring')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('dashboard.outbreakAlerts')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600">{outbreakAlerts.length}</span>
              {highRiskAlerts > 0 && (
                <span className="text-[11px] font-bold text-red-600 flex items-center">
                  {highRiskAlerts} high risk
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Incentives */}
        <div 
          onClick={() => onNavigate('incentive-claims')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('dashboard.pendingIncentives')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{pendingIncentivesCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Gift className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 cols): Recent Patients & Upcoming Appointments */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent Patients Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">{t('dashboard.recentPatients')}</h3>
              <button 
                id="link-view-all-patients"
                onClick={() => onNavigate('patients')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('dashboard.viewAll')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {patients.length > 0 ? (
                patients.slice(0, 4).map((p) => (
                <div 
                  key={p.id}
                  onClick={() => onNavigate('patients')}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-slate-50/80 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={p.avatar} 
                      alt={p.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" 
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {p.age} {t('common.years', 'yrs')} • {getGenderTranslation(p.gender)} • {p.village}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      p.status === 'Consulted' 
                        ? 'bg-teal-50 text-teal-800 border border-teal-200/60'
                        : p.status === 'Follow Up'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {getStatusTranslation(p.status)}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">{p.lastVisit}</p>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">No patients found</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">{t('dashboard.scheduledFollowUps', 'Scheduled Follow-ups')}</h3>
              <span className="text-xs font-semibold text-slate-400">{followUps.length} scheduled</span>
            </div>

            <div className="space-y-3">
              {followUps.length > 0 ? (
                followUps.map((record) => (
                  <div 
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex flex-col items-center justify-center shrink-0 border border-purple-200/60">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{record.patientName}</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {record.visitType}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/50">
                        {record.followUpDate || 'Pending'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">No scheduled follow-ups</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Outbreak, Health Tips & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Outbreak Monitor Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">{t('dashboard.outbreakMonitor')}</h3>
              </div>
              <button 
                id="link-view-outbreak-map"
                onClick={() => onNavigate('outbreak-monitoring')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">{alert.cases} confirmed cases • {alert.trend}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">No active outbreak alerts</div>
              )}
            </div>
          </div>

          {/* Health Tips for Community */}
          <div className="bg-gradient-to-br from-teal-800 to-teal-900 rounded-2xl text-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-teal-300" />
              <h3 className="text-base font-bold text-white">{t('dashboard.healthTips')}</h3>
            </div>
            <p className="text-xs text-teal-100 font-normal leading-relaxed mb-4">
              {healthTip}
            </p>
            <button
              onClick={() => onNavigate('awareness-content')}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20 transition-colors flex items-center justify-center gap-2 cursor-pointer w-full"
            >
              <span>{t('dashboard.generateContent')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Blood Donation Coordination Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600 fill-rose-600" />
                <h3 className="text-base font-bold text-slate-900">{t('bloodDonation.title', 'Blood Donation Coordination')}</h3>
              </div>
              <button
                id="link-open-blood-coordination"
                onClick={() => onNavigate('blood-donation')}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Coordination</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-rose-900">{activeBloodRequestsCount} Active Emergency Requests</span>
              </div>
              <button
                onClick={() => onNavigate('blood-donation')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs shrink-0 cursor-pointer"
              >
                Open
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <h3 className="text-base font-bold text-slate-900 mb-4">{t('dashboard.quickActions')}</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1. Add Patient */}
              <button
                id="quick-action-add-patient"
                onClick={onOpenAddPatientModal}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/80 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold leading-tight">{t('patients.addPatient')}</span>
              </button>

              {/* 2. Start Consultation */}
              <button
                id="quick-action-start-consultation"
                onClick={() => onNavigate('teleconsultation')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold leading-tight">{t('patients.startConsultation')}</span>
              </button>

              {/* 3. Check Misinformation */}
              <button
                id="quick-action-check-misinformation"
                onClick={() => onNavigate('misinformation')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold leading-tight">{t('nav.misinformationCheck')}</span>
              </button>



              {/* 5. Claim Incentive */}
              <button
                id="quick-action-claim-incentive"
                onClick={() => onNavigate('incentive-claims')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold leading-tight">{t('nav.incentiveClaims')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
