const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run("ALTER TABLE Patients ADD COLUMN ashaWorkerId VARCHAR(255);", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error(err);
    } else {
      console.log("Patient ashaWorkerId column added.");
    }
  });

  db.run("ALTER TABLE HealthRecords ADD COLUMN ashaWorkerId VARCHAR(255);", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error(err);
    } else {
      console.log("HealthRecords ashaWorkerId column added.");
    }
  });

  db.run("ALTER TABLE Consultations ADD COLUMN ashaWorkerId VARCHAR(255);", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error(err);
    } else {
      console.log("Consultations ashaWorkerId column added.");
    }
  });
});

db.close();
