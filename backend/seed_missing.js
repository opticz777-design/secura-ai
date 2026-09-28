const { sequelize, Patient, HealthRecord, Consultation } = require('./models');

async function seedMissingData() {
  try {
    const patients = await Patient.findAll();
    if (patients.length === 0) {
      console.log('No patients found to seed against.');
      return;
    }

    console.log(`Found ${patients.length} patients.`);

    // Seed HealthRecords
    const recordsData = patients.map(p => ({
      patientId: p.id,
      visitType: 'Routine Checkup',
      date: new Date(),
      recordedBy: 'ASHA Worker 1',
      symptoms: 'None',
      vitals: { bp: '120/80', temp: '98.6', pulse: '72' },
      notes: 'Patient is healthy',
      status: 'Completed'
    }));
    await HealthRecord.bulkCreate(recordsData);
    console.log(`Seeded ${recordsData.length} health records.`);

    const ashaWorkers = ['Anita Devi', 'Lakshmi K', 'Sujatha P'];
    const symptomsList = [
      'High fever and persistent cough for 3 days',
      'Severe headache, dizziness, and nausea',
      'Mild chest pain and shortness of breath'
    ];
    
    // Seed Consultations
    const consultationsData = patients.slice(0, 3).map((p, i) => {
      const submittedDate = new Date();
      submittedDate.setHours(submittedDate.getHours() - (i + 1) * 2); 
      
      return {
        patientId: p.id,
        ashaWorkerName: ashaWorkers[i % ashaWorkers.length],
        symptoms: symptomsList[i % symptomsList.length],
        priority: i === 2 ? 'Critical' : (i === 1 ? 'Medium' : 'High'),
        status: 'Pending',
        submittedAt: submittedDate,
        doctorNotes: '',
        visitType: 'Tele-consultation'
      };
    });
    await Consultation.bulkCreate(consultationsData);
    console.log(`Seeded ${consultationsData.length} consultations.`);

    console.log('Successfully seeded missing Health Records and Consultations.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedMissingData();
