import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Patient, HealthRecord } from '../../types';

interface AddVisitModalProps {
  patient: Patient;
  onClose: () => void;
  onAddRecord: (record: Partial<HealthRecord>) => Promise<boolean>;
}

export const AddVisitModal: React.FC<AddVisitModalProps> = ({
  patient,
  onClose,
  onAddRecord
}) => {
  const [newVisitType, setNewVisitType] = useState<HealthRecord['visitType']>('Routine Checkup');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newRecordedBy, setNewRecordedBy] = useState<HealthRecord['recordedBy']>('ASHA Worker');
  const [newSymptoms, setNewSymptoms] = useState<string>('');
  const [newBp, setNewBp] = useState<string>('');
  const [newPulse, setNewPulse] = useState<string>('');
  const [newTemp, setNewTemp] = useState<string>('');
  const [newWeight, setNewWeight] = useState<string>('');
  const [newSpO2, setNewSpO2] = useState<string>('');
  const [newNeedsDoctorReview, setNewNeedsDoctorReview] = useState<boolean>(false);
  const [newDoctorNotes, setNewDoctorNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (newBp && !/^\d{2,3}\/\d{2,3}$/.test(newBp)) {
      setValidationError("Please enter blood pressure in the format 120/80.");
      return;
    }

    setIsSubmitting(true);
    const partialRecord: Partial<HealthRecord> = {
      patientId: patient.id,
      visitType: newVisitType,
      date: newDate || new Date().toISOString().split('T')[0],
      recordedBy: newRecordedBy,
      symptoms: newSymptoms,
      summary: newSymptoms.length > 60 ? `${newSymptoms.slice(0, 60)}...` : newSymptoms,
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
      onClose();
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-scale-up border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">Add New Health Record</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">Patient</label>
            <input
              type="text"
              disabled
              value={`${patient.name} (${patient.gender}, ${patient.age} yrs - ${patient.village})`}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
            />
          </div>

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
              <label className="block text-xs font-bold text-slate-700 uppercase">Recorded By</label>
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

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase">Patient Vitals</label>
              {validationError && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  {validationError}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">BP</span>
                <input
                  type="text"
                  value={newBp}
                  onChange={(e) => setNewBp(e.target.value)}
                  className={`w-full bg-slate-50 border ${validationError ? 'border-rose-400 focus:ring-rose-600' : 'border-slate-200 focus:ring-teal-600'} rounded-lg p-2 text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-2`}
                  placeholder="e.g. 120/80"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Pulse (bpm)</span>
                <input
                  type="number"
                  value={newPulse}
                  onChange={(e) => setNewPulse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Temp</span>
                <input
                  type="text"
                  value={newTemp}
                  onChange={(e) => setNewTemp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="e.g. 98.6°F"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Weight (kg)</span>
                <input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">SpO2 (%)</span>
                <input
                  type="number"
                  value={newSpO2}
                  onChange={(e) => setNewSpO2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

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

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSubmitting ? 'Saving...' : 'Save Health Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
