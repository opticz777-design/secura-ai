const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    // Ensure table exists
    await User.sync();
    
    // Hash password
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        username: 'asha001',
        passwordHash,
        role: 'ASHA_WORKER',
        displayName: 'Anita Devi',
        ashaWorkerId: 'ASHA-KL-883921',
        healthCentre: 'Chirakkal', // matching HEALTH_CENTRES[0].name
        isActive: true
      },
      {
        username: 'doctor001',
        passwordHash,
        role: 'DOCTOR',
        displayName: 'Dr. Priya Nair',
        doctorId: 'MO-KL-440212',
        healthCentre: 'Chirakkal',
        isActive: true
      },
      {
        username: 'supervisor001',
        passwordHash,
        role: 'SUPERVISOR',
        displayName: 'Rajesh Nair',
        supervisorId: 'HES-KL-991043',
        healthCentre: 'Chirakkal',
        isActive: true
      }
    ];

    for (const u of users) {
      const [user, created] = await User.findOrCreate({
        where: { username: u.username },
        defaults: u
      });
      if (created) {
        console.log(`Created user: ${u.username} with role ${u.role}`);
      } else {
        console.log(`User already exists: ${u.username}`);
      }
    }
    
    console.log('Seed users completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
