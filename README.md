<div align="center">
<h1>SynCura AI</h1>
<p>An intelligent platform for ASHA workers, Doctors, and Supervisors to manage healthcare data, coordinate teleconsultations, monitor outbreaks, and generate awareness content using Gemini AI.</p>
</div>

## Overview
SynCura AI is a full-stack web application designed to streamline rural healthcare. It features role-based access control (RBAC), AI-powered voice inputs for Malayalam-to-English translation, automated outbreak monitoring, and real-time teleconsultation management.

## Features
- **Dashboard**: Role-specific dashboards for ASHA Workers, Doctors, and Supervisors.
- **Voice Input**: Translate and structure Malayalam voice notes into medical records using Gemini AI.
- **Blood Donation Coordination**: Find matching donors and send automated email alerts.
- **Awareness Content Generation**: Generate localized health pamphlets dynamically.
- **Patient Management**: Manage patients, medical histories, and document uploads.
- **Doctor Consultation**: Request and manage teleconsultations.
- **Outbreak Monitoring**: Deterministic threshold-based anomaly detection for disease outbreaks.
- **Incentive Claims**: Manage ASHA worker incentive claims.
- **Misinformation Check**: Validate medical claims or screenshots using Gemini AI.

## Prerequisites
- Node.js (v18 or higher)
- NPM or Yarn
- [Google Gemini API Key](https://aistudio.google.com/) (For Voice Input, Awareness, Misinformation Check)
- [Resend API Key](https://resend.com/) (For Email Notifications - Blood Donors, Consultations)

## Run Locally

The project consists of a React/Vite frontend and an Express/SQLite backend. You need to run both concurrently.

### 1. Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` (if it exists) and fill in your keys:
   ```
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key
   RESEND_API_KEY=your_resend_api_key
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```

### 2. Setup Frontend

1. Open a new terminal and navigate to the project root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000` (or the port specified by Vite).

## Environment Variables
Ensure the following variables are set appropriately:
- **Backend (`backend/.env`)**:
  - `PORT`: Usually 5000
  - `GEMINI_API_KEY`: Required for AI features
  - `RESEND_API_KEY`: Required for emails
- **Frontend (`.env`)**:
  - `VITE_API_URL`: Set to backend URL if not using standard proxy (e.g., `http://localhost:5000`)

## Notes
- Ensure your browser allows microphone access (`localhost` or HTTPS is required for the Voice Input feature).
- Uploads are saved in `backend/uploads/` (these are ignored by git).
