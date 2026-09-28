# SynCura AI – Final Feature Inventory

This document serves as the exact factual inventory of the current SynCura AI codebase, derived directly from the application source code following the system-wide audit and hardening.

---

## 1 & 2. Implemented Modules Overview

### 1. Dashboard
- **Roles**: ASHA Worker, Doctor, Supervisor
- **Frontend**: `DashboardView.tsx`, `DoctorDashboard.tsx`, `SupervisorDashboard.tsx`
- **Backend API**: `/api/dashboard/stats`
- **Database Models**: `HealthRecord`, `OutbreakAlert`, `Patient`, `Consultation`, `IncentiveClaim`
- **AI/External Services**: None
- **Real Data**: Yes

### 2. Voice Input Collection
- **Roles**: ASHA Worker (Primary)
- **Frontend**: `VoiceInputView.tsx`
- **Backend API**: `/api/voice/process`, `/api/voice/entries`, `/api/voice/save`
- **Database Models**: `VoiceEntry`, `Patient`, `HealthRecord`
- **AI/External Services**: Google Gemini AI (File API & Flash models) for Malayalam-to-English transcription and structured JSON extraction.
- **Real Data**: Yes

### 3. Blood Donation Coordination
- **Roles**: ASHA Worker (Primary)
- **Frontend**: `BloodDonationView.tsx`
- **Backend API**: `/api/donors`, `/api/blood-requests`
- **Database Models**: `BloodDonor`, `BloodRequest`
- **AI/External Services**: Resend (Email SDK)
- **Real Data**: Yes

### 4. Awareness Content Generation
- **Roles**: ASHA Worker (Primary)
- **Frontend**: `AwarenessContentView.tsx`
- **Backend API**: `/api/awareness-content`, `/api/awareness-content/generate`
- **Database Models**: `AwarenessContent`
- **AI/External Services**: Google Gemini AI
- **Real Data**: Yes

### 5. Patient Management & Documents
- **Roles**: ASHA Worker, Doctor, Supervisor
- **Frontend**: `PatientsView.tsx`, `AddPatientModal.tsx`, `UploadDocumentModal.tsx`
- **Backend API**: `/api/patients`, `/api/patients/:id/documents`
- **Database Models**: `Patient`, `PatientDocument`
- **AI/External Services**: None
- **Real Data**: Yes

### 6. Doctor Consultation (Teleconsultation)
- **Roles**: ASHA Worker, Doctor (Primary)
- **Frontend**: `TeleconsultationView.tsx`, `StartConsultationModal.tsx`
- **Backend API**: `/api/consultations`
- **Database Models**: `Consultation`
- **AI/External Services**: Resend (Email SDK)
- **Real Data**: Yes

### 7. Health Records
- **Roles**: ASHA Worker, Doctor, Supervisor
- **Frontend**: `HealthRecordsView.tsx` (and embedded in Patient timeline)
- **Backend API**: `/api/health-records`
- **Database Models**: `HealthRecord`
- **AI/External Services**: None
- **Real Data**: Yes

### 8. Outbreak Monitoring
- **Roles**: ASHA Worker, Doctor, Supervisor
- **Frontend**: `OutbreakMonitoringView.tsx`
- **Backend API**: `/api/outbreak-alerts`, `/api/outbreak-alerts/run-agent`
- **Database Models**: `OutbreakAlert`, `OutbreakActivity`, `HealthRecord`
- **AI/External Services**: None (Uses programmatic JavaScript statistical thresholds)
- **Real Data**: Yes

### 9. Incentive Claims
- **Roles**: ASHA Worker, Supervisor
- **Frontend**: `IncentiveClaimsView.tsx`
- **Backend API**: `/api/incentive-claims`
- **Database Models**: `IncentiveClaim`
- **AI/External Services**: None
- **Real Data**: Yes

### 10. Misinformation Check
- **Roles**: ASHA Worker (Primary)
- **Frontend**: `MisinformationCheckView.tsx`
- **Backend API**: `/api/misinfo-checks/check`, `/api/misinfo-checks/history`
- **Database Models**: `MisinfoCheck`
- **AI/External Services**: Google Gemini AI (Multimodal text + screenshot analysis)
- **Real Data**: Yes

### 11. Notifications
- **Roles**: ASHA Worker, Doctor, Supervisor
- **Frontend**: `NotificationsView.tsx`, Sidebar Badges
- **Backend API**: `/api/notifications`
- **Database Models**: `Notification`
- **AI/External Services**: None
- **Real Data**: Yes

### 12. Settings
- **Roles**: ASHA Worker, Doctor, Supervisor
- **Frontend**: `SettingsView.tsx`
- **Backend API**: Handled via Local/Auth state
- **Real Data**: Local State

### 13. Help & Support
- **Roles**: ASHA Worker (Only)
- **Frontend**: `HelpSupportView.tsx`
- **Backend API**: Static application guides
- **Real Data**: Hardcoded application manual

---

## 3. REMOVED Features (Must Not Be Mentioned)
The following features have been intentionally removed from the codebase and **must not be claimed as implemented**:
- **Schemes & Benefits Integration**
- **FAQ / PHC Information Hub**
- **Telephony / Live Calling (WebRTC / Exotel)**

---

## 4. Role-Specific Navigation (`RoleContext.tsx`)
- **ASHA Worker**: Full access to all modules as primary tabs.
- **Doctor**: Dashboard, Teleconsultation, Patients, Health Records, Outbreak Monitoring, Notifications, Settings (Primary). Has secondary access to ASHA tools (Voice, Blood, Awareness, Misinfo).
- **Supervisor**: Dashboard, Outbreak Monitoring, Patients, Incentive Claims, Health Records, Notifications, Settings (Primary). Has secondary access to ASHA tools.

## 5. Authentication & RBAC Mechanism
- **Authentication**: `authController.js` validates credentials via `bcrypt`, generates a JWT, and securely stores it in an `HttpOnly` cookie.
- **RBAC**: Handled via `authMiddleware.js`. A generalized `authenticateUser` secures routes, while `requireRole('ROLE')` restricts specific mutations (e.g., `PATCH /api/incentive-claims/claims/:id/status` is strictly limited to `SUPERVISOR`).

## 6. AI/Gemini Functionality
Strictly powers three modules via the official `@google/genai` SDK:
1. **Voice Input**: Malayalam audio transcription and JSON structuring.
2. **Awareness Content**: Generates localized health pamphlets.
3. **Misinformation Check**: Evaluates user-submitted claims or screenshots against medical logic.

## 7. Resend Email Functionality
Implemented securely using the `Resend` SDK. 
- Dispatches emails from `donorController.js` to alert matching blood donors.
- Dispatches emails from `consultationController.js` to notify doctors of urgent pending consultations.

## 8. Outbreak Monitoring Implementation
Does **NOT** use AI. It uses a custom deterministic algorithm (`runDetectionAgent` in `outbreakDetectionService.js`) to query the SQLite `HealthRecord` database. It groups identical conditions in specific villages within a 72-hour window, automatically triggering an `OutbreakAlert` if thresholds (>= 3 cases) are met. 

## 9. Patient Documents Implementation
Implemented as a standard CRUD entity mapped to the `PatientDocument` SQLite model. Uploaded via `UploadDocumentModal` using `multer` parsing on the backend, and fetched dynamically upon completion.

## 10. Doctor Consultation Data Flow
Operates exclusively over REST APIs writing to the `Consultation` SQLite model. ASHA submits symptoms via a POST request; the Doctor fetches pending requests and PATCHes the record with medical notes. All UI state reflects these persistent backend records.

## 11 & 12. Help & Support
Help & Support solely contains a static user guide/manual for the application interface. It is exclusively available to the **ASHA Worker** role. It is completely hidden from the Doctor and Supervisor configurations.

## 13 & 14. Removed Components Confirmations
- Confirmed: **Schemes & Benefits** does not exist.
- Confirmed: **Telephony/Live Calling** does not exist.

---

## 15. REQUIRES MANUAL VERIFICATION (Partial Functionality)
1. **PDF Generation**: `pdfRoutes.js` handles generating PDFs for awareness content, which may require visual verification to ensure fonts and layouts render correctly.
2. **Browser Microphone Constraints**: The `MediaRecorder` API used in `VoiceInputView.tsx` inherently requires HTTPS or `localhost` to obtain browser microphone permissions. This must be manually verified in the deployment environment.
