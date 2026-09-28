import React, { useState } from 'react';
import { 
  FileText, Video, X, PlayCircle, Info, 
  BookOpen, Activity, Heart, 
  Stethoscope, Droplet, UserPlus,
  MessageSquare
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';

type ModalType = 'none' | 'quick_start' | 'training_voice' | 'training_jsy' | 
  'training_patient' | 'training_doctor' | 'training_blood' | 'training_outbreak' |
  'training_awareness' | 'training_notifications' | 'user_manual' | 'about';

export const HelpSupportView: React.FC = () => {
  const { role } = useRole();
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  
  const ModalShell = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            {title}
          </h2>
          <button onClick={onClose} className="p-2 bg-white hover:bg-slate-100 rounded-full text-slate-500 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        <div className="p-5 bg-slate-50 border-t border-slate-200 shrink-0 text-right">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-fade-in">
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-800/30 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">Help & ASHA Support Desk</h1>
            <p className="text-teal-100 mt-2 text-sm md:text-base max-w-xl">
              Access training guides, workflow assistance, and support resources for your ASHA workflow.
            </p>
          </div>
          <button 
            onClick={() => setActiveModal('quick_start')}
            className="flex items-center gap-2 bg-white text-teal-900 px-6 py-3 rounded-xl font-bold hover:bg-teal-50 transition-colors shrink-0 shadow-xl shadow-black/10 cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            Start Quick Guide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Resources</h3>
            <div className="space-y-2">
              <button onClick={() => setActiveModal('user_manual')} className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer border border-slate-100">
                <span className="font-bold text-slate-700 flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-600" /> User Manual</span>
              </button>
              <button onClick={() => setActiveModal('about')} className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer border border-slate-100">
                <span className="font-bold text-slate-700 flex items-center gap-2"><Info className="w-4 h-4 text-teal-600" /> About SynCura AI</span>
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-teal-600" /> ASHA Training & Tutorial Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <button onClick={() => setActiveModal('training_voice')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer text-left transition-colors">
                <Video className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Voice Input Collection</div>
                  <div className="text-xs text-slate-500 mt-1">AI-assisted data entry</div>
                </div>
              </button>
              
              <button onClick={() => setActiveModal('training_jsy')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer text-left transition-colors">
                <FileText className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Filing JSY Incentive Claims</div>
                  <div className="text-xs text-slate-500 mt-1">Step-by-step submission</div>
                </div>
              </button>

              <button onClick={() => setActiveModal('training_patient')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer text-left transition-colors">
                <UserPlus className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Patient Management</div>
                  <div className="text-xs text-slate-500 mt-1">Registration & profiles</div>
                </div>
              </button>

              <button onClick={() => setActiveModal('training_doctor')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer text-left transition-colors">
                <Stethoscope className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Doctor Consultation</div>
                  <div className="text-xs text-slate-500 mt-1">Symptom reporting & advice</div>
                </div>
              </button>

              <button onClick={() => setActiveModal('training_blood')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer text-left transition-colors">
                <Droplet className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Blood Donation</div>
                  <div className="text-xs text-slate-500 mt-1">Coordination workflows</div>
                </div>
              </button>

              <button onClick={() => setActiveModal('training_outbreak')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer text-left transition-colors">
                <Activity className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Outbreak Monitoring</div>
                  <div className="text-xs text-slate-500 mt-1">Reporting community alerts</div>
                </div>
              </button>

              <button onClick={() => setActiveModal('training_awareness')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer text-left transition-colors">
                <Heart className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Awareness Content</div>
                  <div className="text-xs text-slate-500 mt-1">Generating health campaigns</div>
                </div>
              </button>

              <button onClick={() => setActiveModal('training_notifications')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer text-left transition-colors">
                <MessageSquare className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Notifications & Follow-up</div>
                  <div className="text-xs text-slate-500 mt-1">Managing schedules</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {activeModal === 'quick_start' && (
        <ModalShell title="Getting Started with SynCura AI" onClose={() => setActiveModal('none')}>
          <p className="text-slate-600 text-sm mb-6">Follow the recommended workflow for managing patients and community health activities natively in SynCura.</p>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {[
              "Register a Patient",
              "Collect Patient Information (Voice or Manual)",
              "Record a Health Visit",
              "Start Doctor Consultation",
              "Doctor Reviews the Case",
              "Receive Doctor Advice",
              "Schedule Follow-up",
              "Monitor Community Outbreaks",
              "Coordinate Blood Donation",
              "Create Awareness Content"
            ].map((step, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-teal-100 text-teal-700 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xs">
                  {idx + 1}
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm text-sm">
                  <h4 className="font-bold text-slate-800">{step}</h4>
                </div>
              </div>
            ))}
          </div>
        </ModalShell>
      )}

      {/* Basic Documentation Modals */}
      {activeModal === 'user_manual' && (
        <ModalShell title="SynCura AI User Manual" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h3 className="font-bold text-slate-900 text-lg">Table of Contents</h3>
            <ul className="list-decimal pl-5 font-medium space-y-1 text-teal-700">
              <li>Getting Started</li>
              <li>Patient Management</li>
              <li>Voice Input Collection</li>
              <li>Health Records</li>
              <li>Doctor Consultation</li>
              <li>Follow-ups</li>
              <li>Blood Donation Coordination</li>
              <li>Outbreak Monitoring</li>
              <li>Awareness Content</li>
              <li>Incentive Claims</li>
              <li>Notifications</li>
              <li>Help & Support</li>
            </ul>
            <p>This manual covers the strict workflow of SynCura AI. For specific feature guides, please refer to the Training Modules section on the Help page.</p>
          </div>
        </ModalShell>
      )}

      {activeModal === 'about' && (
        <ModalShell title="About SynCura AI" onClose={() => setActiveModal('none')}>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 mx-auto flex items-center justify-center shadow-lg shadow-teal-500/30 mb-4">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">SynCura AI</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-6">Autonomous Healthcare System</p>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              SynCura AI is a role-based healthcare coordination platform designed to support ASHA workers, doctors, and health extension supervisors in managing patient information, consultations, community health activities, and healthcare coordination.
            </p>
          </div>
        </ModalShell>
      )}

      {/* Individual Training Modals */}
      {activeModal === 'training_voice' && (
        <ModalShell title="Voice Input Data Collection" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700">
            <ol className="list-decimal pl-5 space-y-3 font-medium">
              <li>Navigate to the <strong>Voice Input</strong> tab on your dashboard.</li>
              <li>Select your preferred language (Malayalam or English).</li>
              <li>Click the large <strong>Microphone</strong> button and allow permissions.</li>
              <li>Speak clearly, describing patient symptoms and vitals.</li>
              <li>Click <strong>Stop Recording</strong>. Gemini AI will process the speech.</li>
              <li>Review the transcript and auto-filled data.</li>
              <li>Click <strong>Save to Patient Database</strong>.</li>
            </ol>
          </div>
        </ModalShell>
      )}

      {activeModal === 'training_jsy' && (
        <ModalShell title="Filing JSY Incentive Claims" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700">
            <ol className="list-decimal pl-5 space-y-3 font-medium">
              <li>Navigate to the <strong>Incentive Claims</strong> tab.</li>
              <li>View your current cycle summary.</li>
              <li>Click <strong>Submit New Claim</strong>.</li>
              <li>Enter notes regarding services provided.</li>
              <li>Click <strong>Submit Claim</strong>. Status becomes <em>Pending Review</em>.</li>
              <li>Monitor your claim status in the Claim History.</li>
            </ol>
          </div>
        </ModalShell>
      )}

      {activeModal === 'training_patient' && (
        <ModalShell title="Patient Management" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700">
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li><strong>Register patient:</strong> Click Add New Patient and enter demographic data.</li>
              <li><strong>Add conditions:</strong> Fill out reported conditions during registration.</li>
              <li><strong>Open patient profile:</strong> Click on a patient in the list.</li>
              <li><strong>View visit history:</strong> Found inside the profile under Health Records.</li>
              <li><strong>Add new visit:</strong> Click Add Visit to manually enter vitals.</li>
              <li><strong>Upload documents:</strong> Click Upload in the Documents tab of the profile.</li>
            </ul>
          </div>
        </ModalShell>
      )}

      {activeModal === 'training_doctor' && (
        <ModalShell title="Doctor Consultation" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700">
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li><strong>Start:</strong> Open a patient profile and click "Start Consultation".</li>
              <li><strong>Symptoms:</strong> Registered conditions are auto-filled. You can edit them.</li>
              <li><strong>ASHA Notes:</strong> Enter clinical notes for the doctor.</li>
              <li><strong>Submit:</strong> Click Submit. The consultation goes to the Doctor dashboard.</li>
              <li><strong>Doctor Review:</strong> The Medical Officer sees EXACT symptoms and notes.</li>
              <li><strong>Advice:</strong> Doctor enters prescription/advice and completes it.</li>
            </ul>
          </div>
        </ModalShell>
      )}

      {activeModal === 'training_blood' && (
        <ModalShell title="Blood Donation Coordination" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700">
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Go to the Blood Donation tab.</li>
              <li>Select a required blood group and urgency.</li>
              <li>Click "Broadcast Request".</li>
              <li>The system notifies matched donors.</li>
              <li>Wait for responses to appear in the active requests feed.</li>
            </ul>
          </div>
        </ModalShell>
      )}

      {activeModal === 'training_outbreak' && (
        <ModalShell title="Outbreak Monitoring" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700">
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Go to Outbreak Monitoring.</li>
              <li>View the active heatmap of health alerts.</li>
              <li>To report a case (like Dengue), click "Report Activity".</li>
              <li>Enter details and submit. Supervisors will monitor this data.</li>
            </ul>
          </div>
        </ModalShell>
      )}

      {activeModal === 'training_awareness' && (
        <ModalShell title="Awareness Content Generation" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700">
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Go to Awareness Content.</li>
              <li>Type a health topic you wish to educate the community about.</li>
              <li>Select tone and language.</li>
              <li>Click Generate. The AI will output a flyer/message.</li>
              <li>You can copy and distribute this content locally.</li>
            </ul>
          </div>
        </ModalShell>
      )}

      {activeModal === 'training_notifications' && (
        <ModalShell title="Notifications & Follow-up" onClose={() => setActiveModal('none')}>
          <div className="space-y-4 text-sm text-slate-700">
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li><strong>Notifications:</strong> Check the Bell icon for alerts about consultations, claims, and system messages.</li>
              <li><strong>Follow-ups:</strong> View scheduled patient check-ins.</li>
              <li>Complete follow-ups directly from the patient profile when you visit them.</li>
            </ul>
          </div>
        </ModalShell>
      )}

    </div>
  );
};
