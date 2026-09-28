import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  X, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Globe, 
  Save, 
  Pencil, 
  Lightbulb, 
  Clock, 
  Volume2
} from 'lucide-react';
import { Patient } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceInputViewProps {
  onSavePatient?: (patientData: Patient) => void;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing' | 'results';

interface ExtractedFields {
  name: string;
  age: number | string;
  gender: 'Female' | 'Male' | 'Other' | string;
  village: string;
  visitType: string;
  symptoms: string;
  bloodPressure: string;
  temperature: string;
  pulse: number | string;
  weight: number | string;
  allergies: string;
  medicalHistory: string;
  medications: string;
  clinicalSummary: string;
  notes: string;
}

interface RecentVoiceEntry {
  id: string;
  patientName: string;
  summary: string;
  timestamp: string;
  status: 'Saved' | 'Needs Review';
  language: 'Malayalam' | 'English';
}

const API_BASE_URL = 'http://localhost:5000/api';

export const VoiceInputView: React.FC<VoiceInputViewProps> = ({ onSavePatient }) => {
  const { t } = useLanguage();

  // State management
  const [activeLang, setActiveLang] = useState<'Malayalam' | 'English'>('Malayalam');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Transcript state
  const [transcriptText, setTranscriptText] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Extracted fields form state
  const [extractedFields, setExtractedFields] = useState<ExtractedFields>({
    name: '',
    age: '',
    gender: '',
    village: '',
    visitType: '',
    symptoms: '',
    bloodPressure: '',
    temperature: '',
    pulse: '',
    weight: '',
    allergies: '',
    medicalHistory: '',
    medications: '',
    clinicalSummary: '',
    notes: ''
  });

  // Recent entries list
  const [recentEntries, setRecentEntries] = useState<RecentVoiceEntry[]>([]);

  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(14).fill(10));

  // Fetch recent entries on mount
  useEffect(() => {
    fetchRecentEntries();
    return () => {
        cleanupAudio();
    };
  }, []);

  const fetchRecentEntries = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/voice/entries`);
      const data = await res.json();
      if (data.success) {
        setRecentEntries(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch recent entries:', err);
    }
  };

  const cleanupAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setAudioLevels(Array(14).fill(10));
  };

  // Recording Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState]);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Start recording handler
  const handleStartRecording = async () => {
    setErrorMessage(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup MediaRecorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        // Setup AudioContext for waveform
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateWaveform = () => {
            if (recordingState === 'paused') {
                animationFrameRef.current = requestAnimationFrame(updateWaveform);
                return;
            }
            analyser.getByteFrequencyData(dataArray);
            
            // Map frequencies to 14 bars
            const step = Math.floor(dataArray.length / 14);
            const newLevels = Array(14).fill(0).map((_, i) => {
                let sum = 0;
                for (let j = 0; j < step; j++) {
                    sum += dataArray[i * step + j];
                }
                const avg = sum / step;
                return Math.max(10, (avg / 255) * 100);
            });
            
            setAudioLevels(newLevels);
            animationFrameRef.current = requestAnimationFrame(updateWaveform);
        };
        
        updateWaveform();

        mediaRecorder.start();
        setRecordingState('recording');
        setRecordingSeconds(0);
        setIsEditingTranscript(false);

    } catch (err) {
        console.error("Microphone access error:", err);
        setErrorMessage("Microphone access was denied or is unavailable. Please allow microphone permission in your browser and try again.");
    }
  };

  // Pause / Resume handler
  const handlePauseResume = () => {
    if (recordingState === 'recording' && mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    } else if (recordingState === 'paused' && mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  // Stop & Process handler
  const handleStopAndProcess = () => {
    if (!mediaRecorderRef.current) return;
    
    setRecordingState('processing');
    
    mediaRecorderRef.current.onstop = async () => {
        cleanupAudio();
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('language', activeLang);

        try {
            const res = await fetch(`${API_BASE_URL}/voice/process`, {
                method: 'POST',
                body: formData,
            });
            
            const data = await res.json();
            
            if (data.success) {
                setTranscriptText(data.transcript);
                if (data.audioUrl) setAudioUrl(data.audioUrl);
                setExtractedFields({
                    name: data.extractedData.name || '',
                    age: data.extractedData.age !== null ? data.extractedData.age : '',
                    gender: data.extractedData.gender || '',
                    village: data.extractedData.village || '',
                    visitType: data.extractedData.visitType || 'Voice Input Consult',
                    symptoms: Array.isArray(data.extractedData.symptoms) ? data.extractedData.symptoms.join(', ') : (data.extractedData.symptoms || ''),
                    bloodPressure: data.extractedData.bloodPressure || '',
                    temperature: data.extractedData.temperature || '',
                    pulse: data.extractedData.pulse !== null ? data.extractedData.pulse : '',
                    weight: data.extractedData.weight !== null ? data.extractedData.weight : '',
                    allergies: Array.isArray(data.extractedData.allergies) ? data.extractedData.allergies.join(', ') : (data.extractedData.allergies || ''),
                    medicalHistory: Array.isArray(data.extractedData.medicalHistory) ? data.extractedData.medicalHistory.join(', ') : (data.extractedData.medicalHistory || ''),
                    medications: Array.isArray(data.extractedData.medications) ? data.extractedData.medications.join(', ') : (data.extractedData.medications || ''),
                    clinicalSummary: data.extractedData.clinicalSummary || '',
                    notes: data.extractedData.notes || ''
                });
                setRecordingState('results');
            } else {
                setErrorMessage(data.message || "Voice processing failed. Please try again.");
                setRecordingState('idle');
            }
        } catch (error) {
            console.error('API Error:', error);
            setErrorMessage("Network error during processing. Please ensure the backend is running.");
            setRecordingState('idle');
        }
    };

    mediaRecorderRef.current.stop();
  };

  // Cancel handler
  const handleCancel = () => {
    cleanupAudio();
    setRecordingState('idle');
    setRecordingSeconds(0);
    setTranscriptText('');
  };

  // Discard handler
  const handleDiscard = () => {
    setRecordingState('idle');
    setRecordingSeconds(0);
    setTranscriptText('');
    showToast('Voice session discarded.');
  };

  // Save to Patient Records handler
  const handleSaveToRecords = async () => {
    try {
        // Basic validation
        if (!extractedFields.name) {
            setErrorMessage("Patient name is required before saving this record.");
            return;
        }

        const res = await fetch(`${API_BASE_URL}/voice/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transcript: transcriptText,
                language: activeLang,
                extractedData: {
                    ...extractedFields,
                    age: extractedFields.age ? parseInt(extractedFields.age.toString()) : null,
                    pulse: extractedFields.pulse ? parseInt(extractedFields.pulse.toString()) : null,
                    weight: extractedFields.weight ? parseInt(extractedFields.weight.toString()) : null
                },
                status: 'Needs Review',
                audioUrl: audioUrl
            })
        });

        const data = await res.json();

        if (data.success) {
            if (onSavePatient && data.patient) {
                onSavePatient(data.patient);
            }
            showToast('Visit record saved successfully.');
            setRecordingState('idle');
            setAudioUrl(null);
            fetchRecentEntries();
        } else {
            setErrorMessage(data.message || "Failed to save record.");
        }
    } catch (error) {
        console.error('Save error:', error);
        setErrorMessage("Failed to save to database. Please try again.");
    }
  };

  // Helper for status label text
  const getStatusLabel = () => {
    switch (recordingState) {
      case 'recording': return t('voiceInput.listening', 'Listening...');
      case 'paused': return t('common.pause', 'Paused');
      case 'processing': return t('voiceInput.processing', 'Processing...');
      case 'results': return t('voiceInput.extractionComplete', 'Extraction Complete');
      default: return t('voiceInput.tapToStart', 'Tap to Start Recording');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-slide-down">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
            <span className="text-sm font-semibold">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
                <X className="w-5 h-5" />
            </button>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider mb-1">
            <Mic className="w-4 h-4 text-teal-600" />
            <span>Autonomous AI Voice Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('voiceInput.title', 'Voice Input Collection')}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t('voiceInput.subtitle', 'Record patient details naturally using voice — no typing required.')}
          </p>
        </div>

        {/* Language selector toggle pill */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <Globe className="w-4 h-4 text-slate-500 ml-1.5 mr-0.5 shrink-0" />
          {(['Malayalam', 'English'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setActiveLang(lang);
                showToast(`Language switched to ${lang}`);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeLang === lang
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'Malayalam' ? 'മലയാളം' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN / SINGLE-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / MAIN COLUMN (8 cols desktop) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 2. MAIN RECORDING PANEL */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs text-center relative overflow-hidden space-y-6">
            
            {/* Soft Ambient Background Aura when Recording */}
            {recordingState === 'recording' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-80 h-80 bg-teal-500/10 rounded-full animate-ping opacity-30" />
                <div className="w-60 h-60 bg-emerald-500/10 rounded-full animate-pulse opacity-40" />
              </div>
            )}

            <div className="relative z-10 max-w-md mx-auto space-y-5">
              
              {/* Language Indicator Badge */}
              <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-900 border border-teal-200/80 text-xs px-3.5 py-1 rounded-full font-bold">
                <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Active Language: {activeLang === 'Malayalam' ? 'മലയാളം' : 'English'}</span>
              </div>

              {/* Large Circular Microphone Button */}
              <div className="flex justify-center my-4">
                <button
                  id="main-voice-mic-btn"
                  onClick={() => {
                    if (recordingState === 'idle' || recordingState === 'results') {
                      handleStartRecording();
                    } else if (recordingState === 'recording') {
                      handleStopAndProcess();
                    }
                  }}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer relative ${
                    recordingState === 'recording'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white ring-8 ring-rose-500/20 animate-pulse scale-105'
                      : recordingState === 'paused'
                      ? 'bg-amber-500 hover:bg-amber-600 text-white ring-8 ring-amber-500/20'
                      : recordingState === 'processing'
                      ? 'bg-teal-700 text-white opacity-90 cursor-wait'
                      : 'bg-teal-700 hover:bg-teal-800 text-white ring-8 ring-teal-600/10 hover:scale-105 active:scale-95'
                  }`}
                  disabled={recordingState === 'processing'}
                >
                  {recordingState === 'recording' ? (
                    <>
                      <Mic className="w-10 h-10 mb-1 animate-bounce" />
                      <span className="text-xs font-mono font-bold tracking-wider">
                        {Math.floor(recordingSeconds / 60)}:
                        {(recordingSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </>
                  ) : recordingState === 'paused' ? (
                    <>
                      <Pause className="w-10 h-10 mb-1" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{t('common.pause', 'Paused')}</span>
                    </>
                  ) : recordingState === 'processing' ? (
                    <>
                      <Sparkles className="w-10 h-10 mb-1 animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">AI Thinking</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-11 h-11" />
                    </>
                  )}
                </button>
              </div>

              {/* Live Waveform Visualization Bar */}
              <div className="h-8 flex items-center justify-center gap-1.5">
                {recordingState === 'recording' || recordingState === 'paused' ? (
                  audioLevels.map((height, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-teal-600 rounded-full transition-all duration-75"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  ))
                ) : (
                  <div className="text-xs text-slate-400 font-medium">
                    Waveform inactive
                  </div>
                )}
              </div>

              {/* Status Label */}
              <div className="font-bold text-sm text-slate-800">
                {getStatusLabel()}
              </div>

              {/* Row of 3 Secondary Controls */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
                {/* Pause Button */}
                <button
                  id="voice-pause-btn"
                  onClick={handlePauseResume}
                  disabled={recordingState !== 'recording' && recordingState !== 'paused'}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    recordingState === 'recording' || recordingState === 'paused'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer shadow-2xs'
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {recordingState === 'paused' ? <Play className="w-3.5 h-3.5 text-teal-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{recordingState === 'paused' ? t('common.resume', 'Resume') : t('common.pause', 'Pause')}</span>
                </button>

                {/* Stop & Process Button */}
                <button
                  id="voice-stop-process-btn"
                  onClick={handleStopAndProcess}
                  disabled={recordingState !== 'recording' && recordingState !== 'paused'}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    recordingState === 'recording' || recordingState === 'paused'
                      ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer shadow-md'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{t('voiceInput.stopAndProcess', 'Stop & Process')}</span>
                </button>

                {/* Cancel Button */}
                <button
                  id="voice-cancel-btn"
                  onClick={handleCancel}
                  disabled={recordingState === 'idle'}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    recordingState !== 'idle'
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer'
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('common.cancel', 'Cancel')}</span>
                </button>
              </div>

            </div>
          </div>

          {/* 3. TRANSCRIPT & EXTRACTED FIELDS PANEL */}
          {recordingState === 'results' && (
            <div className="space-y-6 animate-scale-up">
              
              {/* Split into Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Column: Live Transcript Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                        <FileText className="w-4 h-4 text-teal-600" />
                        <span>Live Speech Transcript ({activeLang})</span>
                      </div>
                      <button
                        onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                        className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Transcript"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>

                    {isEditingTranscript ? (
                      <textarea
                        value={transcriptText}
                        onChange={(e) => setTranscriptText(e.target.value)}
                        rows={6}
                        className="w-full bg-slate-50 border border-teal-300 rounded-2xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 text-xs leading-relaxed font-mono min-h-[140px] max-h-[220px] overflow-y-auto">
                        "{transcriptText}"
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Audio Length: {recordingSeconds > 0 ? `${recordingSeconds}s` : 'Unknown'}</span>
                    <span className="text-teal-700 font-bold">Gemini STT Transcribed</span>
                  </div>
                </div>

                {/* Right Column: Auto-Extracted Patient Details Card */}
                <div className="bg-white p-5 rounded-3xl border border-teal-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Auto-Extracted Patient Details</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Patient Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-600 text-[11px]">{t('patients.name')}</label>
                        <Sparkles className="w-3 h-3 text-teal-500" title="Auto-extracted by AI" />
                      </div>
                      <input
                        type="text"
                        value={extractedFields.name}
                        onChange={(e) => setExtractedFields({ ...extractedFields, name: e.target.value })}
                        placeholder="Not provided"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder:text-slate-300 placeholder:font-medium"
                      />
                    </div>

                    {/* Age & Gender */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600 text-[11px]">{t('patients.age')}</label>
                          <Sparkles className="w-3 h-3 text-teal-500" />
                        </div>
                        <input
                          type="number"
                          value={extractedFields.age}
                          onChange={(e) => setExtractedFields({ ...extractedFields, age: e.target.value })}
                          placeholder="Not provided"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder:text-slate-300 placeholder:font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600 text-[11px]">{t('patients.gender')}</label>
                          <Sparkles className="w-3 h-3 text-teal-500" />
                        </div>
                        <select
                          value={extractedFields.gender}
                          onChange={(e) => setExtractedFields({ ...extractedFields, gender: e.target.value })}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-teal-600 ${!extractedFields.gender ? 'text-slate-300 font-medium' : 'text-slate-900'}`}
                        >
                          <option value="" disabled>Not provided</option>
                          <option value="Female">{t('patients.female')}</option>
                          <option value="Male">{t('patients.male')}</option>
                          <option value="Other">{t('patients.other')}</option>
                        </select>
                      </div>
                    </div>

                    {/* Village & Visit Type */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600 text-[11px]">{t('patients.village')}</label>
                          <Sparkles className="w-3 h-3 text-teal-500" />
                        </div>
                        <input
                          type="text"
                          value={extractedFields.village}
                          onChange={(e) => setExtractedFields({ ...extractedFields, village: e.target.value })}
                          placeholder="Not provided"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder:text-slate-300 placeholder:font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600 text-[11px]">Visit Type</label>
                          <Sparkles className="w-3 h-3 text-teal-500" />
                        </div>
                        <input
                          type="text"
                          value={extractedFields.visitType}
                          onChange={(e) => setExtractedFields({ ...extractedFields, visitType: e.target.value })}
                          placeholder="Not provided"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder:text-slate-300 placeholder:font-medium"
                        />
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-600 text-[11px]">Symptoms</label>
                        <Sparkles className="w-3 h-3 text-teal-500" />
                      </div>
                      <input
                        type="text"
                        value={extractedFields.symptoms}
                        onChange={(e) => setExtractedFields({ ...extractedFields, symptoms: e.target.value })}
                        placeholder="Not provided"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder:text-slate-300 placeholder:font-medium"
                      />
                    </div>

                    {/* Vitals (BP, Temp, Pulse) */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600 text-[10px]">BP</label>
                          <Sparkles className="w-3 h-3 text-teal-500" />
                        </div>
                        <input
                          type="text"
                          value={extractedFields.bloodPressure}
                          onChange={(e) => setExtractedFields({ ...extractedFields, bloodPressure: e.target.value })}
                          placeholder="---"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-teal-800 text-center text-xs placeholder:text-slate-300 placeholder:font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600 text-[10px]">Temp</label>
                          <Sparkles className="w-3 h-3 text-teal-500" />
                        </div>
                        <input
                          type="text"
                          value={extractedFields.temperature}
                          onChange={(e) => setExtractedFields({ ...extractedFields, temperature: e.target.value })}
                          placeholder="---"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-amber-800 text-center text-xs placeholder:text-slate-300 placeholder:font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600 text-[10px]">Pulse</label>
                          <Sparkles className="w-3 h-3 text-teal-500" />
                        </div>
                        <input
                          type="text"
                          value={extractedFields.pulse}
                          onChange={(e) => setExtractedFields({ ...extractedFields, pulse: e.target.value })}
                          placeholder="---"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-blue-800 text-center text-xs placeholder:text-slate-300 placeholder:font-medium"
                        />
                      </div>
                    </div>

                    {/* Allergies */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-600 text-[11px]">Allergies</label>
                        <Sparkles className="w-3 h-3 text-teal-500" />
                      </div>
                      <input
                        type="text"
                        value={extractedFields.allergies}
                        onChange={(e) => setExtractedFields({ ...extractedFields, allergies: e.target.value })}
                        placeholder="Not provided"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-600 placeholder:text-slate-300"
                      />
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-600 text-[11px]">AI Clinical Summary & Notes</label>
                        <Sparkles className="w-3 h-3 text-teal-500" />
                      </div>
                      <textarea
                        rows={2}
                        value={extractedFields.clinicalSummary || extractedFields.notes}
                        onChange={(e) => setExtractedFields({ ...extractedFields, notes: e.target.value })}
                        placeholder="Not provided"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Confirmation Bar */}
              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-end gap-3 shadow-2xs">
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {t('common.discard', 'Discard')}
                </button>
                <button
                  onClick={handleSaveToRecords}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('voiceInput.saveToRecords', 'Save to Patient Records')}</span>
                </button>
              </div>

            </div>
          )}

          {/* 4. RECENT VOICE ENTRIES SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>{t('voiceInput.recentEntries', 'Recent Voice Entries')}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {recentEntries.length === 0 ? (
                <div className="text-sm font-medium text-slate-400 py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No voice entries yet.<br/>Record a patient's details to see them here.
                </div>
              ) : (
                recentEntries.map((entry) => (
                  <div key={entry.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs">{entry.patientName}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">• {entry.language === 'Malayalam' ? 'മലയാളം' : 'English'}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5 line-clamp-1">
                          {entry.summary}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border self-start sm:self-center shrink-0 ${
                      entry.status === 'Saved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN / SIDEBAR (4 cols desktop) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 5. SIDE TIP CARD */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
              <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-100" />
              <span>{t('voiceInput.tips', 'Voice Input Tips')}</span>
            </div>

            <ul className="space-y-3 text-xs font-medium text-teal-950">
              <li className="flex items-start gap-2.5 bg-white/80 p-3 rounded-2xl border border-teal-100">
                <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span>Speak clearly and mention one symptom at a time for maximum accuracy.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-white/80 p-3 rounded-2xl border border-teal-100">
                <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span>Say the patient's full name, age, and village first to speed up identification.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-white/80 p-3 rounded-2xl border border-teal-100">
                <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span>State measured vitals directly (e.g. "BP 120 over 80, Temperature 100 degrees").</span>
              </li>
            </ul>
          </div>

          {/* Quick AI Voice Stats Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Info</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-lg font-black text-slate-900 block">Gemini</span>
                <span className="text-[10px] text-slate-500 font-bold">AI Engine</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-lg font-black text-teal-700 block">Live</span>
                <span className="text-[10px] text-slate-500 font-bold">API Status</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
