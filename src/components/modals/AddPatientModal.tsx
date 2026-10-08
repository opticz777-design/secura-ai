import React, { useState } from 'react';
import { X, UserPlus, Save, Mic, Sparkles, CheckCircle2 } from 'lucide-react';
import { Patient } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { HEALTH_CENTRES } from '../../config/healthCentres';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: Patient) => void;
  patientToEdit?: Patient | null;
  onEditPatient?: (patient: Patient) => void;
  onNavigate?: (tab: string) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
  patientToEdit,
  onEditPatient,
  onNavigate
}) => {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>(28);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [village, setVillage] = useState(HEALTH_CENTRES[0].name);
  const [phone, setPhone] = useState('+91 98765 00000');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [email, setEmail] = useState('');
  const [conditionsStr, setConditionsStr] = useState('Routine Health Check');
  const [bp, setBp] = useState('');
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [isListening, setIsListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (patientToEdit) {
        setName(patientToEdit.name);
        setAge(patientToEdit.age);
        setGender(patientToEdit.gender as any);
        setVillage(patientToEdit.village);
        setPhone(patientToEdit.phone);
        setAddress(patientToEdit.address || '');
        setEmergencyContact(patientToEdit.emergencyContact || '');
        setEmail(patientToEdit.email || '');
        setConditionsStr(patientToEdit.conditions?.join(', ') || '');
        setBp(patientToEdit.vitals?.bp || '');
        setTemp(patientToEdit.vitals?.temp || '');
        setPulse(patientToEdit.vitals?.pulse || '');
        setWeight(patientToEdit.vitals?.weight || '');
      } else {
        setName('');
        setAge(28);
        setGender('Female');
        setVillage(HEALTH_CENTRES[0].name);
        setPhone('+91 98765 00000');
        setAddress('');
        setEmergencyContact('');
        setEmail('');
        setConditionsStr('Routine Health Check');
        setBp('');
        setTemp('');
        setPulse('');
        setWeight('');
      }
    }
  }, [isOpen, patientToEdit]);

  if (!isOpen) return null;

  const handleVoiceFill = () => {
    if (onNavigate) {
      onClose();
      onNavigate('voice-input');
    } else {
      setIsListening(true);
      setVoiceToast('Listening to ASHA voice dictation...');
      setTimeout(() => {
        setName('Fathima Beevi');
        setAge(29);
        setGender('Female');
        setVillage(HEALTH_CENTRES[4].name);
        setPhone('+91 98321 88221');
        setAddress(`House 14, ${HEALTH_CENTRES[4].name}`);
        setEmergencyContact('Khadar Beevi (Mother) - +91 98321 88222');
        setEmail('');
        setConditionsStr('Antenatal Care Trimester 1, Hemoglobin check');
        setBp('110/70');
        setTemp('98.6');
        setPulse(82);
        setWeight(65);
        setIsListening(false);
        setVoiceToast('Voice details prefilled successfully!');
        setTimeout(() => setVoiceToast(''), 3000);
      }, 1500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) {
      alert("Please enter a valid phone number with 10 to 15 digits.");
      return;
    }
    if (address && address.length < 5) {
      alert("Please enter a valid address (minimum 5 characters).");
      return;
    }

    const numAge = typeof age === 'number' ? age : 25;

    if (patientToEdit && onEditPatient) {
      onEditPatient({
        ...patientToEdit,
        name,
        age: numAge,
        gender,
        village,
        phone,
        address,
        emergencyContact,
        email: email || undefined,
        conditions: conditionsStr.split(',').map(s => s.trim()).filter(Boolean),
        vitals: (bp || pulse || temp || weight) ? {
          bp,
          pulse: Number(pulse) || 0,
          temp,
          weight: Number(weight) || 0
        } : undefined
      });
      onClose();
      return;
    }

    const newPatient: Patient = {
      id: `P-${Date.now().toString().slice(-3)}`,
      name,
      age: numAge,
      gender,
      status: 'Registered',
      lastVisit: 'Today',
      timestamp: 'Just now',
      avatar: DEFAULT_AVATAR,
      phone: phone || '+91 98765 00000',
      village,
      address: address || `${village} Village Sector`,
      emergencyContact: emergencyContact || 'Not provided',
      email: email || undefined,
      registrationDate: 'Today',
      assignedAsha: 'Anita Devi (ASHA Sector 1)',
      abhaId: `91-${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}`,
      conditions: conditionsStr.split(',').map(s => s.trim()),
      vitals: (bp || pulse || temp || weight) ? {
        bp,
        pulse: Number(pulse) || 0,
        temp,
        weight: Number(weight) || 0
      } : undefined,
      vitalsHistory: [],
      visitHistory: [
        { id: `VH-${Date.now()}`, date: 'Today', type: 'Registration Visit', symptoms: conditionsStr, doctorName: 'Anita Devi (ASHA)', notes: 'New patient registered in portal.' }
      ],
      documents: []
    };

    onAddPatient(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
            <UserPlus className="w-5 h-5 text-teal-600" />
            <span>{patientToEdit ? 'Edit Patient' : t('patients.addPatient', 'Register New Patient')}</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fill with Voice Bar */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-3 rounded-2xl border border-teal-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-teal-900 font-semibold">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>ASHA AI Voice Prefill</span>
          </div>
          <button
            type="button"
            onClick={handleVoiceFill}
            disabled={isListening}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isListening 
                ? 'bg-rose-600 text-white animate-pulse' 
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isListening ? t('voiceInput.listening', 'Listening...') : 'Fill with Voice'}</span>
          </button>
        </div>

        {voiceToast && (
          <div className="p-2.5 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 border border-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{voiceToast}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-800">
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('patients.name')}</label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Nair / Devika Menon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('patients.age')}</label>
              <input
                type="number"
                required
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('patients.village')}</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                {HEALTH_CENTRES.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender Radio Buttons */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">{t('patients.gender')}</label>
            <div className="flex items-center gap-6">
              {(['Female', 'Male', 'Other'] as const).map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    {g === 'Female' ? t('patients.female') : g === 'Male' ? t('patients.male') : t('patients.other')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                placeholder="Name (Relation) - Phone"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              placeholder="House/Plot No, Colony/Basti"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Primary Symptoms / Conditions</label>
            <input
              type="text"
              placeholder="e.g. Fever, Diabetes, ANC Checkup"
              value={conditionsStr}
              onChange={(e) => setConditionsStr(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          {/* Vitals Section */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Vitals (Optional)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">BP</label>
                <input type="text" placeholder="120/80" value={bp} onChange={e => setBp(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Temp (°F)</label>
                <input type="text" placeholder="98.6" value={temp} onChange={e => setTemp(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Pulse</label>
                <input type="number" placeholder="72" value={pulse} onChange={e => setPulse(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
                <input type="number" placeholder="65" value={weight} onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{patientToEdit ? 'Update Patient' : t('patients.addPatient', 'Save Patient')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

