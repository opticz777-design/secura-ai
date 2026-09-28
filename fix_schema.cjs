const sequelize = require('./backend/config/database');

async function fix() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    const [results, metadata] = await sequelize.query("PRAGMA table_info(AwarenessContents);");
    console.log("Existing columns:", results.map(r => r.name));
    
    const columnsToAdd = [
      { name: 'ashaWorkerId', type: 'VARCHAR(255)' },
      { name: 'ashaWorkerName', type: 'VARCHAR(255)' },
      { name: 'healthCentre', type: 'VARCHAR(255)' },
      { name: 'topic', type: 'VARCHAR(255)' },
      { name: 'category', type: 'VARCHAR(255)' },
      { name: 'contentType', type: 'VARCHAR(255)' },
      { name: 'language', type: 'VARCHAR(255)' },
      { name: 'tone', type: 'VARCHAR(255)' },
      { name: 'headline', type: 'VARCHAR(255)' },
      { name: 'bulletPoints', type: 'TEXT' },
      { name: 'callToAction', type: 'VARCHAR(255)' },
      { name: 'audioDuration', type: 'VARCHAR(255)' },
      { name: 'generatedText', type: 'TEXT' },
      { name: 'shareCount', type: 'INTEGER DEFAULT 0' },
      { name: 'downloadCount', type: 'INTEGER DEFAULT 0' }
    ];

    const existingColumnNames = results.map(r => r.name);

    for (const col of columnsToAdd) {
      if (!existingColumnNames.includes(col.name)) {
        console.log(`Adding missing column: ${col.name}`);
        await sequelize.query(`ALTER TABLE AwarenessContents ADD COLUMN ${col.name} ${col.type};`);
      }
    }
    
    console.log('Done!');
  } catch (e) {
    console.error(e);
  }
}

fix();
