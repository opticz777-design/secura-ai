const sequelize = require('./config/database');
const { Patient, HealthRecord, Consultation } = require('./models');

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Wait for models to sync
    await sequelize.sync({ alter: true });

    const patientCount = await Patient.count();
    if (patientCount === 0) {
      console.log('Database is empty. Seeding data...');

      // Create Patients
      const patients = await Patient.bulkCreate([
        {
          name: 'Rajesh Nair',
          age: 45,
          gender: 'Male',
          status: 'Consulted',
          phone: '+91 98765 43210',
          village: 'Chirakkal PHC',
          abhaId: '91-4820-3341-9812',
          address: 'House No. 42, Main Road, Chirakkal Village',
          emergencyContact: 'Sujatha Nair (Wife)',
          registrationDate: new Date('2024-01-12'),
          assignedAsha: 'Anita Devi'
        },
        {
          name: 'Devika Menon',
          age: 32,
          gender: 'Female',
          status: 'Consulted',
          phone: '+91 98123 45678',
          village: 'Valapattanam Sector A',
          abhaId: '91-1102-7741-2091',
          address: 'Plot 18, Valapattanam Basti',
          emergencyContact: 'Mahesh Menon (Husband)',
          registrationDate: new Date('2024-11-05'),
          assignedAsha: 'Reena Varma'
        },
        {
          name: 'Sreejith Nambiar',
          age: 60,
          gender: 'Male',
          status: 'Follow Up',
          phone: '+91 91234 56789',
          village: 'Pinarayi Sector D',
          abhaId: '91-5501-8841-3321',
          address: 'Krishna Nivas, Pinarayi',
          emergencyContact: 'Lakshmi (Daughter)',
          registrationDate: new Date('2025-02-15'),
          assignedAsha: 'Anita Devi'
        }
      ]);

      console.log('Seeded patients.');

      // Create Consultations
      await Consultation.bulkCreate([
        {
          patientId: patients[0].id,
          doctorId: 'DOC-01',
          doctorName: 'Dr. Priya Nair',
          specialty: 'General Medicine',
          date: new Date(),
          status: 'Completed',
          type: 'Video',
          priority: 'Routine',
          symptoms: 'Fasting Blood Sugar check (142 mg/dL)',
          notes: 'Maintain Metformin 500mg daily. Diet low in sugars.'
        },
        {
          patientId: patients[1].id,
          doctorId: 'DOC-02',
          doctorName: 'Dr. Sreelatha Kurup',
          specialty: 'Obstetrics & Gynecology',
          date: new Date(Date.now() + 86400000), // Tomorrow
          status: 'Scheduled',
          type: 'Video',
          priority: 'Urgent',
          symptoms: '2nd Trimester ANC Ultrasound Review',
          notes: 'Fetal growth normal. Hemoglobin 10.8 g/dL. Continue IFA tablets.'
        },
        {
          patientId: patients[2].id,
          doctorId: 'DOC-01',
          doctorName: 'Dr. Priya Nair',
          specialty: 'General Medicine',
          date: new Date(),
          status: 'Waiting',
          type: 'Video',
          priority: 'Routine',
          symptoms: 'Severe joint pain and fever',
          notes: 'Suspected Dengue. Needs review.'
        }
      ]);

      console.log('Seeded consultations.');

      // Create Health Records (this will trigger outbreak detection)
      // Simulating a Dengue cluster in 'Chirakkal PHC' to trigger outbreak detection automatically!
      await HealthRecord.bulkCreate([
        {
          patientId: patients[0].id,
          visitType: 'Doctor Consultation',
          date: new Date(),
          recordedBy: 'Dr. Priya Nair',
          diagnosis: 'Dengue Fever',
          symptoms: 'High fever, joint pain, rash',
          notes: 'Confirmed via NS1 antigen test.'
        },
        {
          patientId: patients[1].id,
          visitType: 'PHC Visit',
          date: new Date(),
          recordedBy: 'Nurse Sarojini',
          diagnosis: 'Dengue Fever',
          symptoms: 'Fever, headache, fatigue',
          notes: 'Rapid test positive.'
        },
        {
          patientId: patients[2].id,
          visitType: 'Home Visit',
          date: new Date(),
          recordedBy: 'Anita Devi (ASHA)',
          diagnosis: 'Dengue Fever',
          symptoms: 'Fever, muscle ache',
          notes: 'Referred to PHC.'
        },
        {
          patientId: patients[0].id, // Re-using patient just for the sake of the outbreak tracker
          visitType: 'Doctor Consultation',
          date: new Date(Date.now() - 86400000),
          recordedBy: 'Dr. Anoop Menon',
          diagnosis: 'Cholera',
          symptoms: 'Severe diarrhea',
          notes: 'Started on IV fluids.'
        }
      ]);
      console.log('Seeded health records (triggered outbreak detection for Dengue).');
      console.log('Seeding complete!');
    } else {
      console.log('Database already has data. Skipping seed.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
