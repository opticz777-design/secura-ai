const { Consultation, Patient } = require('./models');

async function runTest() {
  console.log('--- STARTING E2E TEST ---');

  // Step 1: Create a Patient with conditions
  console.log('\n[SYSTEM] Creating Patient with conditions...');
  const patientPayload = {
    name: 'Test Patient E2E',
    age: 45,
    gender: 'Male',
    village: 'E2E Village',
    status: 'Registered',
    conditions: ["Fever", "headache", "vomiting", "cough"]
  };
  
  const createdPatient = await Patient.create(patientPayload);
  console.log('-> Created Patient ID:', createdPatient.id);
  console.log('-> Conditions saved:', createdPatient.conditions);

  // Step 2: Simulate ASHA creating consultation (frontend logic)
  const simulatedFrontendSymptoms = createdPatient.conditions ? createdPatient.conditions.join(', ') : '';
  const finalSymptoms = simulatedFrontendSymptoms + ' and severe fatigue.'; // simulating ASHA editing

  const ashaPayload = {
    patientId: createdPatient.id,
    ashaWorkerName: 'Anita Devi (ASHA)',
    symptoms: finalSymptoms,
    priority: 'Normal',
    status: 'Waiting',
    submittedAt: new Date().toISOString(),
    visitType: 'Field Teleconsultation',
    ashaNotes: 'Patient reports worsening symptoms since yesterday. Referred for medical review.'
  };

  console.log('\n[ASHA] Creating Consultation with Edited Symptoms...');
  console.log('Submitted Symptoms:', ashaPayload.symptoms);
  const createdCons = await Consultation.create(ashaPayload);
  const consId = createdCons.id;
  console.log('-> Created Consultation ID:', consId);

  // Step 3: Doctor fetches consultations
  console.log('\n[DOCTOR] Fetching Consultations...');
  const fetched = await Consultation.findByPk(consId);
  console.log('Doctor fetched consultation:', fetched.toJSON());
  
  if (fetched.symptoms !== ashaPayload.symptoms) console.error('! SYMPTOMS MISMATCH');
  if (fetched.ashaNotes !== ashaPayload.ashaNotes) console.error('! ASHA NOTES MISMATCH');

  // Step 4: Doctor adds prescription
  console.log('\n[DOCTOR] Adding Prescription...');
  const docPayload = {
    status: 'In Progress',
    doctorNotes: 'Paracetamol prescribed. Maintain hydration.'
  };
  
  await fetched.update(docPayload);

  // Step 5: Final verification
  console.log('\n[SYSTEM] Final Verification...');
  const finalCons = await Consultation.findByPk(consId);

  console.log('\nFINAL DATABASE RECORD:');
  console.log('- Symptoms:', finalCons.symptoms);
  console.log('- ASHA Notes:', finalCons.ashaNotes);
  console.log('- Doctor Notes:', finalCons.doctorNotes);

  if (
    finalCons.symptoms === ashaPayload.symptoms &&
    finalCons.ashaNotes === ashaPayload.ashaNotes &&
    finalCons.doctorNotes === docPayload.doctorNotes
  ) {
    console.log('\n✅ ALL FIELDS REMAINED INDEPENDENT AND CORRECT!');
  } else {
    console.log('\n❌ DATA INTEGRITY FAILED');
  }
}

runTest().catch(console.error).finally(() => process.exit(0));
