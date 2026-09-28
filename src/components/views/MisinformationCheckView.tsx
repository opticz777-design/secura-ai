import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  Upload, 
  Share2, 
  Bookmark, 
  ArrowRight, 
  Check, 
  RotateCcw,
  FileImage,
  ExternalLink,
  Flame,
  Info
} from 'lucide-react';
import { MisinfoCheck, ActiveTab } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';

interface MisinformationCheckViewProps {
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const MisinformationCheckView: React.FC<MisinformationCheckViewProps> = ({
  onNavigateTab
}) => {
  const { t } = useLanguage();
  const { userProfile } = useRole();

  // State
  const [claimText, setClaimText] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<MisinfoCheck | null>(null);
  const [recentChecks, setRecentChecks] = useState<MisinfoCheck[]>([]);
  const [trendingMyths, setTrendingMyths] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [verdictFilter, setVerdictFilter] = useState<'All' | 'True' | 'False' | 'Unverified'>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const MAX_CHARS = 500;

  useEffect(() => {
    fetchHistory();
    fetchTrending();
  }, [userProfile.id]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/misinfo-checks/history?ashaWorkerId=${userProfile.id}`);
      const json = await res.json();
      if (json.success) setRecentChecks(json.data);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/misinfo-checks/trending?healthCentre=${encodeURIComponent(userProfile.center)}`);
      const json = await res.json();
      if (json.success) setTrendingMyths(json.data);
    } catch (e) {
      console.error('Failed to fetch trending:', e);
    }
  };

  const handleVerifyClaim = async (textToVerify?: string) => {
    const text = textToVerify || claimText;
    if (!text.trim() && !selectedFile) return;

    setIsVerifying(true);

    try {
      const formData = new FormData();
      if (text.trim()) formData.append('claimText', text);
      formData.append('ashaWorkerId', userProfile.id);
      formData.append('ashaWorkerName', userProfile.name);
      formData.append('healthCentre', userProfile.center);
      formData.append('language', 'English'); // or use appLanguage mapping
      if (selectedFile) {
        formData.append('screenshot', selectedFile);
      }

      const res = await fetch('http://localhost:5000/api/misinfo-checks/check', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        // Map the backend structure to our MisinfoCheck frontend structure if needed
        const newCheck = {
          ...json.data,
          sources: ['AI Analysis'] // Add mock sources if empty
        };
        if(!newCheck.sources || newCheck.sources.length === 0) newCheck.sources = ['AI Analysis'];
        setRecentChecks(prev => [newCheck, ...prev]);
        setActiveResult(newCheck);
        showToast(t('misinfo.toastSaved', 'Claim verified & saved to recent history ledger.'));
        setClaimText('');
        setSelectedFile(null);
        setUploadedFileName(null);
        
        // re-fetch trending
        fetchTrending();
      } else {
        showToast('Verification failed: ' + json.message);
      }
    } catch (error) {
      console.error(error);
      showToast('Network error during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadedFileName(file.name);
      showToast(t('misinfo.uploadNotice', 'Screenshot attached. Click Verify Claim.'));
    }
  };

  const handleSharePatient = () => {
    if (!activeResult) return;
    const sourcesStr = activeResult.sources ? activeResult.sources.join(', ') : 'AI Analysis';
    const textToCopy = `*SYN CURA AI HEALTH FACT CHECK*\n\n*Claim:* "${activeResult.claimText}"\n\n*Verdict:* ${activeResult.verdict?.toUpperCase()}\n\n*Official Medical Guidance:* ${activeResult.explanation}\n\n*Sources:* ${sourcesStr}`;
    navigator.clipboard.writeText(textToCopy);
    showToast(t('misinfo.toastShared', 'Verification summary copied and ready to share via WhatsApp!'));
  };

  const handleSaveToHistory = () => {
    if (!activeResult) return;
    showToast(t('misinfo.toastSaved', 'Claim saved to recent history ledger.'));
  };

  const handleGenerateAwareness = () => {
    if (onNavigateTab && activeResult) {
      const handoffData = {
        isMisinfoHandoff: true,
        claimText: activeResult.claimText,
        correctedClaim: activeResult.correctedClaim,
        explanation: activeResult.explanation,
        category: activeResult.category,
        verdict: activeResult.verdict
      };
      localStorage.setItem('awareness_topic_context', JSON.stringify(handoffData));
      onNavigateTab('awareness-content');
    }
  };

  const filteredHistory = recentChecks.filter((item) => {
    const textToSearch = (item.claimText || '') + ' ' + (item.explanation || '') + ' ' + (item.category || '');
    const matchesSearch = textToSearch.toLowerCase().includes(historySearch.toLowerCase());
    
    // Normalize verdicts for filtering
    let vMatch = true;
    if (verdictFilter !== 'All') {
      const dbVerdict = item.verdict || '';
      if (verdictFilter === 'True' && !dbVerdict.includes('True')) vMatch = false;
      if (verdictFilter === 'False' && !dbVerdict.includes('False')) vMatch = false;
      if (verdictFilter === 'Unverified' && !dbVerdict.includes('Unverified')) vMatch = false;
    }

    return matchesSearch && vMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>AI-assisted health information check</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('misinfo.title', 'Misinformation Check')}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {t('misinfo.subtitle', 'Verify health claims and WhatsApp forwards before sharing with your community.')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-50 text-purple-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-purple-200/80 shrink-0">
          <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
          <span>Verify with official health sources</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 space-y-6">

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-600" />
                <span>Verify Health Forward or Rumor</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {claimText.length} / {MAX_CHARS} {t('misinfo.charCount', 'characters')}
              </span>
            </div>

            <div className="relative">
              <textarea
                id="input-misinfo-claim-textarea"
                rows={4}
                maxLength={MAX_CHARS}
                placeholder={t('misinfo.placeholder', 'Paste a message, forward, or health claim to verify...')}
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-none"
              />

              {claimText.length > 0 && (
                <button
                  onClick={() => setClaimText('')}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xs bg-slate-200/60 p-1 rounded-full cursor-pointer"
                  title="Clear text"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-t border-slate-100">
              
              <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors w-fit">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>{uploadedFileName ? `Image: ${uploadedFileName.slice(0, 15)}...` : t('misinfo.uploadScreenshot', 'Or upload a screenshot')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
              </label>

              <button
                id="btn-verify-misinfo-claim"
                onClick={() => handleVerifyClaim()}
                disabled={(!claimText.trim() && !selectedFile) || isVerifying}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                  (!claimText.trim() && !selectedFile) || isVerifying
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-purple-700 hover:bg-purple-800 text-white hover:shadow-lg'
                }`}
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing health claim...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('misinfo.verifyClaim', 'Verify Claim')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {activeResult && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4 animate-scale-up border-l-4 border-l-purple-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    {activeResult.id}
                  </span>
                  {activeResult.category && (
                    <span className="text-[11px] font-extrabold bg-purple-50 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {activeResult.category}
                    </span>
                  )}
                  {activeResult.riskLevel && (
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      activeResult.riskLevel.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                      activeResult.riskLevel.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {activeResult.riskLevel} Risk
                    </span>
                  )}
                </div>

                <div>
                  {activeResult.verdict?.includes('True') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>{t('misinfo.verifiedTrue', '✓ Verified True')}</span>
                    </span>
                  )}
                  {activeResult.verdict?.includes('False') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                      <XCircle className="w-4 h-4 text-rose-700" />
                      <span>{t('misinfo.falseMisleading', '✗ False / Misleading')}</span>
                    </span>
                  )}
                  {activeResult.verdict?.includes('Unverified') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>{t('misinfo.unverifiedContext', '⚠ Unverified / Needs Context')}</span>
                    </span>
                  )}
                </div>
              </div>

              {activeResult.claimText && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Submitted Claim</span>
                  <p className="text-sm font-bold text-slate-900 italic">"{activeResult.claimText}"</p>
                </div>
              )}

              {activeResult.correctedClaim && activeResult.verdict?.includes('False') && (
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200/80">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block mb-0.5">Corrected Fact</span>
                  <p className="text-sm font-bold text-emerald-900">{activeResult.correctedClaim}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-purple-600" />
                  <span>Explanation</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  {activeResult.explanation}
                </p>
              </div>
              
              {activeResult.recommendation && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recommendation</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {activeResult.recommendation}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  id="btn-share-misinfo-patient"
                  onClick={handleSharePatient}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Share2 className="w-4 h-4 text-slate-600" />
                  <span>{t('misinfo.sharePatient', 'Share Correct Info')}</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-base">
                {t('misinfo.recentChecks', 'Recent Checks')}
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {filteredHistory.length} Recorded Claims
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-1/2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={t('misinfo.searchHistory', 'Search checked claims...')}
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-bold shrink-0">
                {(['All', 'True', 'False', 'Unverified'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVerdictFilter(v)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      verdictFilter === v 
                        ? 'bg-white text-purple-900 shadow-2xs font-extrabold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {v === 'All' ? t('misinfo.filterAll', 'All Verdicts') :
                     v === 'True' ? t('misinfo.filterTrue', 'Verified True') :
                     v === 'False' ? t('misinfo.filterFalse', 'False / Misleading') :
                     t('misinfo.filterUnverified', 'Unverified')}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No matching misinformation entries found.
                </div>
              ) : (
                filteredHistory.map((item: any) => (
                  <div 
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors px-2 rounded-xl"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.category && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">
                        "{item.claimText || 'Screenshot attached'}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        item.verdict?.includes('True') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        item.verdict?.includes('False') ? 'bg-rose-50 text-rose-800 border-rose-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.verdict?.includes('True') ? '✓ True' : item.verdict?.includes('False') ? '✗ False' : '⚠ Unverified'}
                      </span>

                      <button
                        onClick={() => {
                          setActiveResult(item);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>{t('misinfo.viewDetails', 'View Details')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">
                  Common health claims
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 truncate max-w-[100px]">
                {userProfile.center}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Common health claims recently checked in your area
            </p>

            <div className="space-y-3">
              {trendingMyths.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 font-medium">
                  No recent misinformation trends available.
                </div>
              ) : (
                trendingMyths.map((tm: any) => (
                  <div 
                    key={tm.id}
                    onClick={() => {
                      setClaimText(tm.claimText);
                      setActiveResult(tm);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3.5 bg-slate-50 hover:bg-purple-50/60 rounded-xl border border-slate-200/60 hover:border-purple-200 transition-all cursor-pointer group space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                        {tm.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        tm.verdict?.includes('False') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tm.verdict?.includes('False') ? '✗ False' : '⚠ Unverified'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-900 leading-snug">
                      "{tm.claimText}"
                    </h4>

                    <p className="text-[11px] text-slate-500 font-medium line-clamp-2">
                      {tm.explanation}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="w-10 h-10 rounded-xl bg-purple-600/60 flex items-center justify-center border border-purple-400/30">
              <Sparkles className="w-5 h-5 text-purple-200" />
            </div>

            <div>
              <h3 className="font-bold text-base text-purple-100">
                {t('misinfo.quickShareTitle', 'Turn this correction into a shareable poster')}
              </h3>
              <p className="text-xs text-purple-200/80 font-medium mt-1 leading-relaxed">
                Transform verified health corrections into multi-lingual WhatsApp flyers, infographics, and audio notes for village distribution.
              </p>
            </div>

            <button
              id="btn-nav-awareness-content"
              onClick={handleGenerateAwareness}
              className="w-full py-2.5 bg-white hover:bg-purple-50 text-purple-900 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t('misinfo.generateAwarenessBtn', 'Generate Awareness Content →')}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
