import React, { useState } from 'react';
import { X, Stethoscope } from 'lucide-react';
import { Patient } from '../../types';

interface StartConsultationModalProps {
  patient: Patient;
  onClose: () => void;
  onSubmit: (symptoms: string, ashaNotes: string) => void;
}

export const StartConsultationModal: React.FC<StartConsultationModalProps> = ({
  patient,
  onClose,
  onSubmit
}) => {
  const [symptoms, setSymptoms] = useState(patient.conditions ? patient.conditions.join(', ') : '');
  const [ashaNotes, setAshaNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setValidationError('Reported Symptoms are required.');
      return;
    }
    
    onSubmit(symptoms.trim(), ashaNotes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-scale-up border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">Start Doctor Consultation</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 uppercase">Patient</label>
          <input
            type="text"
            disabled
            value={`${patient.name} (${patient.gender}, ${patient.age} yrs - ${patient.village})`}
            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
          />
        </div>

        {validationError && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Reported Symptoms <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Enter patient's reported symptoms..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">ASHA Worker's Notes</label>
            <textarea
              rows={3}
              value={ashaNotes}
              onChange={(e) => setAshaNotes(e.target.value)}
              placeholder="Enter relevant clinical observations..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Start Consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
