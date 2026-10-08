import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  MapPin, 
  AlertTriangle, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Building2, 
  Check, 
  X,
  FileCheck,
  TrendingUp
} from 'lucide-react';
import { Patient, OutbreakAlert, IncentiveClaim, ActiveTab } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { HEALTH_CENTRES } from '../../config/healthCentres';

interface SupervisorDashboardProps {
  patients: Patient[];
  outbreakAlerts: OutbreakAlert[];
  incentiveClaims: IncentiveClaim[];
  dashboardStats: any;
  onUpdateIncentiveClaim?: (updated: IncentiveClaim) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  patients,
  outbreakAlerts,
  incentiveClaims,
  dashboardStats,
  onUpdateIncentiveClaim,
  onNavigate
}) => {
  const { t } = useLanguage();
  const selectedDate = new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Real backend metrics
  const pendingClaimsCount = dashboardStats?.pendingClaims || incentiveClaims.filter(c => c.status === 'Pending').length;
  const activeAlertsCount = dashboardStats?.activeOutbreakAlerts || outbreakAlerts.length;
  const activeCasesCount = dashboardStats?.activeCases || 0;
  const highRiskCasesCount = dashboardStats?.highRiskCases || 0;
  const activeAshaCount = dashboardStats?.activeAshaWorkers || 0;
  const villagesCoveredCount = dashboardStats?.villagesCovered || 0;

  // Filter incentive claims
  const pendingClaimsList = incentiveClaims.filter(c => c.status === 'Pending');

  // Derive simple regional outbreak summary from real outbreak alerts
  const regionalSummary = outbreakAlerts.length > 0
    ? outbreakAlerts.slice(0, 3).map(a => ({
        disease: a.disease,
        count: a.cases,
        village: a.location,
        status: a.severity
      }))
    : [];

  // Village Health Overview removed

  const handleApproveClaim = (claimId: string) => {
    const claim = incentiveClaims.find(c => c.id === claimId);
    if (claim && onUpdateIncentiveClaim) {
      onUpdateIncentiveClaim({ ...claim, status: 'Verified' });
    }
    setActionFeedback(`Claim ${claimId} successfully approved and queued for treasury disbursement.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRejectClaim = (claimId: string) => {
    const claim = incentiveClaims.find(c => c.id === claimId);
    if (claim && onUpdateIncentiveClaim) {
      onUpdateIncentiveClaim({ ...claim, status: 'Needs Review' });
    }
    setActionFeedback(`Claim ${claimId} flagged for review & returned to ASHA worker.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 animate-fade-in">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('supervisorDash.welcome', 'Welcome back, Rajesh Nair!')}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t('supervisorDash.subtitle', "Here's your regional overview")} • <strong className="text-slate-800 font-semibold">{HEALTH_CENTRES[0].name} Jurisdiction</strong>
          </p>
        </div>

        {/* Date Picker Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2 rounded-full border border-slate-200 shadow-2xs transition-colors cursor-pointer">
          <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{selectedDate}</span>
        </div>
      </div>

      {/* Toast Feedback Notification if any action taken */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. FOUR STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active ASHA Workers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('dashboard.activeAshaWorkers', 'Active ASHA Workers')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{activeAshaCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Daily field tracking on</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Villages Covered */}
        <div 
          onClick={() => onNavigate('patients')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('dashboard.villagesCovered', 'Villages Covered')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{villagesCoveredCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Sub-centers & Wards</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* Active Outbreak Alerts */}
        <div 
          onClick={() => onNavigate('outbreak-monitoring')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('supervisorDash.activeOutbreaks', 'Active Outbreak Alerts')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600">{activeAlertsCount}</span>
              <span className="text-[11px] font-bold text-rose-600">2 Containment</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">{HEALTH_CENTRES[3].name} & {HEALTH_CENTRES[0].name}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Incentive Approvals */}
        <div 
          onClick={() => onNavigate('incentive-claims')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-xs text-slate-500 font-semibold">{t('supervisorDash.pendingIncentiveApprovals', 'Pending Approvals')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-700">{pendingClaimsCount}</span>
              <span className="text-[11px] font-bold text-purple-600">Awaiting Sign-off</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Monthly cycle review</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 cols): ASHA Workforce & Incentive Claims Approval */}
        <div className="lg:col-span-7 space-y-6">
          {/* ASHA Workforce & Field Activity Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-teal-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    ASHA Workforce & Field Activity
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Monitor field activity, patient coverage and pending work across your assigned region.
                </p>
              </div>

              {/* Today's Field Activity Summary */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 shrink-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Today's Field Activity</p>
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <p className="text-lg font-black text-slate-800">{dashboardStats?.patientsVisitedToday || 0}</p>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase">Patients Visited</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div>
                    <p className="text-lg font-black text-slate-800">{dashboardStats?.recordsCollectedToday || 0}</p>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase">Records Collected</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div>
                    <p className="text-lg font-black text-slate-800">{dashboardStats?.followUpsPending || 0}</p>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase">Follow-ups</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end mb-3">
              <button 
                onClick={() => onNavigate('patients')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View ASHA Activity →</span>
              </button>
            </div>

            <div className="space-y-3">
              {dashboardStats?.ashaWorkersList?.length > 0 ? (
                dashboardStats.ashaWorkersList.map((worker: any) => {
                  const patientsCount = patients.filter(p => p.assignedAsha === worker.displayName || p.ashaWorkerId === worker.ashaWorkerId).length;
                  const pendingCount = incentiveClaims.filter(c => c.ashaWorkerId === worker.ashaWorkerId && c.status === 'Pending').length;
                  
                  return (
                  <div key={worker.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                        {worker.displayName ? worker.displayName.substring(0, 2) : 'AW'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{worker.displayName || worker.username}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">PHC {worker.healthCentre || 'Chirakkal'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 mt-2 sm:mt-0">
                      <div className="text-center sm:text-right">
                        <p className="text-sm font-bold text-slate-700">{patientsCount}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Patients</p>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-sm font-bold text-amber-600">{pendingCount}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Pending</p>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-sm font-bold text-slate-700">Today</p>
                        <p className="text-[10px] text-slate-400 font-medium">Last Active</p>
                      </div>
                    </div>
                  </div>
                )})
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 font-medium border border-dashed border-slate-200 rounded-xl">
                  No active ASHA workers found.
                </div>
              )}
            </div>
          </div>

          {/* Incentive Claims Awaiting Approval Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('supervisorDash.incentiveClaimsApproval', 'Incentive Claims Awaiting Approval')}
                </h3>
              </div>
              <button 
                onClick={() => onNavigate('incentive-claims')}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Claims →</span>
              </button>
            </div>

            <div className="space-y-3">
              {pendingClaimsList.length > 0 ? (
                pendingClaimsList.map((claim) => (
                  <div 
                    key={claim.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-900">#{claim.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-800">{claim.month}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        ASHA ID: <strong className="text-slate-800">{claim.ashaWorkerId}</strong> • {claim.totalTasks} Verified Tasks
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-slate-900">₹{claim.totalAmount}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        id={`btn-approve-claim-${claim.id}`}
                        onClick={() => handleApproveClaim(claim.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        id={`btn-reject-claim-${claim.id}`}
                        onClick={() => handleRejectClaim(claim.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">No pending claims to review</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Regional Outbreak Summary & ASHA Worker Performance */}
        <div className="lg:col-span-5 space-y-6">
          {/* Regional Outbreak Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Regional Outbreak Summary</h3>
              </div>
              <button 
                onClick={() => onNavigate('outbreak-monitoring')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Map →</span>
              </button>
            </div>

            {/* Outbreak Heatmap widget preview */}
            <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden mb-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
                <span>Active Surveillance Heatmap</span>
                <span className="text-amber-400 font-bold">{HEALTH_CENTRES[0].name}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  <span className="font-semibold text-rose-400">{HEALTH_CENTRES[3].name}</span>
                  <span className="text-slate-300">Dengue • 42 Cases</span>
                </div>
                <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  <span className="font-semibold text-amber-400">{HEALTH_CENTRES[2].name}</span>
                  <span className="text-slate-300">Waterborne Diarrhea • 28 Cases</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 font-medium">
              <strong>Supervisory Directive:</strong> Mobilize ASHA teams for door-to-door larval inspection and distribute chlorine tablets across Sectors B & C.
            </div>
          </div>

          {/* ASHA Worker Performance Card Removed */}
        </div>
      </div>
    </div>
  );
};
