const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run("ALTER TABLE Users ADD COLUMN phone VARCHAR(255);", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error(err);
    } else {
      console.log("Users phone column added successfully.");
    }
  });
});

db.close();
