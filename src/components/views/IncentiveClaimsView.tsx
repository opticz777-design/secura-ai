import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Eye, 
  X, 
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { IncentiveClaim, TaskBreakdownItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';

// Standard month names for display
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const IncentiveClaimsView: React.FC = () => {
  const { t } = useLanguage();
  const { role, userProfile } = useRole();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  
  const [claims, setClaims] = useState<IncentiveClaim[]>([]);
  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [selectedClaimDetail, setSelectedClaimDetail] = useState<IncentiveClaim | null>(null);
  const [claimNotes, setClaimNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': userProfile.id,
    'x-user-role': role,
    'x-user-center': userProfile.center,
    'x-user-name': userProfile.name
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'ASHA_WORKER') {
        // Fetch current cycle status
        const currentRes = await fetch(`${API_BASE_URL}/incentive-claims/current`, { headers: getHeaders() });
        const currentData = await currentRes.json();
        if (currentData.success) {
          setCurrentCycle(currentData.data);
        }

        // Fetch claim history
        const historyRes = await fetch(`${API_BASE_URL}/incentive-claims/history`, { headers: getHeaders() });
        const historyData = await historyRes.json();
        if (historyData.success) {
          setClaims(historyData.data);
        }
      } else if (role === 'SUPERVISOR') {
        // Fetch pending claims
        const pendingRes = await fetch(`${API_BASE_URL}/incentive-claims/pending`, { headers: getHeaders() });
        const pendingData = await pendingRes.json();
        
        // Fetch approved/rejected claims (history)
        const historyRes = await fetch(`${API_BASE_URL}/incentive-claims/history`, { headers: getHeaders() });
        const historyData = await historyRes.json();
        
        if (pendingData.success && historyData.success) {
          // Combine and sort by date descending
          const combined = [...pendingData.data, ...historyData.data].sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setClaims(combined);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, userProfile]);

  const handleSubmitNewClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/incentive-claims/claims`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ notes: claimNotes })
      });
      const data = await res.json();
      
      if (data.success) {
        setShowSubmitModal(false);
        setClaimNotes('');
        showToast(t('incentivesPage.toastSubmitted', 'Claim submitted successfully'));
        fetchData();
      } else {
        alert(data.error || 'Failed to submit claim');
      }
    } catch (err: any) {
      alert('Error submitting claim: ' + err.message);
    }
  };

  const handleUpdateClaimStatus = async (claimId: string, newStatus: 'Approved' | 'Rejected') => {
    if (newStatus === 'Rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/incentive-claims/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus, rejectionReason })
      });
      const data = await res.json();
      
      if (data.success) {
        setSelectedClaimDetail(null);
        setRejectionReason('');
        showToast(`Claim ${newStatus.toLowerCase()} successfully`);
        fetchData();
      } else {
        alert(data.error || `Failed to ${newStatus.toLowerCase()} claim`);
      }
    } catch (err: any) {
      alert(`Error updating claim: ` + err.message);
    }
  };

  const displayMonthYear = (month: number, year: number) => {
    if (!month || !year) return '';
    return `${MONTH_NAMES[month - 1]} ${year}`;
  };

  const pluralizeTasks = (count: number) => count === 1 ? '1 Task' : `${count} Tasks`;
  const pluralizeTasksLower = (count: number) => count === 1 ? '1 task' : `${count} tasks`;

  const pendingClaimsCount = claims.filter(c => c.status === 'Pending').length;
  const approvedPaidClaimsCount = claims.filter(c => c.status === 'Approved' || c.status === 'Paid').length;
  
  // Tasks count dynamically from fetched claims
  const completedTasksHistory = claims.reduce((acc, c) => acc + (c.totalTasks || 0), 0);
  const currentMonthTasksCount = currentCycle?.totalTasks || 0;
  const currentMonthTaskTotalSum = currentCycle?.estimatedAmount || 0;

  // For supervisor: show total approved amount or sum of tasks? 
  // We'll show total pending tasks for their jurisdiction as the "total tasks" to match the semantic meaning
  const supervisorTotalTasks = claims.reduce((acc, c) => acc + (c.totalTasks || 0), 0);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading real-time incentive data...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4 text-purple-600" />
            <span>National Health Mission (NHM)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('incentive.title', 'Incentive Claims')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {t('incentive.subtitle', 'Track and submit your monthly ASHA incentive claims based on verified ledger data.')}
          </p>
        </div>

        {role === 'ASHA_WORKER' && (
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={currentCycle?.alreadySubmitted || currentCycle?.totalTasks === 0}
            className={`flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer self-start md:self-auto shrink-0 ${
              currentCycle?.alreadySubmitted || currentCycle?.totalTasks === 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-purple-700 hover:bg-purple-800 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {currentCycle?.totalTasks === 0 ? 'No Tasks to Claim' : 
               currentCycle?.alreadySubmitted ? 'Cycle Already Submitted' : 
               t('incentivesPage.submitNewClaim', '+ Submit New Claim')}
            </span>
          </button>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'ASHA_WORKER' ? (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {t('incentivesPage.thisMonthEarnings', "Current Cycle Value")}
            </span>
            <div className="text-3xl font-black text-emerald-900 mt-1">₹{currentMonthTaskTotalSum.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              Estimated from {pluralizeTasksLower(currentMonthTasksCount)}
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {t('incentivesPage.thisMonthEarnings', "Jurisdiction Claims Value")}
            </span>
            <div className="text-3xl font-black text-emerald-900 mt-1">
              ₹{claims.reduce((acc, c) => acc + Number(c.claimedAmount || 0), 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Total claimed amount</p>
          </div>
        )}

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            {role === 'SUPERVISOR' ? t('incentivesPage.claimsAwaitingApproval', 'Claims Awaiting My Approval') : t('incentivesPage.pendingClaims', 'Pending Claims')}
          </span>
          <div className="text-3xl font-black text-amber-900 mt-1">{pendingClaimsCount}</div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">Under verification queue</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200/80 shadow-2xs">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            {t('incentivesPage.approvedClaims', 'Approved Claims')}
          </span>
          <div className="text-3xl font-black text-blue-900 mt-1">{approvedPaidClaimsCount}</div>
          <p className="text-[11px] text-blue-700 font-semibold mt-1">Successfully verified</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('incentivesPage.totalTasksCompleted', 'Total Ledger Tasks')}
          </span>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {role === 'ASHA_WORKER' ? pluralizeTasks(currentMonthTasksCount) : pluralizeTasks(supervisorTotalTasks)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">100% digital audit ledger</p>
        </div>
      </div>

      {/* CURRENT CYCLE CARD (ASHA ONLY) */}
      {role === 'ASHA_WORKER' && currentCycle && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider">
                <CheckSquare className="w-4 h-4 text-purple-600" />
                <span>Current Cycle Activity</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t('incentivesPage.claimStatusOverview', 'Monthly Task & Incentive Rate Breakdown')}
              </h3>
            </div>
            <span className="text-xs font-extrabold bg-purple-50 text-purple-800 px-3 py-1 rounded-full border border-purple-200/80 self-start sm:self-auto">
              {displayMonthYear(currentCycle.cycleMonth, currentCycle.cycleYear)} Cycle
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {currentCycle.taskBreakdown.map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors px-2 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.taskName}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Rate: <strong className="text-slate-700">₹{item.ratePerTask}</strong> per task
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                  <div className="text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                    {item.completedCount} Completed
                  </div>
                  <div className="font-black text-emerald-800 text-sm min-w-[70px] text-right">
                    ₹{item.subtotal.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Estimated Claim Value</span>
              <div className="text-2xl font-black text-slate-900">
                ₹{currentMonthTaskTotalSum.toLocaleString()}{' '}
                <span className="text-xs text-slate-500 font-normal">({pluralizeTasksLower(currentMonthTasksCount)})</span>
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={currentCycle.alreadySubmitted || currentCycle.totalTasks === 0}
              className={`font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-2 justify-center ${
                currentCycle.alreadySubmitted || currentCycle.totalTasks === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-purple-700 hover:bg-purple-800 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {currentCycle.totalTasks === 0 ? 'No Tasks' : 
                 currentCycle.alreadySubmitted ? 'Already Submitted' : 
                 'Submit Claim for Current Cycle'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* CLAIMS HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            {role === 'SUPERVISOR' ? 'Claims Overview' : t('incentivesPage.claimsHistoryTable', 'Claims History')}
          </h3>
          <span className="text-xs font-bold text-slate-500">{claims.length} Entries</span>
        </div>

        {claims.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm font-bold">
            {role === 'SUPERVISOR' ? 'No incentive claims available.' : 'No incentive claims submitted yet.'}
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold tracking-wider">
                  <tr>
                    {role === 'SUPERVISOR' && <th className="p-3.5 pl-5">ASHA Worker</th>}
                    <th className={role === 'SUPERVISOR' ? "p-3.5" : "p-3.5 pl-5"}>{t('incentivesPage.colMonth', 'Cycle')}</th>
                    <th className="p-3.5">{t('incentivesPage.colTotalTasks', 'Tasks')}</th>
                    <th className="p-3.5">{t('incentivesPage.colClaimedAmount', 'Amount')}</th>
                    <th className="p-3.5">{t('incentivesPage.colSubmittedDate', 'Submitted')}</th>
                    <th className="p-3.5">{t('incentivesPage.colStatus', 'Status')}</th>
                    <th className="p-3.5 pr-5 text-right">{t('incentivesPage.colActions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {claims.map((claim: any) => (
                    <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                      {role === 'SUPERVISOR' && (
                        <td className="p-3.5 pl-5 font-bold text-slate-900">
                          {claim.ashaWorkerName}<br/>
                          <span className="text-[10px] text-slate-400 font-normal">{claim.healthCentre}</span>
                        </td>
                      )}
                      <td className={role === 'SUPERVISOR' ? "p-3.5 font-bold text-slate-900" : "p-3.5 pl-5 font-bold text-slate-900"}>
                        {displayMonthYear(claim.cycleMonth, claim.cycleYear)}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{pluralizeTasks(claim.totalTasks)}</td>
                      <td className="p-3.5 font-black text-purple-900">₹{Number(claim.claimedAmount).toLocaleString()}</td>
                      <td className="p-3.5 text-slate-500">{new Date(claim.submittedDate || claim.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          claim.status === 'Rejected' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {claim.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {claim.status === 'Rejected' && <X className="w-3 h-3 text-rose-600" />}
                          {claim.status === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{claim.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedClaimDetail(claim)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>{role === 'SUPERVISOR' && claim.status === 'Pending' ? 'Review' : 'View'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-slate-100">
              {claims.map((claim: any) => (
                <div key={claim.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{displayMonthYear(claim.cycleMonth, claim.cycleYear)}</h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      claim.status === 'Rejected' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  {role === 'SUPERVISOR' && (
                    <div className="text-xs font-bold text-slate-700">
                      {claim.ashaWorkerName} ({claim.healthCentre})
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Claimed</span>
                      <span className="font-black text-purple-900">₹{Number(claim.claimedAmount).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Tasks</span>
                      <span className="font-semibold text-slate-800">{pluralizeTasks(claim.totalTasks)}</span>
                    </div>
                  </div>

                  <div className="flex w-full mt-2">
                    <button
                      onClick={() => setSelectedClaimDetail(claim)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{role === 'SUPERVISOR' && claim.status === 'Pending' ? 'Review Details' : 'View Details'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* SUBMIT NEW CLAIM MODAL */}
      {showSubmitModal && currentCycle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {t('incentivesPage.submitModalTitle', 'Submit Monthly Incentive Claim')}
              </h3>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">Auto-Populated Current Cycle</span>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-base">{displayMonthYear(currentCycle.cycleMonth, currentCycle.cycleYear)} Claim</h4>
                <span className="text-lg font-black text-purple-900">₹{currentMonthTaskTotalSum.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Completed Activity Breakdown</span>
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 max-h-48 overflow-y-auto custom-scrollbar">
                {currentCycle.taskBreakdown.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-800">{item.taskName} ({item.completedCount}x)</span>
                    <span className="font-bold text-slate-900">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitNewClaim} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ASHA Declaration & Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. All deliveries and immunizations verified with PHC registers..."
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2.5 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('incentivesPage.submitForVerification', 'Submit for Verification')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLAIM DETAIL MODAL */}
      {selectedClaimDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">ID: {selectedClaimDetail.id}</span>
                <h3 className="text-lg font-bold text-slate-900">{displayMonthYear((selectedClaimDetail as any).cycleMonth, (selectedClaimDetail as any).cycleYear)} Claim Detail</h3>
                {role === 'SUPERVISOR' && (
                  <p className="text-xs text-slate-500 font-bold mt-1">Worker: {(selectedClaimDetail as any).ashaWorkerName}</p>
                )}
              </div>
              <button 
                onClick={() => setSelectedClaimDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Claim Amount</span>
                <span className="text-2xl font-black text-purple-950">₹{Number(selectedClaimDetail.claimedAmount).toLocaleString()}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                selectedClaimDetail.status === 'Approved' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                selectedClaimDetail.status === 'Rejected' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {selectedClaimDetail.status}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Task Breakdown Ledger</span>
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                {selectedClaimDetail.taskBreakdown?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 last:border-0">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.taskName}</span>
                      <span className="text-[11px] text-slate-500">{pluralizeTasksLower(item.completedCount)} @ ₹{item.ratePerTask}/task</span>
                    </div>
                    <span className="font-black text-slate-800">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Verification Timeline</span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Submitted on {new Date(selectedClaimDetail.submittedDate || selectedClaimDetail.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                {(selectedClaimDetail as any).reviewedAt && (
                  <div className={`flex items-center gap-2 font-bold ${
                    selectedClaimDetail.status === 'Approved' ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {selectedClaimDetail.status === 'Approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                    <span>{selectedClaimDetail.status} on {new Date((selectedClaimDetail as any).reviewedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {(selectedClaimDetail as any).rejectionReason && (
                  <div className="bg-rose-50 p-2 rounded-lg text-rose-700 text-xs border border-rose-200 font-medium">
                    <strong className="block mb-1">Rejection Reason:</strong>
                    {(selectedClaimDetail as any).rejectionReason}
                  </div>
                )}
              </div>
            </div>

            {role === 'SUPERVISOR' && selectedClaimDetail.status === 'Pending' && (
              <div className="pt-2 space-y-3">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">Rejection Reason (Required if Rejecting)</label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 text-xs"
                    placeholder="Enter reason if rejecting..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateClaimStatus(selectedClaimDetail.id, 'Rejected')}
                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateClaimStatus(selectedClaimDetail.id, 'Approved')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedClaimDetail(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
