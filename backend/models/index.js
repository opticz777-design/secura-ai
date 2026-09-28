const User = require('./User');
const Patient = require('./Patient');
const HealthRecord = require('./HealthRecord');
const Consultation = require('./Consultation');
const FollowUp = require('./FollowUp');
const BloodRequest = require('./BloodRequest');
const Donor = require('./Donor');
const OutbreakAlert = require('./OutbreakAlert');
const OutbreakActivity = require('./OutbreakActivity');
const PatientDocument = require('./PatientDocument');

const IncentiveClaim = require('./IncentiveClaim');
const MisinfoCheck = require('./MisinfoCheck');
const AwarenessContent = require('./AwarenessContent');
const SmsNotification = require('./SmsNotification');
const BloodDonationResponse = require('./BloodDonationResponse');
const NotificationToken = require('./NotificationToken');
const VoiceEntry = require('./VoiceEntry');
const AppNotification = require('./AppNotification');
const sequelize = require('../config/database');

// Define relationships if necessary
Patient.hasMany(HealthRecord, { foreignKey: 'patientId' });
HealthRecord.belongsTo(Patient, { foreignKey: 'patientId' });



Patient.hasMany(Consultation, { foreignKey: 'patientId' });
Consultation.belongsTo(Patient, { foreignKey: 'patientId' });

Patient.hasMany(FollowUp, { foreignKey: 'patientId' });
FollowUp.belongsTo(Patient, { foreignKey: 'patientId' });

Patient.hasMany(PatientDocument, { foreignKey: 'patientId' });
PatientDocument.belongsTo(Patient, { foreignKey: 'patientId' });

Patient.hasMany(VoiceEntry, { foreignKey: 'patientId' });
VoiceEntry.belongsTo(Patient, { foreignKey: 'patientId' });

Donor.hasMany(SmsNotification, { foreignKey: 'donorId' });
SmsNotification.belongsTo(Donor, { foreignKey: 'donorId' });

Donor.hasMany(BloodDonationResponse, { foreignKey: 'donorId' });
BloodDonationResponse.belongsTo(Donor, { foreignKey: 'donorId' });

Donor.hasMany(NotificationToken, { foreignKey: 'donorId' });
NotificationToken.belongsTo(Donor, { foreignKey: 'donorId' });

OutbreakAlert.hasMany(OutbreakActivity, { foreignKey: 'alertId', onDelete: 'CASCADE' });
OutbreakActivity.belongsTo(OutbreakAlert, { foreignKey: 'alertId' });



module.exports = {
  User,
  Patient,
  HealthRecord,
  Consultation,
  FollowUp,
  BloodRequest,
  Donor,
  OutbreakAlert,
  OutbreakActivity,

  IncentiveClaim,
  MisinfoCheck,
  AwarenessContent,
  SmsNotification,
  BloodDonationResponse,
  NotificationToken,
  AppNotification,
  VoiceEntry,
  PatientDocument,
  sequelize
};
