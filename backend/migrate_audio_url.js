const sequelize = require('./config/database');
const { DataTypes } = require('sequelize');

async function migrate() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('VoiceEntries', 'audioUrl', {
      type: DataTypes.STRING,
      allowNull: true
    });
    console.log('Successfully added audioUrl to VoiceEntries table.');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('audioUrl column already exists in VoiceEntries table.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    process.exit();
  }
}

migrate();
