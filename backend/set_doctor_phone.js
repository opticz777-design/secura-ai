const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run("UPDATE Users SET phone = '+917736860329' WHERE id = 2 AND role = 'DOCTOR'", function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Row(s) updated: ${this.changes}`);
    }
  });
});

db.close();
