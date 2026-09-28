const { Sequelize, Op } = require('sequelize');
const { Patient, HealthRecord, OutbreakAlert, OutbreakActivity } = require('../backend/models');
const sequelize = require('../backend/config/database');

async function runCleanup() {
  const t = await sequelize.transaction({ type: Sequelize.Transaction.TYPES.EXCLUSIVE });
  try {
    console.log('--- DUPLICATE CLEANUP SCRIPT ---');
    
    const initialPatients = await Patient.count({ transaction: t });
    const initialHRs = await HealthRecord.count({ transaction: t });
    const initialAlerts = await OutbreakAlert.count({ transaction: t });
    const initialActivities = await OutbreakActivity.count({ transaction: t });

    // 1. IDENTIFY PATIENT DUPLICATES
    const patients = await Patient.findAll({ transaction: t, raw: true });
    const pGroups = {};
    for (const p of patients) {
      const normPhone = (p.phone || '').trim();
      let key = null;
      if (normPhone) {
        key = `PHONE|${normPhone}`;
      } else {
        const normName = (p.name || '').trim().toLowerCase();
        const normGender = (p.gender || '').trim().toLowerCase();
        const normVillage = (p.village || '').trim().toLowerCase();
        key = `IDENT|${normName}|${normGender}|${normVillage}`;
      }

      if (!pGroups[key]) pGroups[key] = [];
      pGroups[key].push(p);
    }

    const dupPatientGroups = Object.entries(pGroups).filter(([k, list]) => list.length > 1);
    
    let totalPatientsRemoved = 0;
    let totalHRsReassigned = 0;

    console.log('\n--- PATIENT DUPLICATE GROUPS ---');
    if (dupPatientGroups.length === 0) console.log('None found.');
    
    for (const [key, list] of dupPatientGroups) {
      list.sort((a, b) => a.id - b.id);
      const canonical = list[0];
      const duplicates = list.slice(1);
      const dupIds = duplicates.map(d => d.id);
      
      const hrCount = await HealthRecord.count({ where: { patientId: { [Op.in]: dupIds } }, transaction: t });
      
      console.log(`\nGroup: ${key}`);
      console.log(`Canonical Patient: ID ${canonical.id} — ${canonical.name}`);
      console.log(`Duplicate Patient(s): ${dupIds.map((id, idx) => `ID ${id} — ${duplicates[idx].name}`).join(', ')}`);
      console.log(`Reason: normalized identity match`);
      console.log(`Health Records to reassign: ${hrCount}`);

      // Execution: Reassign HRs
      if (dupIds.length > 0) {
        await HealthRecord.update({ patientId: canonical.id }, { where: { patientId: { [Op.in]: dupIds } }, transaction: t });
        totalHRsReassigned += hrCount;
        
        // Delete duplicate patients
        await Patient.destroy({ where: { id: { [Op.in]: dupIds } }, transaction: t });
        totalPatientsRemoved += dupIds.length;
      }
    }

    // 2. IDENTIFY HEALTH RECORD DUPLICATES
    const healthRecords = await HealthRecord.findAll({ transaction: t, raw: true });
    const hrGroups = {};

    for (const hr of healthRecords) {
      const dateStr = hr.date ? new Date(hr.date).toISOString().split('T')[0] : 'unknown';
      const normDiag = (hr.diagnosis || '').trim().toLowerCase();
      const normVisit = (hr.visitType || '').trim().toLowerCase();
      
      const key = `${hr.patientId}|${normDiag}|${normVisit}|${dateStr}`;
      
      if (!hrGroups[key]) hrGroups[key] = [];
      hrGroups[key].push(hr);
    }

    const dupHrGroups = Object.entries(hrGroups).filter(([k, list]) => list.length > 1);
    
    let totalHRsRemoved = 0;

    console.log('\n--- HEALTH RECORD DUPLICATE GROUPS ---');
    if (dupHrGroups.length === 0) console.log('None found.');
    
    for (const [key, list] of dupHrGroups) {
      list.sort((a, b) => a.id - b.id);
      const canonical = list[0];
      const duplicates = list.slice(1);
      const dupIds = duplicates.map(d => d.id);
      
      console.log(`\nGroup: ${key}`);
      console.log(`Canonical Record: ID ${canonical.id}`);
      console.log(`Duplicate Records: ${dupIds.join(', ')}`);
      console.log(`Reason: same patient + diagnosis + visit type + calendar date`);

      // Execution: Delete duplicate HRs
      if (dupIds.length > 0) {
        await HealthRecord.destroy({ where: { id: { [Op.in]: dupIds } }, transaction: t });
        totalHRsRemoved += dupIds.length;
      }
    }

    await t.commit();

    const finalPatients = await Patient.count();
    const finalHRs = await HealthRecord.count();
    const finalAlerts = await OutbreakAlert.count();
    const finalActivities = await OutbreakActivity.count();

    console.log('\n--- CLEANUP SUMMARY ---');
    console.log(`Total patients before cleanup: ${initialPatients}`);
    console.log(`Duplicate patient groups found: ${dupPatientGroups.length}`);
    console.log(`Total duplicate patients to remove: ${totalPatientsRemoved}`);
    console.log(`Total health records to reassign: ${totalHRsReassigned}`);
    console.log(`Duplicate health records to remove: ${totalHRsRemoved}`);
    console.log(`Total patients after cleanup: ${finalPatients}`);
    console.log(`Total health records after cleanup: ${finalHRs}`);
    console.log(`OutbreakAlerts before/after: ${initialAlerts} / ${finalAlerts}`);
    console.log(`OutbreakActivities before/after: ${initialActivities} / ${finalActivities}`);
    
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Cleanup failed:', error);
  }
}

runCleanup();
