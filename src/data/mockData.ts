import { DEFAULT_AVATAR } from "../utils/constants";
import { 
  Patient, 
  Appointment, 
  OutbreakAlert, 
  AlertActivityLog,
  Incentive, 
  BloodDonor, 
  BloodRequest, 
  HealthTip, 
  MisinformationQuery, 
  NotificationItem,
  Consultation,

  IncentiveClaim,
  TaskBreakdownItem,
  MisinfoCheck,
  HealthRecord
} from '../types';

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_INCENTIVES: Incentive[] = [];

export const INITIAL_BLOOD_DONORS: BloodDonor[] = [];

export const INITIAL_BLOOD_REQUESTS: BloodRequest[] = [];

export const HEALTH_TIPS: HealthTip[] = [];

export const MISINFORMATION_DATABASE: MisinformationQuery[] = [];

export const INITIAL_MISINFO_CHECKS: MisinfoCheck[] = [];

export const TRENDING_LOCAL_MYTHS = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_CONSULTATIONS: Consultation[] = [];



export const INITIAL_INCENTIVE_CLAIMS: IncentiveClaim[] = [];

export const INITIAL_HEALTH_RECORDS: HealthRecord[] = [];

