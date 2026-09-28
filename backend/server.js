require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database');

// Import routes
const patientRoutes = require('./routes/patientRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const bloodRequestRoutes = require('./routes/bloodRequestRoutes');
const donorRoutes = require('./routes/donorRoutes');
const outbreakAlertRoutes = require('./routes/outbreakAlertRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const patientDocumentRoutes = require('./routes/patientDocumentRoutes');

const incentiveClaimRoutes = require('./routes/incentiveClaimRoutes');
const misinfoCheckRoutes = require('./routes/misinfoCheckRoutes');
const awarenessContentRoutes = require('./routes/awarenessContentRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const { authenticateUser } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the SYNCURA AI Backend API! Access endpoints at /api/...');
});

// API Routes
app.use('/api/auth', authRoutes);

// Protected API Routes
app.use('/api/patients', authenticateUser, patientRoutes);
app.use('/api/health-records', authenticateUser, healthRecordRoutes);
app.use('/api/consultations', authenticateUser, consultationRoutes);
app.use('/api/blood-requests', authenticateUser, bloodRequestRoutes);
app.use('/api/donors', authenticateUser, donorRoutes);
app.use('/api/outbreak-alerts', authenticateUser, outbreakAlertRoutes);
app.use('/api/follow-ups', authenticateUser, followUpRoutes);
app.use('/api/patients', authenticateUser, pdfRoutes); // registers /api/patients/:patientId/health-record-pdf
app.use('/api/patients/:patientId/documents', authenticateUser, patientDocumentRoutes);
app.use('/api/incentive-claims', authenticateUser, incentiveClaimRoutes);
app.use('/api/notifications', authenticateUser, notificationRoutes);
app.use('/api/misinfo-checks', authenticateUser, misinfoCheckRoutes);
app.use('/api/awareness-content', authenticateUser, awarenessContentRoutes);
app.use('/api/voice', authenticateUser, voiceRoutes);
app.use('/api/dashboard', authenticateUser, dashboardRoutes);


// Start Server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    await sequelize.query('PRAGMA foreign_keys = OFF');
    try { await sequelize.query('ALTER TABLE Consultations ADD COLUMN simplifiedNotes TEXT'); } catch(e) {}
    try { await sequelize.query('ALTER TABLE Patients ADD COLUMN email VARCHAR(255)'); } catch(e) {}
    try { await sequelize.query('ALTER TABLE Consultations ADD COLUMN patientNotified BOOLEAN DEFAULT 0'); } catch(e) {}
    try { await sequelize.query('ALTER TABLE OutbreakAlerts ADD COLUMN escalatedToStateHealthDepartment BOOLEAN DEFAULT 0'); } catch(e) {}
    try { await sequelize.query('ALTER TABLE OutbreakAlerts ADD COLUMN escalatedAt DATETIME'); } catch(e) {}
    try { await sequelize.query('ALTER TABLE OutbreakAlerts ADD COLUMN escalatedBy VARCHAR(255)'); } catch(e) {}
    await sequelize.sync(); 
    await sequelize.query('PRAGMA foreign_keys = ON');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
