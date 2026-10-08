import React, { useState } from 'react';
import { RoleProvider, useRole, USERS_BY_ROLE } from './context/RoleContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/views/DashboardView';
import { VoiceInputView } from './components/views/VoiceInputView';
import { BloodDonationView } from './components/views/BloodDonationView';
import { AwarenessContentView } from './components/views/AwarenessContentView';
import { PatientsView } from './components/views/PatientsView';
import { TeleconsultationView } from './components/views/TeleconsultationView';
import { HealthRecordsView } from './components/views/HealthRecordsView';
import { OutbreakMonitoringView } from './components/views/OutbreakMonitoringView';

import { IncentiveClaimsView } from './components/views/IncentiveClaimsView';
import { MisinformationCheckView } from './components/views/MisinformationCheckView';
import { NotificationsView } from './components/views/NotificationsView';
import { SettingsView } from './components/views/SettingsView';
import { HelpSupportView } from './components/views/HelpSupportView';
import { AddPatientModal } from './components/modals/AddPatientModal';
import LoginPage from './components/views/LoginPage';
import RoleSelectionPage from './components/views/RoleSelectionPage';

import {
  INITIAL_BLOOD_DONORS,
  INITIAL_BLOOD_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONSULTATIONS,
  INITIAL_INCENTIVE_CLAIMS
} from './data/mockData';

import { ActiveTab, Role, Patient, Appointment, OutbreakAlert, Incentive, BloodRequest, BloodDonor, NotificationItem, Consultation, IncentiveClaim, HealthRecord } from './types';
import { ShieldAlert, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

import { DEFAULT_AVATAR } from './utils/constants';
import { apiFetch } from './utils/api';

function AppContent() {
  const { t } = useLanguage();
  const { role, primaryTabs, allRoles, userProfile, isAuthenticated, isLoadingAuth } = useRole();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setSelectedRole(null);
    }
  }, [isAuthenticated]);

  // App State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoadingDashboardStats, setIsLoadingDashboardStats] = useState(false);

  React.useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoadingDashboardStats(true);
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await apiFetch(`${baseUrl}/dashboard/stats`);
        const json = await res.json();
        if (json.success) {
          setDashboardStats(json.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setIsLoadingDashboardStats(false);
      }
    };
    if (isAuthenticated) {
      fetchDashboardStats();
    }
    const fetchPatients = async () => {
      setIsLoadingPatients(true);
      setPatientsError(null);
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await apiFetch(`${baseUrl}/patients`);
        const json = await res.json();

        if (json.success) {
          const mappedPatients: Patient[] = json.data.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            age: p.age,
            gender: p.gender,
            status: p.status,
            lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('en-GB') : 'No visits yet',
            timestamp: new Date().toISOString(),
            avatar: DEFAULT_AVATAR,
            phone: p.phone || '',
            village: p.village,
            conditions: Array.isArray(p.conditions) 
              ? p.conditions 
              : (typeof p.conditions === 'string' 
                  ? (p.conditions.startsWith('[') ? JSON.parse(p.conditions) : [p.conditions]) 
                  : []),
            address: p.address,
            emergencyContact: p.emergencyContact,
            ashaWorkerId: p.ashaWorkerId,
            assignedAsha: p.assignedAsha
          }));
          setPatients(mappedPatients);
        } else {
          setPatientsError(json.error || 'Failed to load patients');
        }
      } catch (err) {
        setPatientsError('Unable to load patients — check your connection');
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();

    const fetchOutbreakAlerts = async () => {
      setIsLoadingOutbreakAlerts(true);
      setOutbreakAlertsError(null);
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await apiFetch(`${baseUrl}/outbreak-alerts`);
        const json = await res.json();
        if (json.success) {
          setOutbreakAlerts(json.data);
        } else {
          setOutbreakAlertsError(json.error || 'Failed to load outbreak alerts');
        }
      } catch (err) {
        setOutbreakAlertsError('Unable to load outbreak alerts — check your connection');
      } finally {
        setIsLoadingOutbreakAlerts(false);
      }
    };

    fetchOutbreakAlerts();

    const fetchHealthRecords = async () => {
      setIsLoadingHealthRecords(true);
      setHealthRecordsError(null);
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await apiFetch(`${baseUrl}/health-records`);
        const json = await res.json();

        if (json.success) {
          const mappedRecords: HealthRecord[] = json.data.map((r: any) => ({
            id: String(r.id),
            patientId: r.patientId,
            patientName: r.patientName || 'Unknown Patient',
            patientAvatar: DEFAULT_AVATAR,
            age: r.age || 0,
            gender: r.gender || 'Other',
            village: r.village || 'Unknown',
            visitType: r.visitType || 'Routine Checkup',
            date: r.date ? new Date(r.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            recordedBy: r.recordedBy || 'ASHA Worker',
            recordedByName: r.recordedByName,
            symptoms: r.symptoms || '',
            summary: r.summary || r.notes || r.symptoms || '',
            status: r.status || 'Pending Review',
            needsDoctorReview: r.status === 'Pending Review',
            followUpScheduled: r.followUpScheduled,
            followUpDate: r.followUpDate,
            vitals: (() => {
              let parsedVitals = r.vitals;
              if (typeof r.vitals === 'string') {
                try {
                  parsedVitals = JSON.parse(r.vitals);
                } catch (e) {
                  parsedVitals = {};
                }
              }
              return parsedVitals && Object.keys(parsedVitals).length > 0 ? {
                bp: parsedVitals.bp,
                pulse: parsedVitals.pulse,
                temp: parsedVitals.temp,
                weight: parsedVitals.weight
              } : undefined;
            })(),
            doctorNotes: r.notes || r.doctorNotes,
            doctorName: r.doctorName,
            attachments: r.attachments || [],
            visitHistoryNumber: r.visitHistoryNumber,
            previousVisitDaysAgo: r.previousVisitDaysAgo
          }));
          setHealthRecords(mappedRecords);
        } else {
          setHealthRecordsError(json.error || 'Failed to load health records');
        }
      } catch (err) {
        setHealthRecordsError('Unable to load health records — check your connection');
      } finally {
        setIsLoadingHealthRecords(false);
      }
    };

    const fetchConsultations = async () => {
      setIsLoadingConsultations(true);
      setConsultationsError(null);
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await apiFetch(`${baseUrl}/consultations`);
        const json = await res.json();

        if (json.success) {
          const mappedConsultations: Consultation[] = json.data.map((r: any) => ({
            id: String(r.id),
            patientId: r.patientId,
            ashaWorkerName: r.ashaWorkerName || 'Unknown Worker',
            symptoms: r.symptoms || '',
            priority: r.priority || 'Normal',
            status: r.status || 'Pending',
            submittedAt: r.submittedAt || new Date().toISOString(),
            ashaNotes: r.ashaNotes || '',
            doctorNotes: r.doctorNotes || r.notes || '',
            simplifiedNotes: r.simplifiedNotes || '',
            visitType: r.visitType || 'Tele-consultation',
            patientName: r.patientName || 'Unknown Patient', // Mapped from joined backend table
            age: r.age,
            gender: r.gender,
            village: r.village
          }));
          setConsultations(mappedConsultations);
        } else {
          setConsultationsError(json.error || 'Failed to load consultations');
        }
      } catch (err) {
        setConsultationsError('Unable to load consultations — check your connection');
      } finally {
        setIsLoadingConsultations(false);
      }
    };

    const fetchBloodData = async () => {
      setIsLoadingBloodData(true);
      setBloodDataError(null);
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const [donorsRes, requestsRes] = await Promise.all([
          apiFetch(`${baseUrl}/donors`),
          apiFetch(`${baseUrl}/blood-requests`)
        ]);

        const donorsJson = await donorsRes.json();
        const requestsJson = await requestsRes.json();

        if (donorsJson.success && requestsJson.success) {
          const mappedDonors: BloodDonor[] = donorsJson.data.map((d: any) => ({
            id: String(d.id),
            name: d.name || 'Unknown Donor',
            bloodGroup: d.bloodGroup,
            email: d.email,
            village: d.village,
            age: d.age,
            lastDonated: d.lastDonated ? new Date(d.lastDonated).toLocaleDateString('en-GB') : 'Never',
            eligibilityStatus: d.eligibilityStatus || 'Eligible',
            phone: d.phone || 'Not provided',
            gender: d.gender || 'Unknown',
            distanceKm: d.distanceKm || 2.5,
            isAvailable: d.isAvailable !== false,
            avatar: DEFAULT_AVATAR
          }));

          const mappedRequests: BloodRequest[] = requestsJson.data.map((r: any) => ({
            id: String(r.id),
            patientName: r.patientName || 'Unknown Patient',
            bloodGroup: r.bloodGroup,
            unitsNeeded: r.unitsNeeded,
            urgency: r.urgency || 'Urgent',
            hospital: r.hospital,
            village: r.village,
            postedAt: r.postedAt ? new Date(r.postedAt).toLocaleDateString('en-GB') : 'Just now',
            status: r.status || 'Active',
            matchedDonorsCount: r.matchedDonorsCount || 0,
            requesterContact: r.requesterContact || 'Not provided',
            notes: r.notes || ''
          }));

          setBloodDonors(mappedDonors);
          setBloodRequests(mappedRequests);
        } else {
          setBloodDataError('Failed to load blood donation data');
        }
      } catch (err) {
        setBloodDataError('Unable to load blood donation data — check your connection');
      } finally {
        setIsLoadingBloodData(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await apiFetch(`${baseUrl}/notifications`);
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data);
        }
      } catch (err) {
        console.error("Failed to load notifications");
      }
    };

    const fetchIncentiveClaims = async () => {
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        if (role === 'SUPERVISOR') {
          const pendingRes = await apiFetch(`${baseUrl}/incentive-claims/pending`);
          const historyRes = await apiFetch(`${baseUrl}/incentive-claims/history`);
          const pendingJson = await pendingRes.json();
          const historyJson = await historyRes.json();
          if (pendingJson.success && historyJson.success) {
            const combined = [...pendingJson.data, ...historyJson.data].sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setIncentiveClaims(combined);
          }
        }
      } catch (err) {
        console.error("Failed to load incentive claims");
      }
    };

    fetchHealthRecords();
    fetchConsultations();
    fetchBloodData();
    fetchNotifications();
    fetchIncentiveClaims();
  }, [isAuthenticated, role]);

  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [isLoadingHealthRecords, setIsLoadingHealthRecords] = useState(false);
  const [healthRecordsError, setHealthRecordsError] = useState<string | null>(null);

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  const [consultationsError, setConsultationsError] = useState<string | null>(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [outbreakAlerts, setOutbreakAlerts] = useState<OutbreakAlert[]>([]);
  const [isLoadingOutbreakAlerts, setIsLoadingOutbreakAlerts] = useState(false);
  const [outbreakAlertsError, setOutbreakAlertsError] = useState<string | null>(null);
  const [bloodDonors, setBloodDonors] = useState<BloodDonor[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [isLoadingBloodData, setIsLoadingBloodData] = useState(false);
  const [bloodDataError, setBloodDataError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [incentiveClaims, setIncentiveClaims] = useState<IncentiveClaim[]>(INITIAL_INCENTIVE_CLAIMS);

  // Add/Edit Patient Modal
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const isTabAvailable = primaryTabs.includes(activeTab);

  const handleAddPatient = async (newPatient: Patient) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userProfile.id,
          'x-user-role': role,
          'x-user-center': userProfile.center,
          'x-user-name': userProfile.name
        },
        body: JSON.stringify({
          name: newPatient.name,
          age: newPatient.age,
          gender: newPatient.gender,
          village: newPatient.village,
          status: newPatient.status,
          phone: newPatient.phone,
          email: newPatient.email,
          address: newPatient.address || '',
          emergencyContact: newPatient.emergencyContact || '',
          conditions: newPatient.conditions,
          vitals: newPatient.vitals,
          lastVisit: new Date().toISOString()
        })
      });
      const json = await res.json();

      if (json.success) {
        const completePatient: Patient = {
          ...newPatient,
          id: String(json.data.id),
        };
        
        if (json.duplicate) {
          alert("Existing patient found — using the patient's existing record.");
          setPatients(prev => {
            if (!prev.some(p => p.id === completePatient.id)) {
              return [completePatient, ...prev];
            }
            return prev;
          });
        } else {
          setPatients(prev => [completePatient, ...prev]);
        }

        if (json.healthRecord) {
          const completeRecord: HealthRecord = {
            ...json.healthRecord,
            id: String(json.healthRecord.id),
            patientName: completePatient.name,
            patientAvatar: DEFAULT_AVATAR,
            age: completePatient.age,
            gender: completePatient.gender,
            village: completePatient.village,
            summary: json.healthRecord.notes || 'Patient registered',
            needsDoctorReview: true
          };
          setHealthRecords(prev => [completeRecord, ...prev]);
        }
      } else {
        alert("Failed to save patient: " + json.error);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/patients/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPatients(prev => prev.filter(p => String(p.id) !== String(id)));
        setHealthRecords(prev => prev.filter(r => String(r.patientId) !== String(id)));
        setConsultations(prev => prev.filter(c => String(c.patientId) !== String(id)));
      } else {
        alert("Failed to delete patient: " + json.error);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  const handleVoicePatientSaved = (savedPatient: Patient) => {
    const formattedPatient: Patient = {
      ...savedPatient,
      id: String(savedPatient.id),
      lastVisit: savedPatient.lastVisit ? new Date(savedPatient.lastVisit).toLocaleDateString('en-GB') : 'No visits yet',
      avatar: savedPatient.avatar === 'default.jpg' || !savedPatient.avatar ? DEFAULT_AVATAR : savedPatient.avatar,
      phone: savedPatient.phone || '',
      conditions: Array.isArray(savedPatient.conditions) 
        ? savedPatient.conditions 
        : (typeof savedPatient.conditions === 'string' 
            ? ((savedPatient.conditions as any).startsWith('[') ? JSON.parse(savedPatient.conditions as any) : [savedPatient.conditions])
            : []),
    };

    setPatients(prev => {
      const exists = prev.find(p => String(p.id) === String(formattedPatient.id));
      if (exists) {
        return prev.map(p => String(p.id) === String(formattedPatient.id) ? { ...p, ...formattedPatient } : p);
      }
      return [formattedPatient, ...prev];
    });
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/patients/${updatedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedPatient.name,
          age: updatedPatient.age,
          gender: updatedPatient.gender,
          village: updatedPatient.village,
          phone: updatedPatient.phone,
          email: updatedPatient.email,
          address: updatedPatient.address,
          emergencyContact: updatedPatient.emergencyContact,
          conditions: updatedPatient.conditions,
          vitals: updatedPatient.vitals
        })
      });
      const json = await res.json();
      if (json.success) {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p));
        
        if (json.healthRecord) {
          const completeRecord: HealthRecord = {
            ...json.healthRecord,
            id: String(json.healthRecord.id),
            patientName: updatedPatient.name,
            patientAvatar: DEFAULT_AVATAR,
            age: updatedPatient.age,
            gender: updatedPatient.gender,
            village: updatedPatient.village,
            summary: json.healthRecord.notes || 'Vitals updated via patient profile',
            needsDoctorReview: true
          };
          setHealthRecords(prev => [completeRecord, ...prev]);
        }
      } else {
        alert("Failed to update patient: " + json.error);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  const handleAddHealthRecord = async (newRecord: Partial<HealthRecord>) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/health-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: newRecord.patientId,
          visitType: newRecord.visitType,
          date: new Date().toISOString(),
          recordedBy: newRecord.recordedBy,
          symptoms: newRecord.symptoms,
          vitals: newRecord.vitals,
          notes: newRecord.doctorNotes || newRecord.summary,
          status: newRecord.status || 'Pending Review'
        })
      });
      const json = await res.json();

      if (json.success) {
        if (json.duplicate) {
          alert("This health record already exists for this patient today.");
          return true; // Return true to close modal without duplicating in UI
        }

        const p = patients.find(p => p.id === newRecord.patientId);
        const completeRecord: HealthRecord = {
          ...(newRecord as HealthRecord),
          id: String(json.data.id),
          patientName: p?.name || 'Unknown Patient',
          patientAvatar: DEFAULT_AVATAR,
          age: p?.age || 0,
          gender: p?.gender || 'Other',
          village: p?.village || 'Unknown',
          summary: newRecord.summary || newRecord.symptoms || '',
          status: newRecord.status || 'Pending Review',
          needsDoctorReview: (newRecord.status || 'Pending Review') === 'Pending Review'
        };
        setHealthRecords(prev => [completeRecord, ...prev]);
        return true;
      } else {
        alert("Failed to save health record: " + json.error);
        return false;
      }
    } catch (err) {
      alert("Failed to connect to the server.");
      return false;
    }
  };

  const handleUpdateHealthRecordStatus = async (id: string, newStatus: string) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/health-records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      const json = await res.json();

      if (json.success) {
        setHealthRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any, needsDoctorReview: newStatus === 'Pending Review' } : r));
        return true;
      } else {
        alert("Failed to update health record: " + json.error);
        return false;
      }
    } catch (err) {
      alert("Failed to connect to the server.");
      return false;
    }
  };

  const handleUpdateConsultation = async (updated: Consultation) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/consultations/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: updated.status,
          doctorNotes: updated.doctorNotes,
          simplifiedNotes: updated.simplifiedNotes
        })
      });
      const json = await res.json();

      if (json.success) {
        setConsultations(prev => prev.map(c => c.id === updated.id ? updated : c));
        return true;
      } else {
        alert("Failed to update consultation: " + json.error);
        return false;
      }
    } catch (err) {
      alert("Failed to connect to the server.");
      return false;
    }
  };



  const handleAddIncentiveClaim = (newClaim: IncentiveClaim) => {
    setIncentiveClaims(prev => [newClaim, ...prev]);
  };

  const handleUpdateIncentiveClaim = async (updatedClaim: IncentiveClaim) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/incentive-claims/claims/${updatedClaim.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedClaim.status })
      });
      const json = await res.json();
      if (json.success) {
        setIncentiveClaims(prev => prev.map(c => c.id === updatedClaim.id ? { ...c, status: updatedClaim.status } : c));
        return true;
      } else {
        console.error("Failed to update claim status: " + json.error);
        return false;
      }
    } catch (err) {
      console.error("Failed to connect to the server.");
      return false;
    }
  };

  const handleAddBloodRequest = async (newRequest: BloodRequest) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/blood-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: newRequest.patientName,
          bloodGroup: newRequest.bloodGroup,
          unitsNeeded: newRequest.unitsNeeded,
          urgency: newRequest.urgency,
          hospital: newRequest.hospital,
          village: newRequest.village,
          postedAt: new Date().toISOString(),
          status: newRequest.status,
          matchedDonorsCount: newRequest.matchedDonorsCount
        })
      });
      const json = await res.json();
      if (json.success) {
        setBloodRequests(prev => [{ ...newRequest, id: String(json.data.id) }, ...prev]);
      } else {
        alert("Failed to save blood request: " + json.error);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  const handleAddDonor = async (newDonor: BloodDonor) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDonor.name,
          phone: newDonor.phone,
          email: newDonor.email,
          bloodGroup: newDonor.bloodGroup,
          village: newDonor.village,
          age: newDonor.age,
          lastDonated: newDonor.lastDonated === 'Never' ? null : new Date().toISOString(),
          eligibilityStatus: newDonor.eligibilityStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        setBloodDonors(prev => [{ ...newDonor, id: String(json.data.id) }, ...prev]);
      } else {
        alert("Failed to register donor: " + json.error);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  const handleDeleteDonor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this donor?')) return;
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/donors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBloodDonors(prev => prev.filter(d => d.id !== id));
      } else {
        alert("Failed to delete donor");
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  const handleEditDonor = async (updatedDonor: BloodDonor) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/donors/${updatedDonor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDonor)
      });
      const json = await res.json();
      if (json.success) {
        setBloodDonors(prev => prev.map(d => d.id === updatedDonor.id ? updatedDonor : d));
      } else {
        alert("Failed to edit donor: " + json.error);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  const handleUpdateBloodRequest = async (updatedReq: BloodRequest) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await apiFetch(`${baseUrl}/blood-requests/${updatedReq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updatedReq.status
        })
      });
      const json = await res.json();
      if (json.success) {
        setBloodRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
      } else {
        alert("Failed to update blood request: " + json.error);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    }
  };

  const handleAddOutbreakAlert = (newAlert: OutbreakAlert) => {
    setOutbreakAlerts(prev => [newAlert, ...prev]);
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      await apiFetch(`${baseUrl}/notifications/read-all`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read");
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      await apiFetch(`${baseUrl}/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read");
    }
  };

  const handleSelectPatientForConsultation = async (patient: Patient, symptoms: string, ashaNotes: string) => {
    const existing = consultations.find(c => c.patientId === patient.id);
    if (existing) {
      setSelectedConsultationId(existing.id);
    } else {
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await apiFetch(`${baseUrl}/consultations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patient.id,
            ashaWorkerName: 'Anita Devi (ASHA)',
            symptoms: symptoms,
            priority: patient.status === 'Critical' ? 'Urgent' : 'Normal',
            status: 'Waiting',
            submittedAt: new Date().toISOString(),
            visitType: 'Field Teleconsultation',
            ashaNotes: ashaNotes
          })
        });
        const json = await res.json();
        if (json.success) {
          const newCons: Consultation = {
            id: String(json.data.id),
            patientId: patient.id,
            patientName: patient.name,
            age: patient.age,
            gender: patient.gender,
            village: patient.village,
            phone: patient.phone,
            avatar: patient.avatar,
            symptoms: json.data.symptoms,
            priority: json.data.priority,
            status: json.data.status,
            submittedAt: 'Just now',
            ashaWorkerName: json.data.ashaWorkerName,
            ashaNotes: json.data.ashaNotes,
            visitType: json.data.visitType,
            vitals: patient.vitals ? {
              bp: patient.vitals.bp,
              pulse: patient.vitals.pulse,
              temp: patient.vitals.temp,
              weight: patient.vitals.weight
            } : undefined
          };
          setConsultations(prev => [newCons, ...prev]);
          setSelectedConsultationId(newCons.id);
        } else {
          alert("Failed to create consultation: " + json.error);
          return;
        }
      } catch (err) {
        alert("Failed to connect to the server.");
        return;
      }
    }
    // Removed fake appointment generation
    setActiveTab('teleconsultation');
  };

  const handleSelectConsultationFromDashboard = (consultationId: string) => {
    setSelectedConsultationId(consultationId);
    setActiveTab('teleconsultation');
  };

  // If loading auth, show a spinner or empty screen
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not authenticated, show RoleSelectionPage or LoginPage
  if (!isAuthenticated) {
    if (!selectedRole) {
      return <RoleSelectionPage onSelectRole={setSelectedRole} />;
    }
    return <LoginPage selectedRole={selectedRole} onBack={() => setSelectedRole(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        unreadCount={unreadNotificationsCount}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className={`${sidebarOpen ? 'lg:pl-72' : ''} flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out`}>
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          unreadCount={unreadNotificationsCount}
          notifications={notifications}
          onOpenNotifications={() => setActiveTab('notifications')}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {!isTabAvailable ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center max-w-xl mx-auto my-12 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200/80">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                This section isn't available for your current role
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                You are currently signed in as <strong className="text-slate-800 font-bold">{role}</strong>. This module is designated for other clinical or supervisory workflows.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="btn-access-denied-return-dash"
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Dashboard</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  patients={patients}
                  outbreakAlerts={outbreakAlerts}
                  consultations={consultations}
                  incentiveClaims={incentiveClaims}
                  healthRecords={healthRecords}
                  dashboardStats={dashboardStats}
                  onUpdateIncentiveClaim={handleUpdateIncentiveClaim}
                  onNavigate={setActiveTab}
                  onOpenAddPatientModal={() => setIsAddPatientModalOpen(true)}
                  onSelectConsultation={handleSelectConsultationFromDashboard}
                />
              )}

              {activeTab === 'voice-input' && (
                <VoiceInputView onSavePatient={handleVoicePatientSaved} />
              )}

              {activeTab === 'blood-donation' && (
                <BloodDonationView
                  donors={bloodDonors}
                  requests={bloodRequests}
                  isLoading={isLoadingBloodData}
                  error={bloodDataError}
                  onAddRequest={handleAddBloodRequest}
                  onAddDonor={handleAddDonor}
                  onUpdateBloodRequest={handleUpdateBloodRequest}
                  onDeleteDonor={handleDeleteDonor}
                  onEditDonor={handleEditDonor}
                />
              )}

              {activeTab === 'awareness-content' && (
                <AwarenessContentView onNavigateTab={setActiveTab} />
              )}

              {activeTab === 'patients' && (
                <PatientsView
                  patients={patients}
                  isLoading={isLoadingPatients}
                  error={patientsError}
                  onOpenAddPatientModal={() => { setPatientToEdit(null); setIsAddPatientModalOpen(true); }}
                  onOpenEditPatientModal={(p) => { setPatientToEdit(p); setIsAddPatientModalOpen(true); }}
                  onSelectPatientForConsultation={handleSelectPatientForConsultation}
                  onDeletePatient={handleDeletePatient}
                  onAddRecord={handleAddHealthRecord}
                />
              )}

              {activeTab === 'teleconsultation' && (
                <TeleconsultationView
                  patients={patients}
                  consultations={consultations}
                  isLoading={isLoadingConsultations}
                  error={consultationsError}
                  onUpdateConsultation={handleUpdateConsultation}
                  initialSelectedId={selectedConsultationId}
                />
              )}

              {activeTab === 'health-records' && (
                <HealthRecordsView
                  patients={patients}
                  records={healthRecords}
                  isLoading={isLoadingHealthRecords}
                  error={healthRecordsError}
                  onAddRecord={handleAddHealthRecord}
                  onUpdateRecordStatus={handleUpdateHealthRecordStatus}
                />
              )}

              {activeTab === 'outbreak-monitoring' && (
                <OutbreakMonitoringView />
              )}



              {activeTab === 'incentive-claims' && (
                <IncentiveClaimsView />
              )}

              {activeTab === 'misinformation' && (
                <MisinformationCheckView
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsView
                  notifications={notifications}
                  onMarkAllRead={handleMarkNotificationsRead}
                  onMarkRead={handleMarkNotificationRead}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView />
              )}

              {activeTab === 'help-support' && (
                <HelpSupportView />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {/* Global Add/Edit Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientModalOpen}
        onClose={() => { setIsAddPatientModalOpen(false); setPatientToEdit(null); }}
        onAddPatient={handleAddPatient}
        patientToEdit={patientToEdit}
        onEditPatient={handleUpdatePatient}
        onNavigate={setActiveTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <AppContent />
    </RoleProvider>
  );
}
