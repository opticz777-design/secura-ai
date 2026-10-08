import React, { useState } from 'react';
import { 
  Sparkles, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Volume2, 
  Image as ImageIcon, 
  MessageSquare, 
  Send,
  FileText,
  RotateCcw,
  Bookmark,
  Play,
  Pause,
  Filter,
  CheckCircle2,
  Flame,
  ArrowRight,
  Edit3,
  Save,
  Radio,
  ExternalLink,
  Info,
  ShieldCheck,
  Droplets,
  Heart,
  Baby
} from 'lucide-react';
import { AwarenessContent, ActiveTab } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { HEALTH_CENTRES } from '../../config/healthCentres';
import { useRole } from '../../context/RoleContext';

interface AwarenessContentViewProps {
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const AwarenessContentView: React.FC<AwarenessContentViewProps> = ({
  onNavigateTab
}) => {
  const { t, language: appLanguage } = useLanguage();

  // Generator State
  const [topicInput, setTopicInput] = useState<string>('');
  const [misinfoContext, setMisinfoContext] = useState<any>(null);
  const [contentType, setContentType] = useState<'Poster' | 'WhatsApp Message' | 'Audio Clip'>('Poster');
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Malayalam'>(appLanguage === 'ml' ? 'Malayalam' : 'English');
  const [tone, setTone] = useState<'Simple & Friendly' | 'Formal' | 'Urgent/Warning'>('Simple & Friendly');

  // Generation & Results State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<AwarenessContent | null>(null);

  // Editing State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');
  const [editHeadline, setEditHeadline] = useState<string>('');

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioQueueRef = React.useRef<string[]>([]);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress(p => p + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  // Library & Toast State
  const [library, setLibrary] = useState<AwarenessContent[]>([]);
  const [metrics, setMetrics] = useState({ totalCampaigns: 0, totalShares: 0, totalDownloads: 0 });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [libraryTypeFilter, setLibraryTypeFilter] = useState<string>('All');
  const [libraryLangFilter, setLibraryLangFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAllLibrary, setShowAllLibrary] = useState<boolean>(false);
  const { userProfile } = useRole();

  React.useEffect(() => {
    fetchLibrary();
    fetchMetrics();
    fetchSuggestions();
    
    const storedContext = localStorage.getItem('awareness_topic_context');
    if (storedContext) {
      try {
        const parsed = JSON.parse(storedContext);
        if (parsed && parsed.isMisinfoHandoff) {
          setMisinfoContext(parsed);
          const baseCategory = parsed.category || 'General Health';
          // Ensure it doesn't just say "General Health: Know the Facts" every time
          setTopicInput(`${baseCategory === 'General Health' ? 'Important Health Facts for Your Community' : baseCategory + ': Know the Facts'}`);
        } else {
          setTopicInput(storedContext);
        }
      } catch (e) {
        setTopicInput(storedContext);
      }
      localStorage.removeItem('awareness_topic_context');
    }
  }, [userProfile.id]);

  const fetchLibrary = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/awareness-content?ashaWorkerId=${userProfile.id}`);
      const json = await res.json();
      if (json.success) setLibrary(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/awareness-content/metrics?ashaWorkerId=${userProfile.id}`);
      const json = await res.json();
      if (json.success) setMetrics(json.metrics);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/awareness-content/suggestions`);
      const json = await res.json();
      if (json.success) setSuggestions(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerate = async (overrideTopic?: string, overrideType?: string, overrideTone?: string, overrideLanguage?: string) => {
    const topicToUse = overrideTopic || topicInput;
    const typeToUse = overrideType || contentType;
    const toneToUse = overrideTone || tone;
    const langToUse = overrideLanguage || selectedLanguage;

    if (!topicToUse.trim()) return;

    setIsGenerating(true);
    setIsEditing(false);
    setActiveResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/awareness-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          contentType: typeToUse,
          language: langToUse,
          tone: toneToUse,
          misinfoContext: misinfoContext
        })
      });
      const json = await res.json();
      if (json.success) {
        setActiveResult(json.data);
      } else {
        showToast('Generation failed: ' + json.message);
      }
    } catch (e) {
      console.error(e);
      showToast('Error generating content. Backend may be unavailable.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Edits to Active Result
  const handleSaveEdits = async () => {
    if (!activeResult) return;
    const updated = {
      ...activeResult,
      generatedText: editText || activeResult.generatedText,
      headline: editHeadline || activeResult.headline
    };
    setActiveResult(updated);
    setIsEditing(false);

    if (updated.id) {
      try {
        await fetch(`http://localhost:5000/api/awareness-content/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generatedText: updated.generatedText, headline: updated.headline })
        });
        fetchLibrary();
      } catch (e) {
        console.error(e);
      }
    }
    showToast('Changes saved to generated content.');
  };

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Save to Library Button
  const handleSaveToLibrary = async () => {
    if (!activeResult) return;
    if (activeResult.id) {
       showToast('Content is already in the library.');
       return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/awareness-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activeResult,
          ashaWorkerId: userProfile.id,
          ashaWorkerName: userProfile.name,
          healthCentre: userProfile.center
        })
      });
      const json = await res.json();
      if (json.success) {
        setActiveResult(json.data);
        fetchLibrary();
        fetchMetrics();
        showToast(t('awareness.toastSaved', 'Saved to Content Library!'));
      } else {
        showToast('Error saving to library: ' + (json.message || json.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      showToast('Error saving to library.');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy for WhatsApp / Share
  const handleShareWhatsapp = async () => {
    if (!activeResult) return;
    const shareText = `*${activeResult.headline || activeResult.topic}*\n\n${activeResult.generatedText}\n\n_${activeResult.callToAction || `Issued by ${userProfile.name} - ${userProfile.center}`}_`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    
    if (activeResult.id) {
      try {
        await fetch(`http://localhost:5000/api/awareness-content/${activeResult.id}/share`, { method: 'POST' });
        fetchMetrics();
        fetchLibrary();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Simulated Download
  const handleDownload = async () => {
    if (!activeResult) return;

    let fileContent = '';
    let fileName = '';
    let mimeType = 'text/plain';

    if (activeResult.contentType === 'Poster') {
      fileContent = `<html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background-color: #f8fafc;">
          <h1 style="color: #4c1d95;">${activeResult.headline || activeResult.topic}</h1>
          <p style="font-size: 18px; color: #334155; max-width: 800px; margin: 0 auto; line-height: 1.6;">${activeResult.generatedText}</p>
          ${activeResult.bulletPoints && activeResult.bulletPoints.length > 0 ? `<ul style="text-align: left; max-width: 800px; margin: 20px auto; color: #334155; font-size: 16px;">${activeResult.bulletPoints.map(bp => `<li>${bp}</li>`).join('')}</ul>` : ''}
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-weight: bold;">
            ${activeResult.callToAction || ''} <br/>
            Issued by: ${userProfile.center}
          </div>
        </body>
        </html>`;
      fileName = `awareness-poster-${Date.now()}.html`;
      mimeType = 'text/html';
    } else if (activeResult.contentType === 'Audio Clip') {
      try {
        const res = await fetch('http://localhost:5000/api/awareness-content/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: activeResult.generatedText,
            language: activeResult.language
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const byteArrays = data.chunks.map((c: any) => {
          const binaryString = window.atob(c.base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        });

        const blob = new Blob(byteArrays, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `awareness-audio-${Date.now()}.mp3`;
        a.click();
        URL.revokeObjectURL(url);

        showToast(t('awareness.toastDownloaded', 'Content file downloaded successfully!'));
        
        if (activeResult.id) {
          try {
            await fetch(`http://localhost:5000/api/awareness-content/${activeResult.id}/download`, { method: 'POST' });
            fetchMetrics();
            fetchLibrary();
          } catch (e) {
            console.error(e);
          }
        }
        return; // Exit early since we handled the download
      } catch (e) {
        console.error(e);
        showToast('Error downloading audio file.');
        return;
      }
    } else {
      fileContent = `Topic: ${activeResult.topic}\nFormat: ${activeResult.contentType}\n\n${activeResult.headline ? activeResult.headline + '\n\n' : ''}${activeResult.generatedText}\n\n${activeResult.callToAction || ''}`;
      fileName = `awareness-whatsapp-${Date.now()}.txt`;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    showToast(t('awareness.toastDownloaded', 'Content file downloaded successfully!'));
    
    if (activeResult.id) {
      try {
        await fetch(`http://localhost:5000/api/awareness-content/${activeResult.id}/download`, { method: 'POST' });
        fetchMetrics();
        fetchLibrary();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleAudio = async () => {
    if (isPlayingAudio || isFetchingAudio) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setIsPlayingAudio(false);
      setIsFetchingAudio(false);
      audioQueueRef.current = [];
      return;
    }

    if (!activeResult) return;
    setIsFetchingAudio(true);
    setAudioProgress(0);

    try {
      const res = await fetch('http://localhost:5000/api/awareness-content/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeResult.generatedText,
          language: activeResult.language
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      
      const chunks = data.chunks.map((c: any) => `data:audio/mp3;base64,${c.base64}`);
      audioQueueRef.current = chunks;
      
      setIsFetchingAudio(false);
      setIsPlayingAudio(true);
      playNextAudioChunk();
    } catch (e: any) {
      console.error(e);
      showToast('Error generating audio: ' + e.message);
      setIsFetchingAudio(false);
      setIsPlayingAudio(false);
    }
  };

  const playNextAudioChunk = () => {
    if (audioQueueRef.current.length === 0) {
      setIsPlayingAudio(false);
      // Snap progress to 100% so the UI waveform and timer complete visually
      if (activeResult) {
        const textLength = activeResult.generatedText?.length || 0;
        const calculatedDuration = Math.max(5, Math.ceil(textLength / 12));
        setAudioProgress(calculatedDuration);
      }
      return;
    }
    const nextChunk = audioQueueRef.current.shift();
    if (nextChunk) {
      const audio = new Audio(nextChunk);
      currentAudioRef.current = audio;
      audio.onended = () => playNextAudioChunk();
      audio.onerror = () => {
        console.error('Audio chunk playback error');
        playNextAudioChunk();
      };
      audio.play().catch(e => {
        console.error('Audio play error:', e);
        setIsPlayingAudio(false);
      });
    }
  };

  // Reuse from Library or Sidebar
  const handleReuse = (item: AwarenessContent) => {
    setTopicInput(item.topic);
    setContentType(item.contentType);
    setSelectedLanguage(item.language);
    setTone(item.tone);
    setMisinfoContext(null); // Clear context when reusing old item
    setActiveResult(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded "${item.topic.slice(0, 30)}..." into generator.`);
  };

  // Filtered Library Items
  const filteredLibrary = library.filter((item) => {
    const matchesType = libraryTypeFilter === 'All' || item.contentType === libraryTypeFilter;
    const matchesLang = libraryLangFilter === 'All' || item.language === libraryLangFilter;
    return matchesType && matchesLang;
  });

  const displayedLibrary = showAllLibrary ? filteredLibrary : filteredLibrary.slice(0, 6);

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Health Education Studio</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('awareness.title', 'Awareness Content Generation')}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {t('awareness.subtitle', 'Create posters, messages, and audio clips to educate your community.')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-50 text-purple-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-purple-200/80 shrink-0">
          <Radio className="w-4 h-4 text-purple-600 animate-pulse" />
          <span>Multi-Format AI Studio</span>
        </div>
      </div>

      {/* TWO COLUMN MAIN GRID (Generator + Results Left (8 Cols), Suggested Topics Right (4 Cols)) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Generator Panel & Result Card (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* CONTENT GENERATOR PANEL */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-purple-600" />
                <span>AI Health Content Generator</span>
              </h2>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                ASHA Campaign Tool
              </span>
            </div>

            {/* Topic Input Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t('awareness.topicInputLabel', 'What health topic do you want to create content about?')}
              </label>
              <input
                id="input-awareness-topic"
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder={t('awareness.topicInputPlaceholder', 'e.g., Importance of handwashing or Myths about the measles vaccine...')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
              />
            </div>

            {/* Content-Type Toggle Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t('awareness.selectContentType', 'Select Output Format')}
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Poster', label: t('awareness.typePoster', 'Poster'), icon: ImageIcon, desc: 'Visual card' },
                  { id: 'WhatsApp Message', label: t('awareness.typeWhatsapp', 'WhatsApp Message'), icon: MessageSquare, desc: 'Emoji chat' },
                  { id: 'Audio Clip', label: t('awareness.typeAudio', 'Audio Clip'), icon: Volume2, desc: 'Voice note' },
                ].map((ct) => {
                  const Icon = ct.icon;
                  const isSel = contentType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      id={`toggle-content-type-${ct.id.toLowerCase().replace(/[^a-z]/g, '')}`}
                      onClick={() => setContentType(ct.id as any)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSel
                          ? 'bg-purple-50 text-purple-950 border-purple-300 ring-2 ring-purple-600/30 shadow-2xs font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSel ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSel && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{ct.label}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{ct.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Selector & Audience Tone Selector (Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Language Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {t('awareness.selectLanguage', 'Language')}
                </label>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('English')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedLanguage === 'English'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('Malayalam')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedLanguage === 'Malayalam'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    മലയാളം (Malayalam)
                  </button>
                </div>
              </div>

              {/* Audience Tone Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {t('awareness.selectTone', 'Audience Tone')}
                </label>
                <select
                  id="select-awareness-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                >
                  <option value="Simple & Friendly">{t('awareness.toneSimple', 'Simple & Friendly')}</option>
                  <option value="Formal">{t('awareness.toneFormal', 'Formal & Official')}</option>
                  <option value="Urgent/Warning">{t('awareness.toneUrgent', 'Urgent / Warning')}</option>
                </select>
              </div>
            </div>

            {/* Primary Generate Content Button */}
            <div className="pt-2">
              <button
                id="btn-generate-awareness-content"
                onClick={() => handleGenerate()}
                disabled={!topicInput.trim() || isGenerating}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  !topicInput.trim() || isGenerating
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-purple-700 hover:bg-purple-800 text-white hover:shadow-lg'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('awareness.generating', 'Creating AI health content...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-200" />
                    <span>{t('awareness.generateBtn', 'Generate Content')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GENERATED RESULT PANEL */}
          {activeResult && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-5 animate-scale-up border-l-4 border-l-purple-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                      {activeResult.contentType}
                    </span>
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                      {activeResult.language}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {activeResult.tone}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {activeResult.topic}
                  </h3>
                </div>

                {activeResult.id ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    SAVED: {activeResult.id}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    UNSAVED
                  </span>
                )}
              </div>

              {/* CONTENT PREVIEWS BY TYPE */}
              <div className="space-y-4">

                {/* 1. POSTER FORMAT PREVIEW */}
                {activeResult.contentType === 'Poster' && (
                  <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 relative overflow-hidden border border-purple-500/20">
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between border-b border-white/20 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <ImageIcon className="w-5 h-5 text-purple-200" />
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold uppercase text-purple-300 tracking-wider">{userProfile.center} Health Campaign</p>
                          <h4 className="font-extrabold text-base text-white">{activeResult.headline || activeResult.topic}</h4>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-black px-3 py-1 rounded-full uppercase">
                        ASHA Verified
                      </span>
                    </div>

                    {/* Poster Body */}
                    <div className="bg-black/30 backdrop-blur-xs rounded-2xl p-5 border border-white/10 space-y-3">
                      <p className="text-sm font-semibold leading-relaxed text-purple-100">
                        {activeResult.generatedText}
                      </p>

                      {activeResult.bulletPoints && activeResult.bulletPoints.length > 0 && (
                        <ul className="space-y-2 pt-2 border-t border-white/10 text-xs font-medium text-slate-200">
                          {activeResult.bulletPoints.map((bp, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{bp}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Poster Footer CTA */}
                    {activeResult.callToAction && (
                      <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 flex items-center justify-between gap-3 text-xs font-bold text-white">
                        <span>📢 {activeResult.callToAction}</span>
                        <span className="text-[10px] bg-white text-purple-900 font-extrabold px-2.5 py-1 rounded-lg shrink-0">
                          Share Poster
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. WHATSAPP MESSAGE FORMAT PREVIEW */}
                {activeResult.contentType === 'WhatsApp Message' && (
                  <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Broadcast Message Preview</span>
                    </div>

                    <div className="max-w-xl bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs space-y-2 text-slate-900 relative">
                      {isEditing ? (
                        <textarea
                          rows={5}
                          value={editText || activeResult.generatedText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line text-slate-800">
                          {activeResult.generatedText}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 pt-1">
                        <span>10:42 AM</span>
                        <span className="text-emerald-600 font-black">✓✓</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. AUDIO CLIP FORMAT PREVIEW */}
                {activeResult.contentType === 'Audio Clip' && (() => {
                  const calculatedDuration = Math.max(5, Math.ceil((activeResult.generatedText?.length || 0) / 12));
                  const durationStr = `${Math.floor(calculatedDuration / 60)}:${(calculatedDuration % 60).toString().padStart(2, '0')}`;
                  
                  return (
                  <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-lg border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                        <Volume2 className="w-4 h-4" />
                        <span>Voice Note Broadcast (Audio Clip)</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400 font-bold">
                        {durationStr}
                      </span>
                    </div>

                    {/* Audio Player Controller */}
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleToggleAudio}
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                          isPlayingAudio ? 'bg-purple-500 text-white animate-pulse' : isFetchingAudio ? 'bg-purple-400 text-white animate-bounce' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                        }`}
                      >
                        {isPlayingAudio || isFetchingAudio ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                      </button>

                      {/* Waveform Bar Simulation */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-1 h-8">
                          {(() => {
                            const totalSeconds = calculatedDuration;
                            const progressPercent = Math.min((audioProgress / totalSeconds) * 100, 100);
                            const segments = [30, 50, 80, 40, 90, 60, 100, 70, 40, 80, 50, 90, 30, 70, 60, 40, 80, 100, 50, 30, 60];
                            
                            return segments.map((h, i) => {
                              const segmentPercent = (i / segments.length) * 100;
                              const isFilled = progressPercent > 0 && progressPercent >= segmentPercent;
                              return (
                                <div 
                                  key={i} 
                                  style={{ height: `${h}%` }}
                                  className={`flex-1 rounded-full transition-all duration-500 ${
                                    isFilled ? 'bg-purple-400' : 'bg-slate-600'
                                  }`}
                                />
                              );
                            });
                          })()}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                          {(() => {
                            const displaySecs = Math.min(audioProgress, calculatedDuration);
                            return (
                              <>
                                <span>{`${Math.floor(displaySecs / 60)}:${(displaySecs % 60).toString().padStart(2, '0')}`}</span>
                                <span>{durationStr}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Audio Transcript Text */}
                    <div className="space-y-1.5 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Audio Transcript Text</span>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed italic">
                        "{activeResult.generatedText}"
                      </p>
                    </div>
                  </div>
                  );
                })()}


              </div>

              {/* ACTION BUTTONS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Regenerate Button */}
                  <button
                    id="btn-regenerate-awareness"
                    onClick={() => handleGenerate(activeResult.topic, activeResult.contentType, activeResult.tone, activeResult.language)}
                    disabled={isGenerating}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isGenerating ? 'Regenerating...' : t('awareness.regenerate', 'Regenerate')}</span>
                  </button>

                  {/* Edit Content Button */}
                  <button
                    id="btn-edit-awareness"
                    onClick={() => {
                      if (isEditing) {
                        handleSaveEdits();
                      } else {
                        setIsEditing(true);
                        setEditText(activeResult.generatedText);
                        setEditHeadline(activeResult.headline || '');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
                  >
                    {isEditing ? <Save className="w-3.5 h-3.5 text-emerald-600" /> : <Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{isEditing ? t('awareness.saveEdit', 'Save Edits') : t('awareness.editContent', 'Edit Content')}</span>
                  </button>

                  {/* Save to Library */}
                  <button
                    id="btn-savelibrary-awareness"
                    onClick={handleSaveToLibrary}
                    disabled={isSaving || !!activeResult.id}
                    className={`px-3.5 py-2 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border ${
                      activeResult.id ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 cursor-pointer'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${activeResult.id ? 'text-slate-400' : 'text-purple-600'}`} />
                    <span>{isSaving ? 'Saving...' : activeResult.id ? 'Saved' : t('awareness.saveLibrary', 'Save to Library')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Download Button */}
                  <button
                    id="btn-download-awareness"
                    onClick={handleDownload}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t('awareness.download', 'Download')}</span>
                  </button>

                  {/* Share via WhatsApp Button */}
                  <button
                    id="btn-share-whatsapp-awareness"
                    onClick={handleShareWhatsapp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{t('awareness.shareWhatsapp', 'Share via WhatsApp')}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* CONTENT LIBRARY SECTION (Full Width Card below Generator) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4.5 h-4.5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('awareness.libraryTitle', 'Your Content Library')}
                </h3>
              </div>

              <button
                id="btn-view-all-awareness-library"
                onClick={() => setShowAllLibrary(!showAllLibrary)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
              >
                {showAllLibrary ? 'Show Less' : t('awareness.viewAll', 'View All')}
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filters:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Content Type Filter */}
                <select
                  value={libraryTypeFilter}
                  onChange={(e) => setLibraryTypeFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
                >
                  <option value="All">{t('awareness.filterType', 'All Formats')}</option>
                  <option value="Poster">Poster</option>
                  <option value="WhatsApp Message">WhatsApp Message</option>
                  <option value="Audio Clip">Audio Clip</option>
                </select>

                {/* Language Filter */}
                <select
                  value={libraryLangFilter}
                  onChange={(e) => setLibraryLangFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
                >
                  <option value="All">{t('awareness.filterLang', 'All Languages')}</option>
                  <option value="English">English</option>
                  <option value="Malayalam">Malayalam</option>
                </select>
              </div>
            </div>

            {/* Library Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedLibrary.length === 0 && (
                <div className="col-span-full text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-sm font-semibold text-slate-500">No awareness content saved yet.</p>
                </div>
              )}
              {displayedLibrary.map((item) => {
                let IconComp = ImageIcon;
                if (item.contentType === 'WhatsApp Message') IconComp = MessageSquare;
                if (item.contentType === 'Audio Clip') IconComp = Volume2;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {item.contentType}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                          {item.language}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-900 line-clamp-2 leading-snug">
                        {item.topic}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.generatedText}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] font-semibold text-slate-400">
                      <span>{item.createdAt}</span>

                      <button
                        type="button"
                        onClick={() => handleReuse(item)}
                        className="px-2.5 py-1 bg-white hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-[11px] rounded-lg border border-purple-200 transition-colors shadow-2xs"
                      >
                        {t('awareness.reuse', 'Reuse')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Suggested Topics Sidebar Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* SUGGESTED TOPICS FOR YOUR AREA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-purple-600 fill-purple-100" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('awareness.suggestedTitle', 'Suggested Topics for Your Area')}
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                {userProfile.center}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Based on active disease outbreaks and community misinformation trends:
            </p>

            <div className="space-y-3">
              {suggestions.length === 0 ? (
                <div className="text-xs text-slate-500 font-medium p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  No urgent health topics detected. You can create content for general preventive care.
                </div>
              ) : suggestions.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 hover:bg-purple-50/60 rounded-xl border border-slate-200/60 hover:border-purple-200 transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {st.reason}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-900 leading-snug">
                    {st.topic}
                  </h4>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Priority: {st.priority}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setTopicInput(st.topic);
                        setContentType('Poster');
                        setTone('Simple & Friendly');
                        handleGenerate(st.topic, 'Poster', 'Simple & Friendly');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs font-extrabold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t('awareness.generateQuick', 'Generate →')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMMUNITY BROADCAST METRICS CARD */}
          <div className="bg-gradient-to-br from-teal-900 to-emerald-950 rounded-2xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="w-10 h-10 rounded-xl bg-teal-600/60 flex items-center justify-center border border-teal-400/30">
              <Share2 className="w-5 h-5 text-teal-200" />
            </div>

            <div>
              <h3 className="font-bold text-base text-teal-100">
                Community Reach Metrics
              </h3>
              <p className="text-xs text-teal-200/80 font-medium mt-1 leading-relaxed">
                {userProfile.name} has created {metrics.totalCampaigns} awareness items, with a total of {metrics.totalShares} shares and {metrics.totalDownloads} downloads.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs font-bold border-t border-teal-700/50">
              <div className="bg-teal-900/60 p-2 rounded-lg border border-teal-700/40">
                <span className="block text-lg font-black text-white">{metrics.totalCampaigns}</span>
                <span className="text-[10px] text-teal-300">Campaigns Created</span>
              </div>
              <div className="bg-teal-900/60 p-2 rounded-lg border border-teal-700/40">
                <span className="block text-lg font-black text-white">{metrics.totalShares}</span>
                <span className="text-[10px] text-teal-300">Total Shares</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
