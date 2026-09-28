const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.all("SELECT id, displayName, role, healthCentre, phone FROM Users", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Existing Users:");
    console.table(rows);
  });
});

db.close();
