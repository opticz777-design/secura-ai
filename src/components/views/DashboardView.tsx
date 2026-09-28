import React from 'react';
import { Patient, OutbreakAlert, Consultation, IncentiveClaim, ActiveTab, HealthRecord } from '../../types';
import { useRole } from '../../context/RoleContext';
import { AshaDashboard } from '../dashboard/AshaDashboard';
import { DoctorDashboard } from '../dashboard/DoctorDashboard';
import { SupervisorDashboard } from '../dashboard/SupervisorDashboard';

interface DashboardViewProps {
  patients: Patient[];
  outbreakAlerts: OutbreakAlert[];
  consultations?: Consultation[];
  incentiveClaims?: IncentiveClaim[];
  healthRecords?: HealthRecord[];
  dashboardStats?: any;
  onUpdateIncentiveClaim?: (updated: IncentiveClaim) => void;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddPatientModal: () => void;
  onSelectConsultation?: (consultationId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  outbreakAlerts,
  consultations = [],
  incentiveClaims = [],
  healthRecords = [],
  dashboardStats,
  onUpdateIncentiveClaim,
  onNavigate,
  onOpenAddPatientModal,
  onSelectConsultation
}) => {
  const { role } = useRole();

  if (role === 'DOCTOR') {
    return (
      <DoctorDashboard
        patients={patients}
        outbreakAlerts={outbreakAlerts}
        consultations={consultations}
        healthRecords={healthRecords}
        dashboardStats={dashboardStats}
        onNavigate={onNavigate}
        onSelectConsultation={onSelectConsultation}
      />
    );
  }

  if (role === 'SUPERVISOR') {
    return (
      <SupervisorDashboard
        patients={patients}
        outbreakAlerts={outbreakAlerts}
        incentiveClaims={incentiveClaims}
        dashboardStats={dashboardStats}
        onUpdateIncentiveClaim={onUpdateIncentiveClaim}
        onNavigate={onNavigate}
      />
    );
  }

  // Default: ASHA Worker Dashboard
  return (
    <AshaDashboard
      patients={patients}
      outbreakAlerts={outbreakAlerts}
      consultations={consultations}
      healthRecords={healthRecords}
      dashboardStats={dashboardStats}
      onNavigate={onNavigate}
      onOpenAddPatientModal={onOpenAddPatientModal}
    />
  );
};
