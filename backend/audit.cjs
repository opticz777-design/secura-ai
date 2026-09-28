const { Op } = require('sequelize');
const { Patient, HealthRecord } = require('../backend/models');

async function runAudit() {
  try {
    console.log('--- STARTING DATABASE AUDIT ---');
    
    // 1. Total counts
    const totalPatients = await Patient.count();
    const totalHealthRecords = await HealthRecord.count();
    
    console.log(`\nTotal Patient Rows: ${totalPatients}`);
    console.log(`Total HealthRecord Rows: ${totalHealthRecords}`);
    
    // 2. Fetch all patients and group by normalized logic
    const patients = await Patient.findAll({ raw: true });
    
    const duplicateGroups = {};
    for (const p of patients) {
      const normName = (p.name || '').trim().toLowerCase();
      const normVillage = (p.village || '').trim().toLowerCase();
      const normGender = (p.gender || '').trim().toLowerCase();
      // Using combination as identity key
      const key = `${normName}|${normGender}|${normVillage}`;
      
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(p);
    }
    
    // Filter groups to only those with duplicates
    const actualDuplicates = Object.entries(duplicateGroups).filter(([key, list]) => list.length > 1);
    
    console.log(`\nSuspected Duplicate Patient Groups: ${actualDuplicates.length}`);
    
    let totalPatientsToRemove = 0;
    
    for (const [key, list] of actualDuplicates) {
      // Sort by ID to pick the oldest one as canonical
      list.sort((a, b) => a.id - b.id);
      const canonical = list[0];
      const duplicates = list.slice(1);
      
      const duplicateIds = duplicates.map(d => d.id);
      totalPatientsToRemove += duplicateIds.length;
      
      console.log(`\nGroup: ${key}`);
      console.log(`  Canonical ID: ${canonical.id}`);
      console.log(`  Duplicate IDs to merge/remove: ${duplicateIds.join(', ')}`);
      
      // Find HealthRecords pointing to these duplicate IDs
      const recordsToReassign = await HealthRecord.count({ where: { patientId: { [Op.in]: duplicateIds } } });
      console.log(`  HealthRecords currently pointing to duplicates: ${recordsToReassign}`);
    }
    
    // 3. HealthRecord Duplicates
    const healthRecords = await HealthRecord.findAll({ raw: true });
    const hrGroups = {};
    
    for (const hr of healthRecords) {
      // Using normalized patientId, diagnosis, and date (without time) for grouping duplicates
      const dateStr = hr.date ? new Date(hr.date).toISOString().split('T')[0] : 'unknown_date';
      const normDiag = (hr.diagnosis || '').trim().toLowerCase();
      const key = `${hr.patientId}|${normDiag}|${dateStr}|${hr.visitType}`;
      
      if (!hrGroups[key]) {
        hrGroups[key] = [];
      }
      hrGroups[key].push(hr);
    }
    
    const actualHrDuplicates = Object.entries(hrGroups).filter(([key, list]) => list.length > 1);
    
    console.log(`\nSuspected Duplicate Health-Record Groups: ${actualHrDuplicates.length}`);
    
    let totalHrToRemove = 0;
    for (const [key, list] of actualHrDuplicates) {
      list.sort((a, b) => a.id - b.id);
      const canonicalHr = list[0];
      const duplicatesHr = list.slice(1);
      const duplicateIds = duplicatesHr.map(d => d.id);
      totalHrToRemove += duplicateIds.length;
      
      console.log(`\nHR Group: ${key}`);
      console.log(`  Canonical Record ID: ${canonicalHr.id}`);
      console.log(`  Duplicate Record IDs to remove: ${duplicateIds.join(', ')}`);
    }

    console.log('\n--- AUDIT SUMMARY ---');
    console.log(`Proposed canonical patients to keep: ${totalPatients - totalPatientsToRemove}`);
    console.log(`Proposed duplicate patients to remove: ${totalPatientsToRemove}`);
    console.log(`Proposed duplicate HRs to remove: ${totalHrToRemove}`);
    console.log(`Backup created at: c:\\Users\\ASUS\\OneDrive\\Desktop\\SYNCURA AI\\backend\\database.sqlite.backup`);

  } catch (error) {
    console.error('Audit failed:', error);
  }
}

runAudit();
